import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1',
    port: 4173,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
        browserName: 'chromium',
        launchOptions: {
          executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        },
      },
    },
  ],
});
