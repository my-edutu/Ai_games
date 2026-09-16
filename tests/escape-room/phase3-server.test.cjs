const test = require('node:test');
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');

async function waitForHealth(port, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/escape-room/health`, {cache:'no-store'});
      const body = await response.json();
      return {status:response.status, body};
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 80));
    }
  }
  throw lastError ?? new Error('health endpoint did not start');
}

function startServer(t, port) {
  const child = spawn(process.execPath, ['scripts/serve-escape-room-stream.cjs', `--port=${port}`], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk.toString(); });
  t.after(() => child.kill('SIGTERM'));
  return () => stderr;
}

test('stream readiness remains healthy before any viewer has requested a frame', async (t) => {
  const port = 4195;
  const stderr = startServer(t, port);
  await waitForHealth(port);
  await new Promise(resolve => setTimeout(resolve, 3300));
  const health = await waitForHealth(port);
  assert.equal(health.status, 200, stderr() || JSON.stringify(health.body));
  assert.equal(health.body.status, 'healthy');
  assert.equal(health.body.viewerConnected, false);
  assert.equal(health.body.reason, null);
});

test('vendored Three.js entrypoint serves every relative module dependency', async (t) => {
  const port = 4196;
  const stderr = startServer(t, port);
  await waitForHealth(port);

  const entryResponse = await fetch(`http://127.0.0.1:${port}/escape-room/vendor/three.module.js`, {cache:'no-store'});
  assert.equal(entryResponse.status, 200, stderr());
  assert.match(entryResponse.headers.get('content-type') || '', /javascript/);
  const source = await entryResponse.text();
  const imports = [...source.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g)].map(match => match[1]);
  assert.ok(imports.length > 0, 'expected the pinned Three.js module build to declare its sibling module dependency');

  for (const dependency of imports) {
    const response = await fetch(`http://127.0.0.1:${port}/escape-room/vendor/${dependency}`, {cache:'no-store'});
    assert.equal(response.status, 200, `missing Three.js dependency ${dependency}; ${stderr()}`);
    assert.match(response.headers.get('content-type') || '', /javascript/, dependency);
  }
});
