'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { checksum } = require('../dist/packages/replay/src/index.js');
const { SnakeRuntime } = require('../dist/games/autonomous-snake/src/runtime/run.js');
const { buildRenderSnapshot } = require('../dist/games/autonomous-snake/src/presentation/snapshot.js');
const { BroadcastExperience } = require('../dist/games/autonomous-snake/src/presentation/experience.js');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_ROOT = path.join(ROOT, 'public', 'snake-stream');
const STREAM_CONFIG = Object.freeze({
  width: 28,
  height: 16,
  targetLength: 96,
  initialLength: 3,
  intermissionTicks: 20,
  profile: 'portals',
  hazardCount: 5,
  hazardPeriod: 12,
  hazardActiveTicks: 5,
  specialFoodEvery: 4,
  specialFoodLifetime: 36,
  noProgressTicks: 750,
});

function createSession(seed = 'stream-reference-seed', config = STREAM_CONFIG) {
  const runtime = SnakeRuntime.create(config, seed);
  const experience = new BroadcastExperience({
    replayCapacity: 360,
    bestLength: 0,
    maxActiveVfx: 32,
    maxAudioVoices: 8,
    muted: false,
  });
  let eventCursor = 0;
  experience.accept(buildRenderSnapshot(runtime.state), runtime.events.slice(eventCursor));
  eventCursor = runtime.events.length;
  return { runtime, experience, getEventCursor: () => eventCursor, setEventCursor: value => { eventCursor = value; } };
}

function advance(session) {
  session.runtime.step();
  const cursor = session.getEventCursor();
  const events = session.runtime.events.slice(cursor);
  session.setEventCursor(session.runtime.events.length);
  return session.experience.accept(buildRenderSnapshot(session.runtime.state), events);
}

function assetPaths() {
  return ['index.html', 'styles.css', 'ux-v2.css', 'app.js'].map(name => path.join(PUBLIC_ROOT, name));
}

function isSnapshotPrivacySafe(snapshot, seed) {
  const serialized = JSON.stringify(snapshot);
  return !('seed' in snapshot)
    && !('runId' in snapshot)
    && !serialized.includes(seed)
    && !serialized.includes('recentHashes')
    && !serialized.includes('nodeExpansions');
}

function verifyRunRestart() {
  const probe = createSession('phase3-restart-probe', {
    width: 8,
    height: 8,
    targetLength: 4,
    initialLength: 3,
    intermissionTicks: 1,
    profile: 'open',
    hazardCount: 0,
    hazardPeriod: 8,
    hazardActiveTicks: 8,
    specialFoodEvery: 4,
    specialFoodLifetime: 30,
    noProgressTicks: 80,
  });
  const first = buildRenderSnapshot(probe.runtime.state);
  probe.runtime.state.food = probe.runtime.state.snake.body[0] + 1;
  advance(probe);
  const resultFrame = probe.experience.frame();
  if (resultFrame.scene !== 'result' || resultFrame.snapshot?.result?.reason !== 'victory') return false;
  advance(probe);
  if (probe.experience.frame().scene !== 'intermission') return false;
  advance(probe);
  const restarted = buildRenderSnapshot(probe.runtime.state);
  const publicFrame = probe.experience.frame();
  return restarted.runToken !== first.runToken
    && restarted.tick === 0
    && publicFrame.tick === 0
    && publicFrame.replayAvailable === 1
    && publicFrame.scene === 'normal';
}

