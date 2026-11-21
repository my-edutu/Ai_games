import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createWorld, planCohesiveRuinsPaving } from '../../public/snake-stream/world.mjs';
import { sampleGardenEcotone } from '../../public/snake-stream/garden-biomes.mjs';

// Latest source-matched Chromium: the 1920x1080 playable court became nearly
// entirely BLACK while trees, stone borders, and serpent continued rendering.
// Source-exact root cause: the previous slab vertex pigment reads an undefined
// forest floor `coolSlate` field and uploads NaN blue channels to WebGL.
test('every playable native stone vertex has finite visible 3-channel material on real boards', () => {
  for (const [width,height] of [[8,8],[28,16],[40,24]]) {
    const world=createWorld(THREE,{width,height});
    try {
      const stone=world.group.children.find(mesh=>mesh.name==='Ruins / c3c4ad');
      assert.ok(stone?.isMesh,'keep native limestone playable geometry');
      const rgba=stone.geometry.getAttribute('color');
      assert.equal(rgba.count,planCohesiveRuinsPaving(width,height).length*120);
      let varied=0;
      for(let i=0;i<rgba.count;i+=120){
        const unique=new Set();
        for(let j=i;j<i+120;j++){
          const rgb=[rgba.getX(j),rgba.getY(j),rgba.getZ(j)];
          assert.ok(rgb.every(channel=>Number.isFinite(channel)&&channel>=0&&channel<=1),
            `${width}x${height} original 3D limestone vertex ${j} must have visible finite RGB; ${rgb}`);
          assert.ok(rgb[0]+rgb[1]+rgb[2]>.24,'native stone cannot disappear into black');
          unique.add(rgb.map(n=>n.toFixed(3)).join(':'));
        }
        if(unique.size>=5)varied++;
      }
      assert.ok(varied>=Math.ceil(.75*rgba.count/120),'preserve genuinely varied planted stone habitat');
      assert.equal(world.stats().staticMeshes,13,'no scenery removed to recover colour');
    }finally{world.dispose()}
  }
});

test('shared physical ecotone exposes finite cool rain-cut stone value without changing planted authority',()=>{
  for(const [width,height] of [[8,8],[28,16],[40,24]]) {
    for(const [u,v] of [[.02,.04],[.25,.34],[.52,.50],[.8,.91],[.999,.999]]) {
      const ecotone=sampleGardenEcotone(u,v,width,height);
      assert.ok(Number.isFinite(ecotone.coolSlate) && ecotone.coolSlate>=0 && ecotone.coolSlate<=1,
        'native vertex colour must consume the physical stone habitat, not an undefined floor field');
      for (const n of [ecotone.forest,ecotone.limestone,ecotone.sunstone]) assert.ok(Number.isFinite(n));
    }
  }
});
