import {Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, Res, UseGuards} from '@nestjs/common';
import {AuthService} from './auth.service';
import {LoginAuthDto, RegisterAuthDto, ResetPasswordDto, SendResetPasswordLinkDto} from './dtos';
import {JwtGuard} from '../../shared/guards';
import {Request, Response} from 'express';
import {ConfigService} from '@nestjs/config';
import {User} from "@prisma/client";
import {ChangePasswordDto} from "./dtos/change-password.dto";
import {GoogleUser} from "./interfaces";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private config: ConfigService) {
    }

    @Post('register')
    register(@Body() userData: RegisterAuthDto) {
        return this.authService.register(userData);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() userData: LoginAuthDto, @Req() req: Request, @Res() res: Response) {
        const data = await this.authService.login(userData);

        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('access_token', data.access_token, {
            maxAge: 24 * 60 * 60 * 1000, // 1-day cookie validity
            httpOnly: true,             // Makes the cookie accessible only to the server
            secure: isProduction,               // Ensures the cookie is sent over HTTPS only (recommended in production)
            path: '/',                  // Cookie is valid for all routes
            sameSite: 'strict'          // Protects against CSRF (adjust as per your use case)
        }).json({user: data.user, message: "Logged in successfully..."});
    }

    @UseGuards(JwtGuard)
    @Get('me')
    getMe(@Req() req: Request) {
        const user = req.user as User;
        delete user.password;
        return user;
    }

    @UseGuards(JwtGuard)
    @Post('logout')
    logout(@Req() req: Request, @Res() res: Response) {
        res.clearCookie('access_token').json({message: 'Logged out successfully'});
    }

    @UseGuards(JwtGuard)
    @Post('send-verification-mail')
    sendVerificationMail(@Req() req: Request) {
        return this.authService.sendVerificationMail(req.user as User);
    }

    @Post('verify-email/:token')
    verifyEmail(@Param('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('send-reset-password-link')
    sendResetPasswordLink(@Body() body: SendResetPasswordLinkDto) {
        return this.authService.sendResetPasswordLink(body.email);
    }

    @Post('verify-reset-password-link/:token')
    verifyResetPasswordLink(@Param('token') token: string) {
        return this.authService.verifyResetPasswordLink(token);
    }

    @Post('reset-password/:token')
    resetPassword(@Param('token') token: string, @Body() data: ResetPasswordDto) {
        return this.authService.resetPassword(token, data.password);
    }

    @UseGuards(JwtGuard)
    @Post('change-password')
    changePassword(@Body() data: ChangePasswordDto, @Req() req: Request) {
        return this.authService.changePassword(req.user as User, data.oldPassword, data.newPassword);
    }

    @Get('google-redirect')
    async googleRedirect(@Req() req: Request, @Res() res: Response) {
        try {
            const state = req.query.state
                ? JSON.parse(decodeURIComponent(req.query.state as string))
                : {};

            if(!req.query.code) {
                return res.redirect(`${this.config.get('FRONTEND_URL')}/error`);
            }
            const {user} = await this.authService.authenticateGoogleLogin(req.query.code as string);
            if(!user) {
                return res.redirect(`${this.config.get('FRONTEND_URL')}/error`);
            }
            const data = await this.authService.googleLogin(user as GoogleUser);

            const isProduction = process.env.NODE_ENV === 'production';

            res.cookie('access_token', data.access_token, {
                maxAge: 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: isProduction,
                path: '/',
                sameSite: 'strict',
            });

            res.redirect(`${this.config.get('FRONTEND_URL')}${state.from || '/'}`);
        } catch (error) {
            console.error('Google redirect error:', error);
            res.redirect(`${this.config.get('FRONTEND_URL')}/auth/error`);
        }
    }
}
