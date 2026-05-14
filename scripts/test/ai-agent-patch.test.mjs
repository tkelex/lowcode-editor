import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyAiComponentPatch,
  createAiComponentTreeFingerprint,
  createAiRepairPromptFromIssues,
  validateAiComponentPatch,
} from './schema-test-utils.mjs';

function createPage() {
  return [
    {
      id: 1,
      name: 'Page',
      props: {},
      desc: '页面',
      children: [
        {
          id: 2,
          name: 'Card',
          props: { title: '用户管理' },
          desc: '卡片',
          parentId: 1,
          children: [
            {
              id: 3,
              name: 'Text',
              props: { text: '欢迎' },
              desc: '文本',
              parentId: 2,
            },
          ],
        },
      ],
    },
  ];
}

describe('ai agent patch helpers', () => {
  it('applies prop and child patches without mutating the source tree', () => {
    const components = createPage();
    const result = applyAiComponentPatch(components, {
      operations: [
        {
          type: 'updateProps',
          componentId: 2,
          props: { title: '客户管理' },
        },
        {
          type: 'addChild',
          parentId: 2,
          component: {
            id: 4,
            name: 'Button',
            props: { text: '新增客户' },
            desc: '新增按钮',
          },
        },
      ],
    });

    assert.equal(result.valid, true);
    assert.equal(result.components[0].children[0].props.title, '客户管理');
    assert.equal(result.components[0].children[0].children[1].parentId, 2);
    assert.equal(components[0].children[0].props.title, '用户管理');
  });

  it('rejects stale candidates', () => {
    const components = createPage();
    const result = validateAiComponentPatch(components, {
      baselineFingerprint: 'old',
      operations: [
        {
          type: 'updateProps',
          componentId: 2,
          props: { title: '客户管理' },
        },
      ],
    });

    assert.equal(result.valid, false);
    assert.equal(result.errors[0].code, 'AI_AGENT_STALE_CANDIDATE');
  });

  it('rejects missing targets', () => {
    const result = applyAiComponentPatch(createPage(), {
      operations: [
        {
          type: 'updateProps',
          componentId: 999,
          props: { title: '不存在' },
        },
      ],
    });

    assert.equal(result.valid, false);
    assert.equal(result.errors[0].code, 'AI_AGENT_PATCH_TARGET_MISSING');
  });

  it('rejects invalid parent-child relations after patching', () => {
    const result = applyAiComponentPatch(createPage(), {
      operations: [
        {
          type: 'addChild',
          parentId: 3,
          component: {
            id: 4,
            name: 'TableColumn',
            props: {},
            desc: '非法列',
          },
        },
      ],
    });

    assert.equal(result.valid, false);
    assert.match(result.errors.map((error) => error.message).join('\n'), /不接收子组件|不能放在/);
  });

  it('rejects custom actions in patched candidates', () => {
    const result = applyAiComponentPatch(createPage(), {
      operations: [
        {
          type: 'updateProps',
          componentId: 3,
          props: {
            onEvent: {
              click: {
                actions: [
                  {
                    actionType: 'custom',
                    args: { script: 'alert(1)' },
                  },
                ],
              },
            },
          },
        },
      ],
    });

    assert.equal(result.valid, false);
    assert.equal(result.errors.at(-1).code, 'AI_CUSTOM_ACTION_FORBIDDEN');
  });

  it('creates stable fingerprints and repair prompts', () => {
    const components = createPage();
    assert.equal(createAiComponentTreeFingerprint(components), createAiComponentTreeFingerprint(createPage()));

    const prompt = createAiRepairPromptFromIssues([
      {
        severity: 'error',
        code: 'AI_TEST',
        message: '测试错误',
        path: '[0]',
      },
    ]);

    assert.match(prompt, /AI_TEST/);
    assert.match(prompt, /测试错误/);
  });
});
