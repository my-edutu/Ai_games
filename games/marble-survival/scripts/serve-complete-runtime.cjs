'use strict';

const crypto = require('node:crypto');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const STATIC_ROOT = path.resolve(__dirname, '../public/complete-runtime');
const COMPILED_RUNTIME = path.resolve(__dirname, '../../../dist/games/marble-survival/src/index.js');
const SECURITY_HEADERS = Object.freeze({
  'content-security-policy': "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; media-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'SAMEORIGIN',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
});

const INFLUENCE_CATALOGUE = Object.freeze({
  'wind-vote': Object.freeze(['north', 'south', 'east', 'west']),
  'gate-tempo': Object.freeze(['steady', 'fast', 'slow']),
  'shield-orb': Object.freeze(['leader', 'midpack', 'underdog']),
  'cheer-pulse': Object.freeze(['left', 'centre', 'right']),
  'theme-vote': Object.freeze(['ivory', 'graphite', 'championship']),
  'next-arena': Object.freeze(['technical', 'speed', 'survival']),
});

function loadAuthorityModule() {
  try {
    return require(COMPILED_RUNTIME);
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND') {
      const wrapped = new Error('Game 7 compiled authority is missing. Run `npm run build` before starting the browser source.');
      wrapped.cause = error;
      throw wrapped;
    }
    throw error;
  }
}

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

function constantTimeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) {
    const maximum = Math.max(leftBuffer.length, rightBuffer.length, 1);
    const paddedLeft = Buffer.alloc(maximum);
    const paddedRight = Buffer.alloc(maximum);
    leftBuffer.copy(paddedLeft);
    rightBuffer.copy(paddedRight);
    crypto.timingSafeEqual(paddedLeft, paddedRight);
    return false;
  }
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createOperatorController(token, historyCap = 256) {
  const history = [];
  function record(entry) {
    history.push(Object.freeze({ ...entry }));
    while (history.length > historyCap) history.shift();
  }
  return {
    execute({ suppliedToken, command, actor, at }) {
      if (!constantTimeEqual(suppliedToken, token)) {
        record({ command, actor, at, ok: false, reason: 'unauthorized' });
        return { status: 401, ok: false, reason: 'unauthorized' };
      }
      if (!['pause', 'resume', 'restart', 'clean-feed'].includes(command)) {
        record({ command, actor, at, ok: false, reason: 'unsupported-command' });
        return { status: 400, ok: false, reason: 'unsupported-command' };
      }
      record({ command, actor, at, ok: true });
      return { status: 200, ok: true };
    },
    history() {
      return history.map((entry) => ({ ...entry }));
    },
  };
}

