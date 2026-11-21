import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld, planCohesiveRuinsPaving, sculptWeatheredRuinsCorner } from '../../public/snake-stream/world.mjs';

function actualPaving(world){
  const matches=world.group.children.filter(mesh=>mesh.isMesh && mesh.userData.staticWorld &&
    mesh.material?.map?.image?.width===1024 && mesh.material.map.image.height===512);
  assert.equal(matches.length,1,'one real original stone atlas material, not overlay geometry');
  return matches[0];
}

test('the entire 3D PLAYABLE court has deterministic physical erosion on multi-cell masonry, not dead 1x1-only decoration', () => {
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const plan=planCohesiveRuinsPaving(width,height);
    assert.ok(plan.length>=7 && plan.every(s=>s.w*s.h>1),
      'real board slabs are larger than 1x1; historical singleton-only erosion never executed');
    const displaced=[];
    for(const slab of plan)for(let corner=0;corner<4;corner++){
      const erosion=sculptWeatheredRuinsCorner(slab,width,height,corner);
      assert.ok(Number.isFinite(erosion.insetX)&&Number.isFinite(erosion.insetZ)&&Number.isFinite(erosion.rise));
      assert.ok(erosion.insetX>=.06&&erosion.insetX<=.215);
      assert.ok(erosion.insetZ>=.06&&erosion.insetZ<=.215);
      assert.ok(Math.abs(erosion.rise)<.011,'flat safe game-cell contact remains intact');
      assert.deepEqual(erosion,sculptWeatheredRuinsCorner(slab,width,height,corner));
      displaced.push(erosion);
    }
    assert.ok(displaced.filter(e=>e.insetX>.07&&e.insetZ>.07).length>plan.length,
      'many actual large top slabs physically erode in BOTH axes');
    const world=createWorld(THREE,{width,height});
    try {
      const mesh=actualPaving(world), verts=mesh.geometry.attributes.position;
      assert.equal(verts.count,plan.length*120,'same draw batch, original authorship with richer native silhouette');
      // The actual baked real-time mesh must contain top corners with physical
      // displacement from original geometric rectangular slab coordinates.
      let visiblyWeathered=0;
      for(const slab of plan){
        const cx=slab.x+slab.w/2-width/2,cz=slab.z+slab.h/2-height/2;
        const idealX=cx-.487*(slab.w-.09),idealZ=cz-.487*(slab.h-.09);
        let nearest=Infinity;
        for(let v=0;v<verts.count;v++){
          const yy=verts.getY(v);
          if(Math.abs(yy)>.011)continue;
          const dx=verts.getX(v)-idealX,dz=verts.getZ(v)-idealZ;
          const d=Math.hypot(dx,dz);
          if(d<nearest)nearest=d;
        }
        if(nearest>.043 && nearest<.28)visiblyWeathered++;
      }
      assert.ok(visiblyWeathered>=Math.ceil(plan.length*.60),
        `actual native top corners must be weathered across the whole ${width}x${height} game: ${visiblyWeathered}/${plan.length}`);
      assert.equal(mesh.geometry.index.count,plan.length*120,'all 40 original crafted top/side triangles per slab are present');
    }finally{world.dispose();}
  }
});
