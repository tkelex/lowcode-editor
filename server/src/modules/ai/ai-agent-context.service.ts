import { Injectable } from '@nestjs/common';
import {
  aiPageBuilderComponentRegistry,
  createAiComponentTreeFingerprint,
  type AiAgentContextComponentSummary,
  type AiAgentContextPackage,
  type AiAgentMaterialSummary,
  type AiAgentRunRequest,
  type LowcodeComponentSchema,
} from '../../../../packages/lowcode-schema/src';

@Injectable()
export class AiAgentContextService {
  build(input: AiAgentRunRequest): AiAgentContextPackage {
    const components = input.currentComponents || [];
    const componentSummaries = summarizeComponents(components).slice(0, 80);
    const selectedComponentPath = input.selectedComponentId
      ? findComponentPath(components, input.selectedComponentId)
      : undefined;
    const selectedComponent = selectedComponentPath?.[selectedComponentPath.length - 1];

    return {
      projectId: input.projectId,
      pageId: input.pageId,
      selectedComponentId: input.selectedComponentId,
      selectedComponentName: selectedComponent?.name,
      targetScope: input.targetScope || (input.selectedComponentId ? 'selection' : 'page'),
      userPrompt: input.prompt,
      pageFingerprint: components.length > 0 ? createAiComponentTreeFingerprint(components) : undefined,
      componentSummaries,
      selectedComponentPath,
      materials: summarizeMaterials(),
      dataSourceModels: input.dataSourceModel ? [input.dataSourceModel] : [],
      history: input.history,
    };
  }
}

function summarizeComponents(
  components: LowcodeComponentSchema[],
  parentPath = '',
): AiAgentContextComponentSummary[] {
  return components.flatMap((component) => {
    const path = parentPath ? `${parentPath}/${component.name}#${component.id}` : `${component.name}#${component.id}`;
    return [
      {
        id: component.id,
        name: component.name,
        desc: component.desc,
        parentId: component.parentId,
        childCount: component.children?.length || 0,
        path,
      },
      ...summarizeComponents(component.children || [], path),
    ];
  });
}

function findComponentPath(
  components: LowcodeComponentSchema[],
  componentId: number,
  parentPath: AiAgentContextComponentSummary[] = [],
): AiAgentContextComponentSummary[] | undefined {
  for (const component of components) {
    const summary: AiAgentContextComponentSummary = {
      id: component.id,
      name: component.name,
      desc: component.desc,
      parentId: component.parentId,
      childCount: component.children?.length || 0,
      path: [...parentPath.map((item) => `${item.name}#${item.id}`), `${component.name}#${component.id}`].join('/'),
    };
    const nextPath = [...parentPath, summary];
    if (component.id === componentId) {
      return nextPath;
    }

    const childPath = findComponentPath(component.children || [], componentId, nextPath);
    if (childPath) {
      return childPath;
    }
  }

  return undefined;
}

function summarizeMaterials(): AiAgentMaterialSummary[] {
  return Object.values(aiPageBuilderComponentRegistry).map((config) => ({
    name: config.name,
    acceptsChildren: config.acceptsChildren,
  }));
}
