'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {MazeRuntime}=require('../../dist/games/ai-maze-escape/src/runtime/run.js');
const {stepMazeThreats}=require('../../dist/games/ai-maze-escape/src/threats/step.js');
const {passageNeighbors}=require('../../dist/games/ai-maze-escape/src/generation/solver.js');
const {buildMazeRenderSnapshot}=require('../../dist/games/ai-maze-escape/src/presentation/snapshot.js');
const {createMazeObservation}=require('../../dist/games/ai-maze-escape/src/ai/observation.js');
const {updateBelief}=require('../../dist/games/ai-maze-escape/src/ai/belief.js');
const {chooseMazeAction}=require('../../dist/games/ai-maze-escape/src/ai/policy.js');

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

test('earned lantern counter clears a REAL visible route square, then dangerous patrol resumes',()=>{
  const {s}=fixture(), width=s.world.width;
  const blocked=new Set(s.world.blockedCells);
  let triple;
  for(let hero=0;hero<width*s.world.height&&!triple;hero++){
    if(blocked.has(hero)||hero===s.world.exit)continue;
    for(const guard of passageNeighbors(s.world,hero)){
      if(blocked.has(guard)||guard===s.world.exit)continue;
      for(const rear of passageNeighbors(s.world,guard)){
        if(rear===hero||blocked.has(rear)||rear===s.world.exit)continue;
        const distance=Math.abs(rear%width-hero%width)
          +Math.abs(Math.floor(rear/width)-Math.floor(hero/width));
        if(distance>1){triple={hero,guard,rear};break;}
      }
      if(triple)break;
    }
  }
  assert.ok(triple,'the seeded actual physical maze needs an open three-cell retreat route');
  const {hero,guard,rear}=triple;
  s.world.threats=[{id:'real-thornback',cell:guard,route:[hero,guard,rear],
    routeIndex:1,direction:-1,lastSeenTick:null,active:true}];
  s.explorer.cell=hero;
  s.visibleCells=[hero,guard,rear];
  s.discoveredCells=[hero,guard,rear];
  const counter=stepMazeThreats(s,{lanternCounter:true});
  assert.equal(counter.state.world.threats[0].cell,rear,
    'the actual guardian must physically leave its occupied cell');
  assert.equal(counter.state.world.threats[0].routeIndex,2);
  assert.equal(counter.state.world.threats[0].pausedUntilTick,5);
  assert.equal(counter.captured,false);
  assert.deepEqual(counter.events.filter(e=>e.type==='guardian-lantern-parry').map(e=>e.data),
    [{id:'real-thornback',cell:rear}]);
  assert.deepEqual(counter.events.filter(e=>e.type==='threat-move').map(e=>e.data),
    [{id:'real-thornback',cell:rear}]);
  assert.deepEqual(buildMazeRenderSnapshot(counter.state).threats,
    [{id:'real-thornback',cell:rear,lanternParried:true}]);
  const next=structuredClone(counter.state);next.tick=3;
  assert.equal(stepMazeThreats(next,{lanternCounter:true}).events
    .some(e=>e.type==='guardian-lantern-parry'),false,'counter is once per run');
  const resumed=structuredClone(counter.state);resumed.tick=6;
  const moved=stepMazeThreats(resumed,{lanternCounter:true});
  assert.equal(moved.state.world.threats[0].cell,guard,
    'the same genuine patrol resumes after its earned interruption');
  const again=structuredClone(moved.state);again.tick=8;
  const lethal=stepMazeThreats(again,{lanternCounter:true});
  assert.equal(lethal.captured,true,'standing still remains dangerous after recovery');
  assert.equal(lethal.state.world.threats[0].cell,hero);
  // Public-state privacy: an undisclosed retreat square may never be inferred
  // from an oracle-only patrol route or rendered as a guardian disappearance.
  const unseen=structuredClone(s);unseen.visibleCells=[hero,guard];
  const held=stepMazeThreats(unseen,{lanternCounter:true});
  assert.equal(held.state.world.threats[0].cell,guard);
  assert.equal(held.events.some(e=>e.type==='threat-move'),false);
  assert.equal(held.events.some(e=>e.type==='guardian-lantern-parry'),true);
  assert.deepEqual(buildMazeRenderSnapshot(held.state).threats,
    [{id:'real-thornback',cell:guard,lanternParried:true}]);
});

