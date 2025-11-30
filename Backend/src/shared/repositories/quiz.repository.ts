import {Injectable} from "@nestjs/common";
import {PrismaService} from "../prisma/prisma.service";
import {Prisma, Question, Quiz, QuizQuestion} from "@prisma/client";
import {CreateQuizDto, QuizStatus} from "../../modules/quiz/dtos";

@Injectable()
export class QuizRepository {
    constructor(private prisma: PrismaService) {
    }

    findQuiz(where: Prisma.QuizWhereUniqueInput) {
        return this.prisma.quiz.findUnique({
            where,
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        });
    }

    async createQuiz(data: Prisma.QuizCreateInput): Promise<Quiz> {
        return this.prisma.quiz.create({data});
    }

    async updateQuiz(params: {
        where: Prisma.QuizWhereUniqueInput;
        data: Prisma.QuizUpdateInput;
    }): Promise<Quiz> {
        const {where, data} = params;
        return this.prisma.quiz.update({where, data});
    }

    async deleteQuiz(where: Prisma.QuizWhereUniqueInput): Promise<Quiz> {
        return this.prisma.quiz.delete({where});
    }

    createAttendeeQuizQuestions(
        data: Prisma.QuizAttendeeUncheckedCreateInput, questions: QuizQuestion[]
    ) {
        return this.prisma.$transaction(async _prisma => {
            await _prisma.quizAttendee.update({
                where: {
                    quizId_email: {
                        quizId: data.quizId,
                        email: data.email
                    }
                },
                data: {
                    registered: true
                }
            });
            await _prisma.quizUserScore.createMany({
                data: questions.map(question => ({
                    quizId: data.quizId,
                    quizQuestionId: question.sys_id,
                    email: data.email,
                    questionId: question.questionId,
                    score: 0,
                    status: 'UNATTEMPTED'
                }))
            })
        })
    }

    async createQuizWithRandomQuestions(params: {
        quizData: CreateQuizDto,
        createdById: number,
        startsAt: Date,
        endsAt: Date
    }): Promise<Quiz> {
        const {
            createdById, startsAt, endsAt, quizData: {title, subjects}
        } = params;

        // 1. Fetch random questions based on subject and topic
        const randomQuestions = []
        for (const subject of subjects) {
            for (const topic of subject.topics) {
                randomQuestions.push(...await this.getRandomQuestions(subject.subjectId, topic.topicId, topic.count));
            }
        }

        // 2. Create the quiz
        return this.prisma.quiz.create({
            data: {
                title,
                createdById,
                startsAt,
                endsAt,
                duration: endsAt.getTime() - startsAt.getTime(),
                // rules,
                questions: {
                    create: randomQuestions.map(question => ({
                        question: {connect: {sys_id: question.sys_id}}
                    }))
                }
            },
            include: {
                questions: {
                    include: {
                        question: {
                            include: {
                                options: true
                            }
                        }
                    }
                }
            }
        });
    }

    startQuizForAttendee(params: { where: Prisma.QuizAttendeeWhereUniqueInput, data: Prisma.QuizAttendeeUpdateInput }) {
        return this.prisma.quizAttendee.update({
            where: params.where,
            data: params.data
        })
    }

    async findQuizAttendee(param: { where: Prisma.QuizAttendeeWhereUniqueInput }) {
        return this.prisma.quizAttendee.findUnique({
            where: param.where
        })
    }

    findQuizQuestion(where: Prisma.QuizQuestionWhereUniqueInput) {
        return this.prisma.quizQuestion.findUnique({
            where: where,
            include: {
                question: {
                    include: {
                        options: true
                    }
                }
            }
        });
    }

    findQuizQuestionByIndex(param: { quizId: number; index: number }) {
        return this.prisma.quizQuestion.findMany({
            where: {quizId: param.quizId},
            include: {question: true},
            orderBy: {questionId: 'asc'},
            take: 1,
            skip: param.index,
        });
    }

    submitResponse(param: {
        questionId: number,
        quizId: number;
        email: string,
        response: string,
        status: QuizStatus,
        correctAnswer: string
    }) {
        return this.prisma.$transaction(async _prisma => {
            const oldScore = await _prisma.quizUserScore.findUnique({
                where: {
                    quizId_email_questionId: {
                        quizId: param.quizId,
                        email: param.email,
                        questionId: param.questionId
                    }
                },
                select: {
                    score: true
                }
            })
            await _prisma.quizUserScore.update({
                where: {
                    quizId_email_questionId: {
                        quizId: param.quizId,
                        email: param.email,
                        questionId: param.questionId
                    }
                },
                data: {
                    status: param.status,
                    response: param.response,
                    score: param.response === param.correctAnswer ? 1 : 0
                }
            })
            if (oldScore.score === 0 && param.response === param.correctAnswer) {
                await _prisma.quizAttendee.update({
                    where: {
                        quizId_email: {
                            quizId: param.quizId,
                            email: param.email
                        }
                    },
                    data: {
                        score: {
                            increment: 1
                        }
                    }
                })
            } else if (oldScore.score === 1 && param.response !== param.correctAnswer) {
                await _prisma.quizAttendee.update({
                    where: {
                        quizId_email: {
                            quizId: param.quizId,
                            email: param.email
                        }
                    },
                    data: {
                        score: {
                            decrement: 1
                        }
                    }
                })
            }
        })
    }

    getSubjects() {
        return this.prisma.questionSubject.findMany({
            include: {
                questionTopic: true
            }
        });
    }

    getQuizQuestions(id: number) {
        return this.prisma.quiz.findUnique({
            where: {sys_id: id},
            include: {
                questions: {
                    include: {
                        question: {
                            include: {
                                options: true
                            }
                        }
                    }
                }
            }
        });
    }

    isRegistered(quizId: number, email: string) {
        return this.prisma.quizAttendee.findUnique({
            where: {
                quizId_email: {
                    quizId, email
                }
            }
        })
    }

    private async getRandomQuestions(
        subjectId: number,
        topicId: number,
        count: number
    ): Promise<Question[]> {
        const questions = await this.prisma.$queryRaw<Question[]>`
            SELECT *
            FROM "Question"
            WHERE "subjectId" = ${subjectId}
              AND "topicId" = ${topicId}
            ORDER BY random()
                LIMIT ${count};
        `;
        return questions.sort(() => Math.random() - 0.5);
    }
}
