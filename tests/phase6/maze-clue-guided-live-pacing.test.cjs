'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {MazeRuntime}=require('../../dist/games/ai-maze-escape/src/runtime/run.js');
const {createMazeObservation}=require('../../dist/games/ai-maze-escape/src/ai/observation.js');
const {updateBelief}=require('../../dist/games/ai-maze-escape/src/ai/belief.js');
const {chooseMazeAction}=require('../../dist/games/ai-maze-escape/src/ai/policy.js');
const {passageNeighbors}=require('../../dist/games/ai-maze-escape/src/generation/solver.js');
const {applyMazeAction}=require('../../dist/games/ai-maze-escape/src/rules/step.js');

function publishedClueWorld(){
  const runtime=MazeRuntime.create({width:11,height:11,profile:'loops',
    visibilityRadius:2,keyCount:0,trapCount:0,threatCount:0},'tideglass-clue-public-path');
  const state=structuredClone(runtime.state);
  const pair=Array.from({length:state.world.width*state.world.height},(_,cell)=>cell)
    .filter(cell=>cell!==state.world.exit&&!state.world.blockedCells.includes(cell))
    .flatMap(cell=>passageNeighbors(state.world,cell).map(next=>[cell,next]))
    .find(([cell,next])=>next!==state.world.exit
      && !state.world.blockedCells.includes(next));
  assert.ok(pair,'needs one actual reciprocal passage away from the exit');
  const [current,clue]=pair;
  state.explorer.cell=current;
  state.explorer.route=[current];
  state.world.clues=[clue];
  state.world.keys=[];
  state.world.doors=[];
  state.world.threats=[];
  state.world.traps=[];
  state.visibleCells=[current,clue];
  state.discoveredCells=[current,clue];
  const observation=createMazeObservation(state);
  const belief=updateBelief(undefined,observation);
  return {runtime,state,current,clue,observation,belief};
}

test('Pip follows an actually disclosed unvisited Tideglass inscription via a legal real passage',()=>{
  const {runtime,state,current,clue,observation,belief}=publishedClueWorld();
  const decision=chooseMazeAction(state,observation,belief);
  assert.equal(decision.intent.mode,'following-clue');
  assert.deepEqual(decision.plannedPath,[current,clue]);
  assert.deepEqual(decision.action,{kind:'move',targetCell:clue});
  assert.match(decision.intent.explanation,/Tideglass inscription/);
  assert.deepEqual(chooseMazeAction(state,observation,belief),decision,'replay picks the identical known move');
  const actual=applyMazeAction(state,decision.action,runtime.rng);
  assert.equal(actual.accepted,true);
  assert.ok(actual.events.some(e=>e.type==='clue-discovered'&&e.data?.cell===clue),
    'the visible destination must produce the real engine clue-discovered event');
  const afterObservation=createMazeObservation({...actual.state,
    visibleCells:[current,clue],discoveredCells:[current,clue]});
  const afterBelief=updateBelief(belief,afterObservation);
  assert.notEqual(chooseMazeAction(actual.state,afterObservation,afterBelief).intent.mode,'following-clue',
    'Pip must not repeatedly detour to a clue it has already physically visited');
});

test('hidden or sealed inscriptions cannot direct Pip through a wall or private map',()=>{
  const {state,current,clue,observation}=publishedClueWorld();
  const hidden={...state,visibleCells:[current],discoveredCells:[current]};
  const hiddenObs=createMazeObservation(hidden);
  assert.equal(hiddenObs.cells.some(c=>c.cell===clue&&c.clue),false);
  assert.notEqual(chooseMazeAction(hidden,hiddenObs,updateBelief(undefined,hiddenObs)).intent.mode,
    'following-clue','unseen clue coordinates cannot influence a decision');
  const locked={...state,world:{...state.world,
    doors:[{id:'sealed',a:current,b:clue,requiredKeyId:'unknown-key',
      critical:false,open:false,temporaryUntilTick:null}]}};
  const lockedObs=createMazeObservation(locked);
  assert.notEqual(chooseMazeAction(locked,lockedObs,updateBelief(undefined,lockedObs)).intent.mode,
    'following-clue','a visible but sealed clue route is not a legal objective');
  const visited=updateBelief(undefined,observation);
  visited.cells[String(clue)].visits=2;
  assert.notEqual(chooseMazeAction(state,observation,visited).intent.mode,'following-clue',
    'previously visited inscriptions cannot endlessly override frontier exploration');
});
