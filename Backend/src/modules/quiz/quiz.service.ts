import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { QuizRepository } from "../../shared/repositories/quiz.repository";
import { CreateQuizDto, QuizStatus } from "./dtos";
import { User } from "@prisma/client";
import { MailerService } from "../../shared/mailer/mailer.service";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../shared/prisma/prisma.service";
import axios, { AxiosInstance } from "axios";
import { LoggerService } from "../../shared/logger/logger.service";

// Define interfaces for quiz generation service response
interface QuizQuestionOption {
    [key: string]: string;
}

interface QuizQuestionData {
    question: string;
    options: QuizQuestionOption;
    correct_answer: string;
}

interface QuizGenerationResponse {
    status: string;
    message: string;
    question: QuizQuestionData;
}

@Injectable()
export class QuizService {
    constructor(
        private quizRepository: QuizRepository,
        private mailer: MailerService,
        private config: ConfigService,
        private prisma: PrismaService,
        private logger: LoggerService,
        @Inject('QUIZ_GEN_HTTP_SERVICE')
        private aiQuizGenerator: AxiosInstance
    ) {}

    getQuizById(id: number) {
        return this.quizRepository.findQuiz({sys_id: id});
    }

    async createQuiz(quizData: CreateQuizDto, user: User) {
        console.log('Redirecting traditional quiz creation to AI generation...');
        return await this.generateAiQuiz(quizData, user);
    }

    async registerQuizUser(quizId: number, user: User) {
        const quiz = await this.quizRepository.findQuiz({sys_id: quizId});
        if (!quiz) {
            throw new BadRequestException("Quiz not found");
        }
        const attendee = await this.quizRepository.findQuizAttendee({
            where: {
                quizId_email: {
                    quizId,
                    email: user.email
                }
            }
        });
        if (attendee && attendee.registered) {
            throw new BadRequestException("User already registered for quiz");
        }
        if (!attendee) {
            await this.prisma.quizAttendee.create({
                data: {
                    email: user.email,
                    quizId: quizId,
                    attended: false,
                    attendedAt: null,
                    score: 0,
                    registered: true
                }
            });
        }
        const quizWithQuestions = await this.quizRepository.getQuizQuestions(quizId);

        await this.quizRepository.createAttendeeQuizQuestions({
            email: user.email,
            quizId: quizId,
        }, quizWithQuestions.questions);
        return {message: `User ${user.sys_id} registered for quiz ${quizId}`};
    }

    async startQuiz(quizId: number, user: User) {
        const quiz = await this.quizRepository.findQuiz({sys_id: quizId});
        if (!quiz) {
            throw new BadRequestException("Quiz not found");
        }
        const attendee = await this.quizRepository.findQuizAttendee({
            where: {
                quizId_email: {
                    quizId,
                    email: user.email
                }
            }
        });
        if (!attendee) {
            throw new BadRequestException("User not registered for quiz");
        }
        if (new Date() < quiz.startsAt) {
            throw new BadRequestException("Quiz has not started yet");
        }
        if (new Date() > quiz.endsAt) {
            throw new BadRequestException("Quiz has ended");
        }

        await this.quizRepository.startQuizForAttendee({
            where: {
                quizId_email: {
                    quizId,
                    email: user.email
                }
            },
            data: {
                attended: true,
                attendedAt: new Date()
            }
        });
        return this.quizRepository.getQuizQuestions(quizId);
    }

    async submitResponse(quizId: number, quizQuestionId: number, status: QuizStatus, response: string, user: User) {
        const quiz = await this.quizRepository.findQuiz({sys_id: quizId});
        if (!quiz) {
            throw new BadRequestException("Quiz not found");
        }
        if (new Date() < quiz.startsAt) {
            throw new BadRequestException("Quiz has not started yet");
        }
        if (new Date() > quiz.endsAt) {
            throw new BadRequestException("Quiz has ended");
        }
        const attendee = await this.quizRepository.findQuizAttendee({
            where: {
                quizId_email: {
                    quizId,
                    email: user.email
                }
            }
        });
        if (!attendee) {
            throw new BadRequestException("User not registered for quiz");
        }
        if (!attendee.attended) {
            throw new BadRequestException("User has not started the quiz");
        }
        const quizQuestion = await this.quizRepository.findQuizQuestion({sys_id: quizQuestionId});
        if (!quizQuestion) {
            throw new BadRequestException("Quiz question not found");
        }
        if (quizQuestion.quizId !== quizId) {
            throw new BadRequestException("Question does not belong to quiz");
        }
        await this.quizRepository.submitResponse({
            quizId,
            questionId: quizQuestion.questionId,
            email: user.email,
            status,
            response,
            correctAnswer: quizQuestion.question.answer
        });
        return {message: "Response submitted"};
    }

