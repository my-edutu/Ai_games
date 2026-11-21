'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '../..');
const hash = s => crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const freeze = (x) => Object.freeze(x);
const dist = p => Math.hypot(p.offset.x,p.offset.y,p.offset.z);

test('T1 RED original Git tree fixtures remain genuine and immutable',()=>{
 const originals=[
  ['snake-t1-before-stage-bcfc.mjs','9a3e295d376b4e57a64ba7e17ddb3a9936aaf220'],
  ['snake-t1-before-camera-bcfc.mjs','72625ade5dc2e9d46e285041dfefdbc9623adc49'],
  ['snake-t1-before-serpent-bcfc.mjs','4f233d9a0033fb3ed13a8e5a83232e409cd863b5'],
 ];
 for(const [name,expected] of originals)
  assert.equal(hash(fs.readFileSync(path.join(ROOT,'tests/fixtures',name),'utf8')),expected,name);
});

test('T1 source-exact forest re-staging changes the whole rear horizon mass, keeping every true cell and the full static resource budget',async()=>{
 const THREE=await import('three');
 const before=(await import('../fixtures/snake-t1-before-stage-bcfc.mjs')).createLivingGarden;
 const after=(await import('../../public/snake-stream/living-garden.mjs')).createLivingGarden;
 for(const [width,height] of [[8,8],[28,16],[40,24]]){
  const W=width/2,H=height/2;
  const old=before(THREE,{width,height}),now=after(THREE,{width,height}),repeat=after(THREE,{width,height});
  const mass=scene=>{
   let nearHigh=0,invalid=0;
   for(const mesh of scene.group.children){
    const p=mesh.geometry.getAttribute('position');
    for(let i=0;i<p.count;i++){
     const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
     if(y>4.3&&z<-H-1&&z>-H-8&&Math.abs(x)<W+3)nearHigh++;
     if(![x,y,z].every(Number.isFinite)||
        !(x<-W-.9||x>W+.9||z<-H-.9||z>H+.9)||
        !(Math.abs(x)<W+15&&Math.abs(z)<H+18&&y>=-4&&y<8))invalid++;
    }
   }
   return {nearHigh,invalid};
  };
  try{
   const prior=old.stats(),current=now.stats(),measureBefore=mass(old),measureAfter=mass(now);
   assert.ok(measureBefore.nearHigh<900,'real old forest is insufficiently staged: '+measureBefore.nearHigh);
   assert.ok(measureAfter.nearHigh>900&&measureAfter.nearHigh>measureBefore.nearHigh*4,
    'large coherent above-board rear-canopy silhouette must be genuinely re-staged');
   assert.equal(measureAfter.invalid,0,'every physical vertex remains finite, off-board and in original scenic envelope');
   assert.equal(current.triangles,prior.triangles,'reuse every pre-existing physically authored triangle, never delete rich world assets');
   assert.ok(current.triangles<22000,'original static garden budget unchanged');
   assert.equal(current.meshCount,4);assert.equal(current.textures,1);
   for(const key of ['littoralGroveClumps','fernFronds','waterGardenPads','canopyLeaflets','arcadeArches','hangingVines'])
    assert.equal(current[key],prior[key],key+' remains fully detailed');
   assert.deepEqual(current,repeat.stats(),'world uses public board dimensions only');
   for(let m=0;m<now.group.children.length;m++)
    for(const key of ['position','normal','uv','color'])
     assert.deepEqual(now.group.children[m].geometry.getAttribute(key).array,
      repeat.group.children[m].geometry.getAttribute(key).array,'static deterministic '+key);
  }finally{old.dispose();now.dispose();repeat.dispose();}
 }
});

test('T1/T2 real follow camera brings original protagonist closer without cropping or altering full-board overview and public target',async()=>{
 const old=(await import('../fixtures/snake-t1-before-camera-bcfc.mjs')).cameraComposition;
 const current=(await import('../../public/snake-stream/camera.mjs')).cameraComposition;
 for(const aspect of [16/9,390/844]){
  const args=freeze({width:28,height:16,aspect,mode:'follow',
   head:freeze({x:5,z:-4}),direction:freeze({x:0,z:1})});
  const before=old(args),after=current(args);
  assert.ok(dist(before)>=13,'old source has the less-legible long follow shot');
  assert.ok(dist(after)>10&&dist(after)<13&&dist(after)<dist(before)*.84,'hero should occupy materially more screen area');
  assert.deepEqual(after.target,before.target,'camera uses exact unchanged public head');
  assert.deepEqual(current({...args,mode:'overview'}),old({...args,mode:'overview'}),
   'unchanged always-accessible full-board overview and portrait fit');
  assert.deepEqual(current({...args,food:freeze({x:6,z:-4})}),after,
   'follow shot cannot make hidden plans or move toward fruit');
 }
});

test('T2 real tube adds travelling elastic girth to the existing lateral wave without extra resources, false portal links or reduced-motion activity',async()=>{
 const THREE=await import('three');
 const baseline=(await import('../fixtures/snake-t1-before-serpent-bcfc.mjs')).createSerpent;
 const current=(await import('../../public/snake-stream/serpent.mjs')).createSerpent;
 const path=freeze(Array.from({length:12},(_,i)=>freeze({x:0,z:i})));
 const paths=freeze([path]);
 const a=baseline(THREE),b=current(THREE);
 const read=(model,time,reducedMotion=false)=>{
  model.update(paths,{detail:'low',time,delta:1/60,reducedMotion,
   direction:{x:0,z:-1},runToken:'source-matched',eating:0,danger:0});
  const p=model.group.getObjectByName('Continuous sculpted serpent body').geometry.getAttribute('position');
  const rings=model.stats().bodyRings,values=[];
  for(let r=6;r<rings-6;r++){
   const upper=p.getY(r*9+2),lower=p.getY(r*9+6);
   values.push((upper-lower)/1.76);
   assert.ok(lower>=.01&&lower<=.05,'changing ring girth must retain floor contact');
  }
  return values;
 };
 const amplitude=(model,reduced)=>{
  const x=read(model,.1,reduced),y=read(model,1.15,reduced);
  assert.equal(x.length,y.length);
  return Math.max(...x.map((v,i)=>Math.abs(v-y[i])));
 };
 try{
  const oldAmplitude=amplitude(a,false),newAmplitude=amplitude(b,false);
  assert.ok(oldAmplitude<1e-5,'actual exact prior body only laterally flexes');
  assert.ok(newAmplitude>.008,'new chest and trunk have meaningful travelled compression: '+newAmplitude);
  assert.ok(amplitude(b,true)<1e-5,'reduced motion is completely still');
  assert.deepEqual(b.stats().bufferBytes,a.stats().bufferBytes,'identical preallocated GPU body buffers');
  for(const key of ['geometries','materials','textures'])
   assert.equal(b.stats()[key],a.stats()[key],'no added object draws or texture cost: '+key);
  assert.equal(JSON.stringify(paths),JSON.stringify(freeze([path])),'body renderer never mutates public route');
  b.update([[{x:0,z:0},{x:0,z:1}],[{x:8,z:6},{x:8,z:7}]],
   {detail:'low',time:2,delta:1/60,runToken:'source-matched'});
  assert.equal(b.stats().paths,2,'never bridge discontinuous portal fragments');
 }finally{a.dispose();b.dispose();}
});
