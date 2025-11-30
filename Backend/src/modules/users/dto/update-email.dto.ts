import {IsEmail, IsNotEmpty, IsOptional, IsString} from 'class-validator';

export class UpdateEmailDto {
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email: string;
}
