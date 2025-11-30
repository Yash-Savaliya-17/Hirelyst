import {Module} from '@nestjs/common';
import {AuthService} from './auth.service';
import {AuthController} from './auth.controller';
import {MyLogger} from '../../shared/logger/logger.module';
import {AuthRepository} from '../../shared/repositories/auth.repository';
import {UsersModule} from '../users/users.module';
import {JwtModule} from '@nestjs/jwt';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {JwtStrategy} from '../../shared/strategy';
import {PassportModule} from "@nestjs/passport";

@Module({
    controllers: [AuthController],
    imports: [
        MyLogger.register('AuthModule'),
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
            global: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {expiresIn: '1d'}
            }),
        }),
    ],
    providers: [AuthService, AuthRepository, JwtStrategy]
})
export class AuthModule {
}
