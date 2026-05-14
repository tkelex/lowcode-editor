import { aiPageBuilderComponentRegistry } from './ai-registry';
import type {
  AiApplyPatchOptions,
  AiComponentPatch,
  AiComponentPatchOperation,
  AiPatchValidationResult,
} from './ai-agent-types';
import type { AiValidationIssue } from './ai-types';
import type { LowcodeComponentSchema } from './types';
import { validateAiGeneratedComponents } from './ai-validate';
import { validateComponentTree } from './validate';

interface ComponentLocation {
  component: LowcodeComponentSchema;
  parent?: LowcodeComponentSchema;
  siblings: LowcodeComponentSchema[];
  index: number;
}

export function createAiComponentTreeFingerprint(components: LowcodeComponentSchema[]) {
  return stableStringify(components);
}

export function applyAiComponentPatch(
  components: LowcodeComponentSchema[],
  patch: AiComponentPatch,
  options: AiApplyPatchOptions = {},
): AiPatchValidationResult {
  const errors: AiValidationIssue[] = [];
  const baselineFingerprint = createAiComponentTreeFingerprint(components);
  if (
    (options.expectedBaselineFingerprint || patch.baselineFingerprint)
    && (options.expectedBaselineFingerprint || patch.baselineFingerprint) !== baselineFingerprint
  ) {
    errors.push(createPatchIssue('AI_AGENT_STALE_CANDIDATE', '当前页面已变化，请重新生成候选修改'));
    return { valid: false, errors, warnings: [] };
  }

  const nextComponents = cloneComponents(components);
  for (const operation of patch.operations) {
    const operationErrors = applyOperation(nextComponents, operation, options);
    errors.push(...operationErrors);
    if (operationErrors.length > 0) {
      break;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings: [] };
  }

  return validateAiPatchedComponents(nextComponents);
}

export function validateAiComponentPatch(
  components: LowcodeComponentSchema[],
  patch: AiComponentPatch,
  options: AiApplyPatchOptions = {},
): AiPatchValidationResult {
  return applyAiComponentPatch(components, patch, options);
}

export function validateAiPatchedComponents(components: LowcodeComponentSchema[]): AiPatchValidationResult {
  const treeValidation = validateComponentTree(components, aiPageBuilderComponentRegistry);
  const aiValidation = validateAiGeneratedComponents(components);
  const errors: AiValidationIssue[] = [
    ...treeValidation.errors.map((message) => createPatchIssue('AI_AGENT_TREE_INVALID', message)),
    ...aiValidation.errors,
  ];
  const warnings = aiValidation.warnings;

  return {
    valid: errors.length === 0,
    components: errors.length === 0 ? cloneComponents(components) : undefined,
    errors,
    warnings,
  };
}

export function createAiRepairPromptFromIssues(issues: AiValidationIssue[], maxIssues = 8) {
  if (issues.length === 0) {
    return '候选结果没有校验错误。';
  }

  return issues
    .slice(0, maxIssues)
    .map((issue, index) => {
      const path = issue.path ? `（路径：${issue.path}）` : '';
      return `${index + 1}. [${issue.code}] ${issue.message}${path}`;
    })
    .join('\n');
}

function applyOperation(
  components: LowcodeComponentSchema[],
  operation: AiComponentPatchOperation,
  options: AiApplyPatchOptions,
) {
  switch (operation.type) {
    case 'addChild':
      return addChild(components, operation.parentId, operation.component, operation.index, options);
    case 'updateProps':
      return updateRecordField(components, operation.componentId, 'props', operation.props, Boolean(operation.replace), options);
    case 'updateStyles':
      return updateRecordField(components, operation.componentId, 'styles', operation.styles, Boolean(operation.replace), options);
    case 'move':
      return moveComponent(components, operation.componentId, operation.parentId, operation.index, options);
    case 'delete':
      return deleteComponent(components, operation.componentId, options);
    case 'replaceSubtree':
      return replaceSubtree(components, operation.componentId, operation.component, options);
    case 'replacePage':
      components.splice(0, components.length, ...cloneComponents(operation.components));
      return [];
    default:
      return [createPatchIssue('AI_AGENT_PATCH_OPERATION_UNKNOWN', '未知 patch 操作')];
  }
}

