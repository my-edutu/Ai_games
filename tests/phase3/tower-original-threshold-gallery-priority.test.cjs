'use strict';
// Real THREE source-geometry contract for P0 old-bronze -> Floor9 load path.
// This is a renderer-side comparison, NOT native WebM or game-loop acceptance.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { pathToFileURL } = require('node:url');
const { resolveTowerWorldFixtureImports } = require('../helpers/tower-world-fixture-imports.cjs');
const ROOT = path.resolve(__dirname, '../..');
const visuals = path.join(ROOT,'public/infinite-tower-climb/visuals');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(),'tower-original-gallery-'));
const local = path.join(scratch,'world.mjs');
const uri = name => pathToFileURL(path.join(visuals,name)).href;
const threeUri = pathToFileURL(path.join(ROOT,'node_modules/three/build/three.module.js')).href;
let source = fs.readFileSync(path.join(visuals,'world.mjs'),'utf8');
for(const [from,to] of Object.entries({
  "'/tower/vendor/three.module.js'":threeUri,
  "'./coordinates.mjs'":uri('coordinates.mjs'),
  "'./guardian-passage.mjs'":uri('guardian-passage.mjs'),
  "'./crossfloor-arrival.mjs'":uri('crossfloor-arrival.mjs'),
  "'./original-clockwork-architecture-palette.mjs'":uri('original-clockwork-architecture-palette.mjs'),
  "'./source-earned-bearing-run.mjs'":uri('source-earned-bearing-run.mjs'),
  "'./original-gallery-foreground.mjs'":uri('original-gallery-foreground.mjs'),
  "'./source-physical-arrival-palette.mjs'":uri('source-physical-arrival-palette.mjs'),
  "'./world-surface.mjs'":uri('world-surface.mjs'),
  "'./scene-hierarchy.mjs'":uri('scene-hierarchy.mjs'),
  "'./mesh-provenance.mjs'":uri('mesh-provenance.mjs'),
  "'./guardian-transmission-layout.mjs'":uri('guardian-transmission-layout.mjs'),
  "'./far-side-shaft-transition.mjs'":uri('far-side-shaft-transition.mjs'),
})) {
  assert.ok(source.includes(from),'shipped import must exist: '+from);
  source = source.replace(from,JSON.stringify(to));
}
fs.writeFileSync(local,resolveTowerWorldFixtureImports(source,{root:ROOT,fixtureDir:scratch}));
after(()=>fs.rmSync(scratch,{recursive:true,force:true}));
const loaded = Promise.all([import(threeUri),import(pathToFileURL(local).href)]);
const CAP_X = 115200, CAP_WIDTH = 249600, EXIT_X = CAP_X + Math.floor(CAP_WIDTH*.76);
const BASE_Y = 2880000, ROOF_Y = 3224000, WIDTH = 480000;
const roof = (ROOF_Y-BASE_Y)/10000;
const at = (EXIT_X/WIDTH-.5)*2.2;
function placed(THREE,angle,{named='source-structural-brace',instance=false}={}) {
  const geometry=new THREE.BoxGeometry(1,2,1);
  const material=new THREE.MeshStandardMaterial({color:0x8d7a61});
  const mesh=instance ? new THREE.InstancedMesh(geometry,material,1)
    : new THREE.Mesh(geometry,material);
  mesh.name=named;
  mesh.userData.structural=true;
  const pos=new THREE.Vector3(Math.sin(angle)*25,roof+3,Math.cos(angle)*25);
  if(instance) {
    mesh.setMatrixAt(0,new THREE.Matrix4().makeTranslation(pos.x,pos.y,pos.z));
    mesh.instanceMatrix.needsUpdate=true;
  } else mesh.position.copy(pos);
  return mesh;
}
function clean(result,scene) {
  if(result) for(const m of result.root.children){
    m.geometry.dispose();m.material.dispose();
  }
  scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material)obj.material.dispose();});
}
test('retained original doorway structure is selected by physical proximity, not earlier batch order',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group(), far=placed(THREE,at+.32), near=placed(THREE,at);
  old.add(far,near); let result;
  try{
    result=world.extractOriginalClockworkThresholdGallery(
      THREE,old,EXIT_X,ROOF_Y,BASE_Y,WIDTH,{maxFaces:6,maxBatches:1});
    assert.ok(result,'the original real nearby brace is extractable');
    assert.equal(result.root.children.length,1);
    assert.equal(result.faces,6);
    assert.equal(result.bytes,6*96);
    const a=result.root.children[0].geometry.getAttribute('position');
    for(let i=0;i<a.count;i++){
      const theta=Math.atan2(a.getX(i),a.getZ(i));
      assert.ok(Math.abs(theta-at)<.08,'source-authentic threshold vertices come from the nearest brace');
    }
    assert.equal(result.root.children[0].material.name,'OriginalClockworkGallerySourceSurface');
    assert.equal(near.parent,old,'original GPU geometry remains in place');
    assert.equal(far.parent,old,'the old floor is not rewritten');
    assert.equal(result.root.children[0].castShadow,false);
  } finally { clean(result,old); }
});
test('source transformed instances retain the original geometry, normal, UV and hard resource budget',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group(), group=new THREE.Group();
  group.position.y=2;
  const support=placed(THREE,at,{instance:true});
  // Real old-floor structural offsets must be honored without a fabricated
  // future-Floor9 platform or an extra source actor.
  support.setMatrixAt(0,new THREE.Matrix4().makeTranslation(
    Math.sin(at)*25,roof+1,Math.cos(at)*25));
  group.add(support);old.add(group);let result;
  try{
    result=world.extractOriginalClockworkThresholdGallery(
      THREE,old,EXIT_X,ROOF_Y,BASE_Y,WIDTH,{maxFaces:8,maxBatches:2});
    assert.ok(result && result.faces>0 && result.faces<=8);
    assert.ok(result.root.children.length<=2);
    const mesh=result.root.children[0];
    for(const name of ['position','normal','uv'])assert.ok(mesh.geometry.getAttribute(name));
    const positions=mesh.geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++)assert.ok(
      Math.abs(positions.getY(i)-(roof+3))<2.01,
      'local instance+parent transform is applied exactly once');
    assert.equal(result.bytes,result.faces*96);
  } finally { clean(result,old); }
});
test('roof-spanning original bronze bearing retains real continuous height without invented supports',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group();
  const beam=new THREE.Mesh(new THREE.BoxGeometry(1.4,82,1.4),
    new THREE.MeshStandardMaterial({color:0x927b56}));
  beam.name='source-structural-roof-bearing';
  beam.userData.structural=true;
  beam.position.set(Math.sin(at)*25,roof-13,Math.cos(at)*25);
  old.add(beam);let result;
  try{
    result=world.extractOriginalClockworkThresholdGallery(
      THREE,old,EXIT_X,ROOF_Y,BASE_Y,WIDTH,{maxFaces:32,maxBatches:2});
    assert.ok(result && result.faces>=8,
      'real support spanning the old/new roof plane must not vanish because its vertices lie beyond a narrow slice');
    const ys=[];
    for(const child of result.root.children){
      const vertices=child.geometry.getAttribute('position');
      for(let i=0;i<vertices.count;i++)ys.push(vertices.getY(i));
    }
    assert.ok(Math.min(...ys)<roof-40 && Math.max(...ys)>roof+21,
      'preserved triangles contain both ends of the same source roof-spanning mesh');
    assert.equal(result.bytes,result.faces*96);
    assert.ok(result.faces<=32 && result.root.children.length<=2);
    assert.equal(beam.parent,old,'original old-floor GPU mesh is not relocated');
    assert.equal(result.root.children[0].material.name,'OriginalClockworkGallerySourceSurface');
  }finally{clean(result,old);}
});