    async getSubjects() {
        const subjects = await this.quizRepository.getSubjects();
        return {message: "Subjects fetched", subjects};
    }

    async sendQuiz(quizId: number, emails: string[], user: User) {
        const quiz = await this.quizRepository.findQuiz({sys_id: quizId});
        if (!quiz) {
            throw new BadRequestException("Quiz not found");
        }

        if (quiz.createdById !== user.sys_id) {
            throw new BadRequestException("User not authorized to send quiz");
        }

        const existingEmails = await this.prisma.quizAttendee.findMany({
            where: {
                quizId: Number(quizId),
                email: {
                    in: emails
                }
            },
            select: {email: true}
        });

        const existingEmailSet = new Set(existingEmails.map(e => e.email));
        const newEmails = emails.filter(email => !existingEmailSet.has(email));

        if (newEmails.length > 0) {
            await Promise.all(newEmails.map(async (email) => {
                try {
                    await this.prisma.$transaction(async (tx) => {
                        let userRecord = await tx.user.findUnique({
                            where: { email }
                        });

                        if (!userRecord) {
                            userRecord = await tx.user.create({
                                data: {
                                    email,
                                    name: email.split('@')[0],
                                    isVerified: false,
                                    isPasswordSet: false,
                                }
                            });
                        }

                        await tx.quizAttendee.create({
                            data: {
                                email,
                                quizId,
                                attended: false,
                                attendedAt: null,
                                score: 0,
                                registered: false
                            }
                        });
                    });
                } catch (error) {
                    console.error(`Failed to process email: ${email}`, error);
                }
            }));
        }

        const quizLink = `${this.config.get('FRONTEND_URL')}/quiz/${quizId}`;
        
        if (newEmails.length > 0) {
            await this.mailer.sendQuizInvites(newEmails, quiz.title, quiz.startsAt, quiz.endsAt, quiz.duration, quizLink);
        }

        return {
            message: `Quiz invites processed. ${newEmails.length > 0 ? `Sent to ${newEmails.length} new emails` : 'All emails were already registered'}`
        };
    }

    getQuizQuestions(id: number) {
        return this.quizRepository.getQuizQuestions(id);
    }

    async isRegistered(quizId: number, user: User) {
        const registeredUser = await this.quizRepository.isRegistered(quizId, user.email);
        if (!registeredUser) {
            return {
                isRegistered: false
            };
        }
        return {
            isRegistered: registeredUser.registered
        };
    }

