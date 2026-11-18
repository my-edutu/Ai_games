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

test('fixed production reference seeds retain a genuine PUBLIC reciprocal Pip-Thornback corridor',async()=>{
 const {scenarios}=require('../../scripts/capture-maze-3d.cjs');
 const {publicGuardianOpenSightline}=await import('../../public/ai-maze-escape/public-lantern-encounter.mjs');
 // Same seeded real runtime snapshots used by the native WebGL browser test:
 // no forced guardian position, no invented observation, no private route.
 const {sequences}=scenarios();
 const witness=sequences.flat().find(({frame})=>{
  const snapshot=frame.snapshot;
  return snapshot.lifecycle==='running'&&!snapshot.result
   &&snapshot.threats.some(threat=>publicGuardianOpenSightline(snapshot,threat.cell)>0);
 });
 assert.ok(witness,
  'real production seeds must preserve an authentic discovered open one/two-cell guardian approach');
 assert.ok(witness.frame.snapshot.threats.some(threat=>
  publicGuardianOpenSightline(witness.frame.snapshot,threat.cell)>0));
});
test('the same real guardian can lead to a matching REQUIRED forward key and physical gate',()=>{
 const {forwardGuardianKeyCell}=load('games/ai-maze-escape/src/generation/content.js');
 const route=[10,11,12,13,14,15,16,17,18,19,20];
 const world={start:10,exit:20,keys:[{id:'key-1',cell:11,collected:false}],
  doors:[{id:'door-1',a:17,b:18,requiredKeyId:'key-1',critical:true,open:false}],
  traps:[],clues:[],checkpoints:[],blockedCells:[]};
 assert.deepEqual(forwardGuardianKeyCell(world,route,3),{keyId:'key-1',cell:15});
 assert.equal(forwardGuardianKeyCell({...world,keys:[{...world.keys[0],cell:16}]},route,3),null,
   'do not shift a key that is already forward of the guardian');
 assert.equal(forwardGuardianKeyCell({...world,doors:[{...world.doors[0],requiredKeyId:'other'}]},route,3),null);
 assert.equal(forwardGuardianKeyCell({...world,doors:[{...world.doors[0],critical:false}]},route,3),null);
 assert.deepEqual(forwardGuardianKeyCell({...world,checkpoints:[15]},route,3),{keyId:'key-1',cell:16},
   'protect real checkpoints');
 assert.equal(forwardGuardianKeyCell({...world,clues:[15,16]},route,3),null,
   'never overwrite real clue objects');
});
test('24 authentic worlds can create pressure, straight guardian, then key and exact gate',()=>{
 const config=parseMazeConfig({width:17,height:15,profile:'loops',loopChancePermille:160,
  visibilityRadius:2,keyCount:1,trapCount:2,threatCount:1});
 let chapters=0;
 for(let n=0;n<24;n++){
   const w=generateMaze(config,NamedRng.fromSeed('real-watchpost-pressure-'+n)).world;
   const route=solveMaze(w,{start:w.start,goal:w.exit}),routeSet=new Set(route);
   assert.ok(solveMazeWithInventory(w),'critical route remains playable');
   const actor=w.threats[0];if(!actor)continue;
   for(let i=2;i<route.length-4;i++){
     const entry=route[i],side=actor.route[0],retreat=actor.route[1];
     if(!passageNeighbors(w,entry).includes(side)||routeSet.has(side)||routeSet.has(retreat))continue;
     const er=Math.floor(entry/w.width),ec=entry%w.width,sr=Math.floor(side/w.width),
       sc=side%w.width,rr=Math.floor(retreat/w.width),rc=retreat%w.width;
     if(rr-sr!==sr-er||rc-sc!==sc-ec)continue;
     const pressure=[0,1,2].some(back=>w.traps.some(trap=>
       passageNeighbors(w,route[i-back]).includes(trap)
       &&passageNeighbors(w,trap).includes(route[i-back])));
     if(!pressure)continue;
     const relay=w.keys.some(key=>{
       const pickup=route.indexOf(key.cell);
       return pickup>i+1&&pickup<=i+6&&w.doors.some(door=>
         door.critical&&door.requiredKeyId===key.id
         &&route.some((cell,j)=>j>pickup+1
           &&((route[j-1]===door.a&&cell===door.b)||(route[j-1]===door.b&&cell===door.a))));
     });
     if(relay){chapters++;break}
   }
 }
 assert.ok(chapters>=1,'seeded world must include at least one real connected chapter');
});


