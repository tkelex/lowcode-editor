import { IsArray, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDataSourceModelDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @MaxLength(64)
  key!: string;

  @IsString()
  @MaxLength(64)
  primaryField!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  listApi?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  detailApi?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  createApi?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  updateApi?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  deleteApi?: Record<string, unknown>;

  @IsArray()
  fields!: Array<Record<string, unknown>>;
}
