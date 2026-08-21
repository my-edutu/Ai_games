'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

const {validateFloorsConfig}=require('../../dist/games/ai-vs-1000-floors/src/config/schema.js');
const {createFloorsInitialState}=require('../../dist/games/ai-vs-1000-floors/src/index.js');
const {checksum}=require('../../dist/packages/replay/src/index.js');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {generateFloor}=require('../../dist/games/ai-vs-1000-floors/src/generation/floor.js');
const {validateFloor,repairFloor}=require('../../dist/games/ai-vs-1000-floors/src/generation/validator.js');
const {listLegalActions,actionKey}=require('../../dist/games/ai-vs-1000-floors/src/rules/step.js');
const {chooseFallbackAction}=require('../../dist/games/ai-vs-1000-floors/src/ai/fallback.js');
const {manhattan}=require('../../dist/games/ai-vs-1000-floors/src/ai/pathing.js');
const {applyFloorsAction}=require('../../dist/games/ai-vs-1000-floors/src/rules/step.js');
const {FloorsRuntime}=require('../../dist/games/ai-vs-1000-floors/src/runtime/run.js');
const {encodeFloorsSnapshot,restoreFloorsRuntime,FloorsSnapshotError}=require('../../dist/games/ai-vs-1000-floors/src/persistence/snapshot.js');
const {runFloorsHeadless}=require('../../dist/games/ai-vs-1000-floors/src/testing/headless.js');

const config=validateFloorsConfig({});

test('configuration rejects invalid dimensions and preserves the 1,000-floor contract',()=>{
  assert.throws(()=>validateFloorsConfig({width:4}),/width/);
  assert.throws(()=>validateFloorsConfig({height:16}),/height/);
  assert.throws(()=>validateFloorsConfig({totalFloors:999}),/totalFloors/);
  assert.equal(config.totalFloors,1000);
  assert.equal(config.checkpointInterval,25);
  assert.equal(config.sectorSize,100);
});

test('identical seed and run identity produce identical authoritative initial state',()=>{
  const a=createFloorsInitialState(config,'phase1-seed','run-1');
  const b=createFloorsInitialState(config,'phase1-seed','run-1');
  assert.deepEqual(a,b);
  assert.equal(a.floor.number,1);
  assert.equal(a.player.health,a.player.maxHealth);
  assert.equal(a.lifecycle,'running');
  assert.match(checksum(a),/^[0-9a-f]{8}$/);
});


test('constructive generation produces a reproducible reachable and spawn-safe floor',()=>{
  const a=generateFloor(config,37,NamedRng.fromSeed('floor-a'));
  const b=generateFloor(config,37,NamedRng.fromSeed('floor-a'));
  assert.deepEqual(a,b);
  const report=validateFloor(a,config);
  assert.equal(report.valid,true,JSON.stringify(report));
  assert.equal(report.reachableExit,true);
  assert.equal(report.safeSpawn,true);
  assert.ok(a.mandatoryPath.length>=config.width-2);
  assert.equal(a.mandatoryPath[0],a.start);
  assert.equal(a.mandatoryPath.at(-1),a.exit);
});

test('128 stratified seeds remain valid and generation work is bounded',()=>{
  for(let i=0;i<128;i++){
    const floorNumber=1+((i*37)%1000);
    const floor=generateFloor(config,floorNumber,NamedRng.fromSeed(`corpus-${i}`));
    const report=validateFloor(floor,config);
    assert.equal(report.valid,true,`seed corpus-${i}: ${JSON.stringify(report)}`);
    assert.ok(floor.enemies.length<=config.maxEnemyBudget);
    assert.ok(floor.featureReport.repairCount<=2);
  }
});

test('deterministic repair restores a broken mandatory exit route without changing seed identity',()=>{
  const floor=generateFloor(config,12,NamedRng.fromSeed('repair-me'));
  const broken=structuredClone(floor);
  broken.walls.push(broken.mandatoryPath[Math.floor(broken.mandatoryPath.length/2)]);
  const invalid=validateFloor(broken,config);
  assert.equal(invalid.valid,false);
  assert.ok(invalid.errors.includes('EXIT_UNREACHABLE')||invalid.errors.includes('CELL_OVERLAP'));
  const repaired=repairFloor(broken,invalid,config);
  const report=validateFloor(repaired,config);
  assert.equal(report.valid,true,JSON.stringify(report));
  assert.equal(repaired.number,floor.number);
  assert.equal(repaired.featureReport.repairCount,1);
});

