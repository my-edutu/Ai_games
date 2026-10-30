'use strict';
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public', 'ai-vs-1000-floors');
const STATIC = new Set(['index.html', 'styles.css', 'app.js', 'worker.js', 'audio.js', 'scene.js', 'character.js', 'environment.js', 'materials.js', 'static-batching.js', 'progress.html', 'progress.css', 'progress.js', 'progress.json']);

function contained(base, relative) {
  const target = path.resolve(base, relative);
  return target.startsWith(base + path.sep) ? target : null;
}

function resolveAsset(rawPath) {
  if (typeof rawPath !== 'string') return null;
  let url;
  try { url = decodeURIComponent(rawPath); } catch { return null; }
  if (/[\\\0]/.test(url) || /(^|\/)\.\.(\/|$)/.test(url)) return null;
  if (url === '/floors' || url === '/floors/') return path.join(PUBLIC, 'index.html');
  if (url === '/floors/progress' || url === '/floors/progress/') return path.join(PUBLIC, 'progress.html');
  if (url.startsWith('/floors/vendor/')) {
    const name = url.slice('/floors/vendor/'.length);
    if (!['three.module.js', 'three.core.js'].includes(name)) return null;
    return path.join(ROOT, 'node_modules', 'three', 'build', name);
  }
  if (url.startsWith('/floors/runtime/')) {
    const name = url.slice('/floors/runtime/'.length);
    if (!/^[a-zA-Z0-9_./-]+\.js$/.test(name)) return null;
    return contained(path.join(ROOT, 'dist-browser'), name);
  }
  if (url.startsWith('/floors/evidence/')) {
    const name = url.slice('/floors/evidence/'.length);
    if (!/^[a-zA-Z0-9_-]+\.(png|jpg|webm|mp4)$/.test(name)) return null;
    return contained(path.join(ROOT, 'evidence', 'thousand-floors', 'captures'), name);
  }
  if (!url.startsWith('/floors/')) return null;
  const name = url.slice('/floors/'.length);
  return STATIC.has(name) ? path.join(PUBLIC, name) : null;
}

function createServer() {
  return http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
    }
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { res.writeHead(400); res.end('Invalid URL'); return; }
    if (url.pathname === '/') { res.writeHead(302, { Location: '/floors/' }); res.end(); return; }
    if (url.pathname === '/floors/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ status: 'ready', game: 'ai-vs-1000-floors', totalFloors: 1000, benchmark: 'not-passed' })); return;
    }
    if (url.pathname === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    const file = resolveAsset(url.pathname);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); return;
    }
    const body = fs.readFileSync(file);
    const extension = path.extname(file);
    const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4' }[extension] || 'application/octet-stream';
    const hashes = extension === '.html' ? [...body.toString().matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].filter(match => match[1].trim()).map(match => `'sha256-${crypto.createHash('sha256').update(match[1]).digest('base64')}'`).join(' ') : '';
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': `default-src 'self'; script-src 'self' ${hashes}; worker-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'`
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
}

if (require.main === module) {
  const argument = process.argv.find(value => value.startsWith('--port='));
  const port = Number(argument?.split('=')[1] || process.env.PORT || 4184);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new RangeError('Invalid port');
  const server = createServer();
  server.listen(port, '127.0.0.1', () => process.stdout.write(`Game 4: http://localhost:${port}/floors/\nProgress: http://localhost:${port}/floors/progress\n`));
  const close = () => server.close(() => process.exit(0));
  process.on('SIGTERM', close); process.on('SIGINT', close);
}

module.exports = { createServer, resolveAsset };
