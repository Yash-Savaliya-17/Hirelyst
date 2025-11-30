import {Injectable} from '@nestjs/common';
import {InterviewQuestion, Prisma} from '@prisma/client';
import {PrismaService} from '../prisma/prisma.service';

type interviewQuestionTransactionPrisma = Pick<PrismaService, 'interviewQuestion'>;
type interviewTransactionPrisma = Pick<PrismaService, 'interview'>;

@Injectable()
export class InterviewRepository {
    constructor(private prisma: PrismaService) {
    }

    createQuestion(
        data: Prisma.InterviewQuestionCreateInput,
        _prisma: interviewQuestionTransactionPrisma = this.prisma,
    ): Promise<InterviewQuestion> {
        return _prisma.interviewQuestion.create({
            data,
        });
    }

    createInterview(
        data: Prisma.InterviewCreateInput,
        _prisma: interviewTransactionPrisma = this.prisma,
    ) {
        return _prisma.interview.create({
            data,
        });
    }

    getInterviewById(interviewId: number) {
        return this.prisma.interview.findUnique({
            where: {
                sys_id: interviewId,
            },
            include: {
                createdBy: true
            }
        });
    }

    getInterviewQuestionById(questionId: number) {
        return this.prisma.interviewQuestion.findUnique({
            where: {
                sys_id: questionId,
            },
        });
    }

    async getInterviewQuestionsById(interviewId: number) {
        return this.prisma.interviewQuestion.findMany({
            where: {
                interviewId
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    }
}
