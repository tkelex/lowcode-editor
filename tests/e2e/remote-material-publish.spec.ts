import { expect, test, type APIRequestContext } from '@playwright/test';

const apiBaseUrl = 'http://127.0.0.1:3000/api';
const manifestUrl = 'http://127.0.0.1:4174/manifest.json';

test('loads one pinned remote material through editor save, publish and anonymous runtime', async ({
  page,
  request,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  const runId = Date.now();
  const email = `remote-e2e-${runId}@example.com`;
  const password = 'password123';
  const auth = await apiRequest(request, '/auth/register', {
    method: 'POST',
    body: {
      email,
      username: `remote_e2e_${runId}`,
      password,
    },
  });
  const token = String(auth.accessToken);

  const project = await apiRequest(request, '/projects', {
    method: 'POST',
    token,
    body: {
      name: `M7 远程物料验收 ${runId}`,
      description: 'Playwright editor/API/publisher remote material acceptance',
    },
  });

  const manifestResponse = await request.get(manifestUrl);
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();

  const installed = await apiRequest(
    request,
    `/projects/${project.id}/remote-materials`,
    {
      method: 'POST',
      token,
      body: { manifestUrl, manifest },
    },
  );
  expect(installed.version).toBe('1.0.0');
  expect(installed.entry).toBe('http://127.0.0.1:4174/remote-material-example.iife.js');

  const editorPage = await apiRequest(request, `/projects/${project.id}/pages`, {
    method: 'POST',
    token,
    body: {
      name: `M7 远程发布页 ${runId}`,
      routePath: `/m7-remote-${runId}`,
      schema: createRemotePageSchema('M7 初始远程指标'),
    },
  });
  expect(editorPage.materialDependencies).toHaveLength(1);

  await page.addInitScript(({ accessToken }) => {
    window.localStorage.setItem('lowcode_editor_token', accessToken);
  }, { accessToken: token });
  await page.goto('/');

  await expect(page.getByText(project.name).first()).toBeVisible();
  await expect(page.getByText(editorPage.name).first()).toBeVisible();
  await page.getByRole('button', { name: '打开编辑器' }).click();

  await expect(page.getByRole('status')).toContainText('远程物料已就绪：1/1');
  await expect(page.locator('.editor-material-panel').getByText('客户指标卡', { exact: true })).toBeVisible();

  const remoteNode = page.locator('[data-component-id="2"]');
  await expect(remoteNode).toContainText('M7 初始远程指标');
  await remoteNode.click();

  const titleInput = page.getByLabel('标题', { exact: true });
  await expect(titleInput).toHaveValue('M7 初始远程指标');
  await titleInput.fill('M7 跨应用远程指标');
  await expect(remoteNode).toContainText('M7 跨应用远程指标');

  await page.getByRole('button', { name: spacedChineseLabel('保存') }).click();
  await expect(page.getByText('页面已保存，并生成历史版本')).toBeVisible();

  await page.getByRole('button', { name: spacedChineseLabel('发布') }).click();
  await expect(page.getByText(/页面已保存并发布/)).toBeVisible();

  const publishedPage = await apiRequest(request, `/pages/${editorPage.id}`, { token });
  expect(publishedPage.publicId).toBeTruthy();
  expect(publishedPage.materialDependencies[0].version).toBe('1.0.0');

  const publicSnapshot = await apiRequest(
    request,
    `/public/pages/${publishedPage.publicId}`,
  );
  expect(publicSnapshot.materialDependencies[0].entry).toBe(installed.entry);
  expect(publicSnapshot.materialDependencies[0].integrity).toBe(installed.integrity);

  await page.goto(`http://localhost:5174/publish/${publishedPage.publicId}`);
  await Promise.race([
    page.getByText('M7 跨应用远程指标', { exact: true }).waitFor({ state: 'visible' }),
    page.getByRole('heading', { name: '页面物料加载失败' }).waitFor({ state: 'visible' }),
  ]);
  const publisherError = page.getByRole('heading', { name: '页面物料加载失败' });
  if (await publisherError.isVisible()) {
    const hostState = await page.evaluate(() => ({
      hasHost: Boolean(window.__LOWCODE_MATERIAL_HOST__),
      sharedVersions: window.__LOWCODE_MATERIAL_HOST__?.sharedVersions,
      registration: window.__LOWCODE_MATERIAL_HOST__?.getRegistration(
        '@portfolio/remote-material-example',
        '1.0.0',
      ),
    }));
    throw new Error(JSON.stringify({
      body: await page.locator('body').innerText(),
      hostState,
      pageErrors,
    }, null, 2));
  }
  await expect(page.getByText('M7 跨应用远程指标', { exact: true })).toBeVisible();
  const actionButton = page.getByRole('button', { name: '刷新数据' });
  await expect(actionButton).toBeVisible();
  await actionButton.click();
  await expect(page.getByText('已刷新 1 次')).toBeVisible();
});

function createRemotePageSchema(title: string) {
  return {
    schemaVersion: '1.0.0',
    components: [{
      id: 1,
      name: 'Page',
      desc: '页面',
      props: {},
      children: [{
        id: 2,
        parentId: 1,
        name: 'CustomerMetricCard',
        desc: '客户指标卡',
        props: {
          title,
          value: 256,
          unit: '人',
          accentColor: '#2563eb',
          actionText: '刷新数据',
        },
      }],
    }],
  };
}

function spacedChineseLabel(label: string) {
  return new RegExp(label.split('').join('\\s*'));
}

async function apiRequest(
  request: APIRequestContext,
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    token?: string;
    body?: unknown;
  } = {},
) {
  const response = await request.fetch(`${apiBaseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body === undefined ? {} : { data: options.body }),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  expect(response.ok(), `${options.method || 'GET'} ${path}: ${response.status()} ${text}`).toBeTruthy();
  return data;
}
