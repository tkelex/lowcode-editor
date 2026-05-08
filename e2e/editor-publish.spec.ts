import { expect, test, type Page, type Route } from '@playwright/test';

const now = '2026-05-08T00:00:00.000Z';
const pageId = 20;
const user = {
  id: 1,
  email: 'e2e@example.com',
  username: 'e2e-user',
  createdAt: now,
  updatedAt: now,
};
const project = {
  id: 10,
  name: 'E2E 项目',
  description: 'mock project',
  currentUserRole: 'owner',
  status: 'active',
  ownerId: user.id,
  createdAt: now,
  updatedAt: now,
};
const pageRecord = {
  id: pageId,
  projectId: project.id,
  name: 'E2E 页面',
  routePath: '/e2e-page',
  schema: createPageSchema('E2E Published Page'),
  isPublished: false,
  publicId: null,
  publishedAt: null,
  publishedVersionId: null,
  createdAt: now,
  updatedAt: now,
};

test('completes the mocked edit, preview, save, publish and public page flow', async ({ page }) => {
  const state = {
    projects: [] as typeof project[],
    pages: [] as typeof pageRecord[],
    savedSchema: pageRecord.schema,
    publishedSchema: createPageSchema('E2E Published Page'),
  };

  await mockApi(page, state);
  await page.goto('/');

  await expect(page.getByText('低代码编辑器')).toBeVisible();
  await page.getByRole('button', { name: '没有账号？去注册' }).click();
  await page.getByLabel('邮箱').fill(user.email);
  await page.getByLabel('用户名').fill(user.username);
  await page.getByLabel('密码').fill('password123');
  await clickButton(page, '注册');

  await expect(page.getByRole('heading', { name: '低代码项目' })).toBeVisible();
  await page.getByRole('button', { name: '新建项目' }).click();
  const projectDialog = page.getByRole('dialog', { name: '新建项目' });
  await projectDialog.getByLabel('项目名称').fill(project.name);
  await projectDialog.getByLabel('项目描述').fill(project.description);
  await clickButton(page, '创建');
  await expect(page.getByText(project.name).first()).toBeVisible();

  await page.getByRole('button', { name: '新建页面' }).click();
  const pageDialog = page.getByRole('dialog', { name: '新建页面' });
  await pageDialog.getByRole('textbox').nth(0).fill(pageRecord.name);
  await pageDialog.getByRole('textbox').nth(1).fill(pageRecord.routePath);
  await clickButton(page, '创建');
  await expect(page.getByText(pageRecord.name).first()).toBeVisible();

  await page.getByRole('button', { name: '打开编辑器' }).click();
  await expect(page.getByText('可视化搭建页面')).toBeVisible();
  await expect(page.getByText('E2E Published Page')).toBeVisible();

  await clickButton(page, '预览');
  await expect(page.getByText('E2E Published Page')).toBeVisible();
  await page.getByRole('button', { name: '退出预览' }).click();

  await clickButton(page, '保存');
  await expect(page.getByText('页面已保存，并生成历史版本')).toBeVisible();

  await clickButton(page, '发布');
  await expect(page.getByText(/页面已保存并发布/)).toBeVisible();

  await page.goto('/publish/public-e2e-page');
  await expect(page.getByText('E2E Published Page')).toBeVisible();
  await expect(page.getByText('页面运行异常')).toHaveCount(0);
});

async function mockApi(
  page: Page,
  state: {
    projects: typeof project[];
    pages: typeof pageRecord[];
    savedSchema: ReturnType<typeof createPageSchema>;
    publishedSchema: ReturnType<typeof createPageSchema>;
  },
) {
  await page.route('http://localhost:3000/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const pathname = url.pathname.replace(/^\/api/, '');
    const body = request.postDataJSON?.();

    if (method === 'POST' && pathname === '/auth/register') {
      await json(route, {
        accessToken: 'mock-token',
        user,
      });
      return;
    }

    if (method === 'GET' && pathname === '/auth/me') {
      await json(route, user);
      return;
    }

    if (method === 'GET' && pathname === '/projects') {
      await json(route, state.projects);
      return;
    }

    if (method === 'POST' && pathname === '/projects') {
      state.projects = [{ ...project, ...body }, ...state.projects];
      await json(route, state.projects[0]);
      return;
    }

    if (method === 'GET' && pathname === `/projects/${project.id}/pages`) {
      await json(route, state.pages);
      return;
    }

    if (method === 'POST' && pathname === `/projects/${project.id}/pages`) {
      const nextPage = {
        ...pageRecord,
        ...body,
        schema: createPageSchema('E2E Published Page'),
      };
      state.pages = [nextPage, ...state.pages];
      await json(route, nextPage);
      return;
    }

    if (method === 'GET' && pathname === `/pages/${pageRecord.id}`) {
      await json(route, {
        ...pageRecord,
        schema: state.savedSchema,
      });
      return;
    }

    if (method === 'PATCH' && pathname === `/pages/${pageRecord.id}`) {
      state.savedSchema = body.schema;
      await json(route, {
        ...pageRecord,
        schema: state.savedSchema,
      });
      return;
    }

    if (method === 'POST' && pathname === `/pages/${pageRecord.id}/publish`) {
      state.publishedSchema = state.savedSchema;
      await json(route, {
        ...pageRecord,
        schema: state.savedSchema,
        isPublished: true,
        publicId: 'public-e2e-page',
        publishedAt: now,
        publishedVersionId: 100,
      });
      return;
    }

    if (method === 'GET' && pathname === '/public/pages/public-e2e-page') {
      await json(route, {
        id: pageRecord.id,
        name: pageRecord.name,
        publicId: 'public-e2e-page',
        schema: state.publishedSchema,
        publishedAt: now,
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `${method} ${pathname} is not mocked` }),
    });
  });
}

async function clickButton(page: Page, label: string) {
  await page.getByRole('button', { name: spacedChineseLabel(label) }).click();
}

function spacedChineseLabel(label: string) {
  return new RegExp(label.split('').map(escapeRegExp).join('\\s*'));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function json(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

function createPageSchema(text: string) {
  return {
    schemaVersion: '1.0.0',
    pageId,
    components: [
      {
        id: 1,
        name: 'Page',
        props: {},
        desc: '页面',
        children: [
          {
            id: 2,
            name: 'Text',
            desc: '文本',
            parentId: 1,
            props: {
              text,
            },
          },
          {
            id: 3,
            name: 'Input',
            desc: '输入框',
            parentId: 1,
            props: {
              placeholder: 'E2E 输入框',
              defaultValue: 'preview value',
            },
          },
        ],
      },
    ],
    metadata: {
      e2e: true,
    },
  };
}
