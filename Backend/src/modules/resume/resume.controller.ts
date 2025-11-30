import {Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import {JwtGuard} from "../../shared/guards";
import {FileInterceptor} from "@nestjs/platform-express";
import {ResumeService} from "./resume.service";

@Controller('resume')
export class ResumeController {
    constructor(private readonly resumeService: ResumeService) {}
    @Post('/parse-resume')
    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor('resume'))
    async parseResume(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new Error('File is required');
        }

        return await this.resumeService.parseResume(file);
    }

    @Post('get-ats-score')
    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor('resume'))
    async getAtsScore(
        @UploadedFile() file: Express.Multer.File,
        @Body('job_description') jobDescription: string
    ) {
        if (!file) {
            throw new Error('File is required');
        }

        return await this.resumeService.getAtsScore(file, jobDescription);
    }

}
