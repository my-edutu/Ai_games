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
test('source-authenticated gallery rescue expires on stale/wrong run/expired source or missing actor',async()=>{
  const {protectHistoricalGallerySightline}=await loaded;
  for(const change of [
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


test('original bronze struts crossing the genuine off-centre skinned torso and shoulder must clear in portrait without hiding the doorway',async()=>{
  const {protectHistoricalGallerySightline}=await loaded;
  const {args,a,b,held,seen}=make();
  // Current implementation samples only three central rays. The authentic
  // 390px film obscures shoulder and hip pixels despite a clear body centre.
  args.halfWidth=.76;
  args.raycaster.intersectObject=(mesh,_recursive,results)=>{
    seen.push({mesh:mesh.name,x:args.point.x,y:args.point.y});
    if(mesh===a && Math.abs(args.point.x)>.4 &&
        args.point.y>.2 && args.point.y<.9)
      results.push({distance:3.8});
    return results;
  };
  const before=JSON.stringify(args.source);
  const witnessed=protectHistoricalGallerySightline(args);
  assert.equal(witnessed.active,true);
  assert.equal(witnessed.softened,1,
    'a real shoulder-obscuring old structural triangle must no longer mask the actor');
  assert.ok(seen.some(x=>Math.abs(x.x)>.4 && x.y>.2 && x.y<.9),
    'the actual source-width off-axis skinned shoulder must be sampled');
  assert.ok(witnessed.rays<=56,'bounded seven actor silhouette rays for eight source meshes');
  assert.ok(a.material.opacity<=held.originalGallerySourceOpacity*.05,
    'foreground bronze rail must be effectively invisible over the real body');
  assert.equal(a.material.depthWrite,false);
  assert.equal(b.material.opacity,held.originalGallerySourceOpacity,
    'clear old steel load paths remain present');
  assert.equal(held.originalGatewayOpacity,1,
    'do not remove the actual original guardian gateway');
  assert.equal(JSON.stringify(args.source),before,'no physical source rewrite');
});
test('source-width silhouette rescue stays bounded and works at actual desktop 960x600 aspect',async()=>{
  const {protectHistoricalGallerySightline}=await loaded;
  const {args,seen}=make();
  args.halfWidth=Number.NaN;
  protectHistoricalGallerySightline(args);
  assert.ok(seen.length<=6,'invalid width is never used to invent additional lateral actor rays');
  const desktop=make();
  desktop.args.halfWidth=.76;
  desktop.args.camera.aspect=960/600;
  const result=protectHistoricalGallerySightline(desktop.args);
  assert.equal(result.active,true,'the real desktop 25.5s bronze rail must protect the same climber');
  assert.equal(result.softened,1);
  assert.ok(result.rays<=56,'desktop must honor the same bounded geometry budget');
});

// The same film shows bronze load paths obscuring the physical opened gate,
// not only the source body. This consumes an exact old world doorway pose
// from World, not a guessed gate or a new collision/portal scene.
test('real gateway-centre sightline protects the same original doorway in BOTH orientations without altering original gateway material',async()=>{
  const {protectHistoricalGallerySightline}=await loaded;
  for(const aspect of [960/600,390/844]){
    const {args,a,b,held,seen}=make();
    args.camera.aspect=aspect;
    args.gateway={x:.75,y:1,z:0};
    args.raycaster.intersectObject=(mesh,_recursive,results)=>{
      seen.push({mesh:mesh.name,x:args.point.x,y:args.point.y});
      if(mesh===a && args.point.x>.7 && args.point.y>.95)
        results.push({distance:4});
      return results;
    };
    const before=JSON.stringify(args.source);
    const result=protectHistoricalGallerySightline(args);
    assert.equal(result.active,true);
    assert.equal(result.softened,1,'genuine bronze obstruction to exact gateway must clear');
    assert.ok(result.rays<=72,'maximum 8 historical batches x (7 body + 2 real gate)');
    assert.ok(a.material.opacity<=.94*.05);
    assert.equal(b.material.opacity,.94,'clear old gallery remains');
    assert.equal(held.originalGatewayOpacity,1,'actual opened 3D gate cannot be dimmed');
    assert.equal(JSON.stringify(args.source),before,'no source mutation');
  }
});
test('invalid optional doorway point never creates an unearned ray or changes original gallery proof',async()=>{
  const {protectHistoricalGallerySightline}=await loaded;
  const {args,seen}=make();
  args.halfWidth=.76;
  args.gateway={x:Infinity,y:2,z:0};
  const result=protectHistoricalGallerySightline(args);
  assert.equal(result.active,true);
  assert.ok(result.rays<=56,'nonfinite goal is ignored without a ray or forged scene');
  assert.ok(seen.length<=56);
});
