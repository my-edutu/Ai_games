'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const sha=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const src=name=>fs.readFileSync(path.join(root,'public/snake-stream',name),'utf8');
function undo(s,marker,indent){
 const start=indent+'// BEGIN '+marker+'\n',end=indent+'// END '+marker+'\n';
 const a=s.indexOf(start),b=s.indexOf(end);
 assert.ok(a>=0&&b>a&&s.indexOf(start,a+1)===-1&&s.indexOf(end,b+1)===-1,'unique '+marker);
 return s.slice(0,a)+s.slice(b+end.length);
}
const court=w=>{const t=w.group.children.find(m=>m.isMesh&&m.material?.map?.image?.width===1024&&m.material.map.image.height===512);assert.ok(t);return t.material.map.image.data;};
test('T1 source-controlled old d16 quarry versus newly sunlit terraces: real atlas, authority and no new GPU assets',async()=>{
 const present=src('world.mjs');
 const old=undo(undo(undo(present,'T1 RECLAIMED GARDEN COMPOSITION','      '),'T1 TERRACE TONE CAPTURE','      '),'T1 SUNLIT SCARRED TERRACES','      ');
 assert.equal(sha(old),'39f89dda13f6cb14b3b1977d5cac91b80b81bbcd');
 const THREE=await import('three');
 const earlier=(await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'))).createWorld;
 const newer=(await import('../../public/snake-stream/world.mjs')).createWorld;
 for(const [width,height] of [[28,16],[8,8],[40,24]]){
  const a=earlier(THREE,{width,height}),b=newer(THREE,{width,height}),c=newer(THREE,{width,height});
  try{
   assert.deepEqual(a.stats(),b.stats(),'same complete world draw/resource/portal/hazard budget');
   const p=court(a),q=court(b);
   assert.deepEqual(q,court(c),'no runtime RNG or authored atlas nondeterminism');
   let changed=0,brighter=0,centerOld=0,centerNew=0,count=0;
   for(let y=0;y<512;y+=2)for(let x=0;x<1024;x+=2){
    const k=(y*1024+x)*4;
    assert.equal(q[k+3],255,'all public traversable cells remain opaque');
    if(q[k]!==p[k]||q[k+1]!==p[k+1]||q[k+2]!==p[k+2])changed++;
    if(q[k]>p[k]+20)brighter++;
    const gx=(x+.5)/1024,gz=(y+.5)/512;
    if(Math.hypot((gx-.52)/.35,(gz-.49)/.35)<.65){
     centerOld+=(p[k]+p[k+1]+p[k+2])/3;
     centerNew+=(q[k]+q[k+1]+q[k+2])/3;count++;
    }
   }
   if(width===28){
    assert.ok(changed>25000,'large authored world composition, not sparse decorative dots');
    assert.ok(brighter>3000,'actual sunlit old limestone returns in a broad natural mass');
    assert.ok((centerNew-centerOld)/count>19,'replaces the unnatural black central stain');
   }
   const state=Object.freeze({hazards:Object.freeze([{cell:7,active:true}]),food:Object.freeze({cell:18}),portals:Object.freeze([{entry:5,exit:width*height-2}])});
   a.update(state,{time:11,reducedMotion:true});b.update(state,{time:11,reducedMotion:true});
   assert.deepEqual(a.stats(),b.stats());assert.deepEqual(state.portals,[{entry:5,exit:width*height-2}]);
  }finally{a.dispose();b.dispose();c.dispose();}
 }
});
test('T1 same-source 8 physically re-profiled shoreline landmarks, exact resources and geometry authority',async()=>{
 const present=src('living-garden.mjs');
 const old=undo(undo(undo(present,'T1 BROKEN SHORE SHELF STAGING','    '),'T1 TERRACED MASS CAPTURE','    '),'T1 TERRACED MASS REPROFILE','    ');
 assert.equal(sha(old),'f5bbb7a56684ede60c117e2de16742abf2f70ee0');
 const THREE=await import('three');
 const earlier=(await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'))).createLivingGarden;
 const newer=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const a=earlier(THREE,{width,height}),b=newer(THREE,{width,height}),c=newer(THREE,{width,height});
  try{
   assert.deepEqual(a.stats(),b.stats(),'no triangle, batch, texture or resource increase');
   assert.deepEqual(b.stats(),c.stats());
   assert.ok(b.stats().triangles<22000,'unchanged strict whole-garden geometry budget');
   let moved=0;
   for(let j=0;j<b.group.children.length;j++){
    const p=a.group.children[j].geometry.attributes.position;
    const q=b.group.children[j].geometry.attributes.position;
    assert.equal(q.count,p.count);
    for(let k=0;k<p.count;k++){
     const x=q.getX(k),y=q.getY(k),z=q.getZ(k);
     assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
     assert.ok(x<-width/2-.9||x>width/2+.9||z<-height/2-.9||z>height/2+.9,
      'original public board cells/portals/hazards remain physically clear');
     if(Math.hypot(x-p.getX(k),y-p.getY(k),z-p.getZ(k))>.025)moved++;
    }
   }
   assert.ok(moved>180,'real multi-landmark authored 3D topography, not an isolated pixel change');
  }finally{a.dispose();b.dispose();c.dispose();}
 }
});
