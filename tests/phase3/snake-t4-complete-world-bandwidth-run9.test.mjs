import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import * as World from '../../public/snake-stream/world.mjs';

const seeds=[[8,8],[28,16],[40,24]];

test('all genuinely complete static 3D garden batches retain geometry but use normalized narrow WebGL normal/tint attributes',()=>{
 for (const [width,height] of seeds){
  const world=World.createWorld(THREE,{width,height});
  try{
   const meshes=world.group.children.filter(m=>m.isMesh&&m.userData.staticWorld);
   assert.equal(meshes.length,13,'original native thirteen complete lit world batches');
   const stats=world.stats();
   assert.equal(stats.textures,4,'original complete native maps');
   assert.equal(stats.drawObjects,33,'original complete scene batch count');
   let before=0,after=0;
   for(const mesh of meshes){
    const g=mesh.geometry,n=g.getAttribute('normal'),c=g.getAttribute('color');
    assert.equal(g.getAttribute('position').array.BYTES_PER_ELEMENT,4,'no spatial precision compromise');
    assert.equal(g.getAttribute('uv').array.BYTES_PER_ELEMENT,4,'original atlas placement preserved');
    assert.ok(g.index?.count>0 && g.getAttribute('position').count===n.count,'all authored triangles remain');
    assert.ok(mesh.castShadow&&mesh.receiveShadow,'unchanged authored light/shadows');
    assert.ok(mesh.userData.visibilityBlocks.length>0,'full culling metadata survives');
    assert.ok(n.array instanceof Int16Array && n.normalized,'native normalized signed shader normals');
    if(c)assert.ok(c.array instanceof Uint8Array && c.normalized,'native normalized 8-bit shader pigment');
    before+=n.count*12+(c?.count??0)*12;
    after+=n.array.byteLength+(c?.array.byteLength??0);
   }
   assert.ok(before-after>500000,`material memory savings should be substantive, found ${before-after}`);
   assert.ok(after/before<0.56,`must preserve all geometry but halve expensive shader inputs: ${after}/${before}`);
  }finally{world.dispose();}
 }
});

test('source-owned packing is loss-bounded with genuine normalized Three.js interpolation and rejects unsafe pigments',()=>{
 assert.equal(typeof World.compactStaticWorldAttributes,'function','production world must implement packing after complete geometry creation');
 const g=new THREE.BufferGeometry();
 const normals=Float32Array.from([0,1,0,.57735026,.57735026,.57735026,-.989121,.146213,-.03532,0,0,-1]);
 const colors=Float32Array.from([.2588039,.774839,.9395784,.45,.52,.88,.899,.603,.412,.627,.519,.501]);
 g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const info=World.compactStaticWorldAttributes(THREE,g);
 assert.ok(info.savedBytes>0 && info.maxNormalError<3.1e-5 && info.maxTintError<.002);
 for(let i=0;i<normals.length;i++)assert.ok(Math.abs(normals[i]-g.attributes.normal.getComponent(Math.floor(i/3),i%3))<3.1e-5);
 for(let i=0;i<colors.length;i++)assert.ok(Math.abs(colors[i]-g.attributes.color.getComponent(Math.floor(i/3),i%3))<.002);
 g.dispose();
 const unsafe=new THREE.BufferGeometry();unsafe.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0],3));unsafe.setAttribute('color',new THREE.Float32BufferAttribute([1.1,.1,.2],3));
 assert.throws(()=>World.compactStaticWorldAttributes(THREE,unsafe),/Unbounded|out-of-range/);
 unsafe.dispose();
});
