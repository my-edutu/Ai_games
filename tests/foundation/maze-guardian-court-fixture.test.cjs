'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { MazeRuntime } = require('../../dist/games/ai-maze-escape/src/runtime/run.js');
const { applyMazeAction } = require('../../dist/games/ai-maze-escape/src/rules/step.js');
const { parseMazeConfig } = require('../../dist/games/ai-maze-escape/src/config/schema.js');
const { areAdjacentThroughPassage, solveMaze, passageNeighbors } = require('../../dist/games/ai-maze-escape/src/generation/solver.js');
const { validateMazeContent, solveMazeWithInventory } = require('../../dist/games/ai-maze-escape/src/generation/content.js');
const { buildMazeRenderSnapshot } = require('../../dist/games/ai-maze-escape/src/presentation/snapshot.js');
const { encodeMazeSnapshot, restoreMazeRuntime } = require('../../dist/games/ai-maze-escape/src/persistence/snapshot.js');
const { checksum } = require('../../dist/packages/replay/src/index.js');
const { applyDueMazeInfluence } = require('../../dist/games/ai-maze-escape/src/influence/apply.js');
const { buildMazeInfluenceCandidates, applyMazeCandidatePreview } = require('../../dist/games/ai-maze-escape/src/influence/candidates.js');

const CONFIG = Object.freeze({width:17,height:11,layoutId:'guardian-court-v1',profile:'chambers',
  level:4,intermissionTicks:12,maxTicks:18000,visibilityRadius:3,
  loopChancePermille:170,keyCount:1,trapCount:1,threatCount:1,
  memoryTtl:400,noProgressTicks:3000,repairAttempts:3});
const SEED = 'tideglass-guardian-court-v1';
const court = Array.from({length:4},(_,r)=>Array.from({length:5},(_,c)=>(r+4)*17+c+6)).flat();
const create = () => MazeRuntime.create(CONFIG,SEED,{policy:'partial-observation'});

test('the explicit authored fixture is a real fully connected 4 by 5 same-tier court', () => {
  const {world,config} = create().state;
  assert.equal(config.layoutId,'guardian-court-v1','authored layout is an explicit parsed opt-in');
  assert.equal(world.layoutId,'guardian-court-v1','generation must construct the versioned authored world');
  assert.equal(validateMazeContent(world).valid,true);
  assert.deepEqual(new Set(court.map(cell=>Math.floor(Math.floor(cell/17)*3/11))),new Set([1]));
  for(const cell of court){
    for(const next of [cell+1,cell+17].filter(next=>court.includes(next)))
      assert.equal(areAdjacentThroughPassage(world,cell,next),true,`physical court edge ${cell} <-> ${next}`);
    assert.equal(world.blockedCells.includes(cell),false);
    assert.equal(world.traps.includes(cell),false,'the performance floor is genuinely safe ground');
  }
  assert.equal(world.keys.length,1);
  assert.equal(world.traps.length,1);
  assert.equal(world.threats.length,1);
  const key=world.keys[0],gallery=passageNeighbors(world,key.cell);
  assert.equal(gallery.length,1,'key has a terminal physical gallery');
  assert.equal(passageNeighbors(world,gallery[0]).length,2,'gallery requires an actual return');
  assert.ok(solveMazeWithInventory(world),'capability validation proves the guardian/key dependencies');
});

