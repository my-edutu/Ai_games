'use strict';
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: 'tests/browser',
  testMatch: 'thousand-floors.spec.cjs',
  // Software WebGL on a shared CI host can delay automation messages even
  // while the worker advances. These are functional budgets, not an FPS SLO.
  timeout: 90000,
  expect: { timeout: 15000 },
  workers: 1,
  // Keep action timing evidence without copying a software-rendered WebGL
  // canvas on every assertion. Visual evidence is captured separately.
  use: { baseURL: 'http://127.0.0.1:4184', headless: true, trace: { mode: 'retain-on-failure', screenshots: false, snapshots: false }, launchOptions: { args: ['--no-sandbox', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'node scripts/serve-thousand-floors.cjs', url: 'http://127.0.0.1:4184/floors/health', reuseExistingServer: true, timeout: 30000 },
  reporter: [['list']]
});
