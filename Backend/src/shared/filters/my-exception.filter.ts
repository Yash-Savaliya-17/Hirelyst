import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnauthorizedException
} from '@nestjs/common';
import {HttpAdapterHost} from '@nestjs/core';
import {LoggerService} from "../logger/logger.service";
import {MyLogger} from "../logger/logger.module";

@Catch()
export class MyExceptionFilter implements ExceptionFilter {
  constructor(private httpAdapterHost: HttpAdapterHost, private logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ignoreExceptions = [UnauthorizedException, BadRequestException];
    if(!ignoreExceptions.includes(exception.constructor)) {
      this.logger.error(exception.stack);
    }

    const ctx = host.switchToHttp();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errors = ['Something went wrong'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      let resErrors = (exception.getResponse() as any).message;

      // if not array, then make it array
      if (!Array.isArray(resErrors)) {
        resErrors = [resErrors || message];
      }
      errors = resErrors;
    }
    const { httpAdapter } = this.httpAdapterHost;

    const body = {
      status: status,
      timestamp: new Date().toISOString(),
      message,
      errors,
      path: ctx.getRequest().url,
    };

    httpAdapter.reply(ctx.getResponse(), body, body.status);
  }
}
