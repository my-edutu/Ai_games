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
 let paired=0,watchposts=0;
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
  if(indices.some(i=>[1,2,0].some(d=>i-d>0&&w.traps.some(t=>
    passageNeighbors(w,route[i-d]).includes(t)
    &&passageNeighbors(w,t).includes(route[i-d])))))paired++;
 }
 assert.ok(watchposts>0,'campaign exercises actual reachable moving watchposts');
 assert.ok(paired>0,'at least one actual seeded adventure has a connected pressure prelude');
});
