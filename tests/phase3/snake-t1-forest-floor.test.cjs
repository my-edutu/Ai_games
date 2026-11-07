'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const file=path.resolve(__dirname,'../../public/snake-stream/world.mjs');
const begin='      // BEGIN T1 WETLAND MASONRY PATINA\n',end='      // END T1 WETLAND MASONRY PATINA\n';
const gitBlob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const court=w=>{const m=w.group.children.find(o=>o.isMesh&&o.material?.map?.image?.width===1024&&o.material.map.image.height===512);assert.ok(m);return m;};
test('T1 forest floor reclaims the complete traversable quarry with differentiated authored stone/fern/meadow regions, unchanged gameplay and GPU budgets',async()=>{
 const code=fs.readFileSync(file,'utf8'),i=code.indexOf(begin),j=code.indexOf(end);
 assert.ok(i>0&&j>i&&code.indexOf(begin,i+1)===-1&&code.indexOf(end,j+1)===-1,'one source-reversible ecosystem material block');
 const predecessor=code.slice(0,i)+code.slice(j+end.length);
 assert.equal(gitBlob(predecessor),'0f69c6ae6324d7fcfa6e0c1e9659fc4be37cc66d','exact immutable pre-wetland Git original and not an invented visual baseline');
 assert.match(code,/BEGIN T1 ORGANIC QUARRY FLOOR/,'real source contains cohesive large-area authored composition');
 const THREE=await import('three');
 const old=(await import('data:text/javascript;base64,'+Buffer.from(predecessor).toString('base64'))).createWorld;
 const current=(await import('../../public/snake-stream/world.mjs')).createWorld;
 for(const [width,height] of [[28,16],[8,8],[40,24]]){
  const a=old(THREE,{width,height}),b=current(THREE,{width,height}),copy=current(THREE,{width,height});
  try{
   const o=court(a),n=court(b),r=court(copy),p=o.material.map.image.data,q=n.material.map.image.data;
   assert.deepEqual(a.stats(),b.stats(),'no new textures/materials/static meshes/draw objects despite whole-floor authored recollection');
   assert.deepEqual(b.stats(),copy.stats());assert.deepEqual(a.cameraOccluders,b.cameraOccluders);
   for(const k of ['position','normal','uv','index']){
    const aa=k==='index'?o.geometry.index?.array:o.geometry.getAttribute(k)?.array;
    const bb=k==='index'?n.geometry.index?.array:n.geometry.getAttribute(k)?.array;
    assert.deepEqual(bb,aa,'public cell and cue presentation geometry unchanged: '+k);
   }
   assert.deepEqual(q,r.material.map.image.data,'no random/nonseeded material drift');
   let total=0,loss=0,turned=0,amber=0,emerald=0,shadow=0,edge=0;
   for(let y=0;y<512;y+=2)for(let x=0;x<1024;x+=2){
    const gx=(x+.5)/1024*width,gz=(y+.5)/512*height,border=Math.min(gx,gz,width-gx,height-gz),idx=(y*1024+x)*4;
    if(border<2.45){edge++;continue;}
    total++;
    for(let c=0;c<3;c++)assert.ok(q[idx+c]<=p[idx+c],'new pigment never creates false bright fruit, portal or hazard markers');
    assert.equal(q[idx+3],255,'playable floor remains opaque');
    const oldMean=(p[idx]+p[idx+1]+p[idx+2])/3,newMean=(q[idx]+q[idx+1]+q[idx+2])/3;
    loss+=oldMean-newMean;
    turned+=oldMean-newMean>26;
    amber+=q[idx]>q[idx+1]+5;
    emerald+=q[idx+1]>q[idx]+22;
    shadow+=newMean<85;
   }
   if(width===28){
    assert.ok(loss/total>28,'large whole-garden albedo shift, not small edge pixel modifications: '+(loss/total));
    assert.ok(turned/total>.57,'authored weathering must affect majority of playable field: '+(turned/total));
    assert.ok(amber/total>.10,'clearly recognizable warm old sandstone terraces, not monochrome green: '+(amber/total));
    assert.ok(emerald/total>.34,'lush moss/ecology visible at real board scale: '+(emerald/total));
    assert.ok(shadow/total>.23,'substantial shaded soil and rock surface area: '+(shadow/total));
   }
   const publicFrame=Object.freeze({obstacles:Object.freeze([13]),food:Object.freeze({cell:3}),hazards:Object.freeze([{cell:10,active:true}]),portals:Object.freeze([{entry:9,exit:width*height-6}])});
   const fingerprint=JSON.stringify(publicFrame);
   for(const reducedMotion of [true,false]){a.update(publicFrame,{time:4,reducedMotion});b.update(publicFrame,{time:4,reducedMotion});assert.deepEqual(a.stats(),b.stats());}
   assert.equal(JSON.stringify(publicFrame),fingerprint,'scene remains presentation only');
  }finally{a.dispose();b.dispose();copy.dispose();}
 }
});
