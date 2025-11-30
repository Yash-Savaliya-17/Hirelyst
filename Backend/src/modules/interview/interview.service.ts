import {Injectable, NotFoundException} from '@nestjs/common';
import {InterviewRepository} from "../../shared/repositories/interview.repository";
import {PrismaService} from "../../shared/prisma/prisma.service";
import {User} from "@prisma/client";
import axios from "axios";
import {StartInterviewDto} from "./dtos/start-interview.dto";
import {LoggerService} from "../../shared/logger/logger.service";
import {InterviewAnalysisService} from "./interview-analysis.service";

@Injectable()
export class InterviewService {

    constructor(
        private readonly interviewRepository: InterviewRepository,
        private readonly prismaService: PrismaService,
        private readonly logger: LoggerService,
        private readonly interviewAnalysisService: InterviewAnalysisService
    ) {
    }

    async start(user: User, data: StartInterviewDto): Promise<any> {
        const interview = await this.interviewRepository.createInterview({
            createdBy: {connect: {sys_id: user.sys_id}},
            domain: data.domain,
            codomain: data.codomain,
        })
        const response = await axios.post(`${process.env.QUE_GEN_SERVER}/generate`, data);
        const questions = response.data;
        for (const question of questions) {
            const dbQue = await this.interviewRepository.createQuestion({
                question: question.question, interview: {connect: {sys_id: interview.sys_id}}, answer: question.answer
            });
            question.sys_id = dbQue.sys_id;
        }
        return {message: "Interview started successfully", interview, questions};
    }

    async submitResponse(interviewId: number, questionId: number, s3Url: string) {

        const interview = await this.interviewRepository.getInterviewById(interviewId);
        if (!interview) {
            throw new NotFoundException('Interview not found');
        }

        const interviewQuestion = await this.interviewRepository.getInterviewQuestionById(questionId);
        if (!interviewQuestion) {
            throw new NotFoundException('Question not found');
        }

        await this.prismaService.interviewQuestion.update({
            where: {sys_id: questionId},
            data: {
                s3Url
            }
        })

        return {message: "Response submitted successfully"};
    }

    async startAnalysis(interviewId: number, user: User) {
        const interviewQuestions = await this.interviewRepository.getInterviewQuestionsById(interviewId);
        for (let i = 0; i < interviewQuestions.length; i++) {
            const que = interviewQuestions[i];
            if (que.s3Url === "" || !que.s3Url || !que.question || !que.answer) continue;
            this.interviewAnalysisService.analyzeAnswer(que, user, i === interviewQuestions.length - 1).catch(e => this.logger.error(e));
        }
        return {message: "Analysis started successfully"};
    }

    getAnalysis(id: number) {
        return this.prismaService.interview.findMany({
            where: {
                sys_id: id,
            },
            include: {
                questions: {
                    include: {
                        interviewAnswerAnalysis: true
                    }
                }
            }
        });
    }

    async getDomains() {
        const response = await axios.get(`${process.env.QUE_GEN_SERVER}/domains`, {
            headers: {
                "Content-Type": "application/json",
            }
        });
        return response.data;
    }
}