test('authentic reciprocal post-Thornback side alcove makes a consequential key detour without inventing a passage',()=>{
 const {forwardGuardianKeyCell,solveMazeWithInventory}=load('games/ai-maze-escape/src/generation/content.js');
 const {passageNeighbors}=load('games/ai-maze-escape/src/generation/solver.js');
 const route=Array.from({length:11},(_,i)=>i),passages=Array(22).fill(0);
 for(let i=0;i<10;i++){passages[i]|=2;passages[i+1]|=8;}
 passages[5]|=4; passages[16]|=1; // REAL reciprocal route cell 5 -> dead-end alcove 16
 const world={schemaVersion:1,width:11,height:2,passages,start:0,exit:10,
   keys:[{id:'key-1',cell:1,collected:false}],
   doors:[{id:'door-1',a:8,b:9,requiredKeyId:'key-1',critical:true,open:false,temporaryUntilTick:null}],
   traps:[],clues:[],checkpoints:[],threats:[],blockedCells:[],profile:'tree'};
 assert.deepEqual(passageNeighbors(world,5).includes(16),true);
 assert.deepEqual(passageNeighbors(world,16),[5]);
 const chosen=forwardGuardianKeyCell(world,route,3,new Set([17]));
 assert.deepEqual(chosen,{keyId:'key-1',cell:16},
   'the actual optional dead-end chamber, not the main route, holds the forward key');
 const shifted=structuredClone(world);
 shifted.keys[0].cell=chosen.cell;
 const playable=solveMazeWithInventory(shifted);
 assert.ok(playable,'Pip can physically collect the side-room key and open its true gate');
 assert.ok(playable.cells.includes(16));
 assert.ok(playable.keyOrder.indexOf('key-1')>=0 && playable.doorOrder.indexOf('door-1')>=0);
 assert.equal(forwardGuardianKeyCell({...world,blockedCells:[16]},route,3).cell,5,
   'do not send an objective to a blocked alcove');
 assert.equal(forwardGuardianKeyCell(world,route,3,new Set([16])).cell,5,
   'never overlap the real guardian patrol');
 const oneWay=structuredClone(world);oneWay.passages[16]=0;
 assert.equal(forwardGuardianKeyCell(oneWay,route,3).cell,5,
   'never treat one-way/non-reciprocal map knowledge as a chamber');
 const gated=structuredClone(world);
 gated.doors.push({id:'side-door',a:5,b:16,requiredKeyId:'uncollected',critical:false,open:false,temporaryUntilTick:null});
 const lockedFallback=forwardGuardianKeyCell(gated,route,3);
 assert.deepEqual(lockedFallback,{keyId:'key-1',cell:6},
   'the locked alcove is forbidden; cell 5 is now a real doorway endpoint, so use the next safe route tile');
 assert.ok(!gated.doors.some(door=>door.a===lockedFallback.cell||door.b===lockedFallback.cell),
   'the main-route fallback must never place a required key on a physical doorway endpoint');
 assert.notEqual(lockedFallback.cell,16,'the required key must never spawn beyond its locked side door');
});

test('authentic two-passage post-guardian key chamber demands a real return trip before its critical gate',()=>{
 const {forwardGuardianKeyCell,solveMazeWithInventory}=load('games/ai-maze-escape/src/generation/content.js');
 const {passageNeighbors}=load('games/ai-maze-escape/src/generation/solver.js');
 const route=Array.from({length:11},(_,i)=>i),passages=Array(33).fill(0);
 for(let i=0;i<10;i++){passages[i]|=2;passages[i+1]|=8;}
 // True reciprocal passage 5 <-> 16 <-> 27; 27 is a physical dead end.
 passages[5]|=4;passages[16]|=1|4;passages[27]|=1;
 const world={schemaVersion:1,width:11,height:3,passages,start:0,exit:10,
   keys:[{id:'key-1',cell:1,collected:false}],
   doors:[{id:'door-1',a:8,b:9,requiredKeyId:'key-1',critical:true,open:false,temporaryUntilTick:null}],
   traps:[],clues:[],checkpoints:[],threats:[],blockedCells:[],profile:'tree'};
 assert.deepEqual(passageNeighbors(world,16).sort((a,b)=>a-b),[5,27]);
 assert.deepEqual(passageNeighbors(world,27),[16]);
 assert.deepEqual(forwardGuardianKeyCell(world,route,3),{keyId:'key-1',cell:27});
 const shifted=structuredClone(world);shifted.keys[0].cell=27;
 const journey=solveMazeWithInventory(shifted);
 assert.ok(journey,'Pip must reach the key and return before the matching locked gate');
 assert.ok(journey.cells.includes(27));
 assert.ok(journey.cells.filter(cell=>cell===16).length>=2,'enter and leave the same physical gallery');
 assert.ok(journey.keyOrder.includes('key-1')&&journey.doorOrder.includes('door-1'));
 assert.equal(forwardGuardianKeyCell({...world,blockedCells:[27]},route,3).cell,5,
   'blocked treasure shrine cannot hold required key');
 assert.equal(forwardGuardianKeyCell(world,route,3,new Set([16,27])).cell,5,
   'guardian occupied gallery cannot hold required key');
 assert.equal(forwardGuardianKeyCell({...world,traps:[16]},route,3).cell,5,
   'actual pressure jaws cannot become a key hallway');
 const locked=structuredClone(world);
 locked.doors.push({id:'side-door',a:16,b:27,requiredKeyId:'other',critical:false,open:false,temporaryUntilTick:null});
 assert.equal(forwardGuardianKeyCell(locked,route,3).cell,5,
   'closed secondary door forbids unreachable objective');
 const oneWay=structuredClone(world);oneWay.passages[27]=0;
 assert.equal(forwardGuardianKeyCell(oneWay,route,3).cell,5,
   'nonreciprocal passage cannot be used as safe shrine');
});
