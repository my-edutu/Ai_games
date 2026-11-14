'use strict';
// The floor-eight guardian's earned right-hand gateway must connect to a
// first real, traversable floor-nine climb. Preserving X without a route leaves
// a long reversal across bare ground to the default left-hand p1.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {generateTowerChunk,guardianArenaClearanceX}=require(
  '../../dist/games/infinite-tower-climb/src/generation/chunks.js');
const {parseTowerConfig}=require(
  '../../dist/games/infinite-tower-climb/src/config/schema.js');
const {createTowerObservation}=require(
  '../../dist/games/infinite-tower-climb/src/ai/observation.js');
const {nextTowerTacticalPlatform}=require(
  '../../dist/games/infinite-tower-climb/src/ai/graph.js');
const {analyzeTowerReachability}=require(
  '../../dist/games/infinite-tower-climb/src/generation/solver.js');
const {validateTowerChunk}=require(
  '../../dist/games/infinite-tower-climb/src/generation/validator.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');

function earnedArrival() {
  const runtime=TowerRuntime.create({...STREAM_CONFIG,launchFloor:8,
    maxTicks:3500,noProgressTicks:1800},
    'source-earned-next-floor-first-real-climb',{policy:'autonomous'});
  const cap=runtime.state.chunks.find(c=>c.floor===8).platforms
    .find(p=>p.id==='f8:cap');
  const boss=runtime.state.enemies.find(e=>e.floor===8&&e.kind==='guardian');
  assert.ok(cap&&boss);
  boss.active=false;boss.health=0;
  runtime.state.chunks.find(c=>c.floor===8).hazards=[];
  runtime.state.projectiles=[];runtime.state.pickups=[];
  const player=runtime.state.player;
  player.position={x:guardianArenaClearanceX(cap,player.halfWidth)-2500,
    y:cap.y+cap.height+player.halfHeight};
  player.velocity={x:4500,y:0};
  player.grounded=true;player.groundedPlatformId=cap.id;
  const result=runtime.step({move:1,jump:false,dash:false,
    attack:false,ability:false});
  assert.equal(result.floor,9,'only real physics crosses the earned gate');
  assert.ok(runtime.drainEvents().some(e=>e.type==='floor-complete'&&
    e.data?.guardianPassage));
  return {runtime,result};
}

test('earned right-hand gateway continues onto an observed, reachable first floor-nine step',()=>{
  const {result}=earnedArrival();
  const chunk=result.chunks.find(c=>c.floor===9);
  const bridge=chunk.platforms.find(p=>p.id==='f9:gateway-step');
  const ground=chunk.platforms.find(p=>p.id==='f9:ground');
  const next=chunk.platforms.find(p=>p.id==='f9:p2');
  assert.ok(bridge&&ground&&next);
  assert.equal(bridge.kind,'oneway');
  assert.ok(result.player.grounded&&result.player.groundedPlatformId===ground.id);
  assert.ok(result.player.position.x>=bridge.x+result.player.halfWidth&&
    result.player.position.x<=bridge.x+bridge.width-result.player.halfWidth,
    'physical gateway arrival is beneath the new first climb, not across the floor');
  const observation=createTowerObservation(result,{includeHazardWindup:true});
  const chosen=nextTowerTacticalPlatform(observation,result.config,
    ground.id,undefined,result.player.halfWidth,result.player.halfHeight);
  assert.equal(chosen?.id,bridge.id,
    'the actual floor-nine AI must select the climb adjoining its earned gate');
  const reach=analyzeTowerReachability(chunk,result.config);
  assert.ok(reach.reachablePlatformIds.includes(bridge.id));
  assert.ok(reach.routePlatformIds?.includes(bridge.id)||
    reach.reachablePlatformIds.includes(next.id));
  assert.deepEqual(validateTowerChunk(chunk,result.config).issues,[]);
});

test('frozen/unflagged generation never grows a new gateway route',()=>{
  const config=parseTowerConfig({...STREAM_CONFIG,launchFloor:8,
    guardianArenaHazards:false,guardianSecondWind:false});
  const chunk=generateTowerChunk(config,'frozen-shape-unchanged',9);
  assert.ok(!chunk.platforms.some(p=>p.id==='f9:gateway-step'));
  assert.equal(chunk.platforms.length,8);
});

