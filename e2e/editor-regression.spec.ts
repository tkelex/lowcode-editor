import { expect, test, type Page, type Route } from '@playwright/test';

const now = '2026-05-11T00:00:00.000Z';
const user = {
  id: 1,
  email: 'editor-regression@example.com',
  username: 'editor-regression',
  role: 'admin',
  status: 'active',
};
const project = {
  id: 10,
  ownerId: user.id,
  name: '编辑器回归项目',
  description: '用于自动复盘编辑器核心交互',
  status: 'active',
  currentUserRole: 'owner',
  createdAt: now,
  updatedAt: now,
};
const pageRecord = {
  id: 20,
  projectId: project.id,
  createdById: user.id,
  name: '编辑器回归页面',
  routePath: '/editor-regression',
  isPublished: false,
  publicId: null,
  publishedAt: null,
  publishedVersionId: null,
  createdAt: now,
  updatedAt: now,
  schema: {
    components: [
      {
        id: 1,
        name: 'Page',
        props: {},
        desc: '页面',
        children: [
          {
            id: 1001,
            name: 'Container',
            desc: '容器',
            parentId: 1,
            props: {
              onEvent: {
                click: {
                  actions: [
                    { actionType: 'toast', args: { msgType: 'success', msg: '点击成功' } },
                    { actionType: 'url', args: { url: 'https://baidu.com', target: '_blank' } },
                  ],
                },
              },
            },
            styles: {
              width: '100%',
              minHeight: 160,
              padding: 16,
            },
            children: [
              {
                id: 1003,
                name: 'Button',
                desc: '按钮',
                parentId: 1001,
                props: {
                  text: '按钮',
                  type: 'primary',
                },
                styles: {},
              },
              {
                id: 1002,
                name: 'Input',
                desc: '输入框',
                parentId: 1001,
                props: {
                  placeholder: '请输入内容',
                },
                styles: {},
              },
              {
                id: 1004,
                name: 'Switch',
                desc: '开关',
                parentId: 1001,
                props: {
                  checked: true,
                  checkedChildren: '开',
                  unCheckedChildren: '关',
                },
                styles: {
                  width: '96px',
                  backgroundColor: 'rgb(220, 38, 38)',
                },
              },
              {
                id: 1005,
                name: 'Alert',
                desc: '提示',
                parentId: 1001,
                props: {
                  type: 'info',
                  message: '巡检提示',
                  description: '样式应作用到真实 Alert',
                  showIcon: true,
                },
                styles: {
                  width: '360px',
                  padding: '18px',
                  backgroundColor: 'rgb(254, 249, 195)',
                },
              },
              {
                id: 1006,
                name: 'Textarea',
                desc: '多行输入',
                parentId: 1001,
                props: {
                  placeholder: '多行输入',
                  defaultValue: '巡检文本',
                  rows: 2,
                },
                styles: {
                  width: '310px',
                  padding: '15px',
                  fontSize: '18px',
                },
              },
              {
                id: 1007,
                name: 'DatePicker',
                desc: '日期选择',
                parentId: 1001,
                props: {
                  placeholder: '选择日期',
                },
                styles: {
                  width: '240px',
                  padding: '14px',
                },
              },
              {
                id: 1008,
                name: 'Upload',
                desc: '上传',
                parentId: 1001,
                props: {
                  buttonText: '上传文件',
                },
                styles: {
                  width: '180px',
                  padding: '16px',
                  color: 'rgb(220, 38, 38)',
                },
              },
              {
                id: 1009,
                name: 'Popover',
                desc: '气泡卡片',
                parentId: 1001,
                props: {
                  title: '气泡标题',
                  content: '气泡内容',
                  text: '打开气泡卡片',
                },
                styles: {
                  width: '190px',
                  padding: '13px',
                  color: 'rgb(37, 99, 235)',
                },
              },
              {
                id: 1010,
                name: 'Notification',
                desc: '通知',
                parentId: 1001,
                props: {
                  type: 'info',
                  title: '通知标题',
                  buttonText: '显示通知',
                },
                styles: {
                  width: '180px',
                  padding: '12px',
                  color: 'rgb(22, 163, 74)',
                },
              },
            ],
          },
        ],
      },
    ],
  },
};

const longPageRecord = {
  ...pageRecord,
  id: 21,
  schema: {
    components: [
      {
        id: 1,
        name: 'Page',
        props: {},
        desc: '页面',
        children: Array.from({ length: 7 }, (_, index) => ({
          id: 2001 + index,
          name: 'Container',
          desc: '容器',
          parentId: 1,
          props: {},
          styles: {
            width: '100%',
            minHeight: 180,
            marginBottom: 16,
            padding: 16,
          },
        })),
      },
    ],
  },
};

