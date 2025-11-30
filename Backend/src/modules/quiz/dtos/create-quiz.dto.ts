import {ArrayNotEmpty, IsArray, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, MinDate, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';

export class CreateQuizDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => SubjectDto)
    subjects: SubjectDto[];

    @IsNotEmpty()
    @IsDate()
    @Type(() => Date)
    startsAt: Date;

    @IsNotEmpty()
    @IsDate()
    @MinDate(new Date()) // startsAt must be a future date
    @Type(() => Date)
    endsAt: Date;
}

class SubjectDto {
    @IsNotEmpty()
    @IsNumber()
    subjectId: number;

    @IsString()
    @IsOptional()
    name: string;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => TopicQuestionDto)
    topics: TopicQuestionDto[];
}

class TopicQuestionDto {
    @IsNotEmpty()
    @IsNumber()
    topicId: number;

    @IsNotEmpty()
    @IsNumber()
    count: number;

    @IsOptional()
    @IsString()
    name: string;
}
