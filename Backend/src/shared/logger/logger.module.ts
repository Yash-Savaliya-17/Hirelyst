import {DynamicModule, Module} from '@nestjs/common';
import {LoggerService} from './logger.service';

@Module({})
export class MyLogger {
    static register(moduleName: string): DynamicModule {
        return {
            module: MyLogger,
            providers: [
                {
                    provide: LoggerService,
                    useFactory: () => new LoggerService(moduleName),
                },
            ],
            exports: [LoggerService],
        };
    }
}
