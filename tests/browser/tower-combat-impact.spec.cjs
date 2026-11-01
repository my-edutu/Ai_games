'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');
const { createSession, advance } = require('../../scripts/serve-tower-stream.cjs');

// These are real successive snapshots from one seeded authoritative run.
// Holding them is permitted for appearance inspection only: not a motion/FPS claim.
function seededGuardianHit(width, height) {
  const session = createSession('tower-stream-reference', {
    launchFloor: 8, guardianInterval: 8, upgradeInterval: 4,
    maxTicks: 20000, noProgressTicks: 3000, intermissionTicks: 36,
  });
  for (let i = 0; i < 1000; i++) {
    const before = session.controller.frame(width, height, { reducedMotion: true, muted: true });
    advance(session);
    const after = session.controller.frame(width, height, { reducedMotion: true, muted: true });
    const b = before.snapshot, a = after.snapshot;
    if (b.runToken !== a.runToken || b.floor !== a.floor || a.tick <= b.tick) continue;
    const guardian = b.enemies.find(e => e.kind === 'guardian' && e.active);
    const next = a.enemies.find(e => e.id === guardian?.id);
    if (guardian && next && next.active && next.health < guardian.health)
      return { before, after, guardianId: guardian.id, healthBefore: guardian.health, healthAfter: next.health };
  }
  throw new Error('Seeded real guardian hit was not observed within 1000 normal combat steps');
}

for (const view of [ { name: 'desktop', w: 960, h: 600 }, { name: 'portrait', w: 390, h: 844 } ]) {
  test('real guardian hit contact in low-quality reduced-motion ' + view.name, async ({ page }) => {
    test.setTimeout(150000);
    const pair = seededGuardianHit(view.w, view.h);
    expect(pair.healthAfter).toBeLessThan(pair.healthBefore);
    expect(pair.before.snapshot.runToken).toBe(pair.after.snapshot.runToken);
    let current = pair.before;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.route('**/tower/state**', route => route.fulfill({ json: current }));
    await page.setViewportSize({ width: view.w, height: view.h });
    await page.goto('/tower?quality=low&reducedMotion=1&muted=1', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(checksum => {
      const d = window.__TOWER_RENDER_DIAGNOSTICS__?.();
      return d?.frames >= 5 && d.renderProgress?.state === 'current'
        && d.lighting?.environmentState !== 'pending'
        && window.__TOWER_PUBLIC_STATE__?.publicChecksum === checksum;
    }, pair.before.snapshot.publicChecksum, { timeout: 90000 });
    const beforeDiagnostics = await page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__());
    expect(beforeDiagnostics.observedEnemyImpacts, 'no impact on the initial seeded frame').toBe(0);
    const dir = path.resolve('artifacts', 'tower-combat-impact');
    fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, 'before-' + view.name + '.png'), timeout: 90000 });

    current = pair.after;
    await page.waitForFunction(checksum => window.__TOWER_PUBLIC_STATE__?.publicChecksum === checksum,
      pair.after.snapshot.publicChecksum, { timeout: 60000 });
    await page.waitForFunction(() => window.__TOWER_RENDER_DIAGNOSTICS__?.().observedEnemyImpacts > 0,
      null, { timeout: 60000 });
    const afterDiagnostics = await page.evaluate(() => window.__TOWER_RENDER_DIAGNOSTICS__());
    expect(afterDiagnostics.renderErrors).toBe(0);
    expect(afterDiagnostics.contextLost).toBe(false);
    expect(afterDiagnostics.observedEnemyImpacts).toBeGreaterThan(0);
    await page.screenshot({ path: path.join(dir, 'after-' + view.name + '.png'), timeout: 90000 });
    fs.writeFileSync(path.join(dir, view.name + '.json'), JSON.stringify({
      method: 'Two authentic consecutive authoritative snapshots held at nominal damage edge for real WebGL appearance only',
      sourceSha: process.env.GITHUB_SHA || null, viewport: view,
      before: { tick: pair.before.snapshot.tick, checksum: pair.before.snapshot.publicChecksum, diagnostics: beforeDiagnostics },
      after: { tick: pair.after.snapshot.tick, checksum: pair.after.snapshot.publicChecksum, diagnostics: afterDiagnostics },
      guardianId: pair.guardianId, healthBefore: pair.healthBefore, healthAfter: pair.healthAfter, errors,
      independentReview: false,
      gates: { visibleContactCapture: 'PENDING actual PNG review', completeCombatMotion: 'OPEN', sustainedDeviceFps: 'OPEN', comparativeQuality: 'OPEN' },
    }, null, 2));
    expect(errors).toEqual([]);
  });
}
