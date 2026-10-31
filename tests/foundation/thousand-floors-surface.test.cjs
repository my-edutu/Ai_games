'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {generateFloor}=require('../../dist/games/ai-vs-1000-floors/src/index.js');
const moduleUrl=name=>pathToFileURL(path.join(__dirname,'../../public/ai-vs-1000-floors/',name)).href;
const stableSignature=root=>{
 const out=[];root.traverse(o=>{if(o.isMesh){const p=o.geometry.attributes.position.array;let sum=0;for(let i=0;i<p.length;i++)sum+=(Math.round(p[i]*10000)*((i%17)+1));out.push([o.material.name,Math.round(sum),p.length])}});return JSON.stringify(out);
};

test('ten surface motifs are distinct, deterministic, bounded, and not part of authoritative layout',async()=>{
 const THREE=await import('three'),{createPlatformFinish}=await import(moduleUrl('platform-surface.js')),{palette,disposeTree}=await import(moduleUrl('materials.js'));
 const signatures=new Set();
 for(let district=0;district<10;district++){
  const layout=generateFloor('thousand-dawn-2026',district*100+6),before=JSON.stringify(layout),p=layout.platforms[0],m=palette(layout.district);
  const first=createPlatformFinish(p,m,district,0),second=createPlatformFinish(p,m,district,0);
  assert.equal(stableSignature(first),stableSignature(second));
  assert.equal(JSON.stringify(layout),before);
  first.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(first),padX=p.width/2,padZ=p.depth/2;
  assert.ok(bounds.min.x>=-padX+.09 && bounds.max.x<=padX-.09,'x fits');
  assert.ok(bounds.min.z>=-padZ+.09 && bounds.max.z<=padZ-.09,'z fits');
  assert.ok(bounds.min.y>=.010 && bounds.max.y<=.044,'no raised obstacle');
  assert.ok(first.userData.theme && first.userData.theme.length>2,'labeled theme');
  assert.ok(first.children.length>=2 && first.children.length<=4,'bounded batches');
  let triangles=0;
  first.traverse(o=>{if(o.isMesh){const g=o.geometry;assert.equal(o.castShadow,false,'surface decals cast no shadow');assert.ok(o.material===m.gold||o.material===m.teal||o.material===m.dark||o.material===m.copper,'reuses palette material');triangles+=(g.index?.count??g.attributes.position.count)/3;for(const n of g.attributes.position.array)assert.ok(Number.isFinite(n));}});
  assert.ok(triangles>90 && triangles<1000,'bounded detail budget');
  signatures.add(first.userData.theme+':'+stableSignature(first));
  disposeTree(first);disposeTree(second);
 }
 assert.equal(signatures.size,10);
});

test('visual-only surface module is integrated, statically batchable and served from explicit allowlist',async()=>{
 const server=require('../../scripts/serve-thousand-floors.cjs');assert.equal(path.basename(server.resolveAsset('/floors/platform-surface.js')||''),'platform-surface.js');
 const env=fs.readFileSync(path.join(__dirname,'../../public/ai-vs-1000-floors/environment.js'),'utf8');
 assert.match(env,/createPlatformFinish/);
 assert.match(env,/g\.add\(createPlatformFinish\(/);
});
