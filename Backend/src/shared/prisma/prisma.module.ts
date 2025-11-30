import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MyLogger } from '../logger/logger.module';

@Global()
@Module({
  imports: [MyLogger.register('Prisma')],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
