'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {MazeRuntime}=require('../../dist/games/ai-maze-escape/src/runtime/run.js');
const {stepMazeThreats}=require('../../dist/games/ai-maze-escape/src/threats/step.js');
const {passageNeighbors}=require('../../dist/games/ai-maze-escape/src/generation/solver.js');
const {buildMazeRenderSnapshot}=require('../../dist/games/ai-maze-escape/src/presentation/snapshot.js');

function fixture(){
  const runtime=MazeRuntime.create({width:11,height:11,profile:'loops',visibilityRadius:2,
    keyCount:0,trapCount:0,threatCount:0},'real-lantern-counter');
  const s=structuredClone(runtime.state), blocked=new Set(s.world.blockedCells);
  const hero=Array.from({length:s.world.width*s.world.height},(_,i)=>i).find(cell=>
    cell!==s.world.exit&&!blocked.has(cell)&&passageNeighbors(s.world,cell).some(other=>
      other!==s.world.exit&&!blocked.has(other)));
  assert.notEqual(hero,undefined,'needs a real connected walkable tile');
  const guard=passageNeighbors(s.world,hero).find(c=>!blocked.has(c)&&c!==s.world.exit);
  assert.notEqual(guard,undefined,'needs a real open cardinal passage');
  s.world.traps=[];s.world.keys=[];s.world.doors=[];
  s.world.threats=[{id:'real-thornback',cell:guard,route:[guard,hero],
    routeIndex:0,direction:1,lastSeenTick:null,active:true}];
  s.explorer.cell=hero;s.explorer.route=[hero];
  s.visibleCells=[hero,guard];s.discoveredCells=[hero,guard];
  s.tick=2;s.ai.mode='evading-threat';
  return {s,hero,guard};
}

test('actual witnessed AI wait holds a lethal patrol once; autonomous movement later resumes',()=>{
  const {s,hero,guard}=fixture();
  const active=stepMazeThreats(s,{lanternCounter:true});
  assert.equal(active.captured,false,'the guardian cannot walk onto Pip during this real counter');
  assert.equal(active.state.world.threats[0].cell,guard);
  assert.equal(active.state.world.threats[0].pausedUntilTick,5);
  assert.equal(active.state.world.threats[0].lanternParried,true);
  assert.equal(active.events.filter(e=>e.type==='guardian-lantern-parry').length,1);
  assert.deepEqual(buildMazeRenderSnapshot(active.state).threats,
    [{id:'real-thornback',cell:guard,lanternParried:true}]);
  const next=structuredClone(active.state);next.tick=3;
  const follow=stepMazeThreats(next,{lanternCounter:true});
  assert.equal(follow.events.some(e=>e.type==='guardian-lantern-parry'),false,
    'the earned counter cannot stunlock a guardian');
  const released=structuredClone(follow.state);released.tick=6;
  const moved=stepMazeThreats(released,{lanternCounter:true});
  assert.equal(moved.captured,true,'original lethal patrol remains effective after the pause');
  assert.equal(moved.state.world.threats[0].cell,hero);
  assert.equal(moved.events.some(e=>e.type==='guardian-lantern-parry'),false);
});

test('hidden guardian, sealed corridor, non-evasive waiting and contact cannot conjure counter',()=>{
  const {s,hero,guard}=fixture();
  for(const mutate of [
    state=>{state.visibleCells=[hero];},
    state=>{state.world.doors=[{id:'sealed',a:hero,b:guard,open:false,requiredKeyId:'x',
      critical:false,temporaryUntilTick:null}];},
    state=>{state.ai.mode='inspecting-hazard';},
    state=>{state.world.threats[0].cell=hero;},
  ]){
    const copy=structuredClone(s);mutate(copy);
    const result=stepMazeThreats(copy,{lanternCounter:true});
    assert.equal(result.events.some(e=>e.type==='guardian-lantern-parry'),false);
  }
  assert.equal(stepMazeThreats(s).events.some(e=>e.type==='guardian-lantern-parry'),false,
    'legacy non-counter path must remain unchanged');
});

test('public snapshot hides the earned counter when unseen, expired or on another run',()=>{
  const {s}=fixture(),held=stepMazeThreats(s,{lanternCounter:true}).state;
  held.visibleCells=[s.explorer.cell];
  assert.deepEqual(buildMazeRenderSnapshot(held).threats,[]);
  held.visibleCells=[s.explorer.cell,s.world.threats[0].cell];
  held.tick=5;
  assert.equal(buildMazeRenderSnapshot(held).threats[0].lanternParried,undefined);
  assert.equal(buildMazeRenderSnapshot(fixture().s).threats[0].lanternParried,undefined);
});

test('real runtime delegates the WAIT to the authoritative counter, not renderer input',()=>{
  const {s,hero,guard}=fixture();
  const runtime=MazeRuntime.create({width:11,height:11,profile:'loops',visibilityRadius:2,
    keyCount:0,trapCount:0,threatCount:0},'real-lantern-counter',{policy:'wait-test'});
  // A fixed transparent test policy explicitly waits; that is NOT a real
  // autonomous evasive decision, so the exact same field may never authorize a counter.
  runtime.state=structuredClone(s);
  runtime.state.world.threats[0].route=[guard,hero];
  runtime.step();
  assert.equal(runtime.events.some(e=>e.type==='guardian-lantern-parry'),false);
});
