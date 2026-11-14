'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('T1 four-shore native canopy retains expressive sage and shadow rather than fluorescent flat crowns', async () => {
  const THREE = await import('three');
  const { createLivingGarden } = await import('../../public/snake-stream/living-garden.mjs');
  for (const [width, height] of [[8, 8], [28, 16], [40, 24]]) {
    const garden = createLivingGarden(THREE, { width, height });
    const copy = createLivingGarden(THREE, { width, height });
    try {
      assert.deepEqual(garden.stats(), copy.stats(), 'same public board, identical static world');
      const stats = garden.stats();
      assert.equal(stats.meshCount, 4, 'original four static physical batches');
      assert.equal(stats.textures, 1, 'no additional water/foliage texture');
      assert.equal(stats.canopyLeaflets, 1115, 'retain original fully authored leaf anatomy');
      assert.ok(stats.triangles < 22000, 'original native scene geometry budget');
      const foliage = garden.group.children.find(o => o.name.includes('foliage'));
      const equivalent = copy.group.children.find(o => o.name.includes('foliage'));
      assert.ok(foliage?.isMesh && equivalent?.isMesh);
      const c = foliage.geometry.getAttribute('color').array;
      assert.deepEqual(c, equivalent.geometry.getAttribute('color').array);
      const luminances=[];
      for(let i=0; i<c.length; i+=3){
        const r=c[i],g=c[i+1],b=c[i+2];
        assert.ok([r,g,b].every(Number.isFinite));
        luminances.push((r+g+b)/3);
      }
      assert.ok(luminances.length>30000, 'crowns are real physical 3D leaves');
      luminances.sort((a,b)=>a-b);
      const p=x=>luminances[Math.floor((luminances.length-1)*x)];
      assert.ok(p(.9)<.32, 'no dominant fluorescent yellow-green highlights in the actual canopy');
      assert.ok(p(.9) - p(.1) > .12, 'retain naturally differentiated shadow and sunlit sage canopy');
      assert.ok(p(.1)>.065, 'do not black out the forest or its visual silhouette');
    } finally { garden.dispose(); copy.dispose(); }
  }
});
