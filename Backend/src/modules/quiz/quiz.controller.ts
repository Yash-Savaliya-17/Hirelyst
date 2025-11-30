import {Body, Controller, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards} from '@nestjs/common';
import {QuizService} from "./quiz.service";
import {CreateQuizDto, QuizResponseDto, SendQuizEmailsDto} from "./dtos";
import {User} from "@prisma/client";
import {Request} from "express";
import {JwtGuard} from "../../shared/guards";

@Controller('quiz')
export class QuizController {
    constructor(private quizService: QuizService) {
    }

    @Get("/ai-domains")
    getAiQuizDomains() {
        return this.quizService.getAiDomains();
    }

    // get all subjects
    @Get('/subjects')
    getSubjects() {
        return this.quizService.getSubjects();
    }

    // get quiz attendees
    @Get('/:id/attendees')
    getQuizAttendees(@Param('id', ParseIntPipe) quizId: number) {
        return this.quizService.getQuizAttendees(quizId);
    }

    // get quiz by quiz id
    @Get("/:id")
    getQuizById(@Param("id", ParseIntPipe) id: number) {
        return this.quizService.getQuizById(id);
    }

    // get questions of a quiz
    @Get("/:id/questions")
    getQuizQuestions(@Param("id", ParseIntPipe) id: number) {
        return this.quizService.getQuizQuestions(id);
    }

    // create a new quiz
    @UseGuards(JwtGuard)
    @Post()
    createQuiz(@Body() quizData: CreateQuizDto, @Req() req: Request) {
        return this.quizService.createQuiz(quizData, req.user as User);
    }

    // check if user is registered to a quiz
    @Get('isRegistered/:id')
    @UseGuards(JwtGuard)
    isRegistered(@Param('id', ParseIntPipe) quizId: number, @Req() req: Request) {
        return this.quizService.isRegistered(quizId, req.user as User);
    }

    // register to a quiz
    @UseGuards(JwtGuard)
    @Put('/register/:id')
    registerQuizUser(@Req() req: Request, @Param('id', ParseIntPipe) quizId: number) {
        return this.quizService.registerQuizUser(quizId, req.user as User);
    }

    // start a quiz
    @UseGuards(JwtGuard)
    @Put('/start/:id')
    startQuiz(@Param('id', ParseIntPipe) quizId: number, @Req() req: Request) {
        return this.quizService.startQuiz(quizId, req.user as User);
    }

    // submit an answer to a quiz
    @UseGuards(JwtGuard)
    @Put('/:quizId/submit-response/:quizQuestionId')
    submitAnswer(@Param('quizId', ParseIntPipe) quizId: number, @Param('quizQuestionId', ParseIntPipe) quizQuestionId: number, @Body() quizResponse: QuizResponseDto, @Req() req: Request) {
        return this.quizService.submitResponse(quizId, quizQuestionId, quizResponse.status, quizResponse.response, req.user as User);
    }

    // send quiz invites
    @UseGuards(JwtGuard)
    @Post('/:quizId/send-quiz-invites')
    sendQuiz(@Param('quizId', ParseIntPipe) quizId: number, @Body() data: SendQuizEmailsDto, @Req() req: Request) {
        return this.quizService.sendQuiz(quizId, data.emails, req.user as User);
    }

    // get quiz report
    @UseGuards(JwtGuard)
    @Get('/:quizId/report')
    getQuizReport(@Param('quizId', ParseIntPipe) quizId: number, @Req() req: Request) {
        return this.quizService.getQuizReport(quizId, req.user as User);
    }

    // get quiz leaderboard
    @UseGuards(JwtGuard)
    @Get('/:quizId/leaderboard')
    getQuizLeaderboard(@Param('quizId', ParseIntPipe) quizId: number, @Req() req: Request) {
        return this.quizService.getQuizLeaderboard(quizId, req.user as User);
    }

    // generate an AI quiz
    @UseGuards(JwtGuard)
    @Post('/generate-ai-quiz')
    generateAiQuiz(@Body() quizData: CreateQuizDto, @Req() req: Request) {
        return this.quizService.generateAiQuiz(quizData, req.user as User);
    }

    // regenerate a quiz question
    @UseGuards(JwtGuard)
    @Post('/regenerate-quiz-question/:quizQuestionId')
    regenerateQuizQuestion(@Param('quizQuestionId', ParseIntPipe) quizQuestionId: number, @Req() req: Request) {
        return this.quizService.regenerateQuizQuestion(quizQuestionId, req.user as User);
    }
}
