import {Injectable, OnModuleDestroy, OnModuleInit} from '@nestjs/common';
import {LoggerService} from '../logger/logger.service';
import {PrismaClient} from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private logger: LoggerService) {
    super();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.debug('App is disconnected from database');
  }
  async onModuleInit() {
    await this.$connect();
    this.logger.debug('App is connected to database');
  }
  async deleteDb() {
    await this.user.deleteMany();
    this.logger.debug('All users deleted');
  }
}
