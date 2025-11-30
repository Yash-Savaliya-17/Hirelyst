import {Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import {UsersService} from './users.service';
import {UpdateUserDto} from './dto/update-user.dto';
import Prisma from '@prisma/client';
import {Request} from "express";
import {JwtGuard} from "../../shared/guards";
import {EducationDto} from "./dto/education.dto";
import {ExperienceDto} from "./dto/experience.dto";
import {ProjectDto} from "./dto/project.dto";
import {UpdateEmailDto} from "./dto/update-email.dto";
import {FileInterceptor} from "@nestjs/platform-express";

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {
    }

    // get user quizzes
    @Get('quizzes')
    @UseGuards(JwtGuard)
    getQuizzes(@Req() req: Request) {
        return this.usersService.getQuizzesWithRank(req.user as Prisma.User);
    }


    @Get('created-quizzes')
    @UseGuards(JwtGuard)
    getCreatedQuizzes(@Req() req: Request) {
        return this.usersService.getCreatedQuizzes(req.user as Prisma.User);
    }


    @Put('email')
    @UseGuards(JwtGuard)
    updateEmail(@Body() data: UpdateEmailDto, @Req() req: Request) {
        return this.usersService.updateEmail(data, req.user as Prisma.User);
    }

    @Put('personal-data')
    @UseGuards(JwtGuard)
    savePersonalData(@Body() data: UpdateUserDto, @Req() req: Request) {
        return this.usersService.updatePersonalData(data, req.user as Prisma.User, data);
    }

    @Delete('education/:id')
    @UseGuards(JwtGuard)
    deleteEducation(@Req() req: Request, @Param('id') id: number){
        return this.usersService.deleteEducation(req.user as Prisma.User, id);
    }

    @Get('education')
    @UseGuards(JwtGuard)
    getEducation(@Req() req: Request) {
        return this.usersService.getEducation(req.user as Prisma.User);
    }

    @Put('education')
    @UseGuards(JwtGuard)
    saveEducation(@Body() data: EducationDto, @Req() req: Request) {
        return this.usersService.saveEducation(data, req.user as Prisma.User);
    }

    @Delete('experience/:id')
    @UseGuards(JwtGuard)
    deleteExperience(@Req() req: Request, @Param('id') id: number){
        return this.usersService.deleteExperience(req.user as Prisma.User, id);
    }

    @Get('experience')
    @UseGuards(JwtGuard)
    getExperience(@Req() req: Request) {
        return this.usersService.getExperience(req.user as Prisma.User);
    }

    @Put('experience')
    @UseGuards(JwtGuard)
    saveExperience(@Body() data: ExperienceDto, @Req() req: Request) {
        return this.usersService.saveExperience(data, req.user as Prisma.User);
    }

    @Delete('projects/:id')
    @UseGuards(JwtGuard)
    deleteProject(@Req() req: Request, @Param('id') id: number){
        return this.usersService.deleteProject(req.user as Prisma.User, id);
    }

    @Get('projects')
    @UseGuards(JwtGuard)
    getProject(@Req() req: Request) {
        return this.usersService.getProject(req.user as Prisma.User);
    }

    @Put('projects')
    @UseGuards(JwtGuard)
    saveProject(@Body() data: ProjectDto, @Req() req: Request) {
        return this.usersService.saveProject(data, req.user as Prisma.User);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(+id, updateUserDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.usersService.remove(+id);
    }

    @Post('/parse-resume')
    @UseGuards(JwtGuard)
    @UseInterceptors(FileInterceptor('file'))
    async parseResume(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new Error('File is required');
        }

        return await this.usersService.parseResume(file);
    }

}
