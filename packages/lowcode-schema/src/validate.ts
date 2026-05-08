import type {
  ComponentTreeValidationResult,
  LowcodeComponentConfigMap,
  LowcodeComponentSchema,
} from './types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function formatAcceptsChildren(acceptsChildren: string[] | true | undefined) {
  if (acceptsChildren === true) return '任意组件';
  if (!acceptsChildren?.length) return '不接收子组件';
  return acceptsChildren.join('、');
}

export function validateComponentTree(
  value: unknown,
  componentConfig: LowcodeComponentConfigMap,
): ComponentTreeValidationResult {
  const errors: string[] = [];
  const usedIds = new Set<number>();

  if (!Array.isArray(value)) {
    return {
      valid: false,
      errors: ['源码根节点必须是组件数组'],
    };
  }

  if (value.length === 0) {
    errors.push('组件树不能为空，至少需要一个 Page 根节点');
  }

  function validateNode(node: unknown, path: string, parent?: LowcodeComponentSchema) {
    if (!isPlainObject(node)) {
      errors.push(`${path} 必须是组件对象`);
      return;
    }

    const component = node as Partial<LowcodeComponentSchema>;

    if (typeof component.id !== 'number' || !Number.isFinite(component.id)) {
      errors.push(`${path}.id 必须是有效数字`);
    } else if (usedIds.has(component.id)) {
      errors.push(`${path}.id 不能重复：${component.id}`);
    } else {
      usedIds.add(component.id);
    }

    if (typeof component.name !== 'string' || !component.name.trim()) {
      errors.push(`${path}.name 必须是非空字符串`);
    } else if (!componentConfig[component.name]) {
      errors.push(`${path}.name 未注册物料：${component.name}`);
    }

    if (!isPlainObject(component.props)) {
      errors.push(`${path}.props 必须是对象`);
    }

    if (typeof component.desc !== 'string') {
      errors.push(`${path}.desc 必须是字符串`);
    }

    if (component.styles !== undefined && !isPlainObject(component.styles)) {
      errors.push(`${path}.styles 必须是对象`);
    }

    if (component.parentId !== undefined && typeof component.parentId !== 'number') {
      errors.push(`${path}.parentId 必须是数字`);
    }

    if (parent && component.parentId !== undefined && component.parentId !== parent.id) {
      errors.push(`${path}.parentId 应为父组件 id ${parent.id}，当前为 ${component.parentId}`);
    }

    if (!parent && component.parentId !== undefined) {
      errors.push(`${path}.parentId 是根节点时不应存在`);
    }

    if (parent && typeof component.name === 'string') {
      const parentConfig = componentConfig[parent.name];
      const acceptsChildren = parentConfig?.acceptsChildren;

      if (!acceptsChildren) {
        errors.push(`${path} 不能放在 ${parent.name} 下，${parent.name} 不接收子组件`);
      } else if (Array.isArray(acceptsChildren) && !acceptsChildren.includes(component.name)) {
        errors.push(
          `${path} 不能放在 ${parent.name} 下，${parent.name} 仅支持：${formatAcceptsChildren(acceptsChildren)}`,
        );
      }
    }

    if (component.children !== undefined && !Array.isArray(component.children)) {
      errors.push(`${path}.children 必须是数组`);
      return;
    }

    if (Array.isArray(component.children)) {
      const currentConfig = typeof component.name === 'string' ? componentConfig[component.name] : undefined;
      if (!currentConfig?.acceptsChildren && component.children.length > 0) {
        errors.push(`${path}.children 不合法，${component.name || '当前组件'} 不接收子组件`);
      }

      component.children.forEach((child, index) => {
        validateNode(child, `${path}.children[${index}]`, component as LowcodeComponentSchema);
      });
    }
  }

  value.forEach((component, index) => validateNode(component, `[${index}]`));

  const hasPageRoot = value.some((component) => isPlainObject(component) && component.name === 'Page');
  if (!hasPageRoot) {
    errors.push('组件树需要包含 Page 根节点');
  }

  return {
    valid: errors.length === 0,
    errors,
    components: errors.length === 0 ? (value as LowcodeComponentSchema[]) : undefined,
  };
}

export function assertValidComponentTree(
  value: unknown,
  componentConfig: LowcodeComponentConfigMap,
): LowcodeComponentSchema[] {
  const validation = validateComponentTree(value, componentConfig);
  if (!validation.valid || !validation.components) {
    throw new Error(validation.errors[0] || '组件 schema 不合法');
  }

  return validation.components;
}
