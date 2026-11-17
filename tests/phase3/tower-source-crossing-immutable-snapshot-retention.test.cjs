'use strict';
// P0 source truth: a real guardian HP0 roof crossing must be published on
// the very first source tick and remain reviewable through a bounded,
// same-run browser/WebGL buffering window. This is a projection test, not
// a fabricated game victory, native-video proof or a critic preference.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerRenderSnapshot}=
  require('../../dist/games/infinite-tower-climb/src/presentation/snapshot.js');
const {generateTowerChunk,guardianArenaClearanceX}=
  require('../../dist/games/infinite-tower-climb/src/generation/chunks.js');
const {parseTowerConfig}=
  require('../../dist/games/infinite-tower-climb/src/config/schema.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');
const {checksum}=require('../../dist/packages/replay/src/index.js');

const seed='tower-transformation-capture-v1';
const config=parseTowerConfig({...STREAM_CONFIG,launchFloor:8});

function earnedCrossing() {
  const runtime=TowerRuntime.create(config,seed,{policy:'autonomous'});
  const state=runtime.state;
  const cap=state.chunks.find(c=>c.floor===8).platforms.find(p=>p.id==='f8:cap');
  const guardian=state.enemies.find(e=>e.floor===8&&e.kind==='guardian');
  assert.ok(cap&&guardian,'fixture must include the real cap and guardian');
  const x=guardianArenaClearanceX(cap,state.player.halfWidth)+1000;
  const y=cap.y+cap.height+state.player.halfHeight;
  state.player.position={x,y};
  state.player.velocity={x:0,y:0};
  state.player.state='standing';
  state.player.grounded=true;
  state.player.groundedPlatformId='f8:cap';
  state.player.health=Math.max(2,state.player.health);
  guardian.active=false;guardian.health=0;
  state.enemies=[guardian];
  state.projectiles=[];state.pickups=[];
  state.chunks.find(c=>c.floor===8).hazards=[];
  runtime.step({move:0,jump:false,dash:false,attack:false,ability:false});
  const earned=runtime.state;
  assert.equal(earned.floor,9,'source, not a presentation hack, earns Floor9');
  assert.equal(earned.player.groundedPlatformId,'f9:ground');
  assert.equal(earned.lastGuardianCrossing?.guardian.health,0);
  assert.equal(earned.lastGuardianCrossing?.sourceTick,earned.tick);
  return earned;
}

test('real physical HP0 crossing exists in the very first immutable Floor9 public snapshot',()=>{
  const state=earnedCrossing();
  const prior=checksum(state);
  const frame=createTowerRenderSnapshot(state,{includeWindupTicks:true});
  assert.equal(frame.lastGuardianCrossing?.sourceTick,state.tick,
    'the existing > comparison silently discarded this true first-crossing event');
  assert.equal(frame.lastGuardianCrossing?.runToken,frame.runToken);
  assert.equal(frame.lastGuardianCrossing?.crossingX,state.player.position.x);
  assert.equal(frame.lastGuardianCrossing?.cap.id,'f8:cap');
  assert.ok(Object.isFrozen(frame.lastGuardianCrossing));
  assert.equal(checksum(state),prior,'projection must never modify simulation');
});

test('the SAME source-owned event survives bounded sparse WebGL returns, never another run or floor',()=>{
  const earned=earnedCrossing(),tick=earned.tick;
  for(const offset of [0,1,12,13,20,36,48]){
    const sample={...earned,tick:tick+offset};
    const before=checksum(sample);
    const frame=createTowerRenderSnapshot(sample);
    assert.equal(frame.lastGuardianCrossing?.sourceTick,tick,
      'source crossing must survive '+offset+' actual source ticks of sampling lag');
    assert.equal(frame.lastGuardianCrossing?.runToken,frame.runToken);
    assert.equal(checksum(sample),before,'sampling cannot mutate authority');
  }
  for(const sample of [
    {...earned,tick:tick-1},
    {...earned,tick:tick+49},
    {...earned,floor:10},
    {...earned,runId:'another-real-episode'},
    {...earned,lastGuardianCrossing:{...earned.lastGuardianCrossing,
      runToken:'wrong-run-token'}},
    {...earned,config:{...earned.config,guardianArenaHazards:false}},
    {...earned,config:{...earned.config,guardianSecondWind:false}}
  ]){
    assert.equal(createTowerRenderSnapshot(sample).lastGuardianCrossing,undefined,
      'old, future, cross-run, different-floor and non-opted-in receipts must be vetoed');
  }
});

test('the unchanged seed cannot silently gain a source crossing before a guardian victory',()=>{
  const state=TowerRuntime.create(config,seed,{policy:'autonomous'}).state;
  assert.equal(createTowerRenderSnapshot(state).lastGuardianCrossing,undefined);
});
