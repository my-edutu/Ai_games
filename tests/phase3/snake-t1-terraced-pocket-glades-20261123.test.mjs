import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildReclaimedCourtyardGlades, createWorld } from '../../public/snake-stream/world.mjs';

// This is a source-exact NATIVE silhouette guard only. It does not constitute
// WebGL screenshot, motion, original 1s renderer-gate or display-FPS evidence.
function physicalSurface(geometry) {
  const positions = geometry.getAttribute('position');
  const indices = geometry.getIndex();
  let area = 0, maximumTriangle = 0, steepRimFaces = 0;
  for (let i = 0; i < indices.count; i += 3) {
    const a = indices.getX(i), b = indices.getX(i + 1), c = indices.getX(i + 2);
    const x1 = positions.getX(a), z1 = positions.getZ(a);
    const x2 = positions.getX(b), z2 = positions.getZ(b);
    const x3 = positions.getX(c), z3 = positions.getZ(c);
    const triangleArea = Math.abs((x2-x1)*(z3-z1)-(x3-x1)*(z2-z1))/2;
    assert.ok(triangleArea > 1e-6, 'no folded or degenerate terrain triangles');
    maximumTriangle = Math.max(maximumTriangle, triangleArea);
    area += triangleArea;
    if (Math.max(positions.getY(a),positions.getY(b),positions.getY(c)) -
        Math.min(positions.getY(a),positions.getY(b),positions.getY(c)) > .012) steepRimFaces++;
  }
  return { area, maximumTriangle, steepRimFaces };
}

for (const [width, height] of [[8,8],[28,16],[40,24]]) {
  test(`T1 ${width}x${height} three real nested glades retain terraced depth without swallowing the playable garden`, () => {
    const land = buildReclaimedCourtyardGlades(THREE, width, height, 'moss');
    const stone = buildReclaimedCourtyardGlades(THREE, width, height, 'bedrock');
    try {
      const a = physicalSurface(land), b = physicalSurface(stone);
      const court = width*height;
      // Source parent physically paints about 36% of the entire board as
      // three unrelated flat fan-shaped patches, on TOP of rivers/corridors.
      // A bounded 10-24% nested shelf is a materially different geometry.
      assert.ok(a.area >= court*.10 && a.area <= court*.24,
        `moss pockets must reveal the original real stone: ${a.area.toFixed(3)} / ${court}`);
      assert.ok(b.area >= court*.006 && b.area < a.area*.28,
        'true inset limestone must remain subordinate to moss, not a second competing sheet');
      assert.ok(a.steepRimFaces >= 60,'each glade must have many physical cut-and-fill depth faces');
      assert.equal(land.index.count, 3 * (48 * 3 + 3 * 48 * 6));
      const p=land.getAttribute('position');
      for (let i=0;i<p.count;i++) {
        assert.ok(Math.abs(p.getX(i))<width/2 && Math.abs(p.getZ(i))<height/2,
          'terrain must not bridge into portal shore or cover the outer water');
        assert.ok(p.getY(i)>=-.05 && p.getY(i)<=.021,
          'terrain stays below serpent/fruit and the untouched legal-cell crowns');
      }
      const game = createWorld(THREE,{width,height});
      try {
        assert.equal(game.stats().staticMeshes,13);
        assert.equal(game.stats().textures,4);
      } finally { game.dispose(); }
    } finally { land.dispose(); stone.dispose(); }
  });
}
