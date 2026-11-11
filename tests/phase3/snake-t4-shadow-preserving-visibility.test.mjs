import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWorld} from '../../public/snake-stream/world.mjs';

test('full original shadow casters and camera-local color indices coexist in the same first render', () => {
  const world=createWorld(THREE,{width:28,height:16});
  try {
    const camera=new THREE.PerspectiveCamera(36,960/540,.1,180);
    camera.position.set(0,4,10);camera.lookAt(0,1,0);camera.updateMatrixWorld();
    const meshes=world.group.children.filter(mesh=>mesh.isMesh&&mesh.userData.staticWorld);
    assert.equal(meshes.length,13);
    world.updateStaticCameraVisibility(camera);
    const full=meshes.reduce((sum,mesh)=>sum+mesh.geometry.index.count,0);
    const color=meshes.reduce((sum,mesh)=>sum+mesh.geometry.drawRange.count,0);
    assert.ok(color<full*.8,`camera must avoid offscreen geometry even on shadow-refresh frames (${color}/${full})`);
    for(const mesh of meshes){
      const cameraRange={...mesh.geometry.drawRange};
      // Three.WebGLShadowMap calls this hook before its GPU draw, and the
      // normal WebGLRenderer invokes onBeforeRender before the color draw.
      mesh.onBeforeShadow();
      assert.deepEqual({start:mesh.geometry.drawRange.start,count:mesh.geometry.drawRange.count},
        {start:0,count:mesh.geometry.index.count},`full original shadow map ${mesh.name}`);
      mesh.onBeforeRender();
      assert.deepEqual({start:mesh.geometry.drawRange.start,count:mesh.geometry.drawRange.count},
        {start:cameraRange.start,count:cameraRange.count},`camera range restored ${mesh.name}`);
    }
    assert.equal(meshes.reduce((sum,mesh)=>sum+mesh.geometry.drawRange.count,0),color);
  } finally {world.dispose();}
});
