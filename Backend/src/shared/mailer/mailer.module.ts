import { Global, Module } from '@nestjs/common';
import { MyLogger } from '../logger/logger.module';
import { MailerService } from './mailer.service';

@Global()
@Module({
  imports: [MyLogger.register('MailerModule')],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
