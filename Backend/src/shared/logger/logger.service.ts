import { ConsoleLogger } from '@nestjs/common';

export class LoggerService extends ConsoleLogger {
  constructor(moduleName: string) {
    super(moduleName);
  }
}
