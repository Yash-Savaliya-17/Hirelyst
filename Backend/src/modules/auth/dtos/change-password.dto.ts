import {IsNotEmpty, IsOptional, IsString} from "class-validator";

export class ChangePasswordDto {
    @IsOptional()
    @IsString()
    oldPassword: string;

    @IsNotEmpty()
    @IsString()
    newPassword: string;
}