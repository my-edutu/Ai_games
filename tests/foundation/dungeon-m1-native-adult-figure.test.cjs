'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/native-figure-sculpt.js'),'utf8')).toString('base64'));

test('original Vanguard, Revenant and Warden adult face refit changes the REAL source mesh, not costume geometry',async()=>{
 const {planNativeFigureSculpt,planNativeFigureVertex}=await load();
 const box={min:{x:-.40,y:.15,z:-.29},max:{x:.40,y:.81,z:.29}};
 for(const kind of ['vanguard','revenant','warden']){
  const p=planNativeFigureSculpt(kind,'Original_Head',box);
  assert.equal(p?.part,'head',kind);
  const face=planNativeFigureVertex(p,.32,.15+.66*.75,.18);
  assert.ok(face.x<.27&&face.z<.18,'actual source skull/taper must materially depart from toy profile: '+kind);
  for(const y of [box.min.y,box.max.y]){
   const v=planNativeFigureVertex(p,.32,y,.18);
   assert.ok(Math.abs(v.x-.32)<1e-12&&Math.abs(v.z-.18)<1e-12,'no neck/crown seam gaps');
  }
 }
 assert.equal(planNativeFigureSculpt('ranger','Original_Head',box),null,'scope stays with one three-actor exemplar');
 assert.equal(planNativeFigureSculpt('vanguard','Original_Helmet',box),null,'no rigid helmet/body duplicate');
});
test('anatomy is physically applied once to a private native SKINNED mesh with original weights, UVs and bounds intact',async()=>{
 const THREE=require('three');
 const {planNativeFigureSculpt,sculptNativeFigureGeometry}=await load();
 const master=new THREE.BoxGeometry(.8,.66,.58,6,12,6);
 const n=master.getAttribute('position').count;
 const indices=new Uint16Array(n*4),weights=new Float32Array(n*4);
 for(let i=0;i<n;i++)weights[i*4]=1;
 master.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));
 master.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 master.computeBoundingBox();
 const orig=Array.from(master.getAttribute('position').array);
 const clone=master.clone(),uvs=Array.from(clone.getAttribute('uv').array);
 const plan=planNativeFigureSculpt('warden','Enemy_Head',master.boundingBox);
 const receipt=sculptNativeFigureGeometry(clone,plan);
 assert.equal(receipt.applied,true);assert.ok(receipt.changed>0&&receipt.changed<n);
 assert.ok(receipt.maxShiftRaw>.01&&receipt.maxShiftRaw<.18,'bounded material skull deformation');
 assert.deepEqual(Array.from(master.getAttribute('position').array),orig,'shared cached model unchanged');
 assert.deepEqual(Array.from(clone.getAttribute('uv').array),uvs);
 for(const attr of ['skinIndex','skinWeight'])assert.deepEqual(
  Array.from(clone.getAttribute(attr).array),Array.from(master.getAttribute(attr).array));
 assert.ok(Array.from(clone.getAttribute('normal').array).every(Number.isFinite));
 assert.ok(clone.boundingBox&&clone.boundingSphere);
 master.dispose();clone.dispose();
});
test('native adult body retains actual articulated source and distinct original role silhouettes',async()=>{
 const {planNativeFigureSculpt,planNativeFigureVertex}=await load();
 const box={min:{x:-.4,y:0,z:-.26},max:{x:.4,y:1.6,z:.26}};
 const previous={vanguard:{chest:.25,waist:.19},revenant:{chest:.23,waist:.20},warden:{chest:.28,waist:.16}};
 for(const kind of Object.keys(previous)){
  const plan=planNativeFigureSculpt(kind,'Original_Body',box);
  assert.ok(plan.chest>previous[kind].chest+.10&&plan.waist>previous[kind].waist+.09);
  const chest=planNativeFigureVertex(plan,.34,1.6*.75,.19);
  const waist=planNativeFigureVertex(plan,.34,1.6*.38,.19);
  assert.ok(chest.x>.34&&waist.x<.34,'physically widened rib cage and tapered waist on source skin');
  assert.ok(Math.abs(chest.x-.34)<=.8*.16+1e-7,'bounded skin displacement');
 }
});

test('original adult skinned silhouette follows continuous anatomical loads, role-specific shoulders and precise seams',async()=>{
 const {planNativeFigureSculpt,planNativeFigureVertex}=await load();
 const bounds={min:{x:-.32,y:0,z:-.26},max:{x:.32,y:1.4,z:.26}};
 const sample=(kind,name,t,x=.25,z=.19)=>{
  const p=planNativeFigureSculpt(kind,name,bounds);
  assert.ok(p,kind+' '+name);
  return planNativeFigureVertex(p,x,t*1.4,z);
 };
 for(const kind of ['vanguard','revenant','warden']){
  const chest=sample(kind,'Original_Body',.72),middle=sample(kind,'Original_Body',.37);
  assert.ok(chest.x>.25&&middle.x<.25,'ribcage-to-waist on ONE true body skin');
  const upper=sample(kind,'Original_ArmRight',.82),elbow=sample(kind,'Original_ArmRight',.44);
  assert.ok(upper.x>elbow.x,'source deltoid must outweigh original elbow');
  const thigh=sample(kind,'Original_LegLeft',.72),knee=sample(kind,'Original_LegLeft',.45);
  assert.ok(thigh.x>knee.x,'real articulated thigh must taper at knee');
  for(const part of ['Body','ArmLeft','ArmRight','LegLeft','LegRight','Head']){
   const p=planNativeFigureSculpt(kind,'Original_'+part,bounds);
   for(const y of [0,1.4]){
    const v=planNativeFigureVertex(p,.25,y,.19);
    assert.equal(v.x,.25);assert.equal(v.z,.19);
   }
  }
 }
 const right=sample('warden','Original_ArmRight',.82),
  left=sample('warden','Original_ArmLeft',.82);
 assert.ok(right.x>left.x,'real source sword arm receives original asymmetrical guard mass');
 for(const bad of [null,{x:0,y:0,z:0},'strange'])assert.equal(
  planNativeFigureVertex(bad,NaN,0,0),null);
});
