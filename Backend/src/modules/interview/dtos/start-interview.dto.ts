import {IsNotEmpty, IsNumber, IsString} from 'class-validator';

export class StartInterviewDto {
    @IsNotEmpty()
    @IsString()
    domain: string;

    @IsString()
    @IsNotEmpty()
    codomain: string;

    @IsString()
    @IsNotEmpty()
    level: string;

    @IsNumber()
    @IsNotEmpty()
    count: string;
}
