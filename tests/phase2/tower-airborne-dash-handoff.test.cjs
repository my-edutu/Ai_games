'use strict';
// The live guardian/traversal game cannot remain cosmetically "dashing"
// throughout an entire physical jump after a single three-tick impulse.
// These original-runtime fixtures exercise actual 20 Hz physics, not a
// presentation mock, a second clock, or a synthetic camera success claim.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TowerRuntime } = require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const { stepTowerPhysics } = require('../../dist/games/infinite-tower-climb/src/physics/step.js');
const { createTowerRenderSnapshot } = require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const { STREAM_CONFIG } = require('../../scripts/serve-tower-stream.cjs');

function pairedAirborneSource() {
  const runtime = TowerRuntime.create({ ...STREAM_CONFIG, launchFloor: 8 },
    'tower-real-dash-flight-handoff-v1', { policy: 'autonomous' });
  const source = structuredClone(runtime.state);
  const highestTop = Math.max(...source.chunks.flatMap(chunk =>
    chunk.platforms.map(platform => platform.y + platform.height)));
  const p = source.player;
  // A genuine airborne 20Hz physics interval, clear of deck heads and the
  // guardian's actual cap. No source state or physics step is mocked.
  p.position = { x: Math.floor(source.config.worldWidth * .4),
    y: highestTop + 180000 };
  p.velocity = { x: 0, y: 10000 };
  p.facing = 1;
  p.grounded = false;
  p.groundedPlatformId = undefined;
  p.state = 'airborne';
  p.dashCooldown = 0;
  p.stamina = p.maxStamina;
  source.enemies = [];
  source.projectiles = [];
  const live = structuredClone(source);
  live.config.guardianArenaHazards = true;
  live.config.guardianSecondWind = true;
  const frozen = structuredClone(source);
  frozen.config.guardianArenaHazards = false;
  frozen.config.guardianSecondWind = false;
  return { live, frozen };
}
const input = dash => ({ move: 0, jump: false, dash,
  attack: false, ability: false });
const physical = state => {
  const p = state.player;
  return {
    position: p.position, velocity: p.velocity, grounded: p.grounded,
    groundedPlatformId: p.groundedPlatformId, stamina: p.stamina,
    dashCooldown: p.dashCooldown, jumpCharges: p.jumpCharges,
    health: p.health, facing: p.facing,
  };
};

test('one real dash impulse becomes airborne after three 20Hz steps, not at next landing', () => {
  let { live, frozen } = pairedAirborneSource();
  const duration = Math.max(6, 20 - live.build.dashCooldownReduction);
  const sourceStart = live.player.position.y;
  for (let tick = 0; tick < 7; tick++) {
    const dash = tick === 0;
    const current = stepTowerPhysics(live, input(dash));
    const historical = stepTowerPhysics(frozen, input(dash));
    assert.equal(current.integrityFailure, undefined);
    assert.equal(historical.integrityFailure, undefined);
    live = current.state;
    frozen = historical.state;
    assert.deepEqual(physical(live), physical(frozen),
      'the opt-in handoff may change ONLY the authoritative motion label');
    assert.equal(live.player.dashCooldown, duration - tick,
      'the live handoff follows the actual cooldown, not animation time');
    assert.equal(live.player.grounded, false);
    assert.equal(live.player.state, tick < 3 ? 'dashing' : 'airborne',
      'dash needs a short readable burst followed by actual airborne traversal');
    assert.equal(frozen.player.state, 'dashing',
      'unflagged historical replay must keep its original uninterrupted dash label');
  }
  assert.ok(live.player.position.y > sourceStart,
    'the real climber is still in flight when dash pose releases');
});

