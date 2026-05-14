import type { LowcodeComponentSchema } from './types';

export type AiPageBuilderWriteMode = 'replacePage' | 'insertSelection' | 'createPage';
export type AiPageBuilderTarget = 'fullPage' | 'section' | 'crud';
export type AiGeneratedPageType = 'dashboard' | 'crud' | 'form' | 'detail' | 'landing' | 'custom';
export type AiGeneratedFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'select';
export type AiIssueSeverity = 'error' | 'warning';

export interface AiGeneratedField {
  key: string;
  label: string;
  type: AiGeneratedFieldType;
  required?: boolean;
  sourcePath?: string;
  requestPath?: string;
  listVisible?: boolean;
  formVisible?: boolean;
  detailVisible?: boolean;
  optionsText?: string;
}

export interface AiGeneratedSectionIntent {
  id?: string;
  title: string;
  kind: 'hero' | 'stats' | 'table' | 'form' | 'detail' | 'tabs' | 'list' | 'actions' | 'custom';
  description?: string;
  fields?: AiGeneratedField[];
}

export interface AiPageIntent {
  title: string;
  pageType: AiGeneratedPageType;
  description?: string;
  sections: AiGeneratedSectionIntent[];
  primaryEntity?: string;
  fields?: AiGeneratedField[];
}

export interface AiPageGenerationRequest {
  prompt: string;
  projectId?: number;
  pageId?: number;
  target?: AiPageBuilderTarget;
  writeMode?: AiPageBuilderWriteMode;
  apiDescription?: string;
  responseSample?: unknown;
  dataSourceModel?: unknown;
  currentComponents?: LowcodeComponentSchema[];
}

export interface AiPageGenerationResult {
  components: LowcodeComponentSchema[];
  summary: string;
  warnings: string[];
  assumptions: string[];
  intent?: AiPageIntent;
  metadata?: Record<string, unknown>;
}

export interface AiValidationIssue {
  severity: AiIssueSeverity;
  code: string;
  message: string;
  path?: string;
  componentId?: number;
  componentName?: string;
}

export interface AiGeneratedComponentsValidationResult {
  valid: boolean;
  components?: LowcodeComponentSchema[];
  errors: AiValidationIssue[];
  warnings: AiValidationIssue[];
}

export interface NormalizeAiGeneratedComponentsOptions {
  fragment?: boolean;
  pageTitle?: string;
}

export interface ValidateAiGeneratedComponentsOptions extends NormalizeAiGeneratedComponentsOptions {
  allowCustomActions?: boolean;
}
