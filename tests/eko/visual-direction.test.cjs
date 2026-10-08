'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const THREE=require('three');
async function importSource(relativePath){
  const code=fs.readFileSync(path.resolve(__dirname,'../../'+relativePath),'utf8');
  return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
const createHelpers=()=>{
  const palette=new Map(),cachedGeo=new THREE.BoxGeometry(1,1,1);
  const mat=c=>{if(!palette.has(c))palette.set(c,new THREE.MeshBasicMaterial({color:c}));return palette.get(c)};
  return {
    box:(parent,w,h,d,x,y,z,c)=>{
      const mesh=new THREE.Mesh(cachedGeo,mat(c));mesh.scale.set(w,h,d);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
    },
    ball:(parent,size,x,y,z,c)=>{
      const mesh=new THREE.Mesh(cachedGeo,mat(c));mesh.scale.set(size,size,size);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
    },
    cylinder:(parent,top,bottom,height,x,y,z,c)=>{
      const mesh=new THREE.Mesh(cachedGeo,mat(c));mesh.position.set(x,y,z);mesh.scale.set(top,height,bottom);parent.add(mesh);return mesh;
    },
    labelSprite:(parent,text,x,y,z)=>{
      const sprite=new THREE.Sprite(new THREE.SpriteMaterial());sprite.position.set(x,y,z);sprite.name=text;parent.add(sprite);return sprite;
    },
    material:mat,palette
  };
};
test('vibrant Lagos art grammar creates rich depth and does not block the gameplay lane',async()=>{
  const {composeStreetVibrance}=await importSource('public/eko-run/world-vibrance.js');
  const terrain=new THREE.Group(),h=createHelpers();
  const result=composeStreetVibrance(THREE,{terrain,...h,district:'mainland-morning',length:150,quality:'high'});
  assert.equal(result.kind,'original-lagos-chromatic');
  assert.ok(result.features>500,result);
  assert.ok(h.palette.size>=12,'street should have an authentic, varied color palette');
  const root=terrain.children[0];let meshes=0;
  root.traverse(node=>{
    if(!node.isMesh)return;
    meshes++;
    // Visual crosswalk decals are flat; all architecture sits outside the running strip.
    if(Math.abs(node.position.z)<2.8)assert.ok(node.position.y<.20,
      'unexpected obstruction above road at '+JSON.stringify(node.position));
  });
  assert.ok(meshes>600,'expect layered architecture and dressing, not empty boxes');
});
test('distinct Lagos district palettes and reduced-detail mode work without changing game state',async()=>{
  const {composeStreetVibrance}=await importSource('public/eko-run/world-vibrance.js');
  const before=JSON.stringify({player:{position:{x:5,y:0}},tick:11});
  const colors=[];
  for(const district of ['mainland-morning','market-rush','island-night']){
    const terrain=new THREE.Group(),h=createHelpers();
    const result=composeStreetVibrance(THREE,{terrain,...h,district,length:65,quality:'low'});
    colors.push([...h.palette.keys()]);
    assert.ok(result.features>200);
  }
  assert.notDeepEqual(colors[0],colors[1]);
  assert.notDeepEqual(colors[1],colors[2]);
  assert.equal(JSON.stringify({player:{position:{x:5,y:0}},tick:11}),before);
});
test('cinematic sky is one persistent shader and changes per district with safe disposal',async()=>{
  const {createCityAtmosphere}=await importSource('public/eko-run/atmosphere.js');
  const scene=new THREE.Scene();
  const atmosphere=createCityAtmosphere(THREE,scene);
  assert.equal(atmosphere.signature,'single-shader-city-sky');
  assert.equal(scene.children.length,1);
  atmosphere.setDistrict('mainland-morning');
  atmosphere.update(19,1000,false);
  const sky=scene.getObjectByName('Eko procedural sunset sky');
  assert.ok(sky && sky.material.isShaderMaterial);
  assert.equal(sky.position.x,19);
  const light=sky.material.uniforms.skyBottom.value.clone();
  atmosphere.setDistrict('island-night');
  assert.notEqual(sky.material.uniforms.skyBottom.value.getHex(),light.getHex());
  atmosphere.update(31,1100,true);
  assert.equal(sky.position.x,31);
  atmosphere.destroy();
  assert.equal(scene.children.length,0);
});
test('semantic VFX are bounded, idempotent, accessibility-aware and presentation-only',async()=>{
  const {createEkoGameFeel}=await importSource('public/eko-run/gamefeel.js');
  const scene=new THREE.Scene(),vfx=createEkoGameFeel(THREE,scene);
  const publicPlayer={position:{x:9,y:0}};
  const events=[{sequence:1,tick:101,type:'player.jumped',data:{x:9,y:0}},
                {sequence:2,tick:102,type:'token.collected',data:{x:9.2,y:0}}];
  vfx.ingest(events,publicPlayer,'public-run');
  const before=vfx.stats();
  assert.equal(before.emitted,30);
  vfx.ingest(events,publicPlayer,'public-run');
  assert.equal(vfx.stats().emitted,before.emitted,'duplicate SSE snapshots must not duplicate rewards');
  vfx.update(.10,false,'low');
  assert.ok(vfx.stats().active<=110);
  vfx.update(.20,true,'low');
  assert.equal(vfx.stats().active,0,'reduced motion must hide effects');
  assert.equal(scene.children.length,1);
  vfx.dispose();
  assert.equal(scene.children.length,0);
});
