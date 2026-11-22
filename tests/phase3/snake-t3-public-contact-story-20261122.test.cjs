'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');

const freezeGame = (overrides = {}) => Object.freeze({
  lifecycle: 'running', movementStep: 68, width: 28, height: 16,
  length: 8, goal: 40, dangerLevel: 0,
  snake: Object.freeze([{cell: 8 + 7 * 28}, {cell: 8 + 8 * 28}].map(Object.freeze)),
  food: Object.freeze({cell: 8 + 5 * 28}),
  ...overrides,
});

test('real already-public close food contact becomes a readable hero shot without faking any event', async () => {
  const {selectCinematicShot} = await import('../../public/snake-stream/cinematic-director.mjs');
  const approaching = freezeGame();
  const prior = JSON.stringify(approaching);
  assert.equal(selectCinematicShot(approaching), 'detail', 'food within two real cell steps should be shown during the follow interval');
  assert.equal(JSON.stringify(approaching), prior, 'camera never mutates public or authoritative state');
  assert.equal(selectCinematicShot(freezeGame({food:{cell:0}})), 'follow', 'remote food is not a contact event');
  assert.equal(selectCinematicShot(freezeGame({food:{cell:-1}})), 'follow', 'bad food indices must not invent contacts');
  assert.equal(selectCinematicShot(freezeGame({food:{cell:8+9*28}})), 'follow', 'food behind a moving serpent is not an approaching contact');
});

test('danger, portal discontinuity, reduced motion and full-board editorial intervals have higher priority', async () => {
  const {selectCinematicShot} = await import('../../public/snake-stream/cinematic-director.mjs');
  assert.equal(selectCinematicShot(freezeGame({dangerLevel:2})), 'overview');
  assert.equal(selectCinematicShot(freezeGame(),{reducedMotion:true}), 'overview');
  assert.equal(selectCinematicShot(freezeGame({snake:[{cell:8+7*28},{cell:20+8*28}]})), 'overview');
  assert.equal(selectCinematicShot(freezeGame({movementStep:34})), 'overview', 'keep the editorial wide shot when fruit is close');
  assert.equal(selectCinematicShot(freezeGame({movementStep:145})), 'overview', 'keep the second wide interval');
});

test('portrait and desktop follow gain true optical prominence with no world or game authority changes', async () => {
  const {cameraComposition} = await import('../../public/snake-stream/camera.mjs');
  for (const aspect of [16/9,390/844]) {
    const p=cameraComposition({width:28,height:16,aspect,mode:'follow',head:{x:3,z:-2}});
    const distance=Math.hypot(p.offset.x,p.offset.y,p.offset.z);
    assert.ok(distance< (aspect<1 ? 10 : 11), 'optical scale must be clearly closer than old 11.5/12 units');
    assert.ok(distance> (aspect<1 ? 8.3 : 8.8), 'real forest must still frame the serpent; not head-only crop');
    assert.deepEqual(p.target,{x:3,y:.4,z:-2}, 'head position remains authoritative');
    const o=cameraComposition({width:28,height:16,aspect,mode:'overview',head:{x:3,z:-2}});
    assert.deepEqual(o.target,{x:0,y:.4,z:0},'full-board overview retained');
    assert.ok(Math.hypot(...Object.values(o.offset))>distance,'overview keeps a true wide-view recovery');
  }
});
