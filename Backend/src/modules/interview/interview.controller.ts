import {Body, Controller, Get, HttpException, HttpStatus, Param, Post, Req, Res, UseGuards} from '@nestjs/common';
import {Request, Response} from 'express';
import {InterviewService} from "./interview.service";
import Prisma, {User} from '@prisma/client';
import {JwtGuard} from "../../shared/guards";
import {StartInterviewDto} from "./dtos/start-interview.dto";

@Controller('interview')
export class InterviewController {
    constructor(private readonly interviewService: InterviewService) {
    }

    @Post('start')
    @UseGuards(JwtGuard)
    async createInterview(@Req() req: Request, @Body() data: StartInterviewDto) {
        try {
            return this.interviewService.start(req.user as User, data);
        } catch (error) {
            console.error('Error in createInterview:', error);
            throw new HttpException('Error creating interview', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('submit-response')
    async submitAnswer(
        @Body('interviewId') interviewId: number,
        @Body('questionId') questionId: number,
        @Body('s3Url') s3Url: string,
    ) {
        try {
            return this.interviewService.submitResponse(interviewId, questionId, s3Url);
        } catch (error) {
            console.error('Error in submitAnswer:', error);
            throw new HttpException('Error submitting response', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('start-analysis')
    @UseGuards(JwtGuard)
    async startAnalysis(@Body('interviewId') interviewId: number, @Res() res: Response, @Req() req: Request) {
        if (!interviewId) {
            return res.status(400).json({message: 'interviewId is required'});
        }
        const result = await this.interviewService.startAnalysis(interviewId, req.user as Prisma.User);
        return res.status(200).json(result);
    }

    @Get(':id/analysis')
    @UseGuards(JwtGuard)
    getAnalysis(@Param('id') id: number) {
        return this.interviewService.getAnalysis(id);
    }

    @Get('domains')
    getDomains() {
        return this.interviewService.getDomains();
    }

}
