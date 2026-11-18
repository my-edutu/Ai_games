'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const load=p=>require(path.join(process.cwd(),'dist',p));
const {generateMaze}=load('games/ai-maze-escape/src/generation/topology.js');
const {solveMazeWithInventory}=load('games/ai-maze-escape/src/generation/content.js');
const {solveMaze,passageNeighbors}=load('games/ai-maze-escape/src/generation/solver.js');
const {NamedRng}=load('packages/seeded-rng/src/index.js');
const {parseMazeConfig}=load('games/ai-maze-escape/src/config/schema.js');
test('real generated pressure and guardian court preserve exact playable topology and key-gate solvability',()=>{
 const config=parseMazeConfig({width:17,height:15,profile:'loops',loopChancePermille:160,
    visibilityRadius:2,keyCount:1,trapCount:2,threatCount:1});
 let paired=0,watchposts=0,sharedStage=0;
 for(let n=0;n<24;n++){
  const seed='real-watchpost-pressure-'+n;
  const w=generateMaze(config,NamedRng.fromSeed(seed)).world;
  assert.deepEqual(w,generateMaze(config,NamedRng.fromSeed(seed)).world,'deterministic replay');
  assert.ok(solveMazeWithInventory(w),'critical door/key journey stays fully solvable');
  assert.equal(w.traps.length,2,'real trap budget unchanged');
  assert.equal(new Set(w.traps).size,w.traps.length,'pressure locations unique');
  const route=solveMaze(w,{start:w.start,goal:w.exit}),routeSet=new Set(route);
  for(const trap of w.traps)assert.equal(routeSet.has(trap),false,
    'the optional pressure mouth cannot silently block the mandatory route');
  const guardian=w.threats[0];
  if(!guardian||routeSet.has(guardian.route[0]))continue;
  assert.ok(guardian.route.every(c=>!w.traps.includes(c)),
    'real moving guardian never occupies a pressure collider');
  const indices=route.flatMap((c,i)=>passageNeighbors(w,c).includes(guardian.route[0])?[i]:[]);
  if(!indices.length)continue;
  watchposts++;
  if(indices.some(i=>w.traps.some(t=>passageNeighbors(w,route[i]).includes(t)
    &&passageNeighbors(w,t).includes(route[i]))))sharedStage++;
  if(indices.some(i=>[1,2,0].some(d=>i-d>0&&w.traps.some(t=>
    passageNeighbors(w,route[i-d]).includes(t)
    &&passageNeighbors(w,t).includes(route[i-d])))))paired++;
 }
 assert.ok(watchposts>0,'campaign exercises actual reachable moving watchposts');
 assert.ok(sharedStage>=1,'the actual guardian approach must share a lawful pressure-side court in seeded gameplay');
 assert.ok(paired>=4,'a substantial share of seeded adventures must now physically connect pressure before the same moving guardian');
 assert.ok(paired<=watchposts,'only truly reachable watchposts may count as linked encounter evidence');
});

test('authored objective relay requires real forward key pickup followed by its matching critical gate',()=>{
 const {forwardKeyGateDistance}=load('games/ai-maze-escape/src/generation/content.js');
 const route=[10,11,12,13,14,15,16,17,18,19];
 const world={keys:[{id:'key-1',cell:14,collected:false}],
  doors:[{id:'door-1',a:16,b:17,requiredKeyId:'key-1',critical:true,open:false}]};
 assert.equal(forwardKeyGateDistance(world,route,1),3,
  'the actual key must come after a real guardian route approach');
 assert.equal(forwardKeyGateDistance(world,route,4),Infinity,
  'a guardian AFTER the pickup is not a pressure-to-key chapter');
 const distant={keys:[{...world.keys[0],cell:18}],
  doors:[{...world.doors[0],a:18,b:19}]};
 assert.equal(forwardKeyGateDistance(distant,route,0),Infinity,
  'a key more than seven actual journey steps away is not the same chapter');
 assert.equal(forwardKeyGateDistance({...world,doors:[{...world.doors[0],a:30,b:31}]},route,1),Infinity,
  'an untraversed gate is not a claimed objective resolution');
 assert.equal(forwardKeyGateDistance({...world,doors:[{...world.doors[0],critical:false}]},route,1),Infinity,
  'a noncritical gate is not the required objective');
 assert.equal(forwardKeyGateDistance({...world,doors:[{...world.doors[0],requiredKeyId:'other'}]},route,1),Infinity,
  'an unrelated key and door must not be presented as a causal chapter');
});
