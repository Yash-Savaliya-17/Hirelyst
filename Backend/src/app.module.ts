import {Module, ValidationPipe} from '@nestjs/common';
import {AuthModule} from './modules/auth/auth.module';
import {PrismaModule} from './shared/prisma/prisma.module';
import {APP_FILTER, APP_PIPE} from '@nestjs/core';
import {UsersModule} from './modules/users/users.module';
import {ConfigModule} from '@nestjs/config';
import databaseConfig from './config/database.config';
import {MailerModule} from './shared/mailer/mailer.module';
import mailerConfig from './config/mailer.config';
import {MyExceptionFilter} from './shared/filters';
import {QuizModule} from './modules/quiz/quiz.module';
import {InterviewModule} from './modules/interview/interview.module';
import {S3Module} from './modules/s3service/s3service.module';
import {MyLogger} from "./shared/logger/logger.module";
import {ResumeModule} from "./modules/resume/resume.module";

@Module({
  imports: [
    MyLogger.register('AppModule'),
    ConfigModule.forRoot({
      load: [databaseConfig, mailerConfig],
      isGlobal: true,
    }),
    AuthModule,
    PrismaModule,
    MailerModule,
    UsersModule,
    QuizModule,
    InterviewModule,
    S3Module,
    ResumeModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          transform: true,
        }),
    },
    {
      provide: APP_FILTER,
      useClass: MyExceptionFilter,
    }
  ],
})
export class AppModule {}
