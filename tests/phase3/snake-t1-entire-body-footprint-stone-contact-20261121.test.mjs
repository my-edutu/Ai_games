import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld, planCohesiveRuinsPaving } from '../../public/snake-stream/world.mjs';

// The actual serpent is ~0.319 world units in radius. Its centre isn't the
// whole footprint; a visible canyon under a shoulder at a legal cell is not
// an authored broken ruin, it's a lost support surface. Include cardinal and
// diagonal representative points INSIDE that real footprint, not a fake route.
const footprints = Object.freeze([
  [0,0], [0.30,0], [-0.30,0], [0,0.30], [0,-0.30],
  [0.225,0.225], [-0.225,0.225], [0.225,-0.225], [-0.225,-0.225],
]);

test('real complete 3D stone supports all legitimate serpent body footprints, not only cell centres', () => {
  for (const [width,height] of [[8,8],[28,16],[40,24]]) {
    const world=createWorld(THREE,{width,height});
    try {
      const paving=world.group.children.find(mesh=>mesh.isMesh && mesh.userData.staticWorld &&
        mesh.material?.map?.image?.width===1024 && mesh.material.map.image.height===512);
      assert.ok(paving,'the original textured 3D playable stone, not fallback soil');
      assert.equal(world.stats().staticMeshes,13,'all existing 13 static material batches remain');
      assert.equal(paving.geometry.index.count,planCohesiveRuinsPaving(width,height).length*120,
        'retain all real authored 3D stone triangles and complete sculpted outer layers');
      const ray=new THREE.Raycaster();
      const down=new THREE.Vector3(0,-1,0);
      let checks=0;
      for(let z=0;z<height;z++)for(let x=0;x<width;x++)for(const [dx,dz] of footprints){
        ray.set(new THREE.Vector3(x+.5-width/2+dx,1,z+.5-height/2+dz),down);
        const top=ray.intersectObject(paving,false).find(hit=>Math.abs(hit.point.y)<.025);
        assert.ok(top,
          `the ${width}x${height} REAL stone must carry serpent radius sample ${x},${z} (${dx},${dz})`);
        checks++;
      }
      assert.equal(checks,width*height*footprints.length);
    } finally {world.dispose();}
  }
});