function createRuntime(options = {}) {
  const { MarbleRuntime, createMarblePresentationSnapshot } = loadAuthorityModule();
  const seed = String(options.seed || process.env.GAME7_SEED || 'broadcast-1');
  const operatorToken = String(options.operatorToken || process.env.GAME7_OPERATOR_TOKEN || 'local-self-test-only');
  const authority = MarbleRuntime.create(options.config || {}, seed);
  const operator = createOperatorController(operatorToken, 256);
  const events = [];
  const state = {
    paused: false,
    cleanFeed: false,
    authorityRunning: true,
    streamConnected: true,
    startedAt: Date.now(),
    lastStepAt: Date.now(),
  };

  function drainAuthorityEvents() {
    const drained = authority.drainEvents(64);
    for (const event of drained) {
      events.push(Object.freeze({ ...event, data: event.data ? Object.freeze({ ...event.data }) : undefined }));
    }
    while (events.length > 96) events.shift();
    return drained;
  }

  function currentSnapshot() {
    return createMarblePresentationSnapshot(authority.state, events);
  }

  function publicEvents() {
    return createMarblePresentationSnapshot(authority.state, events).events;
  }

  function advance() {
    if (state.paused || !state.authorityRunning) return authority.state;
    const beforeTick = authority.state.tick;
    const next = authority.step();
    state.lastStepAt = Date.now();
    drainAuthorityEvents();
    if (next.lifecycle === 'quarantined') state.authorityRunning = false;
    if (next.tick < beforeTick && next.runIndex === 0) {
      state.authorityRunning = false;
      throw new Error('authority tick regressed without a tournament restart');
    }
    return next;
  }

  function restart() {
    authority.restart();
    state.authorityRunning = true;
    state.lastStepAt = Date.now();
    drainAuthorityEvents();
    return authority.state;
  }

  function health() {
    const tickLag = Math.max(0, Math.floor((Date.now() - state.lastStepAt) / 100));
    let status = 'healthy';
    if (!state.authorityRunning || authority.state.lifecycle === 'quarantined') status = 'unhealthy';
    else if (!state.streamConnected || tickLag > 45) status = 'degraded';
    return {
      status,
      authorityRunning: state.authorityRunning,
      streamConnected: state.streamConnected,
      tickLag,
      uptimeSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
      runIndex: authority.state.runIndex,
      roundIndex: authority.state.roundIndex,
      roundNumber: authority.state.roundNumber,
      lifecycle: authority.state.lifecycle,
      tick: authority.state.tick,
    };
  }

  drainAuthorityEvents();
  return {
    seed,
    operatorToken,
    authority,
    operator,
    events,
    state,
    currentSnapshot,
    publicEvents,
    advance,
    restart,
    health,
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
        return json(response, 200, { events: runtime.publicEvents() });
      }
      if (request.method === 'GET' && url.pathname === '/api/health') {
        return json(response, 200, runtime.health());
      }
      if (request.method === 'GET' && url.pathname === '/api/metrics') {
        return text(response, 200, [
          '# TYPE game7_tick gauge',
          `game7_tick ${runtime.authority.state.tick}`,
          '# TYPE game7_round gauge',
          `game7_round ${runtime.authority.state.roundNumber}`,
          '# TYPE game7_survivors gauge',
          `game7_survivors ${runtime.authority.state.activeIds.length}`,
          '# TYPE game7_paused gauge',
          `game7_paused ${runtime.state.paused ? 1 : 0}`,
        ].join('\n') + '\n', 'text/plain; version=0.0.4; charset=utf-8');
      }
      if (request.method === 'GET' && url.pathname === '/api/catalogue') {
        return json(response, 200, {
          catalogue: INFLUENCE_CATALOGUE,
          authorityInfluenceEnabled: false,
          note: 'Viewer voting is disabled until votes are routed through the deterministic authority API.',
        });
      }
      if (request.method === 'POST' && url.pathname === '/api/influence') {
        await readJson(request);
        return json(response, 503, {
          accepted: false,
          applied: false,
          reason: 'authority-influence-unavailable',
        });
      }
      if (request.method === 'POST' && url.pathname === '/api/operator') {
        const body = await readJson(request);
        const suppliedToken = String(request.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const result = runtime.operator.execute({
          suppliedToken,
          command: String(body.command || ''),
          actor: String(body.actor || 'unknown'),
          at: Number(body.at || Date.now()),
        });
        if (result.ok) {
          if (body.command === 'pause') runtime.state.paused = true;
          if (body.command === 'resume') runtime.state.paused = false;
          if (body.command === 'restart') runtime.restart();
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
      const contentTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.svg': 'image/svg+xml',
      };
      response.writeHead(200, {
        ...SECURITY_HEADERS,
        'cache-control': extension === '.html' ? 'no-store' : 'public, max-age=300',
        'content-type': contentTypes[extension] || 'application/octet-stream',
      });
      response.end(data);
    } catch (error) {
      json(response, error.status || 500, { error: error.status ? error.message : 'internal-error' });
    }
  };

  const server = http.createServer(requestHandler);
  const timer = setInterval(() => {
    try {
      runtime.advance();
    } catch {
      runtime.state.authorityRunning = false;
    }
  }, options.tickIntervalMs || Math.max(16, Math.round(1000 / runtime.authority.config.tickRate)));
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
    if (!snapshotResponse.ok || !snapshotText.includes('"version":1') || snapshotText.includes('self-test')) throw new Error('snapshot authority/sanitization failed');

    const health = await (await fetch(`${base}/api/health`)).json();
    if (!['healthy', 'degraded'].includes(health.status)) throw new Error('health endpoint failed');

    const influence = await fetch(`${base}/api/influence`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'self-test-1', userId: 'viewer-1', family: 'wind-vote', option: 'north', at: 1000 }),
    });
    const influenceResult = await influence.json();
    if (influence.status !== 503 || influenceResult.applied !== false) throw new Error('influence honesty gate failed');

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
  process.stdout.write('Game 7 authoritative browser runtime self-test passed.\n');
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
      process.stdout.write(`Game 7 authoritative browser source listening on http://0.0.0.0:${port}\n`);
    });
  }
}

module.exports = { createRuntime, createServer, selfTest, INFLUENCE_CATALOGUE };
