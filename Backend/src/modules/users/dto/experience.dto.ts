import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    MinLength,
    MaxLength,
    IsDateString
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ExperienceDto {
    @IsNumber()
    @IsNotEmpty()
    sys_id: number;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    company: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    title: string;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsOptional()
    @IsDateString()
    endDate: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsString()
    @IsOptional()
    description: string;
}
