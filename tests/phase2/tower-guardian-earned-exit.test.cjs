'use strict';
// The opt-in guardian escape is a playable cap traverse, never an invented
// win, forced teleport, replay rewrite or a positive quality vote.
const {test}=require('node:test'),assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {createTowerObservation}=require('../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
const {guardianArenaExitX,guardianArenaClearanceX}=require('../../dist/games/infinite-tower-climb/src/generation/chunks.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
function arena(overrides={}){
  const runtime=TowerRuntime.create({...STREAM_CONFIG,launchFloor:8,...overrides},
    'earned-physical-cap-passage',{policy:'autonomous'});
  const state=structuredClone(runtime.state),cap=state.chunks[0].platforms.find(p=>p.id==='f8:cap');
  const guardian=state.enemies.find(e=>e.kind==='guardian');
  assert.ok(cap&&guardian);
  const p=state.player;
  p.position={x:cap.x+24000,y:cap.y+cap.height+p.halfHeight};
  p.velocity={x:0,y:0};p.grounded=true;p.groundedPlatformId=cap.id;p.facing=1;
  guardian.health=0;guardian.active=false;
  state.projectiles=[];state.chunks[0].hazards=[];state.pickups=[];
  runtime.state=state;
  return {runtime,state,cap};
}
test('earned gate cannot teleport a hero standing anywhere above exitY',()=>{
  const {runtime,cap}=arena();
  const start=runtime.state.player.position.x;
  const step=runtime.step({move:1});
  assert.equal(step.floor,8);
  assert.ok(step.player.position.x>start&&step.player.position.x<guardianArenaExitX(cap));
  assert.equal(step.stats.floorsCleared,0);
  const absent=runtime.drainEvents().filter(e=>e.type==='floor-complete');
  assert.equal(absent.length,0);
  const plane=guardianArenaExitX(cap);
  const clearance=guardianArenaClearanceX(cap,runtime.state.player.halfWidth);
  assert.equal(clearance,plane+runtime.state.player.halfWidth+4000);
  for(const x of [plane-18000,plane,clearance-1]){
    runtime.state.player.position.x=x;
    runtime.state.player.velocity.x=0;
    const stillOnCap=runtime.step({move:0});
    assert.equal(stillOnCap.floor,8,
      'a center touching the gate is NOT proof the whole body passed through');
    assert.equal(stillOnCap.stats.floorsCleared,0);
  }
  runtime.state.player.position.x=clearance;
  runtime.state.player.velocity.x=0;
  const win=runtime.step({move:0});
  assert.equal(win.floor,9);
  assert.equal(win.stats.floorsCleared,1);
  const event=runtime.drainEvents().find(e=>e.type==='floor-complete');
  assert.deepEqual(event.data.guardianPassage,{
    fromFloor:8,capId:cap.id,guardianId:'f8:guardian',
    exitX:guardianArenaExitX(cap),clearanceX:clearance,
    crossingX:clearance,groundedPlatformId:cap.id
  });
});
test('missing defeated guardian cannot bypass the physically locked cap',()=>{
  const {runtime,cap}=arena();
  runtime.state.player.position.x=guardianArenaClearanceX(cap,runtime.state.player.halfWidth);
  runtime.state.enemies=[];
  const blocked=runtime.step({move:0});
  assert.equal(blocked.floor,8);
  assert.equal(blocked.stats.floorsCleared,0);
  assert.equal(runtime.drainEvents().filter(e=>e.type==='floor-complete').length,0);
});
test('full-body guardian clearance is always inside the real platform footprint',()=>{
  const {state,cap}=arena();
  const clearance=guardianArenaClearanceX(cap,state.player.halfWidth);
  assert.ok(clearance>guardianArenaExitX(cap)+state.player.halfWidth);
  assert.ok(clearance+state.player.halfWidth<cap.x+cap.width);
  assert.throws(()=>guardianArenaClearanceX(cap,NaN),RangeError);
});

test('live tactical climber elects a deterministic source-observed actual exit walk',()=>{
  const {state,cap}=arena();
  const before=JSON.stringify(state);
  const input=createTowerObservation(state,{includeHazardWindup:true});
  const decision=chooseTowerAction(state,input);
  assert.equal(decision.intent.mode,'aligning');
  assert.equal(decision.action.move,1);
  assert.equal(decision.action.jump,false);
  assert.equal(decision.intent.targetPlatformId,cap.id);
  assert.match(decision.intent.summary,/physical guardian passage/);
  assert.equal(JSON.stringify(state),before);
  assert.deepEqual(decision,chooseTowerAction(state,input));
  // The door's center cannot be a stop zone: the pilot must keep walking
  // while its trailing edge remains in FRONT of the actual bronze arch.
  state.player.position.x=guardianArenaExitX(cap)+state.player.halfWidth;
  state.player.velocity.x=0;
  const almost=createTowerObservation(state,{includeHazardWindup:true});
  assert.equal(chooseTowerAction(state,almost).action.move,1);
});

test('autonomous guardian victory requires a grounded real full-silhouette crossing',()=>{
  const {runtime,cap}=arena();
  const clearance=guardianArenaClearanceX(cap,runtime.state.player.halfWidth);
  let floorChange=null;
  for(let i=0;i<100;i++){
    const prior=runtime.state;
    const observed=runtime.step();
    if(observed.floor===9){floorChange={prior,observed};break;}
  }
  assert.ok(floorChange,'autonomous source policy must actually complete the earned walk');
  assert.ok(floorChange.prior.player.grounded);
  assert.equal(floorChange.prior.player.groundedPlatformId,cap.id);
  // The action's fixed-step physics crosses the plane before authority
  // advances. No timed victory, camera pose, or 3D mesh causes this event.
  const events=runtime.drainEvents().filter(event=>event.type==='floor-complete');
  assert.equal(events.length,1);
  assert.equal(events[0].data.floor,9);
  assert.ok(events[0].data.guardianPassage?.crossingX>=clearance);
  assert.equal(events[0].data.guardianPassage?.groundedPlatformId,cap.id);
  assert.ok(clearance>guardianArenaExitX(cap));
});
test('historical gates, non-guardian floors and airborne players do not receive a free source exit',()=>{
  const {runtime,cap}=arena({guardianArenaHazards:false});
  const old=runtime.step({move:0});
  assert.equal(old.floor,9,'unflagged legacy remains immediate');
  const {runtime:live}=arena();
  live.state.player.position.x=guardianArenaExitX(cap);
  live.state.player.grounded=false;
  live.state.player.groundedPlatformId=undefined;
  live.state.player.position.y+=9000;
  live.state.player.velocity.y=6000;
  const jump=live.step({move:0});
  assert.equal(jump.floor,8,'the portal requires real cap contact');
});
test('a real post-defeat clearance has a stable 3D gate anchor and passage source',async()=>{
  const coords=await import(pathToFileURL(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/coordinates.mjs')).href);
  const passage=await import(pathToFileURL(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/guardian-passage.mjs')).href);
  const {state,cap}=arena();
  const snapshot={platforms:state.chunks[0].platforms,enemies:[{
    kind:'guardian',active:false,health:0,halfHeight:18000,
    y:cap.y+cap.height+18000,x:cap.x+cap.width/2}]};
  assert.equal(coords.guardianGateAnchorX(snapshot,cap),guardianArenaExitX(cap));
  assert.equal(passage.observedGuardianPassage({
    runToken:'same',tick:100,floor:8,lifecycle:'running',enemies:snapshot.enemies
  },{runToken:'same',tick:101,floor:9,lifecycle:'running'}),true);
  assert.equal(passage.observedGuardianPassage({
    runToken:'same',tick:100,floor:8,lifecycle:'running',
    enemies:[{kind:'guardian',active:false,health:1}]
  },{runToken:'same',tick:101,floor:9,lifecycle:'running'}),false);
});

test('defeated guardian opens the source-authentic 3D doorway before earned floor exit', async () => {
  const passage=await import(pathToFileURL(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/guardian-passage.mjs')).href);
  const {state,cap}=arena();
  const base={
    runToken:'observed-cap-clearance',tick:121,floor:8,lifecycle:'running',
    chunkBaseY:state.chunks[0].baseY,worldWidth:state.config.worldWidth,
    player:{health:2},platforms:[cap],
    enemies:[{id:'f8:boss',kind:'guardian',active:false,health:0,
      x:cap.x+cap.width/2,y:cap.y+cap.height+18000,halfHeight:18000}],
  };
  const unlock=passage.observedUnlockedGuardianCap(base);
  assert.equal(unlock.cap.id,cap.id);
  assert.equal(unlock.guardianId,'f8:boss');
  assert.equal(unlock.floor,8,'the guardian is dead but the floor remains active');
  assert.equal(passage.observedUnlockedGuardianCap({
    ...base,enemies:[{...base.enemies[0],active:true,health:1}]
  }),null,'a living guardian cannot display an unearned open gate');
  assert.equal(passage.observedUnlockedGuardianCap({...base,player:{health:0}}),
    null,'a dead climber cannot trigger the living clearance stage');
  assert.equal(passage.observedUnlockedGuardianCap({
    ...base,platforms:[{...cap,width:NaN}]
  }),null,'invalid scene geometry cannot create a fictional gate');
  assert.equal(passage.observedUnlockedGuardianCap({...base,lifecycle:'result'}),
    null,'a result screen cannot resurrect an old portal');
  assert.equal(passage.observedUnlockedGuardianCap({
    ...base,enemies:[{...base.enemies[0],active:false,health:1}]
  }),null,'inactivity alone is not a witnessed guardian defeat');
  assert.deepEqual(passage.observedUnlockedGuardianCap(base),unlock,
    'same immutable source snapshot creates a deterministic stage');
});
