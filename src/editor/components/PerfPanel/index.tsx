import { Button, Card, Divider, Drawer, Flex, Segmented, Space, Switch, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { Component, useComponetsStore } from '../../stores/components';
import {
  clearZustandPerfSamples,
  setZustandPerfEnabled,
  setZustandPerfPhase,
  useZustandPerfSnapshot,
} from '../../perf/zustandPerf';

function formatMs(value: number) {
  return `${value.toFixed(2)} ms`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : '-'}${Math.abs(value).toFixed(2)}%`;
}

function collectComponentIds(components: Component[]): number[] {
  const ids: number[] = [];

  function dfs(list: Component[]) {
    list.forEach((item) => {
      ids.push(item.id);
      if (item.children?.length) {
        dfs(item.children);
      }
    });
  }

  dfs(components);
  return ids;
}

function buildFixedWorkloadIds(ids: number[], targetSize: number): number[] {
  if (ids.length === 0 || targetSize <= 0) {
    return [];
  }

  const result: number[] = [];
  for (let i = 0; i < targetSize; i += 1) {
    result.push(ids[i % ids.length]);
  }
  return result;
}

function createBenchmarkScene(totalCount: number): Component[] {
  const safeTotal = Math.max(2, totalCount);
  const page: Component = {
    id: 1,
    name: 'Page',
    props: {
      title: `Benchmark ${safeTotal}`,
    },
    desc: '页面',
    children: [],
  };

  let nextId = 2;
  const containerCount = Math.max(1, Math.floor((safeTotal - 1) / 10));

  for (let i = 0; i < containerCount && nextId <= safeTotal; i += 1) {
    const containerId = nextId;
    nextId += 1;

    const container: Component = {
      id: containerId,
      name: 'Container',
      props: {},
      desc: `容器-${i + 1}`,
      parentId: 1,
      children: [],
    };

    for (let j = 0; j < 9 && nextId <= safeTotal; j += 1) {
      const buttonId = nextId;
      nextId += 1;
      container.children?.push({
        id: buttonId,
        name: 'Button',
        props: {
          text: `按钮-${buttonId}`,
          type: j % 2 === 0 ? 'primary' : 'default',
        },
        desc: `按钮-${buttonId}`,
        parentId: containerId,
      });
    }

    page.children?.push(container);
  }

  return [page];
}

function toTimestampText(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  const ss = `${date.getSeconds()}`.padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function toFileTimestamp(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const hh = `${date.getHours()}`.padStart(2, '0');
  const mm = `${date.getMinutes()}`.padStart(2, '0');
  const ss = `${date.getSeconds()}`.padStart(2, '0');
  return `${y}${m}${d}-${hh}${mm}${ss}`;
}

export function PerfPanel() {
  const [open, setOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [sceneSize, setSceneSize] = useState<number>(collectComponentIds(useComponetsStore.getState().components).length);
  const perf = useZustandPerfSnapshot();

  const reductionText = useMemo(() => {
    if (!perf.baselineStats.count || !perf.currentStats.count) {
      return '请先在 基线 与 当前 两个阶段分别采样。';
    }

    const from = perf.baselineStats.avgLatencyMs;
    const to = perf.currentStats.avgLatencyMs;
    const reduced = from - to;
    const percent = from > 0 ? (reduced / from) * 100 : 0;

    if (Math.abs(percent) < 1) {
      return `更新延迟从 ${formatMs(from)} 变化到 ${formatMs(to)}，整体基本持平（${percent >= 0 ? '+' : '-'}${Math.abs(percent).toFixed(2)}%）。`;
    }

    if (percent > 0) {
      return `更新延迟从 ${formatMs(from)} 降低到 ${formatMs(to)}，下降 ${Math.abs(percent).toFixed(2)}%。`;
    }

    return `更新延迟从 ${formatMs(from)} 变化到 ${formatMs(to)}，上升 ${Math.abs(percent).toFixed(2)}%。`;
  }, [perf.baselineStats, perf.currentStats]);

  const waitForNextFrame = () => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  };

  const loadBenchmarkScene = (size: number) => {
    const nextComponents = createBenchmarkScene(size);
    useComponetsStore.setState({
      components: nextComponents,
      curComponentId: null,
      curComponent: null,
      mode: 'edit',
    });
    setSceneSize(size);
  };

  const runLightBenchmark = async () => {
    setIsRunning(true);

    const state = useComponetsStore.getState();
    const componentId = state.curComponentId ?? state.components?.[0]?.id;

    if (!componentId) {
      setIsRunning(false);
      return;
    }

    for (let i = 0; i < 40; i += 1) {
      useComponetsStore
        .getState()
        .updateComponentProps(componentId, { __perf_benchmark_tick__: i });

      await waitForNextFrame();
    }

    setIsRunning(false);
  };

  const runBatchBenchmark = async () => {
    setIsRunning(true);

    const state = useComponetsStore.getState();
    const allIds = collectComponentIds(state.components);
    const targetIds = buildFixedWorkloadIds(allIds, 12);

    if (targetIds.length === 0) {
      setIsRunning(false);
      return;
    }

    let seq = 0;
    for (let round = 0; round < 20; round += 1) {
      for (const id of targetIds) {
        seq += 1;
        useComponetsStore.getState().updateComponentProps(id, {
          __perf_batch_round__: round,
          __perf_batch_seq__: seq,
          __perf_batch_text__: `round-${round}-component-${id}`,
        });

        await waitForNextFrame();
      }
    }

    setIsRunning(false);
  };

  const exportMarkdownReport = () => {
    const now = new Date();
    const from = perf.baselineStats.avgLatencyMs;
    const to = perf.currentStats.avgLatencyMs;
    const deltaPercent = from > 0 ? ((from - to) / from) * 100 : 0;
    const trendText = Math.abs(deltaPercent) < 1
      ? '基本持平'
      : deltaPercent > 0
        ? '性能提升'
        : '性能下降';

    const markdown = [
      '# Zustand 渲染性能报告',
      '',
      `- 导出时间: ${toTimestampText(now)}`,
      `- 场景规模: ${sceneSize} 组件`,
      `- 样本结论: ${trendText}（${formatPercent(deltaPercent)}）`,
      `- 首屏渲染耗时（latest/avg/p95）: ${formatMs(perf.firstRenderStats.latestMs)} / ${formatMs(perf.firstRenderStats.avgMs)} / ${formatMs(perf.firstRenderStats.p95Ms)}`,
      '',
      '## 指标对比',
      '',
      '| 指标 | 基线 | 当前 |',
      '| --- | --- | --- |',
      `| 样本数 | ${perf.baselineStats.count} | ${perf.currentStats.count} |`,
      `| 平均更新延迟 | ${formatMs(perf.baselineStats.avgLatencyMs)} | ${formatMs(perf.currentStats.avgLatencyMs)} |`,
      `| P95 更新延迟 | ${formatMs(perf.baselineStats.p95LatencyMs)} | ${formatMs(perf.currentStats.p95LatencyMs)} |`,
      `| 平均渲染耗时 | ${formatMs(perf.baselineStats.avgRenderDurationMs)} | ${formatMs(perf.currentStats.avgRenderDurationMs)} |`,
      '',
      '## 首屏渲染耗时',
      '',
      '| 指标 | 数值 |',
      '| --- | --- |',
      `| 样本数 | ${perf.firstRenderStats.count} |`,
      `| latest | ${formatMs(perf.firstRenderStats.latestMs)} |`,
      `| avg | ${formatMs(perf.firstRenderStats.avgMs)} |`,
      `| p95 | ${formatMs(perf.firstRenderStats.p95Ms)} |`,
      '',
      '## 自动结论',
      '',
      `- 更新延迟变化: ${formatPercent(deltaPercent)}`,
      `- 解释: ${trendText}`,
      '',
      '## 简历可用描述（示例）',
      '',
      `- 在 ${sceneSize} 组件批量更新场景下，构建 Zustand + React Profiler 量化体系，基于基线/当前双阶段采样输出平均值与 P95 指标。`,
      `- 结果显示平均更新延迟变化 ${formatPercent(deltaPercent)}，并据此定位优化收益与瓶颈环节。`,
      '',
    ].join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zustand-perf-report-${toFileTimestamp(now)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>渲染性能</Button>
      <Drawer
        title='Zustand 渲染性能量化'
        width={760}
        onClose={() => setOpen(false)}
        open={open}
      >
        <Flex justify='space-between' align='center'>
          <Segmented
            value={perf.phase}
            options={[
              { label: '基线采样', value: 'baseline' },
              { label: '当前采样', value: 'current' },
            ]}
            onChange={(value) => setZustandPerfPhase(value as 'baseline' | 'current')}
          />
          <Space>
            <span>采样开关</span>
            <Switch
              checked={perf.enabled}
              onChange={(checked) => setZustandPerfEnabled(checked)}
            />
          </Space>
        </Flex>

        <Divider />

        <Flex gap={12}>
          <Card title='基线统计' style={{ flex: 1 }}>
            <div>样本数: {perf.baselineStats.count}</div>
            <div>平均更新延迟: {formatMs(perf.baselineStats.avgLatencyMs)}</div>
            <div>P95 更新延迟: {formatMs(perf.baselineStats.p95LatencyMs)}</div>
            <div>平均渲染耗时: {formatMs(perf.baselineStats.avgRenderDurationMs)}</div>
          </Card>
          <Card title='当前统计' style={{ flex: 1 }}>
            <div>样本数: {perf.currentStats.count}</div>
            <div>平均更新延迟: {formatMs(perf.currentStats.avgLatencyMs)}</div>
            <div>P95 更新延迟: {formatMs(perf.currentStats.p95LatencyMs)}</div>
            <div>平均渲染耗时: {formatMs(perf.currentStats.avgRenderDurationMs)}</div>
          </Card>
          <Card title='首屏渲染耗时' style={{ flex: 1 }}>
            <div>样本数: {perf.firstRenderStats.count}</div>
            <div>latest: {formatMs(perf.firstRenderStats.latestMs)}</div>
            <div>avg: {formatMs(perf.firstRenderStats.avgMs)}</div>
            <div>P95: {formatMs(perf.firstRenderStats.p95Ms)}</div>
          </Card>
        </Flex>

        <Card style={{ marginTop: 12 }}>
          <Typography.Text strong>{reductionText}</Typography.Text>
          <br />
          <Typography.Text type='secondary'>
            建议优先使用多组件批量更新压测，它更接近真实编辑器场景，更容易体现优化前后差异。
          </Typography.Text>
          <br />
          <Typography.Text type='secondary'>当前场景规模: {sceneSize} 组件</Typography.Text>
        </Card>

        <Space style={{ marginTop: 12 }}>
          <Button disabled={isRunning} onClick={() => loadBenchmarkScene(100)}>生成 100 组件场景</Button>
          <Button disabled={isRunning} onClick={() => loadBenchmarkScene(300)}>生成 300 组件场景</Button>
          <Button disabled={isRunning} onClick={exportMarkdownReport}>导出 Markdown 报告</Button>
        </Space>

        <Space style={{ marginTop: 12 }}>
          <Button loading={isRunning} onClick={runLightBenchmark}>执行 40 次单组件压测</Button>
          <Button loading={isRunning} onClick={runBatchBenchmark}>执行多组件批量压测（固定 240 次）</Button>
          <Button danger onClick={clearZustandPerfSamples}>清空采样</Button>
        </Space>

        <Divider />

        <Table
          rowKey='id'
          size='small'
          pagination={{ pageSize: 8 }}
          dataSource={perf.latestSamples}
          columns={[
            {
              title: '阶段',
              dataIndex: 'phase',
              render: (phase: 'baseline' | 'current') => (
                <Tag color={phase === 'baseline' ? 'gold' : 'green'}>
                  {phase === 'baseline' ? '基线' : '当前'}
                </Tag>
              ),
            },
            {
              title: 'Action',
              dataIndex: 'action',
            },
            {
              title: '更新延迟',
              dataIndex: 'latencyMs',
              render: (value: number) => formatMs(value),
            },
            {
              title: '渲染耗时',
              dataIndex: 'renderDurationMs',
              render: (value: number) => formatMs(value),
            },
          ]}
        />
      </Drawer>
    </>
  );
}
