import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { normalizeLoginAccount, normalizeStringValue } from '../auth-normalization';

export class LoginDto {
  @Transform(({ value }) => normalizeStringValue(value, normalizeLoginAccount))
  @IsString()
  @Length(3, 128)
  account!: string;

  @IsString()
  @Length(6, 64)
  password!: string;
}