function selfTest() {
  const seed = 'phase3-self-test';
  const first = createSession(seed);
  const second = createSession(seed);
  let recoveryVerified = false;

  for (let index = 0; index < 900; index++) {
    const acceptance = advance(first);
    second.runtime.step();
    if (!acceptance.accepted) throw new Error(`presentation rejected current snapshot: ${acceptance.reason}`);

    if (index === 120) {
      first.experience.failRenderer('synthetic internal renderer fault');
      if (first.experience.frame().scene !== 'recovery') throw new Error('recovery scene missing');
      recoveryVerified = first.experience.rebuildFromLatest().recovered;
    }
  }

  const restartObserved = verifyRunRestart();
  const authorityStable = checksum(first.runtime.state) === checksum(second.runtime.state);
  const snapshot = buildRenderSnapshot(first.runtime.state);
  const browserAssets = assetPaths().every(file => fs.existsSync(file) && fs.statSync(file).size > 128);
  const source = browserAssets ? fs.readFileSync(path.join(PUBLIC_ROOT, 'app.js'), 'utf8') : '';
  const boundedSource = source.includes('MAX_PARTICLES = 240') && !source.includes('innerHTML =');
  const publicFrame = first.experience.frame();
  const report = {
    ok: authorityStable && browserAssets && boundedSource && isSnapshotPrivacySafe(snapshot, seed) && recoveryVerified && restartObserved,
    authorityStable,
    browserAssets,
    boundedSource,
    snapshotPrivacySafe: isSnapshotPrivacySafe(snapshot, seed),
    recoveryVerified,
    restartObserved,
    finalTick: first.runtime.state.tick,
    finalRunToken: snapshot.runToken,
    finalAuthorityChecksum: snapshot.authorityChecksum,
    activeVfx: publicFrame.vfx.length,
    audioVoices: publicFrame.audio.voices.length,
    presentation: first.experience.diagnostic(),
  };
  process.stdout.write(`${JSON.stringify(report)}\n`);
  process.exitCode = report.ok ? 0 : 1;
}

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8';
  return 'application/octet-stream';
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(body);
}

function sendFile(response, file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  const body = fs.readFileSync(file);
  response.writeHead(200, {
    'content-type': contentType(file),
    'content-length': body.length,
    'cache-control': file.endsWith('.html') ? 'no-store' : 'public, max-age=300',
    'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; media-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors *",
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
  });
  response.end(body);
}

function serve() {
  const portArgument = process.argv.find(value => value.startsWith('--port='));
  const port = Number(portArgument?.split('=')[1] ?? process.env.PORT ?? 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new RangeError('port');

  const session = createSession(process.env.SNAKE_SEED || 'stream-reference-seed');
  let lastStepAt = Date.now();
  let simulationFault = false;
  const interval = setInterval(() => {
    try {
      advance(session);
      lastStepAt = Date.now();
      simulationFault = false;
    } catch {
      simulationFault = true;
      session.experience.failRenderer('public-safe simulation view unavailable');
    }
  }, 125);
  interval.unref();

  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://local.invalid');
    if (requestUrl.pathname === '/snapshot') {
      sendJson(response, 200, session.experience.frame(1920, 1080));
      return;
    }
    if (requestUrl.pathname === '/replay') {
      sendJson(response, 200, { frames: session.experience.replayWindow(90) });
      return;
    }
    if (requestUrl.pathname === '/health') {
      sendJson(response, simulationFault ? 503 : 200, {
        status: simulationFault ? 'degraded' : 'healthy',
        lastStepAgeMs: Math.max(0, Date.now() - lastStepAt),
        scene: session.experience.frame().scene,
      });
      return;
    }
    if (requestUrl.pathname === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }

    const fileByRoute = {
      '/': 'index.html',
      '/index.html': 'index.html',
      '/styles.css': 'styles.css',
      '/ux-v2.css': 'ux-v2.css',
      '/app.js': 'app.js',
    };
    const fileName = fileByRoute[requestUrl.pathname];
    if (!fileName) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    sendFile(response, path.join(PUBLIC_ROOT, fileName));
  });

  server.listen(port, '0.0.0.0', () => {
    process.stdout.write(`Autonomous Snake stream source listening on port ${port}\n`);
  });

  const shutdown = () => {
    clearInterval(interval);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (process.argv.includes('--self-test')) selfTest();
else serve();
