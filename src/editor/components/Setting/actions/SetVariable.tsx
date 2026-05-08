import { Input, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type { LowcodeAction } from '../../../events/types';
import { formatJson, parseJsonValue } from './utils';

export interface SetVariableProps {
  value?: LowcodeAction;
  onChange?: (config?: LowcodeAction) => void;
}

export function SetVariable({ value, onChange }: SetVariableProps) {
  const action = value?.actionType === 'setVariable' ? value : undefined;
  const [path, setPath] = useState(action?.args.path || '');
  const [valueText, setValueText] = useState(formatJson(action?.args.value));
  const [expression, setExpression] = useState(action?.args.expression || '');
  const [valueError, setValueError] = useState('');

  useEffect(() => {
    setPath(action?.args.path || '');
    setValueText(formatJson(action?.args.value));
    setExpression(action?.args.expression || '');
    setValueError('');
  }, [action]);

  function emit(next = { path, valueText, expression }) {
    const nextPath = next.path.trim();
    if (!nextPath) {
      onChange?.(undefined);
      return;
    }

    const parsedValue = parseJsonValue(next.valueText, '变量值 JSON');
    setValueError(parsedValue.error || '');

    if (parsedValue.error) {
      onChange?.(undefined);
      return;
    }

    onChange?.({
      actionType: 'setVariable',
      args: {
        path: nextPath,
        value: parsedValue.value,
        expression: next.expression.trim() || undefined,
      },
    });
  }

  return <div className="mt-[24px] space-y-[16px]">
    <div>
      <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">变量路径</div>
      <Input
        placeholder="例如 form.keyword 或 table.selectedId"
        value={path}
        onChange={(event) => {
          setPath(event.target.value);
          emit({ path: event.target.value, valueText, expression });
        }}
      />
    </div>
    <div>
      <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">变量值 JSON</div>
      <Input.TextArea
        autoSize={{ minRows: 3, maxRows: 6 }}
        value={valueText}
        status={valueError ? 'error' : undefined}
        placeholder={'例如 "hello"、123、{"name":"Ada"}'}
        onChange={(event) => {
          setValueText(event.target.value);
          emit({ path, valueText: event.target.value, expression });
        }}
      />
      {valueError && <div className="mt-[6px] text-[12px] text-[#dc2626]">{valueError}</div>}
    </div>
    <div>
      <div className="mb-[8px] text-[13px] font-medium text-[#1f2937]">表达式覆盖</div>
      <Input
        placeholder="例如 event.value 或 event.values.keyword"
        value={expression}
        onChange={(event) => {
          setExpression(event.target.value);
          emit({ path, valueText, expression: event.target.value });
        }}
      />
      <Typography.Text type="secondary" className="mt-[6px] block text-[12px] leading-[18px]">
        填写表达式后优先使用表达式结果，支持 event、context、variables、args。
      </Typography.Text>
    </div>
  </div>;
}
