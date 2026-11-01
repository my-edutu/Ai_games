'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-guardian-staging-'));
after(() => fs.rmSync(scratch, { recursive: true, force: true }));
const loaded = (async () => {
  const threeUrl = pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href;
  const coordinatesUrl = pathToFileURL(path.join(root, 'public/infinite-tower-climb/visuals/coordinates.mjs')).href;
  const THREE = await import(threeUrl);
  const coordinates = await import(coordinatesUrl);
  const source = fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/characters.mjs'), 'utf8')
    .replace("'/tower/vendor/three.module.js'", JSON.stringify(threeUrl));
  const castFile = path.join(scratch, 'characters.mjs');
  fs.writeFileSync(castFile, source);
  const { createEnemy } = await import(pathToFileURL(castFile).href);
  const context = { THREE, ...coordinates };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'public/infinite-tower-climb/visuals/scene.mjs'), 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export function createTowerScene', 'function createTowerScene'), context);
  return { THREE, createEnemy, ...coordinates, context };
})();

function encounter(telegraph = true) {
  // Floor-eight actual guardian geometry/hitbox dimensions, with only the
  // countdown intentionally varied to test presentation. No authority steps
  // or fabricated results enter the comparison.
  const player = { x: 170000, y: 330000, halfWidth: 9000, halfHeight: 14000,
    health: 3, state: 'standing', vx: 0, vy: 0 };
  const guardian = { id: 'f8:guardian', kind: 'guardian', x: 147000, y: 325000,
    halfWidth: 16000, halfHeight: 18000, health: 8, maxHealth: 8,
    active: true, telegraph, telegraphTicksRemaining: 8, facing: 1, attackCooldown: 0 };
  return { runToken: 'visual-windup-research', tick: 250, lifecycle: 'running', floor: 8,
    chunkBaseY: 2880000, chunkHeight: 360000, worldWidth: 480000,
    player: { ...player, y: player.y + 2880000 },
    enemies: [{ ...guardian, y: guardian.y + 2880000 }],
    platforms: [{ id: 'next', kind: 'oneway', x: 265000,
      y: 3230000, width: 125000, height: 10000 }],
    intent: { mode: 'aligning', targetPlatformId: 'next' },
    hazards: [], projectiles: [] };
}

test('observed guardian charge is a visibly graded, physically planted original 3D skinned rig', async () => {
  const { createEnemy } = await loaded;
  const guardian = createEnemy('guardian');
  const rig = guardian.group.getObjectByName('articulated-enemy');
  const leftKnee = guardian.group.getObjectByName('-1-knee');
  const rightKnee = guardian.group.getObjectByName('1-knee');
  const maulArm = guardian.group.getObjectByName('1-shoulder');
  assert.ok(rig && leftKnee && rightKnee && maulArm,
    'judge the actual original guardian bones, never a mockup');
  const pose = (telegraph, remaining, reducedMotion = true, time = 0) => {
    guardian.animate({ telegraph, telegraphTicksRemaining: remaining,
      health: 8, maxHealth: 8, active: true, vx: 0, vy: 0, facing: 1 }, .1, time,
    { reducedMotion });
    return { rootY: guardian.group.position.y, weightY: rig.position.y,
      kneeLeft: leftKnee.rotation.x, kneeRight: rightKnee.rotation.x,
      maulShoulder: maulArm.rotation.x };
  };
  try {
    const early = pose(true, 8, true, 0);
    const near = pose(true, 1, true, 1);
    assert.equal(early.rootY, near.rootY, 'animation never changes the authoritative host actor location');
    assert.ok(near.weightY < early.weightY - .045,
      'late windup must lower the guardian onto its planted boots');
    assert.ok(near.kneeLeft > early.kneeLeft + .2
      && near.kneeRight > early.kneeRight + .2,
    'both knees absorb the rising source-authentic attack commitment');
    assert.ok(near.maulShoulder < early.maulShoulder - .15,
      'the actual skinned striking shoulder must build a readable maul windup');
    const reducedStill = pose(true, 1, true, 20);
    assert.ok(Math.abs(reducedStill.weightY - near.weightY) < 1e-8,
      'reduced motion must preserve a stable braced silhouette without constant bobbing');
    const gone = pose(false, 1, true, 21);
    assert.equal(gone.weightY, 0, 'retired authority telegraph has no continuing false threat');
  } finally {
    guardian.dispose();
  }
});

test('a real immediate windup, not a stale route or random glint, stages the nearby guardian before the AI catches up', async () => {
  const { context, pointFor } = await loaded;
  const charged = encounter(true);
  const unchanged = JSON.stringify(charged);
  const hero = pointFor(charged.player.x, charged.player.y - charged.player.halfHeight,
    charged.chunkBaseY, charged.worldWidth);
  for (const aspect of [960/600, 390/844]) {
    const chargeView = context.composeFollowView(charged, hero, aspect);
    const relaxedView = context.composeFollowView(encounter(false), hero, aspect);
    assert.ok(chargeView.heroFraction >= .15 && chargeView.clear,
      'real imminent guardian must remain comprehensible on phone and desktop');
    assert.ok(chargeView.heroFraction > relaxedView.heroFraction,
      'combat contact must outrank a distant jump before delayed AI intent arrives');
  }
  assert.equal(JSON.stringify(charged), unchanged, 'camera selection never modifies the immutable game state');
});

test('real remaining windup ticks progressively thicken a bounded original threat strip without changing authority', async () => {
  const { context, THREE } = await loaded;
  const geometry = context.createThreatLaneGeometry();
  const lane = { geometry }, charged = encounter(true);
  const source = charged.enemies[0], original = JSON.stringify(charged);
  const gap = (remaining) => {
    context.poseThreatLane(lane, { ...source, telegraphTicksRemaining: remaining }, charged);
    const a = geometry.getAttribute('position');
    return a.getY(1) - a.getY(0);
  };
  try {
    assert.equal(geometry.index.count, 14 * 6);
    assert.ok(gap(1) > gap(8) + .1, 'danger stripe gains visible physical thickness as genuine contact approaches');
    assert.ok(geometry.attributes.position.count <= 30, 'bounded resident geometry, no unbounded warning spam');
    assert.equal(JSON.stringify(charged), original);
  } finally { geometry.dispose(); }
});
