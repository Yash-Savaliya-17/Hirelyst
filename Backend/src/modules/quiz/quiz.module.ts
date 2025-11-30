import {Module} from '@nestjs/common';
import {QuizService} from './quiz.service';
import {QuizController} from './quiz.controller';
import {MyLogger} from "../../shared/logger/logger.module";
import {QuizRepository} from "../../shared/repositories/quiz.repository";
import {AxiosModule} from "../../shared/axios/axios.module";
import {ConfigService} from "@nestjs/config";

@Module({
    imports: [
        MyLogger.register("QuizModule"),
        AxiosModule.registerAsync({
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                baseURL: configService.get('QUIZ_GEN_SERVER'),
            }),
        })
    ],
    providers: [QuizService, QuizRepository],
    controllers: [QuizController]
})
export class QuizModule {
}