test('the actual old gateway may preserve source-original flanking load paths that a narrow portal aperture would erase',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group();
  const inside=placed(THREE,at);
  const flank=placed(THREE,at+.66);
  flank.position.set(Math.sin(at+.66)*45,roof-9,Math.cos(at+.66)*45);
  // Both elements are real existing Clockwork geometry, not newly authored
  // Floor9 pieces. The broader HISTORICAL gallery remains source-clipped.
  old.add(inside,flank);
  let narrow=null,wide=null;
  try{
    narrow=world.extractOriginalClockworkThresholdGallery(THREE,old,
      EXIT_X,ROOF_Y,BASE_Y,WIDTH,{maxFaces:24,maxBatches:3});
    wide=world.extractOriginalClockworkThresholdGallery(THREE,old,
      EXIT_X,ROOF_Y,BASE_Y,WIDTH,{
        maxFaces:24,maxBatches:3,includeOriginalFlanks:true});
    assert.ok(narrow && wide);
    assert.equal(narrow.root.children.length,1,
      'the original small gateway envelope does not retain its visible external bearing');
    assert.equal(wide.root.children.length,2,
      'the source-owned historical gateway retains both its bearing and flanking architecture');
    assert.ok(wide.faces>narrow.faces && wide.faces<=24);
    assert.ok(wide.bytes<=24*96);
    let external=false;
    for(const child of wide.root.children) {
      const pos=child.geometry.getAttribute('position');
      for(let i=0;i<pos.count;i++) {
        const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
        const radial=Math.hypot(x,z);
        const delta=Math.atan2(Math.sin(Math.atan2(x,z)-at),
          Math.cos(Math.atan2(x,z)-at));
        if(radial>41 && Math.abs(delta)>.55)external=true;
        assert.ok(radial<=54.001 && y>=roof-105.001 && y<=roof+54.001,
          'retained source triangles remain inside a finite source-authored 3D volume');
      }
      assert.equal(child.material.name,'OriginalClockworkGallerySourceSurface');
      assert.equal(child.castShadow,false);
    }
    assert.ok(external,'the original external source load path was genuinely sampled');
    assert.equal(flank.parent,old);
  }finally{
    for(const result of [narrow,wide])if(result)
      for(const child of result.root.children){
        child.geometry.dispose();child.material.dispose();
      }
    clean(null,old);
  }
});

