import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import {ConfigService} from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Set the global prefix
    app.setGlobalPrefix('api');

    app.use(cookieParser());
    console.log(configService.get<string>('FRONTEND_URL'));
    app.use(
    cors({
      origin: ['http://localhost:5173', configService.get<string>('FRONTEND_URL')],
      credentials: true,
    })
  );

    const port = configService.get<number>('PORT') || 3000;

    await app.listen(port);
}

bootstrap();
