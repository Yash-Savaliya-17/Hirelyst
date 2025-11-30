import {Injectable} from '@nestjs/common';
import {LoggerService} from '../logger/logger.service';
import {PrismaService} from '../prisma/prisma.service';

@Injectable()
export class AuthRepository {
    constructor(
        private prisma: PrismaService,
        private logger: LoggerService,
    ) {
    }

    createVerificationToken(userId: number, token: string, expiresAt: Date, _prisma: PrismaService = this.prisma) {
        return this.prisma.verificationToken.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }

    createOrUpdateVerificationToken(userId: number, token: string, expiresAt: Date, _prisma: PrismaService = this.prisma) {
        return this.prisma.verificationToken.upsert({
            where: {
                userId,
            },
            update: {
                token,
                expiresAt,
            },
            create: {
                userId,
                token,
                expiresAt,
            },
        });
    }

    deleteVerificationToken(token: string, _prisma: PrismaService = this.prisma) {
        return this.prisma.verificationToken.delete({
            where: {
                token,
            },
        });
    }

    findVerificationToken(token: string) {
        return this.prisma.verificationToken.findUnique({
            where: {
                token,
            },
        });
    }

    createResetPasswordToken(userId: number, token: string, expiresAt: Date, _prisma: PrismaService = this.prisma) {
        return this.prisma.resetPasswordToken.create({
            data: {
                userId,
                token,
                expiresAt
            },
        });
    }

    findResetPasswordTokenByUserId(userId: number) {
        return this.prisma.resetPasswordToken.findUnique({
            where: {
                userId,
            },
        });
    }

    findResetPasswordToken(token: string) {
        return this.prisma.resetPasswordToken.findUnique({
            where: {
                token,
            },
        });
    }

    deleteResetPasswordToken(token: string, _prisma: PrismaService = this.prisma) {
        return this.prisma.resetPasswordToken.delete({
            where: {
                token,
            },
        });
    }

    createOrUpdateResetPasswordToken(userId: number, token: string, expiresAt: Date, _prisma: PrismaService) {
        return this.prisma.resetPasswordToken.upsert({
            where: {
                userId,
            },
            update: {
                token,
                expiresAt,
            },
            create: {
                userId,
                token,
                expiresAt,
            },
        });
    }
}
