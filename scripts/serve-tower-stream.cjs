'use strict';
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { checksum } = require('../dist/packages/replay/src/index.js');
const { TowerRuntime } = require('../dist/games/infinite-tower-climb/src/runtime/run.js');
const { createTowerRenderSnapshot } = require('../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const { TowerPresentationController } = require('../dist/games/infinite-tower-climb/src/presentation/controller.js');
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_ROOT = path.join(ROOT, 'public', 'infinite-tower-climb');
const THREE_ROOT = path.join(ROOT, 'node_modules', 'three', 'build');
const STREAM_CONFIG = Object.freeze({ maxTicks: 20000, noProgressTicks: 3000, intermissionTicks: 36, guardianInterval: 8, upgradeInterval: 4 });

function createSession(seed = 'tower-stream-reference', config = STREAM_CONFIG, policy = 'autonomous') {
  const runtime = TowerRuntime.create(config, seed, { policy });
  const controller = new TowerPresentationController({ replayCapacity: 360, maxEntities: 2048, muted: false });
  controller.accept(createTowerRenderSnapshot(runtime.state), runtime.drainEvents());
  return { runtime, controller };
}
function advance(session) {
  session.runtime.step();
  // This live host consumes events once. Its public replay ring is bounded separately.
  const events = session.runtime.drainEvents();
  return session.controller.accept(createTowerRenderSnapshot(session.runtime.state), events);
}
function privacySafe(snapshot, seed) {
  return !['seed', 'runId', 'config', 'chunks'].some(key => key in snapshot) && !JSON.stringify(snapshot).includes(seed);
}
function verifyRestart() {
  const session = createSession('tower-restart-probe', { ...STREAM_CONFIG, maxTicks: 100, noProgressTicks: 99, intermissionTicks: 1 }, 'idle-test');
  const first = createTowerRenderSnapshot(session.runtime.state);
  let guard = 0;
  while (session.runtime.state.lifecycle === 'running' && guard++ < 200) advance(session);
  advance(session); advance(session);
  const next = createTowerRenderSnapshot(session.runtime.state);
  return next.runToken !== first.runToken && next.tick === 0 && session.controller.frame().scene === 'normal';
}
function selfTest() {
  const seed = 'tower-phase3-self-test', first = createSession(seed), second = createSession(seed);
  let recoveryVerified = false;
  for (let i = 0; i < 600; i++) {
    const accepted = advance(first); second.runtime.step();
    if (!accepted.accepted) throw new Error(`presentation rejection: ${accepted.reason}`);
    if (i === 120) {
      first.controller.failOutput('synthetic renderer fault');
      recoveryVerified = first.controller.frame().scene === 'recovery' && first.controller.rebuildFromLatest().recovered;
    }
    if (first.runtime.state.lifecycle !== 'running' || second.runtime.state.lifecycle !== 'running') break;
  }
  const required = ['index.html', 'styles.css', 'ux-v2.css', 'app.js', 'visuals/scene.mjs', 'visuals/world.mjs', 'visuals/characters.mjs', 'visuals/hud.mjs'];
  const browserAssets = required.every(name => fs.existsSync(path.join(PUBLIC_ROOT, name)) && fs.statSync(path.join(PUBLIC_ROOT, name)).size > 100)
    && fs.existsSync(path.join(THREE_ROOT, 'three.module.js'));
  const snapshot = createTowerRenderSnapshot(first.runtime.state);
  const boundedSource = first.controller.replayWindow(10000).length <= 360;
  const restartObserved = verifyRestart();
  const authorityStable = checksum(first.runtime.state) === checksum(second.runtime.state);
  const report = { ok: authorityStable && browserAssets && boundedSource && privacySafe(snapshot, seed) && recoveryVerified && restartObserved,
    authorityStable, browserAssets, boundedSource, snapshotPrivacySafe: privacySafe(snapshot, seed), recoveryVerified, restartObserved,
    finalTick: first.runtime.state.tick, finalRunToken: snapshot.runToken, authorityChecksum: snapshot.authorityChecksum, presentation: first.controller.diagnostic() };
  process.stdout.write(`${JSON.stringify(report)}\n`); process.exitCode = report.ok ? 0 : 1;
}
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2' };
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data: https://gmedia.playstation.com https://dont-nod.com; media-src 'self' https://gmedia.playstation.com; object-src 'none'; base-uri 'none'; frame-ancestors *";
function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, { 'content-type': MIME['.json'], 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(body);
}
function resolvePublicAsset(pathname) {
  const vendor = { '/tower/vendor/three.module.js': 'three.module.js', '/tower/vendor/three.core.js': 'three.core.js' };
  if (vendor[pathname]) return path.join(THREE_ROOT, vendor[pathname]);
  if (['/tower', '/tower/'].includes(pathname)) return path.join(PUBLIC_ROOT, 'index.html');
  if (['/tower/gauntlet', '/tower/gauntlet/'].includes(pathname)) return path.join(PUBLIC_ROOT, 'gauntlet', 'index.html');
  if (!pathname.startsWith('/tower/')) return null;
  let relative;
  try { relative = decodeURIComponent(pathname.slice('/tower/'.length)); } catch { return null; }
  if (relative.includes('\\') || relative.includes('\0') || relative.split('/').some(segment => segment.startsWith('.'))) return null;
  if (!Object.hasOwn(MIME, path.extname(relative))) return null;
  const file = path.resolve(PUBLIC_ROOT, relative);
  if (!file.startsWith(PUBLIC_ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  if (!fs.realpathSync(file).startsWith(fs.realpathSync(PUBLIC_ROOT) + path.sep)) return null;
  return file;
}
function sendFile(req, res, file) {
  if (!file || !fs.existsSync(file)) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('Not found'); return; }
  const stat = fs.statSync(file), ext = path.extname(file);
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'content-length': stat.size,
    'cache-control': ['.html', '.json'].includes(ext) ? 'no-store' : 'public, max-age=0, must-revalidate',
    'content-security-policy': CSP, 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff' });
  if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
}
function dimension(value, fallback, min, max) {
  const number = Number(value); return Number.isFinite(number) && number > 0 ? Math.max(min, Math.min(max, Math.round(number))) : fallback;
}
function publicFrame(session, url) {
  const width = dimension(url.searchParams.get('w'), 1920, 320, 7680), height = dimension(url.searchParams.get('h'), 1080, 180, 4320);
  const frame = session.controller.frame(width, height, { reducedMotion: url.searchParams.get('reducedMotion') === '1', cleanFeed: url.searchParams.get('cleanFeed') === '1' });
  // A viewer's mute choice is local and cannot silence the director for other viewers.
  if (url.searchParams.get('muted') === '1') return { ...frame, audio: { ...frame.audio, muted: true, voices: [] } };
  return frame;
}
function createTowerStreamServer(options = {}) {
  const session = createSession(options.seed || 'tower-stream-reference', { ...STREAM_CONFIG, ...options.config }, options.policy || 'autonomous');
  let lastStepAt = Date.now(), simulationFault = false;
  const interval = setInterval(() => {
    try {
      const accepted = advance(session);
      if (!accepted.accepted) throw new Error(`presentation-${accepted.reason}`);
      if (simulationFault) session.controller.rebuildFromLatest();
      lastStepAt = Date.now(); simulationFault = false;
    } catch (error) {
      if (!simulationFault) process.stderr.write(`${JSON.stringify({ kind: 'tower-step-failed', type: error?.name || 'Error' })}\n`);
      simulationFault = true; session.controller.failOutput('Tower view is reconnecting');
    }
  }, 50); interval.unref();
  const server = http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { allow: 'GET, HEAD' }); res.end(); return; }
    let url;
    try { url = new URL(req.url || '/', 'http://local.invalid'); }
    catch { sendJson(res, 400, { error: 'invalid-request-target' }); return; }
    if (url.pathname === '/') { res.writeHead(302, { location: '/tower' }); res.end(); return; }
    if (url.pathname === '/tower/state') { sendJson(res, 200, publicFrame(session, url)); return; }
    if (url.pathname === '/tower/health') { sendJson(res, simulationFault ? 503 : 200, { status: simulationFault ? 'degraded' : 'healthy', lastStepAgeMs: Math.max(0, Date.now() - lastStepAt), scene: session.controller.frame().scene }); return; }
    if (url.pathname === '/tower/replay') { sendJson(res, 200, { frames: session.controller.replayWindow(120) }); return; }
    if (url.pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    sendFile(req, res, resolvePublicAsset(url.pathname));
  });
  server.on('close', () => clearInterval(interval));
  return { server, session };
}
function serve() {
  const arg = process.argv.find(value => value.startsWith('--port='));
  const port = Number(arg?.split('=')[1] ?? process.env.PORT ?? 4175);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new RangeError('port');
  const launchFloor = Number(process.env.TOWER_LAUNCH_FLOOR || 0);
  // Only the explicitly designated CI capture scenario shortens a REAL
  // authoritative run to make terminal → intermission → restart observable
  // inside one normal-speed recording. No tick acceleration or replay edits.
  // Normal preview/production hosts retain their original simulation budget.
  const outcomeCapture = process.env.CI === 'true' && process.env.TOWER_MOTION_SCENARIO === 'outcome';
  const captureConfig = outcomeCapture
    ? { launchFloor, maxTicks: 900, noProgressTicks: 850, intermissionTicks: 36 }
    : { launchFloor };
  const { server } = createTowerStreamServer({ seed: process.env.TOWER_SEED, config: captureConfig });
  server.listen(port, '0.0.0.0', () => process.stdout.write(`Infinite Tower Climb 3D listening on port ${port}; progress /tower/gauntlet\n`));
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
}
module.exports = { STREAM_CONFIG, createSession, advance, publicFrame, resolvePublicAsset, createTowerStreamServer };
if (require.main === module) { if (process.argv.includes('--self-test')) selfTest(); else serve(); }
