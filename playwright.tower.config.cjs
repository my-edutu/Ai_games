'use strict';
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests/browser',
  testMatch: /tower.*\.spec\.cjs/,
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    headless: true,
    trace: 'retain-on-failure',
    baseURL: 'http://127.0.0.1:4176',
    launchOptions: { args: process.env.CI || process.env.TOWER_SOFTWARE_GL === '1' ? ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] : [] },
  },
  webServer: {
    command: 'node scripts/serve-tower-stream.cjs --port=4176',
    url: 'http://127.0.0.1:4176/tower/health',
    timeout: 30000,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  reporter: [['list']],
});
