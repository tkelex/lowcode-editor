import type {
  AiAgentPreferredTool,
  AiAgentRouteDecision,
  AiAgentRouteIntent,
  AiAgentRunRequest,
  AiAgentTargetScope,
} from './ai-agent-types';

interface RouteSignal {
  pattern: RegExp;
  reason: string;
}

const CRUD_SIGNALS: RouteSignal[] = [
  { pattern: /\bcrud\b/i, reason: '命中 CRUD 关键词' },
  { pattern: /增删改查|管理页|管理页面|后台管理|数据管理/, reason: '命中管理页面关键词' },
  { pattern: /列表|表格|分页|详情|新增|编辑|删除/, reason: '命中 CRUD 页面结构关键词' },
  { pattern: /\/api\/|https?:\/\/[^\s]+\/api\/|接口|数据源/, reason: '包含接口或数据源信息' },
  { pattern: /\badmin\b|\bmanagement\b|\bmanager\b|\btable\b|\blist\b/i, reason: '命中英文管理或列表关键词' },
];

const EVENT_SIGNALS: RouteSignal[] = [
  { pattern: /点击|提交|跳转|弹窗|确认|toast|提示|onEvent|事件|按钮.*(?:接|加|配置)/i, reason: '命中事件动作关键词' },
  { pattern: /\bclick\b|\bsubmit\b|\bnavigate\b|\bredirect\b|\bpost\b|\bput\b|\bdelete\b/i, reason: '命中英文事件或请求动作关键词' },
];

const DATA_SOURCE_SIGNALS: RouteSignal[] = [
  { pattern: /(?:绑定|接入|接上|接到|连接|关联).*(?:数据源|接口|API)|(?:表格|列表|选择器|当前组件).*(?:绑定|接入|接上|接到).*(?:数据源|接口|API)|dataSourceId|dataSources/i, reason: '命中数据源绑定关键词' },
  { pattern: /\b(bind|connect|wire)\b.*\b(api|endpoint|data source)\b/i, reason: '命中英文数据源绑定关键词' },
];

const STYLE_SIGNALS: RouteSignal[] = [
  { pattern: /美化|优化.*(?:样式|布局|视觉)|更好看|统一风格|看板|间距|配色|字号|对齐/, reason: '命中样式优化关键词' },
  { pattern: /\bpolish\b|\bstyle\b|\blayout\b|\bvisual\b|\bdashboard\b/i, reason: '命中英文样式优化关键词' },
];

const FIX_SIGNALS: RouteSignal[] = [
  { pattern: /修复|报错|错误|异常|不显示|空白|失效|校验失败|问题|bug/i, reason: '命中问题修复关键词' },
  { pattern: /\bfix\b|\berror\b|\bbug\b|\bissue\b|\bbroken\b/i, reason: '命中英文问题修复关键词' },
];

const FREE_PAGE_SIGNALS: RouteSignal[] = [
  { pattern: /首页|落地页|官网|营销|品牌|活动页|介绍页|大屏|仪表盘/, reason: '命中普通页面生成关键词' },
  { pattern: /\blanding\b|\bhomepage\b|\bwebsite\b|\bhero\b|\bdashboard\b/i, reason: '命中英文普通页面关键词' },
];