test('editor setting panel stays readable and preview remains recoverable', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await page.getByRole('button', { name: '打开编辑器' }).click();
  await expect(page.getByText('属性')).toBeVisible();

  const container = page.locator('[data-component-id="1001"]').first();
  await expect(container).toBeVisible();
  await container.click();

  const settingPanel = page.locator('.setting-panel');
  await expect(settingPanel).toBeVisible();
  await expect(settingPanel.locator('.setting-component-title')).toHaveText('容器');
  await expect(settingPanel.locator('.setting-component-subtitle')).toContainText('Container');
  await expect(settingPanel.locator('.setting-component-id')).toHaveText('#1001');

  await expectNoHorizontalOverflow(page, '.setting-panel');
  await expectNoHorizontalOverflow(page, '.edit-area');

  await page.getByRole('tab', { name: '事件' }).click();
  await expect(settingPanel.getByText('点击事件')).toBeVisible();
  await expect(settingPanel.getByText('事件数据')).toBeVisible();
  await expectNoHorizontalOverflow(page, '.setting-panel');

  await page.getByRole('button', { name: '预览' }).click();
  await expect(page.getByRole('button', { name: '退出预览' })).toBeVisible();
  await expect(page.getByPlaceholder('请输入内容')).toBeVisible();

  await page.getByRole('button', { name: '退出预览' }).click();
  await expect(settingPanel).toBeVisible();
});

test('editor context menu only opens for editable components and closes on blank canvas click', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await page.getByRole('button', { name: '打开编辑器' }).click();

  const component = page.locator('[data-component-id="1001"]').first();
  await expect(component).toBeVisible();
  await component.click({ button: 'right' });

  const contextMenu = page.locator('.ant-dropdown:not(.ant-dropdown-hidden)');
  await expect(contextMenu).toBeVisible();
  await expect(contextMenu.locator('.ant-dropdown-menu-item-disabled')).toHaveCount(0);

  const firstBox = await contextMenu.boundingBox();
  expect(firstBox).not.toBeNull();

  const inputComponent = page.locator('[data-component-id="1002"]').first();
  await inputComponent.click({ button: 'right' });
  await expect(contextMenu).toBeVisible();
  await expect(settingPanelLocator(page).locator('.setting-component-id')).toHaveText('#1002');

  const secondBox = await contextMenu.boundingBox();
  expect(secondBox).not.toBeNull();
  expect(Math.abs((secondBox?.x || 0) - (firstBox?.x || 0))).toBeGreaterThan(20);

  await page.locator('.editor-page').click({ position: { x: 520, y: 260 } });
  await expect(contextMenu).toHaveCount(0);

  await page.locator('.editor-page').click({ button: 'right', position: { x: 520, y: 260 } });
  await expect(contextMenu).toHaveCount(0);
});

test('editor clears selected component when clicking blank canvas', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await openMockEditor(page);

  const inputComponent = page.locator('[data-component-id="1002"]').first();
  await expect(inputComponent).toBeVisible();
  await inputComponent.click();

  await expect(page.locator('.editor-mask-selected')).toBeVisible();
  await expect(settingPanelLocator(page).locator('.setting-component-id')).toHaveText('#1002');

  await page.locator('.editor-page').click({ position: { x: 520, y: 260 } });

  await expect(page.locator('.editor-mask-selected')).toHaveCount(0);
  await expect(settingPanelLocator(page).locator('.ant-empty-description')).toBeVisible();
});

test('editor canvas grows and scrolls when page content exceeds the first viewport', async ({ page }) => {
  await mockEditorApi(page, longPageRecord);
  await page.goto('/');

  await page.getByRole('button', { name: '打开编辑器' }).click();
  await expect(page.locator('[data-component-id="2001"]').first()).toBeVisible();

  const scrollMetrics = await page.locator('.edit-area').evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));

  expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight + 80);

  await page.locator('.edit-area').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  const scrollTop = await page.locator('.edit-area').evaluate((element) => element.scrollTop);
  expect(scrollTop).toBeGreaterThan(0);
});

test('setting panel text inputs keep focus while editing component props', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await page.getByRole('button', { name: '打开编辑器' }).click();

  const inputComponent = page.locator('[data-component-id="1002"]').first();
  await expect(inputComponent).toBeVisible();
  await inputComponent.click();

  const propInput = page.locator('.setting-panel-content .ant-form-item-control-input input').first();
  await expect(propInput).toBeVisible();
  await propInput.fill('');
  await propInput.click();

  await page.keyboard.type('a');
  await expect(propInput).toBeFocused();

  await page.keyboard.type('b');
  await expect(propInput).toHaveValue('ab');
  await expect(propInput).toBeFocused();
});