test('the extra real deck is omitted when the validated platform budget is exhausted',()=>{
  const config=parseTowerConfig({...STREAM_CONFIG,launchFloor:8,
    maxPlatformsPerChunk:8});
  const chunk=generateTowerChunk(config,'tight-platform-budget',9);
  assert.ok(!chunk.platforms.some(p=>p.id==='f9:gateway-step'));
  assert.equal(chunk.platforms.length,8);
  assert.deepEqual(validateTowerChunk(chunk,config).issues,[]);
});

test('authentic guardian gateway earns a grounded recovery stride before the first floor-nine leap',()=>{
  const {runtime,result}=earnedArrival();
  assert.equal(result.lastGuardianCrossing?.sourceTick,result.tick,
    'recovery must be anchored in the actual defeated-guardian crossing');
  const {chooseTowerAction}=require('../../dist/games/infinite-tower-climb/src/ai/policy.js');
  let groundedSteps=0;
  for(let i=0;i<8;i++){
    const observed=createTowerObservation(runtime.state,{includeHazardWindup:true});
    const decision=chooseTowerAction(runtime.state,observed,{tactical:true});
    assert.equal(decision.action.jump,false,
      'first eight honest source ticks must show grounded gateway traversal, not immediate 13.8m/tick airborne teleport-like motion');
    assert.equal(decision.action.dash,false,'no unearned post-win burst');
    assert.equal(decision.intent.targetPlatformId,'f9:ground');
    const after=runtime.step(decision.action);
    assert.equal(after.floor,9,'grounded handoff must not invent another floor');
    assert.equal(after.player.groundedPlatformId,'f9:ground',
      'body must continue on genuine walkable successor ground');
    groundedSteps++;
  }
  assert.equal(groundedSteps,8);
  let onward=false;
  for(let i=0;i<100;i++){
    const observed=createTowerObservation(runtime.state,{includeHazardWindup:true});
    const decision=chooseTowerAction(runtime.state,observed,{tactical:true});
    if(decision.action.jump){onward=true;break;}
    runtime.step(decision.action);
  }
  assert.equal(onward,true,
    'post-victory grounded stride must release to real floor-nine route, not trap the AI forever');
});

test('authentic 475-tick autonomous danger capture does not jump over earned grounded Floor Nine doorway',()=>{
  // Reproduce the EXACT 20Hz source seed + opt-in configuration from the
  // unmodified 2026-11-14 real WebM d55c3723 campaign. The earlier
  // hand-placed fixture omitted the live F8 encounter and F9 arrival hazards;
  // it passed while both actual films still jumped immediately after tick 475.
  const runtime=TowerRuntime.create({...STREAM_CONFIG,launchFloor:8},
    'tower-transformation-capture-v1',{policy:'autonomous'});
  while(runtime.state.lifecycle==='running' && runtime.state.tick<475)
    runtime.step();
  const arrived=runtime.state;
  assert.equal(arrived.floor,9,'match the real defeated guardian and earned 8->9 episode');
  assert.equal(arrived.tick,475,'match the real film source tick, not a hand-placed win');
  assert.equal(arrived.lastGuardianCrossing?.sourceTick,475);
  assert.equal(arrived.player.grounded,true);
  assert.equal(arrived.player.groundedPlatformId,'f9:ground');
  const realRoof=arrived.chunks.find(c=>c.floor===9).platforms
    .find(p=>p.id==='f9:ground');
  assert.equal(arrived.player.position.y-arrived.player.halfHeight,
    realRoof.y+realRoof.height);
  // Never specify an action here: the REAL autonomous policy must own every
  // decision, with all generated new-floor enemies/hazards still present.
  // A genuine emergency evasion must be diagnosed rather than hidden.
  for(let i=0;i<8;i++){
    runtime.step();
    const after=runtime.state;
    assert.equal(after.floor,9);
    assert.equal(after.player.grounded,true,
      `real post-gateway tick ${after.tick} broke source ground; AI=${after.ai.mode}: ${after.ai.intent}`);
    assert.equal(after.player.groundedPlatformId,'f9:ground');
    assert.equal(after.player.position.y-after.player.halfHeight,
      realRoof.y+realRoof.height);
  }
});