export function decideAiAgentRoute(input: AiAgentRunRequest): AiAgentRouteDecision {
  const text = `${input.prompt || ''}\n${input.apiDescription || ''}`.trim();
  const hasSelection = Boolean(input.selectedComponentId);
  const targetScope = resolveTargetScope(input);

  if (input.dataSourceModel) {
    return createDecision('crud-page', 0.96, targetScope, 'crud-generator', ['提供了显式数据源模型'], true);
  }

  const crudReasons = collectReasons(text, CRUD_SIGNALS);
  const pageReasons = collectReasons(text, FREE_PAGE_SIGNALS);
  const eventReasons = collectReasons(text, EVENT_SIGNALS);
  const dataSourceReasons = collectReasons(text, DATA_SOURCE_SIGNALS);
  const styleReasons = collectReasons(text, STYLE_SIGNALS);
  const fixReasons = collectReasons(text, FIX_SIGNALS);

  if (hasSelection && eventReasons.length > 0) {
    return createDecision('add-event-action', 0.82, targetScope, 'event-action-patch', eventReasons);
  }

  if (hasSelection && dataSourceReasons.length > 0) {
    return createDecision('bind-data-source', 0.82, targetScope, 'data-source-patch', dataSourceReasons);
  }

  if (isCrudRequest(input, crudReasons, pageReasons)) {
    return createDecision('crud-page', crudReasons.length >= 2 ? 0.9 : 0.78, 'page', 'crud-generator', crudReasons, true);
  }

  if (eventReasons.length > 0) {
    return createDecision('add-event-action', hasSelection ? 0.82 : 0.68, targetScope, 'event-action-patch', eventReasons);
  }

  if (dataSourceReasons.length > 0) {
    return createDecision('bind-data-source', hasSelection ? 0.82 : 0.72, targetScope, 'data-source-patch', dataSourceReasons);
  }

  if (fixReasons.length > 0) {
    return createDecision('fix-page-issue', hasSelection ? 0.78 : 0.68, targetScope, 'diagnostic-patch', fixReasons);
  }

  if (styleReasons.length > 0) {
    return createDecision('style-polish', hasSelection ? 0.8 : 0.72, targetScope, 'schema-patch', styleReasons);
  }

  if (hasSelection) {
    return createDecision('edit-selected', 0.64, targetScope, 'schema-patch', ['存在当前选中组件，按局部修改处理'], undefined, '未识别到更具体意图，已按选中组件局部修改处理。');
  }

  if (pageReasons.length > 0) {
    return createDecision('free-page', 0.72, 'page', 'schema-draft', pageReasons);
  }

  return createDecision('free-page', 0.45, targetScope, 'schema-draft', ['未命中明确工具意图'], undefined, '请求意图不够明确，已按通用页面/区块生成保守处理。');
}

export function isCrudRouteDecision(decision: AiAgentRouteDecision) {
  return decision.intent === 'crud-page';
}

function isCrudRequest(input: AiAgentRunRequest, crudReasons: string[], pageReasons: string[]) {
  if (crudReasons.length === 0) return false;
  const text = `${input.prompt || ''}\n${input.apiDescription || ''}`.toLowerCase();
  const hasApiOrModel = Boolean(input.dataSourceModel || /\/api\/|https?:\/\/|接口|数据源|\bapi\b/.test(text));
  const hasCrudShape = /crud|增删改查|管理页|管理页面|后台管理|列表|表格|分页|详情|新增|编辑|删除|\badmin\b|\bmanagement\b|\btable\b|\blist\b/i.test(text);
  const marketingOnly = pageReasons.length > 0 && !hasApiOrModel && !/后台|管理|crud|\badmin\b|\bmanagement\b/i.test(text);
  return !marketingOnly && (hasApiOrModel || hasCrudShape);
}

function resolveTargetScope(input: AiAgentRunRequest): AiAgentTargetScope {
  if (input.targetScope) return input.targetScope;
  return input.selectedComponentId ? 'selection' : 'page';
}

function collectReasons(text: string, signals: RouteSignal[]) {
  const reasons = signals
    .filter((signal) => signal.pattern.test(text))
    .map((signal) => signal.reason);
  return Array.from(new Set(reasons));
}

function createDecision(
  intent: AiAgentRouteIntent,
  confidence: number,
  targetScope: AiAgentTargetScope,
  preferredTool: AiAgentPreferredTool,
  reasons: string[],
  deterministic = false,
  fallback?: string,
): AiAgentRouteDecision {
  return {
    intent,
    confidence,
    reasons,
    targetScope,
    preferredTool,
    fallback,
    deterministic,
  };
}