test('setting style inputs update selected component appearance', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await page.getByRole('button', { name: '打开编辑器' }).click();

  const buttonComponent = page.locator('[data-component-id="1003"]').first();
  await expect(buttonComponent).toBeVisible();
  await buttonComponent.click();

  await page.getByRole('tab', { name: '外观' }).click();
  const buttonPaddingInput = page.getByLabel('内边距');
  await buttonPaddingInput.fill('18');
  await expect(buttonComponent.locator('button')).toHaveCSS('padding-left', '18px');

  const inputComponent = page.locator('[data-component-id="1002"]').first();
  await expect(inputComponent).toBeVisible();
  await inputComponent.click();

  const widthInput = page.getByLabel('宽度');
  await expect(widthInput).toBeVisible();
  await expect(page.locator('.setting-panel').getByText('px').first()).toBeVisible();
  await widthInput.fill('320');

  await expect(inputComponent).toHaveCSS('width', '320px');
  await expect(inputComponent.locator('input')).not.toHaveCSS('width', '320px');
  await expect(widthInput).toHaveValue('320');
  await expect(widthInput).toBeFocused();

  await widthInput.fill('');
  await expect(inputComponent).not.toHaveCSS('width', '320px');
  await expect(widthInput).toHaveValue('');

  await widthInput.fill('280');
  await expect(inputComponent).toHaveCSS('width', '280px');

  await page.getByRole('button', { name: '恢复默认样式' }).click();
  await expect(inputComponent).not.toHaveCSS('width', '280px');
  await expect(widthInput).toHaveValue('');
});

test('styled form and feedback materials apply visual styles to real controls', async ({ page }) => {
  await mockEditorApi(page);
  await page.goto('/');

  await openMockEditor(page);

  const switchShell = page.locator('[data-component-id="1004"]').first();
  await expect(switchShell).toHaveCSS('width', '96px');
  await expect(switchShell.locator('.ant-switch')).toHaveCSS('background-color', 'rgb(220, 38, 38)');

  const alertShell = page.locator('[data-component-id="1005"]').first();
  await expect(alertShell).toHaveCSS('width', '360px');
  await expect(alertShell.locator('.ant-alert')).toHaveCSS('padding-top', '18px');
  await expect(alertShell.locator('.ant-alert')).toHaveCSS('background-color', 'rgb(254, 249, 195)');

  const textareaShell = page.locator('[data-component-id="1006"]').first();
  await expect(textareaShell).toHaveCSS('width', '310px');
  await expect(textareaShell.locator('textarea')).toHaveCSS('padding-left', '15px');
  await expect(textareaShell.locator('textarea')).toHaveCSS('font-size', '18px');

  const datePickerShell = page.locator('[data-component-id="1007"]').first();
  await expect(datePickerShell).toHaveCSS('width', '240px');
  await expect(datePickerShell.locator('.ant-picker')).toHaveCSS('padding-left', '14px');

  const uploadShell = page.locator('[data-component-id="1008"]').first();
  await expect(uploadShell).toHaveCSS('width', '180px');
  await expect(uploadShell.locator('button')).toHaveCSS('padding-left', '16px');
  await expect(uploadShell.locator('button')).toHaveCSS('color', 'rgb(220, 38, 38)');

  const popoverShell = page.locator('[data-component-id="1009"]').first();
  await expect(popoverShell).toHaveCSS('width', '190px');
  await expect(popoverShell.locator('button')).toHaveCSS('padding-left', '13px');
  await expect(popoverShell.locator('button')).toHaveCSS('color', 'rgb(37, 99, 235)');

  const notificationShell = page.locator('[data-component-id="1010"]').first();
  await expect(notificationShell).toHaveCSS('width', '180px');
  await expect(notificationShell.locator('button')).toHaveCSS('padding-left', '12px');
  await expect(notificationShell.locator('button')).toHaveCSS('color', 'rgb(22, 163, 74)');
});

async function mockEditorApi(page: Page, editorPage = pageRecord) {
  await page.addInitScript(() => {
    window.localStorage.setItem('lowcode_editor_token', 'mock-editor-token');
  });

  await page.route('http://localhost:3000/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const pathname = url.pathname.replace(/^\/api/, '');

    if (method === 'GET' && pathname === '/auth/me') {
      await json(route, user);
      return;
    }

    if (method === 'GET' && pathname === '/projects') {
      await json(route, [project]);
      return;
    }

    if (method === 'GET' && pathname === `/projects/${project.id}/pages`) {
      await json(route, [editorPage]);
      return;
    }

    if (method === 'GET' && pathname === `/pages/${editorPage.id}`) {
      await json(route, editorPage);
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `${method} ${pathname} is not mocked` }),
    });
  });
}

async function openMockEditor(page: Page) {
  await page.getByRole('button', { name: '打开编辑器' }).click();
}

async function expectNoHorizontalOverflow(page: Page, selector: string) {
  const result = await page.locator(selector).evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));

  expect(result.scrollWidth, `${selector} should not overflow horizontally`).toBeLessThanOrEqual(result.clientWidth + 1);
}

function settingPanelLocator(page: Page) {
  return page.locator('.setting-panel');
}

async function json(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}
