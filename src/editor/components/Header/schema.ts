import { CURRENT_SCHEMA_VERSION } from '../../../../packages/lowcode-schema/src';
import type { LowcodeComponentSchema, LowcodePageSchema } from '../../../../packages/lowcode-schema/src';
import type { Component } from '../../stores/components';

export function buildPageSchema(components: Component[], pageId?: number): LowcodePageSchema {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    pageId,
    components: components.map(serializeComponent),
    metadata: {
      updatedAt: new Date().toISOString(),
    },
  };
}

export function serializeComponent(component: Component): LowcodeComponentSchema {
  const nextComponent: LowcodeComponentSchema = {
    id: component.id,
    name: component.name,
    props: isPlainObject(component.props) ? { ...component.props } : {},
    desc: component.desc,
  };

  if (component.styles) {
    nextComponent.styles = Object.entries(component.styles).reduce<Record<string, unknown>>((styles, [key, value]) => {
      if (value !== undefined) {
        styles[key] = value;
      }

      return styles;
    }, {});
  }

  if (component.parentId !== undefined) {
    nextComponent.parentId = component.parentId;
  }

  if (component.children) {
    nextComponent.children = component.children.map(serializeComponent);
  }

  return nextComponent;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
