'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const{MazeRuntime}=require('../../dist/games/ai-maze-escape/src/runtime/run.js');const{createMazeObservation}=require('../../dist/games/ai-maze-escape/src/ai/observation.js');const{updateBelief}=require('../../dist/games/ai-maze-escape/src/ai/belief.js');const{chooseMazeAction}=require('../../dist/games/ai-maze-escape/src/ai/policy.js');const{solveMazeWithInventory}=require('../../dist/games/ai-maze-escape/src/generation/content.js');const{passageNeighbors}=require('../../dist/games/ai-maze-escape/src/generation/solver.js');function runToTerminal(runtime,limit=20000){let steps=0;while(runtime.state.lifecycle==='running'&&steps++<limit)runtime.step();return runtime.state.result}
test('observation contains only visible or remembered knowledge and never hidden exit truth',()=>{const runtime=MazeRuntime.create({width:19,height:15,profile:'loops',visibilityRadius:1,keyCount:1,trapCount:3,threatCount:1},'observation-boundary'),state=runtime.state;assert.notEqual(state.explorer.cell,state.world.exit);assert.equal(state.visibleCells.includes(state.world.exit),false);const observation=createMazeObservation(state);assert.equal(observation.exitCell,null);assert.equal(Object.hasOwn(observation,'world'),false);assert.equal(Object.hasOwn(observation,'oracleRoute'),false);assert.equal(observation.cells.every(cell=>state.discoveredCells.includes(cell.cell)),true);assert.equal(observation.keys.every(key=>state.visibleCells.includes(key.cell)||state.discoveredCells.includes(key.cell)),true);assert.equal(observation.threats.every(threat=>state.visibleCells.includes(threat.cell)),true);const publicText=JSON.stringify(observation);assert.equal(publicText.includes('shortestSolutionLength'),false);assert.equal(publicText.includes('passages'),false)});
test('belief update is bounded, ages memory, and derives frontiers from observed passages',()=>{const runtime=MazeRuntime.create({width:13,height:11,profile:'tree',visibilityRadius:1},'belief-update'),first=createMazeObservation(runtime.state),belief=updateBelief(undefined,first,{maxCells:40,memoryTtl:5});assert.ok(Object.keys(belief.cells).length>0);assert.ok(belief.frontiers.length>0);assert.ok(Object.keys(belief.cells).length<=40);const later=structuredClone(first);later.tick=20;later.cells=[];later.visibleCells=[];const aged=updateBelief(belief,later,{maxCells:40,memoryTtl:5});assert.equal(Object.values(aged.cells).every(cell=>cell.confidencePermille<=belief.cells[cell.cell]?.confidencePermille),true);assert.ok(Object.keys(aged.cells).length<=40)});
test('constructive key and door dependencies are solvable and a locked edge blocks traversal without its key',()=>{const runtime=MazeRuntime.create({width:17,height:13,profile:'loops',visibilityRadius:2,keyCount:2,trapCount:4},'dependency-chain'),{world}=runtime.state;assert.equal(world.keys.length,2);assert.equal(world.doors.length,2);assert.ok(solveMazeWithInventory(world));for(const door of world.doors){assert.ok(world.keys.find(item=>item.id===door.requiredKeyId));assert.equal(passageNeighbors(world,door.a).includes(door.b),true)}const firstDoor=world.doors[0],state=structuredClone(runtime.state);state.explorer.cell=firstDoor.a;state.explorer.inventory=[];const observation=createMazeObservation(state),decision=chooseMazeAction(state,observation,state.belief);assert.notEqual(decision.action.targetCell,firstDoor.b)});
test('partial-observation policy discovers, replans and escapes without remote services',()=>{for(const profile of ['tree','loops','chambers']){const runtime=MazeRuntime.create({width:13,height:11,profile,visibilityRadius:2,keyCount:1,trapCount:2,maxTicks:15000,noProgressTicks:3000},`partial-${profile}`),result=runToTerminal(runtime);assert.equal(result?.kind,'game',`${profile}: ${JSON.stringify(result)}`);assert.equal(result?.reason,'escape',`${profile}: ${JSON.stringify(result)}`);assert.ok(runtime.state.discoveredCells.length<runtime.config.width*runtime.config.height||runtime.state.explorer.steps>=runtime.state.features.shortestSolutionLength);assert.ok(runtime.state.ai.decisions>0);assert.equal(runtime.state.ai.explanation.includes('oracle'),false)}});
test('visible threats and traps trigger causal evasion rather than illegal or suicidal movement',()=>{const runtime=MazeRuntime.create({width:11,height:11,profile:'hunter',visibilityRadius:3,threatCount:1,trapCount:2,maxTicks:5000},'threat-evasion'),state=structuredClone(runtime.state),neighbor=passageNeighbors(state.world,state.explorer.cell)[0];assert.notEqual(neighbor,undefined);state.world.threats=[{id:'threat-test',cell:neighbor,route:[neighbor,state.explorer.cell],routeIndex:0,direction:1,lastSeenTick:null,active:true}];state.visibleCells=[...new Set([...state.visibleCells,neighbor])];const observation=createMazeObservation(state),decision=chooseMazeAction(state,observation,state.belief);assert.equal(decision.intent.mode,'evading-threat');assert.notEqual(decision.action.targetCell,neighbor);assert.equal(passageNeighbors(state.world,state.explorer.cell).includes(decision.action.targetCell),true)});

