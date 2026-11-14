'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');

// Genuine prior PR-head 68178fbe source: world Git blob cd6dd9c55c665b7fcdabb22c00d03c31581c317f;
// ecology Git blob e219357fb1bfe8084466f08d3e0825b1170d817e.
// Prior exact-head full-WebGL screenshots, real 63s gameplay and unchanged
// 12/17 complete render failure: Actions 41630840885. No pixel substitution.
test('T1 original complete stage gains restrained earthly depth instead of saturated luminous rectangular grass, without moving playing cells',async()=>{
 const THREE=await import('three');
 const {createWorld}=await import('../../public/snake-stream/world.mjs');
 const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]) {
  const world=createWorld(THREE,{width,height});
  const garden=createCourtyardEcology(THREE,{width,height,world});
  try {
   const p=world.group.children.find(m=>m.name==='Ruins / c3c4ad').geometry;
   let map;world.group.traverse(o=>{if(!map&&o.isMesh&&o.material?.map?.image?.width===1024)map=o.material.map;});
   assert.ok(map,'reuse true existing 1024x512 stone atlas');
   assert.equal(garden.stats().meshCount,1);
   assert.equal(garden.stats().textures,0);
   assert.equal(garden.stats().publicCellsMoved,0);
   assert.ok(garden.stats().triangles<3100);
   const pos=p.getAttribute('position'),c=p.getAttribute('color');
   let lush=0,heart=0;for(let i=0;i<c.count;i++){
    const r=c.getX(i),g=c.getY(i),b=c.getZ(i),x=pos.getX(i),z=pos.getZ(i);
    if(g-r>.20&&g-b>.15)lush++;
    if(Math.abs(x)<1.25&&Math.abs(z)<1.25&&r>.78&&g>.84)heart++;
   }
   assert.ok(lush>c.count*.64,'keep meaningful connected forest canopy from existing authored valleys');
   assert.ok(heart>30,'keep exposed ancient limestone goal and cell legibility');
   const d=map.image.data;let n=0,acid=0,sumR=0,sumG=0,green=0;
   for(let y=0;y<512;y+=6)for(let x=0;x<1024;x+=6){let i=(y*1024+x)*4,r=d[i],g=d[i+1],b=d[i+2];
    n++;sumR+=r;sumG+=g;
    if(g>149&&g>r+45)acid++;
    if(r<115&&g>r+25&&g>b+30)green++;
   }
   assert.ok(green/n>.61,'retain the whole-board living-ground coverage and not a beige rollback');
   assert.ok(acid/n<.14,'remove electric-green dominance from original stage material');
   assert.ok(sumG/n<(height<=8?150:142),'broadcast-wide original pigment must be earth-moss, not fluorescent grass');
   assert.ok(sumR/n>77,'stone and umber undertones must remain rather than pure green paint');
  }finally{garden.dispose();world.dispose();}
 }
});

test('T1 sculpted real interstitial plant canopy expands without creating a false obstacle, meshes, textures or moving public cells',async()=>{
 const THREE=await import('three');const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const e=createCourtyardEcology(THREE,{width,height});
  try{
   const s=e.stats(),p=e.group.children[0].geometry.getAttribute('position').array;
   assert.ok(s.fernCanopyHeight<=.185,'cue clearance remains strict');
   assert.ok(s.triangles<3100);assert.equal(s.meshCount,1);assert.equal(s.textures,0);assert.equal(s.publicCellsMoved,0);
   const offset=(s.braidedSurfaceTriangles+s.islandSurfaceTriangles+s.reclaimedMosaicTriangles)*9;
   let area=0,minimumClearance=Infinity;
   for(let i=offset;i<p.length;i+=9){
    const x1=p[i],z1=p[i+2],x2=p[i+3],z2=p[i+5],x3=p[i+6],z3=p[i+8];
    area+=.5*Math.abs((x2-x1)*(z3-z1)-(z2-z1)*(x3-x1));
    for(let a=i;a<i+9;a+=3){const x=p[a],z=p[a+2],nx=Math.round(x+width/2-.5)+.5-width/2,nz=Math.round(z+height/2-.5)+.5-height/2;minimumClearance=Math.min(minimumClearance,Math.hypot(x-nx,z-nz));}
   }
   assert.ok(s.interstitialFernClumps>=Math.min(20,s.fernBiomeRootedSites));
   assert.ok(area/s.interstitialFernTriangles>.0105,'sculpt canopy visibly broader than the exact 681 baseline, without adding triangles');
   assert.ok(minimumClearance>.44,'rooted sculpt never touches food, hazard, portal, snake centre or gameplay cells');
  }finally{e.dispose();}
 }
});
