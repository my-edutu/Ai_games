'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('@playwright/test');
const { EscapeRuntime, DEFAULT_ESCAPE_ROOM_CONFIG, parseEscapeRoomConfig, buildEscapeRenderSnapshot } = require('../dist/games/ai-escape-room/src/index.js');

async function main() {
  const label = process.argv[2] || 'current';
  if (!/^[a-z0-9-]+$/.test(label)) throw new Error('Use a simple capture label');
  const out = path.resolve(__dirname, '../evidence/ai-escape-room/gauntlet/captures', label);
  fs.mkdirSync(out, { recursive: true });
  const sourceFiles = ['app.js','archivist3d.js','bootstrap.js','room3d.js','room3d-polish.js','mechanisms3d.js','scenery3d.js','index.html','styles.css','ux-v2.css'];
  const sourceHashes = () => Object.fromEntries(sourceFiles.map(file => [`public/ai-escape-room/${file}`, crypto.createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../public/ai-escape-room',file))).digest('hex')]));
  const before = sourceHashes();
  const config = parseEscapeRoomConfig({ ...DEFAULT_ESCAPE_ROOM_CONFIG, theme: 'cipher-vault', difficulty: 8, puzzleDepth: 8, objectCount: 36, decoyCount: 5, hazardCount: 2, maxTicks: 2400, noProgressTicks: 360, intermissionTicks: 24 });
  const runtime = EscapeRuntime.create({ config, seed: 'gauntlet-vault-reference-v1', runId: 'gauntlet-capture', policy: 'autonomous' });
  const frames = [buildEscapeRenderSnapshot(runtime.state, runtime.presentationSignals(), runtime.drainEvents())];
  for (let i = 0; i < config.maxTicks && runtime.state.lifecycle === 'running'; i++) {
    const step = runtime.step();
    frames.push(buildEscapeRenderSnapshot(runtime.state, runtime.presentationSignals(), step.events));
  }
  const opening = frames[0];
  const mechanismFrame = frames.find(f => f.objects.some(o => o.mechanismKind && o.inspected && !o.solved)) || opening;
  const mechanism = mechanismFrame.objects.find(o => o.mechanismKind && o.inspected && !o.solved) || mechanismFrame.objects.find(o => o.mechanismKind);
  const ending = frames[frames.length - 1];
  const browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader-webgl', '--enable-unsafe-swiftshader'] });
  try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(90000);
  await page.addInitScript(frame => {
    const original = window.fetch;
    window.fetch = function (input, ...args) {
      const url = new URL(typeof input === 'string' ? input : input.url, location.href);
      if (url.pathname === '/escape-room/state') return Promise.resolve(new Response(JSON.stringify(frame), { status: 200, headers: { 'content-type': 'application/json' } }));
      return original.call(this, input, ...args);
    };
  }, opening);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:4177/escape-room?muted=1&evidence=1&reducedMotion=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__ESCAPE_PUBLIC_STATE__ && window.__ESCAPE_RENDER_DIAGNOSTICS__?.webgl), null, { polling: 100 });
  await page.evaluate(frame => {
    const prototype = window.EscapeRoom3D.prototype, original = prototype.setState;
    prototype.setState = function (state) { window.__GAUNTLET_CAPTURE_ROOM__ = this; return original.call(this, state); };
    window.__ESCAPE_PRESENT_FRAME__(frame); prototype.setState = original;
    const room = window.__GAUNTLET_CAPTURE_ROOM__;
    cancelAnimationFrame(room.frameRequest); room.setQuality('low');
  }, opening);
  await page.waitForLoadState('networkidle');
  async function settle() {
    // Use the real renderer's frame method, then pause RAF for a stable software-
    // rendered still. Continuous SwiftShader rendering can starve screenshot copy.
    await page.evaluate(() => {
      const room = window.__GAUNTLET_CAPTURE_ROOM__;
      for (let i = 0; i < 3; i++) { cancelAnimationFrame(room.frameRequest); room.frame(performance.now()); cancelAnimationFrame(room.frameRequest); }
    });
  }
  async function capture(name, frame, target) {
    await page.evaluate(({ frame, target }) => {
      window.__ESCAPE_PRESENT_FRAME__(frame);
      if (target) window.__ESCAPE_INSPECT_OBJECT__(target);
      else window.__ESCAPE_ROOM_VIEW__();
    }, { frame, target });
    await settle();
    await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
    return page.evaluate(() => { const { fps, ...diagnostics } = window.__ESCAPE_RENDER_DIAGNOSTICS__; return diagnostics; });
  }
  const room = await capture('room', opening);
  await page.evaluate(() => { const room = window.__GAUNTLET_CAPTURE_ROOM__; room.targetCamera.set(3.3,2.65,4.5); room.targetLook.set(-.3,1.05,.15); });
  await settle();
  await page.screenshot({ path: path.join(out, 'furniture.png'), fullPage: true });
  if (await page.evaluate(() => typeof window.__ESCAPE_CHARACTER_VIEW__ === 'function')) {
    await page.evaluate(() => window.__ESCAPE_CHARACTER_VIEW__());
    await settle();
    await page.screenshot({ path: path.join(out, 'character.png'), fullPage: true });
  }
  const detail = await capture('mechanism', mechanismFrame, mechanism?.id);
  const result = await capture('result', ending);
  await page.setViewportSize({ width: 390, height: 844 });
  await capture('mobile', opening);
  const mobile = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, canvas: document.querySelector('canvas').getBoundingClientRect().toJSON() }));
  const report = { label, date: new Date().toISOString(), captureMode: 'Real production snapshots; reduced-motion poses; real frame method with RAF paused for still capture; low quality tier; Chromium SwiftShader WebGL; FPS deliberately not measured', engineResult: runtime.state.result, ending: { tick: ending.tick, scene: ending.scene, progress: ending.progress }, room, detail, result, mobile, errors };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(out, 'opening-frame.json'), JSON.stringify(opening));
  const after = sourceHashes();
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Runtime source changed during capture; discard this label and capture a frozen version.');
  fs.writeFileSync(path.join(out,'source-manifest.json'),JSON.stringify({date:new Date().toISOString(),sourceUnchangedDuringCapture:true,files:before},null,2));
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (errors.length) process.exitCode = 1;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