test('playable platforms, boss gateway and ambient silhouettes cannot be copied into historical structural gallery',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group();
  for(const name of ['platform:f8:cap','AuthoritativeGuardianGate','hazard:f8:crusher']){
    const root=new THREE.Group();
    root.name=name;root.add(placed(THREE,at));old.add(root);
  }
  const ambient=placed(THREE,at);ambient.userData.ambientDetail=true;old.add(ambient);
  try{
    assert.equal(world.extractOriginalClockworkThresholdGallery(
      THREE,old,EXIT_X,ROOF_Y,BASE_Y,WIDTH),null,
      'never create a duplicate walkable source deck, boss gate or hazard');
  }finally{clean(null,old);}
});


test('genuine long bronze bearing faces crossing a gateway envelope are boundedly clipped, not silently lost',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group(), carrying=new THREE.Group();
  carrying.rotation.y=at;
  carrying.position.set(Math.sin(at)*25,roof+3,Math.cos(at)*25);
  // One original 35m tangential metal crossbeam spans the true gate sightline.
  // Many original indexed triangles cross the physical aperture, but one
  // endpoint lies outside the conservative visibility sector. Old all-vertex
  // rejection erased those faces. The new geometry must be source-clipped,
  // never fabricated at the opposite end of the structure.
  const beam=new THREE.Mesh(new THREE.BoxGeometry(35,3,2),
    new THREE.MeshStandardMaterial({color:0x947052,roughness:.76}));
  beam.name='OriginalClockworkLongRoofCrossbeam';
  beam.userData.structural=true;
  beam.position.x=8;
  carrying.add(beam);old.add(carrying);
  let result;
  try {
    result=world.extractOriginalClockworkThresholdGallery(
      THREE,old,EXIT_X,ROOF_Y,BASE_Y,WIDTH,{maxFaces:24,maxBatches:2});
    assert.ok(result && result.faces>=4 && result.faces<=24,
      'preserve original roof crossbeam faces crossing the real sightline');
    assert.ok(result.bytes<=24*96 && result.root.children.length<=2);
    const positions=result.root.children[0].geometry.getAttribute('position');
    const uvs=result.root.children[0].geometry.getAttribute('uv');
    const normals=result.root.children[0].geometry.getAttribute('normal');
    const side=Math.tan(.46);
    let clippedBoundary=false;
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i), y=positions.getY(i), z=positions.getZ(i);
      const radial=x*Math.sin(at)+z*Math.cos(at);
      const tangent=x*Math.cos(at)-z*Math.sin(at);
      assert.ok(radial>=12.7-1e-4 && radial<=39+1e-4);
      assert.ok(Math.abs(tangent)<=radial*side+1e-4,
        'no triangle may extend beyond bounded old-world gateway aperture');
      assert.ok(y>=roof-85-1e-4 && y<=roof+40+1e-4);
      assert.ok(Number.isFinite(uvs.getX(i)) && Number.isFinite(uvs.getY(i)),
        'source UV interpolates across genuine clipped original triangle');
      assert.ok(Number.isFinite(normals.getX(i)) && Number.isFinite(normals.getZ(i)));
      if(Math.abs(Math.abs(tangent)-radial*side)<1e-3)clippedBoundary=true;
    }
    assert.ok(clippedBoundary,
      'retained original 3D beam must terminate on the physical sector clipping plane');
    assert.equal(carrying.parent,old,'source floor mesh and transforms must remain unchanged');
    assert.equal(beam.material.name,'','original source material must not be modified');
  }finally{clean(result,old);}
});


