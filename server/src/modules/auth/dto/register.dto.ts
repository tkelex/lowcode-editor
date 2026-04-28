import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(3, 32)
  username!: string;

  @IsString()
  @Length(6, 64)
  password!: string;
}