function addChild(
  components: LowcodeComponentSchema[],
  parentId: number,
  component: LowcodeComponentSchema,
  index: number | undefined,
  options: AiApplyPatchOptions,
) {
  const parent = findComponent(components, parentId);
  if (!parent) {
    return [createPatchIssue('AI_AGENT_PATCH_TARGET_MISSING', `未找到父组件：${parentId}`)];
  }
  if (!isWithinScope(components, parentId, options.scopeRootId)) {
    return [createPatchIssue('AI_AGENT_PATCH_SCOPE_VIOLATION', '候选修改超出本次目标范围')];
  }

  const child = cloneComponents([component])[0];
  reassignSubtreeIds(child, collectIds(components));
  setParentIds(child, parentId);
  parent.children = [...(parent.children || [])];
  parent.children.splice(normalizeIndex(index, parent.children.length), 0, child);
  return [];
}

function updateRecordField(
  components: LowcodeComponentSchema[],
  componentId: number,
  field: 'props' | 'styles',
  value: Record<string, unknown>,
  replace: boolean,
  options: AiApplyPatchOptions,
) {
  const component = findComponent(components, componentId);
  if (!component) {
    return [createPatchIssue('AI_AGENT_PATCH_TARGET_MISSING', `未找到组件：${componentId}`)];
  }
  if (!isWithinScope(components, componentId, options.scopeRootId)) {
    return [createPatchIssue('AI_AGENT_PATCH_SCOPE_VIOLATION', '候选修改超出本次目标范围')];
  }

  const nextValue = replace ? { ...value } : { ...(component[field] || {}), ...value };
  Object.keys(nextValue).forEach((key) => {
    if (nextValue[key] === undefined) {
      delete nextValue[key];
    }
  });
  component[field] = nextValue;
  return [];
}

function moveComponent(
  components: LowcodeComponentSchema[],
  componentId: number,
  parentId: number,
  index: number | undefined,
  options: AiApplyPatchOptions,
) {
  if (componentId === 1) {
    return [createPatchIssue('AI_AGENT_PATCH_PAGE_MOVE_FORBIDDEN', '不能移动 Page 根节点')];
  }
  if (componentId === parentId || isDescendant(components, componentId, parentId)) {
    return [createPatchIssue('AI_AGENT_PATCH_CYCLE', '不能将组件移动到自身或自身子节点下')];
  }
  if (!isWithinScope(components, componentId, options.scopeRootId) || !isWithinScope(components, parentId, options.scopeRootId)) {
    return [createPatchIssue('AI_AGENT_PATCH_SCOPE_VIOLATION', '候选修改超出本次目标范围')];
  }

  const location = findLocation(components, componentId);
  const parent = findComponent(components, parentId);
  if (!location || !parent) {
    return [createPatchIssue('AI_AGENT_PATCH_TARGET_MISSING', '移动操作引用了不存在的组件')];
  }

  const [component] = location.siblings.splice(location.index, 1);
  parent.children = [...(parent.children || [])];
  parent.children.splice(normalizeIndex(index, parent.children.length), 0, component);
  setParentIds(component, parentId);
  return [];
}

function deleteComponent(
  components: LowcodeComponentSchema[],
  componentId: number,
  options: AiApplyPatchOptions,
) {
  if (componentId === 1) {
    return [createPatchIssue('AI_AGENT_PATCH_PAGE_DELETE_FORBIDDEN', '不能删除 Page 根节点')];
  }
  if (!isWithinScope(components, componentId, options.scopeRootId)) {
    return [createPatchIssue('AI_AGENT_PATCH_SCOPE_VIOLATION', '候选修改超出本次目标范围')];
  }

  const location = findLocation(components, componentId);
  if (!location) {
    return [createPatchIssue('AI_AGENT_PATCH_TARGET_MISSING', `未找到组件：${componentId}`)];
  }

  location.siblings.splice(location.index, 1);
  return [];
}