test('historical flanking gallery preserves real deep and overhead Clockwork frames under a shared material budget',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group();
  const points=[],normals=[],uvs=[];
  // One true source MATERIAL BATCH: numerous near-roof faces would otherwise
  // consume the small retained envelope and hide both source-original lower
  // machinery and its overhead bearings from the first Floor9 camera.
  const primitive=new THREE.BoxGeometry(1.15,1.6,1.15).toNonIndexed();
  const srcPos=primitive.getAttribute('position');
  const srcNor=primitive.getAttribute('normal');
  const srcUv=primitive.getAttribute('uv');
  const pieces=[...Array.from({length:32},(_,i)=>({
    angle:at+(i-16)*.001,radial:25.1,y:roof+2
  })),{angle:at+.035,radial:26,y:roof-63},
      {angle:at-.042,radial:27,y:roof+37}];
  for(const piece of pieces)for(let j=0;j<srcPos.count;j++){
    points.push(srcPos.getX(j)+Math.sin(piece.angle)*piece.radial,
      srcPos.getY(j)+piece.y,srcPos.getZ(j)+Math.cos(piece.angle)*piece.radial);
    normals.push(srcNor.getX(j),srcNor.getY(j),srcNor.getZ(j));
    uvs.push(srcUv.getX(j),srcUv.getY(j));
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x776653}));
  mesh.name='source-rigid-material-vertical-bearings';
  mesh.userData.structural=true;
  old.add(mesh);
  let narrow,wide;
  try{
    narrow=world.extractOriginalClockworkThresholdGallery(THREE,old,
      EXIT_X,ROOF_Y,BASE_Y,WIDTH,{maxFaces:40,maxBatches:1});
    wide=world.extractOriginalClockworkThresholdGallery(THREE,old,
      EXIT_X,ROOF_Y,BASE_Y,WIDTH,{
        maxFaces:40,maxBatches:1,includeOriginalFlanks:true});
    assert.ok(narrow && wide);
    const heights=geometry=>Array.from({length:geometry.getAttribute('position').count},
      (_,j)=>geometry.getAttribute('position').getY(j));
    const short=heights(narrow.root.children[0].geometry);
    const extended=heights(wide.root.children[0].geometry);
    assert.ok(Math.min(...short)>roof-40 && Math.max(...short)<roof+28,
      'ordinary source extraction remains a focused roof-only corridor');
    assert.ok(Math.min(...extended)<roof-50 && Math.max(...extended)>roof+28,
      'same-original-floor source must preserve both deep machine and overhead silhouette, even with central-face saturation');
    assert.ok(wide.faces<=40 && wide.bytes<=40*96);
    assert.equal(wide.root.children.length,1,'no extra draw call per bearing');
    assert.equal(mesh.parent,old,'do not rewrite or move the physical original source');
  }finally{
    for(const result of [narrow,wide])if(result)
      for(const child of result.root.children){
        child.geometry.dispose();child.material.dispose();
      }
    clean(null,old);primitive.dispose();
  }
});


