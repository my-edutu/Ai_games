'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,'public/snake-stream',file),'utf8');
const gitBlob=source=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');
function strip(source,name,indent){
  const begin=indent+'// BEGIN '+name+'\n',end=indent+'// END '+name+'\n';
  const a=source.indexOf(begin),b=source.indexOf(end);
  assert.ok(a>=0&&b>a&&source.indexOf(begin,a+1)<0&&source.indexOf(end,b+1)<0,'unique reversible source: '+name);
  return source.slice(0,a)+source.slice(b+end.length);
}
const oldWorld=strip(read('world.mjs'),'T1 COAST-TO-COURT BIOME CHROMA','      ');
const oldGarden=strip(read('living-garden.mjs'),'T1 STRATIFIED ESCARPMENT SILHOUETTES','    ');
const field=w=>{
  const mesh=w.group.children.find(o=>o.isMesh&&o.material?.map?.image?.width===1024&&o.material.map.image.height===512);
  assert.ok(mesh,'the actual render-bound stone field');return mesh.material.map.image.data;
};
test('T1 new world palette is RED on exact e228 source and GREEN on 3D field, with immutable cues and same original GPU budget',async()=>{
 assert.equal(gitBlob(oldWorld),'5da8528a5895b7d4ba39c38fae3fed266bff711b','byte-exact actual e228 Git world source');
 const THREE=await import('three');
 const before=(await import('data:text/javascript;base64,'+Buffer.from(oldWorld).toString('base64'))).createWorld;
 const after=(await import('../../public/snake-stream/world.mjs')).createWorld;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const a=before(THREE,{width,height}),b=after(THREE,{width,height}),c=after(THREE,{width,height});
  try{
   assert.deepEqual(a.stats(),b.stats(),'no changed GPU resource/draw/cue budget');
   assert.deepEqual(b.stats(),c.stats(),'same deterministic public board/geometry');
   assert.deepEqual(field(b),field(c),'identical world art from identical public size');
   const old=field(a),cur=field(b);
   let changed=0,central=0;const touched=Array.from({length:24},()=>0);
   for(let y=0;y<512;y+=4)for(let x=0;x<1024;x+=4){
    const i=(y*1024+x)*4;
    for(let k=0;k<3;k++)assert.ok(cur[i+k]<=old[i+k],'post-stage chroma must remain strictly subtractive');
    assert.equal(cur[i+3],255,'unchanged opaque actual traversable stone');
    const delta=old[i]-cur[i]+old[i+1]-cur[i+1]+old[i+2]-cur[i+2];
    if(delta>7){changed++;touched[Math.min(23,Math.floor(y/128)*6+Math.floor(x/171))]++;}
    const du=(x+.5)/1024-.52,dv=(y+.5)/512-.5;
    if(Math.hypot(du/.36,dv/.38)<.48){assert.equal(delta,0,'sunlit game landmark cannot darken');central++;}
   }
   assert.ok(central>700);
   if(width===28){
    assert.ok(changed>1700,'real full-width mosaic, never an isolated pixel tweak');
    assert.ok(touched.filter(n=>n>35).length>=7,'multiple complete outdoor biome catchments');
   }
   const frame=Object.freeze({food:Object.freeze({cell:19}),hazards:Object.freeze([{cell:33,active:true}]),
     portals:Object.freeze([{entry:8,exit:width*height-2}]),obstacles:Object.freeze([11])});
   const baseline=JSON.stringify(frame);
   for(const reducedMotion of [false,true]){a.update(frame,{time:11,reducedMotion});b.update(frame,{time:11,reducedMotion});}
   assert.equal(JSON.stringify(frame),baseline);
   assert.deepEqual(a.stats(),b.stats());
  }finally{a.dispose();b.dispose();c.dispose();}
 }
});
test('T1 eight repainted high-cut 3D escarpments remain outside every gameplay cell; strict 22k / four batches / one texture unchanged',async()=>{
 assert.notEqual(gitBlob(oldGarden),gitBlob(read('living-garden.mjs')),
     'current-head cliff profile materially changes source');
 assert.equal(gitBlob(fs.readFileSync(path.join(root,'tests/fixtures/snake-t1-historical-strata-1a8.mjs'),'utf8')),
     '1a8fec973bbe5bca82246ec630ced30984073020',
     'the exact historical feature-parent Git blob, independently frozen alongside current reversible verification');
 const THREE=await import('three');
 const before=(await import('data:text/javascript;base64,'+Buffer.from(oldGarden).toString('base64'))).createLivingGarden;
 const after=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const a=before(THREE,{width,height}),b=after(THREE,{width,height}),c=after(THREE,{width,height});
  try{
   assert.deepEqual(a.stats(),b.stats(),'reprofile original world only, no extra vertices/resources');
   assert.deepEqual(b.stats(),c.stats(),'no unseeded geometry or color');
   assert.equal(b.stats().meshCount,4);
   assert.equal(b.stats().textures,1);
   assert.ok(b.stats().triangles<22000,'retain actual original 40x24 quality budget');
   let moved=0,repainted=0;
   const quadrants=new Set();
   for(let layer=0;layer<b.group.children.length;layer++){
    const prev=a.group.children[layer].geometry,now=b.group.children[layer].geometry;
    const pos=now.getAttribute('position'),colour=now.getAttribute('color');
    const oldPos=prev.getAttribute('position'),oldCol=prev.getAttribute('color');
    assert.equal(pos.count,oldPos.count);
    for(let k=0;k<pos.count;k++){
      const x=pos.getX(k),y=pos.getY(k),z=pos.getZ(k);
      assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
      assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,'no false gameplay blocker');
      assert.ok(Math.abs(x)<width/2+15&&Math.abs(z)<height/2+18&&y>=-4&&y<8,'real camera/fog bounds');
      const distance=Math.hypot(x-oldPos.getX(k),y-oldPos.getY(k),z-oldPos.getZ(k));
      const pigment=Math.abs(colour.getX(k)-oldCol.getX(k))+Math.abs(colour.getY(k)-oldCol.getY(k))+Math.abs(colour.getZ(k)-oldCol.getZ(k));
      if(distance>.1){
        moved++;
        if(x<-width/2-1)quadrants.add('west');
        if(x>width/2+1)quadrants.add('east');
        if(z<-height/2-1)quadrants.add('north');
        if(z>height/2+1)quadrants.add('south');
      }
      if(pigment>.03)repainted++;
    }
   }
   assert.ok(moved>180,'substantial genuine sculpted rocky silhouette, not changing only pixels');
   assert.ok(repainted>180,'matching source material re-authored alongside geology');
   assert.deepEqual([...quadrants].sort(),['east','north','south','west']);
  }finally{a.dispose();b.dispose();c.dispose();}
 }
});
