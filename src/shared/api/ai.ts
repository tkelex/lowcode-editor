import type {
  AiPageBuilderTarget,
  AiPageBuilderWriteMode,
  AiAgentRunResult,
  AiAgentMessage,
  AiAgentTargetScope,
  AiPageGenerationResult,
  LowcodeComponentSchema,
} from '../../../packages/lowcode-schema/src';
import { http } from './http';

export interface GenerateAiPageInput {
  prompt: string;
  target?: AiPageBuilderTarget;
  writeMode?: AiPageBuilderWriteMode;
  apiDescription?: string;
  responseSample?: unknown;
  dataSourceModel?: unknown;
  context?: Record<string, unknown>;
  currentComponents?: LowcodeComponentSchema[];
  history?: AiAgentMessage[];
}

export interface CreateAiAgentRunInput {
  prompt: string;
  targetScope?: AiAgentTargetScope;
  selectedComponentId?: number;
  apiDescription?: string;
  responseSample?: unknown;
  dataSourceModel?: unknown;
  context?: Record<string, unknown>;
}

export async function generateAiPageForProject(projectId: number, input: GenerateAiPageInput) {
  const { data } = await http.post<AiPageGenerationResult>(`/projects/${projectId}/ai/page-generation`, input);
  return data;
}

export async function generateAiPageForPage(pageId: number, input: GenerateAiPageInput) {
  const { data } = await http.post<AiPageGenerationResult>(`/pages/${pageId}/ai/page-generation`, input);
  return data;
}

export async function createAiAgentRunForProject(projectId: number, input: CreateAiAgentRunInput) {
  const { data } = await http.post<AiAgentRunResult>(`/projects/${projectId}/ai/agent-runs`, input);
  return data;
}

export async function createAiAgentRunForPage(pageId: number, input: CreateAiAgentRunInput) {
  const { data } = await http.post<AiAgentRunResult>(`/pages/${pageId}/ai/agent-runs`, input);
  return data;
}

export async function getAiAgentRun(runId: string) {
  const { data } = await http.get<AiAgentRunResult>(`/ai/agent-runs/${runId}`);
  return data;
}

export async function cancelAiAgentRun(runId: string) {
  const { data } = await http.post<AiAgentRunResult>(`/ai/agent-runs/${runId}/cancel`);
  return data;
}
