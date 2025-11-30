import {BadRequestException, Injectable} from "@nestjs/common";
import {UpdateUserDto} from "./dto/update-user.dto";
import {MailerService} from "../../shared/mailer/mailer.service";
import {ConfigService} from "@nestjs/config";
import {UsersRepository} from "../../shared/repositories/users.repository";
import Prisma, {User} from "@prisma/client";
import {PrismaService} from "../../shared/prisma/prisma.service";
import {EducationDto} from "./dto/education.dto";
import {ExperienceDto} from "./dto/experience.dto";
import {ProjectDto} from "./dto/project.dto";
import {UpdateEmailDto} from "./dto/update-email.dto";
import axios from "axios";
import * as FormData from "form-data"; // Ensure you have `form-data` installed

@Injectable()
export class UsersService {
    constructor(
        private usersRepository: UsersRepository,
        private mailer: MailerService,
        private config: ConfigService,
        private prismaService: PrismaService,
    ) {
    }

    findOne(id: number) {
        return `This action returns a #${id} user`;
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        return `This action updates a #${id} user`;
    }

    remove(id: number) {
        return `This action removes a #${id} user`;
    }

    async updatePersonalData(
        userData: UpdateUserDto,
        user: Prisma.User,
        data: any,
    ) {
        await this.usersRepository.updateUser({
            where: {
                sys_id: user.sys_id,
            },
            data: {
                name: userData.name ?? user.name,
                address: userData.address ?? user.address,
                phone: userData.phone ?? user.phone,
                city: userData.city ?? user.city,
                state: userData.state ?? user.state,
            },
        });
        return {
            success: true,
            message: "Profile data updated successfully.",
        };
    }

    async saveEducation(data: EducationDto, user: Prisma.User) {
        const existingEducation = await this.prismaService.userEducation.findUnique(
            {
                where: {
                    sys_id: data.sys_id,
                },
            },
        );

        const educationData: Prisma.Prisma.UserEducationUncheckedCreateInput = {
            sys_id: data.sys_id,
            location: data.location,
            userId: user.sys_id,
            institution: data.institution.trim(),
            degree: data.degree.trim(),
            fieldOfStudy: data.fieldOfStudy.trim(),
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            grade: data.grade?.trim() ?? null,
        };
        if (!existingEducation) delete educationData.sys_id;

        // Perform upsert operation
        const education = await this.prismaService.userEducation.upsert({
            where: {
                sys_id: data.sys_id,
            },
            create: {
                ...educationData,
                userId: user.sys_id,
            },
            update: {
                ...educationData,
            },
        });

        return {
            success: true,
            message: `Education record ${existingEducation ? "updated" : "created"} successfully`,
            data: education,
        };
    }

    getEducation(user: Prisma.User) {
        return this.prismaService.userEducation.findMany({
            where: {
                user: {
                    sys_id: user.sys_id,
                },
            },
            orderBy: {
                startDate: "desc",
            },
        });
    }

    async deleteEducation(user: Prisma.User, id: number) {
        const educationExists = await this.prismaService.userEducation.findUnique({
            where: {
                sys_id: id,
            },
        });
        if (!educationExists) {
            throw new BadRequestException(
                "No education record found with provided id",
            );
        }
        await this.prismaService.userEducation.delete({
            where: {
                sys_id: id,
            },
        });
        return {
            success: true,
            message: "Education record deleted successfully.",
        };
    }

    async deleteExperience(user: Prisma.User, id: number) {
        await this.prismaService.userExperience.delete({
            where: {
                sys_id: id,
            },
        });
        return {
            success: true,
            message: "Experience record deleted successfully.",
        };
    }

    getExperience(user: Prisma.User) {
        return this.prismaService.userExperience.findMany({
            where: {
                user: {
                    sys_id: user.sys_id,
                },
            },
            orderBy: {
                startDate: "desc",
            },
        });
    }

