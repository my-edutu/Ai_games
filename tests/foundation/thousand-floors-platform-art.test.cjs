'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'../../public/ai-vs-1000-floors');
const load=name=>import(pathToFileURL(path.join(base,name)).href);
async function setup(){const name=path.join(base,'platform-architecture.js');assert.ok(fs.existsSync(name),'district platform architecture module is missing');const mod=await load('platform-architecture.js');const {palette,disposeTree}=await load('materials.js');const THREE=await import('three');return {...mod,palette,disposeTree,THREE};}
const p=Object.freeze({id:'test',width:4.2,depth:3.4,x:12,y:40,z:-7,kind:'path'});
test('all ten districts have unique bounded platform structures below the exact landing footprint',async()=>{
 const {createPlatformArchitecture,palette,disposeTree,THREE}=await setup();const signatures=new Set();
 for(let district=0;district<10;district++){
  const m=palette({index:district}),g=createPlatformArchitecture(p,m,district,3);const box=new THREE.Box3().setFromObject(g);
  assert.ok(box.max.y<=-.12+1e-6,`district ${district} intrudes onto pad: ${box.max.y}`);
  assert.ok(box.min.x>=-p.width/2&&box.max.x<=p.width/2&&box.min.z>=-p.depth/2&&box.max.z<=p.depth/2,`district ${district} creates false landings beyond footprint`);
  assert.ok(box.min.y>=-10,`district ${district} is unbounded`);
  let count=0,triangles=0;g.traverse(o=>{if(o.isMesh){count++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;assert.ok(Object.values(m).includes(o.material));for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));}});
  assert.ok(triangles>20&&triangles<=5000,`district ${district}: ${triangles} triangles`);assert.ok(count<=70);
  signatures.add(g.userData.architecture+':'+count+':'+triangles);disposeTree(g);Object.values(m).forEach(v=>v.dispose());
 }
 assert.equal(signatures.size,10);
});
test('platform generation is deterministic, handles invalid districts and leaves authority untouched',async()=>{
 const {createPlatformArchitecture,palette,disposeTree}=await setup();const m=palette({index:0});
 const signature=g=>{const a=[];g.traverse(o=>{if(o.isMesh)a.push([o.geometry.type,Array.from(o.geometry.attributes.position.array),o.position.toArray(),o.rotation.toArray()])});return JSON.stringify(a)};
 for(const d of [0,1,9,-1,NaN,undefined]){const a=createPlatformArchitecture(p,m,d,0),b=createPlatformArchitecture(p,m,d,0);assert.equal(signature(a),signature(b));assert.equal(p.y,40);disposeTree(a);disposeTree(b);}
});
test('environment uses the new platform structures and explicit new module routes are allowed',async()=>{
 const env=fs.readFileSync(path.join(base,'environment.js'),'utf8');assert.match(env,/createPlatformArchitecture/);
 const {resolveAsset}=require('../../scripts/serve-thousand-floors.cjs');
 for(const name of ['platform-architecture.js','character-performance.js'])assert.equal(resolveAsset('/floors/'+name),path.join(base,name));
 assert.equal(resolveAsset('/floors/private.js'),null);
});