test('a solid guardian seal blocks the key gallery until the actual lantern-counter rule opens it', () => {
  const locked=create(),seal=locked.state.world.doors.find(door=>door.requiredGuardianId);
  assert.ok(seal,'the key gallery needs an authoritative guardian seal');
  assert.equal(seal.requiredKeyId,null,'inventory cannot invent a guardian-release key');
  const route=solveMaze(locked.state.world,{start:locked.state.explorer.cell,goal:seal.a,
    blockedCells:[...locked.state.world.traps,...locked.state.world.threats.flatMap(threat=>threat.route)],
    isEdgeBlocked:(a,b)=>locked.state.world.doors.some(door=>!door.open&&
      ((door.a===a&&door.b===b)||(door.a===b&&door.b===a)))});
  assert.ok(route,'a legal uncountered approach reaches the real sealed threshold');
  let state=locked.state;
  for(const targetCell of route.slice(1)){
    const result=applyMazeAction(state,{kind:'move',targetCell},locked.rng);
    assert.equal(result.accepted,true);
    state=result.state;
  }
  const rejected=applyMazeAction(state,{kind:'move',targetCell:seal.b},locked.rng);
  assert.equal(rejected.accepted,false);
  assert.equal(rejected.reason,'locked-door');
  assert.deepEqual(rejected.state,state,'a failed sealed crossing is atomic');
  assert.equal(state.explorer.inventory.length,0);

  const natural=create();
  while(!natural.events.some(event=>event.type==='guardian-lantern-parry')&&natural.state.tick<200)
    natural.step();
  const parry=natural.events.find(event=>event.type==='guardian-lantern-parry');
  assert.ok(parry,'unchanged partial-observation policy must earn the real counter');
  const opened=natural.state.world.doors.find(door=>door.id===seal.id);
  assert.equal(opened.open,true);
  const release=natural.events.find(event=>event.type==='guardian-gate-opened');
  assert.equal(release?.tick,parry.tick,'release is a direct rule consequence on the counter tick');
  assert.equal(release?.data?.id,seal.id);
  assert.equal(release?.data?.guardianId,parry.data.id);
});

test('one untouched partial-observation run earns pressure, counter, key, return, matching gate, and escape within the existing limits', () => {
  const runtime=create(),world=structuredClone(runtime.state.world),witnesses={};
  assert.equal(world.layoutId,'guardian-court-v1');
  const guardian=world.threats[0],key=world.keys[0],middle=passageNeighbors(world,key.cell)[0];
  const entry=passageNeighbors(world,middle).find(cell=>cell!==key.cell);
  const keyGate=world.doors.find(door=>door.requiredKeyId===key.id);
  assert.ok(keyGate);
  let previous=buildMazeRenderSnapshot(runtime.state);
  for(let i=0;i<=200;i++){
    const snapshot=buildMazeRenderSnapshot(runtime.state);
    assert.equal(snapshot.runToken,previous.runToken,'single continuous run');
    if(snapshot.cells.some(cell=>cell.visible&&cell.trap))witnesses.pressure??=snapshot.tick;
    const threat=snapshot.threats.find(threat=>threat.id===guardian.id);
    if(threat)witnesses.guardian??=snapshot.tick;
    if(threat?.lanternParried){
      witnesses.counter??=snapshot.tick;
      assert.ok(court.includes(snapshot.currentCell)&&court.includes(threat.cell),
        'Pip and Thornback occupy the same real connected performance terrace during counter');
    }
    if(snapshot.currentCell===key.cell)witnesses.shrine??=snapshot.tick;
    if(snapshot.inventory.includes(key.id))witnesses.key??=snapshot.tick;
    if(snapshot.inventory.includes(key.id)&&snapshot.currentCell===entry)witnesses.return??=snapshot.tick;
    if(snapshot.doors.some(door=>door.id===keyGate.id&&door.open))witnesses.gate??=snapshot.tick;
    if(snapshot.result?.reason==='escape')witnesses.escape??=snapshot.tick;
    if(runtime.state.result)break;
    previous=snapshot;
    runtime.step();
  }
  assert.equal(runtime.state.result?.reason,'escape');
  for(const name of ['pressure','guardian','counter','shrine','key','return','gate','escape'])
    assert.ok(Number.isInteger(witnesses[name]),`missing public ${name}`);
  assert.ok(witnesses.pressure<witnesses.guardian,'pressure is witnessed before guardian');
  assert.ok(witnesses.guardian<witnesses.counter);
  assert.ok(witnesses.counter<witnesses.key);
  assert.ok(witnesses.key<witnesses.return&&witnesses.return<witnesses.gate);
  assert.ok(witnesses.gate<witnesses.escape);
  assert.ok(witnesses.key-witnesses.counter<=120);
  assert.ok(witnesses.escape<=200);
  assert.equal(runtime.events.some(event=>event.type==='action-rejected'),false);
  assert.equal(runtime.events.filter(event=>event.type==='guardian-lantern-parry').length,1);
  assert.ok(runtime.events.filter(event=>event.type==='move').every(event=>
    areAdjacentThroughPassage(world,event.data.from,event.data.to)),'every movement uses the real graph');
});