    async saveExperience(data: ExperienceDto, user: Prisma.User) {
        const existingExperience =
            await this.prismaService.userEducation.findUnique({
                where: {
                    sys_id: data.sys_id,
                },
            });

        const experienceData: Prisma.Prisma.UserExperienceUncheckedCreateInput = {
            sys_id: data.sys_id,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            company: data.company,
            location: data.location,
            description: data.description,
            title: data.title,
            userId: user.sys_id,
        };
        if (!existingExperience) delete experienceData.sys_id;

        // Perform upsert operation
        const experience = await this.prismaService.userExperience.upsert({
            where: {
                sys_id: data.sys_id,
            },
            create: {
                ...experienceData,
            },
            update: {
                ...experienceData,
            },
        });

        return {
            success: true,
            message: `Experience record ${existingExperience ? "updated" : "created"} successfully`,
            data: experience,
        };
    }

    async deleteProject(user: Prisma.User, id: number) {
        await this.prismaService.userProject.delete({
            where: {
                sys_id: id,
            },
        });
        return {
            success: true,
            message: "Project record deleted successfully.",
        };
    }

    async getProject(user: Prisma.User) {
        return this.prismaService.userProject.findMany({
            where: {
                user: {
                    sys_id: user.sys_id,
                },
            },
            orderBy: {
                startDate: "desc",
            },
        });
    }

    async saveProject(data: ProjectDto, user: Prisma.User) {
        const existingProject = await this.prismaService.userProject.findUnique({
            where: {
                sys_id: data.sys_id,
            },
        });

        const projectData: Prisma.Prisma.UserProjectUncheckedCreateInput = {
            sys_id: data.sys_id,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            title: data.title,
            description: data.description,
            userId: user.sys_id,
            technologies: data.technologies,
        };
        if (!existingProject) delete projectData.sys_id;

        // Perform upsert operation
        const project = await this.prismaService.userProject.upsert({
            where: {
                sys_id: data.sys_id,
            },
            create: {
                ...projectData,
            },
            update: {
                ...projectData,
            },
        });

        return {
            success: true,
            message: `Project record ${existingProject ? "updated" : "created"} successfully`,
            data: project,
        };
    }

    async getQuizzesWithRank(user: Prisma.User) {
        const userQuizzes = await this.prismaService.quizAttendee.findMany({
            where: {
                email: user.email,
            },
            include: {
                quiz: {
                    include: {
                        _count: {
                            select: {
                                attendees: true,
                                questions: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                quiz: {
                    endsAt: "desc",
                },
            },
        });

        const currentDate = new Date();

        for (const userQuiz of userQuizzes) {
            const {endsAt} = userQuiz.quiz;

            if (endsAt && new Date(endsAt) < currentDate) {
                const allParticipants = await this.prismaService.quizAttendee.findMany({
                    where: {
                        quizId: userQuiz.quizId,
                    },
                    orderBy: {
                        score: "desc",
                    },
                });

                (userQuiz as any).rank =
                    allParticipants.findIndex(
                        (participant) => participant.email === user.email,
                    ) + 1; // Add rank dynamically
            } else {
                (userQuiz as any).rank = null; // Do not include rank if the quiz hasn't ended
                (userQuiz as any).score = null; // Optionally clear sensitive data
            }
        }

        return userQuizzes as ((typeof userQuizzes)[0] & { rank: number | null })[];
    }

    async updateEmail(data: UpdateEmailDto, user: Prisma.User) {
        const exists = await this.usersRepository.findUser({
            email: data.email,
        });
        if (exists) {
            throw new BadRequestException("Email already in use");
        }
        await this.usersRepository.updateUser({
            where: {
                sys_id: user.sys_id,
            },
            data: {
                email: data.email,
                isVerified: false,
            },
        });
        return {
            success: true,
            message: "Email updated successfully",
        };
    }

    async parseResume(file: Express.Multer.File) {
        try {
            const form = new FormData();
            form.append("file", file.buffer, file.originalname); // Correct way to append file buffer
            const response = await axios.post(
                this.config.get("RESUME_PARSER_SERVER"),
                form,
                {
                    headers: {
                        ...form.getHeaders(), // Include the necessary multipart headers
                    },
                },
            );

            return response.data;
        } catch (error) {
            throw new Error(`Failed to parse resume: ${error.message}`);
        }
    }

    async getCreatedQuizzes(user: User) {
        const quizzes = await this.prismaService.quiz.findMany({
            where: {
                createdById: user.sys_id,
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                _count: {
                    select: {
                        attendees: true,
                        questions: true,
                    },
                },
            }
        })
        return quizzes;
    }
}
