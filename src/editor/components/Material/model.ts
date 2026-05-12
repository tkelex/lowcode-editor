import { migratePageSchema } from '../../../../packages/lowcode-schema/src';
import type { LowcodeComponentSchema } from '../../../../packages/lowcode-schema/src';
import type { PageTemplate } from '../../../shared/api/types';
import type { ComponentCategory } from '../../registry/component-config';
import type { Component } from '../../stores/components';

export const favoriteStorageKey = 'lowcode-editor-material-favorites';

export const categoryLabels: Record<ComponentCategory, string> = {
  layout: '布局容器',
  basic: '基础组件',
  form: '表单组件',
  data: '数据展示',
  feedback: '反馈组件',
};

export const categoryOrder: ComponentCategory[] = ['layout', 'basic', 'form', 'data', 'feedback'];

export type MaterialView = 'all' | 'favorite' | 'template';

export interface TemplateConfig {
  key: string;
  title: string;
  description: string;
  keywords: string[];
  create: () => Component;
}

export type SaveTemplateFormValues = {
  title: string;
  description?: string;
  type: 'page' | 'block';
  visibility: 'project' | 'private';
};

export function toTemplateConfig(template: PageTemplate): TemplateConfig {
  return {
    key: `remote-${template.id}`,
    title: template.title,
    description: template.description || (template.type === 'page' ? '项目页面模板' : '项目区块模板'),
    keywords: [template.title, template.category || '', ...template.tags].filter(Boolean),
    create: () => {
      const schema = migratePageSchema(template.schema);
      const component = schema.components[0] as Component | undefined;
      if (!component) {
        throw new Error('模板内容为空');
      }

      if (component.name === 'Page') {
        return withFreshIds({
          id: component.id,
          name: 'Container',
          desc: template.title,
          props: {},
          styles: { padding: 24 },
          children: component.children,
        });
      }

      return withFreshIds(component);
    },
  };
}

export function serializeComponent(component: Component): LowcodeComponentSchema {
  const nextComponent: LowcodeComponentSchema = {
    id: component.id,
    name: component.name,
    props: component.props || {},
    desc: component.desc,
  };

  if (component.styles) {
    nextComponent.styles = component.styles as Record<string, unknown>;
  }
  if (component.parentId !== undefined) {
    nextComponent.parentId = component.parentId;
  }
  if (component.children) {
    nextComponent.children = component.children.map(serializeComponent);
  }

  return nextComponent;
}

export function withFreshIds(component: Component): Component {
  const nextId = createIdFactory();

  function clone(current: Component, parentId?: number): Component {
    return withParentIds({
      ...current,
      id: nextId(),
      children: current.children?.map((child) => clone(child)),
    }, parentId);
  }

  return clone(component);
}

export function createIdFactory() {
  let offset = 0;
  const base = Date.now();

  return () => {
    offset += 1;
    return base + offset;
  };
}

export function withParentIds(component: Component, parentId?: number): Component {
  const nextComponent = {
    ...component,
    props: component.props || {},
    parentId,
  };

  if (!parentId) {
    delete nextComponent.parentId;
  }

  nextComponent.children = component.children?.map(child => withParentIds(child, nextComponent.id));
  return nextComponent;
}
