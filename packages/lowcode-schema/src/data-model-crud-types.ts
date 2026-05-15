import type { LowcodePageSchema } from './types';

export type CrudHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type DataSourceFieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'select';
export type CrudPageType = 'list' | 'create' | 'edit' | 'detail';
export type DataSourceAuthType = 'none' | 'currentUser' | 'bearer';

export interface DataSourceApiEndpoint {
  url: string;
  method?: CrudHttpMethod;
  auth?: DataSourceAuthType;
  headers?: Record<string, string>;
  body?: unknown;
  responseDataPath?: string;
  responseTotalPath?: string;
}

export interface DataSourceFieldMapping {
  key: string;
  label: string;
  type: DataSourceFieldType;
  sourcePath?: string;
  requestPath?: string;
  required?: boolean;
  listVisible?: boolean;
  formVisible?: boolean;
  detailVisible?: boolean;
  optionsText?: string;
}

export interface ProjectDataSourceModelConfig {
  id?: string;
  projectId?: number;
  name: string;
  key: string;
  primaryField: string;
  description?: string;
  listApi?: DataSourceApiEndpoint | null;
  detailApi?: DataSourceApiEndpoint | null;
  createApi?: DataSourceApiEndpoint | null;
  updateApi?: DataSourceApiEndpoint | null;
  deleteApi?: DataSourceApiEndpoint | null;
  fields: DataSourceFieldMapping[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CrudGenerationOptions {
  pageType: CrudPageType;
  pageName: string;
  routePath?: string;
  listRoutePath?: string;
  detailRoutePath?: string;
  recordIdExpression?: string;
  idStart?: number;
}

export interface CrudGenerationResult {
  pageType: CrudPageType;
  pageName: string;
  routePath?: string;
  dataSourceModelKey: string;
  schema: LowcodePageSchema;
  warnings: string[];
}

export interface DataSourceModelValidationIssue {
  path: string;
  message: string;
}

export interface DataSourceModelValidationResult {
  valid: boolean;
  errors: DataSourceModelValidationIssue[];
  warnings: DataSourceModelValidationIssue[];
}
