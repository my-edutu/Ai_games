'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {restorePreR48}=require('../helpers/snake-r45-archive.cjs');
const sourcePath=path.resolve(__dirname,'../../public/snake-stream/serpent.mjs');
const blob=s=>crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const body=Object.freeze(Array.from({length:6},(_,i)=>Object.freeze({x:0,z:-i})));
const headOf=s=>{const h=s.group.getObjectByName('Expressive head');assert.ok(h?.isGroup);return {h,p:h.children[0]};};
test('R48 exact Git parent RED control and existing-head danger priority without new geometry',async()=>{
 const source=fs.readFileSync(sourcePath,'utf8'),old=restorePreR48(source);
 assert.equal(blob(old),'3c05c3720e5cbe0eb767c48783fd58d303d19bba');
 const THREE=await import('three'),{createSerpent:previous}=await import('data:text/javascript;base64,'+Buffer.from(old).toString('base64'));
 const {createSerpent:current}=await import('../../public/snake-stream/serpent.mjs');
 const a=previous(THREE),b=current(THREE),frozen=JSON.stringify(body);
 const base={direction:{x:0,z:1},runToken:'first',reducedMotion:true,food:{x:3,z:3},
  delta:1/60,time:3,detail:'high',danger:0,eating:0};
 try{
  a.update([body],base);b.update([body],base);
  assert.equal(headOf(a).p.rotation.y,headOf(b).p.rotation.y,'calm fruit glance unchanged');
  assert.equal(headOf(a).p.rotation.x,headOf(b).p.rotation.x,'calm pitch unchanged');
  assert.deepEqual(a.stats().gaze,b.stats().gaze,'calm pupils unchanged');
  a.update([body],{...base,danger:1});b.update([body],{...base,danger:1});
  assert.ok(headOf(a).p.rotation.y>0.1,'real original looks at fruit during active danger');
  assert.equal(headOf(b).p.rotation.y,0,'urgent danger returns skull forward');
  assert.ok(Math.abs(headOf(b).p.rotation.x-0.09)<1e-9,'bounded original skull duck');
  assert.ok(Math.abs(headOf(a).h.position.y-headOf(b).h.position.y-0.018)<1e-9,'head remains grounded');
  assert.ok(a.stats().gaze.horizontal>0.015,'old pupils fixated on fruit');
  assert.deepEqual(b.stats().gaze,{horizontal:0,vertical:0},'eyes snap to alert sightline');
  for(const key of ['geometries','materials','textures','bufferBytes','bodyRings','bodyVertices','bodyTriangles','paths','maxBodyRings','truncated'])
   assert.equal(a.stats()[key],b.stats()[key],'exact parent resource/path parity '+key);
  assert.equal(JSON.stringify(body),frozen,'authoritative public path immutable');
 }finally{a.dispose();b.dispose();}
});
test('R48 all headings, public eating, reduced motion, teleport/restart, no path bridge or resource leak',async()=>{
 const THREE=await import('three'),{createSerpent}=await import('../../public/snake-stream/serpent.mjs');
 for(const direction of [{x:0,z:1},{x:1,z:0},{x:0,z:-1},{x:-1,z:0}]){
  const s=createSerpent(THREE);
  const primary=Object.freeze(Array.from({length:6},(_,i)=>Object.freeze({x:-i*direction.x,z:-i*direction.z})));
  const second=Object.freeze([{x:14,z:8},{x:14,z:7}].map(Object.freeze));
  const before=JSON.stringify([primary,second]),budget=s.stats();
  const food={x:direction.x*3+direction.z*3,z:direction.z*3-direction.x*3};
  const opts={direction,runToken:'initial',reducedMotion:true,food,delta:1/60,time:1,
   detail:'low',danger:1,eating:0};
  try{
   s.update([primary,second],opts);
   const {h,p}=headOf(s);
   assert.equal(s.stats().paths,2,'portal fragments remain separate');
   assert.equal(p.rotation.y,0,'alert overtakes public fruit for every direction');
   assert.ok(Math.abs(p.rotation.x-0.09)<1e-9);
   const stable=h.position.y;
   s.update([primary,second],{...opts,time:97});
   assert.equal(h.position.y,stable,'time-invariant reduced-motion alert');
   s.update([primary,second],{...opts,runToken:'calm',danger:0});
   assert.ok(p.rotation.y>0.1,'calm fruit gaze restored');
   assert.equal(p.rotation.x,0);
   const moved=Object.freeze([{x:22,z:12},{x:22,z:11}].map(Object.freeze));
   s.update([moved],{...opts,direction:{x:0,z:1},food:{x:25,z:15},runToken:'portal'});
   assert.equal(s.stats().paths,1,'never connect a portal jump');
   assert.equal(p.rotation.y,0,'teleport adopts urgent new public danger');
   s.update([moved],{...opts,direction:{x:0,z:1},food:{x:25,z:15},runToken:'eat',eating:1});
   assert.equal(p.rotation.x,0,'public eating takes priority over duck');
   assert.ok(p.rotation.y>0.1,'food attention preserved during collection');
   s.update([],{...opts,runToken:'recovery'});
   assert.equal(s.group.visible,false,'empty recovery hidden');
   assert.equal(JSON.stringify([primary,second]),before,'public points unchanged');
   for(const k of ['geometries','materials','textures','bufferBytes'])assert.equal(s.stats()[k],budget[k],'bounded resource '+k);
   assert.equal(s.stats().truncated,false);
  }finally{s.dispose();}
 }
});
