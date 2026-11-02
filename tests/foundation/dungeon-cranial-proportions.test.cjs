'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const planPath=path.join(root,'public/ai-dungeon/rig-attachment-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(planPath,'utf8')).toString('base64'));

test('actual cloned skeletons select only a genuine head joint, not a decorative head mesh',async()=>{
 const {selectCranialBone}=await load();
 const bones=[
  {name:'Knight_Head',isBone:false},
  {name:'head',isBone:true},
  {name:'head_end',isBone:true},
  {name:'HeadTwist',isBone:true}
 ];
 assert.equal(selectCranialBone(bones),bones[1]);
 assert.equal(selectCranialBone([{name:'mixamorig:Head',isBone:true}])?.name,'mixamorig:Head');
 assert.equal(selectCranialBone([{name:'Bip001 Head',isBone:true}])?.name,'Bip001 Head');
 for(const invalid of [[],null,undefined,[{name:'Head_Helmet',isBone:false}],[{name:'neck',isBone:true}]])
  assert.equal(selectCranialBone(invalid),null);
});

test('each real role has a conservative original adult-head proportion profile with no RNG',async()=>{
 const {planCranialRatio}=await load();
 const roles=['vanguard','ranger','mystic','revenant','cultist','warden'];
 for(const kind of roles){
  const ratio=planCranialRatio(kind);
  assert.ok(ratio>=.70&&ratio<=.80,`${kind} head adjustment is bounded`);
  assert.ok(ratio<1,`${kind} eliminates part of oversized low-poly head`);
 }
 for(const bad of [null,undefined,'unknown','',42])assert.equal(planCranialRatio(bad),1);
 const plan=fs.readFileSync(planPath,'utf8');
 assert.doesNotMatch(plan,/Math\.random|Date\.now|performance\.now|fetch\(|DungeonRuntime/);
});

test('real Three.js bone scale survives repeated mixer writes, no drift or corrupt inputs',async()=>{
 const {Vector3}=require('three');
 const {restoreCranialProportion,stageCranialProportion}=await load();
 const bone={scale:new Vector3(1,1,1)};
 const mount={bone,ratio:.85,applied:false};
 for(let frame=0;frame<100;frame++){
  assert.equal(restoreCranialProportion(mount),frame>0);
  const importedScale=1+(frame%6)*.012;
  bone.scale.set(importedScale,importedScale*.97,importedScale*1.03);
  assert.equal(stageCranialProportion(mount),true);
  assert.ok(Math.abs(bone.scale.x-importedScale*.85)<1e-12);
  assert.equal(stageCranialProportion(mount),false,'repeat renders do not accumulate');
 }
 assert.equal(restoreCranialProportion(mount),true);
 assert.equal(restoreCranialProportion(mount),false);
 const corrupt={bone:{scale:new Vector3(NaN,1,1)},ratio:.85,applied:false};
 assert.equal(stageCranialProportion(corrupt),false,'invalid animation clip scale fails safe');
 assert.equal(stageCranialProportion({bone,ratio:0,applied:false}),false);
 assert.equal(stageCranialProportion(null),false);
});

test('live imported GLB mixer overlays a reversible cranial adjustment without scale accumulation',()=>{
 const source=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(source,/selectCranialBone/);
 assert.match(source,/planCranialRatio/);
 assert.match(source,/function restoreRigCranialBeforeMixer\(actor\)/);
 assert.match(source,/function stageRigCranialAfterMixer\(actor\)/);
 assert.match(source,/restoreRigCranialBeforeMixer\(actor\)[\s\S]*?actor\.mixer\.update[\s\S]*?stageRigCranialAfterMixer\(actor\)/);
 assert.match(source,/rigCranialActors:/);
 assert.match(source,/rigCranialRatios:/);
 assert.match(source,/actor\.rigCranial=null/);
});