test('earned original gateway has an unobstructed skinned-body aperture while preserving source bronze flanks',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group();
  const post=new THREE.Mesh(new THREE.BoxGeometry(1.6,15,1.6),
    new THREE.MeshStandardMaterial({color:0x937a55}));
  post.name='original-noncolliding-threshold-post';
  post.userData.structural=true;
  post.position.set(Math.sin(at)*25,roof+5,Math.cos(at)*25);
  const flank=new THREE.Mesh(new THREE.BoxGeometry(1.6,15,1.6),
    new THREE.MeshStandardMaterial({color:0x927758}));
  flank.name='original-outside-passage-bearing';
  flank.userData.structural=true;
  const flankAngle=at+.57;
  flank.position.set(Math.sin(flankAngle)*25,roof+5,Math.cos(flankAngle)*25);
  old.add(post,flank);
  const baseline=world.extractOriginalClockworkThresholdGallery(THREE,old,
    EXIT_X,ROOF_Y,BASE_Y,WIDTH,{includeOriginalFlanks:true,maxFaces:128,maxBatches:2});
  const cleared=world.extractOriginalClockworkThresholdGallery(THREE,old,
    EXIT_X,ROOF_Y,BASE_Y,WIDTH,{includeOriginalFlanks:true,
      clearPhysicalExit:true,maxFaces:128,maxBatches:2});
  const hits=(gallery,angle)=>{
    if(!gallery)return 0;
    gallery.root.updateMatrixWorld(true,true);
    const ray=new THREE.Raycaster(
      new THREE.Vector3(Math.sin(angle)*45,roof+5,Math.cos(angle)*45),
      new THREE.Vector3(-Math.sin(angle),0,-Math.cos(angle)),0,30);
    return ray.intersectObjects(gallery.root.children,false).length;
  };
  try{
    assert.ok(baseline && cleared,'the authentic old gallery survives the selective aperture');
    assert.ok(hits(baseline,at)>0,'real original post obstructed the central avatar before clearance');
    assert.equal(hits(cleared,at),0,'the source-selected torso passage must not retain obstructing post faces');
    assert.ok(hits(cleared,flankAngle)>0,'original bronze flanking structure remains physically legible');
    assert.ok(cleared.faces<=128 && cleared.bytes===cleared.faces*96,
      'original low-tier geometry and memory budgets remain bounded');
    assert.equal(post.parent,old,'the original floor and its geometry are never rewritten');
    assert.equal(flank.parent,old);
  } finally {clean(baseline,nullScene());clean(cleared,old);}
  function nullScene(){return {traverse(){}};}
});

