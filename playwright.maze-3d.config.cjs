'use strict';
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests/browser',
  testMatch: /maze-.*\.spec\.cjs/,
  timeout: 60000,
  expect: { timeout: 15000 },
  workers: 1,
  use: {
    headless: true,
    trace: 'retain-on-failure',
    // Keep compositor experiments opt-in until an actual speed improvement is measured.
    launchOptions: { args: ['--enable-unsafe-swiftshader', ...(process.env.MAZE_SOFTWARE_COMPOSITOR === '1' ? ['--enable-gpu', '--use-angle=swiftshader'] : [])] },
  },
  webServer: {
    command: 'node scripts/serve-maze-stream.cjs',
    url: 'http://127.0.0.1:4174/maze/health',
    timeout: 30000,
    reuseExistingServer: false,
  },
  reporter: [['list']],
});