test('real autonomous first-contact lantern defense causes an earned visible one-square recoil, not a scripted action',()=>{
  const {s}=fixture(),width=s.world.width,blocked=new Set(s.world.blockedCells);
  let passage;
  for(let hero=0;hero<width*s.world.height&&!passage;hero++){
    if(blocked.has(hero)||hero===s.world.exit)continue;
    for(const guard of passageNeighbors(s.world,hero)){
      if(blocked.has(guard)||guard===s.world.exit)continue;
      for(const rear of passageNeighbors(s.world,guard)){
        if(rear===hero||blocked.has(rear)||rear===s.world.exit)continue;
        if(Math.abs(rear%width-hero%width)
          +Math.abs(Math.floor(rear/width)-Math.floor(hero/width))===2){
          passage={hero,guard,rear};break;
        }
      }
      if(passage)break;
    }
  }
  assert.ok(passage,'the seeded, truly connected game world needs a public recoil route');
  const {hero,guard,rear}=passage;
  s.explorer.cell=hero;s.explorer.steps=3;s.explorer.route=[hero];
  s.world.threats=[{id:'observed-thornback',cell:guard,route:[hero,guard,rear],
    routeIndex:1,direction:-1,lastSeenTick:null,active:true}];
  s.visibleCells=[hero,guard,rear];s.discoveredCells=[hero,guard,rear];
  s.ai.mode='exploring';s.ai.recentCells=[hero];
  const runtime=MazeRuntime.create({width:11,height:11,profile:'loops',visibilityRadius:2,
    keyCount:0,trapCount:0,threatCount:0},'real-lantern-counter');
  runtime.state=structuredClone(s);
  const priorEvents=runtime.events.length;
  runtime.step(); // Actual partial-observation policy, then actual threat physics.
  assert.equal(runtime.state.explorer.cell,hero,'Pip must actually WAIT, not fake a dash');
  assert.equal(runtime.state.world.threats[0].cell,rear,'Thornback must backstep on the real passage');
  assert.equal(runtime.state.ai.mode,'evading-threat');
  assert.equal(runtime.events.slice(priorEvents).some(e=>e.type==='wait'),true);
  assert.equal(runtime.events.slice(priorEvents).filter(e=>e.type==='guardian-lantern-parry').length,1);
  assert.equal(runtime.events.slice(priorEvents).filter(e=>e.type==='threat-move').length,1);
  const publicVisible=createMazeObservation(runtime.state);
  assert.deepEqual(publicVisible.threats.map(t=>({id:t.id,cell:t.cell,countered:t.lanternCountered})),
    [{id:'observed-thornback',cell:rear,countered:true}]);
  const previouslyCountered=chooseMazeAction(runtime.state,publicVisible,updateBelief(undefined,publicVisible));
  assert.doesNotMatch(previouslyCountered.intent.explanation,/braces the lantern/,
    'the observed first defense must not repeat indefinitely');
  const unseen=structuredClone(runtime.state);
  unseen.visibleCells=[hero];unseen.world.threats[0].cell=rear;
  assert.deepEqual(createMazeObservation(unseen).threats,[],
    'even a previously parried guardian stays fully hidden when not currently visible');
  const before=runtime.events.filter(e=>e.type==='guardian-lantern-parry').length;
  runtime.step();
  assert.equal(runtime.events.filter(e=>e.type==='guardian-lantern-parry').length,before,
    'later turns must not synthesize a second counter');
});
