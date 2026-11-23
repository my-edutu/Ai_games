import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildShoreRuinArcades, createWorld } from '../../public/snake-stream/world.mjs';

const cases=[[8,8],[28,16],[40,24]];
function heightAt(geometry,x,z){
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  const ray=new THREE.Raycaster(new THREE.Vector3(x,1.0,z),new THREE.Vector3(0,-1,0),0,3);
  const collisions=ray.intersectObject(mesh,false);
  mesh.material.dispose();
  return collisions.find(c=>c.point.y<0)?.point.y;
}

test('T1 ruin arcades gain physically grounded coastal approach to all eleven masonry pier sites on three shores',()=>{
  for(const [width,height] of cases)for(const layer of ['bedrock','moss']){
    const g=buildShoreRuinArcades(THREE,width,height,layer);
    try {
      assert.equal(g.userData.continuousShoreAbutments,11);
      assert.equal(g.userData.abutmentCourseCount,3);
      for(const side of [-1,1]){
        const zs=side===-1?[-4.15,-1.55,1.30,4.15]:[2.725,.125,-2.725];
        for(const z of zs){
          const x0=side*(width/2+.84),x1=side*(width/2+1.6),x2=side*(width/2+2.65);
          for(const x of [x0,x1,x2]){
            const y=heightAt(g,x,z);
            assert.ok(Number.isFinite(y)&&y<=-.05, `stone or moss physically connects ${width}x${height} ${layer} side=${side}, x=${x}, z=${z} y=${y}`);
          }
        }
      }
      // The newly completed south elevation must share the same continuous
      // three-course foundation into the ORIGINAL shore, not a fourth island.
      for(const x of [-3.9,-1.3,1.3,3.9])for(const z of [height/2+.84,height/2+1.6,height/2+2.65]){
        const y=heightAt(g,x,z);
        assert.ok(Number.isFinite(y)&&y<=-.05,`native south pier connected ${width}x${height} ${layer} ${x}:${z}`);
      }
    } finally {g.dispose();}
  }
});

test('T1 ruin foundations preserve a genuinely hollow arcade and legal playing substrate under every board',()=>{
  for(const [width,height] of cases){
    const g=buildShoreRuinArcades(THREE,width,height,'bedrock');
    const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
    try {
      const ray=new THREE.Raycaster(new THREE.Vector3(-width/2+1,1.45,0),new THREE.Vector3(-1,0,0),0,12);
      assert.equal(ray.intersectObject(mesh,false).length,0,'main west vault keeps authentic empty passage above coastal abutment');
      for(let i=0;i<g.getAttribute('position').count;i++){
        const x=g.getAttribute('position').getX(i);
        const z=g.getAttribute('position').getZ(i);
        assert.ok(Math.abs(x)>=width/2+.65||z>=height/2+.65, 'all three shore ruin foundations stay outside collision-bearing board');
      }
    }finally {mesh.material.dispose();g.dispose();}
    const w=createWorld(THREE,{width,height});
    try {assert.equal(w.stats().staticMeshes,13);assert.equal(w.stats().textures,4)}
    finally{w.dispose()}
  }
});
