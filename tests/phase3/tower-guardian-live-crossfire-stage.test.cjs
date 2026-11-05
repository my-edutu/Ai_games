'use strict';
// Engineering safety for real source-observed crossfire; NOT a quality vote.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const url=f=>pathToFileURL(path.join(root,f)).href;
const loaded=Promise.all([
 import(url('node_modules/three/build/three.module.js')),
 import(url('public/infinite-tower-climb/visuals/coordinates.mjs')),
 import(url('public/infinite-tower-climb/visuals/guardian-circuit.mjs')),
 import(url('public/infinite-tower-climb/visuals/guardian-shot-stage.mjs')),
]);
const frame=()=>({
 lifecycle:'running',runToken:'live-crossfire',floor:8,tick:340,
 worldWidth:480000,chunkBaseY:2880000,chunkHeight:360000,
 player:{x:200000,y:3218000,halfWidth:9000,halfHeight:14000,
   health:4,maxHealth:8,state:'airborne',attacking:false,vx:0,vy:0},
 intent:{mode:'air-control',targetPlatformId:'f8:cap'},
 platforms:[{id:'f8:cap',kind:'oneway',x:115000,y:3200000,
   width:130000,height:12000}],
 enemies:[{id:'f8:guardian',kind:'guardian',active:true,telegraph:false,
   x:150000,y:3218000,halfWidth:16000,halfHeight:18000,
   health:3,maxHealth:8,facing:1}],
 hazards:[],pickups:[],
 projectiles:[{id:'real-bolt',owner:'enemy',x:190000,y:3218000,
   vx:12000,vy:0}],
});
test('real in-flight bolt earns one existing 3D warning draw and immutable identical source',async t=>{
 const [THREE,,, {observedNearbyGuardianCrossfire,createTowerGuardianShotStage}]=await loaded;
 const stage=createTowerGuardianShotStage(THREE);t.after(()=>stage.dispose());
 const input=frame(),original=JSON.stringify(input);
 assert.equal(observedNearbyGuardianCrossfire(input).coincidentNotAttributed,true);
 stage.update(input,{quality:'low'});
 const d=stage.diagnostics(),mesh=stage.group.getObjectByName('ActualGuardianProjectileFacing');
 assert.equal(d.liveHostileBoltId,'real-bolt');
 assert.equal(d.liveHostileMarkerCount,4);
 assert.equal(d.markerCount,0,'do not fabricate telegraph after shot');
 assert.equal(mesh.count,4);
 assert.ok(stage.liveHostileFocusPoint());
 const matrix=Array.from(mesh.instanceMatrix.array.slice(0,64));
 stage.update(input,{quality:'low'});
 assert.deepEqual(Array.from(mesh.instanceMatrix.array.slice(0,64)),matrix);
 assert.equal(JSON.stringify(input),original);
 stage.update(input,{stale:true,quality:'low'});
 assert.equal(stage.diagnostics().liveHostileBoltId,null);
 assert.equal(mesh.count,0);
});
test('no phantom warning from passed, retreating, unrelated or dead source',async()=>{
 const [,,,{observedNearbyGuardianCrossfire}]=await loaded;
 const x=frame(),bolt=x.projectiles[0],guardian=x.enemies[0];
 for(const broken of [
  {...x,projectiles:[{...bolt,vx:-12000}]},
  {...x,projectiles:[{...bolt,x:240000}]},
  {...x,projectiles:[{...bolt,y:bolt.y+85000}]},
  {...x,projectiles:[{...bolt,owner:'player'}]},
  {...x,enemies:[{...guardian,health:0}]},
  {...x,enemies:[{...guardian,x:410000}]},
  {...x,lifecycle:'result'},
  {...x,stale:true},
 ])assert.equal(observedNearbyGuardianCrossfire(broken),null);
});
test('source-near physical airborne bolt keeps both combatants while landing stays real',async()=>{
 const [THREE,coordinates,circuit,{observedNearbyGuardianCrossfire}]=await loaded;
 const context={THREE,...coordinates,...circuit};
 const source=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8')
  .replace(/^import .*;\n/gm,'').replace('export function createTowerScene','function createTowerScene');
 vm.runInNewContext(source,context);
 const input=frame(),p=input.player;
 const hero=coordinates.pointFor(p.x,p.y-p.halfHeight,input.chunkBaseY,input.worldWidth);
 const live=observedNearbyGuardianCrossfire(input);
 const lens=coordinates.pointFor(live.x,live.y,live.baseY,live.worldWidth,27.82);
 const ordinary=context.composeFollowView({...input,projectiles:[]},hero,390/844);
 assert.equal(ordinary.guardianStaged,false);
 const shot=context.composeFollowView(input,hero,390/844,
  0,1,null,null,null,null,null,live.guardianId,lens);
 assert.equal(shot.guardianStaged,true);
 assert.equal(shot.targetId,'f8:cap');
 assert.ok(shot.clear&&shot.guardianFramed&&shot.heroFraction>=.14,
   'true guardian and climber must both fit without losing the committed landing');
});
