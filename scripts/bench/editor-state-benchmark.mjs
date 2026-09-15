import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sizes = readNumberList('--sizes', [500, 1000]);
const iterations = readPositiveInteger('--iterations', 5);
const shouldAssert = process.argv.includes('--assert');

const bundle = await buildBenchmarkBundle();
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (error) => console.error(`benchmark page error: ${error.stack || error.message}`));
  await page.setContent('<!doctype html><html><body><div id="root"></div></body></html>');
  await page.addScriptTag({ content: bundle });

  const browserVersion = browser.version();
  const results = {};
  for (const size of sizes) {
    results[size] = await page.evaluate(
      async ({ fixtureSize, sampleCount }) => globalThis.runEditorStateBenchmark(fixtureSize, sampleCount),
      { fixtureSize: size, sampleCount: iterations },
    );
  }

  const report = {
    environment: {
      timestamp: new Date().toISOString(),
      platform: `${os.platform()} ${os.release()} ${os.arch()}`,
      cpu: os.cpus()[0]?.model || 'unknown',
      logicalCpus: os.cpus().length,
      memoryGb: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
      node: process.version,
      browser: `Chromium ${browserVersion}`,
      viewport: '1440x900',
      iterations,
    },
    results,
  };

  console.log(JSON.stringify(report, null, 2));

  if (shouldAssert) {
    const failures = [];
    for (const size of sizes) {
      const selection = results[size].selection.median;
      if (selection.nodeRenders !== 0) {
        failures.push(`${size} 节点：切换选中节点触发了 ${selection.nodeRenders} 次画布节点渲染`);
      }
      if (selection.dropTargetRenders !== 0) {
        failures.push(`${size} 节点：切换选中节点触发了 ${selection.dropTargetRenders} 次拖放订阅渲染`);
      }
      for (const operation of ['props', 'styles', 'undo', 'redo']) {
        const nodeRenders = results[size][operation].median.nodeRenders;
        if (nodeRenders > 3) {
          failures.push(`${size} 节点：${operation} 触发了 ${nodeRenders} 次节点渲染，预期不超过目标节点及祖先链的 3 次`);
        }
      }
      const moveNodeRenders = results[size].move.median.nodeRenders;
      if (moveNodeRenders > 4) {
        failures.push(`${size} 节点：move 触发了 ${moveNodeRenders} 次节点渲染，预期不超过移动节点与两侧祖先链的 4 次`);
      }
      for (const operation of ['selection', 'props', 'styles', 'move', 'undo', 'redo']) {
        const dropTargetRenders = results[size][operation].median.dropTargetRenders;
        if (dropTargetRenders !== 0) {
          failures.push(`${size} 节点：${operation} 触发了 ${dropTargetRenders} 次无关拖放订阅渲染`);
        }
      }
    }

    if (failures.length > 0) {
      throw new Error(`编辑器订阅性能断言失败：\n${failures.join('\n')}`);
    }
  }
} finally {
  await browser.close();
}

async function buildBenchmarkBundle() {
  const result = await build({
    stdin: {
      contents: benchmarkEntrySource(),
      loader: 'tsx',
      resolveDir: repositoryRoot,
      sourcefile: 'editor-state-benchmark-entry.tsx',
    },
    bundle: true,
    define: {
      'process.env.NODE_ENV': '"development"',
    },
    format: 'iife',
    jsx: 'automatic',
    loader: {
      '.css': 'empty',
    },
    platform: 'browser',
    write: false,
  });

  const javascript = result.outputFiles.find((file) => !file.path.endsWith('.css'));
  if (!javascript) {
    throw new Error('无法生成编辑器状态基准浏览器 bundle');
  }
  return javascript.text;
}