test('Pip pauses one real tick only at a newly entered, visible and safely escapable pressure court',()=>{
  const runtime=MazeRuntime.create({width:13,height:11,profile:'loops',visibilityRadius:2,keyCount:0,trapCount:0,threatCount:0},'public-pressure-inspection');
  const state=structuredClone(runtime.state);
  const current=Array.from({length:state.world.width*state.world.height},(_,i)=>i)
    .find(cell=>cell!==state.world.exit&&!state.world.blockedCells.includes(cell)
      &&passageNeighbors(state.world,cell).filter(next=>next!==state.world.exit).length>=2);
  assert.notEqual(current,undefined,'the test needs a real branched published passage');
  const neighbors=passageNeighbors(state.world,current).filter(cell=>cell!==state.world.exit);
  const trap=neighbors[0],safe=neighbors[1];
  state.explorer.cell=current;state.explorer.route=[current];
  state.world.traps=[trap];state.world.keys=[];state.world.doors=[];state.world.threats=[];
  state.visibleCells=[current,trap,safe];state.discoveredCells=[...state.visibleCells];
  const observed=createMazeObservation(state);
  const firstBelief=updateBelief(undefined,observed);
  const first=chooseMazeAction(state,observed,firstBelief);
  assert.equal(first.action.kind,'wait','a truly visible pressure court earns one real inspection tick');
  assert.equal(first.intent.mode,'inspecting-hazard','the public wait needs a distinct, truthful 3D presentation contract');
  assert.equal(first.targetCell,null,'inspection never orders Pip INTO the trap');
  assert.deepEqual(first.plannedPath,[current]);
  assert.ok(first.intent.explanation.includes('pressure jaw'));
  // Two subsequent normal public observation updates advance the bounded
  // visit counter, so an idle animation cannot become an infinite wait loop.
  const second=updateBelief(firstBelief,{...observed,tick:observed.tick+1});
  const third=updateBelief(second,{...observed,tick:observed.tick+1});
  const resumed=chooseMazeAction(state,{...observed,tick:observed.tick+1},third);
  assert.notEqual(resumed.intent.explanation,first.intent.explanation);
  assert.notEqual(resumed.intent.mode,'inspecting-hazard','the same visible tile cannot generate a second waiting beat');
  assert.notEqual(resumed.action.targetCell,trap,'known dangerous cell remains avoided');
  const hidden={...observed,visibleCells:[current,safe],cells:observed.cells.map(cell=>({
    ...cell,visible:cell.cell!==trap,
  }))};
  const hiddenBelief=updateBelief(undefined,hidden);
  const unseen=chooseMazeAction(state,hidden,hiddenBelief);
  assert.notEqual(unseen.intent.explanation,first.intent.explanation,
    'remembered-only traps must never prompt an anticipatory action');
  const sealed={...observed,doors:[{id:'sealed',a:current,b:trap,requiredKeyId:'never-seen',open:false}]};
  const sealedBelief=updateBelief(undefined,sealed);
  const behindDoor=chooseMazeAction(state,sealed,sealedBelief);
  assert.notEqual(behindDoor.intent.explanation,first.intent.explanation,
    'sealed inaccessible mechanisms cannot receive an inspection tick');
});

