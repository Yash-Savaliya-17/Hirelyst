import {Module} from '@nestjs/common';
import {InterviewController} from './interview.controller';
import {InterviewService} from './interview.service';
import {MyLogger} from "../../shared/logger/logger.module";
import {InterviewRepository} from "../../shared/repositories/interview.repository";
import {InterviewAnalysisService} from "./interview-analysis.service";

@Module({
  imports: [
    MyLogger.register('InterviewModule'),
  ],
  controllers: [InterviewController],
  providers: [InterviewService, InterviewRepository, InterviewAnalysisService],
})
export class InterviewModule {}
