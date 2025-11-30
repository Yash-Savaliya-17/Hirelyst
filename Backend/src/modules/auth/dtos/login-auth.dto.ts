import { IsEmail, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginAuthDto {
  @IsEmail()
  @IsString()
  @IsOptional()
  email?: string;

  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  @MinLength(3)
  password: string;
}
