import { ArrayMaxSize, IsArray, IsIn, IsInt, IsObject, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import type { AiAgentMessage, AiAgentTargetScope, LowcodeComponentSchema } from '@lowcode/schema';

const TARGET_SCOPES: AiAgentTargetScope[] = ['page', 'selection', 'component'];

export class CreateAiAgentRunDto {
  @IsString()
  @Length(4, 4000)
  prompt!: string;

  @IsOptional()
  @IsIn(TARGET_SCOPES)
  targetScope?: AiAgentTargetScope;

  @IsOptional()
  @IsInt()
  selectedComponentId?: number;

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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(80)
  currentComponents?: LowcodeComponentSchema[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  history?: AiAgentMessage[];
}
