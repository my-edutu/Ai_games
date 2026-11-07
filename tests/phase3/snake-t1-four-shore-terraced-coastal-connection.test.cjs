'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

// T1 whole-world acceptance guard: geometry, not another one-off pigment tweak.
// This guards a single coherent 3D coastal landmass on each board size while
// leaving every playable tile, resource batch, shadow and dynamic cue intact.
test('T1 original island shelves form four physically connected wooded tidal headlands, not a thin rectangular skirt', async () => {
  const THREE = await import('three');
  const { buildErodedIslandShelfGeometry, stageHeadlandAnchors } = await import('../../public/snake-stream/world.mjs');
  for (const [width, height] of [[8,8], [28,16], [40,24]]) {
    for (const layer of ['cliff','moss']) {
      const mesh = buildErodedIslandShelfGeometry(THREE,width,height,layer);
      const repeat = buildErodedIslandShelfGeometry(THREE,width,height,layer);
      try {
        const pos = mesh.getAttribute('position'), second = repeat.getAttribute('position');
        const sectors = 96, W=width/2,H=height/2;
        assert.equal(pos.count,1+sectors*4,'keep exactly the original mesh and vertex budget');
        assert.deepEqual(pos.array,second.array,'all authored geometry must be deterministic');
        const deviation = [];
        const shoreGrowth = new Set();
        for (let i=0;i<sectors;i++) {
          const theta=2*Math.PI*i/sectors;
          const cx=Math.cos(theta),cz=Math.sin(theta);
          const landward = Math.hypot(pos.getX(1+i),pos.getZ(1+i));
          const mid = Math.hypot(pos.getX(1+sectors*2+i),pos.getZ(1+sectors*2+i));
          const outer = Math.hypot(pos.getX(1+sectors*3+i),pos.getZ(1+sectors*3+i));
          assert.ok(outer>mid+0.25 && mid>landward+0.28,'one non-inverting, physically terraced coastal shelf');
          assert.ok(pos.getY(1+i)<-.2,'island top remains under playable board');
          const base=Math.min((W+(layer==='cliff'?1.26:1.39))/Math.max(1e-6,Math.abs(cx)),
            (H+(layer==='cliff'?1.31:1.45))/Math.max(1e-6,Math.abs(cz)));
          const growth=outer-base-(layer==='cliff'?3.32:.86);
          deviation.push(growth);
          if(growth>1.65)shoreGrowth.add(Math.abs(cx)>Math.abs(cz)?(cx>0?'east':'west'):(cz>0?'south':'north'));
        }
        assert.ok(Math.max(...deviation)-Math.min(...deviation)>2.35,
          `${layer} ${width}x${height}: entire coast must have substantial physical bays and headlands`);
        assert.equal(shoreGrowth.size,4,'every shore has visible physical headlands extending toward its forest');
        // Both original weathered stone layers must physically meet the
        // existing seven planted forest headlands; otherwise we still have
        // disconnected floating decoration beyond a rectangular court.
        for (const headland of stageHeadlandAnchors(width,height)) {
          let closest = Infinity;
          for(let i=0;i<sectors;i++) {
            const idx=1+3*sectors+i;
            closest=Math.min(closest,Math.hypot(pos.getX(idx)-headland.x,pos.getZ(idx)-headland.z));
          }
          assert.ok(closest<2.1,`physical ${layer} shoreline must join ${headland.name} (${width}x${height} gap ${closest.toFixed(2)})`);
        }
      } finally {mesh.dispose();repeat.dispose();}
    }
  }
});
