'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.join(__dirname,'../../public/ai-maze-escape/guardian-duel-camera.mjs')).href);
const camera=()=>({x:15,y:31,z:18});
const projected=(o,h,g)=>Math.abs((h.x-g.x)*o.z-(h.z-g.z)*o.x)/Math.hypot(o.x,o.z);
test('Pass518 actual public two-cell Pip/Thornback portrait earns consequential physical face-quarter',async()=>{
 const {setPublicEarnedGuardianFrontQuarterOffset:stage}=await load();
 const hero={x:-14.4,z:-9.6},guardian={x:-9.6,z:-9.6};
 for(const aspect of [320/740,390/844]){
   const o=camera(),before=projected(o,hero,guardian),r=Math.hypot(o.x,o.z);
   assert.equal(stage(o,aspect,hero,guardian,true,false),true);
   assert.ok(projected(o,hero,guardian)<before*.70,
     'must substantially compress the two genuine opposing full-body projections');
   const dx=hero.x-guardian.x,dz=hero.z-guardian.z;
   assert.ok((dx*o.x+dz*o.z)/(r*Math.hypot(dx,dz))>.84,
     'must face Thornback from a real 30-degree quarter, not a rear view');
   assert.ok(Math.abs(Math.hypot(o.x,o.z)-r)<1e-10);
   assert.equal(o.y,31,'do not pass through physical ground to fake visibility');
   const again=camera();stage(again,aspect,hero,guardian,true,false);
   assert.deepEqual(o,again);
 }
});
test('Pass518 no invented parry shot for unearned, reduced, landscape, desktop or invalid witnesses',async()=>{
 const {setPublicEarnedGuardianFrontQuarterOffset:stage}=await load();
 const hero={x:-14.4,z:-9.6},g={x:-9.6,z:-9.6};
 for(const [aspect,h,guardian,earned,reduced] of [
 [390/844,hero,g,false,false],[390/844,hero,g,true,true],
 [844/390,hero,g,true,false],[1280/900,hero,g,true,false],
 [320/740,{x:-9.25,z:-9.6},g,true,false],
 [390/844,{x:NaN,z:-9.6},g,true,false],[390/844,hero,null,true,false]
 ]){const o=camera();assert.equal(stage(o,aspect,h,guardian,earned,reduced),false);assert.deepEqual(o,camera());}
});
