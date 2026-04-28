import { IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(3, 128)
  account!: string;

  @IsString()
  @Length(6, 64)
  password!: string;
}
