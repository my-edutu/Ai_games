import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildForestTerraceRim, stageHeadlandAnchors, createWorld } from '../../public/snake-stream/world.mjs';

// Candidate must be an integrated, non-rectangular physical island edge joined
// to actual authored groves, not another tint-only court or a second collision.
for (const [width, height] of [[8,8],[28,16],[40,24]]) {
  test(`T1 ${width}x${height}: seven physical woodland headlands sculpt the intact court's exterior rim`, () => {
    const rock = buildForestTerraceRim(THREE,width,height,'bedrock');
    const moss = buildForestTerraceRim(THREE,width,height,'moss');
    try {
      const W=width/2,H=height/2,p=rock.getAttribute('position');
      const sectors=96,rings=6;
      assert.equal(p.count,sectors*rings);
      const nearCrown=[];
      for (const headland of stageHeadlandAnchors(width,height)) {
        const angle=Math.atan2(headland.z,headland.x);
        const sector=((Math.round(angle*sectors/(Math.PI*2))%sectors)+sectors)%sectors;
        const x=p.getX(5*sectors+sector), z=p.getZ(5*sectors+sector);
        const radial=Math.hypot(x,z);
        const c=Math.cos(angle),s=Math.sin(angle);
        const baseline=Math.min((W+.14)/Math.max(1e-8,Math.abs(c)),
          (H+.14)/Math.max(1e-8,Math.abs(s)));
        nearCrown.push(radial-baseline);
      }
      assert.ok(nearCrown.filter(v=>v>4.25).length>=4,
        `actual headlands should tug the entire coastline outward, not form an even rectangular frame: ${nearCrown}`);
      let high=0,deep=0;
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
        assert.ok(Math.abs(x)>W+.08 || Math.abs(z)>H+.08,'no raised scenery within legal court');
        high+=Number(y>.49); deep+=Number(y<-.35);
      }
      assert.ok(high>=6, 'multi-level rooted headlands must protrude visibly above low coping');
      assert.ok(deep>50, 'cliff reaches the existing water / geology, not a surface sticker');
      const g=[rock,moss];
      for(const terrain of g){
        const mesh=new THREE.Mesh(terrain,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
        const ray=new THREE.Raycaster();ray.far=10;
        for(let z=0;z<height;z++) for(let x=0;x<width;x++){
          ray.set(new THREE.Vector3(x-(width-1)/2,3,z-(height-1)/2),new THREE.Vector3(0,-1,0));
          assert.equal(ray.intersectObject(mesh,false).length,0,`(${x},${z}) legal stone occluded by new relief`);
        }
        mesh.material.dispose();
      }
      const world=createWorld(THREE,{width,height});
      try {assert.equal(world.stats().staticMeshes,13);assert.equal(world.stats().textures,4);}
      finally{world.dispose();}
    }finally{rock.dispose();moss.dispose();}
  });
}