test('visible reciprocal diagonal pressure route earns a real inspect tick but hidden/closed corners cannot',()=>{
  const runtime=MazeRuntime.create({width:17,height:13,profile:'loops',visibilityRadius:2,
    keyCount:0,trapCount:0,threatCount:0},'diagonal-pressure-survey');
  const state=structuredClone(runtime.state),width=state.world.width;
  let triple=null;
  for(let a=0;a<width*state.world.height&&!triple;a++){
    if(a===state.world.exit||state.world.blockedCells.includes(a))continue;
    for(const mid of passageNeighbors(state.world,a)){
      for(const trap of passageNeighbors(state.world,mid)){
        if(trap===state.world.exit||trap===a||state.world.blockedCells.includes(trap))continue;
        if(Math.abs(a%width-trap%width)===1
          &&Math.abs(Math.floor(a/width)-Math.floor(trap/width))===1){
          triple={a,mid,trap};break;
        }
      }
      if(triple)break;
    }
  }
  assert.ok(triple,'authored maze needs an actual two-link right-angle passage');
  const {a,mid,trap}=triple;
  state.explorer.cell=a;state.explorer.route=[a];
  state.world.traps=[trap];state.world.keys=[];state.world.doors=[];state.world.threats=[];
  state.visibleCells=[a,mid,trap];state.discoveredCells=[...state.visibleCells];
  const seen=createMazeObservation(state),belief=updateBelief(undefined,seen);
  const decision=chooseMazeAction(state,seen,belief);
  assert.equal(decision.intent.mode,'inspecting-hazard');
  assert.equal(decision.action.kind,'wait');
  assert.equal(decision.targetCell,null,'never route Pip onto the pressure plate');
  const hidden={...seen,visibleCells:[a,mid],cells:seen.cells.map(c=>({...c,visible:c.cell!==trap}))};
  assert.notEqual(chooseMazeAction(state,hidden,updateBelief(undefined,hidden)).intent.mode,'inspecting-hazard',
    'hidden/remembered pressure cannot prompt a survey');
  const sealed={...seen,doors:[{id:'closed',a:mid,b:trap,requiredKeyId:'unseen',open:false}]};
  assert.notEqual(chooseMazeAction(state,sealed,updateBelief(undefined,sealed)).intent.mode,'inspecting-hazard',
    'a sealed bend is not a public walkable corridor');
  const disconnected={...seen,cells:seen.cells.map(c=>c.cell===mid
    ? {...c,neighbors:c.neighbors.filter(n=>n!==trap)} : c)};
  assert.notEqual(chooseMazeAction(state,disconnected,updateBelief(undefined,disconnected)).intent.mode,'inspecting-hazard',
    'a corner without reciprocal public links cannot reveal a route');
  const revisited=structuredClone(belief);revisited.cells[String(a)].visits=4;
  assert.notEqual(chooseMazeAction(state,seen,revisited).intent.mode,'inspecting-hazard',
    'bounded visit memory prevents replaying the theatrical pause');
});
