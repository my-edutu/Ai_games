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
  chooseMarbleAction,
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

test('agent: upcoming sweeper causes a deterministic move toward the clear lane', () => {
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, 'marble-agent-sweeper');
  const state = runtime.state;
  const marble = state.marbles[0];
  const [leftLane, rightLane] = state.arena.safeLanes;
  marble.position = { x: leftLane, y: 9_200 };
  marble.progressPermille = 420;
  marble.lastProgressTick = state.tick;
  state.arena = {
    ...state.arena,
    obstacles: [],
    hazards: [],
    windZones: [],
    safeLanes: [leftLane, rightLane],
    sweepers: [{
      id: 'test-sweeper',
      kind: 'sweeper',
      baseX: leftLane - 700,
      baseY: 8_000,
      width: 1_400,
      height: 220,
      axis: 'x',
      amplitude: 0,
      periodTicks: 240,
      phaseTicks: 0,
      restitutionPermille: 900,
    }],
  };

  const first = chooseMarbleAction(state, marble.id);
  const second = chooseMarbleAction(state, marble.id);
  assert.deepEqual(first, second);
  assert.equal(first.intent, 'avoiding-sweeper');
  assert.ok(first.steerX > 0, `expected rightward avoidance, got ${first.steerX}`);
  assert.ok(first.boostPermille <= 1_000);
});

test('agent: sprinter takes a bounded risk route when no immediate geometry threatens it', () => {
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, 'marble-agent-sprinter');
  const state = runtime.state;
  const sprinter = state.marbles.find((marble) => marble.archetype === 'sprinter');
  assert.ok(sprinter);
  const [leftLane] = state.arena.safeLanes;
  sprinter.position = { x: leftLane, y: 10_000 };
  sprinter.progressPermille = 500;
  sprinter.lastProgressTick = state.tick;
  state.arena = { ...state.arena, obstacles: [], hazards: [], windZones: [], sweepers: [] };

  const action = chooseMarbleAction(state, sprinter.id);
  assert.equal(action.intent, 'taking-risk-route');
  assert.ok(action.boostPermille > 1_000 && action.boostPermille <= 1_200);
  assert.ok(Math.abs(action.steerX) <= 1_000);
});

test('agent: unavoidable crosswind produces deterministic counter-steer instead of passive drift', () => {
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, 'marble-agent-crosswind');
  const state = runtime.state;
  const navigator = state.marbles.find((marble) => marble.archetype === 'navigator');
  assert.ok(navigator);
  const [leftLane, rightLane] = state.arena.safeLanes;
  navigator.position = { x: leftLane, y: 9_000 };
  navigator.progressPermille = 500;
  navigator.lastProgressTick = state.tick;
  state.arena = {
    ...state.arena,
    obstacles: [],
    hazards: [],
    sweepers: [],
    safeLanes: [leftLane, rightLane],
    windZones: [{
      id: 'test-crosswind',
      kind: 'wind',
      x: 0,
      y: 8_000,
      width: state.arena.width,
      height: 2_000,
      forceX: 12,
      forceY: -2,
    }],
  };

  const first = chooseMarbleAction(state, navigator.id);
  const second = chooseMarbleAction(state, navigator.id);
  assert.deepEqual(first, second);
  assert.equal(first.intent, 'countering-wind');
  assert.ok(first.steerX < 0, `expected left counter-steer against positive wind, got ${first.steerX}`);
  assert.ok(Math.abs(first.steerX) <= 1_000);
  assert.ok(first.boostPermille <= 1_000);
});

test('agent: navigator counters unavoidable crosswind more strongly than a sprinter', () => {
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, 'marble-agent-crosswind-archetypes');
  const state = runtime.state;
  const navigator = state.marbles.find((marble) => marble.archetype === 'navigator');
  const sprinter = state.marbles.find((marble) => marble.archetype === 'sprinter');
  assert.ok(navigator);
  assert.ok(sprinter);
  const lane = state.arena.safeLanes[0];
  for (const marble of [navigator, sprinter]) {
    marble.position = { x: lane, y: 9_000 };
    marble.progressPermille = 500;
    marble.lastProgressTick = state.tick;
  }
  state.arena = {
    ...state.arena,
    obstacles: [],
    hazards: [],
    sweepers: [],
    safeLanes: [lane],
    windZones: [{
      id: 'test-crosswind-archetypes',
      kind: 'wind',
      x: 0,
      y: 8_000,
      width: state.arena.width,
      height: 2_000,
      forceX: -12,
      forceY: -2,
    }],
  };

  const navigatorAction = chooseMarbleAction(state, navigator.id);
  const sprinterAction = chooseMarbleAction(state, sprinter.id);
  assert.equal(navigatorAction.intent, 'countering-wind');
  assert.equal(sprinterAction.intent, 'countering-wind');
  assert.ok(navigatorAction.steerX > 0);
  assert.ok(sprinterAction.steerX > 0);
  assert.ok(Math.abs(navigatorAction.steerX) > Math.abs(sprinterAction.steerX), `${navigatorAction.steerX} should exceed ${sprinterAction.steerX}`);
});

test('presentation: authoritative wind zones are sanitized into the public arena snapshot', () => {
  const runtime = MarbleRuntime.create({ roundIntroTicks: 0 }, 'marble-wind-presentation');
  const rng = NamedRng.fromSeed('marble-wind-arena');
  runtime.state.arena = generateMarbleArena(runtime.config, 2, rng);
  assert.ok(runtime.state.arena.windZones.length > 0);
  const snapshot = createMarblePresentationSnapshot(runtime.state, []);
  assert.equal(snapshot.arena.windZones.length, runtime.state.arena.windZones.length);
  assert.deepEqual(snapshot.arena.windZones[0], {
    id: runtime.state.arena.windZones[0].id,
    x: runtime.state.arena.windZones[0].x,
    y: runtime.state.arena.windZones[0].y,
    width: runtime.state.arena.windZones[0].width,
    height: runtime.state.arena.windZones[0].height,
    forceX: runtime.state.arena.windZones[0].forceX,
    forceY: runtime.state.arena.windZones[0].forceY,
  });
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
  const wind = fs.readFileSync(path.join(publicRoot, 'wind3d.js'), 'utf8');
  const css = fs.readFileSync(path.join(publicRoot, 'arena3d.css'), 'utf8');
  assert.match(html, /id="arena-webgl"/);
  assert.match(html, /id="arena-canvas"/);
  assert.match(html, /type="module" src="\/wind3d\.js"/);
  assert.match(html, /type="module" src="\/arena3d\.js"/);
  assert.match(three, /from '\/vendor\/three\.module\.min\.js'/);
  assert.match(three, /new THREE\.WebGLRenderer/);
  assert.match(three, /MeshPhysicalMaterial/);
  assert.match(three, /shadowMap/);
  assert.match(three, /prefers-reduced-motion/);
  assert.match(wind, /arena\.windZones/);
  assert.match(wind, /ArrowHelper/);
  assert.match(wind, /authoritative-wind-telegraphs/);
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