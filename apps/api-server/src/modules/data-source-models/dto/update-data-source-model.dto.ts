import { IsArray, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDataSourceModelDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  primaryField?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  listApi?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  detailApi?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  createApi?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  updateApi?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  deleteApi?: Record<string, unknown> | null;

  @IsOptional()
  @IsArray()
  fields?: Array<Record<string, unknown>>;
}
