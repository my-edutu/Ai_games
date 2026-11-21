'use strict';
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests/browser',
  testMatch: /snake.*\.spec\.cjs$/,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 12000 },
  use: {
    baseURL: 'http://127.0.0.1:43173', headless: true,
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/serve-snake-stream.cjs --port=43173',
    url: 'http://127.0.0.1:43173/health', reuseExistingServer: false, timeout: 60000,
  },
  reporter: [['list'], ['json', { outputFile: 'artifacts/phase3/browser-results.json' }]],
});
