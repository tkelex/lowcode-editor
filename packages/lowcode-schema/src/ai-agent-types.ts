import type { AiPageGenerationResult, AiValidationIssue } from './ai-types';
import type { LowcodeComponentSchema } from './types';

export type AiAgentRunStatus =
  | 'queued'
  | 'running'
  | 'awaiting_confirmation'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AiAgentTargetScope = 'page' | 'selection' | 'component';
export type AiAgentToolKind = 'read' | 'generate' | 'patch' | 'validate';
export type AiAgentCandidateKind = 'patch' | 'components';

export interface AiAgentMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

export interface AiAgentContextComponentSummary {
  id: number;
  name: string;
  desc: string;
  parentId?: number;
  childCount: number;
  path: string;
}

export interface AiAgentMaterialSummary {
  name: string;
  acceptsChildren?: string[] | true;
  events?: string[];
  methods?: string[];
}

export interface AiAgentContextPackage {
  projectId?: number;
  pageId?: number;
  selectedComponentId?: number;
  selectedComponentName?: string;
  targetScope: AiAgentTargetScope;
  userPrompt: string;
  pageFingerprint?: string;
  componentSummaries: AiAgentContextComponentSummary[];
  selectedComponentPath?: AiAgentContextComponentSummary[];
  materials: AiAgentMaterialSummary[];
  dataSourceModels?: unknown[];
  history?: AiAgentMessage[];
}

export interface AiAgentToolDefinition {
  name: string;
  description: string;
  kind: AiAgentToolKind;
  readOnly: boolean;
  timeoutMs: number;
}

export interface AiAgentToolCall {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  status: 'pending' | 'running' | 'success' | 'failed' | 'blocked';
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  summary?: string;
  result?: unknown;
}

export interface AiAgentRunEvent {
  id: string;
  type: 'plan' | 'tool_call' | 'validation' | 'repair' | 'candidate' | 'error' | 'message';
  title: string;
  detail?: string;
  createdAt: string;
}

export interface AiAgentRunLimits {
  maxSteps: number;
  maxRepairs: number;
  timeoutMs: number;
  maxContextComponents: number;
}

export interface AiAgentRunRequest {
  prompt: string;
  projectId?: number;
  pageId?: number;
  selectedComponentId?: number;
  targetScope?: AiAgentTargetScope;
  currentComponents?: LowcodeComponentSchema[];
  history?: AiAgentMessage[];
  apiDescription?: string;
  responseSample?: unknown;
  dataSourceModel?: unknown;
}

export interface AiAgentCandidateBase {
  id: string;
  kind: AiAgentCandidateKind;
  summary: string;
  impactScope: AiAgentTargetScope;
  baselineFingerprint?: string;
  warnings: string[];
  assumptions: string[];
  validationErrors: AiValidationIssue[];
  validationWarnings: AiValidationIssue[];
}

export interface AiAgentPatchCandidate extends AiAgentCandidateBase {
  kind: 'patch';
  patch: AiComponentPatch;
  previewComponents?: LowcodeComponentSchema[];
}

export interface AiAgentComponentsCandidate extends AiAgentCandidateBase {
  kind: 'components';
  components: LowcodeComponentSchema[];
}

export type AiAgentCandidate = AiAgentPatchCandidate | AiAgentComponentsCandidate;

export interface AiAgentRunResult {
  runId: string;
  status: AiAgentRunStatus;
  context: AiAgentContextPackage;
  plan: string[];
  events: AiAgentRunEvent[];
  toolCalls: AiAgentToolCall[];
  candidate?: AiAgentCandidate;
  generation?: AiPageGenerationResult;
  error?: string;
  audit?: AiAgentRunAuditSummary;
}

export interface AiAgentRunAuditSummary {
  runId: string;
  projectId?: number;
  pageId?: number;
  status: AiAgentRunStatus;
  targetScope: AiAgentTargetScope;
  durationMs: number;
  toolCallCount: number;
  warningCount: number;
  failureReason?: string;
  candidateKind?: AiAgentCandidateKind;
}

export type AiComponentPatchOperation =
  | AiAddChildPatchOperation
  | AiUpdatePropsPatchOperation
  | AiUpdateStylesPatchOperation
  | AiMovePatchOperation
  | AiDeletePatchOperation
  | AiReplaceSubtreePatchOperation
  | AiReplacePagePatchOperation;

export interface AiComponentPatch {
  operations: AiComponentPatchOperation[];
  summary?: string;
  baselineFingerprint?: string;
}

export interface AiPatchOperationBase {
  id?: string;
  reason?: string;
}

export interface AiAddChildPatchOperation extends AiPatchOperationBase {
  type: 'addChild';
  parentId: number;
  component: LowcodeComponentSchema;
  index?: number;
}

export interface AiUpdatePropsPatchOperation extends AiPatchOperationBase {
  type: 'updateProps';
  componentId: number;
  props: Record<string, unknown>;
  replace?: boolean;
}

export interface AiUpdateStylesPatchOperation extends AiPatchOperationBase {
  type: 'updateStyles';
  componentId: number;
  styles: Record<string, unknown>;
  replace?: boolean;
}

export interface AiMovePatchOperation extends AiPatchOperationBase {
  type: 'move';
  componentId: number;
  parentId: number;
  index?: number;
}

export interface AiDeletePatchOperation extends AiPatchOperationBase {
  type: 'delete';
  componentId: number;
}

export interface AiReplaceSubtreePatchOperation extends AiPatchOperationBase {
  type: 'replaceSubtree';
  componentId: number;
  component: LowcodeComponentSchema;
}

export interface AiReplacePagePatchOperation extends AiPatchOperationBase {
  type: 'replacePage';
  components: LowcodeComponentSchema[];
}

export interface AiApplyPatchOptions {
  expectedBaselineFingerprint?: string;
  scopeRootId?: number;
}

export interface AiPatchValidationResult {
  valid: boolean;
  components?: LowcodeComponentSchema[];
  errors: AiValidationIssue[];
  warnings: AiValidationIssue[];
}
