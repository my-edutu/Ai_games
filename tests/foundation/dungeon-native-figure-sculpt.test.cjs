'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/native-figure-sculpt.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));

test('source-continuous adult forms are bounded, separate for six native roles and reject non-skin segments',async()=>{
 const {planNativeFigureSculpt,planNativeFigureVertex}=await load();
 const bounds={min:{x:-.45,y:0,z:-.31},max:{x:.45,y:1.7,z:.31}};
 const cases=['Knight_Body','Knight_ArmLeft','Knight_ArmRight','Knight_LegLeft','Knight_LegRight'];
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  for(const name of cases){
   const plan=planNativeFigureSculpt(kind,name,bounds);
   assert.ok(plan&&Object.isFrozen(plan),kind+':'+name);
   const low=planNativeFigureVertex(plan,-.4,0,-.2);
   const high=planNativeFigureVertex(plan,.4,1.7,.2);
   for(const [p,x,y,z] of [[low,-.4,0,-.2],[high,.4,1.7,.2]])
    assert.ok(Math.abs(p.x-x)<1e-12&&p.y===y&&Math.abs(p.z-z)<1e-12,'original joint seam retained');
   for(let i=1;i<9;i++){
    const p=planNativeFigureVertex(plan,.34,i*1.7/9,.22);
    assert.ok([p.x,p.y,p.z,p.shift].every(Number.isFinite));
    assert.ok(Math.abs(p.x-.34)<=.9*.125+1e-7);
    assert.ok(Math.abs(p.z-.22)<=.62*.125+1e-7);
   }
  }
 }
 assert.equal(planNativeFigureSculpt('none','Knight_Body',bounds),null);
 assert.equal(planNativeFigureSculpt('vanguard','Knight_Helmet',bounds),null);
 assert.equal(planNativeFigureSculpt('vanguard','Knight_Body',{min:bounds.max,max:bounds.min}),null);
 assert.equal(planNativeFigureSculpt('vanguard','Knight_Body',null),null);
 assert.equal(planNativeFigureVertex(null,0,0,0),null);
 assert.equal(planNativeFigureVertex(planNativeFigureSculpt('vanguard','Knight_Body',bounds),Infinity,0,0),null);
});

test('actual Three.js skinned body geometry remains skin-weighted and textured, unchanged master is shared, deformation is owned and disposed',async()=>{
 const THREE=require('three');
 const {planNativeFigureSculpt,sculptNativeFigureGeometry}=await load();
 const master=new THREE.BoxGeometry(.75,1.65,.42,4,12,4);
 const position=master.getAttribute('position'),n=position.count;
 const skinIndex=new Uint16Array(n*4),skinWeight=new Float32Array(n*4);
 for(let i=0;i<n;i++)skinWeight[i*4]=1;
 master.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndex,4));
 master.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeight,4));
 master.computeBoundingBox();
 const baseline=Array.from(master.getAttribute('position').array);
 const uv=Array.from(master.getAttribute('uv').array);
 const clone=master.clone(),recipe=planNativeFigureSculpt('vanguard','Knight_Body',master.boundingBox);
 const receipt=sculptNativeFigureGeometry(clone,recipe);
 assert.equal(receipt.applied,true);
 assert.ok(receipt.changed>0&&receipt.changed<n&&receipt.maxShiftRaw>0);
 assert.ok(receipt.maxShiftRaw<.12,'strict world-independent source-space bound');
 assert.deepEqual(Array.from(master.getAttribute('position').array),baseline,'cached GLB master is immutable');
 assert.deepEqual(Array.from(clone.getAttribute('uv').array),uv,'mapped licensed texture coordinates survive');
 assert.deepEqual(Array.from(clone.getAttribute('skinIndex').array),Array.from(master.getAttribute('skinIndex').array));
 assert.deepEqual(Array.from(clone.getAttribute('skinWeight').array),Array.from(master.getAttribute('skinWeight').array));
 assert.ok(Array.from(clone.getAttribute('normal').array).every(Number.isFinite));
 assert.ok(clone.boundingBox&&clone.boundingSphere);
 const malformed=new THREE.BoxGeometry(.1,.1,.1);
 const bad=Array.from(malformed.getAttribute('position').array);
 assert.equal(sculptNativeFigureGeometry(malformed,recipe).applied,false,'unskinned fallback unaffected');
 assert.deepEqual(Array.from(malformed.getAttribute('position').array),bad);
 malformed.dispose();master.dispose();clone.dispose();
});

test('the actual rig renderer remodels actor-private skinned meshes once, cleans them on retirement and serves the same-origin module',()=>{
 const model=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(model,/import \{[^}]*planNativeFigureSculpt[^}]*sculptNativeFigureGeometry[^}]*\} from '\/dungeon\/native-figure-sculpt\.js'/);
 assert.match(model,/function fitOriginalNativeFigure\(actor\)/);
 assert.match(model,/const privateGeometry=shared\.clone\(\)/);
 assert.match(model,/const receipt=sculptNativeFigureGeometry\(privateGeometry,plan\)/);
 assert.match(model,/actor\.nativeFigureSculpt=fitOriginalNativeFigure\(actor\)/);
 assert.match(model,/actor\.assetGeometries\.push\(privateGeometry\)/);
 assert.match(model,/for\(const g of actor\.assetGeometries\|\|\[\]\)g\.dispose\(\)/);
 for(const diagnostic of ['nativeSculptActors','nativeSculptMeshes','nativeSculptVertices','nativeSculptMaxShiftRaw'])
  assert.ok(model.includes(diagnostic),diagnostic);
 assert.ok(server.includes("['/dungeon/native-figure-sculpt.js','native-figure-sculpt.js']"));
 const module=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(module,/Math\.random|DungeonRuntime|fetch\(|Date\.now|requestAnimationFrame|localStorage|https?:/);
});
