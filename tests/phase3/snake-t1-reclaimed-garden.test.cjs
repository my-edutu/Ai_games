'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const src=name=>fs.readFileSync(path.join(root,'public/snake-stream',name),'utf8');
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
function remove(s,label,indent){
 const begin=indent+'// BEGIN '+label+'\n',end=indent+'// END '+label+'\n';
 const a=s.indexOf(begin),b=s.indexOf(end);
 assert.ok(a>=0&&b>a,'uniquely marked authentic previous source: '+label);
 assert.equal(s.indexOf(begin,a+1),-1);assert.equal(s.indexOf(end,b+1),-1);
 return s.slice(0,a)+s.slice(b+end.length);
}
function field(w){
 const mesh=w.group.children.find(o=>o.isMesh&&o.material?.map?.image?.width===1024&&o.material.map.image.height===512);
 assert.ok(mesh,'actual live 3D playing field exists');return mesh.material.map.image.data;
}
test('T1 reclaimed garden: genuine predecessor, twenty-four area palette cells and truthful world resource/authority invariants',async()=>{
 const source=src('world.mjs'),old=remove(source,'T1 RECLAIMED GARDEN COMPOSITION','      ');
 assert.equal(gitBlob(old),'f687f828c211dcd565f2a42a04d7e3be45cad776','byte-exact actual 3d736eb parent');
 const THREE=await import('three');
 const original=(await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'))).createWorld;
 const current=(await import('../../public/snake-stream/world.mjs')).createWorld;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const prev=original(THREE,{width,height}),now=current(THREE,{width,height}),repeat=current(THREE,{width,height});
  try{
   assert.deepEqual(now.stats(),prev.stats(),'same geometry, GPU budget, public markers and gameplay resources');
   assert.deepEqual(now.stats(),repeat.stats());
   const a=field(prev),b=field(now);
   assert.deepEqual(b,field(repeat),'original palette authored deterministically');
   let changed=0;const regions=Array.from({length:24},()=>({delta:0,total:0}));
   for(let y=0;y<512;y+=4)for(let x=0;x<1024;x+=4){
    const i=(y*1024+x)*4,delta=(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]))/3;
    const group=Math.floor(y/128)*6+Math.floor(x/171);
    const region=regions[Math.min(23,group)];region.delta+=delta;region.total++;
    if(delta>10)changed++;
    assert.equal(b[i+3],255,'no alpha gaps in traversable actual stone');
    for(let channel=0;channel<3;channel++)assert.ok(b[i+channel]<=a[i+channel]+51,
     'no unbounded bright cues or glowing false fruit/portal on playing stone');
   }
   if(width>=28){
    assert.ok(changed>18500,'multi-biome whole board is visibly regraded, not an isolated atlas speck');
    assert.ok(regions.filter(r=>r.delta/r.total>12).length>=14,'large 6x4 spatial coverage survives downsampling');
   }
   const snapshot=Object.freeze({obstacles:Object.freeze([6]),hazards:Object.freeze([{cell:11,active:true}]),
    food:Object.freeze({cell:18}),portals:Object.freeze([{entry:2,exit:width*height-3}])});
   const immutable=JSON.stringify(snapshot);
   prev.update(snapshot,{time:11,reducedMotion:false});now.update(snapshot,{time:11,reducedMotion:false});
   assert.deepEqual(now.stats(),prev.stats());assert.equal(JSON.stringify(snapshot),immutable);
  }finally{prev.dispose();now.dispose();repeat.dispose();}
 }
});
test('T1 reclaimed garden: eight existing real shore shelves, complete clearance, original strict 22k geometry ceiling',async()=>{
 const source=src('living-garden.mjs'),old=remove(source,'T1 BROKEN SHORE SHELF STAGING','    ');
 assert.equal(gitBlob(old),'600f7f9346040f0182d0866ee70bdb54dc7e2148','byte-exact old original production garden');
 const THREE=await import('three');
 const original=(await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'))).createLivingGarden;
 const current=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const prev=original(THREE,{width,height}),now=current(THREE,{width,height});
  try{
   assert.deepEqual(now.stats(),prev.stats(),'unchanged triangles, texture, meshes, all original living ecology');
   assert.equal(now.stats().terracedPromontories,8);
   assert.equal(now.stats().meshCount,4);assert.equal(now.stats().textures,1);
   assert.ok(now.stats().triangles<22000,'unchanged literal maximum geometry budget');
   let changed=0;
   for(let i=0;i<now.group.children.length;i++){
    const before=prev.group.children[i].geometry.attributes.position;
    const after=now.group.children[i].geometry.attributes.position;
    assert.equal(before.count,after.count);
    for(let j=0;j<after.count;j++){
     const x=after.getX(j),y=after.getY(j),z=after.getZ(j);
     assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
     assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,
      'no newly authored landform intrudes into any public cell');
     if(Math.abs(y-before.getY(j))>.1)changed++;
    }
   }
   assert.ok(changed>700,'multiple whole-formation rock silhouettes physically resculpted');
  }finally{prev.dispose();now.dispose();}
 }
});
