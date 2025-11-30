import {BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, InternalServerErrorException, UnauthorizedException} from '@nestjs/common';
import {AuthRepository} from '../../shared/repositories/auth.repository';
import {LoginAuthDto, RegisterAuthDto} from './dtos';
import {UsersRepository} from '../../shared/repositories/users.repository';
import * as argon from 'argon2';
import {MailerService} from '../../shared/mailer/mailer.service';
import {JwtService} from '@nestjs/jwt';
import * as crypto from 'crypto';
import {PrismaService} from "../../shared/prisma/prisma.service";
import {User} from "@prisma/client";
import {GoogleUser} from "./interfaces";
import {LoggerService} from "../../shared/logger/logger.service";
import axios from "axios";
import {ConfigService} from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(
        private authRepo: AuthRepository,
        private usersRepo: UsersRepository,
        private mailer: MailerService,
        private jwt: JwtService,
        private prisma: PrismaService,
        private logger: LoggerService,
        private config: ConfigService
    ) {
    }

    async register(userData: RegisterAuthDto) {
        const existingUser = await this.usersRepo.findUser({
            email: userData.email,
        });
        if (existingUser) {
            throw new ForbiddenException('User already exists');
        }
        userData.isPasswordSet = true;
        userData.password = await argon.hash(userData.password);
        const newUser = await this.usersRepo.createUser(userData);

        // Skip email verification in development
        if (process.env.NODE_ENV === 'development') {
            return {message: "User created successfully"};
        }

        try {
            const token = crypto.randomBytes(20).toString("hex");
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
            const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;
            await this.mailer.sendVerificationLink(newUser.email, verificationLink);
            await this.authRepo.createVerificationToken(newUser.sys_id, token, expiresAt);

            return {message: "User created successfully"};
        } catch (error) {
            // Handle email sending failure
            this.logger.error('Failed to send verification email:', error);

            // Rollback user creation (you might want to delete the created user or handle it differently)
            await this.usersRepo.deleteUser({sys_id: newUser.sys_id});
            throw new InternalServerErrorException('Failed to send verification email');
        }
    }

    async login(userData: LoginAuthDto): Promise<{ access_token: string, user: User }> {
        if (!userData.id && !userData.email)
            throw new UnauthorizedException('Either provide email or id');
        const user = await this.usersRepo.findUser({
            sys_id: userData.id,
            email: userData.email,
        });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        if(!user.password) {
            throw new UnauthorizedException('Password not set, try resetting password');
        }
        const passwordsMatch = await argon.verify(user.password, userData.password);
        if (!passwordsMatch) {
            throw new ForbiddenException('Invalid credentials');
        }
        delete user.password;
        return {
            access_token: await this.signToken(user.sys_id, user.email),
            user
        };
    }

    async sendVerificationMail(user: User) {
        if (user.isVerified) {
            throw new BadRequestException('User already verified');
        }
        let tokenData = await this.prisma.verificationToken.findUnique({
            where: {
                userId: user.sys_id,
            },
        });
        if (tokenData && tokenData.expiresAt > new Date()) {
            const leftTime = new Date(Number(tokenData.expiresAt) - Date.now());
            throw new HttpException(`Verification mail already sent, you can resend it after ${leftTime.getMinutes() != 0 ? `${leftTime.getMinutes()}:${leftTime.getSeconds()} minutes` : `${leftTime.getSeconds()} seconds`}`, HttpStatus.TOO_MANY_REQUESTS);
        }
        await this.prisma.$transaction(async (_prisma: PrismaService) => {
            const token = crypto.randomBytes(20).toString("hex");
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            await this.authRepo.createOrUpdateVerificationToken(user.sys_id, token, expiresAt, _prisma);
            const link = `${process.env.FRONTEND_URL}/verify/${token}`;
            await this.mailer.sendVerificationLink(user.email, link);
        }, {timeout: 5000});
        return {message: "Verification mail sent successfully"};
    }

    async verifyEmail(token: string) {
        const tokenData = await this.authRepo.findVerificationToken(token);
        if (!tokenData) {
            throw new BadRequestException('Invalid token');
        }

        if (tokenData.expiresAt < new Date()) {
            throw new BadRequestException('Token expired');
        }


        const user = await this.usersRepo.findUser({sys_id: tokenData.userId});
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const where = {sys_id: tokenData.userId};
        const data = {isVerified: true};

        await this.prisma.$transaction(async (_prisma: PrismaService) => {
            await this.usersRepo.updateUser({
                where, data
            }, _prisma);

            await this.authRepo.deleteVerificationToken(token, _prisma);
        })

        return {message: "Email verified successfully"};

    }

    async sendResetPasswordLink(email: string) {
        const user = await this.usersRepo.findUser({
            email
        });
        if (!user) {
            throw new BadRequestException("No account found with given email")
        }

        const existingToken = await this.authRepo.findResetPasswordTokenByUserId(user.sys_id);
        if (existingToken && existingToken.expiresAt > new Date()) {
            const leftTime = new Date(Number(existingToken.expiresAt) - Date.now());
            throw new BadRequestException(`Reset password link already sent, you can resend it after ${leftTime.getMinutes() != 0 ? `${leftTime.getMinutes()}:${leftTime.getSeconds()} minutes` : `${leftTime.getSeconds()} seconds`}`);
        }

        await this.prisma.$transaction(async (_prisma: PrismaService) => {
            const token = crypto.randomBytes(20).toString("hex");
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
            await this.authRepo.createOrUpdateResetPasswordToken(user.sys_id, token, expiresAt, _prisma);

            const link = `${process.env.FRONTEND_URL}/reset-password/${token}`;
            await this.mailer.sendResetPasswordLink(user.email, link);
        })
        return {message: "Reset password link sent successfully"};
    }

    async verifyResetPasswordLink(token: string) {
        const resetToken = await this.authRepo.findResetPasswordToken(token);
        if (!resetToken) {
            throw new BadRequestException("Invalid token");
        }
        if (resetToken.expiresAt < new Date()) {
            throw new BadRequestException("Token expired");
        }

        const user = await this.usersRepo.findUser({sys_id: resetToken.userId});
        if (!user) {
            throw new BadRequestException("User not found");
        }
        return {message: "Link verified successfully"};
    }

    async resetPassword(token: string, password: string) {
        const resetPasswordToken = await this.authRepo.findResetPasswordToken(token);
        if (!resetPasswordToken) {
            throw new BadRequestException("Invalid token");
        }
        if (resetPasswordToken.expiresAt < new Date()) {
            throw new BadRequestException("Token expired");
        }

        const user = await this.usersRepo.findUser({sys_id: resetPasswordToken.userId});
        if (!user) {
            throw new BadRequestException("User not found");
        }

        password = await argon.hash(password);

        const where = {sys_id: user.sys_id};
        const data = {password, isPasswordSet: true};

        await this.prisma.$transaction(async (_prisma: PrismaService) => {
            await this.usersRepo.updateUser({where, data}, _prisma);
            await this.authRepo.deleteResetPasswordToken(token, _prisma);
        })
        return {message: "Password reset successfully"};
    }

    async changePassword(
        user: User, oldPassword: string, newPassword: string
    ) {
        if (user.isPasswordSet) {
            if (!oldPassword) {
                throw new BadRequestException("oldPassword is required");
            }
            const validPassword = await argon.verify(user.password, oldPassword);
            if (!validPassword) {
                throw new UnauthorizedException("Invalid password");
            }
        }
        const hashedPassword = await argon.hash(newPassword);
        await this.usersRepo.changePassword(user.sys_id, hashedPassword);
        return {message: "Password changed successfully"};
    }

    async signToken(
        userId: number,
        email: string,
    ): Promise<string> {
        const data = {
            userId,
            email,
        };
        return this.jwt.sign(data)
    }

    async authenticateGoogleLogin(code: string) {
        const {data: tokenResponse} = await axios.post(
            'https://oauth2.googleapis.com/token',
            {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${this.config.get('BACKEND_URL')}/api/auth/google-redirect`, // Must match the one used in frontend
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        // Fetch user info using the access token
        const {data: userData} = await axios.get<GoogleUser>(
            'https://www.googleapis.com/oauth2/v1/userinfo',
            {
                headers: {
                    Authorization: `Bearer ${tokenResponse.access_token}`,
                },
            }
        );

        // Your logic to handle user data (e.g., create or find user in database)
        return {
            access_token: tokenResponse.access_token,
            user: userData,
        };
    }

    async googleLogin(googleUser: GoogleUser): Promise<{ message: string, user: User, access_token: string }> {
        if (!googleUser) {
            throw new UnauthorizedException('Error in retrieving user from google');
        }

        let user = await this.usersRepo.findUser({email: googleUser.email});
        if (!user) {
            user = await this.usersRepo.createUser({
                email: googleUser.email,
                name: googleUser.name,
                isVerified: true,
                isPasswordSet: false
            });
        }
        const access_token = await this.signToken(user.sys_id, user.email);
        return {
            message: 'User information from google',
            user,
            access_token
        };
    }
}
