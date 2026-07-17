import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { decideAiAgentRoute, isCrudRouteDecision } from './schema-test-utils.mjs';

describe('ai agent route decisions', () => {
  it('routes CRUD/data source requests to deterministic generation', () => {
    const decision = decideAiAgentRoute({
      prompt: '基于 /api/users 生成用户管理页，包含列表、新增、编辑、详情',
    });

    assert.equal(decision.intent, 'crud-page');
    assert.equal(decision.preferredTool, 'crud-generator');
    assert.equal(decision.deterministic, true);
    assert.equal(isCrudRouteDecision(decision), true);
    assert.ok(decision.confidence >= 0.7);
  });

  it('routes free page requests away from CRUD', () => {
    const decision = decideAiAgentRoute({
      prompt: '生成一个品牌营销首页首屏，包含 hero、价值主张和客户评价',
    });

    assert.equal(decision.intent, 'free-page');
    assert.notEqual(decision.preferredTool, 'crud-generator');
    assert.equal(isCrudRouteDecision(decision), false);
  });

  it('routes selected component edits to patch flow', () => {
    const decision = decideAiAgentRoute({
      prompt: '把这个按钮改成主要按钮，并点击后跳转到 /orders',
      selectedComponentId: 12,
      targetScope: 'selection',
    });

    assert.equal(decision.intent, 'add-event-action');
    assert.equal(decision.targetScope, 'selection');
    assert.equal(decision.preferredTool, 'event-action-patch');
  });

  it('routes style polish requests to schema patch flow', () => {
    const decision = decideAiAgentRoute({
      prompt: '优化当前页面视觉效果，让它更像后台数据看板',
      selectedComponentId: 3,
    });

    assert.equal(decision.intent, 'style-polish');
    assert.equal(decision.preferredTool, 'schema-patch');
  });

  it('routes data source binding requests', () => {
    const decision = decideAiAgentRoute({
      prompt: '把当前表格绑定到订单接口数据源',
      selectedComponentId: 8,
    });

    assert.equal(decision.intent, 'bind-data-source');
    assert.equal(decision.preferredTool, 'data-source-patch');
  });

  it('routes explicit event action requests', () => {
    const decision = decideAiAgentRoute({
      prompt: '给提交按钮配置 click 事件，先 confirm 再提交订单',
      selectedComponentId: 9,
    });

    assert.equal(decision.intent, 'add-event-action');
    assert.equal(decision.preferredTool, 'event-action-patch');
  });

  it('adds fallback for ambiguous prompts', () => {
    const decision = decideAiAgentRoute({
      prompt: '做个页面看看',
    });

    assert.equal(decision.intent, 'free-page');
    assert.ok(decision.fallback);
    assert.ok(decision.confidence < 0.6);
  });
});
