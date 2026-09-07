'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {
  INFLUENCE_CATALOGUE,
  runCampaign,
  createPublicSnapshot,
  InfluenceQueue,
  SnapshotRing,
  classifyHealth,
  OperatorController,
} = require('../complete/game7.cjs');

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

function createRuntime(options = {}) {
  const seed = String(options.seed || process.env.GAME7_SEED || 'broadcast-1');
  const operatorToken = String(options.operatorToken || process.env.GAME7_OPERATOR_TOKEN || 'local-self-test-only');
  const campaign = runCampaign(seed);
  const influence = new InfluenceQueue({ queueCap: 64, cooldownMs: 15_000, globalRateCap: 120, dedupeCap: 512 });
  const snapshots = new SnapshotRing(12);
  const operator = new OperatorController(operatorToken, 256);
  const events = [];
  const state = {
    roundIndex: 0,
    tick: 0,
    paused: false,
    cleanFeed: false,
    authorityRunning: true,
    streamConnected: true,
    startedAt: Date.now(),
    lastTickAt: Date.now(),
  };

  function appendEvent(type, detail = {}) {
    events.push(Object.freeze({ id: `${type}-${state.roundIndex}-${state.tick}-${events.length}`, type, at: Date.now(), ...detail }));
    if (events.length > 64) events.shift();
  }

  function currentSnapshot() {
    const snapshot = createPublicSnapshot(campaign, { roundIndex: state.roundIndex, tick: state.tick });
    snapshots.write(snapshot);
    return snapshot;
  }

  function advance() {
    if (state.paused) return;
    state.tick += 1;
    state.lastTickAt = Date.now();
    if (state.tick === 1) appendEvent('round-start', { round: campaign.rounds[state.roundIndex].id });
    if (state.tick % 47 === 0) appendEvent('near-miss');
    if (state.tick >= 180) {
      appendEvent(state.roundIndex === campaign.rounds.length - 1 ? 'champion' : 'qualification');
      state.roundIndex += 1;
      state.tick = 0;
      if (state.roundIndex >= campaign.rounds.length) state.roundIndex = 0;
    }
  }

  function health() {
    const latest = snapshots.latestValid();
    const tickLag = Math.max(0, Math.floor((Date.now() - state.lastTickAt) / 100));
    return {
      ...classifyHealth({
        authorityRunning: state.authorityRunning,
        snapshotAvailable: Boolean(latest),
        tickLag,
        streamConnected: state.streamConnected,
      }),
      tickLag,
      uptimeSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
      round: campaign.rounds[state.roundIndex].id,
      tick: state.tick,
    };
  }

  return { seed, operatorToken, campaign, influence, snapshots, operator, events, state, appendEvent, currentSnapshot, advance, health };
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
        return text(response, 200, [
          '# TYPE game7_tick gauge',
          `game7_tick ${runtime.state.tick}`,
          '# TYPE game7_round gauge',
          `game7_round ${runtime.state.roundIndex + 1}`,
          '# TYPE game7_influence_queue gauge',
          `game7_influence_queue ${runtime.influence.size()}`,
        ].join('\n') + '\n', 'text/plain; version=0.0.4; charset=utf-8');
      }
      if (request.method === 'GET' && url.pathname === '/api/catalogue') {
        return json(response, 200, { catalogue: INFLUENCE_CATALOGUE });
      }
      if (request.method === 'POST' && url.pathname === '/api/influence') {
        const body = await readJson(request);
        const result = runtime.influence.submit({
          id: String(body.id || ''),
          userId: String(body.userId || ''),
          family: String(body.family || ''),
          option: String(body.option || ''),
          at: Number(body.at),
          eligible: body.eligible !== false,
        });
        if (result.accepted) runtime.appendEvent('influence', { family: body.family, option: body.option });
        return json(response, result.accepted ? 202 : 429, result);
      }
      if (request.method === 'POST' && url.pathname === '/api/operator') {
        const body = await readJson(request);
        const token = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const result = runtime.operator.execute({ token, command: body.command, actor: body.actor, at: Number(body.at) });
        if (result.ok) {
          if (body.command === 'pause') runtime.state.paused = true;
          if (body.command === 'resume') runtime.state.paused = false;
          if (body.command === 'restart') {
            runtime.state.roundIndex = 0;
            runtime.state.tick = 0;
          }
          if (body.command === 'clean-feed') runtime.state.cleanFeed = Boolean(body.enabled);
        }
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
  const timer = setInterval(runtime.advance, options.tickIntervalMs || 100);
  timer.unref();
  server.on('close', () => clearInterval(timer));
  return { server, runtime };
}

async function selfTest() {
  const { server } = createServer({ seed: 'self-test', operatorToken: 'test-token', tickIntervalMs: 25 });
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
    if (!snapshotResponse.ok || !snapshotText.includes('campaignChecksum') || snapshotText.includes('self-test')) throw new Error('snapshot sanitization failed');
    const health = await (await fetch(`${base}/api/health`)).json();
    if (!['healthy', 'degraded'].includes(health.status)) throw new Error('health endpoint failed');
    const influence = await fetch(`${base}/api/influence`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'self-test-1', userId: 'viewer-1', family: 'wind-vote', option: 'north', at: 1000 }),
    });
    if (influence.status !== 202) throw new Error('influence endpoint failed');
    const denied = await fetch(`${base}/api/operator`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer wrong' },
      body: JSON.stringify({ command: 'pause', actor: 'self-test', at: 1 }),
    });
    if (denied.status !== 401) throw new Error('operator denial failed');
    const accepted = await fetch(`${base}/api/operator`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      body: JSON.stringify({ command: 'pause', actor: 'self-test', at: 2 }),
    });
    if (accepted.status !== 200) throw new Error('operator authentication failed');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  process.stdout.write('Game 7 complete runtime self-test passed.\n');
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
