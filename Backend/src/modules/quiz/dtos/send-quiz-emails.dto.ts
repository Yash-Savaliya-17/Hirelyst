import { IsArray, IsEmail } from 'class-validator';

export class SendQuizEmailsDto {
    @IsArray()
    @IsEmail({}, { each: true })
    emails: string[];
}
