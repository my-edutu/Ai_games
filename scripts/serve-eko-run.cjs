'use strict';
// A development-only authoritative host. Simulations remain in the existing Eko engine.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const game = require('../dist/games/eko-street-run/src/index.js');
const { createReactivePilot } = require('./eko-ai-pilot.cjs');

const PORT = Number(process.env.EKO_PORT || 4177);
const HOST = process.env.EKO_HOST || '127.0.0.1';
const ROOT = path.resolve(__dirname, '..');
const clients = new Set();
const VALID_MODES = new Set(['ai', 'player']);
const VALID_OUTFITS = new Set(['lagos-streetwear', 'yoruba-agbada-fila', 'igbo-isi-agu-red-cap', 'hausa-baban-riga-cap']);
const seed = (process.env.EKO_SEED || 'eko-gauntlet-mainland-v1').slice(0, 128);
const config = game.createDefaultConfig({ seed });
let state = game.createPhase6State(config);
let events = [];
let mode = 'ai';
let outfit = 'lagos-streetwear';
let sequence = 0;
let terminalTicks = 0;
const pilot = createReactivePilot();
let input = { axis: 1, jumpPressed: false, jumpReleased: false, slide: false, vault: false };
let latest = {};
let fault = null;
let nextBroadcast = 0;

