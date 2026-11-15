'use strict';
// P0: Genuine original structural triangles may remain in FRONT of the real
// climber in a 390x844 shot. Preserve the original doorway and actual
// geometry while locally clearing only historical non-colliding gallery mesh
// batches intersecting source-owned camera-to-body rays.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const modulePath='../../public/infinite-tower-climb/visuals/original-gallery-foreground.mjs';
const {pathToFileURL}=require('node:url');
const loaded=import(pathToFileURL(path.resolve(__dirname,modulePath)).href);
const make=()=>{
  const a={isMesh:true,name:'original-first-material-batch',
    material:{opacity:.94,transparent:true,depthWrite:false,needsUpdate:false}};
  const b={isMesh:true,name:'original-other-material-batch',
    material:{opacity:.94,transparent:true,depthWrite:false,needsUpdate:false}};
  const root={visible:true,children:[a,b],updateWorldMatrix(){}};
  const held={guardianGateRetained:true,runToken:'real-run',floor:9,
    sourceTick:475,originalGallerySourceOpacity:.94,
    originalGatewayOpacity:1,originalGalleryRoot:root,
    originalGalleryOcclusionWeights:[1,1]};
  const source={lifecycle:'running',floor:9,theme:'void',tick:480,
    runToken:'real-run',player:{health:5}};
  const camera={aspect:390/844,position:{x:0,y:0,z:8}};
  const actor={x:0,y:0,z:0};
  const direction={x:0,y:0,z:0,copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;},
    sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;},
    length(){return Math.hypot(this.x,this.y,this.z);},
    multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this;}};
  const point={x:0,y:0,z:0,copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}};
  const seen=[];
  const raycaster={far:0,near:0,set(position,direction){this.direction=direction;},
    intersectObject(mesh,recursive,results) {
      seen.push({mesh:mesh.name,far:this.far,y:point.y});
      if(mesh===a && Math.abs(point.y)<.01 && this.far>0)results.push({distance:4});
      return results;
    }};
  const args={camera,actor,halfHeight:1.4,source,held,raycaster,direction,
    point,hitBuffer:[],dt:.04};
  return {args,a,b,held,source,camera,seen};
};
test('actual source-owned portrait gallery ray intersection clears one historical mesh but preserves non-hit old architecture',async()=>{
  const {protectHistoricalGallerySightline}=await loaded;
  const {args,a,b,held,seen}=make();
  const result=protectHistoricalGallerySightline(args);
  assert.equal(result.active,true);
  assert.equal(result.softened,1);
  assert.equal(result.meshes,2);
  assert.ok(result.rays<=6,'three authentic head/torso/boots rays per each of two source meshes');
  assert.ok(seen.some(x=>x.mesh===a.name && Math.abs(x.y)<.01));
  assert.ok(a.material.opacity<=.94*.2,'real occluding structural pixels become translucent');
  assert.equal(a.material.depthWrite,false,'non-colliding historical overlay must not mask the real hero');
  assert.equal(b.material.opacity,.94,'clear original load path remains readable');
  assert.equal(held.originalGatewayOpacity,1,'the original guardian gateway is never altered');
  assert.equal(held.originalGallerySourceOpacity,.94);
  assert.equal(args.source.tick,480,'authority unchanged');
  assert.ok(seen.every(x=>x.far<8),'no ray may strike gallery behind the real subject');
});
test('portrait rescue expires on stale/wrong run/expired source, no actor or desktop; no galleries or gameplay touched',async()=>{
  const {protectHistoricalGallerySightline}=await loaded;
  for(const change of [
    args=>{args.camera.aspect=1.6;},
    args=>{args.source.runToken='different-run';},
    args=>{args.source.tick=546;},
    args=>{args.stale=true;},
    args=>{args.actor=null;},
    args=>{args.held.originalGatewayOpacity=0;},
    args=>{args.source.floor=8;}
  ]){
    const {args,a,b,seen}=make();change(args);
    const response=protectHistoricalGallerySightline(args);
    assert.equal(response.active,false);
    assert.equal(a.material.opacity,.94);
    assert.equal(b.material.opacity,.94);
    assert.equal(seen.length,0,'no off-contract expensive 3D casts');
  }
});
test('once geometry clears the real sightline, old batch returns toward its source-authenticated fade without ghosting or material churn',async()=>{
  const {protectHistoricalGallerySightline}=await loaded;
  const {args,a,held}=make();
  protectHistoricalGallerySightline(args);
  assert.ok(a.material.opacity<.2);
  args.raycaster.intersectObject=(_mesh,_recurse,results)=>results;
  for(let i=0;i<15;i++)protectHistoricalGallerySightline(args);
  assert.ok(a.material.opacity>.85,'non-blocking original triangles regain the real source tint');
  assert.ok(a.material.opacity<=held.originalGallerySourceOpacity);
  held.originalGallerySourceOpacity=.35;
  protectHistoricalGallerySightline(args);
  assert.ok(a.material.opacity<=.35,'visual clearance cannot preserve retired opaque source');
});
test('world uses original gallery-owned meshes, current composed camera, and no new colliders or fake actors',()=>{
  const world=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/originalGalleryRoot:gallery\?\.root/);
  assert.match(world,/protectHistoricalGallerySightline\(\{/);
  assert.match(world,/source:lastSnapshot/);
  assert.doesNotMatch(world,/snapshot\.player\.(?:x|y)\s*=/);
});
