import {
  aiPageBuilderAllowedActionSet,
  aiPageBuilderAllowedComponentSet,
  aiPageBuilderComponentRegistry,
} from './ai-registry';
import { normalizeAiGeneratedComponents } from './ai-normalize';
import type {
  AiGeneratedComponentsValidationResult,
  AiValidationIssue,
  ValidateAiGeneratedComponentsOptions,
} from './ai-types';
import type { LowcodeAction, LowcodeComponentSchema } from './types';
import { validateComponentTree } from './validate';

export function validateAiGeneratedComponents(
  value: unknown,
  options: ValidateAiGeneratedComponentsOptions = {},
): AiGeneratedComponentsValidationResult {
  const normalized = normalizeAiGeneratedComponents(value, options);
  const errors: AiValidationIssue[] = [];
  const warnings: AiValidationIssue[] = normalized.warnings.map((message) => ({
    severity: 'warning',
    code: 'AI_NORMALIZE_WARNING',
    message,
  }));

  const treeValidation = validateComponentTree(normalized.components, aiPageBuilderComponentRegistry);
  if (!treeValidation.valid) {
    errors.push(...treeValidation.errors.map((message) => ({
      severity: 'error' as const,
      code: 'AI_COMPONENT_TREE_INVALID',
      message,
    })));
  }

  normalized.components.forEach((component, index) => {
    validateNode(component, `[${index}]`, options, errors, warnings);
  });

  return {
    valid: errors.length === 0,
    components: errors.length === 0 ? normalized.components : undefined,
    errors,
    warnings,
  };
}

function validateNode(
  component: LowcodeComponentSchema,
  path: string,
  options: ValidateAiGeneratedComponentsOptions,
  errors: AiValidationIssue[],
  warnings: AiValidationIssue[],
) {
  if (!aiPageBuilderAllowedComponentSet.has(component.name)) {
    errors.push(createIssue('AI_COMPONENT_NOT_ALLOWED', `AI 生成了不允许的物料：${component.name}`, path, component));
  }

  validateComponentActions(component, path, options, errors, warnings);

  component.children?.forEach((child, index) => {
    validateNode(child, `${path}.children[${index}]`, options, errors, warnings);
  });
}

function validateComponentActions(
  component: LowcodeComponentSchema,
  path: string,
  options: ValidateAiGeneratedComponentsOptions,
  errors: AiValidationIssue[],
  warnings: AiValidationIssue[],
) {
  const onEvent = component.props?.onEvent;
  if (!isRecord(onEvent)) {
    return;
  }

  Object.entries(onEvent).forEach(([eventName, eventConfig]) => {
    if (!isRecord(eventConfig) || !Array.isArray(eventConfig.actions)) {
      return;
    }

    eventConfig.actions.forEach((action, index) => {
      validateAction(
        action,
        `${path}.props.onEvent.${eventName}.actions[${index}]`,
        options,
        component,
        errors,
        warnings,
      );
    });
  });
}

function validateAction(
  value: unknown,
  path: string,
  options: ValidateAiGeneratedComponentsOptions,
  component: LowcodeComponentSchema,
  errors: AiValidationIssue[],
  warnings: AiValidationIssue[],
) {
  if (!isRecord(value)) {
    errors.push(createIssue('AI_ACTION_INVALID', '事件动作必须是对象', path, component));
    return;
  }

  const actionType = value.actionType;
  if (actionType === 'custom' && !options.allowCustomActions) {
    errors.push(createIssue('AI_CUSTOM_ACTION_FORBIDDEN', 'AI 默认不得生成 custom 自定义脚本动作', path, component));
    return;
  }

  if (typeof actionType !== 'string' || (!aiPageBuilderAllowedActionSet.has(actionType) && actionType !== 'custom')) {
    errors.push(createIssue('AI_ACTION_NOT_ALLOWED', `AI 生成了不允许的事件动作：${String(actionType)}`, path, component));
    return;
  }

  if (actionType === 'http') {
    validateHttpAction(value as Partial<LowcodeAction>, path, component, errors, warnings);
  }

  validateNestedActions(value, path, options, component, errors, warnings);
}

function validateHttpAction(
  action: Partial<LowcodeAction>,
  path: string,
  component: LowcodeComponentSchema,
  errors: AiValidationIssue[],
  warnings: AiValidationIssue[],
) {
  const args: Record<string, unknown> = isRecord(action.args) ? action.args : {};
  const url = args.url;
  if (typeof url !== 'string' || !url.trim()) {
    errors.push(createIssue('AI_HTTP_URL_REQUIRED', 'HTTP 动作必须包含非空 url', `${path}.args.url`, component));
  }

  const method = args.method;
  if (method !== undefined && !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(String(method))) {
    errors.push(createIssue('AI_HTTP_METHOD_INVALID', `HTTP method 不合法：${String(method)}`, `${path}.args.method`, component));
  }

  if (isRecord(args.headers)) {
    Object.entries(args.headers).forEach(([key, value]) => {
      if (typeof value !== 'string') {
        errors.push(createIssue('AI_HTTP_HEADER_INVALID', `HTTP header ${key} 的值必须是字符串`, `${path}.args.headers.${key}`, component));
      }
    });
  }

  if (typeof url === 'string' && /^javascript:/i.test(url.trim())) {
    errors.push(createIssue('AI_HTTP_URL_UNSAFE', 'HTTP 动作 URL 不允许使用 javascript: 协议', `${path}.args.url`, component));
  }

  if (typeof url === 'string' && !url.trim().startsWith('/') && !/^https?:\/\//i.test(url.trim())) {
    warnings.push(createIssue('AI_HTTP_URL_REVIEW', 'HTTP 动作 URL 不是绝对 http(s) 地址或站内路径，请确认运行环境 allowed origins 配置', `${path}.args.url`, component, 'warning'));
  }
}

function validateNestedActions(
  action: Record<string, unknown>,
  path: string,
  options: ValidateAiGeneratedComponentsOptions,
  component: LowcodeComponentSchema,
  errors: AiValidationIssue[],
  warnings: AiValidationIssue[],
) {
  const args = isRecord(action.args) ? action.args : {};
  ['actions', 'cancelActions', 'trueActions', 'falseActions'].forEach((key) => {
    const nested = args[key];
    if (!Array.isArray(nested)) {
      return;
    }

    nested.forEach((nestedAction, index) => {
      validateAction(nestedAction, `${path}.args.${key}[${index}]`, options, component, errors, warnings);
    });
  });
}

function createIssue(
  code: string,
  message: string,
  path: string,
  component: LowcodeComponentSchema,
  severity: 'error' | 'warning' = 'error',
): AiValidationIssue {
  return {
    severity,
    code,
    message,
    path,
    componentId: component.id,
    componentName: component.name,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
