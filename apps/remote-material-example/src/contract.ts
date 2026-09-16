import type { ComponentType } from 'react';

export interface ExampleEditorMaterialDefinition {
  name: string;
  desc: string;
  category: 'data';
  icon: string;
  keywords: string[];
  sort: number;
  defaultProps: Record<string, unknown>;
  acceptsChildren: true;
  setter: Array<{
    name: string;
    label: string;
    type: string;
    [key: string]: unknown;
  }>;
  events: Array<{
    name: string;
    label: string;
    propName: string;
  }>;
  methods: Array<{
    name: string;
    label: string;
  }>;
  dev: ComponentType<any>;
  prod: ComponentType<any>;
}

export interface ExampleMaterialHost {
  protocolVersion: '1';
  shared: {
    React: typeof import('react');
    ReactDOM: typeof import('react-dom');
    antd: typeof import('antd');
  };
  register(bundle: {
    protocolVersion: '1';
    name: string;
    version: string;
    schemaVersion: string;
    materials: Record<string, ComponentType<any>>;
    editorMaterials: Record<string, ExampleEditorMaterialDefinition>;
  }): unknown;
}

declare global {
  interface Window {
    __LOWCODE_MATERIAL_HOST__?: ExampleMaterialHost;
  }
}
