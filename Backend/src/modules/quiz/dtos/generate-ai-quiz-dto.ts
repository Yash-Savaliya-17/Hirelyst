import {IsArray, IsDate, IsIn, IsInt, IsNotEmpty, IsString, MinDate, ValidateNested} from 'class-validator';
import {Type} from "class-transformer";

class DomainDto {
    @IsString()
    @IsNotEmpty()
    domain: string;

    @IsString()
    @IsNotEmpty()
    subdomain: string;

    @IsIn(['easy', 'medium', 'hard'])
    @IsNotEmpty()
    difficulty: string;

    @IsInt()
    num_questions: number;
}

export class GenerateAiQuizDto {
    @Type(() => DomainDto)
    @ValidateNested({ each: true })
    @IsArray()
    domains: DomainDto[];

    @IsNotEmpty()
    @IsString()
    title: string;

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