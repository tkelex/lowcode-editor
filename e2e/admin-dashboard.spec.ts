import { expect, test, type Page, type Route } from '@playwright/test';

const now = '2026-05-09T00:00:00.000Z';
const adminUser = {
  id: 1,
  email: 'admin@example.com',
  username: 'admin-user',
  role: 'admin',
  status: 'active',
  createdAt: now,
  updatedAt: now,
};
const normalUser = {
  id: 2,
  email: 'normal@example.com',
  username: 'normal-user',
  role: 'user',
  status: 'active',
  projectCount: 1,
  createdAt: now,
  updatedAt: now,
};
const project = {
  id: 10,
  name: 'Admin E2E 项目',
  description: 'project for admin e2e',
  status: 'active',
  owner: normalUser,
  pageCount: 1,
  assetCount: 0,
  createdAt: now,
  updatedAt: now,
};
const publishedPage = {
  id: 20,
  name: 'Admin E2E 发布页',
  routePath: '/admin-e2e',
  publicId: 'admin-e2e-public',
  publishedAt: now,
  projectId: project.id,
  projectName: project.name,
  projectStatus: 'active',
  owner: normalUser,
};

test('admin can open dashboard and perform core governance actions', async ({ page }) => {
  const state = {
    users: [
      { ...adminUser, projectCount: 0 },
      { ...normalUser },
    ],
    projects: [{ ...project }],
    publishedPages: [{ ...publishedPage }],
    auditLogs: [] as Array<Record<string, unknown>>,
  };

  await mockAdminApi(page, state);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: '低代码项目' })).toBeVisible();
  await page.getByRole('button', { name: '管理后台' }).click();
  await expect(page.getByRole('heading', { name: '平台管理后台' })).toBeVisible();
  await expect(page.getByText('用户总数')).toBeVisible();

  await page.getByRole('tab', { name: '用户管理' }).click();
  await expect(page.getByText(normalUser.email)).toBeVisible();
  await page.getByRole('row', { name: /normal-user/ }).getByRole('button', { name: spacedChineseLabel('禁用') }).click();
  await page.getByRole('button', { name: spacedChineseLabel('禁用') }).last().click();
  await expect(page.getByRole('row', { name: /normal-user/ }).getByText('禁用')).toBeVisible();

  await page.getByRole('tab', { name: '项目管理' }).click();
  await expect(page.getByText(project.name)).toBeVisible();
  await page.getByRole('row', { name: /Admin E2E 项目/ }).getByRole('button', { name: spacedChineseLabel('禁用') }).click();
  await page.getByRole('button', { name: spacedChineseLabel('禁用') }).last().click();
  await expect(page.getByRole('row', { name: /Admin E2E 项目/ }).getByText('禁用')).toBeVisible();

  await page.getByRole('tab', { name: '发布页' }).click();
  await expect(page.getByText(publishedPage.name)).toHaveCount(0);

  state.publishedPages = [{ ...publishedPage }];
  await page.getByRole('button', { name: '刷新' }).click();
  await page.getByRole('tab', { name: '发布页' }).click();
  await expect(page.getByText(publishedPage.name)).toBeVisible();
  await page.getByRole('row', { name: /Admin E2E 发布页/ }).getByRole('button', { name: spacedChineseLabel('取消发布') }).click();
  await page.getByRole('button', { name: spacedChineseLabel('取消发布') }).last().click();
  await expect(page.getByText(publishedPage.name)).toHaveCount(0);
});

async function mockAdminApi(
  page: Page,
  state: {
    users: Array<typeof adminUser & { projectCount: number }>;
    projects: typeof project[];
    publishedPages: typeof publishedPage[];
    auditLogs: Array<Record<string, unknown>>;
  },
) {
  await page.addInitScript(() => {
    window.localStorage.setItem('lowcode_editor_token', 'mock-admin-token');
  });

  await page.route('http://localhost:3000/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const pathname = url.pathname.replace(/^\/api/, '');
    const body = request.postDataJSON?.();

    if (method === 'GET' && pathname === '/auth/me') {
      await json(route, adminUser);
      return;
    }

    if (method === 'GET' && pathname === '/projects') {
      await json(route, []);
      return;
    }

    if (method === 'GET' && pathname === '/admin/overview') {
      await json(route, {
        users: {
          total: state.users.length,
          active: state.users.filter((user) => user.status === 'active').length,
          disabled: state.users.filter((user) => user.status === 'disabled').length,
        },
        projects: {
          total: state.projects.length,
          active: state.projects.filter((item) => item.status === 'active').length,
          disabled: state.projects.filter((item) => item.status === 'disabled').length,
        },
        pages: {
          total: 1,
          published: state.publishedPages.length,
        },
        assets: {
          total: 0,
          totalSize: 0,
        },
      });
      return;
    }

    if (method === 'GET' && pathname === '/admin/users') {
      await json(route, state.users);
      return;
    }

    if (method === 'PATCH' && pathname === `/admin/users/${normalUser.id}/status`) {
      state.users = state.users.map((user) => user.id === normalUser.id ? { ...user, status: body.status } : user);
      state.auditLogs.unshift(createAuditLog('admin.user.disable'));
      await json(route, state.users.find((user) => user.id === normalUser.id));
      return;
    }

    if (method === 'GET' && pathname === '/admin/projects') {
      await json(route, state.projects);
      return;
    }

    if (method === 'PATCH' && pathname === `/admin/projects/${project.id}/status`) {
      state.projects = state.projects.map((item) => item.id === project.id ? { ...item, status: body.status } : item);
      if (body.status === 'disabled') {
        state.publishedPages = state.publishedPages.filter((item) => item.projectId !== project.id);
      }
      state.auditLogs.unshift(createAuditLog('admin.project.disable'));
      await json(route, state.projects.find((item) => item.id === project.id));
      return;
    }

    if (method === 'GET' && pathname === '/admin/published-pages') {
      await json(route, state.publishedPages);
      return;
    }

    if (method === 'POST' && pathname === `/admin/pages/${publishedPage.id}/unpublish`) {
      state.publishedPages = state.publishedPages.filter((item) => item.id !== publishedPage.id);
      state.auditLogs.unshift(createAuditLog('admin.page.unpublish'));
      await json(route, { ...publishedPage, isPublished: false });
      return;
    }

    if (method === 'GET' && pathname === '/admin/audit-logs') {
      await json(route, state.auditLogs);
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `${method} ${pathname} is not mocked` }),
    });
  });
}

function createAuditLog(action: string) {
  return {
    id: Date.now(),
    action,
    actorId: adminUser.id,
    actor: adminUser,
    targetType: 'admin',
    createdAt: new Date().toISOString(),
  };
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
