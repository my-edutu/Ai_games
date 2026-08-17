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

test('stream readiness remains healthy before any viewer has requested a frame', async (t) => {
  const port = 4195;
  const child = spawn(process.execPath, ['scripts/serve-escape-room-stream.cjs', `--port=${port}`], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk.toString(); });
  t.after(() => child.kill('SIGTERM'));
  await waitForHealth(port);
  await new Promise(resolve => setTimeout(resolve, 3300));
  const health = await waitForHealth(port);
  assert.equal(health.status, 200, stderr || JSON.stringify(health.body));
  assert.equal(health.body.status, 'healthy');
  assert.equal(health.body.viewerConnected, false);
  assert.equal(health.body.reason, null);
});