test('zero base enemy budget produces a safe headless corpus without hidden scaling',()=>{
  const safeConfig=validateFloorsConfig({baseEnemyBudget:0,maxEnemyBudget:1});
  for(const floorNumber of [1,250,500,750,1000]){
    const floor=generateFloor(safeConfig,floorNumber,NamedRng.fromSeed(`safe-${floorNumber}`));
    assert.equal(floor.enemies.length,0);
  }
});


test('fallback policy emits only a legal authoritative action and advances a cloned state',()=>{
  const safeConfig=validateFloorsConfig({baseEnemyBudget:0,maxEnemyBudget:1});
  const state=createFloorsInitialState(safeConfig,'fallback-seed','fallback-run');
  const before=structuredClone(state);
  const legal=listLegalActions(state);
  const decision=chooseFallbackAction(state);
  assert.ok(legal.some(action=>actionKey(action)===actionKey(decision.action)));
  const result=applyFloorsAction(state,decision.action,NamedRng.fromSeed('fallback-seed'));
  assert.equal(result.accepted,true);
  assert.equal(result.state.tick,1);
  assert.deepEqual(state,before);
});

test('invalid movement is rejected atomically without advancing logical time',()=>{
  const state=createFloorsInitialState(config,'invalid-seed','invalid-run');
  const before=structuredClone(state);
  const wall=state.floor.walls.find(cell=>cell!==state.player.cell);
  const result=applyFloorsAction(state,{kind:'move',targetCell:wall},NamedRng.fromSeed('invalid-seed'));
  assert.equal(result.accepted,false);
  assert.equal(result.reason,'illegal-action');
  assert.deepEqual(result.state,before);
});

test('safe headless authority climbs all 1,000 floors, resolves victory and restarts automatically',()=>{
  const safeConfig=validateFloorsConfig({baseEnemyBudget:0,maxEnemyBudget:1,intermissionTicks:2,maxTicksPerFloor:100});
  const runtime=FloorsRuntime.create(safeConfig,'complete-seed',{runId:'complete-run',policy:'fallback'});
  let guard=0;
  while(runtime.state.lifecycle==='running'&&guard++<30000)runtime.step();
  assert.equal(runtime.state.lifecycle,'result');
  assert.equal(runtime.state.result?.reason,'victory');
  assert.equal(runtime.state.highestFloor,1000);
  assert.equal(runtime.state.floorsCleared,1000);
  assert.match(runtime.state.result?.finalChecksum??'',/^[0-9a-f]{8}$/);
  const firstRunId=runtime.state.runId;
  runtime.step();
  assert.equal(runtime.state.lifecycle,'intermission');
  runtime.step();
  runtime.step();
  assert.equal(runtime.state.lifecycle,'running');
  assert.equal(runtime.state.floor.number,1);
  assert.notEqual(runtime.state.runId,firstRunId);
});

test('same seed, version and policy produce the same state, RNG and ordered event stream',()=>{
  const safeConfig=validateFloorsConfig({baseEnemyBudget:0,maxEnemyBudget:1,maxTicksPerFloor:100});
  const run=()=>{
    const runtime=FloorsRuntime.create(safeConfig,'determinism-seed',{runId:'determinism-run',policy:'fallback'});
    for(let i=0;i<250;i++)runtime.step();
    return{state:runtime.state,rng:runtime.rng.snapshot(),events:runtime.peekEvents()};
  };
  const a=run(),b=run();
  assert.deepEqual(a,b);
  assert.equal(checksum(a),checksum(b));
});

test('verified snapshot restore matches uninterrupted authority and rejects corrupt or unsupported evidence',()=>{
  const safeConfig=validateFloorsConfig({baseEnemyBudget:0,maxEnemyBudget:1,maxTicksPerFloor:100});
  const uninterrupted=FloorsRuntime.create(safeConfig,'snapshot-seed',{runId:'snapshot-run',policy:'fallback'});
  for(let i=0;i<120;i++)uninterrupted.step();
  const envelope=encodeFloorsSnapshot(uninterrupted);
  const restored=restoreFloorsRuntime(structuredClone(envelope));
  for(let i=0;i<160;i++){uninterrupted.step();restored.step();}
  assert.deepEqual(restored.state,uninterrupted.state);
  assert.deepEqual(restored.rng.snapshot(),uninterrupted.rng.snapshot());
  assert.deepEqual(restored.peekEvents(),uninterrupted.peekEvents());
  const corrupt=structuredClone(envelope);corrupt.state.tick++;
  assert.throws(()=>restoreFloorsRuntime(corrupt),error=>error instanceof FloorsSnapshotError&&error.code==='CORRUPT');
  const unsupported=structuredClone(envelope);unsupported.version=2;
  assert.throws(()=>restoreFloorsRuntime(unsupported),error=>error instanceof FloorsSnapshotError&&error.code==='UNSUPPORTED_VERSION');
});

