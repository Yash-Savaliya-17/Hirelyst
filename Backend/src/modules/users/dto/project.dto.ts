import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    MinLength,
    MaxLength,
    IsDateString,
    IsArray,
    ArrayNotEmpty,
    ArrayMinSize,
    ValidateNested
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ProjectDto {
    @IsNumber()
    @IsNotEmpty()
    sys_id: number;

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
    @IsOptional()
    description: string;

    @IsArray()
    @ArrayNotEmpty()
    @ArrayMinSize(1)
    @IsString({ each: true })
    @Transform(({ value }) => value.map((tech: string) => tech.trim()))
    technologies: string[];
}
