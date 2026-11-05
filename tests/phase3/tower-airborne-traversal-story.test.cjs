'use strict';
// Safety contracts for a whole-climb movement presentation. Technical green
// cannot certify a LOOKS/FEELS/PLAYS transformation; only real full-motion
// matched footage and independent review can do that.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const url = file => pathToFileURL(path.join(ROOT, file)).href;
const kinetic = import(url('public/infinite-tower-climb/visuals/traversal-kinetics.mjs'));
const landing = import(url('public/infinite-tower-climb/visuals/landing-approach.mjs'));
const three = import(url('node_modules/three/build/three.module.js'));
function source(player = {}, change = {}) {
  const deck = { id: 'f4:mid', kind: 'moving', x: 225000,
    y: 1205000, width: 80000, height: 16000 };
  return {
    lifecycle: 'running', runToken: 'actual-traverse', floor: 4, tick: 300,
    worldWidth: 480000, chunkBaseY: 1000000, theme: 'storm',
    intent: { mode: 'air-control', targetPlatformId: deck.id },
    player: { x: 250000, y: 1250000, halfWidth: 9000, halfHeight: 14000,
      state: 'airborne', health: 5, vx: 2200, vy: -14000, attacking: false, ...player },
    platforms: [deck], enemies: [], hazards: [], ...change
  };
}
test('only real airborne velocity produces a full arc with a calm physical apex', async () => {
  const { observedTraversalKinetics: observe } = await kinetic;
  const ascent = observe(source({ vy: 22000 }));
  const apex = observe(source({ vy: 0 }));
  const descent = observe(source({ vy: -22000 }));
  assert.equal(ascent.launch, 1);
  assert.equal(ascent.apex, 0);
  assert.equal(apex.apex, 1);
  assert.equal(apex.landingReadiness, 0, 'no zero-speed impact invented');
  assert.equal(descent.apex, 0);
  assert.equal(descent.descent, 1);
  assert.equal(observe(source({ state: 'standing', vy: 0 })).apex, 0);
});
test('near-deck landing brace uses current source deck and never predicts contact', async () => {
  const { observedTraversalKinetics: observe } = await kinetic;
  const live = source();
  const unmodified = JSON.stringify(live);
  const falling = observe(live);
  assert.ok(falling.landingReadiness > .70 && falling.landingReadiness < 1);
  assert.equal(JSON.stringify(live), unmodified, 'presentation cannot modify authority');
  for (const invalid of [
    source({}, { platforms: [] }),
    source({}, { intent: { mode: 'air-control', targetPlatformId: 'wrong' } }),
    source({ x: 90000 }),
    source({ y: 1480000 }),
    source({ vy: 14000 }),
    source({}, { stale: true }),
    source({}, { lifecycle: 'result' }),
    source({ health: 0 }),
  ]) assert.equal(observe(invalid).landingReadiness, 0);
});
test('the 12-piece source landing gate physically anticipates arrival and yields to real danger', async () => {
  const [THREE, { createTowerLandingApproach }] = await Promise.all([three, landing]);
  const stage = createTowerLandingApproach(THREE);
  try {
    const live = source();
    const before = JSON.stringify(live);
    stage.update(live, live.platforms[0], live.player.x);
    const early = stage.diagnostics();
    assert.equal(early.visible, true);
    assert.equal(early.pieces, 12);
    assert.equal(early.drawCalls, 1);
    assert.ok(early.landingReadiness > .70);
    assert.equal(JSON.stringify(live), before);
    const warning = source({}, { hazards: [{
      id: 'real-shutter', x: 242000, y: 1219000, width: 16000, height: 24000,
      active: true, chargeTicksRemaining: 1,
    }] });
    stage.update(warning, warning.platforms[0], warning.player.x);
    assert.equal(stage.diagnostics().landingReadiness, 0,
      'a physical hazard outranks an inviting landing arch');
    stage.update(source(), source().platforms[0], 250000, { stale: true });
    assert.equal(stage.diagnostics().visible, false);
  } finally { stage.dispose(); }
});
test('hero, camera and sound consume the same source-velocity story', () => {
  const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
  assert.match(read('public/infinite-tower-climb/visuals/characters.mjs'),
    /state\.traversalBeat/);
  assert.match(read('public/infinite-tower-climb/visuals/scene.mjs'),
    /traversalBeat,/);
  assert.match(read('public/infinite-tower-climb/visuals/audio.mjs'),
    /last\.vy > 1100 && actor\.vy <= 1100/);
});