test('the fixture remains deterministic through restore without publishing hidden layout cells or guardian dependencies', () => {
  const runtime=create(),initial=buildMazeRenderSnapshot(runtime.state);
  assert.equal(initial.layoutId,'guardian-court-v1');
  assert.equal('world' in initial,false);
  assert.equal('passages' in initial,false);
  assert.equal('courtCells' in initial,false);
  assert.equal(JSON.stringify(initial).includes('requiredGuardianId'),false);
  assert.equal(initial.keys.length,0,'the key starts behind a real closed seal');
  assert.ok(initial.cells.length<court.length);
  for(let i=0;i<10;i++)runtime.step();
  const restored=restoreMazeRuntime(encodeMazeSnapshot(runtime));
  while(runtime.state.lifecycle==='running'&&runtime.state.tick<200){runtime.step();restored.step();}
  assert.deepEqual(restored.state,runtime.state);
  assert.deepEqual(restored.events,runtime.events);
  assert.deepEqual(restored.rng.snapshot(),runtime.rng.snapshot());
  assert.equal(runtime.state.result?.reason,'escape');
});

test('unknown or mismatched fixture definitions fail explicitly instead of silently changing content', () => {
  assert.throws(()=>parseMazeConfig({...CONFIG,layoutId:'unknown-court'}),/layoutId/);
  assert.throws(()=>parseMazeConfig({...CONFIG,width:16}),/guardian-court-v1/);
  assert.throws(()=>parseMazeConfig({...CONFIG,keyCount:2}),/guardian-court-v1/);
});

test('audience door commands cannot release the guardian seal before the real counter', () => {
  const runtime=create(),seal=runtime.state.world.doors.find(door=>door.requiredGuardianId);
  assert.ok(seal);
  assert.equal(buildMazeInfluenceCandidates(runtime.state).some(candidate=>
    candidate.effectId==='open-eligible-door'&&candidate.payload.doorId===seal.id),false);
  runtime.queueInfluence({schemaVersion:1,id:'attempt-unearned-guardian-release',
    effectId:'open-eligible-door',candidateId:'sealed-fixture-door',payload:{doorId:seal.id},
    issuedAtTick:0,scheduledTick:0,expiresAtTick:20,source:'operator',recordCategory:'audience-influenced'});
  const result=applyDueMazeInfluence(runtime.state,runtime.rng);
  assert.equal(result.rejected,1,'the real queued effect must reject an unearned guardian release');
  assert.equal(result.applied,0);
  assert.equal(result.state.world.doors.find(door=>door.id===seal.id).open,false);
});

test('an explicit next-profile transition exits the authored fixture on the next restart', () => {
  const runtime=create();
  applyMazeCandidatePreview(runtime.state,'next-profile',{profile:'loops'});
  runtime.restart('authored-to-procedural');
  assert.equal(runtime.config.profile,'loops');
  assert.equal(runtime.state.world.profile,'loops');
  assert.equal('layoutId' in runtime.config,false);
  assert.equal('layoutId' in runtime.state.world,false);
  assert.equal('layoutId' in buildMazeRenderSnapshot(runtime.state),false);
});

