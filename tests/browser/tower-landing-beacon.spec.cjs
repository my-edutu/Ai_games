'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { createSession, advance } = require('../../scripts/serve-tower-stream.cjs');

// Real production snapshots, not edited poses. Stills explicitly do not prove
// normal-speed motion or presented-frame performance.
const cases = [
  { name: 'left-portrait', tick: 379, width: 390, height: 844 },
  { name: 'right-portrait', tick: 234, width: 390, height: 844 },
  { name: 'left-desktop', tick: 379, width: 960, height: 600 },
];
for (const scenario of cases) test(`destination beacon ${scenario.name}`, async ({ page }, testInfo) => {
  test.setTimeout(120000);
  const session = createSession();
  for (let step = 0; step < scenario.tick; step++) advance(session);
  let frame = session.controller.frame(scenario.width, scenario.height, { reducedMotion: true, muted: true });
  const originalChecksum = frame.snapshot.publicChecksum;
  const target = frame.snapshot.platforms.find(p => p.id === frame.snapshot.intent.targetPlatformId);
  expect(target, 'the fixture must exercise real traversal').toBeTruthy();
  const baseline = process.env.TOWER_BEACON_BASELINE;
  if (baseline) await page.route('**/tower/visuals/scene.mjs', route => route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(baseline, 'utf8') }));
  await page.route('**/tower/state**', route => route.fulfill({ json: frame }));
  await page.setViewportSize({ width: scenario.width, height: scenario.height });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/tower?quality=low&reducedMotion=1&muted=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const d = window.__TOWER_RENDER_DIAGNOSTICS__?.();
    return d?.frames >= 4 && d.lighting?.environmentState !== 'pending';
  }, null, { timeout: 60000 });
  const diagnostics = await page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__());
  expect(diagnostics.renderErrors).toBe(0);
  expect(await page.evaluate(() => window.__TOWER_PUBLIC_STATE__.publicChecksum)).toBe(originalChecksum);
  if (!baseline) {
    expect(diagnostics.landingBeacon.visible).toBe(true);
    expect(diagnostics.landingBeacon.targetId).toBe(target.id);
    expect(diagnostics.landingBeacon.triangles).toBe(16);
    expect(diagnostics.landingBeacon.depthTest).toBe(true);
  }
  const output = path.resolve(process.env.TOWER_EVIDENCE_DIR || 'artifacts/tower-landing-beacon');
  fs.mkdirSync(output, { recursive: true });
  const label = `${baseline ? 'before' : 'after'}-${scenario.name}`;
  const capture = path.join(output, `${label}.png`);
  await page.screenshot({ path: capture, fullPage: true, timeout: 60000 });
  await testInfo.attach(label, { path: capture, contentType: 'image/png' });
  fs.writeFileSync(path.join(output, `${label}.json`), JSON.stringify({ scenario, method: 'Held, unmodified authoritative snapshot; no motion/FPS claim', checksum: originalChecksum, targetId: target.id, sourceSha: process.env.GITHUB_SHA || null, baseline: !!baseline, diagnostics, errors }, null, 2));
  if (!baseline) {
    // Advance authority to the real end of this traversal; no synthetic dead or
    // contact pose. The production selector must retire the glyph on its own.
    for (let step = 0; step < 120; step++) {
      advance(session);
      const next = session.controller.frame(scenario.width, scenario.height, { reducedMotion: true, muted: true });
      const p = next.snapshot.player, intent = next.snapshot.intent;
      const targetDeck = next.snapshot.platforms.find(deck => deck.id === intent?.targetPlatformId);
      const onTarget = targetDeck && p.state === 'standing' && Math.abs(p.y-p.halfHeight-targetDeck.y-targetDeck.height) < 2000
        && p.x+p.halfWidth >= targetDeck.x && p.x-p.halfWidth <= targetDeck.x+targetDeck.width;
      if (onTarget || !['aligning','jumping','air-control'].includes(intent?.mode?.replace(/^oracle-/,'')) || p.health <= 0) { frame = next; break; }
    }
    expect(frame.snapshot.tick).toBeGreaterThan(scenario.tick);
    await page.waitForFunction(tick => {
      const d = window.__TOWER_RENDER_DIAGNOSTICS__();
      return d.renderProgress.lastSubmitted?.tick === tick && !d.landingBeacon.visible;
    }, frame.snapshot.tick, { timeout: 60000 });
  }
  expect(errors).toEqual([]);
});