test('original source gallery forms a continuous three-dimensional earned doorway and raised-landing clearance without deleting bronze flanks',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group();
  function sourceBearing(radius,tangent,rise,h=3){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.4,h,1.4),
      new THREE.MeshStandardMaterial({color:0x937a55,roughness:.76}));
    mesh.name='existing-original-clockwork-bearing';
    mesh.userData.structural=true;
    mesh.position.set(Math.sin(at)*radius+Math.cos(at)*tangent,
      roof+rise,Math.cos(at)*radius-Math.sin(at)*tangent);
    old.add(mesh);return mesh;
  }
  // Both obstructions are ORIGINAL bronze source faces: one at the
  // *exterior next-floor* shoulder, the other above the real raised deck.
  // They were outside the original threshold-only negative space.
  const landingPost=sourceBearing(41,8,6,8);
  const overhead=sourceBearing(29,0,19,3);
  const flank=sourceBearing(40,23,5,8);
  let uncut=null,cut=null;
  function nativeRayHits(gallery,radius,tangent,rise){
    if(!gallery)return 0;
    gallery.root.updateMatrixWorld(true,true);
    const origin=new THREE.Vector3(
      Math.sin(at)*radius+Math.cos(at)*tangent,roof+rise,
      Math.cos(at)*radius-Math.sin(at)*tangent);
    const inward=new THREE.Vector3(-Math.sin(at),0,-Math.cos(at));
    return new THREE.Raycaster(origin,inward,0,40)
      .intersectObjects(gallery.root.children,false).length;
  }
  try{
    uncut=world.extractOriginalClockworkThresholdGallery(THREE,old,
      EXIT_X,ROOF_Y,BASE_Y,WIDTH,{
        maxFaces:256,maxBatches:5,includeOriginalFlanks:true});
    cut=world.extractOriginalClockworkThresholdGallery(THREE,old,
      EXIT_X,ROOF_Y,BASE_Y,WIDTH,{
        maxFaces:256,maxBatches:5,includeOriginalFlanks:true,clearPhysicalExit:true});
    assert.ok(uncut && cut,'the real old authored gallery remains after portal-to-landing subtraction');
    assert.ok(nativeRayHits(uncut,53,8,6)>0,
      'real first landing-approach bronze post previously blocked the successor');
    assert.equal(nativeRayHits(cut,53,8,6),0,
      'the old foreground post must be physically absent from the *historic copy*');
    assert.ok(nativeRayHits(uncut,42,0,19)>0,
      'real overhead bearing originally obscured the first raised-platform camera');
    assert.equal(nativeRayHits(cut,42,0,19),0,
      'actual 12.6m source-raised headroom now has a physical aperture');
    assert.ok(nativeRayHits(cut,53,23,5)>0,
      'the non-colliding flanking Clockwork load path remains visible and connected');
    assert.equal(landingPost.parent,old);
    assert.equal(overhead.parent,old);
    assert.equal(flank.parent,old);
    assert.ok(cut.faces>0 && cut.faces<=256);
    assert.ok(cut.root.children.length<=5);
    assert.equal(cut.bytes,cut.faces*96,
      'original face/vertex memory cap, never a new world mesh budget');
    for(const m of cut.root.children){
      for(const name of ['position','normal','uv'])
        assert.ok(m.geometry.getAttribute(name),'source surface attributes must survive clipping');
    }
  }finally{
    if(uncut)for(const m of uncut.root.children){m.geometry.dispose();m.material.dispose();}
    clean(cut,old);
  }
});