test('dependency validation rejects a guardian trapped behind its own sealed gallery', () => {
  const world=structuredClone(create().state.world);
  world.threats[0].cell=130;
  world.threats[0].route=[130,131];
  assert.equal(solveMazeWithInventory(world),null,'a sealed edge is not a valid counter vantage');
  assert.equal(validateMazeContent(world).valid,false);
});

test('procedural seeds retain their exact worlds, state, events and public snapshot checksums', () => {
  const config={...CONFIG,keyCount:2,trapCount:5};delete config.layoutId;
  const expected=[
    ['maze-stream-reference','621ee171','547ba920','fd741228',99,'c945c4fa','2122b0f5','74443dad'],
    ['tideglass-live-chapter-1387','6dd4c367','39c44376','7a708ac4',136,'134f00ff','b78f25e6','5efc3360'],
    ['maze-visual-reference-13','9537caf9','a761d496','d037494c',103,'14911ee2','19cdb1e8','f95b9d8d'],
  ];
  for(const [seed,world,initial,publicInitial,tick,final,publicFinal,events] of expected){
    const runtime=MazeRuntime.create(config,seed);
    assert.equal('layoutId' in runtime.config,false);
    assert.equal('layoutId' in runtime.state.world,false);
    assert.equal('layoutId' in buildMazeRenderSnapshot(runtime.state),false);
    assert.equal(checksum(runtime.state.world),world,seed);
    assert.equal(checksum(runtime.state),initial,seed);
    assert.equal(buildMazeRenderSnapshot(runtime.state).publicChecksum,publicInitial,seed);
    while(runtime.state.lifecycle==='running'&&runtime.state.tick<200)runtime.step();
    assert.equal(runtime.state.tick,tick,seed);
    assert.equal(checksum(runtime.state),final,seed);
    assert.equal(buildMazeRenderSnapshot(runtime.state).publicChecksum,publicFinal,seed);
    assert.equal(checksum(runtime.events),events,seed);
  }
});


test('actual autonomous authored hit earns a current public light path, not a hidden or stale one',async()=>{
  const {publicAuthoredCounterLightPath}=await import('../../public/ai-maze-escape/public-lantern-encounter.mjs');
  const {publicGuardianCounterMoment}=await import('../../public/ai-maze-escape/public-counter-moment.mjs');
  const runtime=create();let previous=buildMazeRenderSnapshot(runtime.state),witnessed=null,snapshot;
  for(let j=0;j<200&&!runtime.state.result;j++){
    runtime.step();snapshot=buildMazeRenderSnapshot(runtime.state);
    witnessed=publicGuardianCounterMoment(previous,snapshot);
    if(witnessed)break;previous=snapshot;
  }
  assert.ok(witnessed);
  const actor={id:witnessed.id,cell:witnessed.cell,x:1,z:1,counterPhase:.35,originCell:snapshot.currentCell,counterTick:snapshot.tick};
  const route=publicAuthoredCounterLightPath(snapshot,actor,null);
  assert.ok(route,'real authored counter must have a visible reciprocal contact path');
  assert.ok(route.links>=1&&route.links<=3);
  assert.equal(publicAuthoredCounterLightPath({...snapshot,layoutId:undefined},actor,null),null);
  assert.equal(publicAuthoredCounterLightPath({...snapshot,tick:snapshot.tick+1},actor,null),null);
  assert.equal(publicAuthoredCounterLightPath(snapshot,{...actor,id:'other'},null),null);
  assert.equal(publicAuthoredCounterLightPath(snapshot,{...actor,counterPhase:1},null),null);
  assert.equal(publicAuthoredCounterLightPath({...snapshot,visibleCells:[snapshot.currentCell]},actor,null),null);
  const sealed=structuredClone(snapshot);
  for(const tile of sealed.cells)if(tile.cell===snapshot.currentCell)tile.neighbors=[];
  assert.equal(publicAuthoredCounterLightPath(sealed,actor,null),null);
});
