import { IsObject, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  @Matches(/^\/[a-zA-Z0-9/_-]*$/)
  routePath?: string;

  @IsOptional()
  @IsObject()
  schema?: Record<string, unknown>;
}