test('real successor annulus remains clear through floor-nine approach without removing original exterior bronze supports',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group();
  function bearing(radius,tangent,rise,height){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(.75,height,.75),
      new THREE.MeshStandardMaterial({color:0x8b7454}));
    mesh.name='old-source-structural-bearing';mesh.userData.structural=true;
    mesh.position.set(Math.sin(at)*radius+Math.cos(at)*tangent,
      roof+rise,Math.cos(at)*radius-Math.sin(at)*tangent);
    old.add(mesh);return mesh;
  }
  const near=bearing(25,17,5,4),raised=bearing(25,24,19,4);
  const outside=bearing(40,23,5,9);
  function hits(g,r,t,rise){
    if(!g)return 0;
    g.root.updateMatrixWorld(true,true);
    const p=new THREE.Vector3(Math.sin(at)*r+Math.cos(at)*t,
      roof+rise,Math.cos(at)*r-Math.sin(at)*t);
    return new THREE.Raycaster(p,new THREE.Vector3(-Math.sin(at),0,-Math.cos(at)),0,35)
      .intersectObjects(g.root.children,false).length;
  }
  let original=null,cleared=null;
  try{
    original=world.extractOriginalClockworkThresholdGallery(THREE,old,
      EXIT_X,ROOF_Y,BASE_Y,WIDTH,{includeOriginalFlanks:true,maxFaces:256,maxBatches:4});
    cleared=world.extractOriginalClockworkThresholdGallery(THREE,old,
      EXIT_X,ROOF_Y,BASE_Y,WIDTH,{includeOriginalFlanks:true,
        clearPhysicalExit:true,maxFaces:256,maxBatches:4});
    assert.ok(original && cleared && cleared.faces>0,'actual original gallery remains');
    assert.ok(hits(original,53,17,5)>0,'real historic near-route post was visible');
    assert.ok(hits(original,53,24,19)>0,'real historic upper-route bearing was visible');
    assert.equal(hits(cleared,53,17,5),0,'true annular Floor9 walking route is no longer blocked');
    assert.equal(hits(cleared,53,24,19),0,'raised approach maintains true 3D headroom');
    assert.ok(hits(cleared,53,23,5)>0,'outside original structural shoulder survives');
    for(const mesh of [near,raised,outside])assert.equal(mesh.parent,old,
      'shipped original F8 world was never modified; only its historical copy was clipped');
    assert.ok(cleared.faces<=256 && cleared.root.children.length<=4);
    assert.equal(cleared.bytes,cleared.faces*96);
  }finally{
    if(original)for(const m of original.root.children){m.geometry.dispose();m.material.dispose();}
    clean(cleared,old);
  }
});

test('true F9 roof approach and bronze exterior share a tapered clear 3D camera corridor, leaving the original side-bearing intact',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group(), originalMeshes=[];
  const originalSource=()=>{
    function bronze(radius,tangent,rise,height=5){
      const m=new THREE.Mesh(new THREE.BoxGeometry(1.3,height,1.3),
        new THREE.MeshStandardMaterial({color:0x986b45,roughness:.68}));
      m.name='OriginalHistoricalNonCollidingGalleryShoulder';
      m.userData.structural=true;
      m.position.set(Math.sin(at)*radius+Math.cos(at)*tangent,
        roof+rise,Math.cos(at)*radius-Math.sin(at)*tangent);
      old.add(m);originalMeshes.push(m);
    }
    // Real original architectural obstructions in the UNCONNECTED wedge
    // between the older r31..50/t<=15 aperture and r22..31.5/t<=32
    // authentic F9 landing path. They are neither guardian nor collider.
    bronze(39,19,6,7);
    bronze(37,22,20,5);
    bronze(31.2,29,12,6);
    // This old, outer machine load path remains part of the bronze room.
    bronze(40,26,5,9);
  };
  originalSource();
  const saved=originalMeshes.map(m=>m.position.clone());
  const opts={includeOriginalFlanks:true,maxFaces:256,maxBatches:5};
  let before=null,after=null;
  const hits=(root,r,t,y)=>{
    root.updateWorldMatrix(true,true);
    const origin=new THREE.Vector3(
      Math.sin(at)*r+Math.cos(at)*t,roof+y,
      Math.cos(at)*r-Math.sin(at)*t);
    return new THREE.Raycaster(origin,
      new THREE.Vector3(-Math.sin(at),0,-Math.cos(at)),0,35)
      .intersectObjects(root.children,false).length;
  };
  try{
    before=world.extractOriginalClockworkThresholdGallery(
      THREE,old,EXIT_X,ROOF_Y,BASE_Y,WIDTH,opts);
    after=world.extractOriginalClockworkThresholdGallery(
      THREE,old,EXIT_X,ROOF_Y,BASE_Y,WIDTH,{
        ...opts,clearPhysicalExit:true});
    assert.ok(before && after && after.faces>0);
    for(const [r,t,y] of [[46,19,6],[44,22,20],[38,29,12]]){
      assert.ok(hits(before.root,r,t,y)>0,
        'a real old gallery column obscured the original body/roof route');
      assert.equal(hits(after.root,r,t,y),0,
        'the physical overhead/shoulder negative space must stay continuous after gateway crossing');
    }
    assert.ok(hits(after.root,50,26,5)>0,
      'bronze machine-room flange outside the source-earned route must survive');
    assert.ok(after.faces<=256 && after.bytes===after.faces*96,
      'single bounded historical source-only gallery, not an extra room');
    assert.ok(after.root.children.length<=5);
    originalMeshes.forEach((m,i)=>{
      assert.equal(m.parent,old,'the real previous floor must remain unmodified');
      assert.ok(m.position.equals(saved[i]),'no original world geometry moved');
    });
  }finally{
    for(const gallery of [before,after])if(gallery)
      for(const mesh of gallery.root.children){
        mesh.geometry.dispose();mesh.material.dispose();
      }
    old.traverse(m=>{if(m.geometry)m.geometry.dispose();if(m.material)m.material.dispose();});
  }
});