    async getQuizReport(quizId: number, user: User) {
        const quiz = await this.prisma.quiz.findUnique({
            where: {sys_id: quizId},
            include: {
                questions: {
                    include: {
                        question: true
                    }
                }
            },
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        const quizAttendee = await this.prisma.quizAttendee.findUnique({
            where: {
                quizId_email: {
                    quizId: quizId,
                    email: user.email
                }
            }
        });

        const totalParticipants = await this.prisma.quizAttendee.count({
            where: {quizId: quizId}
        });

        const userQuestionScores = await this.prisma.quizUserScore.findMany({
            where: {
                quizId: quizId,
                email: user.email
            },
            include: {
                question: {
                    include: {
                        options: true
                    }
                },
                quizQuestion: true
            }
        });

        return {
            duration: quiz.duration,
            totalQuestions: quiz.questions.length,
            totalParticipants,
            totalMarks: quiz.questions.length * 10,
            userScore: quizAttendee?.score || 0,
            userRank: await this.calculateUserRank(quizId, user.email),
            questions: userQuestionScores.map(score => ({
                id: score.questionId,
                options: score.question.options.map(q => q.option),
                question: score.question.question,
                correctAnswer: score.question.answer,
                userAnswer: score.response,
                isCorrect: score.score > 0
            }))
        };
    }

    async getQuizLeaderboard(quizId: number, user: User) {
        const quiz = await this.prisma.quiz.findUnique({
            where: {sys_id: quizId},
            include: {
                _count: {
                    select: {
                        questions: true,
                    },
                },
            },
        });
        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }
        const quizAttendees = await this.prisma.quizAttendee.findMany({
            where: {
                quizId: quizId,
                attended: true
            },
            orderBy: [
                {
                    score: 'desc'
                },
                {
                    updatedAt: 'asc'
                }
            ],
            include: {
                user: true,
            }
        });

        return {
            quizAttendees: quizAttendees.map(attendee => ({
                sys_id: attendee.email,
                completedAt: attendee.updatedAt,
                user: {
                    sys_id: attendee.user?.sys_id || -1,
                    name: attendee.user?.name,
                    email: attendee.user?.email || attendee.email,
                },
                score: attendee.score,
                attendedAt: attendee.attendedAt,
            })),
            quiz: {
                questions: quiz._count.questions,
                sys_id: quiz.sys_id,
                title: quiz.title,
                duration: quiz.duration,
                startsAt: quiz.startsAt,
                endsAt: quiz.endsAt,
            }
        };
    }

    async getQuizAttendees(quizId: number) {
        const attendees = await this.prisma.quizAttendee.findMany({
            where: {
                quizId
            },
            include: {
                user: true
            },
            orderBy: [
                {
                    attended: 'desc'
                },
                {
                    score: 'desc'
                },
                {
                    updatedAt: 'asc'
                },
                {
                    registered: 'desc'
                }
            ]
        });
        return attendees.map(attendee => {
            const { password, ...userWithoutPassword } = attendee.user || {};
            return {
                ...attendee,
                user: userWithoutPassword
            };
        });
    }

    async generateAiQuiz(quizData: CreateQuizDto, user: User) {
        this.logger.log('🚀 AI QUIZ GENERATION STARTED');
        this.logger.log('📝 Quiz title:', quizData.title);
        this.logger.log('📊 Subjects/Topics:', JSON.stringify(quizData.subjects, null, 2));
        this.logger.log('🔗 Quiz Gen Server:', this.config.get('QUIZ_GEN_SERVER'));
        
        try {
            const quizPromises = quizData.subjects.flatMap((subject) =>
                subject.topics.map((topic) =>
                    this.generateQuestionsForTopic(subject, topic, user)
                )
            );

            const results = await Promise.allSettled(quizPromises);

            const successfulQuestions = results
                .filter((result): result is PromiseFulfilledResult<any[]> =>
                    result.status === 'fulfilled' && Array.isArray(result.value))
                .flatMap(result => result.value);

            this.logger.log(`✅ Generated ${successfulQuestions.length} questions total`);
            if (successfulQuestions.length === 0) {
                this.logger.error('❌ AI QUIZ GENERATION FAILED: NO QUESTIONS');
                return {
                    success: false,
                    message: "No questions were generated for the quiz"
                };
            }

            const duration = Math.abs(
                quizData.endsAt.getTime() - quizData.startsAt.getTime()
            );

            const quiz = await this.prisma.quiz.create({
                data: {
                    title: quizData.title,
                    startsAt: quizData.startsAt,
                    createdById: user.sys_id,
                    endsAt: quizData.endsAt,
                    duration,
                    questions: {
                        create: successfulQuestions.map(question => ({
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
            
            this.logger.log('🎉 AI QUIZ GENERATION COMPLETED');
            this.logger.log('🆔 Quiz ID:', quiz.sys_id);
            this.logger.log('📝 Questions count:', quiz.questions.length);
            
            return {
                success: true,
                message: `Quiz created successfully with ID ${quiz.sys_id}`,
                quiz
            };

        } catch (error) {
            this.logger.error('💥 AI QUIZ GENERATION ERROR:', error);
            throw new Error(`Failed to generate quiz: ${error.message}`);
        }
    }

    async getAiDomains() {
        const response = await axios.get(`${this.config.get('QUIZ_GEN_SERVER')}/api/domains`, {
            headers: {"Content-Type": "application/json"},
        });
        return response.data;
    }

    async regenerateQuizQuestion(quizQuestionId: number, user: User) {
        try {
            const quizQuestion = await this.prisma.quizQuestion.findUnique({
                where: {sys_id: quizQuestionId},
                include: {question: {include: {subject: true, topic: true}}}
            });
            if (!quizQuestion) {
                throw new NotFoundException("Quiz question not found");
            }
            
            const requestData = {
                subject: quizQuestion.question.subject.name,
                topic: quizQuestion.question.topic.name,
                subtopic: null,
                difficulty: "medium",
                count: 1,
                use_retrieval: true  // Use RAG (vector stores already loaded, fast)
            };
            
            this.logger.debug(`Regenerating quiz question: quizQuestionId=${quizQuestionId}, user=${user.email}`);
            this.logger.debug(`Request payload: ${JSON.stringify(requestData)}`);
            
            // Use orchestrator with stored context or RAG
            const orchestratorUrl = this.config.get("ORCHESTRATOR_SERVICE_URL") || "http://localhost:3003";
            const quizGenResp = await axios.post(`${orchestratorUrl}/generate-quiz`, requestData, {
                headers: {"Content-Type": "application/json"},
                timeout: 30000
            });

            if (!quizGenResp?.data?.questions?.length) {
                throw new Error("No quiz data received for regeneration");
            }

            const q = quizGenResp.data.questions[0];
            if (!q || !q.question) {
                throw new Error("Invalid question data received");
            }

            // Map orchestrator response to database format
            const correctAnswerIndex = q.correct_option_index || 0;
            const correctAnswer = q.options?.[correctAnswerIndex] || q.options?.[0];

            const newQuestion = await this.prisma.quizQuestion.create({
                data: {
                    quiz: {
                        connect: {
                            sys_id: quizQuestion.quizId
                        }
                    },
                    question: {
                        create: {
                            question: q.question,
                            answer: correctAnswer,
                            difficulty: q.difficulty?.toUpperCase() || "MEDIUM",
                            subjectId: quizQuestion.question.subject.sys_id,
                            topicId: quizQuestion.question.topic.sys_id,
                            createdById: user.sys_id,
                            options: {
                                create: q.options?.map((opt, idx) => ({
                                    option: opt,
                                    isCorrect: idx === correctAnswerIndex,
                                })) || [],
                            },
                        },
                    },
                },
                include: {
                    question: {
                        include: {
                            options: true
                        }
                    }
                }
            });

            await this.prisma.quizQuestion.delete({where: {sys_id: quizQuestionId}});
            return newQuestion;
        } catch (error) {
            if (error.response) {
                this.logger.error(
                  `Error regenerating quiz question: ${error.response.status} - ${JSON.stringify(error.response.data)}`
                );
                this.logger.error(`Request URL: ${error.config?.url}`);
                this.logger.error(`Request data: ${JSON.stringify(error.config?.data)}`);
            } else {
                this.logger.error(`Error regenerating quiz question: ${error.message}`);
            }
            throw new Error(`Failed to regenerate quiz question: ${error.message}`);
        }
    }

    private async generateQuestionsForTopic(subject: any, topic: any, user: User) {
        this.logger.log(`🔄 Generating questions for: ${subject.name} / ${topic.name} (count: ${topic.count})`);
        
        // Try RAG first
        try {
            return await this.generateQuestionsWithRAG(subject, topic, user);
        } catch (ragError) {
            this.logger.warn(`⚠️ RAG generation failed, falling back to traditional method: ${ragError.message}`);
            // Fallback to traditional generation
            return await this.generateQuestionsTraditional(subject, topic, user);
        }
    }

    private async generateQuestionsWithRAG(subject: any, topic: any, user: User) {
        this.logger.log(`🤖 Using Dual RAG for: ${subject.name} / ${topic.name}`);
        
        // Try Orchestrator first (Dual RAG - MCQ + Theory)
        const orchestratorUrl = this.config.get("ORCHESTRATOR_SERVICE_URL") || "http://localhost:8003";
        const requestData = {
            subject: subject.name,
            topic: topic.name,
            subtopic: topic.subtopic || null,
            difficulty: "medium",
            count: topic.count
        };
        
        this.logger.log(`📡 Orchestrator API Request to: ${orchestratorUrl}/generate-quiz`);
        this.logger.log(`📋 Request data:`, requestData);
        
        try {
            const orchestratorResp = await axios.post(`${orchestratorUrl}/generate-quiz`, requestData, {
                headers: {"Content-Type": "application/json"},
                timeout: 45000 // 45 second timeout (longer for dual RAG)
            });

        this.logger.log(`📥 Orchestrator Response status: ${orchestratorResp.status}`);
        this.logger.log(`📄 Orchestrator Response:`, JSON.stringify(orchestratorResp.data, null, 2));

        if (orchestratorResp?.data?.success && orchestratorResp?.data?.questions?.length) {
                // Transform orchestrator response to match expected format
                const transformedQuestions = orchestratorResp.data.questions.map(q => ({
                    question: q.question,
                    correct_answer: String.fromCharCode(65 + q.correct_option_index), // 0->A, 1->B, etc.
                    options: q.options.reduce((acc, opt, idx) => {
                        acc[String.fromCharCode(65 + idx)] = opt;
                        return acc;
                    }, {})
                }));

                return await this.saveQuestionsToDatabase(transformedQuestions, subject, topic, user);
            }
        } catch (orchestratorError) {
            this.logger.warn(`⚠️ Orchestrator failed, falling back to single MCQ RAG: ${orchestratorError.message}`);
        }
        
        // Fallback: Try single MCQ RAG
        const ragApiUrl = this.config.get("RAG_QUIZ_SERVICE_URL") || "http://localhost:8001";
        const ragRequestData = {
            subject: subject.name,
            topic: topic.name,
            difficulty: "medium",
            count: topic.count,
            use_compression: false
        };
        
        this.logger.log(`📡 MCQ RAG API Request to: ${ragApiUrl}/generate-quiz`);
        this.logger.log(`📋 MCQ RAG Request data:`, ragRequestData);
        
        const ragResp = await axios.post(`${ragApiUrl}/generate-quiz`, ragRequestData, {
            headers: {"Content-Type": "application/json"},
            timeout: 30000 // 30 second timeout
        });

        this.logger.log(`📥 MCQ RAG Response status: ${ragResp.status}`);
        this.logger.log(`📄 MCQ RAG Response:`, JSON.stringify(ragResp.data, null, 2));

        if (!ragResp?.data?.success || !ragResp?.data?.questions?.length) {
            throw new Error(`No questions generated by MCQ RAG for: ${subject.name} / ${topic.name}`);
        }

        // Transform RAG response to match expected format
        const transformedQuestions = ragResp.data.questions.map(q => ({
            question: q.question,
            correct_answer: String.fromCharCode(65 + q.correct_option_index), // 0->A, 1->B, etc.
            options: q.options.reduce((acc, opt, idx) => {
                acc[String.fromCharCode(65 + idx)] = opt;
                return acc;
            }, {})
        }));

        return await this.saveQuestionsToDatabase(transformedQuestions, subject, topic, user);
    }

    private async generateQuestionsTraditional(subject: any, topic: any, user: User) {
        this.logger.log(`🔧 Using orchestrator in no-retrieval mode for: ${subject.name} / ${topic.name}`);

        const orchestratorUrl = this.config.get("ORCHESTRATOR_SERVICE_URL") || "http://localhost:8003";
        const requestData = {
            subject: subject.name,
            topic: topic.name,
            subtopic: null,
            difficulty: "medium",
            count: topic.count,
            use_retrieval: false
        };

        this.logger.log(`📡 Orchestrator (no-retrieval) Request to: ${orchestratorUrl}/generate-quiz`);
        this.logger.log(`📋 Request data:`, requestData);

        try {
            const resp = await axios.post(`${orchestratorUrl}/generate-quiz`, requestData, {
                headers: {"Content-Type": "application/json"},
                timeout: 30000
            });

            this.logger.log(`📥 Orchestrator (no-retrieval) Response status: ${resp.status}`);
            this.logger.log(`📄 Response data:`, JSON.stringify(resp.data, null, 2));

            if (!resp?.data?.success || !resp?.data?.questions?.length) {
                this.logger.warn(`⚠️ No questions generated in no-retrieval mode for: ${subject.name} / ${topic.name}`);
                return [];
            }

            const transformedQuestions = resp.data.questions.map(q => ({
                question: q.question,
                correct_answer: String.fromCharCode(65 + q.correct_option_index),
                options: q.options.reduce((acc: any, opt: string, idx: number) => {
                    acc[String.fromCharCode(65 + idx)] = opt;
                    return acc;
                }, {})
            }));

            return await this.saveQuestionsToDatabase(transformedQuestions, subject, topic, user);
        } catch (error) {
            this.logger.error(`Error in orchestrator no-retrieval mode for ${subject.name}: ${error.message}`);
            return [];
        }
    }

    private async saveQuestionsToDatabase(questions: any[], subject: any, topic: any, user: User) {
        const savedQuestions = await this.prisma.$transaction(async (prisma) => {
            const findOrCreateSubject = await prisma.questionSubject.upsert({
                where: {name: subject.name},
                create: {name: subject.name},
                update: {}
            });

            const findOrCreateTopic = await prisma.questionTopic.upsert({
                where: {
                    name_subjectId: {
                        name: topic.name,
                        subjectId: findOrCreateSubject.sys_id
                    }
                },
                create: {
                    name: topic.name,
                    subjectId: findOrCreateSubject.sys_id
                },
                update: {}
            });

            const questionPromises = questions
                .filter(q => this.isValidQuestionData(q))
                .map(q => this.createQuestion(prisma, q, findOrCreateSubject, findOrCreateTopic, user));

            return await Promise.all(questionPromises);
        });

        // Save to vector store in background (non-blocking)
        this.addQuestionsToVectorStore(questions, subject, topic).catch(err => {
            this.logger.warn(`⚠️ Background vector store save failed: ${err.message}`);
        });

        return savedQuestions;
    }

    private async addQuestionsToVectorStore(questions: any[], subject: any, topic: any) {
        try {
            const ragApiUrl = this.config.get("RAG_QUIZ_SERVICE_URL") || "http://localhost:8001";
            
            // Format questions for vector store
            const formattedQuestions = questions
                .filter(q => this.isValidQuestionData(q))
                .map(q => ({
                    question: q.question,
                    options: q.options,
                    correct_answer: q.correct_answer,
                    subject: subject.name,
                    topic: topic.name,
                    difficulty: q.difficulty || "medium"
                }));

            if (formattedQuestions.length === 0) {
                return;
            }

            this.logger.log(`📤 Adding ${formattedQuestions.length} questions to vector store...`);
            
            const response = await axios.post(
                `${ragApiUrl}/add-questions`,
                {
                    questions: formattedQuestions,
                    subject: subject.name,
                    topic: topic.name
                },
                {
                    headers: {"Content-Type": "application/json"},
                    timeout: 120000 // 120 seconds - first quiz builds vector stores (subsequent: <5s)
                }
            );

            if (response.data?.success) {
                this.logger.log(`✅ Added ${response.data.added_count || formattedQuestions.length} questions to vector store`);
            }
        } catch (error) {
            // Don't fail the whole operation if vector store update fails
            this.logger.warn(`⚠️ Failed to add questions to vector store: ${error.message}`);
        }
    }

    private async createQuestion(prisma: any, q: any, subject: any, topic: any, user: User) {
        return await prisma.question.create({
            data: {
                question: q.question,
                answer: q.correct_answer,
                difficulty: "EASY",
                subjectId: subject.sys_id,
                topicId: topic.sys_id,
                createdById: user.sys_id,
                options: {
                    create: Object.entries(q.options).map(([key, value]) => ({
                        option: value.toString(),
                        isCorrect: q.correct_answer === key
                    }))
                }
            },
            include: {options: true}
        });
    }

    private isValidQuestionData(question: any): boolean {
        return (
            question?.question &&
            question?.correct_answer &&
            question?.options &&
            typeof question.options === 'object' &&
            Object.keys(question.options).length > 0
        );
    }

    private async calculateUserRank(quizId: number, email: string): Promise<number> {
        const quizAttendees = await this.prisma.quizAttendee.findMany({
            where: {quizId},
            orderBy: {score: 'desc'}
        });

        return quizAttendees.findIndex(attendee => attendee.email === email) + 1;
    }
}
