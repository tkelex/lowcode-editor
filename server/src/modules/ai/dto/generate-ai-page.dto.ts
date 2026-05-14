import { IsIn, IsObject, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import type { AiPageBuilderTarget, AiPageBuilderWriteMode } from '../../../../../packages/lowcode-schema/src';

const TARGETS: AiPageBuilderTarget[] = ['fullPage', 'section', 'crud'];
const WRITE_MODES: AiPageBuilderWriteMode[] = ['replacePage', 'insertSelection', 'createPage'];

export class GenerateAiPageDto {
  @IsString()
  @Length(4, 4000)
  prompt!: string;

  @IsOptional()
  @IsIn(TARGETS)
  target?: AiPageBuilderTarget;

  @IsOptional()
  @IsIn(WRITE_MODES)
  writeMode?: AiPageBuilderWriteMode;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  apiDescription?: string;

  @IsOptional()
  responseSample?: unknown;

  @IsOptional()
  dataSourceModel?: unknown;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
