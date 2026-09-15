'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const runtimePath = path.resolve(__dirname, '../../../../dist/games/marble-survival-tournament/src/index.js');
const {
  MarbleRuntime,
  NamedRng,
  parseMarbleConfig,
  generateMarbleArena,
  validateMarbleArena,
  marbleStateChecksum,
  createMarblePresentationSnapshot,
  chooseMarbleCameraDirective,
} = require(runtimePath);

const publicRoot = path.resolve(__dirname, '../../public/complete-runtime');

function runTicks(seed, ticks) {
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, seed);
  for (let index = 0; index < ticks; index += 1) runtime.step();
  return runtime;
}

test('authority: identical seeds remain deterministic across a long fixed-step window', () => {
  const first = runTicks('marble-rebuild-determinism', 900);
  const second = runTicks('marble-rebuild-determinism', 900);
  assert.equal(marbleStateChecksum(first.state), marbleStateChecksum(second.state));
  assert.equal(first.state.tick, second.state.tick);
  assert.deepEqual(first.state.activeIds, second.state.activeIds);
});

test('authority: all five generated arena archetypes pass safety validation', () => {
  const config = parseMarbleConfig();
  const rng = NamedRng.fromSeed('marble-arena-validation');
  const expected = ['seeding-sprint', 'gate-gauntlet', 'hazard-circuit', 'final-four', 'championship'];
  for (let roundIndex = 0; roundIndex < expected.length; roundIndex += 1) {
    const arena = generateMarbleArena(config, roundIndex, rng);
    const report = validateMarbleArena(arena, config);
    assert.equal(arena.archetype, expected[roundIndex]);
    assert.equal(report.valid, true, JSON.stringify(report.issues));
    assert.equal(arena.spawnPoints.length, config.rosterSize);
  }
});

test('authority: presentation snapshot is immutable, sanitized, and bounded', () => {
  const runtime = runTicks('marble-public-snapshot', 180);
  const snapshot = createMarblePresentationSnapshot(runtime.state, runtime.drainEvents());
  const serialized = JSON.stringify(snapshot);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.marbles), true);
  assert.ok(snapshot.leaderboard.length <= 8);
  assert.equal(serialized.includes(runtime.rootSeed), false);
  assert.equal(serialized.includes('rng'), false);
  assert.equal(serialized.includes('operator'), false);
});

test('camera: director output is bounded presentation state and never mutates authority', () => {
  const runtime = runTicks('marble-camera', 160);
  const checksumBefore = marbleStateChecksum(runtime.state);
  const base = createMarblePresentationSnapshot(runtime.state, runtime.drainEvents());
  const directive = chooseMarbleCameraDirective({
    tick: base.tick,
    lifecycle: base.lifecycle,
    round: {
      qualified: base.round.qualified,
      quota: base.round.quota,
      remaining: base.round.remaining,
    },
    leaderId: base.camera.leaderId,
    dangerIds: [...base.camera.dangerIds],
    contestedQualificationIds: [...base.camera.contestedQualificationIds],
    championId: base.camera.championId,
    events: base.events.map((event) => ({ ...event, data: { ...event.data } })),
  }, null);
  assert.ok(['overview', 'cut-line', 'danger', 'finish', 'victory'].includes(directive.mode));
  assert.ok(directive.zoomPermille >= 1000 && directive.zoomPermille <= 1800);
  assert.equal(marbleStateChecksum(runtime.state), checksumBefore);
});

test('presentation: Three.js is primary with an authoritative 2D safety fallback', () => {
  const html = fs.readFileSync(path.join(publicRoot, 'index.html'), 'utf8');
  const three = fs.readFileSync(path.join(publicRoot, 'arena3d.js'), 'utf8');
  const css = fs.readFileSync(path.join(publicRoot, 'arena3d.css'), 'utf8');
  assert.match(html, /id="arena-webgl"/);
  assert.match(html, /id="arena-canvas"/);
  assert.match(html, /type="module" src="\/arena3d\.js"/);
  assert.match(three, /from '\/vendor\/three\.module\.min\.js'/);
  assert.match(three, /new THREE\.WebGLRenderer/);
  assert.match(three, /MeshPhysicalMaterial/);
  assert.match(three, /shadowMap/);
  assert.match(three, /prefers-reduced-motion/);
  assert.match(css, /\.three-ready #arena-webgl/);
  assert.match(css, /data-clean='true'/);
});

test('presentation: marble rolling orientation is derived from spatial displacement', () => {
  const three = fs.readFileSync(path.join(publicRoot, 'arena3d.js'), 'utf8');
  assert.match(three, /setFromAxisAngle\(tempAxis, distance \/ MARBLE_RADIUS\)/);
  assert.match(three, /rolling\.quaternion\.premultiply/);
});

test('presentation: event VFX consumes sanitized semantic physics events only', () => {
  const three = fs.readFileSync(path.join(publicRoot, 'arena3d.js'), 'utf8');
  for (const eventName of ['physics-contact', 'marble-eliminated', 'marble-qualified', 'shield-recovery', 'tournament-champion']) {
    assert.ok(three.includes(`event.type === '${eventName}'`));
  }
  assert.doesNotMatch(three, /rootSeed|tournamentSeed|operatorToken/);
});
