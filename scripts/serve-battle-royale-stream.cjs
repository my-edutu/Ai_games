'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { BattleRoyaleRuntime } = require('../dist/games/ai-battle-royale/src/runtime.js');

const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public/ai-battle-royale');
const assets = new Map([
  ['index.html', 'index.html'], ['styles.css', 'styles.css'], ['app.js', 'app.js'],
  ['world.js', 'world.js'], ['characters.js', 'characters.js'], ['audio.js', 'audio.js'],
  ['dev/index.html', 'dev/index.html'], ['dev/progress.js', 'dev/progress.js'],
  ['dev/progress.json', 'dev/progress.json'],
]);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp' };
const headers = {
  'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
};
function json(res, status, data) {
  res.writeHead(status, { ...headers, 'content-type': types['.json'] });
  res.end(JSON.stringify(data));
}
function serve({port = 4177, seed = 'last-light-outpost-06', runtime = new BattleRoyaleRuntime(seed)} = {}) {
  let lastTick = Date.now(), fault = null;
  let current = runtime.snapshot();
  const interval = setInterval(() => {
    if (fault) return;
    try { runtime.step(); current = runtime.snapshot(); lastTick = Date.now(); }
    catch (error) {
      fault = 'SIMULATION_QUARANTINED';
      console.error(JSON.stringify({code: fault, message: String(error.message).slice(0, 200)}));
    }
  }, 50);
  const server = http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') { json(res, 405, {error: 'Read-only stream'}); return; }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://local.invalid').pathname); }
    catch { json(res, 400, {error: 'Invalid request'}); return; }
    if (pathname === '/' || pathname === '/royale') { res.writeHead(302, {location: '/royale/'}); res.end(); return; }
    if (pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    if (pathname === '/royale/state') { json(res, fault ? 503 : 200, fault ? {error: fault} : current); return; }
    if (pathname === '/royale/health') {
      json(res, fault ? 503 : 200, {status: fault ? 'quarantined' : 'healthy', tick: current.tick, matchId: current.matchId, lastStepAgeMs: Date.now() - lastTick}); return;
    }
    let file;
    const route = pathname === '/royale/' ? 'index.html' : pathname === '/royale/dev/' ? 'dev/index.html' : pathname.slice('/royale/'.length);
    if (pathname.startsWith('/royale/') && assets.has(route)) file = path.join(publicRoot, assets.get(route));
    if (pathname === '/royale/vendor/three.module.js') file = path.join(root, 'node_modules/three/build/three.module.js');
    if (pathname === '/royale/vendor/three.core.js') file = path.join(root, 'node_modules/three/build/three.core.js');
    if (/^\/royale\/dev\/captures\/[a-z0-9-]+\.png$/.test(pathname)) file = path.join(publicRoot, 'dev/captures', path.basename(pathname));
    if (!file || !fs.existsSync(file)) { json(res, 404, {error: 'Not found'}); return; }
    const stat = fs.statSync(file);
    res.writeHead(200, {...headers, 'content-type': types[path.extname(file)] || 'application/octet-stream', 'content-length': stat.size});
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = fs.createReadStream(file);
    stream.on('error', () => res.destroy()); stream.pipe(res);
  });
  server.requestTimeout = 10000; server.headersTimeout = 10000;
  server.on('close', () => clearInterval(interval));
  server.listen(port, '0.0.0.0', () => console.log(`LAST LIGHT — http://localhost:${port}/royale/ | progress: /royale/dev/`));
  return server;
}
if (require.main === module) {
  const arg = process.argv.find(value => value.startsWith('--port='));
  const port = Number(arg ? arg.slice(7) : process.env.PORT || 4177);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new RangeError('Invalid port');
  const server = serve({port, seed: process.env.ROYALE_SEED || 'last-light-outpost-06'});
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
module.exports = {serve};
