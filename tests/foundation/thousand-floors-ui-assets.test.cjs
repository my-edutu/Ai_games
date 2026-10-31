'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createServer, resolveAsset} = require('../../scripts/serve-thousand-floors.cjs');
const publicDir = path.resolve(__dirname, '../../public/ai-vs-1000-floors');

test('Journey module is allowed without exposing arbitrary source files', () => {
  assert.equal(resolveAsset('/floors/interface.js'), path.join(publicDir, 'interface.js'));
  for (const pathname of ['/floors/private.js','/floors/../package.json','/floors/%2e%2e/package.json','/floors/%5c..%5cpackage.json']) {
    assert.equal(resolveAsset(pathname), null, pathname);
  }
});

test('every new interface asset is served with its expected type and nosniff', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => {server.closeAllConnections(); server.close(resolve);}));
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const [name,type] of [['index.html','text/html'], ['styles.css','text/css'], ['interface.js','text/javascript']]) {
    const response = await fetch(`${origin}/floors/${name}`);
    assert.equal(response.status, 200, name);
    assert.ok(response.headers.get('content-type').startsWith(type), name);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
    assert.equal(await response.text(), fs.readFileSync(path.join(publicDir,name),'utf8'));
  }
});

test('interface preserves legacy runtime element IDs and bounded progress', () => {
  const html = fs.readFileSync(path.join(publicDir,'index.html'), 'utf8');
  const required = ['game-canvas','hud','run-state','district-index','floor-number','district-name','progress-fill','checkpoint-label','milestone','intent-caption','intent','pause-button','pause-icon','pause-label','speed-button','speed-label','camera-button','camera-label','sound-button','sound-waves','sound-label','settings-button','save-note','loading-state','state-title','state-message','retry-button','fresh-button','settings-dialog','settings-title','reduced-motion','quality-select','clean-feed','recovery-description','recover-button','restart-button','restart-confirmation','cancel-restart','confirm-restart'];
  for (const id of required) assert.equal(html.match(new RegExp(`id="${id}"`, 'g'))?.length, 1, id);
  assert.match(html, /src="\.\/interface\.js"/);
  assert.match(html, /aria-valuemax="1000"/);
});
