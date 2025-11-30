import {DynamicModule, Module} from "@nestjs/common";
import {AxiosService} from "./axios.service";

interface AxiosModuleOptions {
    baseURL: string;
}

@Module({})
export class AxiosModule {
    static registerAsync(options: {
        useFactory: (...args: any[]) => Promise<AxiosModuleOptions> | AxiosModuleOptions;
        inject?: any[];
        imports?: any[];
    }): DynamicModule {
        return {
            module: AxiosModule,
            imports: options.imports || [],
            providers: [
                {
                    provide: 'AXIOS_OPTIONS',
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                AxiosService,
                {
                    provide: 'QUIZ_GEN_HTTP_SERVICE',
                    useExisting: AxiosService, // <-- This line makes AxiosService available as QUIZ_GEN_HTTP_SERVICE
                },
            ],
            exports: [AxiosService, 'QUIZ_GEN_HTTP_SERVICE'], // <-- Export both
        };
    }
}
