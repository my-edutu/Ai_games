'use strict';
// A review recording of consecutive, unmodified production public frames.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const { scenarios, config } = require('./capture-maze-3d.cjs');
const output = path.resolve(__dirname, '../evidence/maze-3d/captures');
const base = process.argv.find(arg => arg.startsWith('--base='))?.slice(7) || 'http://127.0.0.1:4185';

(async () => {
  const samples = scenarios(), seed = samples.danger?.seed || samples.exploration.seed;
  const sequence = samples.sequences.find(items => items[0]?.seed === seed);
  const dangerIndex = sequence.findIndex(item => item.frame.snapshot.threats.length);
  const startIndex = Math.max(0, dangerIndex - 5), startTick = sequence[startIndex].frame.snapshot.tick;
  const browser = await chromium.launch({args: ['--no-sandbox', '--enable-unsafe-swiftshader', ...(process.env.MAZE_SOFTWARE_COMPOSITOR === '1' ? ['--enable-gpu', '--use-angle=swiftshader'] : [])]});
  fs.mkdirSync(output, {recursive: true});
  const reports = [], errors = [];
  try {
    const context = await browser.newContext({viewport: {width: 960, height: 720}, recordVideo: {dir: '/tmp/maze-motion-video', size: {width: 960, height: 720}}});
    const page = await context.newPage();
    let started = 0;
    await page.route('**/maze/state*', route => {
      const elapsed = started ? Date.now() - started : 0;
      const index = Math.min(sequence.length - 1, startIndex + Math.floor(elapsed / 360));
      return route.fulfill({json: sequence[index].frame});
    });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/maze?camera=detail`);
    await page.waitForFunction(() => window.__MAZE_3D__?.frames > 3, null, {timeout: 45000});
    started = Date.now();
    for (const [name, after] of [['walk', 600], ['turn', 1200], ['encounter', 2000], ['journey', 3500], ['outcome', 8500]]) {
      const wait = started + after - Date.now();
      if (wait > 0) await page.waitForTimeout(wait);
      await page.screenshot({path: path.join(output, `motion-${name}.png`)});
      reports.push({name, capturedAt: new Date().toISOString(), ...await page.evaluate(() => ({tick: window.__MAZE_PUBLIC_STATE__.tick, runToken: window.__MAZE_PUBLIC_STATE__.runToken, result: window.__MAZE_PUBLIC_STATE__.result, render: window.__MAZE_3D__}))});
    }
    const video = page.video();
    await context.close();
    await video.saveAs(path.join(output, 'maze-motion.webm'));
    fs.writeFileSync(path.join(output, 'motion-manifest.json'), JSON.stringify({source: 'Consecutive production public frames at the production 360 ms tick interval; actual browser renderer recorded', seed, startTick, config, errors, reports}, null, 2));
    console.log(JSON.stringify({seed, errors, reports: reports.map(r => ({name:r.name,tick:r.tick,result:r.result,frames:r.render.frames,quality:r.render.quality}))}));
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode = 1;});
