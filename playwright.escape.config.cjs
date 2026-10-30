'use strict';
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests/browser',
  testMatch: 'escape-room-*.spec.cjs',
  timeout: 120000,
  expect: { timeout: 10000 },
  workers: 1,
  use: { headless: true, trace: { mode: 'retain-on-failure', screenshots: false, snapshots: true, sources: true }, baseURL: 'http://127.0.0.1:4177', launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'node scripts/serve-escape-room-stream.cjs --port=4177', url: 'http://127.0.0.1:4177/escape-room/health', timeout: 30000, reuseExistingServer: !process.env.CI },
  reporter: [['list']],
});
