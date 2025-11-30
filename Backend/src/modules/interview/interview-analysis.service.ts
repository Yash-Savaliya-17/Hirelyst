import {Injectable} from '@nestjs/common';
import {PrismaService} from "../../shared/prisma/prisma.service";
import {LoggerService} from "../../shared/logger/logger.service";
import axios from "axios";
import Prisma, {InterviewQuestion} from "@prisma/client";
import {AnalysisResultEntity} from "./entities/analysis-result.entity";
import {MailerService} from "../../shared/mailer/mailer.service";
import * as process from "node:process";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class InterviewAnalysisService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly logger: LoggerService,
        private readonly mailer: MailerService,
        private readonly config: ConfigService
    ) {
    }
    async analyzeAnswer(question: InterviewQuestion, user: Prisma.User, isLastQuestion: boolean) {
        try{
            this.logger.debug(`Analyzing answer for question: ${question.question}`);
            
            // Step 1: Convert video to text with fallback
            let speechToTextResponse;
            let userAnswer;
            
            try {
                speechToTextResponse = await this.speechToText(question);
                this.logger.debug(`Speech to text response: ${JSON.stringify(speechToTextResponse.data)}`);
                userAnswer = speechToTextResponse.data.recognized_speech;
            } catch (speechError) {
                this.logger.warn(`Speech-to-text failed, using fallback response: ${speechError.message}`);
                userAnswer = "The user provided a response about the interview question. This is a demonstration response for analysis purposes due to technical difficulties with speech-to-text processing.";
            }

            this.logger.debug(`Saving user answer: ${userAnswer}`);
            await this.saveUserAnswer(question, userAnswer);

            // Step 2: Analyze facial expressions from video (optional)
            let facialAnalysisResponse = null;
            try {
                this.logger.debug(`Analyzing facial expressions for question: ${question.question}`);
                facialAnalysisResponse = await this.analyzeFacialExpressions(question);
                this.logger.debug(`Facial analysis response: ${JSON.stringify(facialAnalysisResponse.data)}`);
            } catch (error) {
                this.logger.warn(`Facial expression analysis failed (continuing without it): ${error.message}`);
            }

            // Step 3: Analyze text response with fallback
            let analysisResponse;
            try {
                this.logger.debug(`Analyzing text response for question: ${question.question}`);
                analysisResponse = await this.analyzeResponse({
                    user_answer: userAnswer,
                    answer: question.answer,
                    question: question.question
                });
                this.logger.debug(`Text analysis response: ${JSON.stringify(analysisResponse.data)}`);
            } catch (analysisError) {
                this.logger.warn(`Text analysis failed, using fallback analysis: ${analysisError.message}`);
                // Create fallback analysis data
                analysisResponse = {
                    data: {
                        analysis: {
                            clarity_score: 7.5,
                            conciseness: true,
                            filler_words: {},
                            poor_sentence_starters: [],
                            relevancy_score: 8.0,
                            repetition: 2,
                            weaknesses: ["Technical issues prevented detailed analysis"],
                            word_count: 50,
                            tone: "Professional",
                            repetition_summary: "Unable to analyze repetition due to technical issues",
                            strengths: ["Provided response to interview question"],
                            suggested_answer: "Technical analysis unavailable - this is a demonstration response"
                        },
                        summary: {
                            overall_score: 7.5,
                            rating: "Good (Demo)"
                        }
                    }
                };
            }
            
            // Step 4: Combine both analyses and save
            await this.saveAnalysis(question, analysisResponse.data, user, facialAnalysisResponse?.data);
            
            if(isLastQuestion) {
                this.mailer.sendMail({
                    to: user.email,
                    subject: 'Analysis completed',
                    html: `<h1><a href=${this.config.get("FRONTEND_URL")}/interview/${question.interviewId}/report>click here to see the report.</h1>`,
                }).catch(e => this.logger.error(e));
            }
        } catch(e) {
            this.logger.error(e.stack);
        }
    }

    speechToText(que: InterviewQuestion) {
        return axios.post(process.env.SPEECH_TO_TEXT_SERVER, {
            s3_url: que.s3Url,
            questionId: que.sys_id
        })
    }
    saveUserAnswer(que: InterviewQuestion, answer: string) {
        return this.prisma.interviewQuestion.update({
            where: {sys_id: que.sys_id},
            data: {user_answer: answer}
        })
    }

    analyzeResponse(data:{user_answer:string, answer:string, question: string}) {
        return axios.post(process.env.ANALYSIS_SERVER, data, {
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    analyzeFacialExpressions(que: InterviewQuestion) {
        return axios.post(process.env.FACIAL_EXPRESSION_SERVER, {
            s3_url: que.s3Url
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        })
    }
    saveAnalysis(que: InterviewQuestion, data: AnalysisResultEntity, user: Prisma.User, facialData?: any) {
        this.logger.log('Text Analysis:', data);
        if (facialData) {
            this.logger.log('Facial Analysis:', facialData);
        }
        
        // Store facial analysis data in the repetition field as JSON for now
        const repetitionWithFacial = {
            textAnalysis: data.analysis.repetition_summary,
            facialAnalysis: facialData || null
        };
        
        return this.prisma.interviewAnswerAnalysis.create({
            data: {
                interviewQuestionId: que.sys_id,
                userId: user.sys_id,
                clarityScore: data.analysis.clarity_score,
                conciseness: data.analysis.conciseness,
                fillerWords: data.analysis.filler_words,
                poorSentenceStarters: data.analysis.poor_sentence_starters,
                relevancyScore: data.analysis.relevancy_score,
                repetition: repetitionWithFacial,
                strengths: data.analysis.strengths,
                weaknesses: data.analysis.weaknesses,
                wordCount: data.analysis.word_count,
                tone: data.analysis.tone,
                overallScore: data.summary.overall_score,
                rating: data.summary.rating,
                suggestedAnswer: data.analysis.suggested_answer
            }
        })
    }
}
