'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {generateFloor}=require('../../dist/games/ai-vs-1000-floors/src/index.js');
const load=name=>import(pathToFileURL(path.resolve(__dirname,'../../public/ai-vs-1000-floors/'+name)).href);

test('all ten districts have immutable, distinct art direction with safe fallback',async()=>{
 const {districtStyle}=await load('materials.js');assert.equal(typeof districtStyle,'function');
 const styles=Array.from({length:10},(_,i)=>districtStyle(i));
 assert.equal(new Set(styles.map(s=>s.masonry)).size,10);
 assert.equal(new Set(styles.map(s=>s.sky)).size,10);
 assert.equal(new Set(styles.map(s=>s.silhouette)).size,10);
 for(const s of styles){assert(Object.isFrozen(s));for(const key of ['sky','horizon','stone','masonry','tile','metal','sun','ground'])assert.match(s[key],/^#[a-f\d]{6}$/i);assert(s.exposure>=.8&&s.exposure<=1.3)}
 for(const bad of [null,undefined,-1,10,NaN,Infinity,'4'])assert.equal(districtStyle(bad),styles[0]);
});

test('architectural palettes actually vary without changing hazard colors',async()=>{
 const {palette}=await load('materials.js');
 const palettes=Array.from({length:10},(_,index)=>palette({index}));
 assert.equal(new Set(palettes.map(p=>p.terracotta.map.image.data.join(','))).size,10);
 assert.equal(new Set(palettes.map(p=>p.danger.color.getHexString())).size,1);
 for(const p of palettes){for(const key of ['stone','terracotta','tile']){assert(p[key].bumpMap?.isTexture,key+' relief');assert(p[key].roughnessMap?.isTexture,key+' roughness');assert(p[key].bumpScale>0&&p[key].bumpScale<=.12)}}
});

test('sky gradients are deterministic and visibly nonuniform',async()=>{
 const {createSkyTexture}=await load('materials.js');assert.equal(typeof createSkyTexture,'function');
 const a=createSkyTexture(0),b=createSkyTexture(0),c=createSkyTexture(9);
 assert.deepEqual(a.image.data,b.image.data);assert.notDeepEqual(a.image.data,c.image.data);
 assert.notDeepEqual([...a.image.data.slice(0,3)],[...a.image.data.slice(-4,-1)]);
 assert(a.image.width*a.image.height<=32768);a.dispose();b.dispose();c.dispose();
});

test('all generated surface maps are released once with their floor',async()=>{
 const THREE=await import('three');const {palette,disposeTree}=await load('materials.js');
 const m=palette({index:4}),root=new THREE.Group(),textures=new Map();
 for(const material of Object.values(m)){if(!material?.isMaterial)continue;root.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material));for(const value of Object.values(material))if(value?.isTexture&&!textures.has(value)){textures.set(value,0);value.addEventListener('dispose',()=>textures.set(value,textures.get(value)+1))}}
 assert(textures.size>=15,'relief maps included');disposeTree(root);for(const count of textures.values())assert.equal(count,1);
});

test('district landmarks are distinct, bounded and leave actual route untouched',async()=>{
 const target=path.resolve(__dirname,'../../public/ai-vs-1000-floors/skyline.js');assert(fs.existsSync(target),'skyline module');
 const THREE=await import('three'),{createDistrictSkyline}=await load('skyline.js'),{palette,disposeTree}=await load('materials.js');
 const signatures=[];
 for(let d=0;d<10;d++){
  const layout=generateFloor('thousand-dawn-2026',d*100+6),before=JSON.stringify(layout),m=palette(layout.district);
  const sky=createDistrictSkyline(layout,m);assert.equal(JSON.stringify(layout),before);
  assert.equal(sky.root.userData.district,d);sky.root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(sky.root);assert(bounds.max.z<-13,'skyline behind every pad');assert(bounds.max.y<30);
  let meshes=0,triangles=0;sky.root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const n of o.geometry.attributes.position.array)assert(Number.isFinite(n))}});
  assert(meshes<180,'bounded draws before integration');assert(triangles<55000,'bounded detail');
  signatures.push(sky.root.userData.silhouette+':'+triangles);
  sky.setQuality('low');assert.equal(sky.detail.visible,false);sky.setQuality('high');assert.equal(sky.detail.visible,true);
  disposeTree(sky.root);
 }
 assert.equal(new Set(signatures).size,10);
});

test('scene actually uses district skies and material exposure, and serves skyline module',async()=>{
 const scene=fs.readFileSync(path.resolve(__dirname,'../../public/ai-vs-1000-floors/scene.js'),'utf8');
 assert.match(scene,/createSkyTexture\(/);assert.match(scene,/style\.exposure/);
 const {resolveAsset}=require('../../scripts/serve-thousand-floors.cjs');assert.equal(path.basename(resolveAsset('/floors/skyline.js')||''),'skyline.js');
});

test('landmark silhouettes never sit between follow camera and explorer on sampled real routes',async()=>{
 const THREE=await import('three');const {createDistrictSkyline}=await load('skyline.js'),{palette,disposeTree}=await load('materials.js'),{createFollowCamera}=await load('scene.js');
 const {createCampaign,stepCampaign,getRenderSnapshot}=require('../../dist/games/ai-vs-1000-floors/src/index.js');
 const state=createCampaign('thousand-dawn-2026'),targets=new Set([6,102,203,303,403,503,603,703,803,902]);
 let current=0,sky=null,controllers;
 while(state.floor<=902){
  if(targets.has(state.floor)&&state.tick%10===0){
   const s=getRenderSnapshot(state);
   if(current!==state.floor){if(sky)disposeTree(sky.root);current=state.floor;sky=createDistrictSkyline(s.layout,palette(s.layout.district));sky.root.updateMatrixWorld(true);controllers=[createFollowCamera(s.layout,1280/720),createFollowCamera(s.layout,390/844)];}
   for(const control of controllers){
    const pos=new THREE.Vector3(s.hero.x,s.hero.y,s.hero.z),frame=control.update(s,pos,1/30,true),eye=pos.clone().add(new THREE.Vector3(0,1.7,0));
    const offset=eye.clone().sub(frame.position),ray=new THREE.Raycaster(frame.position,offset.clone().normalize(),.1,offset.length()-.1);
    assert.equal(ray.intersectObject(sky.root,true).length,0,`floor ${s.floor}, tick ${s.tick}: landmark hides explorer`);
   }
  }
  stepCampaign(state);
 }
 if(sky)disposeTree(sky.root);
});
