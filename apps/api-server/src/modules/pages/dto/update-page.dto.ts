import { IsInt, IsObject, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class UpdatePageDto {
  @IsInt()
  @Min(1)
  expectedRevision!: number;

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
