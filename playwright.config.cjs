'use strict';
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests/browser',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  use: {
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    baseURL: 'http://127.0.0.1:4173'
  },
  webServer: [
    {
      command: 'node scripts/serve-snake-stream.cjs',
      url: 'http://127.0.0.1:4173/health',
      timeout: 60_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe'
    },
    {
      command: 'node scripts/serve-maze-stream.cjs',
      url: 'http://127.0.0.1:4174/maze/health',
      timeout: 60_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe'
    },
    {
      command: 'node scripts/serve-ant-colony-stream.cjs',
      url: 'http://127.0.0.1:4175/ant/health',
      timeout: 60_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe'
    },
    {
      command: 'node scripts/serve-tower-stream.cjs --port=4176',
      url: 'http://127.0.0.1:4176/tower/health',
      timeout: 60_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe'
    },
    {
      command: 'node scripts/serve-zombie-stream.cjs --port=4177',
      url: 'http://127.0.0.1:4177/zombie/health',
      timeout: 60_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe'
    }
  ],
  reporter: [['list']]
});
