import type { ActionType, LowcodeAction } from '../../events/types';
import type { Component } from '../../stores/components';
import { getComponentById } from '../../stores/components';

export interface ActionCommonControls {
  disabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export function createDefaultAction(actionType: ActionType): LowcodeAction {
  if (actionType === 'url') {
    return {
      actionType: 'url',
      args: {
        url: '',
      },
    };
  }

  if (actionType === 'toast') {
    return {
      actionType: 'toast',
      args: {
        msgType: 'success',
        msg: '',
      },
    };
  }

  if (actionType === 'componentAction') {
    return {
      actionType: 'componentAction',
      componentId: 0,
      args: {
        method: '',
        params: [],
      },
    };
  }

  if (actionType === 'custom') {
    return {
      actionType: 'custom',
      args: {
        script: '',
      },
    };
  }

  if (actionType === 'confirm') {
    return {
      actionType: 'confirm',
      args: {
        title: '确认执行该操作？',
        content: '',
        actions: [],
        cancelActions: [],
      },
    };
  }

  if (actionType === 'condition') {
    return {
      actionType: 'condition',
      args: {
        expression: 'event.value',
        trueActions: [],
        falseActions: [],
      },
    };
  }

  if (actionType === 'http') {
    return {
      actionType: 'http',
      args: {
        url: '',
        method: 'GET',
        auth: 'none',
        errorMsg: '请求失败',
      },
    };
  }

  if (actionType === 'componentControl') {
    return {
      actionType: 'componentControl',
      componentId: 0,
      args: {
        operation: 'show',
      },
    };
  }

  if (actionType === 'setComponentProps') {
    return {
      actionType: 'setComponentProps',
      componentId: 0,
      args: {
        props: {},
      },
    };
  }

  if (actionType === 'setComponentStyles') {
    return {
      actionType: 'setComponentStyles',
      componentId: 0,
      args: {
        styles: {},
      },
    };
  }

  return {
    actionType: 'setVariable',
    args: {
      path: '',
      value: undefined,
    },
  };
}

export function getActionCommonControls(action?: LowcodeAction): ActionCommonControls {
  return {
    disabled: Boolean(action?.disabled),
    preventDefault: Boolean(action?.preventDefault),
    stopPropagation: Boolean(action?.stopPropagation),
  };
}

export function mergeActionConfig(
  config: LowcodeAction,
  previous?: LowcodeAction,
  controls: ActionCommonControls = {},
): LowcodeAction {
  const preserved = previous?.actionType === config.actionType ? previous : undefined;
  const next = {
    ...(preserved || {}),
    ...config,
    args: sanitizeArgs(config.args || {}),
  } as LowcodeAction;

  if (preserved?.id) {
    next.id = preserved.id;
  }

  applyBooleanBaseField(next, 'disabled', controls.disabled);
  applyBooleanBaseField(next, 'preventDefault', controls.preventDefault);
  applyBooleanBaseField(next, 'stopPropagation', controls.stopPropagation);

  if (next.actionType === 'url' && !next.args.blank) {
    delete next.args.blank;
  }

  return next;
}

export function validateActionConfig(action?: LowcodeAction) {
  const errors: string[] = [];

  if (!action) {
    return ['请先选择并配置一个动作'];
  }

  if (action.actionType === 'url' && !action.args.url?.trim()) {
    errors.push('请填写跳转链接');
  }

  if (action.actionType === 'toast' && !action.args.msg?.trim()) {
    errors.push('请填写提示文本');
  }

  if (action.actionType === 'componentAction') {
    if (!action.componentId) errors.push('请选择目标组件');
    if (!action.args.method?.trim()) errors.push('请选择组件方法');
  }

  if (action.actionType === 'custom' && !action.args.script?.trim()) {
    errors.push('请填写自定义 JS');
  }

  if (action.actionType === 'confirm' && !action.args.title?.trim()) {
    errors.push('请填写确认标题');
  }

  if (action.actionType === 'condition' && !action.args.expression?.trim()) {
    errors.push('请填写条件表达式');
  }

  if (action.actionType === 'http' && !action.args.url?.trim()) {
    errors.push('请填写请求地址');
  }

  if (action.actionType === 'componentControl') {
    if (!action.componentId) errors.push('请选择目标组件');
    if (!action.args.operation) errors.push('请选择操作意图');
  }

  if ((action.actionType === 'setComponentProps' || action.actionType === 'setComponentStyles') && !action.componentId) {
    errors.push('请选择目标组件');
  }

  if (action.actionType === 'setVariable' && !action.args.path?.trim()) {
    errors.push('请填写变量路径');
  }

  return errors;
}

export function getActionSummary(action: LowcodeAction, components: Component[] = []) {
  if (action.actionType === 'url') {
    const target = action.args.blank ? '新窗口' : '当前窗口';
    return `${action.args.url || '未配置链接'} / ${target}`;
  }

  if (action.actionType === 'toast') {
    return `${action.args.msgType}：${action.args.msg || '未配置消息内容'}`;
  }

  if (action.actionType === 'custom') {
    return action.args.script || '未配置脚本';
  }

  if (action.actionType === 'confirm') {
    return action.args.title || '未配置确认标题';
  }

  if (action.actionType === 'condition') {
    return action.args.expression || '未配置条件表达式';
  }

  if (action.actionType === 'http') {
    return `${action.args.method || 'GET'} ${action.args.url || '未配置请求地址'}`;
  }

  if (action.actionType === 'setComponentProps' || action.actionType === 'setComponentStyles') {
    const target = getComponentById(action.componentId, components);
    return `${target?.desc || '未选择组件'} / ${action.actionType === 'setComponentProps' ? '属性' : '样式'}`;
  }

  if (action.actionType === 'setVariable') {
    return `${action.args.path || '未配置变量'} = ${action.args.expression || JSON.stringify(action.args.value ?? '')}`;
  }

  if (action.actionType === 'componentControl') {
    const target = getComponentById(action.componentId, components);
    return `${target?.desc || '未选择组件'} / ${formatComponentControlOperation(action.args.operation)}`;
  }

  const target = getComponentById(action.componentId, components);
  return `${target?.desc || '未选择组件'} / ${action.args.method || '未选择方法'}`;
}

function sanitizeArgs(args: Record<string, unknown>) {
  return Object.entries(args).reduce<Record<string, unknown>>((result, [key, value]) => {
    if (value !== undefined) {
      result[key] = value;
    }
    return result;
  }, {});
}

function applyBooleanBaseField(action: LowcodeAction, field: keyof ActionCommonControls, value?: boolean) {
  if (value) {
    action[field] = true;
  } else {
    delete action[field];
  }
}

function formatComponentControlOperation(operation: string) {
  const labels: Record<string, string> = {
    show: '显示',
    hide: '隐藏',
    enable: '启用',
    disable: '禁用',
    setValue: '设置值',
    clearValue: '清空值',
    open: '打开',
    close: '关闭',
    submit: '提交',
    reset: '重置',
  };

  return labels[operation] || operation || '未选择操作';
}
