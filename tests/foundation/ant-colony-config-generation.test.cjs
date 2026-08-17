'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {parseAntColonyConfig,createInitialColony,assertAntColonyInvariants,stateChecksum}=require('../../dist/games/ai-ant-colony/src/index.js');

test('config applies bounded production defaults and rejects invalid worlds',()=>{
  const config=parseAntColonyConfig({width:48,height:30,targetPopulation:120});
  assert.equal(config.schemaVersion,1);
  assert.equal(config.surfaceRow,7);
  assert.equal(config.maxAnts,240);
  assert.throws(()=>parseAntColonyConfig({width:8,height:30,targetPopulation:120}),/width/);
  assert.throws(()=>parseAntColonyConfig({width:48,height:30,targetPopulation:500,maxAnts:200}),/targetPopulation/);
});

test('constructive generation is deterministic, connected and bounded',()=>{
  const config=parseAntColonyConfig({width:48,height:30,targetPopulation:120});
  const a=createInitialColony(config,'seed-foundation','run-a');
  const b=createInitialColony(config,'seed-foundation','run-a');
  const c=createInitialColony(config,'other-seed','run-c');
  assert.equal(stateChecksum(a),stateChecksum(b));
  assert.notEqual(stateChecksum(a),stateChecksum(c));
  assert.equal(a.world.tiles.length,config.width*config.height);
  assert.equal(a.world.food.length,a.world.tiles.length);
  assert.equal(a.world.pheromones.home.length,a.world.tiles.length);
  assert.equal(new Set(a.ants.map(x=>x.id)).size,a.ants.length);
  assert.doesNotThrow(()=>assertAntColonyInvariants(a));
  const entrance=a.world.entrance,nest=a.world.nestCenter,queue=[entrance],seen=new Set([entrance]);
  while(queue.length){const cell=queue.shift();if(cell===nest)break;const x=cell%config.width,y=Math.floor(cell/config.width);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=config.width||ny>=config.height)continue;const n=ny*config.width+nx;if(seen.has(n))continue;const tile=a.world.tiles[n];if(tile===1||tile===2||tile===3){seen.add(n);queue.push(n)}}}
  assert.equal(seen.has(nest),true);
});

test('surface movement is constrained to the ground row and invariants reject ants in air',()=>{
  const state=createInitialColony(parseAntColonyConfig({width:32,height:22,targetPopulation:40,initialWorkers:8}),'surface-boundary');
  const ant=state.ants[0];ant.x=state.world.entrance%state.config.width;ant.y=state.config.surfaceRow;ant.lastCell=state.world.entrance;ant.bias=0;state.world.food.fill(0);state.tick=0;
  const {chooseBasicAntAction}=require('../../dist/games/ai-ant-colony/src/index.js');const action=chooseBasicAntAction(state,ant);
  if(action.kind==='move'||action.kind==='dig')assert.ok(Math.floor(action.cell/state.config.width)>=state.config.surfaceRow);
  const invalid=structuredClone(state);invalid.ants[0].y=state.config.surfaceRow-1;assert.throws(()=>assertAntColonyInvariants(invalid),/ant-tile/);
});
