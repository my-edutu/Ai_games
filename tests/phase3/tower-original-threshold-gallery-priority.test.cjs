'use strict';
// Real THREE source-geometry contract for P0 old-bronze -> Floor9 load path.
// This is a renderer-side comparison, NOT native WebM or game-loop acceptance.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { pathToFileURL } = require('node:url');
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
  "'./source-physical-arrival-palette.mjs'":uri('source-physical-arrival-palette.mjs'),
  "'./world-surface.mjs'":uri('world-surface.mjs'),
  "'./scene-hierarchy.mjs'":uri('scene-hierarchy.mjs'),
  "'./mesh-provenance.mjs'":uri('mesh-provenance.mjs'),
  "'./guardian-transmission-layout.mjs'":uri('guardian-transmission-layout.mjs'),
})) {
  assert.ok(source.includes(from),'shipped import must exist: '+from);
  source = source.replace(from,JSON.stringify(to));
}
fs.writeFileSync(local,source);
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
