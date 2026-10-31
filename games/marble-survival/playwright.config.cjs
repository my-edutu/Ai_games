'use strict';
const { defineConfig } = require('@playwright/test');
// The Marble spec starts its own real authority. Do not run four unrelated
// game servers during its GPU timing measurements or require their readiness.
module.exports = defineConfig({
  testDir: '../../tests/browser',
  testMatch: 'marble-*.spec.cjs',
  timeout: 60000,
  expect: { timeout: 10000 },
  workers: 1,
  retries: 0,
  use: { headless: true, trace: 'retain-on-failure' },
  reporter: [['list']],
});
