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
                id: 1002,
                name: 'Input',
                desc: '输入框',
                parentId: 1001,
                props: {
                  placeholder: '请输入内容',
                },
                styles: {},
              },
            ],
          },
        ],
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
  await expect(settingPanel.getByText('Container #')).toHaveCount(0);
  await expect(settingPanel.getByText('组件 ID')).toHaveCount(0);

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

async function mockEditorApi(page: Page) {
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
      await json(route, [pageRecord]);
      return;
    }

    if (method === 'GET' && pathname === `/pages/${pageRecord.id}`) {
      await json(route, pageRecord);
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `${method} ${pathname} is not mocked` }),
    });
  });
}

async function expectNoHorizontalOverflow(page: Page, selector: string) {
  const result = await page.locator(selector).evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));

  expect(result.scrollWidth, `${selector} should not overflow horizontally`).toBeLessThanOrEqual(result.clientWidth + 1);
}

async function json(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}