test('floor timeout and no-progress end as typed game results rather than silent stalls',()=>{
  const timer=FloorsRuntime.create(validateFloorsConfig({baseEnemyBudget:0,maxEnemyBudget:1,maxTicksPerFloor:60,noProgressTicks:100}),'timer-seed',{policy:'wait-test'});
  for(let i=0;i<80&&timer.state.lifecycle==='running';i++)timer.step();
  assert.equal(timer.state.result?.reason,'floor-timeout');
  assert.equal(timer.state.result?.kind,'game');
  const stalled=FloorsRuntime.create(validateFloorsConfig({baseEnemyBudget:0,maxEnemyBudget:1,maxTicksPerFloor:100,noProgressTicks:20}),'stall-seed',{policy:'wait-test'});
  for(let i=0;i<40&&stalled.state.lifecycle==='running';i++)stalled.step();
  assert.equal(stalled.state.result?.reason,'stagnation');
  assert.equal(stalled.state.result?.kind,'game');
});


test('headless corpus reports deterministic outcomes separately from integrity failures',()=>{
  const report=runFloorsHeadless({
    seedPrefix:'phase1-corpus',
    runs:4,
    maxTicks:30000,
    config:{baseEnemyBudget:0,maxEnemyBudget:1,maxTicksPerFloor:100},
  });
  assert.equal(report.runs.length,4);
  assert.equal(report.invariantFailures,0);
  assert.equal(report.replayFailures,0);
  assert.equal(report.generatorInvalid,0);
  assert.equal(report.outcomes.victory,4);
  assert.ok(report.totalTicks>0);
  assert.match(report.corpusChecksum,/^[0-9a-f]{8}$/);
});

test('runtime retains initial floor generation draws in its authoritative RNG snapshot',()=>{
  const runtime=FloorsRuntime.create(config,'rng-continuity',{runId:'rng-continuity-run'});
  const streams=runtime.rng.snapshot().streams;
  assert.ok(Object.keys(streams).some(name=>name.startsWith('floor-topology')));
  assert.ok(Object.keys(streams).length>=5);
});

test('a striker two cells away closes distance using the same deterministic path rules',()=>{
  const safeConfig=validateFloorsConfig({baseEnemyBudget:0,maxEnemyBudget:1});
  const state=createFloorsInitialState(safeConfig,'enemy-path','enemy-path-run');
  const target=state.floor.mandatoryPath[2];
  const beforeDistance=manhattan(target,state.player.cell,state.floor.width);
  state.floor.enemies=[{id:'enemy-test',kind:'striker',cell:target,health:2,maxHealth:2,attack:1,armor:0,telegraph:'idle',cooldown:0}];
  const result=applyFloorsAction(state,{kind:'wait'},NamedRng.fromSeed('enemy-path'));
  assert.equal(result.accepted,true);
  const moved=result.state.floor.enemies[0];
  assert.equal(manhattan(moved.cell,result.state.player.cell,result.state.floor.width),beforeDistance-1);
  assert.equal(moved.telegraph,'pursue');
});

test('automatic restart clears the prior in-memory event window and starts a coherent per-run sequence',()=>{
  const runtime=FloorsRuntime.create(validateFloorsConfig({intermissionTicks:1}),'restart-events',{runId:'restart-events-run'});
  runtime.state.lifecycle='result';
  runtime.state.result={kind:'game',reason:'operator-abort',tick:runtime.state.tick,highestFloor:1,score:0,finalChecksum:'00000000'};
  runtime.step();
  runtime.step();
  const events=runtime.peekEvents();
  assert.deepEqual(events.map(item=>item.seq),[1,2]);
  assert.deepEqual(events.map(item=>item.type),['runtime-restarted','floor-started']);
});
