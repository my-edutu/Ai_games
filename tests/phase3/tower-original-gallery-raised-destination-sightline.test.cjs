'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const p='../../public/infinite-tower-climb/visuals/original-gallery-foreground.mjs';
const get=import(require('node:url').pathToFileURL(path.resolve(__dirname,p)).href);
function fixture(){
  const oldRoofY=3240000;
  const source={floor:9,theme:'void',lifecycle:'running',runToken:'genuine',
    tick:488,worldWidth:480000,chunkBaseY:3200000,
    platforms:[
      {id:'f9:ground',x:270000,y:3220000,width:150000,height:20000},
      {id:'f9:gateway-step',x:325000,y:3270000,width:40000,height:20000}
    ],
    player:{health:5,x:310000,y:3255000}};
  const mesh={isMesh:true,visible:true,material:{opacity:.94,transparent:true,depthWrite:false}};
  const held={floor:9,runToken:'genuine',oldCapId:'f8:cap',
    thresholdX:304896,oldRoofY,guardianGateRetained:true,
    sourceTick:475,originalGatewayOpacity:.95,
    originalGallerySourceOpacity:.94,
    originalGalleryRoot:{visible:true,children:[mesh],updateWorldMatrix(){}},
    originalGalleryOcclusionWeights:[1]};
  const point={x:0,y:0,z:0,copy(o){this.x=o.x;this.y=o.y;this.z=o.z;return this}};
  const direction={x:0,y:0,z:0,copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this},
    sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this},
    length(){return Math.hypot(this.x,this.y,this.z)},
    multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this}};
  const calls=[];
  const raycaster={near:0,far:0,set(){},intersectObject(_mesh,_recursive,buffer){
    calls.push({x:point.x,y:point.y});
    if(point.x===1.25 && point.y>2)buffer.push({distance:2});
    return buffer;
  }};
  const args={camera:{aspect:390/844,position:{x:0,y:0,z:8}},
    actor:{x:0,y:0,z:0},halfHeight:1.4,halfWidth:.7,
    gateway:{x:.1,y:1,z:0},
    raisedDestination:{x:1.25,y:2.4,z:0,sourceBound:true,
      id:'f9:gateway-step',runToken:'genuine',sourceTick:488},
    source,held,raycaster,direction,point,hitBuffer:[],dt:.04};
  return {source,held,mesh,args,calls};
}
test('source gateway-step witness requires real old roof, exact same-run step and near real living climber',async()=>{
  const {observedSourceRaisedGatewaySightline}=await get;
  const {source,held}=fixture();
  const result=observedSourceRaisedGatewaySightline(source,held);
  assert.equal(result?.id,'f9:gateway-step');
  assert.equal(result?.x,345000);
  assert.equal(result?.y,3290000);
  assert.equal(result?.runToken,'genuine');
  assert.equal(result?.sourceTick,488);
  const cases=[
    x=>{x.source.runToken='foreign'},
    x=>{x.held.guardianGateRetained=false},
    x=>{x.held.originalGatewayOpacity=0},
    x=>{x.source.platforms[0].height-=10000},
    x=>{x.source.platforms[1].id='not-real-step'},
    x=>{x.source.platforms[1].y+=400000},
    x=>{x.source.player.x=1000},
    x=>{x.source.floor=8},
    x=>{x.source.tick=600}
  ];
  for(const mutate of cases){
    const f=fixture();mutate(f);
    assert.equal(observedSourceRaisedGatewaySightline(f.source,f.held),null);
  }
});
test('a true raised destination occluded by historical source triangles clears ONLY that noninteractive original gallery batch',async()=>{
  const {protectHistoricalGallerySightline}=await get;
  for(const aspect of [960/600,390/844]){
    const f=fixture();f.args.camera.aspect=aspect;
    const before=JSON.stringify(f.source);
    const result=protectHistoricalGallerySightline(f.args);
    assert.equal(result.active,true);
    assert.equal(result.softened,1);
    assert.equal(result.raisedSoftened,1);
    assert.ok(result.raisedRays>0);
    assert.ok(result.rays<=11,'bounded real full-body/old-gate/raised-step rays per source mesh');
    assert.equal(f.held.originalGatewayOpacity,.95);
    assert.equal(JSON.stringify(f.source),before);
    assert.ok(f.mesh.material.opacity<=.94*.05);
    assert.equal(f.mesh.material.depthWrite,false);
  }
});
test('offscreen or untrusted target cannot independently clear supporting bronze gallery',async()=>{
  const {protectHistoricalGallerySightline}=await get;
  for(const edit of [
    x=>{x.args.raisedDestination.id='f9:invented'},
    x=>{x.args.raisedDestination.sourceTick=1},
    x=>{x.args.raisedDestination.runToken='other'},
    x=>{x.args.raisedDestination.x=Infinity},
    x=>{x.args.raisedDestination.x=900},
    x=>{x.args.gateway=null},
    x=>{x.args.raisedDestination=null}
  ]){
    const f=fixture();edit(f);
    const result=protectHistoricalGallerySightline(f.args);
    assert.equal(result.active,true);
    assert.equal(result.raisedSoftened,0);
    assert.equal(result.raisedRays,0);
    assert.equal(f.mesh.material.opacity,.94);
  }
});
test('actual World ray pass only uses the source-attached raised step after projection of the composed real camera',()=>{
  const world=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/observedSourceRaisedGatewaySightline\(\s*lastSnapshot,retainedEarnedCap\)/);
  assert.match(world,/platforms\.get\(raisedSource\.id\)\?\.root\?\.parent===floorGroup/);
  assert.match(world,/historicalRaisedStepNdc\.copy\(historicalRaisedStepRayPoint\)\.project\(camera\)/);
  assert.match(world,/raisedDestination:raisedStepTarget/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y)\s*=/);
});
