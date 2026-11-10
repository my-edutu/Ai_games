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
  // Real source captures start their own short-lived ORIGINAL host only after
  // Chromium and the native video context are ready. Avoid giving the frozen
  // baseline extra unfilmed ticks during Playwright worker/browser startup.
  // No virtual time, source rewrite, warm-start replay or frozen-source edit.
  webServer: process.env.TOWER_CAPTURE_UNALTERED_SOURCE === '1' &&
    process.env.TOWER_CAPTURE_LATE_HOST_START === '1' ? undefined : {
    // CI captures use the ORIGINAL checked-out game's server implementation.
    // The neutral runner supplies identical scenario settings without
    // overwriting the frozen baseline's gameplay files.
    command: process.env.TOWER_CAPTURE_UNALTERED_SOURCE === '1'
      ? 'node scripts/tower-source-capture-server.cjs --port=4176'
      : 'node scripts/serve-tower-stream.cjs --port=4176',
    url: 'http://127.0.0.1:4176/tower/health',
    timeout: 30000,
    reuseExistingServer: false,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  reporter: [['list']],
});