function benchmarkEntrySource() {
  return String.raw`
    import React, { Profiler } from 'react';
    import { createRoot } from 'react-dom/client';
    import { flushSync } from 'react-dom';
    import { DndProvider } from 'react-dnd';
    import { HTML5Backend } from 'react-dnd-html5-backend';
    import { EditArea } from './apps/editor-web/src/features/editor/components/EditArea';
    import { useMaterialDrop } from './apps/editor-web/src/features/editor/hooks/useMaterialDrop';
    import { useComponentConfigStore } from './apps/editor-web/src/features/editor/registry/component-registry-store';
    import { useComponentsStore } from './apps/editor-web/src/features/editor/stores/editor-store';

    const counters = {
      nodeRenders: 0,
      dropTargetRenders: 0,
      profilerCommits: 0,
      profilerDuration: 0,
    };

    function BenchmarkNode({ id, children, text, styles }) {
      counters.nodeRenders += 1;
      return <div data-component-id={id} style={styles}>{text}{children}</div>;
    }

    function DropTargetProbe({ id }) {
      counters.dropTargetRenders += 1;
      useMaterialDrop(['BenchmarkLeaf', 'BenchmarkContainer'], id);
      return null;
    }

    function BenchmarkApp() {
      return (
        <DndProvider backend={HTML5Backend}>
          <Profiler
            id="edit-area"
            onRender={(_id, _phase, actualDuration) => {
              counters.profilerCommits += 1;
              counters.profilerDuration += actualDuration;
            }}
          >
            <EditArea />
          </Profiler>
          <DropTargetProbe id={2} />
        </DndProvider>
      );
    }

    for (const [name, acceptsChildren] of [
      ['Page', true],
      ['BenchmarkContainer', true],
      ['BenchmarkLeaf', false],
    ]) {
      useComponentConfigStore.getState().registerComponent(name, {
        name,
        desc: name,
        defaultProps: {},
        dev: BenchmarkNode,
        acceptsChildren,
      });
    }

    const root = createRoot(document.getElementById('root'));
    flushSync(() => root.render(<BenchmarkApp />));

    window.runEditorStateBenchmark = async (fixtureSize, sampleCount) => {
      const operations = ['selection', 'props', 'styles', 'move', 'undo', 'redo'];
      const samples = Object.fromEntries(operations.map((operation) => [operation, []]));

      for (let index = 0; index < sampleCount; index += 1) {
        for (const operation of operations) {
          resetFixture(fixtureSize);
          prepareOperation(operation, index);
          await settle();
          resetCounters();

          const startedAt = performance.now();
          flushSync(() => runOperation(operation, index));
          const actionDuration = performance.now() - startedAt;
          await settle();

          samples[operation].push({
            actionDurationMs: round(actionDuration),
            profilerDurationMs: round(counters.profilerDuration),
            profilerCommits: counters.profilerCommits,
            nodeRenders: counters.nodeRenders,
            dropTargetRenders: counters.dropTargetRenders,
          });
        }
      }

      return {
        mountedNodes: document.querySelectorAll('[data-component-id]').length,
        ...Object.fromEntries(operations.map((operation) => [operation, {
          samples: samples[operation],
          median: medianSample(samples[operation]),
        }])),
      };
    };

    function resetFixture(size) {
      flushSync(() => {
        useComponentsStore.getState().setComponents(createFixture(size), { recordHistory: false });
        useComponentsStore.getState().setCurComponentId(4);
      });
    }

    function prepareOperation(operation, iteration) {
      const store = useComponentsStore.getState();
      if (operation === 'undo' || operation === 'redo') {
        flushSync(() => store.updateComponentProps(4, { text: 'history-' + iteration }));
      }
      if (operation === 'redo') {
        flushSync(() => useComponentsStore.getState().undo());
      }
    }

    function runOperation(operation, iteration) {
      const store = useComponentsStore.getState();
      if (operation === 'selection') store.setCurComponentId(5);
      if (operation === 'props') store.updateComponentProps(4, { text: 'props-' + iteration });
      if (operation === 'styles') store.updateComponentStyles(4, { color: iteration % 2 ? '#1677ff' : '#0f172a' });
      if (operation === 'move') store.moveComponent(4, 3);
      if (operation === 'undo') store.undo();
      if (operation === 'redo') store.redo();
    }

    function createFixture(size) {
      const leafCount = Math.max(2, size - 3);
      const splitIndex = Math.ceil(leafCount / 2);
      const leaves = Array.from({ length: leafCount }, (_, index) => ({
        id: index + 4,
        name: 'BenchmarkLeaf',
        desc: '基准节点 ' + (index + 1),
        parentId: index < splitIndex ? 2 : 3,
        props: { text: '节点 ' + (index + 1) },
      }));

      return [{
        id: 1,
        name: 'Page',
        desc: '页面',
        props: {},
        children: [
          {
            id: 2,
            name: 'BenchmarkContainer',
            desc: '容器 A',
            parentId: 1,
            props: {},
            children: leaves.slice(0, splitIndex),
          },
          {
            id: 3,
            name: 'BenchmarkContainer',
            desc: '容器 B',
            parentId: 1,
            props: {},
            children: leaves.slice(splitIndex),
          },
        ],
      }];
    }

    function resetCounters() {
      counters.nodeRenders = 0;
      counters.dropTargetRenders = 0;
      counters.profilerCommits = 0;
      counters.profilerDuration = 0;
    }

    function medianSample(samples) {
      const result = {};
      for (const key of Object.keys(samples[0])) {
        const values = samples.map((sample) => sample[key]).sort((left, right) => left - right);
        result[key] = values[Math.floor(values.length / 2)];
      }
      return result;
    }

    function settle() {
      return new Promise((resolve) => requestAnimationFrame(() => resolve()));
    }

    function round(value) {
      return Math.round(value * 1000) / 1000;
    }
  `;
}

function readNumberList(flag, fallback) {
  const value = readArgument(flag);
  if (!value) return fallback;
  const parsed = value.split(',').map(Number).filter((item) => Number.isInteger(item) && item >= 4);
  if (parsed.length === 0) throw new Error(`${flag} 至少需要一个不小于 4 的整数`);
  return parsed;
}

function readPositiveInteger(flag, fallback) {
  const value = readArgument(flag);
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${flag} 必须是正整数`);
  return parsed;
}

function readArgument(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
