'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');

const PORT = 42771;
const ROOT = 'http://127.0.0.1:' + PORT;
let child;
let output = '';

before(async () => {
  child = spawn(process.execPath, ['scripts/serve-eko-run.cjs'], {
    cwd: require('node:path').resolve(__dirname, '../..'),
    env: { ...process.env, EKO_PORT: String(PORT), EKO_HOST: '127.0.0.1', EKO_SEED: 'eko-gauntlet-browser-contract-01' },
    stdio: ['ignore','pipe','pipe'],
  });
  child.stdout.on('data', chunk => output += chunk.toString());
  child.stderr.on('data', chunk => output += chunk.toString());
  for (let attempt = 0; attempt < 75; attempt++) {
    if (child.exitCode !== null) throw new Error('Eko host exited: ' + output);
    try {
      const response = await fetch(ROOT + '/eko/health', { signal: AbortSignal.timeout(500) });
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error('Eko host never became healthy: ' + output);
});

after(async () => {
  if (child && child.exitCode === null) {
    const exited = new Promise(resolve => child.once('exit', resolve));
    child.kill('SIGTERM');
    await Promise.race([exited, delay(2000)]);
    if (child.exitCode === null) child.kill('SIGKILL');
  }
});

test('serves actual Three.js rendering, browser HUD and a verifiable Gauntlet page', async () => {
  for (const [resource, expected] of [
    ['/eko/', 'EKO RUN'], ['/eko/app.js', 'WebGLRenderer'],
    ['/eko/character-craft.js', 'createTayoActor'],
    ['/vendor/three.module.js', 'THREE'], ['/eko/progress', 'Gauntlet progress board'],
    ['/eko/gauntlet.json', 'iterations']
  ]) {
    const response = await fetch(ROOT + resource);
    assert.equal(response.status, 200, resource);
    assert.match(await response.text(), new RegExp(expected, 'i'), resource);
  }
});

test('live snapshots advance the existing deterministic Phase 6 authority', async () => {
  const first = await (await fetch(ROOT + '/eko/state')).json();
  await delay(230);
  const second = await (await fetch(ROOT + '/eko/state')).json();
  assert.ok(second.snapshot.tick > first.snapshot.tick, 'authoritative ticks must move');
  assert.equal(second.snapshot.progression.districtId, 'mainland-morning');
  assert.ok(Array.isArray(second.snapshot.hazards));
  assert.ok(second.checksum && second.snapshot.runId);
  assert.equal(second.snapshot.version, first.snapshot.version);
  assert.equal(second.mode, 'ai');
});

test('rejects malformed controls and hostile cross-origin writes; supports bounded mode and outfit', async () => {
  async function post(value, headers = {}) {
    return fetch(ROOT + '/eko/control', { method: 'POST', headers: { 'content-type':'application/json', ...headers }, body: JSON.stringify(value) });
  }
  assert.equal((await post({mode:'god-mode'})).status, 400);
  assert.equal((await post({input:{axis:100}})).status, 400);
  assert.equal((await post({mode:'player'}, {origin:'https://untrusted.example'})).status, 403);
  assert.equal((await post({mode:'player',outfit:'hausa-baban-riga-cap'})).status, 200);
  assert.equal((await post({input:{axis:1,jumpPressed:true}})).status, 200);
  const state = await (await fetch(ROOT + '/eko/state')).json();
  assert.equal(state.mode, 'player');
  assert.equal(state.outfit, 'hausa-baban-riga-cap');
  assert.equal((await post({input:{axis:Infinity}})).status, 400);
  assert.equal((await post({mode:'ai'})).status, 200);
});

test('SSE publishes one public snapshot without exposing private state', async () => {
  const controller = new AbortController();
  const response = await fetch(ROOT + '/eko/stream', { signal: controller.signal });
  assert.equal(response.headers.get('content-type'), 'text/event-stream');
  const reader = response.body.getReader();
  const chunk = (await reader.read()).value;
  assert.ok(new TextDecoder().decode(chunk).includes('data:'));
  controller.abort();
  await reader.cancel().catch(()=>{});
});

test('health includes observable activity and a bounded connection count', async () => {
  const response = await (await fetch(ROOT + '/eko/health')).json();
  assert.equal(response.status, 'ok');
  assert.ok(Number.isSafeInteger(response.tick));
  assert.ok(response.clients >= 0 && response.clients <= 32);
});