test('real public snapshots resume climbing apex, airflow and landing framing after the dash burst', async () => {
  let { live, frozen } = pairedAirborneSource();
  for (let tick = 0; tick < 4; tick++) {
    live = stepTowerPhysics(live, input(tick === 0)).state;
    frozen = stepTowerPhysics(frozen, input(tick === 0)).state;
  }
  const visible = createTowerRenderSnapshot(live, { includeWindupTicks: true });
  const original = createTowerRenderSnapshot(frozen, { includeWindupTicks: true });
  assert.equal(visible.player.state, 'airborne');
  assert.equal(original.player.state, 'dashing');
  const { observedTraversalKinetics } = await import(
    '../../public/infinite-tower-climb/visuals/traversal-kinetics.mjs');
  assert.ok(observedTraversalKinetics(visible).ascent > 0,
    'actual airborne velocity must drive the existing climbing/landing rig');
  assert.equal(observedTraversalKinetics(original).ascent, 0,
    'historic dashing label still suppresses aerial presentation by design');
});

test('no non-earned dash transition occurs in a live flight without a dash impulse', () => {
  let { live } = pairedAirborneSource();
  for (let tick = 0; tick < 5; tick++) {
    live = stepTowerPhysics(live, input(false)).state;
    assert.equal(live.player.state, 'airborne');
    assert.equal(live.player.dashCooldown, 0);
  }
});


test('live player steering holds a genuinely three-tick dash burst before responsive airborne control', () => {
  let { live, frozen } = pairedAirborneSource();
  const duration = Math.max(6, 20 - live.build.dashCooldownReduction);
  const dashSpeed = live.config.dashSpeed;
  const cruiseSpeed = live.config.maxRunSpeed;
  assert.ok(dashSpeed > cruiseSpeed, 'fixture needs a materially faster burst');
  let accumulatedGain = 0;
  for (let tick = 0; tick < 6; tick++) {
    const move = { ...input(tick === 0), move: 1 };
    const liveStep = stepTowerPhysics(live, move);
    const frozenStep = stepTowerPhysics(frozen, move);
    assert.equal(liveStep.integrityFailure, undefined);
    assert.equal(frozenStep.integrityFailure, undefined);
    live = liveStep.state;
    frozen = frozenStep.state;
    const liveV = tick < 3 ? dashSpeed : cruiseSpeed;
    const historicV = tick === 0 ? dashSpeed : cruiseSpeed;
    assert.equal(live.player.velocity.x, liveV,
      'live burst must actually move as fast as its three-tick dash pose');
    assert.equal(frozen.player.velocity.x, historicV,
      'frozen/unflagged replay retains original one-tick dash physics');
    assert.equal(live.player.dashCooldown, duration - tick);
    assert.equal(live.player.state, tick < 3 ? 'dashing' : 'airborne');
    assert.equal(frozen.player.state, 'dashing');
    accumulatedGain += liveV - historicV;
    assert.equal(live.player.position.x - frozen.player.position.x, accumulatedGain);
    assert.equal(live.player.position.y, frozen.player.position.y);
    assert.equal(live.player.velocity.y, frozen.player.velocity.y);
    assert.equal(live.player.stamina, frozen.player.stamina);
    assert.equal(live.player.health, frozen.player.health);
    assert.equal(live.player.jumpCharges, frozen.player.jumpCharges);
  }
  assert.equal(accumulatedGain, 2 * (dashSpeed - cruiseSpeed));
});

test('real world wall cancels boosted velocity without a dash-phase penetration', () => {
  let { live } = pairedAirborneSource();
  const rightEdge = live.config.worldWidth - live.player.halfWidth;
  live.player.position.x = rightEdge - Math.floor(live.config.dashSpeed / 2);
  for (let tick = 0; tick < 4; tick++) {
    const result = stepTowerPhysics(live, { ...input(tick === 0), move: 1 });
    assert.equal(result.integrityFailure, undefined);
    live = result.state;
    assert.equal(live.player.position.x, rightEdge,
      'whole-body world clamp holds throughout the physical dash burst');
    assert.equal(live.player.velocity.x, 0,
      'solid boundary cancels the boosted motion rather than tunnelling');
  }
});
