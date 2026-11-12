'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/native-figure-sculpt.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('source-skinned exemplary adult torso has different anterior sternum and posterior scapula volume',async()=>{
 const {planNativeFigureSculpt,planNativeFigureVertex}=await load();
 const bounds={min:{x:-.34,y:0,z:-.26},max:{x:.34,y:1.50,z:.26}};
 for(const kind of ['vanguard','revenant','warden']){
  const p=planNativeFigureSculpt(kind,'Original_Body',bounds);
  assert.ok(p);
  const front=planNativeFigureVertex(p,0,1.50*.70,-.20);
  const back=planNativeFigureVertex(p,0,1.50*.70,.20);
  const frontProjection=-.20-front.z,backProjection=back.z-.20;
  assert.ok(frontProjection-backProjection>.007,kind+' front sternum must depart from symmetric inflation');
  assert.ok(frontProjection>0&&backProjection>0,'same native chest remains connected');
  const neck=planNativeFigureVertex(p,0,1.5,-.20);
  const waistSeam=planNativeFigureVertex(p,0,0,.20);
  assert.equal(neck.z,-.20);assert.equal(waistSeam.z,.20);
 }
});

test('true articulated shoulder, knee and calf contours remain skin-bound and bounded',async()=>{
 const {planNativeFigureSculpt,planNativeFigureVertex}=await load();
 const box={min:{x:-.25,y:0,z:-.20},max:{x:.25,y:1.2,z:.20}};
 for(const kind of ['vanguard','revenant','warden']){
  for(const [part,phase] of [['ArmRight',.70],['ArmLeft',.70],['LegRight',.45],['LegLeft',.45]]){
   const p=planNativeFigureSculpt(kind,'Original_'+part,box);
   assert.ok(p);
   const f=planNativeFigureVertex(p,0,1.2*phase,-.15);
   const b=planNativeFigureVertex(p,0,1.2*phase,.15);
   assert.ok(f.z<-.15&&b.z>.15,kind+' '+part+' volume in actual source surface');
   assert.ok(Math.abs(f.z+.15)<=p.maxZShift+1e-6);
   assert.ok(Math.abs(b.z-.15)<=p.maxZShift+1e-6);
   for(const y of [0,1.2]){
    assert.equal(planNativeFigureVertex(p,.1,y,-.15).z,-.15);
   }
  }
 }
});

test('skull, jaw and eyes share their prior bind-space warp; ordinary non-exemplar meshes never gain unapproved relief',async()=>{
 const {planNativeFigureSculpt,planNativeFigureVertex}=await load();
 const skull={min:{x:-.2595,y:.8039,z:-.2826},max:{x:.2595,y:1.3353,z:.2798}};
 const jaw={min:{x:-.14075,y:.7252,z:-.0583},max:{x:.14076,y:.9255,z:.2452}};
 const eyes={min:{x:-.14165,y:.9726,z:.1371},max:{x:.14165,y:1.0505,z:.1837}};
 for(const kind of ['revenant','warden']){
  const h=planNativeFigureSculpt(kind,'Skeleton_Warrior_Head',skull);
  const j=planNativeFigureSculpt(kind,'Skeleton_Warrior_Jaw',jaw,skull);
  const e=planNativeFigureSculpt(kind,'Skeleton_Warrior_Eyes',eyes,skull);
  for(const point of [[.12,.88,.19],[.1,1.01,.17]]){
   const a=planNativeFigureVertex(h,...point),b=planNativeFigureVertex(j,...point),c=planNativeFigureVertex(e,...point);
   assert.equal(a.z,b.z);assert.equal(a.z,c.z);
  }
 }
 const p=planNativeFigureSculpt('ranger','Original_Body',{min:{x:-.34,y:0,z:-.26},max:{x:.34,y:1.5,z:.26}});
 assert.ok(p);
 const z=.20,y=1.5*.7;
 const v=planNativeFigureVertex(p,0,y,z);
 const matching=planNativeFigureVertex(p,0,y,-z);
 assert.ok(Math.abs((v.z-z)-(-z-matching.z))<1e-10,'ranger unchanged symmetric source sculpt');
});
