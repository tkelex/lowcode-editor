import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import {
  applyAiComponentPatch,
  createAgentDataSourceBindingPatch,
  createAgentEventActionPatch,
  createAiComponentTreeFingerprint,
  decideAiAgentRoute,
} from './schema-test-utils.mjs';

const require = createRequire(import.meta.url);
const { AiAgentContextService } = require('../../server/dist/modules/ai/ai-agent-context.service.js');
const { AiAgentToolRegistryService } = require('../../server/dist/modules/ai/ai-agent-tool-registry.service.js');
const { AiAgentOrchestrationService } = require('../../server/dist/modules/ai/ai-agent-orchestration.service.js');

describe('ai agent specialized patch tools', () => {
  it('adds a URL click action to the selected button', () => {
    const components = createBaseComponents([
      {
        id: 2,
        name: 'Button',
        desc: '查看订单按钮',
        props: {
          text: '查看订单',
          onEvent: {
            hover: {
              actions: [{ actionType: 'toast', args: { msgType: 'info', msg: 'hover' } }],
            },
          },
        },
        parentId: 1,
      },
    ]);

    const result = createAgentEventActionPatch({
      components,
      prompt: '点击后跳转到 /orders',
      selectedComponentId: 2,
      pageFingerprint: createAiComponentTreeFingerprint(components),
    });

    const operation = result.patch.operations[0];
    assert.equal(operation.type, 'updateProps');
    assert.equal(operation.componentId, 2);
    assert.equal(operation.props.onEvent.click.actions[0].actionType, 'url');
    assert.equal(operation.props.onEvent.click.actions[0].args.url, '/orders');
    assert.equal(operation.props.onEvent.hover.actions[0].actionType, 'toast');

    const validation = applyAiComponentPatch(components, result.patch, {
      expectedBaselineFingerprint: createAiComponentTreeFingerprint(components),
      scopeRootId: 2,
    });
    assert.equal(validation.valid, true, validation.errors.map((issue) => issue.message).join('\n'));
  });

  it('adds an HTTP finish action to the selected form', () => {
    const components = createBaseComponents([
      {
        id: 2,
        name: 'Form',
        desc: '订单表单',
        props: { title: '订单表单' },
        parentId: 1,
      },
    ]);

    const result = createAgentEventActionPatch({
      components,
      prompt: '提交时 POST /api/orders',
      selectedComponentId: 2,
      pageFingerprint: createAiComponentTreeFingerprint(components),
    });

    const action = result.patch.operations[0].props.onEvent.finish.actions[0];
    assert.equal(action.actionType, 'http');
    assert.equal(action.args.method, 'POST');
    assert.equal(action.args.url, '/api/orders');

    const validation = applyAiComponentPatch(components, result.patch, {
      expectedBaselineFingerprint: createAiComponentTreeFingerprint(components),
      scopeRootId: 2,
    });
    assert.equal(validation.valid, true, validation.errors.map((issue) => issue.message).join('\n'));
  });

  it('wraps destructive HTTP actions with confirm', () => {
    const components = createBaseComponents([
      {
        id: 2,
        name: 'Button',
        desc: '删除按钮',
        props: { text: '删除' },
        parentId: 1,
      },
    ]);

    const result = createAgentEventActionPatch({
      components,
      prompt: '点击按钮先确认再删除 /api/orders/{{ record.id }}',
      selectedComponentId: 2,
      pageFingerprint: createAiComponentTreeFingerprint(components),
    });

    const action = result.patch.operations[0].props.onEvent.click.actions[0];
    assert.equal(action.actionType, 'confirm');
    assert.equal(action.args.actions[0].actionType, 'http');
    assert.equal(action.args.actions[0].args.method, 'DELETE');
    assert.equal(action.args.actions[0].args.url, '/api/orders/{{ record.id }}');

    const validation = applyAiComponentPatch(components, result.patch, {
      expectedBaselineFingerprint: createAiComponentTreeFingerprint(components),
      scopeRootId: 2,
    });
    assert.equal(validation.valid, true, validation.errors.map((issue) => issue.message).join('\n'));
  });

  it('binds a selected table to a runtime data source', () => {
    const components = createBaseComponents([
      {
        id: 2,
        name: 'Table',
        desc: '用户表格',
        props: {
          dataText: '[]',
        },
        parentId: 1,
      },
    ], {
      dataSources: JSON.stringify({
        items: [
          { id: 'existingOrders', name: '订单', type: 'rest', url: '/api/orders', method: 'GET' },
        ],
      }, null, 2),
    });

    const result = createAgentDataSourceBindingPatch({
      components,
      prompt: '把当前表格绑定到 /api/users',
      selectedComponentId: 2,
      pageFingerprint: createAiComponentTreeFingerprint(components),
    });

    assert.equal(result.patch.operations.length, 2);
    assert.equal(result.patch.operations[0].componentId, 1);
    assert.equal(result.patch.operations[1].componentId, 2);
    assert.equal(result.patch.operations[1].props.dataSourceId, 'agentUsersData');

    const nextDataSources = JSON.parse(result.patch.operations[0].props.dataSources);
    assert.equal(nextDataSources.items.some((item) => item.id === 'existingOrders'), true);
    assert.equal(nextDataSources.items.some((item) => item.id === 'agentUsersData' && item.url === '/api/users'), true);

    const validation = applyAiComponentPatch(components, result.patch, {
      expectedBaselineFingerprint: createAiComponentTreeFingerprint(components),
    });
    assert.equal(validation.valid, true, validation.errors.map((issue) => issue.message).join('\n'));
  });

  it('rejects unsupported targets and missing API URLs', () => {
    const components = createBaseComponents([
      {
        id: 2,
        name: 'Text',
        desc: '说明文字',
        props: { text: 'Hello' },
        parentId: 1,
      },
    ]);

    assert.throws(
      () => createAgentDataSourceBindingPatch({
        components,
        prompt: '绑定接口数据',
        selectedComponentId: 2,
      }),
      /不支持本次操作/,
    );

    const tableComponents = createBaseComponents([
      {
        id: 2,
        name: 'Table',
        desc: '用户表格',
        props: { dataText: '[]' },
        parentId: 1,
      },
    ]);

    assert.throws(
      () => createAgentDataSourceBindingPatch({
        components: tableComponents,
        prompt: '绑定接口数据',
        selectedComponentId: 2,
      }),
      /未识别到接口地址/,
    );
  });

  it('routes event and data source intents to executable specialized tools', () => {
    const eventDecision = decideAiAgentRoute({
      prompt: '点击后跳转到 /orders',
      selectedComponentId: 2,
      targetScope: 'selection',
    });
    assert.equal(eventDecision.intent, 'add-event-action');
    assert.equal(eventDecision.preferredTool, 'event-action-patch');

    const dataSourceDecision = decideAiAgentRoute({
      prompt: '绑定 /api/users 数据源',
      selectedComponentId: 3,
      targetScope: 'selection',
    });
    assert.equal(dataSourceDecision.intent, 'bind-data-source');
    assert.equal(dataSourceDecision.preferredTool, 'data-source-patch');
  });

  it('orchestrates event and data source intents through specialized tools', async () => {
    const eventComponents = createBaseComponents([
      {
        id: 2,
        name: 'Button',
        desc: '查看按钮',
        props: { text: '查看订单' },
        parentId: 1,
      },
    ]);
    const eventRun = await createAgentOrchestration().run({
      prompt: '点击后跳转到 /orders',
      selectedComponentId: 2,
      targetScope: 'selection',
      currentComponents: eventComponents,
    }, 1001);

    assert.equal(eventRun.status, 'awaiting_confirmation');
    assert.equal(eventRun.routeDecision.intent, 'add-event-action');
    assert.equal(eventRun.candidate.kind, 'patch');
    assert.equal(eventRun.toolCalls.some((call) => call.toolName === 'generateEventActionPatch'), true);
    assert.equal(eventRun.toolCalls.some((call) => call.toolName === 'generateSchemaDraft'), false);

    const dataSourceComponents = createBaseComponents([
      {
        id: 3,
        name: 'Table',
        desc: '用户表格',
        props: { dataText: '[]' },
        parentId: 1,
      },
    ]);
    const dataSourceRun = await createAgentOrchestration().run({
      prompt: '把当前表格绑定到 /api/users',
      selectedComponentId: 3,
      targetScope: 'selection',
      currentComponents: dataSourceComponents,
    }, 1002);

    assert.equal(dataSourceRun.status, 'awaiting_confirmation');
    assert.equal(dataSourceRun.routeDecision.intent, 'bind-data-source');
    assert.equal(dataSourceRun.candidate.kind, 'patch');
    assert.equal(dataSourceRun.toolCalls.some((call) => call.toolName === 'bindDataSource'), true);
    assert.equal(dataSourceRun.toolCalls.some((call) => call.toolName === 'generateSchemaDraft'), false);
  });
});

function createBaseComponents(children, pageProps = {}) {
  return [
    {
      id: 1,
      name: 'Page',
      desc: '页面',
      props: {
        pageTitle: '测试页面',
        dataSources: '{\n  "items": []\n}',
        ...pageProps,
      },
      children,
    },
  ];
}

function createAgentOrchestration() {
  const configService = { get: () => undefined };
  const contextService = new AiAgentContextService();
  const pageGenerator = {
    async generate() {
      throw new Error('不应调用自由 schema draft 生成器');
    },
  };
  const toolRegistry = new AiAgentToolRegistryService(pageGenerator);
  return new AiAgentOrchestrationService(configService, contextService, toolRegistry);
}
