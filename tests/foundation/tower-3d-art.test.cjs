'use strict';
const fs=require('node:fs'),path=require('node:path');
const {test}=require('node:test'),assert=require('node:assert/strict'),THREE=require('three');
const ROOT=path.resolve(__dirname,'../../public/infinite-tower-climb');
function loadFactory(file,name){
  const source=fs.readFileSync(path.join(ROOT,file),'utf8').replace(/\bexport\s+(async\s+)?function\b/g,(_match,modifier)=>(modifier||'')+'function');
  return new Function(source+';return '+name+';')();
}
function fakeCanvas(){
  return {width:512,height:512,getContext(){
    return {fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillStyle:'',strokeStyle:'',lineWidth:1};
  }};
}
test('tower art is made from actual THREE meshes and animatable body parts',()=>{
  const rig=loadFactory('character3d.js','createClimber')(THREE);
  const parts=[];rig.root.traverse(n=>{if(n.isMesh)parts.push(n)});
  assert.ok(parts.length>=45,'climber should have body, articulated limbs and gear');
  rig.setMotion(0,.6,'ascending');assert.equal(rig.pose,'climb');
  rig.animate(1,false);rig.setMotion(.7,0,'run');assert.equal(rig.pose,'run');
  rig.animate(1.1,false);assert.ok(parts.every(m=>m.geometry&&m.material));
});
test('tower enemy/platform geometry is volumetric and guardian differs from normal enemies',()=>{
  const art=loadFactory('entities3d.js','createTowerEntities')(THREE);
  const moving=art.platform({kind:'moving'},0,0,12,1);
  const guardian=art.enemy({kind:'guardian',telegraph:true},0,0,2,3);
  const soldier=art.enemy({kind:'patroller',telegraph:false},0,0,2,3);
  assert.ok(moving.children.length>5);
  assert.ok(guardian.children.length>soldier.children.length);
  assert.ok(art.hazard({active:true},0,0,6,2).children.length>2);
  assert.ok(art.pickup({kind:'health'},0,0).children.length>=2);
});
test('tower architecture contains instanced stonework and distinct official biome palettes',()=>{
  const previous=global.document;
  global.document={createElement(name){assert.equal(name,'canvas');return fakeCanvas()}};
  try{
    const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x102030,.01);scene.background=new THREE.Color(0);
    const env=loadFactory('environment3d.js','createTowerEnvironment')(THREE,scene);
    assert.ok(env.root.children.some(child=>child.isInstancedMesh));
    const colors=[];
    for(const theme of ['foundry','ruins','clockwork','storm','void']){
      env.setTheme(theme);colors.push(env.materials[0].color.getHex());
      assert.ok(env.biomeDecor[theme].visible,theme+' scene geometry should become visible');
      assert.equal(Object.values(env.biomeDecor).filter(g=>g.visible).length,1,'only one active biome scene');
      assert.ok(env.biomeDecor[theme].children.length>0,'biome is not merely a recolor');
    }
    assert.equal(new Set(colors).size,5);
  }finally{global.document=previous}
});
test('visual-only GPU particle system maintains a strict allocation cap',()=>{
  const scene=new THREE.Scene(),vfx=loadFactory('vfx3d.js','createTowerVfx')(THREE,scene);
  assert.equal(vfx.count,240);
  for(let i=0;i<150;i++)vfx.update(.016,{x:3,y:7,z:0,dx:1,dy:2},'foundry',.9,false);
  const points=scene.children.find(o=>o.isPoints);
  assert.ok(points);assert.equal(points.geometry.getAttribute('position').count,240);
});