function command(type, payload) {
  return {
    schemaVersion: game.COMMAND_SCHEMA_VERSION, runId: state.runId,
    targetTick: state.tick, priority: 0, sourceId: 'eko-stream-host',
    sourceSequence: sequence++, type, payload,
  };
}
function aiIntent(snapshot) { return pilot.decide(snapshot); }
function payload() {
  return {
    snapshot: game.createRenderSnapshot(state, events),
    checksum: game.checksumState(state),
    mode, outfit, seed,
    error: fault ? { code: 'AUTHORITY_QUARANTINED', message: 'Simulation stopped; inspect host logs.' } : null,
  };
}
function broadcast() {
  latest = payload();
  events = []; // one bounded batch of semantic events per publicly emitted frame
  const packet = 'data: ' + JSON.stringify(latest) + '\n\n';
  for (const client of clients) {
    if (client.destroyed || client.writableLength > 131072) { clients.delete(client); client.end(); continue; }
    client.write(packet);
  }
}
function tick() {
  if (fault) return;
  try {
    let type, value;
    if (state.lifecycle === 'running') {
      const intent = mode === 'ai' ? aiIntent(game.createRenderSnapshot(state)) : input;
      type = 'move'; value = { ...intent };
      input.jumpPressed = false; input.jumpReleased = false; input.slide = false; input.vault = false;
      terminalTicks = 0;


    } else {
      terminalTicks++;
      if (terminalTicks < 90) {
        if (++nextBroadcast % 3 === 0) broadcast();
        return;
      }
      if (state.lifecycle === 'failed') { type = 'restart'; value = {}; }
      else if (state.lifecycle === 'intermission') { type = 'advance'; value = {}; }
      else {
        state = game.createPhase6State(config); sequence = 0; terminalTicks = 0; pilot.reset();
        broadcast(); return;
      }
      terminalTicks = 0;
      pilot.reset();
    }
    const result = game.stepSimulation(state, [command(type, value)], config);
    if (result.rejectedCommands.length) throw new Error('AUTHORITATIVE_COMMAND_REJECTED: ' + result.rejectedCommands[0].reason);
    state = result.state;
    events = [...events, ...result.events].slice(-12);
    if (++nextBroadcast % 3 === 0) broadcast();
  } catch (error) {
    fault = error;
    console.error('[EKO_RUN_AUTHORITY_FAILED]', error);
    broadcast();
  }
}
function send(res, code, type, body, cache = 'no-store') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; frame-src 'self'" });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 2048) { reject(new Error('PAYLOAD_TOO_LARGE')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { reject(new Error('INVALID_JSON')); }
    });
    req.on('error', reject);
  });
}
const FILES = new Map([
  ['/eko/', ['public/eko-run/index.html', 'text/html; charset=utf-8']],
  ['/eko/app.js', ['public/eko-run/app.js', 'text/javascript; charset=utf-8']],
  ['/eko/theme.css', ['public/eko-run/theme.css', 'text/css; charset=utf-8']],
  ['/eko/character-craft.js', ['public/eko-run/character-craft.js', 'text/javascript; charset=utf-8']],
  ['/eko/static-batch.js', ['public/eko-run/static-batch.js', 'text/javascript; charset=utf-8']],
  ['/eko/material-craft.js', ['public/eko-run/material-craft.js', 'text/javascript; charset=utf-8']],
  ['/eko/world-vibrance.js', ['public/eko-run/world-vibrance.js', 'text/javascript; charset=utf-8']],
  ['/eko/atmosphere.js', ['public/eko-run/atmosphere.js', 'text/javascript; charset=utf-8']],
  ['/eko/gamefeel.js', ['public/eko-run/gamefeel.js', 'text/javascript; charset=utf-8']],
  ['/eko/soundscape.js', ['public/eko-run/soundscape.js', 'text/javascript; charset=utf-8']],
  ['/eko/adaptive-quality.js', ['public/eko-run/adaptive-quality.js', 'text/javascript; charset=utf-8']],
  ['/eko/city-crowd.js', ['public/eko-run/city-crowd.js', 'text/javascript; charset=utf-8']],
  ['/eko/hazard-sculpt.js', ['public/eko-run/hazard-sculpt.js', 'text/javascript; charset=utf-8']],
  ['/eko/district-landmarks.js', ['public/eko-run/district-landmarks.js', 'text/javascript; charset=utf-8']],
  ['/eko/camera-director.js', ['public/eko-run/camera-director.js', 'text/javascript; charset=utf-8']],
  ['/eko/progress', ['public/eko-run/progress.html', 'text/html; charset=utf-8']],
  ['/eko/progress.js', ['public/eko-run/progress.js', 'text/javascript; charset=utf-8']],
  ['/eko/gauntlet.json', ['public/eko-run/gauntlet.json', 'application/json; charset=utf-8']],
  ['/vendor/three.module.js', ['node_modules/three/build/three.module.js', 'text/javascript; charset=utf-8']],
  ['/vendor/three.core.js', ['node_modules/three/build/three.core.js', 'text/javascript; charset=utf-8']],
]);
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/eko/health') {
    return send(res, fault ? 503 : 200, 'application/json', JSON.stringify({ status: fault ? 'quarantined' : 'ok', tick: state.tick, clients: clients.size, mode, pilot: pilot.metrics(), district: state.progression?.districtId || null }));
  }
  if (req.method === 'GET' && url.pathname === '/eko/state') return send(res, 200, 'application/json', JSON.stringify(payload()));
  if (req.method === 'GET' && url.pathname === '/eko/stream') {
    res.writeHead(200, { 'Content-Type':'text/event-stream', 'Cache-Control':'no-cache, no-transform', 'Connection':'keep-alive', 'X-Accel-Buffering':'no', 'X-Content-Type-Options':'nosniff' });
    if (clients.size >= 32) return res.end();
    clients.add(res);
    res.write('retry: 1000\n\n');
    res.write('data: ' + JSON.stringify(payload()) + '\n\n');
    req.on('close', () => clients.delete(res));
    return;
  }
  if (req.method === 'POST' && url.pathname === '/eko/control') {
    const origin = req.headers.origin;
    const host = req.headers.host;
    if (origin) {
      let permitted = false;
      try { const parsed = new URL(origin); permitted = parsed.protocol === 'http:' && !!host && parsed.host === host; } catch {}
      if (!permitted) return send(res, 403, 'application/json', '{"error":"ORIGIN_DENIED"}');
    }
    try {
      const body = await readBody(req);
      if (typeof body !== 'object' || !body || Array.isArray(body)) throw new Error('INVALID_CONTROL');
      // Validate the COMPLETE request before touching the authoritative run.
      // Previously resetPreview:true followed by mode:'invalid' reset a run on a 400.
      const nextMode=body.mode===undefined?mode:body.mode;
      if(body.resetPreview!==undefined && body.resetPreview!==true)throw new Error('INVALID_RESET_PREVIEW');
      if(body.mode!==undefined && !VALID_MODES.has(body.mode))throw new Error('INVALID_MODE');
      if(body.outfit!==undefined && !VALID_OUTFITS.has(body.outfit))throw new Error('INVALID_OUTFIT');
      let newInput=null;
      if(body.input!==undefined){
        if(nextMode!=='player'||!body.input||typeof body.input!=='object'||Array.isArray(body.input))
          throw new Error('INPUT_UNAVAILABLE');
        const p=body.input;
        if(![-1,0,1].includes(p.axis)||
          ['jumpPressed','jumpReleased','slide','vault'].some(k=>p[k]!==undefined&&typeof p[k]!=='boolean'))
          throw new Error('INVALID_INPUT');
        newInput={axis:p.axis,jumpPressed:!!p.jumpPressed,jumpReleased:!!p.jumpReleased,
          slide:!!p.slide,vault:!!p.vault};
      }
      if(body.resetPreview===true){
        state=game.createPhase6State(config);
        events=[];sequence=0;terminalTicks=0;fault=null;
        input={axis:1,jumpPressed:false,jumpReleased:false,slide:false,vault:false};
        pilot.reset();
      }
      if(body.mode!==undefined){
        mode=body.mode;
        if(mode==='ai')pilot.reset();
      }
      if(body.outfit!==undefined)outfit=body.outfit;
      if(newInput){
        input={axis:newInput.axis,
          jumpPressed:newInput.jumpPressed||input.jumpPressed,
          jumpReleased:newInput.jumpReleased||input.jumpReleased,
          slide:newInput.slide||input.slide,
          vault:newInput.vault||input.vault};
      }
      if(body.resetPreview===true)broadcast();
      return send(res, 200, 'application/json', JSON.stringify({ ok: true, mode, outfit }));
    } catch (error) {
      return send(res, 400, 'application/json', JSON.stringify({ error: error.message }));
    }
  }
  if (req.method === 'GET' && (url.pathname === '/eko' || FILES.has(url.pathname))) {
    const [file, type] = FILES.get(url.pathname === '/eko' ? '/eko/' : url.pathname);
    try { return send(res, 200, type, fs.readFileSync(path.join(ROOT, file)), url.pathname.startsWith('/vendor/') ? 'public, max-age=86400' : 'no-cache'); }
    catch { return send(res, 404, 'text/plain', 'Asset not available'); }
  }
  return send(res, 404, 'application/json', '{"error":"NOT_FOUND"}');
});
server.listen(PORT, HOST, () => console.log('Eko Run live at http://' + HOST + ':' + PORT + '/eko/'));
const interval = setInterval(tick, 1000 / 60);
interval.unref();
process.on('SIGINT', () => { clearInterval(interval); server.close(); });
process.on('SIGTERM', () => { clearInterval(interval); server.close(); });
