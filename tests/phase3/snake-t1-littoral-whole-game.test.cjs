'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');

test('T1 authentic parent RED and coherent four-shore real-geometry GREEN, deterministic and cue-safe',async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../fixtures/snake-t1-pre-littoral-b127.mjs'),'utf8');
 assert.equal(blob(source),'ff3e631ba4cba768a89e4b39123c2a2ce68216b3');
 const THREE=await import('three');
 const {createLivingGarden}=await import('../../public/snake-stream/living-garden.mjs');
 const old=(await import('../fixtures/snake-t1-pre-littoral-b127.mjs')).createLivingGarden;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const previous=old(THREE,{width,height}),current=createLivingGarden(THREE,{width,height}),repeat=createLivingGarden(THREE,{width,height});
  try{
   const before=previous.stats(),after=current.stats();
   assert.equal(before.littoralGroveClumps,undefined,'real negative parent source');
   assert.equal(after.littoralGroveClumps,72,'three rooted crowns in each of twenty-four real shoreline beds');
   assert.equal(after.littoralGroveBoulders,12);
   assert.equal(after.fernFronds-before.fernFronds,width*height>600?206:360,
     'high-area analytic shore LOD preserves a net increase in authored fern fronds');
   assert.equal(after.roundedBoulders-before.roundedBoulders,width*height>600?4:12,
     'the high-area native garden retains more actual rooted stones than the real parent');
   assert.equal(after.triangles-before.triangles,width*height>600?-212:1860,
     'exact real-parent geometry census including high-area terrain LOD, not a relaxed budget');
   assert.ok(after.fernFronds>before.fernFronds);
   assert.ok(after.roundedBoulders>before.roundedBoulders);
   assert.ok(after.triangles<22000,'original complete static-garden geometry ceiling');
   assert.equal(after.meshCount,4);assert.equal(after.textures,1);
   for(const key of ['waterGardenPads','waterGardenRushes','waterGardenBlooms','shoreSections'])
    assert.equal(after[key],before[key],'preserve living-water features: '+key);
   assert.deepEqual(after,repeat.stats(),'same board gives identical art and resource count');
   for(let i=0;i<current.group.children.length;i++){
    const mesh=current.group.children[i],copy=repeat.group.children[i];
    assert.equal(mesh.castShadow,false);assert.equal(mesh.receiveShadow,true);
    assert.equal(mesh.userData.staticWorld,true);
    for(const attr of ['position','color','normal'])
     assert.deepEqual(mesh.geometry.getAttribute(attr).array,copy.geometry.getAttribute(attr).array,'source-deterministic '+attr);
    const p=mesh.geometry.getAttribute('position');
    for(let n=0;n<p.count;n++){
     const x=p.getX(n),y=p.getY(n),z=p.getZ(n);
     assert.ok([x,y,z].every(Number.isFinite));
     assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,'never fake a real cell, fruit, hazard, portal or serpent position');
     assert.ok(Math.abs(x)<width/2+15&&Math.abs(z)<height/2+18&&y>=-4&&y<8,'bounded scenic volume');
    }
   }
  }finally{previous.dispose();current.dispose();repeat.dispose();}
 }
});

test('the genuine strict one-second seventeen FULL render gate is not changed',()=>{
 const root=path.resolve(__dirname,'../..');
 const browser=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
 assert.match(browser,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
 const art=fs.readFileSync(path.join(root,'public/snake-stream/living-garden.mjs'),'utf8');
 assert.doesNotMatch(art,/Math\.random\(|requestAnimationFrame\(|AudioContext/);
});
