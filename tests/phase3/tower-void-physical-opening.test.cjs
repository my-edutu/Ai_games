'use strict';
// The incoming Floor9 physical art may not become an opaque wall that buries
// the real old floor's HP-opened bronze arch in the original 1x footage.
// This is geometry safety, never film or gameplay-quality acceptance.
const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'../..');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tower-void-open-shaft-'));
after(()=>fs.rmSync(dir,{recursive:true,force:true}));
const local=p=>pathToFileURL(path.join(ROOT,'public/infinite-tower-climb/visuals',p+'.mjs')).href;
const three=pathToFileURL(path.join(ROOT,'node_modules/three/build/three.module.js')).href;
const raw=fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
let source=raw.replace("'/tower/vendor/three.module.js'",JSON.stringify(three));
for(const n of ['coordinates','world-surface','scene-hierarchy','mesh-provenance',
 'guardian-passage','crossfloor-arrival','guardian-transmission-layout'])
 source=source.replace("'./"+n+".mjs'",JSON.stringify(local(n)));
const destination=path.join(dir,'world.mjs');
fs.writeFileSync(destination,source);
const load=Promise.all([import(three),import(pathToFileURL(destination).href)]);
function snapshot(theme,floor){
 return {runToken:'void-aperture-original',tick:120,floor,theme,
  lifecycle:'running',worldWidth:480000,chunkBaseY:floor*360000,
  chunkHeight:360000,platforms:[],hazards:[],enemies:[]};
}
function owners(world){
 const names=new Set();
 world.group.traverse(object=>{
  for(const owner of object.geometry?.userData?.originalTriangleOwners??[])
   for(const name of owner.authoringPath??[]) names.add(name);
  if(object.name)names.add(object.name);
 });
 return names;
}
test('the actual low-tier Floor9 world has real bounded open core, bearing buttresses and no new gameplay source',async()=>{
 const [THREE,{createTowerWorld}]=await load;
 const world=createTowerWorld(),f9=snapshot('void',9);
 const unchanged=JSON.stringify(f9);
 try{
  world.update(f9,.05,0,{quality:'low'});
  const d=world.diagnostics(),names=owners(world);
  assert.ok(names.has('VoidOpenCoreFoundation'),'heavy source geometry still grounds the core');
  assert.ok(names.has('VoidOpenCoreSupportedCrown'),'original tower still has a supported monumental crown');
  assert.ok(names.has('VoidOpenCoreRearLoadPosts'),'load-bearing rear piers remain real vertices');
  assert.ok(names.has('VoidOpenButtressRearPiersAndFrontStanchions'),
    'the three formerly solid upper-floor pylons now provide daylight');
  assert.ok(names.has('VoidOpenGeologicalSupportTies'),
    'open-side quarry rock retains real rear load paths');
  assert.equal(d.floor,9);
  assert.ok(d.triangles>1000,'the game world cannot become an empty sky');
  assert.ok(d.meshes+d.shadowCasterMeshes<=125,
    'a source aperture cannot produce an uncontrolled per-frame draw explosion');
  assert.equal(JSON.stringify(f9),unchanged,'world geometry must not mutate authority');
  assert.equal(d.platforms,0);
  assert.equal(d.hazards,0);
 }finally{world.dispose();}
});
test('the physical Void action-depth central aperture is genuinely empty, not transparent or a shader trick',async()=>{
 const [THREE,{createTowerWorld}]=await load;
 const world=createTowerWorld();
 try{
  world.update(snapshot('void',9),0,0,{quality:'low'});
  world.group.updateWorldMatrix(true,true);
  const pts=[];
  world.group.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const a=mesh.geometry?.getAttribute('position');
   if(!a)return;
   const index=mesh.geometry.getIndex();
   const m=mesh.matrixWorld,v=new THREE.Vector3();
   for(const owner of mesh.geometry?.userData?.originalTriangleOwners??[]){
    const trail=owner.authoringPath??[];
    if(!trail.some(name=>name==='VoidOpenCoreRearLoadPosts' ||
       name==='VoidOpenCoreRearDiagonalStay' ||
       name==='VoidOpenCoreCrownTie'))continue;
    const first=owner.startFace*3,last=owner.endFace*3;
    for(let i=first;i<last;i++){
     v.fromBufferAttribute(a,index?index.getX(i):i).applyMatrix4(m);
     pts.push([v.x,v.y,v.z]);
    }
   }
  });
  assert.ok(pts.length>=24,'geometry was evaluated from actual batched Three vertices');
  for(const [x,y,z] of pts)
   assert.ok(!(y>18&&y<39 && z>0 && Math.abs(x)<6),
    'no original Void support crosses the real floor-to-floor forward body corridor');
 }finally{world.dispose();}
});
