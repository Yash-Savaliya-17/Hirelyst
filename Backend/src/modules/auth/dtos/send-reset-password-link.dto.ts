import {IsEmail, IsNotEmpty} from "class-validator";

export class SendResetPasswordLinkDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;
}