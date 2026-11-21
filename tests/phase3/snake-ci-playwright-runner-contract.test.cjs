const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const expectedImage = 'ubuntu-24.04';
const manifest = require('../../package.json');

test('snake authentic-browser evidence runner uses an OS supported by locked Playwright', () => {
  assert.equal(manifest.devDependencies['@playwright/test'], '1.55.0', 'test only covers pinned dependency; review if upgraded');
  const nativeDeps = fs.readFileSync(path.join(root, 'node_modules/playwright-core/lib/server/registry/nativeDeps.js'), 'utf8');
  assert.match(nativeDeps, /ubuntu24\.04-x64/,'locked Playwright must actually support selected image');
  assert.doesNotMatch(nativeDeps, /ubuntu26\.04-x64/,'do not quietly repin without verifying Playwright support');
  for (const file of ['.github/workflows/snake-3d-preview.yml', '.github/workflows/ci.yml']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(source, /run: npx playwright install --with-deps chromium/,
      `${file} must retain real Chromium installation and true WebGL tests`);
    assert.match(source, /^    runs-on: ubuntu-24\.04$/m,
      `${file} must stay on proven Playwright 1.55 supported Ubuntu 24.04`);
  }
});
