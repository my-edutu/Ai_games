'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  MarbleRuntime,
  createMarblePublicSnapshot,
  marbleStateChecksum,
} = require('../../../dist/games/marble-survival/src/index.js');

const STATIC_ROOT = path.resolve(__dirname, '../public/complete-runtime');
const SECURITY_HEADERS = Object.freeze({
  'content-security-policy': "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; media-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
});

function json(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    ...extraHeaders,
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function text(response, status, payload, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(status, { ...SECURITY_HEADERS, 'cache-control': 'no-store', 'content-type': contentType });
  response.end(payload);
}

async function readJson(request, limit = 16 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) {
      const error = new Error('request body too large');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('invalid json');
    error.status = 400;
    throw error;
  }
}

function safeStaticPath(urlPath) {
  const clean = urlPath === '/' ? '/index.html' : urlPath;
  const normalized = path.posix.normalize(clean).replace(/^\.\.(\/|\\|$)/, '');
  const target = path.resolve(STATIC_ROOT, `.${normalized}`);
  return target.startsWith(STATIC_ROOT) ? target : null;
}

function tokenMatches(expected, provided) {
  const left = Buffer.from(String(expected));
  const right = Buffer.from(String(provided));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function createRuntime(options = {}) {
  const seed = String(options.seed || process.env.GAME7_SEED || 'broadcast-1');
  const operatorToken = String(options.operatorToken || process.env.GAME7_OPERATOR_TOKEN || 'local-self-test-only');
  const authority = MarbleRuntime.create(options.config || {}, seed);
  const tickMs = 1000 / authority.config.tickRate;
  const maxCatchUpTicks = Number.isInteger(options.maxCatchUpTicks) ? Math.max(1, Math.min(32, options.maxCatchUpTicks)) : 8;
  const events = [];
  let lastSchedulerMs = Number.isFinite(options.nowMs) ? Number(options.nowMs) : Date.now();
  let accumulatorMs = 0;
  let paused = false;
  let cleanFeed = false;
  const startedAtMs = lastSchedulerMs;

  function appendAuthorityEvents() {
    for (const event of authority.drainEvents()) {
      events.push(Object.freeze({
        id: `${event.seq}`,
        seq: event.seq,
        tick: event.tick,
        type: event.type,
        data: event.data ? { ...event.data } : undefined,
      }));
      if (events.length > 128) events.shift();
    }
  }

  appendAuthorityEvents();

  function advanceDue(nowMs) {
    if (!Number.isFinite(nowMs)) throw new TypeError('nowMs');
    if (nowMs < lastSchedulerMs) {
      lastSchedulerMs = nowMs;
      accumulatorMs = 0;
      return 0;
    }
    const elapsed = nowMs - lastSchedulerMs;
    lastSchedulerMs = nowMs;
    if (paused) {
      accumulatorMs = 0;
      return 0;
    }
    accumulatorMs += elapsed;
    const dueTicks = Math.floor((accumulatorMs + tickMs * 1e-9) / tickMs);
    const ticks = Math.min(maxCatchUpTicks, dueTicks);
    for (let index = 0; index < ticks; index++) authority.step();
    accumulatorMs -= ticks * tickMs;
    if (Math.abs(accumulatorMs) < 1e-9) accumulatorMs = 0;
    appendAuthorityEvents();
    return ticks;
  }

  function currentSnapshot() {
    return createMarblePublicSnapshot(authority.state);
  }

  function checksum() {
    return marbleStateChecksum(authority.state);
  }

  function health(nowMs = Date.now()) {
    const debtTicks = Math.max(0, Math.floor(accumulatorMs / tickMs));
    const quarantined = authority.state.lifecycle === 'quarantined';
    return {
      status: quarantined ? 'unhealthy' : debtTicks > maxCatchUpTicks ? 'degraded' : 'healthy',
      authority: quarantined ? 'quarantined' : paused ? 'paused' : 'running',
      lifecycle: authority.state.lifecycle,
      tick: authority.state.tick,
      round: authority.state.roundNumber,
      schedulerDebtTicks: debtTicks,
      maxCatchUpTicks,
      uptimeSeconds: Math.max(0, Math.floor((nowMs - startedAtMs) / 1000)),
      audienceInfluence: 'degraded',
    };
  }

  function operator(command, token) {
    if (!tokenMatches(operatorToken, token)) return { status: 401, ok: false, reason: 'unauthorized' };
    if (!['pause', 'resume', 'restart', 'clean-feed'].includes(command)) return { status: 400, ok: false, reason: 'invalid-command' };
    if (command === 'pause') paused = true;
    if (command === 'resume') {
      paused = false;
      accumulatorMs = 0;
    }
    if (command === 'restart') {
      authority.restart();
      appendAuthorityEvents();
      accumulatorMs = 0;
    }
    if (command === 'clean-feed') cleanFeed = !cleanFeed;
    return { status: 200, ok: true, command };
  }

  return {
    seed,
    authority,
    events,
    tickMs,
    maxCatchUpTicks,
    advanceDue,
    currentSnapshot,
    checksum,
    health,
    operator,
    get paused() { return paused; },
    get cleanFeed() { return cleanFeed; },
  };
}

function createServer(options = {}) {
  const runtime = createRuntime(options);
  const requestHandler = async (request, response) => {
    const origin = `http://${request.headers.host || 'localhost'}`;
    const url = new URL(request.url || '/', origin);
    try {
      if (request.method === 'GET' && url.pathname === '/api/snapshot') {
        return json(response, 200, runtime.currentSnapshot());
      }
      if (request.method === 'GET' && url.pathname === '/api/events') {
        return json(response, 200, { events: runtime.events.slice(-24) });
      }
      if (request.method === 'GET' && url.pathname === '/api/health') {
        return json(response, 200, runtime.health());
      }
      if (request.method === 'GET' && url.pathname === '/api/metrics') {
        const health = runtime.health();
        return text(response, 200, [
          '# TYPE game7_tick gauge',
          `game7_tick ${runtime.authority.state.tick}`,
          '# TYPE game7_round gauge',
          `game7_round ${runtime.authority.state.roundNumber}`,
          '# TYPE game7_scheduler_debt_ticks gauge',
          `game7_scheduler_debt_ticks ${health.schedulerDebtTicks}`,
        ].join('\n') + '\n', 'text/plain; version=0.0.4; charset=utf-8');
      }
      if (request.method === 'GET' && url.pathname === '/api/catalogue') {
        return json(response, 200, { catalogue: {}, status: 'temporarily-unavailable' });
      }
      if (request.method === 'POST' && url.pathname === '/api/influence') {
        await readJson(request);
        return json(response, 503, { accepted: false, reason: 'authority-scheduler-upgrade' });
      }
      if (request.method === 'POST' && url.pathname === '/api/operator') {
        const body = await readJson(request);
        const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const result = runtime.operator(String(body.command || ''), token);
        return json(response, result.status, result);
      }
      if (request.method !== 'GET') return json(response, 405, { error: 'method-not-allowed' });

      const filePath = safeStaticPath(url.pathname);
      if (!filePath) return json(response, 404, { error: 'not-found' });
      let data;
      try {
        data = fs.readFileSync(filePath);
      } catch {
        return json(response, 404, { error: 'not-found' });
      }
      const extension = path.extname(filePath);
      const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
      response.writeHead(200, { ...SECURITY_HEADERS, 'cache-control': extension === '.html' ? 'no-store' : 'public, max-age=300', 'content-type': contentTypes[extension] || 'application/octet-stream' });
      response.end(data);
    } catch (error) {
      json(response, error.status || 500, { error: error.status ? error.message : 'internal-error' });
    }
  };

  const server = http.createServer(requestHandler);
  const schedulerIntervalMs = Number(options.schedulerIntervalMs || 8);
  const timer = setInterval(() => runtime.advanceDue(Date.now()), schedulerIntervalMs);
  timer.unref();
  server.on('close', () => clearInterval(timer));
  return { server, runtime };
}

async function selfTest() {
  const { server } = createServer({ seed: 'self-test', operatorToken: 'test-token', schedulerIntervalMs: 4 });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const index = await fetch(`${base}/`);
    if (!index.ok || !(await index.text()).includes('Marble Survival Tournament')) throw new Error('index smoke failed');
    const snapshotResponse = await fetch(`${base}/api/snapshot`);
    const snapshotText = await snapshotResponse.text();
    if (!snapshotResponse.ok || !snapshotText.includes('"schemaVersion":2') || snapshotText.includes('rootSeed') || snapshotText.includes('tournamentSeed') || snapshotText.includes('self-test')) throw new Error('snapshot sanitization failed');
    const health = await (await fetch(`${base}/api/health`)).json();
    if (!['healthy', 'degraded'].includes(health.status)) throw new Error('health endpoint failed');
    const influence = await fetch(`${base}/api/influence`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'self-test-1', family: 'wind-vote', option: 'north' }),
    });
    if (influence.status !== 503) throw new Error('influence degradation boundary failed');
    const denied = await fetch(`${base}/api/operator`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer wrong' },
      body: JSON.stringify({ command: 'pause' }),
    });
    if (denied.status !== 401) throw new Error('operator denial failed');
    const accepted = await fetch(`${base}/api/operator`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      body: JSON.stringify({ command: 'pause' }),
    });
    if (accepted.status !== 200) throw new Error('operator authentication failed');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  process.stdout.write('Game 7 authoritative runtime self-test passed.\n');
}

if (require.main === module) {
  if (process.argv.includes('--self-test')) {
    selfTest().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  } else {
    const port = Number(process.env.PORT || 4317);
    const { server } = createServer();
    server.listen(port, '0.0.0.0', () => {
      process.stdout.write(`Game 7 browser source listening on http://0.0.0.0:${port}\n`);
    });
  }
}

module.exports = { createRuntime, createServer, selfTest };
