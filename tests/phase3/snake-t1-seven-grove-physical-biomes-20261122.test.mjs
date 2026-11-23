import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createHash } from 'node:crypto';
import { buildWoodlandGroveTerraces, stageHeadlandAnchors, createWorld } from '../../public/snake-stream/world.mjs';

// These seven original forests must sit on real, irregular, reachable-by-the-
// landscape (not gameplay) stone/loam landmasses, rather than seven suspended
// groups of trees or thin wires connecting to an otherwise rectangular court.
for (const [width,height] of [[8,8],[28,16],[40,24]]) {
  test(`T1 ${width}x${height}: seven complete three-dimensional grove floors, safe original board and unchanged draw budget`, () => {
    const rock=buildWoodlandGroveTerraces(THREE,width,height,'bedrock');
    const moss=buildWoodlandGroveTerraces(THREE,width,height,'moss');
    const anchors=stageHeadlandAnchors(width,height);
    try {
      const W=width/2,H=height/2;
      for(const g of [rock,moss]) {
        const p=g.getAttribute('position'),ix=g.getIndex();
        assert.equal(p.count,7*(1+3*32),'all seven physical biomes, no sprites');
        assert.equal(ix.count/3,7*(32+2*64),'bound complete surface geometry');
        let rooted=0,sunk=0;
        for(let j=0;j<p.count;j++) {
          const x=p.getX(j),y=p.getY(j),z=p.getZ(j);
          assert.ok([x,y,z].every(Number.isFinite),'finite own-world 3D geometry');
          assert.ok(Math.abs(x)>W+.08 || Math.abs(z)>H+.08, 'no terraforming any authoritative stone cell');
          rooted += Number(y>.24); sunk+=Number(y< -1.5);
        }
        assert.ok(rooted>100 && sunk>150, 'significant raised groves plus physically deep shores');
        for(let k=0;k<ix.count;k+=3) {
          const a=ix.getX(k),b=ix.getX(k+1),c=ix.getX(k+2);
          const area=(p.getZ(b)-p.getZ(a))*(p.getX(c)-p.getX(a))-(p.getX(b)-p.getX(a))*(p.getZ(c)-p.getZ(a));
          assert.ok(area>1e-6, 'every triangle faces upward, without degenerate overlapping shore strata');
        }
        // The centre of every authored grove has a real top at its actual anchor.
        const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
        const ray=new THREE.Raycaster();ray.far=12;
        for (const {x,z} of anchors) {
          ray.set(new THREE.Vector3(x,6,z),new THREE.Vector3(0,-1,0));
          assert.ok(ray.intersectObject(mesh,false).some(hit=>hit.point.y>-.05), `actual forest ground at ${x},${z}`);
        }
        for(let z=0;z<height;z++)for(let x=0;x<width;x++) {
          ray.set(new THREE.Vector3(x-(width-1)/2,5,z-(height-1)/2),new THREE.Vector3(0,-1,0));
          assert.equal(ray.intersectObject(mesh,false).length,0,`original playable cell remains clear (${x},${z})`);
        }
        mesh.material.dispose();
      }
      const world=createWorld(THREE,{width,height});
      try { assert.equal(world.stats().staticMeshes,13);assert.equal(world.stats().textures,4); }
      finally {world.dispose();}
    } finally {rock.dispose();moss.dispose();}
  });
}

// The grove terrain is presentation-owned deterministic original geometry.
// Recreating/disposal cannot accidentally alter any public seed, collision or
// private-authority state, and nothing relies on a live animation clock.
test('T1 repeated complete grove biomes are byte-for-byte deterministic and independently disposable',()=>{
  const hashes=[];
  for(let repeat=0;repeat<3;repeat++){
    const geometry=buildWoodlandGroveTerraces(THREE,28,16,'bedrock');
    const hash=createHash('sha256');
    hash.update(new Uint8Array(geometry.getAttribute('position').array.buffer));
    hash.update(new Uint8Array(geometry.getIndex().array.buffer));
    hashes.push(hash.digest('hex'));geometry.dispose();
  }
  assert.equal(new Set(hashes).size,1,'source-exact static landscape regeneration cannot drift');
});
