'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

// November 4 T1: source-exact physical paving review. The baseline live WebGL
// still showed dark checkerboard mortar dominating the ENTIRE game. Tighten
// the original stone footprints without crossing real cell boundaries, losing
// physical chips, rotation, or altering the public gameplay board.
test('T1 full-field flagstone seam mass is no longer a dark graph-paper grid', async () => {
  const { sculptForestMosaicTile } = await import('../../public/snake-stream/world.mjs');
  for (const [width,height] of [[8,8],[28,16],[40,24]]) {
    const cells=[];
    for (let z=0;z<height;z++) for (let x=0;x<width;x++) {
      const s=sculptForestMosaicTile(x,z,width,height);
      const spread=(Math.abs(Math.cos(s.rotation))+Math.abs(Math.sin(s.rotation)))*s.scale;
      assert.ok(spread<=.99000001 && spread>.80, 'all original cell boundaries and stable solid tiles remain');
      assert.ok(s.chip>=.025 && s.chip<=.127, 'physical chipped quarry corners remain authored');
      cells.push(s);
    }
    const mean=cells.reduce((sum,cell)=>sum+cell.scale,0)/cells.length;
    assert.ok(mean>.955, `whole garden seam reduction at ${width}x${height}, measured ${mean}`);
    assert.ok(cells.some(x=>Math.abs(x.rotation)>.02),'retains real irregular stone orientations');
    assert.ok(cells.some(x=>x.scale<.96),'retains naturally weathered open mortar near roots');
  }
});
