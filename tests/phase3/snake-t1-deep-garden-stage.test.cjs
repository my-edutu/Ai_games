'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');

test('T1 forest-stage heritage and complete playable geometry remain byte-exact even when the entire art direction changes',async()=>{
 const THREE=await import('three');
 const prior=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-pre-basin-e121-world.mjs'),'utf8');
 assert.equal(gitBlob(prior),'1f8466cbb2763eb6eae4037facfeaa6e8f68f7cf');
 const {createWorld:before}=await import('../fixtures/snake-t1-pre-basin-e121-world.mjs');
 const {createWorld:after}=await import('../../public/snake-stream/world.mjs');
 const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]) {
  const a=before(THREE,{width,height}),b=after(THREE,{width,height}),garden=createCourtyardEcology(THREE,{width,height,world:b});
  try {
   const tiles=w=>w.group.children.find(m=>m.name==='Ruins / c3c4ad');
   assert.deepEqual(tiles(a).geometry.getAttribute('position').array,tiles(b).geometry.getAttribute('position').array);
   assert.deepEqual(tiles(a).geometry.getAttribute('uv').array,tiles(b).geometry.getAttribute('uv').array);
   assert.deepEqual(a.stats(),b.stats(),'gameplay positions, art geometry and render budget must not shrink');
   const e=garden.stats();assert.equal(e.publicCellsMoved,0);assert.equal(e.triangles,e.interstitialFernTriangles+e.braidedSurfaceTriangles+e.islandSurfaceTriangles+e.reclaimedMosaicTriangles);
   assert.ok(e.fernCanopyHeight<=.185);assert.equal(e.meshCount,1);assert.equal(e.textures,0);assert.ok(e.fernBiomeRootedSites>=Math.min(20,e.interstitialFernClumps));
  }finally {garden.dispose();a.dispose();b.dispose();}
 }
});

test('T1 full-frame native planted court rebalances giant blank beige arena into deep vegetation around a sunlit authentic central limestone landmark',async()=>{
 const THREE=await import('three');
 const {createWorld}=await import('../../public/snake-stream/world.mjs');
 const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
 const w=createWorld(THREE,{width:28,height:16}),garden=createCourtyardEcology(THREE,{width:28,height:16,world:w});
 try {
  let map;w.group.traverse(o=>{if(!map&&o.isMesh&&o.material?.map?.image?.width===1024)map=o.material.map;});
  assert.ok(map);assert.equal(map.image.height,512);assert.equal(map.image.data.length,1024*512*4);
  const tile=w.group.children.find(m=>m.name==='Ruins / c3c4ad');
  const positions=tile.geometry.getAttribute('position'),colors=tile.geometry.getAttribute('color');
  const biomeBays=[0,0,0];let strong=0,mid=0,heart=0;
  for(let i=0;i<positions.count;i++){
   const x=positions.getX(i),z=positions.getZ(i),r=colors.getX(i),g=colors.getY(i),b=colors.getZ(i);
   if(g-r>.20&&g-b>.15){strong++;biomeBays[Math.min(2,Math.max(0,Math.floor((z/16+.5)*3)))]++;}
   if(Math.hypot(x/14,z/8)>.40&&Math.hypot(x/14,z/8)<.86){mid++;}
   if(Math.abs(x)<1.25&&Math.abs(z)<1.25&&r>.78&&g>.84)heart++;
  }
  assert.ok(strong>positions.count*.64,'the complete stage, not just three thin streaks, must become visibly forest-green');
  assert.ok(biomeBays.every(v=>v>300),'living valley occupies foreground, middle and distance without hiding true cells');
  assert.ok(heart>30,'ancient centre must remain lit and readable');
  const rgba=map.image.data;let n=0,lush=0,heartTex=0,heartN=0;
  for(let y=0;y<512;y+=6)for(let x=0;x<1024;x+=6){const i=(y*1024+x)*4,u=x/1024,v=y/512,r=rgba[i],g=rgba[i+1],b=rgba[i+2];
   n++;if(r<115&&g>r+25&&g>b+30)lush++;
   if(Math.hypot((u-.52)/.36,(v-.5)/.36)<.28){heartN++;if(r>145&&g>130)heartTex++;}
  }
  assert.ok(lush/n>.61,'physically visible original stone atlas should be predominantly a rooted green garden, not dominant sand-colored rectangle');
  assert.ok(heartTex/heartN>.92,'the truthful central limestone goal landmark should remain materially distinct and readable');
  assert.equal(garden.stats().stoneAtlas.textureAdded,0);
 } finally {garden.dispose();w.dispose();}
});
