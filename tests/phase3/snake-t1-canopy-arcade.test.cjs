'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const oldSource=fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-canopy-b615.mjs'),'utf8');

test('T1 canopy negative control is the exact real prior PR source, not a synthetic mock',()=>{
 assert.equal(blob(oldSource),'2abd364f6666f1324e0294f7760a8e7a1978a71a');
});

test('T1 connected rear rainforest canopy and ivy-loaded broken arcade are authored in the live static world',async()=>{
 const THREE=await import('three');
 const before=(await import('../fixtures/snake-t1-before-canopy-b615.mjs')).createLivingGarden;
 const latest=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
 for(const dims of [[8,8],[28,16],[40,24]]){
  const previous=before(THREE,{width:dims[0],height:dims[1]});
  const after=latest(THREE,{width:dims[0],height:dims[1]});
  const repeat=latest(THREE,{width:dims[0],height:dims[1]});
  try{
   const old=previous.stats(),now=after.stats();
   assert.equal(old.canopyTrees,undefined,'old source has no deliberately staged canopy-tree grammar');
   assert.ok(now.canopyTrees>=7,'the whole back garden and both wings gain authored 3D tree crowns');
   assert.ok(now.canopyLeaflets>=700,'canopy must have layered folded leaves, not flat cross-billboards');
   assert.ok(now.arcadeArches>=3,'broken architectural rhythm and open 3D arch vaults');
   assert.ok(now.arcadeStones>=65,'weathered arch ring is sculpted from masonry, not a single extruded strip');
   assert.ok(now.hangingVines>=16,'trees, ruins and coast must have integrated hanging growth');
   assert.ok(now.triangles>old.triangles+2200 && now.triangles<23000,'substantial but bounded real static geometry');
   assert.equal(now.meshCount,4,'new art does not add an extra live draw batch');
   assert.equal(now.textures,1,'no additional GPU texture assets');
   assert.deepEqual(now,repeat.stats(),'deterministic original ecology for equivalent public board dimensions');
   for(const mesh of after.group.children){
    assert.equal(mesh.castShadow,false,'no high-cost dynamic shadow-map workload');
    const attr=mesh.geometry.getAttribute('position');
    for(let k=0;k<attr.count;k++){
     const x=attr.getX(k),y=attr.getY(k),z=attr.getZ(k);
     assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z),'all 3D geometry finite');
     assert.ok(x<-dims[0]/2-.9 ||x>dims[0]/2+.9 || z<-dims[1]/2-.9 ||z>dims[1]/2+.9,'never decorate real active gameplay cells');
     assert.ok(Math.abs(x)<dims[0]/2+15 && Math.abs(z)<dims[1]/2+18 && y>-4.1 && y<8,'bounded off-board LOD');
    }
   }
  }finally{previous.dispose();after.dispose();repeat.dispose();}
 }
});
