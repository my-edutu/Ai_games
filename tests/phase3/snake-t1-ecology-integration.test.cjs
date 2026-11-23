'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const gitBlob=value=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(value)+'\0').update(value).digest('hex');
const root=path.resolve(__dirname,'../..');
const beforeFile=path.join(root,'tests/fixtures/snake-t1-before-ecology-b8ae526.mjs');

test('T1 ecology 2 before-source is the real 2026-11-01 production blob, not a mock',()=>{
  assert.equal(gitBlob(fs.readFileSync(beforeFile,'utf8')),'06a307da365c0a75471c75c43f5f1361ddcfea30');
});

test('T1 integrated scenic ecology has rounded coast stones, rooted ruins, folded fern silhouettes and continuous banks',async()=>{
  const THREE=await import('three');
  const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
  const old=await import('../fixtures/snake-t1-before-ecology-b8ae526.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const before=old.createLivingGarden(THREE,{width,height});
    const scene=createLivingGarden(THREE,{width,height});
    const copy=createLivingGarden(THREE,{width,height});
    try{
      const stats=scene.stats(),prior=before.stats();
      assert.equal(prior.roundedBoulders,undefined,'negative control: old real game had no rounded banks');
      assert.ok(stats.roundedBoulders>=18,'coast must contain three-dimensional naturally rounded rock clusters, not block rows');
      assert.ok(stats.rootRibbons>=16,'ruin stone and bank vegetation must be joined by curved rooted silhouettes');
      assert.ok(stats.fernFronds>=500,'plant diversity must replace cardboard three-triangle fans with curved folded leaflets');
      assert.ok(stats.triangles>prior.triangles&&stats.triangles<22000,'bounded integrated geometry budget must be explicit');
      assert.equal(stats.meshCount,4,'no additional 3D draw objects beyond original four static batches');
      assert.equal(stats.textures,1,'no extra original material texture allocation');
      assert.deepEqual(stats,copy.stats(),'public dimensions, not hidden game state or unseeded randomness, own scenery');
      const moss=scene.group.children.find(mesh=>mesh.name.endsWith('/ moss'));
      const shade=moss.geometry.getAttribute('color'),p=moss.geometry.getAttribute('position');
      const normals=moss.geometry.getAttribute('normal');
      const uniqueColors=new Set(),positionNormals=new Map();let duplicate=0,inconsistent=0;
      for(let i=0;i<shade.count;i++){
        uniqueColors.add([shade.getX(i),shade.getY(i),shade.getZ(i)].map(v=>v.toFixed(4)).join(','));
        const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(4)).join(',');
        const n=[normals.getX(i),normals.getY(i),normals.getZ(i)];
        if(positionNormals.has(key)){
          duplicate++;
          const prev=positionNormals.get(key);
          if(Math.hypot(...n.map((v,j)=>v-prev[j]))>.006)inconsistent++;
        }else positionNormals.set(key,n);
      }
      assert.ok(uniqueColors.size>150,'continuous material gradients rather than five-color faceted shoreline tessellation');
      assert.ok(duplicate>200,'terraces are joined and smoothed as one authored coast');
      assert.equal(inconsistent,0,'shared topographic vertices must not have mismatched per-triangle surface normals');
      for(const mesh of scene.group.children){
        assert.equal(mesh.castShadow,false,'do not expand expensive decorative shadow pass');
        assert.equal(mesh.receiveShadow,true);
        const pos=mesh.geometry.getAttribute('position');
        for(let i=0;i<pos.count;i++){
          const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
          assert.ok([x,y,z].every(Number.isFinite));
          assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,'no false gameplay-cell geometry');
          assert.ok(Math.abs(x)<width/2+15&&Math.abs(z)<height/2+18&&y>=-4&&y<8,'bounded terrain and overgrowth');
        }
      }
    }finally{before.dispose();scene.dispose();copy.dispose();}
  }
});
