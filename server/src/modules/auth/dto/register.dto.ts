import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
import { normalizeEmail, normalizeStringValue, normalizeUsername } from '../auth-normalization';

export class RegisterDto {
  @Transform(({ value }) => normalizeStringValue(value, normalizeEmail))
  @IsEmail()
  email!: string;

  @Transform(({ value }) => normalizeStringValue(value, normalizeUsername))
  @IsString()
  @Length(3, 32)
  username!: string;

  @IsString()
  @Length(6, 64)
  password!: string;
}
