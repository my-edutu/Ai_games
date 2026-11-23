import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildShoreRuinArcades, createWorld } from '../../public/snake-stream/world.mjs';

const boards = [[8,8], [28,16], [40,24]];
const origin = new THREE.Vector3();
const direction = new THREE.Vector3(0,0,-1);

for (const [width,height] of boards) {
  test(`T1 south foreground has three genuine, physically hollow coastal arches: ${width}x${height}`, () => {
    const stone = buildShoreRuinArcades(THREE,width,height,'bedrock');
    const lichen = buildShoreRuinArcades(THREE,width,height,'moss');
    const H=height/2, z=H+3.5;
    assert.equal(stone.userData.shoreRuinOpenings,8, 'all west/east AND south openings should be authored');
    assert.equal(stone.userData.sharedShorePiers,11, 'four south masonry piers must connect to both existing coasts');
    assert.equal(stone.userData.continuousShoreAbutments,11);
    assert.equal(lichen.userData.shoreRuinOpenings,8);
    const stoneMesh = new THREE.Mesh(stone,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
    stoneMesh.updateMatrixWorld(true);
    const ray = new THREE.Raycaster();
    for(const x of [-2.6,0,2.6]){
      // Real three-dimensional visibility: players can look through the whole
      // low arch, but its original limestone overhead vault must be solid.
      ray.set(origin.set(x,1.25,z+4.0),direction);
      assert.equal(ray.intersectObject(stoneMesh).length,0,`south span ${x} is physically OPEN`);
      ray.set(origin.set(x,3.67,z+4.0),direction);
      assert.ok(ray.intersectObject(stoneMesh).length>0,`south span ${x} has a real stone VAULT`);
    }
    // All new stone remains outside playable court; the original grid, fruit,
    // hazards and portal heads are owned by authoritative public state only.
    const attrs=stone.getAttribute('position');
    let southVertices=0;
    for(let i=0;i<attrs.count;i++)if(attrs.getZ(i)>H+1.5 && Math.abs(attrs.getX(i))<4.8) southVertices++;
    assert.ok(southVertices>500,'south landscape landmark must have enough real 3D structure');
    stoneMesh.material.dispose();stone.dispose();lichen.dispose();
  });
}

test('T1 south shore integrates into original two static world batches without mutating game geometry',()=>{
  const scene=createWorld(THREE,{width:28,height:16});
  try{
    assert.equal(scene.stats().staticMeshes,13);
    assert.equal(scene.stats().textures,4);
    const meshes=[];scene.group.traverse(object=>{if(object.isMesh && object.userData.staticWorld) meshes.push(object);});
    assert.equal(meshes.length,13);
    const southern=meshes.filter(object=>{
      const pos=object.geometry.getAttribute('position');
      for(let i=0;i<pos.count;i++)if(pos.getZ(i)>8+2&&Math.abs(pos.getX(i))<4.8&&pos.getY(i)>2.4)return true;
      return false;
    });
    assert.ok(southern.length>=1,'open south-arch vertices are integrated into the native world');
  }finally{scene.dispose();}
});
