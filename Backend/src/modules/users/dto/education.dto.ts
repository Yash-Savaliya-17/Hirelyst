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

export class EducationDto {
    @IsNumber()
    @IsNotEmpty()
    sys_id: number;

    @IsNotEmpty()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    institution: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    degree: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    fieldOfStudy: string;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsOptional()
    endDate: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    @Transform(({ value }) => value?.trim())
    location: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    @Transform(({ value }) => value?.trim() || null)
    grade?: string | null;
}
