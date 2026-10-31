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
  assert.equal(stableSignature(first),stableSignature(second),`district ${district} stable`);
  assert.equal(JSON.stringify(layout),before,`district ${district} authority untouched`);
  first.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(first),padX=p.width/2,padZ=p.depth/2;
  assert.ok(bounds.min.x>=-padX+.09 && bounds.max.x<=padX-.09,`district ${district} x fits`);
  assert.ok(bounds.min.z>=-padZ+.09 && bounds.max.z<=padZ-.09,`district ${district} z fits`);
  assert.ok(bounds.min.y>=.010 && bounds.max.y<=.044,`district ${district} no raised obstacle`);
  assert.ok(first.userData.theme && first.userData.theme.length>2,'labeled theme');
  assert.ok(first.children.length>=2 && first.children.length<=4,`district ${district} bounded batches`);
  let triangles=0;
  first.traverse(o=>{if(o.isMesh){const g=o.geometry;assert.equal(o.castShadow,false,'surface decals cast no shadow');assert.ok(o.material===m.gold||o.material===m.teal||o.material===m.dark||o.material===m.copper,'reuses palette material');triangles+=(g.index?.count??g.attributes.position.count)/3;for(const n of g.attributes.position.array)assert.ok(Number.isFinite(n));}});
  assert.ok(triangles>90 && triangles<1000,`district ${district} detail budget ${triangles}`);
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

test('paving has legible mortar and distinct worn stone cells without new texture allocations',async()=>{
 const {palette,disposeTree,tileTopology}=await import(moduleUrl('materials.js'));const THREE=await import('three');
 for(let district=0;district<10;district++){
  const a=palette({index:district}),b=palette({index:district}),tex=a.tile.map,normal=a.tile.bumpMap;
  assert.deepEqual(tex.image.data,b.tile.map.image.data,`district ${district} deterministic`);
  assert.equal(tex.image.width,128);assert.equal(tex.image.height,128);
  const lum=(x,y)=>{const base=(y*128+x)*4;return (tex.image.data[base]+tex.image.data[base+1]+tex.image.data[base+2])/3;};
  const mean=(cx,cy)=>{let sum=0,n=0;for(let yy=cy+8;yy<cy+24;yy+=2)for(let xx=cx+8;xx<cx+24;xx+=2){sum+=lum(xx,yy);n++;}return sum/n;};
  const cells=[0,32,64,96].flatMap(x=>[0,32,64,96].map(y=>mean(x,y)));
  assert.ok(Math.max(...cells)-Math.min(...cells)>16,`district ${district} different worn blocks`);
  let groutTotal=0,groutCount=0,stoneTotal=0,stoneCount=0;
  for(let y=0;y<128;y+=2)for(let x=0;x<128;x+=2){
   const t=tileTopology(x,y,district);
   if(t.seam){groutTotal+=lum(x,y);groutCount++;}
   else if(t.edge>7){stoneTotal+=lum(x,y);stoneCount++;}
  }
  assert.ok(groutCount>20&&stoneCount>20,'true joints and flagstone areas sampled');
  assert.ok(stoneTotal/stoneCount-groutTotal/groutCount>28,`district ${district} visible mortar, including warped cuts`);
  assert.ok(normal?.isTexture && a.tile.roughnessMap===normal,'single relief map');
  const g1=new THREE.Group(),g2=new THREE.Group();g1.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),a.tile));g2.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),b.tile));disposeTree(g1);disposeTree(g2);
 }
});

test('engraved paving seam topology is varied, deterministic and safe across all ten districts',async()=>{
 const {tileTopology}=await import(moduleUrl('materials.js'));
 assert.equal(typeof tileTopology,'function');
 const patterns=new Set();
 for(let district=0;district<10;district++){
  const cells=[];
  for(let y=0;y<128;y+=4)for(let x=0;x<128;x+=4){
   const a=tileTopology(x,y,district),b=tileTopology(x,y,district);
   assert.deepEqual(a,b);assert.ok(Number.isFinite(a.edge));assert.ok(Number.isFinite(a.cell));
   cells.push(a.seam?'1':'0');
  }
  patterns.add(cells.join(''));
 }
 assert.equal(patterns.size,10,'ten different paving cuts, not only ten pigment colors');
});
