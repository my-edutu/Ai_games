'use strict';
// Real Three.js triangle proof for a temporary F8->F9 camera repair.
// This is a code-level safety gate, never native-video/performance evidence.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const source=pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/successor-deck-visibility.mjs')).href;
const loaded=import(source);
const three=import('three');

function fixture(THREE){
  const geometry=new THREE.BoxGeometry(2.5,4,1.2);
  const material=new THREE.MeshStandardMaterial({color:0x69557e});
  const roof=new THREE.Group();
  const obstruction=new THREE.Mesh(geometry,material);
  obstruction.position.set(0,2,2.4);
  roof.add(obstruction);
  roof.updateWorldMatrix(true,true);
  const runToken='source-authenticated-grounded-8-to-9';
  const source={runToken,lifecycle:'running',theme:'void',floor:9,tick:479,
    player:{health:5}};
  const held={runToken,floor:9,sourceTick:475,guardianGateRetained:true,
    oldRoofY:3240000,thresholdX:315000};
  const reuse={raycaster:new THREE.Raycaster(),direction:new THREE.Vector3(),
    point:new THREE.Vector3(),hits:[]};
  return {geometry,material,roof,source,held,reuse,THREE};
}
function sample(f,camera,body,extra={}){
  return f.measure({
    source:f.source,held:f.held,
    camera:new f.THREE.Vector3(...camera),
    body:new f.THREE.Vector3(...body),bodyHalfHeight:1.2,
    gate:new f.THREE.Vector3(0,2,0),
    platformRoots:[f.roof],...f.reuse,...extra
  });
}
test('real platform depth triangles block a genuine full-body line of sight; exterior shift recovers sightline without moving gameplay',async()=>{
  const THREE=await three;
  const {measureAuthoritativeDeckSightline}=await loaded;
  const f=fixture(THREE);f.measure=measureAuthoritativeDeckSightline;
  const before=JSON.stringify([f.source,f.held]);
  try{
    const blocked=sample(f,[0,2,6],[0,2,0]);
    assert.equal(blocked.active,true);
    assert.ok(blocked.bodyBlockedRays>0,'foreground geometry actually crosses body');
    assert.ok(blocked.rays>0 && blocked.rays<=4,'at most 3 body+1 real gate rays');
    const clear=sample(f,[5,3,6],[0,2,0]);
    assert.equal(clear.active,true);
    assert.equal(clear.bodyBlockedRays,0,'real shifted shoulder clears old deck, no x-ray');
    assert.ok(clear.score<blocked.score);
    assert.equal(JSON.stringify([f.source,f.held]),before);
  }finally{f.geometry.dispose();f.material.dispose();}
});
test('missing or forged old-floor proof, wrong run, result/restart and stale source cannot authorize camera rescue',async()=>{
  const THREE=await three;
  const {measureAuthoritativeDeckSightline}=await loaded;
  const f=fixture(THREE);f.measure=measureAuthoritativeDeckSightline;
  try{
    for(const patch of [
      {source:{...f.source,runToken:'forged'}},
      {source:{...f.source,theme:'clockwork'}},
      {source:{...f.source,floor:8}},
      {source:{...f.source,lifecycle:'intermission'}},
      {source:{...f.source,tick:550}},
      {source:{...f.source,player:{health:0}}},
      {held:{...f.held,guardianGateRetained:false}},
    ])assert.equal(sample(f,[0,2,6],[0,2,0],patch),null);
    assert.equal(sample(f,[0,2,6],[0,2,0],{stale:true}),null);
    assert.equal(sample(f,[0,2,6],[0,2,0],{platformRoots:[]}),null);
  }finally{f.geometry.dispose();f.material.dispose();}
});
test('only actual rendered opaque, visible platform triangles count; no invented hazard, gateway or result',async()=>{
  const THREE=await three;
  const {measureAuthoritativeDeckSightline}=await loaded;
  const f=fixture(THREE);f.measure=measureAuthoritativeDeckSightline;
  try{
    const opaque=sample(f,[0,2,6],[0,2,0]);
    assert.ok(opaque.bodyBlockedRays>0);
    f.roof.children[0].material.transparent=true;
    f.roof.children[0].material.opacity=0;
    assert.equal(sample(f,[0,2,6],[0,2,0]).score,0);
    f.roof.children[0].material.opacity=1;
    f.roof.visible=false;
    assert.equal(sample(f,[0,2,6],[0,2,0]).score,0);
  }finally{f.geometry.dispose();f.material.dispose();}
});