function replaceSubtree(
  components: LowcodeComponentSchema[],
  componentId: number,
  component: LowcodeComponentSchema,
  options: AiApplyPatchOptions,
) {
  if (componentId === 1 && component.name !== 'Page') {
    return [createPatchIssue('AI_AGENT_PATCH_PAGE_REPLACE_INVALID', '替换 Page 根节点时必须仍为 Page 组件')];
  }
  if (!isWithinScope(components, componentId, options.scopeRootId)) {
    return [createPatchIssue('AI_AGENT_PATCH_SCOPE_VIOLATION', '候选修改超出本次目标范围')];
  }

  const location = findLocation(components, componentId);
  if (!location) {
    return [createPatchIssue('AI_AGENT_PATCH_TARGET_MISSING', `未找到组件：${componentId}`)];
  }

  const nextComponent = cloneComponents([component])[0];
  const usedIds = collectIds(components);
  usedIds.delete(componentId);
  nextComponent.id = componentId;
  nextComponent.children?.forEach((child) => reassignSubtreeIds(child, usedIds));
  if (location.parent) {
    setParentIds(nextComponent, location.parent.id);
  } else {
    delete nextComponent.parentId;
    nextComponent.children?.forEach((child) => setParentIds(child, nextComponent.id));
  }
  location.siblings.splice(location.index, 1, nextComponent);
  return [];
}

function findComponent(components: LowcodeComponentSchema[], componentId: number): LowcodeComponentSchema | null {
  return findLocation(components, componentId)?.component || null;
}

function findLocation(
  components: LowcodeComponentSchema[],
  componentId: number,
  parent?: LowcodeComponentSchema,
): ComponentLocation | null {
  for (let index = 0; index < components.length; index += 1) {
    const component = components[index];
    if (component.id === componentId) {
      return { component, parent, siblings: components, index };
    }

    const childLocation = component.children ? findLocation(component.children, componentId, component) : null;
    if (childLocation) {
      return childLocation;
    }
  }

  return null;
}

function isDescendant(components: LowcodeComponentSchema[], ancestorId: number, componentId: number) {
  const ancestor = findComponent(components, ancestorId);
  if (!ancestor?.children) return false;
  return Boolean(findComponent(ancestor.children, componentId));
}

function collectIds(components: LowcodeComponentSchema[], ids = new Set<number>()) {
  components.forEach((component) => {
    ids.add(component.id);
    collectIds(component.children || [], ids);
  });
  return ids;
}

function reassignSubtreeIds(component: LowcodeComponentSchema, usedIds: Set<number>) {
  component.id = allocateId(usedIds);
  component.children?.forEach((child) => reassignSubtreeIds(child, usedIds));
}

function allocateId(usedIds: Set<number>) {
  let id = 1;
  while (usedIds.has(id)) {
    id += 1;
  }
  usedIds.add(id);
  return id;
}

function isWithinScope(components: LowcodeComponentSchema[], componentId: number, scopeRootId?: number) {
  if (!scopeRootId || componentId === scopeRootId) return true;
  return isDescendant(components, scopeRootId, componentId);
}

function setParentIds(component: LowcodeComponentSchema, parentId?: number) {
  if (parentId === undefined) {
    delete component.parentId;
  } else {
    component.parentId = parentId;
  }
  component.children?.forEach((child) => setParentIds(child, component.id));
}

function normalizeIndex(index: number | undefined, length: number) {
  if (index === undefined) return length;
  return Math.max(0, Math.min(index, length));
}

function cloneComponents(components: LowcodeComponentSchema[]) {
  return JSON.parse(JSON.stringify(components)) as LowcodeComponentSchema[];
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortValue(child)]),
  );
}

function createPatchIssue(code: string, message: string): AiValidationIssue {
  return {
    severity: 'error',
    code,
    message,
  };
}
