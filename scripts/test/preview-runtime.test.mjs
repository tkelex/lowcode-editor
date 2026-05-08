import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);

describe('preview runtime rendering', () => {
  it('renders key built-in materials without crashing or dropping child config', async () => {
    const { Preview } = await loadPreviewRuntime();
    const warnings = [];
    const originalError = console.error;

    console.error = (...args) => {
      warnings.push(args.map(String).join(' '));
    };

    try {
      const html = renderToString(React.createElement(Preview, {
        allowCustomJS: false,
        components: createPreviewRegressionComponents(),
      }));

      assert.match(html, /请输入/);
      assert.match(html, /请选择/);
      assert.match(html, /姓名/);
      assert.match(html, /ant-table/);
      assert.match(html, /P3 链接/);
      assert.match(html, /多行内容/);
      assert.match(html, /单选一/);
      assert.match(html, /详情信息/);
      assert.match(html, /新增用户/);
      assert.match(html, /月度趋势/);
      assert.equal(warnings.some((warning) => warning.includes('Each child in a list should have a unique "key" prop')), false);
      assert.equal(warnings.some((warning) => warning.includes('destroyOnClose')), false);
    } finally {
      console.error = originalError;
    }
  });
});

async function loadPreviewRuntime() {
  const outdir = path.resolve('node_modules/.tmp/lowcode-preview-runtime-test');
  await mkdir(outdir, { recursive: true });

  const outfile = path.join(outdir, `preview-${Date.now()}-${Math.random().toString(16).slice(2)}.cjs`);
  const result = await build({
    entryPoints: ['src/editor/runtime/Preview/index.tsx'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    jsx: 'automatic',
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    define: {
      'import.meta.env.VITE_API_BASE_URL': '"http://localhost:3000/api"',
    },
  });

  await writeFile(outfile, result.outputFiles[0].text, 'utf8');
  return require(outfile);
}

function createPreviewRegressionComponents() {
  return [
    {
      id: 1,
      name: 'Page',
      props: {},
      desc: '页面',
      children: [
        {
          id: 2,
          parentId: 1,
          name: 'Input',
          desc: '输入框',
          props: {
            placeholder: '请输入',
            defaultValue: 'hello',
          },
        },
        {
          id: 3,
          parentId: 1,
          name: 'Select',
          desc: '下拉框',
          props: {
            placeholder: '请选择',
            optionsText: '选项一,选项二',
          },
        },
        {
          id: 4,
          parentId: 1,
          name: 'Switch',
          desc: '开关',
          props: {
            checked: true,
          },
        },
        {
          id: 5,
          parentId: 1,
          name: 'Form',
          desc: '表单',
          props: {},
          children: [
            {
              id: 6,
              parentId: 5,
              name: 'FormItem',
              desc: '表单项',
              props: {
                name: 'name',
                label: '姓名',
                type: 'input',
                rules: 'required',
              },
            },
          ],
        },
        {
          id: 7,
          parentId: 1,
          name: 'Table',
          desc: '表格',
          props: {},
          children: [
            {
              id: 8,
              parentId: 7,
              name: 'TableColumn',
              desc: '表格列',
              props: {
                title: '姓名',
                dataIndex: 'name',
              },
            },
          ],
        },
        {
          id: 9,
          parentId: 1,
          name: 'Modal',
          desc: '弹窗',
          props: {
            title: '弹窗',
          },
          children: [
            {
              id: 10,
              parentId: 9,
              name: 'Button',
              desc: '按钮',
              props: {
                text: '确定',
              },
            },
          ],
        },
        {
          id: 11,
          parentId: 1,
          name: 'Link',
          desc: '链接',
          props: {
            text: 'P3 链接',
            href: 'https://example.com',
            target: '_blank',
          },
        },
        {
          id: 12,
          parentId: 1,
          name: 'Textarea',
          desc: '多行输入',
          props: {
            placeholder: '多行内容',
            rows: 3,
          },
        },
        {
          id: 13,
          parentId: 1,
          name: 'Radio',
          desc: '单选框',
          props: {
            optionsText: '单选一,单选二',
            defaultValue: '单选一',
          },
        },
        {
          id: 14,
          parentId: 1,
          name: 'Checkbox',
          desc: '多选框',
          props: {
            optionsText: '多选一,多选二',
            defaultValue: '多选一',
          },
        },
        {
          id: 15,
          parentId: 1,
          name: 'DatePicker',
          desc: '日期选择',
          props: {
            placeholder: '选择日期',
          },
        },
        {
          id: 16,
          parentId: 1,
          name: 'Rate',
          desc: '评分',
          props: {
            defaultValue: 4,
          },
        },
        {
          id: 17,
          parentId: 1,
          name: 'Tabs',
          desc: '标签页',
          props: {
            itemsText: '概览:概览内容\n详情:详情内容',
          },
        },
        {
          id: 18,
          parentId: 1,
          name: 'Descriptions',
          desc: '描述列表',
          props: {
            title: '详情信息',
            pairsText: '姓名:Ada\n角色:Admin',
          },
        },
        {
          id: 19,
          parentId: 1,
          name: 'Statistic',
          desc: '统计数值',
          props: {
            title: '新增用户',
            value: 128,
          },
        },
        {
          id: 20,
          parentId: 1,
          name: 'Chart',
          desc: '图表',
          props: {
            title: '月度趋势',
            dataText: '一月:10\n二月:20',
          },
        },
        {
          id: 21,
          parentId: 1,
          name: 'Result',
          desc: '结果页',
          props: {
            status: 'success',
            title: '操作成功',
          },
        },
      ],
    },
  ];
}
