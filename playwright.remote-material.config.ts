import { defineConfig, devices } from '@playwright/test';

const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'remote-material-publish.spec.ts',
  timeout: 60_000,
  expect: {
    timeout: 12_000,
  },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev --workspace @lowcode/editor-web -- --host 127.0.0.1',
      url: 'http://localhost:5173',
      reuseExistingServer,
      timeout: 120_000,
      env: {
        VITE_API_BASE_URL: 'http://127.0.0.1:3000/api',
        VITE_PUBLISHER_SITE_URL: 'http://localhost:5174',
        VITE_LOWCODE_HTTP_ALLOWED_ORIGINS: '',
        VITE_REMOTE_MATERIAL_ALLOWED_ORIGINS: 'http://127.0.0.1:4174',
      },
    },
    {
      command: 'npm run start --workspace @lowcode/publisher-web',
      url: 'http://localhost:5174',
      reuseExistingServer,
      timeout: 120_000,
      env: {
        PUBLISHER_API_BASE_URL: 'http://127.0.0.1:3000/api',
        PUBLISHER_SITE_URL: 'http://localhost:5174',
        PUBLISHER_REVALIDATE_SECRET: 'remote-material-e2e-secret',
        PUBLISHER_LOWCODE_HTTP_ALLOWED_ORIGINS: '',
        PUBLISHER_REMOTE_MATERIAL_ALLOWED_ORIGINS: 'http://127.0.0.1:4174',
      },
    },
    {
      command: 'npm run serve --workspace @lowcode/remote-material-example -- --host 127.0.0.1 --port 4174',
      url: 'http://127.0.0.1:4174/manifest.json',
      reuseExistingServer,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
