'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals');
const load=(name)=>import(pathToFileURL(path.join(base,name)).href);
const cap=Object.freeze({id:'f8:cap',x:115200,y:3188000,width:249600,height:12000});
const width=480000,exit=cap.x+Math.floor(cap.width*.76);

test('actual F8 guardian cap prepaints two ORIGINAL massive flanks before HP-zero and retains one 3D owner onto real F9 roof',async()=>{
  const {prebuildOriginalGuardianCanopyPlan}=await load('source-physical-receiving-roof.mjs');
  const {planOriginalGuardianOutboardCranes}=await load('source-original-guardian-crane-room.mjs');
  const plan=prebuildOriginalGuardianCanopyPlan(cap,width,exit);
  assert.ok(plan?.structuralPreviewOnly && plan.sourceBound && plan.nonColliding);
  const before=JSON.stringify(plan);
  const room=planOriginalGuardianOutboardCranes(plan);
  assert.ok(room?.sourceBound && room.previewOnly && room.nonColliding);
  assert.equal(room.oldCapId,'f8:cap');
  assert.equal(room.receivingPlatformId,'f9:ground');
  assert.equal(room.thresholdX,exit);
  assert.equal(room.beams.length,8,'two four-part genuine F8-prepainted outer frames, no later duplicate');
  const roles=room.beams.reduce((counts,beam)=>{
    counts[beam.role]=(counts[beam.role]??0)+1;return counts;
  },{});
  assert.deepEqual(roles,{'under-roof-knee':2,'outboard-pier':2,
    'upper-return':2,'crown-tie':2});
  const piers=room.beams.filter(beam=>beam.role==='outboard-pier');
  assert.equal(piers.length,2);
  assert.ok(piers[0].from[0]<piers[1].from[0]);
  assert.ok(piers.every(beam=>beam.from[1]>30 &&
    beam.to[1]===beam.from[1] &&
    beam.from[2]<0 && beam.to[2]>14),
    'authored original silhouette survives from BELOW the true roof to 15.6m above');
  // Support knees must cross the playable radial band only BELOW its
  // walkable top; large outer piers must sit OUTSIDE the r27.18 platform.
  for(const knee of room.beams.filter(b=>b.role==='under-roof-knee')){
    const [a,r,y]=knee.from,[aa,rr,yy]=knee.to;
    assert.equal(a,aa);
    for(const radius of [22.4,25,27.18]){
      const t=(radius-r)/(rr-r),roofRelative=y+t*(yy-y);
      assert.ok(t>0&&t<1&&roofRelative<0,
        'new supports cannot put decorative steel through the real hero boots');
    }
  }
  assert.ok(room.beams.filter(b=>b.role==='crown-tie')
    .every(b=>b.from[2]>14 && b.to[2]>18),
    'continuous overhead frame must not close the actual HP-open gate');
  assert.equal(JSON.stringify(plan),before,'planning cannot mutate physical source cap');
});

test('no fabricated doorway, altered cap, future scene or unsafe geometry may prepaint the original carried room',async()=>{
  const {prebuildOriginalGuardianCanopyPlan}=await load('source-physical-receiving-roof.mjs');
  const {planOriginalGuardianOutboardCranes:f}=await load('source-original-guardian-crane-room.mjs');
  const plan=prebuildOriginalGuardianCanopyPlan(cap,width,exit);
  assert.ok(plan);
  for(const invalid of [
    {...plan,structuralPreviewOnly:false},
    {...plan,sourceBound:false},
    {...plan,nonColliding:false},
    {...plan,oldCapId:'f9:ground'},
    {...plan,receivingPlatformId:'f10:ground'},
    {...plan,thresholdX:NaN},
    {...plan,stations:plan.stations.slice(1)},
    {...plan,stations:[...plan.stations].reverse()},
    {...plan,outerCrownRadius:28},
    {...plan,innerPierRadius:25},
    {...plan,thresholdX:plan.stations[5].sourceX+1},
  ]) assert.equal(f(invalid),null);
  assert.equal(prebuildOriginalGuardianCanopyPlan(
    {...cap,id:'f9:ground'},width,exit),null);
  assert.equal(prebuildOriginalGuardianCanopyPlan(
    {...cap,width:cap.width+10},width,exit),null);
});

test('game builds the big original rooms on the F8 cap once and reuses the SAME owner after real F9 crossing',()=>{
  const world=fs.readFileSync(path.join(base,'world.mjs'),'utf8');
  assert.match(world,/import \{ planOriginalGuardianOutboardCranes \} from '\.\/source-original-guardian-crane-room\.mjs'/);
  assert.match(world,/const originalCapCanopy=oldCanopyPlan[\s\S]*?buildSourceGuardianCanopy\(root,oldCanopyPlan/);
  assert.match(world,/const cranes=planOriginalGuardianOutboardCranes\(plan\)/);
  assert.match(world,/continuity\.add\(root,realGate\)/);
  assert.match(world,/originalCapCanopy:sourceEntry\.originalCapCanopy\?\?null/);
  assert.match(world,/const inheritedCanopy=sharedPhysicalRoof[\s\S]*?retainedEarnedCap\.originalCapCanopy\.parent/);
  assert.match(world,/const gatewayCanopy=gatewayLoadPath[\s\S]*?!inheritedCanopy/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y|grounded)\s*=/);
});
