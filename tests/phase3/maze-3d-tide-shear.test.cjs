'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

// Load the REAL production world and installed Three, not an imitation of a
// hinged mesh. This test explicitly keeps all public knowledge boundaries.
const source = fs.readFileSync(path.resolve(__dirname, '../../public/ai-maze-escape/world.js'), 'utf8');
const three = pathToFileURL(path.resolve(__dirname, '../../node_modules/three/build/three.module.js')).href;
const gateMoment = pathToFileURL(path.resolve(__dirname, '../../public/ai-maze-escape/gate-moment.mjs')).href;
const mapView = pathToFileURL(path.resolve(__dirname, '../../public/ai-maze-escape/map-view.mjs')).href;
const modulePromise = import(`data:text/javascript;base64,${Buffer.from(source
  .replace("'./vendor/three.module.js'", JSON.stringify(three))
  .replace("'./gate-moment.mjs'", JSON.stringify(gateMoment))
  .replace("'./map-view.mjs'", JSON.stringify(mapView))).toString('base64')}`);

const visible = {
  runToken: 'paired-public-trap', tick: 1, width: 7, height: 9,
  currentCell: 24, cells: [{cell:24,neighbors:[],trap:true}],
  visibleCells: [24], discoveredCells: [24],
  doors: [], keys: [], inventory: [], threats: [], exitCell: null
};

test('two real joined pressure blades close INWARD on published contact and release without revealing secrets', async () => {
  const {createMazeWorld} = await modulePromise;
  const {Vector3} = await import(three);
  const world = createMazeWorld({balanced:true});
  const original = JSON.stringify(visible);
  world.update(visible);
  const trap = world.group.getObjectByName('Disclosed tide-shear pressure hazard 24');
  assert.ok(trap?.isGroup, 'real public hazard gets authored physical stage');
  const left = trap.getObjectByName('Disclosed tide-shear hinged jaw 24 -1');
  const right = trap.getObjectByName('Disclosed tide-shear hinged jaw 24 1');
  assert.ok(left?.isGroup && right?.isGroup, 'two independent connected hinges');
  const frontLeft = left.getObjectByName('Published tide-shear front blade');
  const frontRight = right.getObjectByName('Published tide-shear front blade');
  assert.ok(frontLeft?.isMesh && frontRight?.isMesh,
    'both publicly disclosed hinges must carry a genuine camera-facing blade');
  assert.equal(frontLeft.parent, left);
  assert.equal(frontRight.parent, right);
  for (const jaw of [left,right])
    assert.ok(jaw.getObjectByName('Published tide-shear inward brace')?.isMesh,
      'each front blade must have an actual connected supporting arm');
  assert.equal(world.stats().responsiveTrapJaws,2);
  const budget = world.stats();
  const center = trap.getWorldPosition(new Vector3());
  const point = () => {
    world.group.updateMatrixWorld(true);
    // Signed X-order exposes actual convergence and crossing: absolute
    // separation would incorrectly accept the old outward-spreading stakes.
    return frontRight.getWorldPosition(new Vector3()).x
      - frontLeft.getWorldPosition(new Vector3()).x;
  };
  world.animate(1,{explorerPosition:new Vector3(center.x+50,0,center.z+50),reducedMotion:false});
  assert.ok(Math.abs(left.rotation.z+.06)<1e-9 && Math.abs(right.rotation.z-.06)<1e-9);
  const restingSpan = point();
  world.animate(2,{explorerPosition:new Vector3(center.x,0,center.z),reducedMotion:false});
  assert.ok(Math.abs(left.rotation.z+.20)<1e-9 && Math.abs(right.rotation.z-.20)<1e-9,
    'first true public contact warns through both joined hinges before the floor opens');
  world.animate(2.4,{explorerPosition:new Vector3(center.x,0,center.z),reducedMotion:false});
  assert.ok(Math.abs(left.rotation.z)>.35 && Math.abs(left.rotation.z)<.66,
    'the middle beat closes both physical jaws progressively, not instantaneously');
  world.animate(3.25,{explorerPosition:new Vector3(center.x,0,center.z),reducedMotion:false});
  assert.ok(Math.abs(left.rotation.z+.66)<1e-9 && Math.abs(right.rotation.z-.66)<1e-9,
    'sustained true public contact reaches the UNCHANGED full inward 0.66rad stroke');
  const closedSpan = point();
  assert.ok(closedSpan < restingSpan - .4,
    `connected left/right foreground blades must close and cross inward unmistakably (${restingSpan} -> ${closedSpan})`);
  assert.ok(world.stats().witnessedPressureMechanisms.some(mechanism =>
    mechanism.cell===24 && mechanism.inwardShearRadians>=.60),
    'real currently visible public trap must expose its actual inward physical hinge, not absolute motion');
  world.animate(4,{explorerPosition:new Vector3(center.x+50,0,center.z+50),reducedMotion:false});
  assert.ok(Math.abs(point()-restingSpan)<1e-8,
    'original reversible pressure geometry returns when Pip moves away');
  world.animate(4.1,{explorerPosition:new Vector3(center.x,0,center.z),reducedMotion:true});
  assert.ok(Math.abs(left.rotation.z+.24)<1e-9 && Math.abs(right.rotation.z-.24)<1e-9,
    'reduced motion uses a readable, settled symmetric pose');
  assert.equal(world.stats().geometryCount,budget.geometryCount);
  assert.equal(world.stats().materialCount,budget.materialCount);
  assert.equal(world.stats().textureCount,budget.textureCount);
  assert.equal(JSON.stringify(visible),original,'the scene never mutates the simulation or agent authority');

  // A remembered or unknown cell cannot animate a publicly absent trap.
  world.update({...visible,visibleCells:[]});
  world.animate(5,{explorerPosition:new Vector3(center.x,0,center.z),reducedMotion:false});
  const remembered = world.group.getObjectByName('Disclosed tide-shear hinged jaw 24 1');
  if (remembered) assert.ok(Math.abs(remembered.rotation.z-.06)<1e-9,
    'a hazard that is not currently visible cannot react to hidden proximity');
  world.update({...visible,runToken:'fresh-run',tick:0,cells:[],visibleCells:[],discoveredCells:[]});
  assert.equal(world.group.getObjectByName('Disclosed tide-shear pressure hazard 24'),undefined,
    'the next run must contain no prior-run trap geometry');
  world.dispose();
  assert.equal(world.stats().geometryCount,0);
  assert.equal(world.stats().materialCount,0);
  assert.equal(world.stats().textureCount,0);
});
