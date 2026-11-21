'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

// Production acceptance guard: real physical bank silhouettes, not an
// invented objective, screenshot pixel proxy, asset or changed AI rule.
test('T1 living banks open into sheltered pools, narrow into rooted tributaries, and keep original geometry and forest outside game cells', async () => {
  const THREE = await import('three');
  const { createCourtyardEcology, sculptRiparianBank } = await import('../../public/snake-stream/courtyard-ecology.mjs');
  const { createWorld, stageHeadlandAnchors } = await import('../../public/snake-stream/world.mjs');
  assert.equal(typeof sculptRiparianBank, 'function', 'bank morphology must drive the actual mesh, not a painted atlas');
  for (const [width, height] of [[8, 8], [28, 16], [40, 24]]) {
    for (let course = 0; course < 3; course++) {
      const widths = [];
      const H = height / 2, W = width / 2;
      for (let i = 10; i <= 90; i += 4) {
        const fraction = i / 100;
        const x = -W + .86 + (width - 1.72) * fraction;
        const bank = sculptRiparianBank(x, course, width, height, fraction);
        assert.ok(Number.isFinite(bank.centre) && Number.isFinite(bank.widthAt));
        assert.ok(bank.widthAt > .02 && bank.widthAt < H*.16+.3);
        widths.push(bank.widthAt);
      }
      const centreWidths = widths.slice(4, -4);
      const ratio = Math.max(...centreWidths) / Math.min(...centreWidths);
      assert.ok(ratio > 2.2, `actual ${width}x${height} planted bank ${course} must have appreciably alternating open pools and thin roots: ${ratio}`);
    }
    const anchors = stageHeadlandAnchors(width,height);
    assert.equal(anchors.length, 7, 'keep the original seven distinctive coastal headlands');
    for (const anchor of anchors) {
      if (anchor.edge === 'south') {
        assert.ok(anchor.z > height / 2 + anchor.rise + 1.8, 'landform never enters the playable cells');
        assert.ok(anchor.z < height / 2 + 11, 'move existing old growth to the real foreground');
      }
    }
  }
  const world = createWorld(THREE, { width:28, height:16 });
  const garden = createCourtyardEcology(THREE, { width:28, height:16, world });
  try {
    const stage=world.stats(),ecology=garden.stats();
    assert.equal(stage.staticMeshes,13);
    assert.equal(stage.textures,4);
    assert.equal(ecology.meshCount,1);
    assert.equal(ecology.textures,0);
    assert.equal(ecology.publicCellsMoved,0);
    assert.equal(ecology.interstitialFernClumps,130);
    assert.ok(ecology.triangles < 3100);
    assert.ok(ecology.fernCanopyHeight <= .185);
  } finally { garden.dispose(); world.dispose(); }
});
