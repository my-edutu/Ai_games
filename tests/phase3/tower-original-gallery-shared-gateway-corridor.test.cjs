'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const source=import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/original-gallery-foreground.mjs')).href);
function fixture(aspect=390/844) {
  const corridorSteel={isMesh:true,name:'actual-old-gallery-post',
    visible:true,material:{opacity:.94,transparent:true,depthWrite:false,needsUpdate:false}};
  const otherSteel={isMesh:true,name:'clear-original-bearing',
    visible:true,material:{opacity:.94,transparent:true,depthWrite:false,needsUpdate:false}};
  const held={runToken:'same-actual-expedition',floor:9,sourceTick:475,
    guardianGateRetained:true,originalGatewayOpacity:1,
    originalGallerySourceOpacity:.94,
    originalGalleryRoot:{visible:true,children:[corridorSteel,otherSteel],
      updateWorldMatrix(){}},
    originalGalleryOcclusionWeights:[1,1]};
  const snapshot={runToken:held.runToken,lifeCycle:'running',
    lifecycle:'running',floor:9,theme:'void',tick:481,player:{health:3}};
  const camera={aspect,position:{x:0,y:3,z:12}};
  const actor={x:2,y:1,z:0},gateway={x:-2,y:2,z:0};
  const point={x:0,y:0,z:0,copy(other){
    this.x=other.x;this.y=other.y;this.z=other.z;return this;
  }};
  const direction={x:0,y:0,z:0,copy(other){
    this.x=other.x;this.y=other.y;this.z=other.z;return this;
  },sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;},
  length(){return Math.hypot(this.x,this.y,this.z);},
  multiplyScalar(k){this.x*=k;this.y*=k;this.z*=k;return this;}};
  const probed=[];
  const raycaster={far:0,near:0,set(){},intersectObject(mesh,_recursive,hits){
    probed.push({mesh:mesh.name,x:point.x,y:point.y,far:this.far});
    // An actual narrow old steel post BETWEEN hero and open guardian gate:
    // no centre/shoulder/boot or exact-gate ray touches it.
    if(mesh===corridorSteel && Math.abs(point.x)<.15 &&
      point.y>1 && point.y<2 && this.far>0)hits.push({distance:6});
    return hits;
  }};
  const args={camera,actor,gateway,halfHeight:1.4,halfWidth:.76,
    source:snapshot,held,raycaster,direction,point,hitBuffer:[],dt:.04};
  return {args,corridorSteel,otherSteel,held,snapshot,probed};
}
test('P0 original 3D historic steel between the real moving climber and opened gateway must not split the continuous two-subject shot',async()=>{
  const {protectHistoricalGallerySightline}=await source;
  for(const aspect of [960/600,390/844]){
    const {args,corridorSteel,otherSteel,held,snapshot,probed}=fixture(aspect);
    const before=JSON.stringify(snapshot);
    const result=protectHistoricalGallerySightline(args);
    assert.equal(result.active,true);
    assert.equal(result.softened,1,'only real original non-colliding intervening material is softened');
    assert.ok(result.corridorRays>0 && result.corridorRays<=24,
      'bounded physical hero-to-gateway corridor sampling, not a fake actor');
    assert.equal(result.corridorSoftened,1,'bronze screen-splitting post is recognized');
    assert.ok(result.rays<=96,'no unbounded per-frame intersection work');
    assert.ok(corridorSteel.material.opacity<=.94*.05);
    assert.equal(corridorSteel.material.depthWrite,false);
    assert.equal(otherSteel.material.opacity,.94,'unoccluding original structure remains');
    assert.equal(held.originalGatewayOpacity,1,'the real gateway is never faded');
    assert.equal(JSON.stringify(snapshot),before,'render check cannot change authoritative gameplay');
    assert.ok(probed.some(p=>p.mesh===corridorSteel.name && Math.abs(p.x)<.15));
  }
});
test('corridor rescue never runs without actual current source-owned guardian gate or on an unrelated/stale run',async()=>{
  const {protectHistoricalGallerySightline}=await source;
  for(const invalidate of [
    f=>{f.args.gateway={x:NaN,y:2,z:0};},
    f=>{f.args.gateway={x:-1000,y:2,z:0};},
    f=>{f.args.source.runToken='new-episode';},
    f=>{f.args.stale=true;},
    f=>{f.args.held.originalGatewayOpacity=0;}
  ]){
    const f=fixture();invalidate(f);
    const res=protectHistoricalGallerySightline(f.args);
    assert.equal(f.corridorSteel.material.opacity,.94);
    assert.equal(res.corridorSoftened||0,0,'never dim historical geometry without the live physical corridor');
  }
});
