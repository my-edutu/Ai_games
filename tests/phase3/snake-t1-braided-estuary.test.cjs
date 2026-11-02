'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const file=name=>fs.readFileSync(path.join(root,'public/snake-stream',name),'utf8');
const sha=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
function undo(s,label,indent){
 const b=indent+'// BEGIN '+label+'\n',e=indent+'// END '+label+'\n';
 const i=s.indexOf(b),j=s.indexOf(e);
 assert.ok(i>=0&&j>i&&s.indexOf(b,i+1)===-1&&s.indexOf(e,j+1)===-1,'one genuine new geometry or whole-field block '+label);
 return s.slice(0,i)+s.slice(j+e.length);
}
const field=w=>{
 const m=w.group.children.find(v=>v.isMesh&&v.material?.map?.image?.width===1024&&v.material.map.image.height===512);
 assert.ok(m,'actual live 3D field');return m.material.map.image.data;
};
test('T1 estuary fixed-parent RED control, deterministic full-field weathering, no new GPU or gameplay budget',async()=>{
 const source=file('world.mjs');
 const old=undo(source,'T1 BRAIDED ESTUARY WHOLE-FIELD','      ');
 assert.equal(sha(old),'862d9e879dc7ebd814e7041b59372e1984b04ded','actual current Git predecessor, never a painted synthetic baseline');
 const THREE=await import('three');
 const before=(await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'))).createWorld;
 const after=(await import('../../public/snake-stream/world.mjs')).createWorld;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const a=before(THREE,{width,height}),b=after(THREE,{width,height}),repeat=after(THREE,{width,height});
  try{
   assert.deepEqual(a.stats(),b.stats());assert.deepEqual(b.stats(),repeat.stats());
   assert.deepEqual(a.cameraOccluders,b.cameraOccluders);
   const oldField=field(a),newField=field(b);
   assert.deepEqual(newField,field(repeat));
   let touched=0,protectedHeart=0;const regions=Array.from({length:24},()=>({sum:0,count:0}));
   for(let y=0;y<512;y+=3)for(let x=0;x<1024;x+=3){
    const i=(y*1024+x)*4,du=(x+.5)/1024-.52,dv=(y+.5)/512-.50;
    const delta=(oldField[i]-newField[i]+oldField[i+1]-newField[i+1]+oldField[i+2]-newField[i+2])/3;
    for(let c=0;c<3;c++)assert.ok(newField[i+c]<=oldField[i+c],
      'all post-stage original 3D garden pigment must be subtractive, not invent bright gameplay cues');
    assert.equal(newField[i+3],255);
    const ix=Math.min(5,Math.floor(x/171)),iy=Math.min(3,Math.floor(y/128)),r=regions[iy*6+ix];r.sum+=delta;r.count++;
    if(delta>10)touched++;
    if(Math.hypot(du/.36,dv/.38)<.48){assert.equal(delta,0,'sunlit original central garden landmark remains unchanged');protectedHeart++;}
   }
   assert.ok(protectedHeart>1200);
   if(width===28){
    assert.ok(touched>4200,'full-scene braided catchments affect more than a small pixel patch');
    assert.ok(regions.filter(r=>r.sum/r.count>5).length>=8,
      'coast-to-coast effect should occupy many sectors, not a perimeter tint');
   }
   const actual=Object.freeze({food:Object.freeze({cell:18}),portals:Object.freeze([{entry:4,exit:width*height-2}]),
    hazards:Object.freeze([{cell:12,active:true}]),obstacles:Object.freeze([7])});
   const fingerprint=JSON.stringify(actual);
   for(const reducedMotion of [false,true]){
    a.update(actual,{time:4,reducedMotion});b.update(actual,{time:4,reducedMotion});
    assert.deepEqual(a.stats(),b.stats());
   }
   assert.equal(JSON.stringify(actual),fingerprint);
  }finally{a.dispose();b.dispose();repeat.dispose();}
 }
});
test('T1 physically curved eight escarpments are exact-parent source-reversible, outboard and budget-neutral',async()=>{
 const present=file('living-garden.mjs'),previous=undo(present,'T1 CURVED GEOLOGICAL COAST','    ');
 assert.equal(sha(previous),'f478a8c6593d7ff89429599f0edbe0314b83e3b6',
   'byte-exact true prior shoreline Git blob');
 const THREE=await import('three');
 const old=(await import('data:text/javascript;base64,'+Buffer.from(previous).toString('base64'))).createLivingGarden;
 const next=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const a=old(THREE,{width,height}),b=next(THREE,{width,height}),repeat=next(THREE,{width,height});
  try{
   assert.deepEqual(b.stats(),a.stats(),'never buy visuals by increasing the original render/geometry footprint');
   assert.deepEqual(b.stats(),repeat.stats());
   assert.equal(b.stats().meshCount,4);assert.equal(b.stats().textures,1);
   assert.ok(b.stats().triangles<22000,'strict unchanged maximum garden triangles');
   let curved=0;const banks=new Set();
   for(let j=0;j<b.group.children.length;j++){
    const bp=b.group.children[j].geometry.attributes.position,ap=a.group.children[j].geometry.attributes.position;
    assert.equal(bp.count,ap.count);
    for(let k=0;k<bp.count;k++){
     const x=bp.getX(k),y=bp.getY(k),z=bp.getZ(k),d=Math.hypot(x-ap.getX(k),y-ap.getY(k),z-ap.getZ(k));
     assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
     assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,'no scenic geometry enters a playable cell');
     assert.ok(Math.abs(x)<width/2+15&&Math.abs(z)<height/2+18&&y>=-4&&y<8,'original fog and close-camera bounds');
     if(d>.10){curved++; if(x<-width/2-1)banks.add('west');if(x>width/2+1)banks.add('east');
       if(z<-height/2-1)banks.add('north');if(z>height/2+1)banks.add('south');}
    }
   }
   assert.ok(curved>300,'hundreds of real rock triangles must curve, not a decorative tint');
   assert.deepEqual([...banks].sort(),['east','north','south','west']);
  }finally{a.dispose();b.dispose();repeat.dispose();}
 }
});
