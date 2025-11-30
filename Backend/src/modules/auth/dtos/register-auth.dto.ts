import {IsEmail, IsNotEmpty, IsString, MinLength} from 'class-validator';

export class RegisterAuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  password: string;

  @IsNotEmpty()
  @IsString()
  name: string;
  isPasswordSet: boolean;
}