test('actual old Clockwork machine room retains BOTH exterior bearing silhouettes at the Floor9 gateway within the original face cap',async()=>{
  const [THREE,world]=await loaded;
  const old=new THREE.Group();
  const original=new THREE.BoxGeometry(.75,1.4,.75).toNonIndexed();
  const pos=original.getAttribute('position'),norm=original.getAttribute('normal'),uv=original.getAttribute('uv');
  const vertices=[],normals=[],uvs=[];
  const append=(radius,tangent,vertical)=>{
    const x=Math.sin(at)*radius+Math.cos(at)*tangent;
    const z=Math.cos(at)*radius-Math.sin(at)*tangent;
    for(let i=0;i<pos.count;i++){
      vertices.push(pos.getX(i)+x,pos.getY(i)+vertical,pos.getZ(i)+z);
      normals.push(norm.getX(i),norm.getY(i),norm.getZ(i));
      uvs.push(uv.getX(i),uv.getY(i));
    }
  };
  // Original batch order contains many nearby bronze roof faces; these
  // would consume the source-face budget before EITHER authentic exterior
  // flank is retained. All three sets remain the SAME original 3D mesh.
  for(let i=0;i<50;i++)append(25,Math.sin(i*.71)*.6,roof+3);
  append(43,-20,roof+7);
  append(43,20,roof+7);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  const source=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x97734d}));
  source.userData.structural=true;source.name='real-old-clockwork-room-source-batch';
  old.add(source);
  let selected=null;
  try{
    selected=world.extractOriginalClockworkThresholdGallery(THREE,old,
      EXIT_X,ROOF_Y,BASE_Y,WIDTH,{
        includeOriginalFlanks:true,clearPhysicalExit:true,maxFaces:36,maxBatches:1});
    assert.ok(selected && selected.faces>0 && selected.faces<=36,
      'no new source triangles beyond the old source-owned low-tier budget');
    assert.ok(selected.originalExteriorFlankFaces.left>=2,'old left machine-room brace survives');
    assert.ok(selected.originalExteriorFlankFaces.right>=2,'old right machine-room brace survives');
    assert.equal(selected.root.children.length,1,'no new material batch/draw cost');
    assert.equal(selected.bytes,selected.faces*96);
    const positions=selected.root.children[0].geometry.getAttribute('position');
    let left=false,right=false,originalRoof=false;
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),z=positions.getZ(i);
      const tangent=x*Math.cos(at)-z*Math.sin(at);
      const radial=x*Math.sin(at)+z*Math.cos(at);
      if(tangent< -17 && radial>40)left=true;
      if(tangent>17 && radial>40)right=true;
      if(Math.abs(tangent)<3 && radial<29)originalRoof=true;
    }
    assert.ok(left && right && originalRoof,
      'real old-world near-roof, left and right load paths form one physical room');
    assert.equal(source.parent,old,'F8 source geometry is never rewritten');
  }finally{
    if(selected)for(const child of selected.root.children){
      child.geometry.dispose();child.material.dispose();
    }
    original.dispose();geometry.dispose();source.material.dispose();
  }
});
