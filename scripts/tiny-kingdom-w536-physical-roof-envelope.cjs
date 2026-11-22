'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin=html.indexOf('<script>'),stop=html.indexOf('</script>',begin);
const m=begin>=0&&stop>begin?[null,html.slice(begin+8,stop)]:null;
assert(m,'Actual playable script must be embedded');
new vm.Script(m[1],{filename:'original-autonomous-3d-game.js'});
const start=m[1].indexOf('const physicalRoofEnvelopeCache=new WeakMap();');
const end=m[1].indexOf(String.fromCharCode(10)+'function foregroundSceneProjection(',start);
assert(start>=0&&end>start,'W536 original physical city/projection seam');
const terrain=(x,z)=>Math.sin(x*.32)*.13+Math.cos(z*.24)*.07;
const p=Function('terrain',m[1].slice(start,end)+
 ';return {readPhysicalRoofEnvelope,getPhysicalRoofEnvelopeResidentAudit};')(terrain);
for(let n=0;n<400;n++){
 const roof={x:n/8-25,z:Math.sin(n*.3)*13,
  rx:.15+n%7*.21,rz:.4+n%6*.35,top:2+(n%11)*.67,
  ...(n%3===0?{bottom:n%2===0?0:.4}:{}),
  ...(n%5===0?{visualBottom:.5}:{})};
 for(let i=0;i<3;i++){
  const a=p.readPhysicalRoofEnvelope(roof),y=terrain(roof.x,roof.z),
   bottom=roof.visualBottom??roof.bottom??(y-.1),
   half=Math.abs(roof.top-bottom)*.5;
  assert.equal(a.bottom,bottom);
  assert.equal(a.rayBottom,roof.bottom??(y-.22));
  assert.equal(a.mid,(bottom+roof.top)*.5);
  assert.equal(a.halfHeight,half);
  assert.equal(a.sphereRadius,Math.hypot(roof.rx,half,roof.rz));
  if(i===0)p.readPhysicalRoofEnvelope(roof);
  if(i===1){roof.top+=.37;roof.rx+=.03;}
 }
}
const audit=p.getPhysicalRoofEnvelopeResidentAudit();
assert(audit.reuses>=400&&audit.invalidations>=400);
for(const name of ['followRayBlockers','physicalFollowEyeClearance',
 'cameraShotProximityWarnings','foregroundSceneProjection']){
 const begin=m[1].indexOf('function '+name+'(');
 assert(begin>=0,name+' must exist in the playable game');
 const end=m[1].indexOf(String.fromCharCode(10)+'function ',begin+8);
 assert(m[1].slice(begin,end>=0?end:undefined).includes('readPhysicalRoofEnvelope('),
  name+' must consume original real 3D roof envelope');
}
console.log('W536 source/V8: all physical roofs, cargo AABBs, invalidation and game JS PASS. Real browser/video/FPS not established.');
