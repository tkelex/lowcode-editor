import { IsArray, IsIn, IsObject, IsOptional, IsString, Length } from 'class-validator';

export const TEMPLATE_TYPES = ['page', 'block'] as const;
export const TEMPLATE_VISIBILITIES = ['project', 'private'] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number];
export type TemplateVisibility = (typeof TEMPLATE_VISIBILITIES)[number];

export class CreateTemplateDto {
  @IsIn(TEMPLATE_TYPES)
  type!: TemplateType;

  @IsString()
  @Length(1, 80)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsObject()
  schema!: Record<string, unknown>;

  @IsOptional()
  @IsIn(TEMPLATE_VISIBILITIES)
  visibility?: TemplateVisibility;
}
