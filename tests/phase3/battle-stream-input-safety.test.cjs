'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const SCRIPT = path.join(ROOT, 'scripts', 'serve-battle-royale-stream.cjs');
const APP = path.join(ROOT, 'public', 'ai-battle-royale', 'app.js');
const HTML = path.join(ROOT, 'public', 'ai-battle-royale', 'index.html');

function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('unable-to-reserve-port'));
        return;
      }
      const port = address.port;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function waitForReady(child, port) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`stream-host-timeout:${port}`)), 5_000);
    const onExit = (code, signal) => {
      clearTimeout(timeout);
      reject(new Error(`stream-host-exited:${code ?? 'null'}:${signal ?? 'none'}`));
    };
    child.once('exit', onExit);
    child.stdout.on('data', (chunk) => {
      if (!String(chunk).includes(`port ${port}`)) return;
      clearTimeout(timeout);
      child.off('exit', onExit);
      resolve();
    });
  });
}

test('Battle Royale stream survives malformed viewport query input', { timeout: 10_000 }, async (t) => {
  const port = await reservePort();
  const child = spawn(process.execPath, [SCRIPT, `--port=${port}`], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => {
    if (child.exitCode === null) child.kill('SIGTERM');
  });

  await waitForReady(child, port);

  const stateResponse = await fetch(`http://127.0.0.1:${port}/battle/state?w=not-a-number&h=-5`, {
    signal: AbortSignal.timeout(2_000),
  });
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  assert.equal(state.layout.width, 1920);
  assert.equal(state.layout.height, 180);

  const healthResponse = await fetch(`http://127.0.0.1:${port}/battle/health`, {
    signal: AbortSignal.timeout(2_000),
  });
  assert.equal(healthResponse.status, 200);
  assert.equal(child.exitCode, null);
});

test('Battle Royale operator secret is never sourced from the page URL', () => {
  const app = fs.readFileSync(APP, 'utf8');
  const html = fs.readFileSync(HTML, 'utf8');
  assert.equal(app.includes("params.get('operatorToken')"), false);
  assert.match(html, /id="operator-token"[^>]*type="password"/);
});
