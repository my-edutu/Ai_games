'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
test('T1 baseline real live source exact 136e owned stone atlas',()=>{
 assert.equal(blob(fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-before-native-limestone-136e.mjs'),'utf8')),'1e9b11fd4b6024ba8d022e169f63509b8a1a1378');
});
test('T1 multi-sector garden really weaves warm strata into existing 3D-rooted field without new GPU assets or altered cells',async()=>{
 const THREE=await import('three');
 const old=(await import('../fixtures/snake-t1-before-native-limestone-136e.mjs')).createCourtyardEcology;
 const newer=(await import('../../public/snake-stream/courtyard-ecology.mjs')).createCourtyardEcology;
 const {createWorld}=await import('../../public/snake-stream/world.mjs');
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  function build(builder){let world=createWorld(THREE,{width,height}),ecology=builder(THREE,{width,height,world});
   let image=null;world.group.traverse(o=>{if(image||!o.isMesh)return;const m=Array.isArray(o.material)?o.material:[o.material];for(const mat of m){let img=mat?.map?.image;if(img?.width===1024&&img?.height===512)image=img.data;}});
   assert.ok(image,'original shared world-owned stone texture must exist');return {world,ecology,atlas:Buffer.from(image)};}
  const before=build(old),after=build(newer),repeat=build(newer);
  try{
   let changed=0,large=0,pigment=0;for(let y=0;y<512;y+=4)for(let x=0;x<1024;x+=4){let i=(y*1024+x)*4,delta=Math.abs(after.atlas[i]-before.atlas[i])+Math.abs(after.atlas[i+1]-before.atlas[i+1])+Math.abs(after.atlas[i+2]-before.atlas[i+2]);if(delta>20)changed++;if(delta>45)large++;pigment+=after.atlas[i]+after.atlas[i+1]+after.atlas[i+2];}
   assert.ok(changed>4500&&large>2500,`broad real-world different limestone/forest material surfaces expected, got changed=${changed}, large=${large}`);
   assert.deepEqual(after.atlas,repeat.atlas,'one owned original texture must be deterministic');
   assert.deepEqual(after.ecology.stats().triangles,before.ecology.stats().triangles,'never remove existing 3D rooted vegetation');
   assert.equal(after.ecology.stats().meshCount,1);assert.equal(after.ecology.stats().textures,0);
   assert.equal(after.ecology.stats().publicCellsMoved,0);assert.equal(after.ecology.stats().interstitialFernClumps,before.ecology.stats().interstitialFernClumps);
   assert.deepEqual(after.world.stats(),before.world.stats(),'original game cues and all 3D world assets preserved');
  }finally{for(let b of [before,after,repeat]){b.ecology.dispose();b.world.dispose();}}
 }
});
