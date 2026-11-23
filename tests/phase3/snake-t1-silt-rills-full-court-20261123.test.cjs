'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

// The real 398abc9 full-HD Chromium overview still shows broad pale, flat,
// opaque green bands crossing a visibly tiled playing field. This test guards
// ACTUAL existing bank vertices rather than a screenshot mock or source string.
test('T1 three complete planted watersheds become incised low-rise stone and loam coves, not flat mint-painted paths', async () => {
  const THREE = await import('three');
  const { createCourtyardEcology } = await import('../../public/snake-stream/courtyard-ecology.mjs');
  for (const [width, height] of [[8,8],[28,16],[40,24]]) {
    const stage = createCourtyardEcology(THREE, { width, height });
    const repeat = createCourtyardEcology(THREE, { width, height });
    try {
      const s = stage.stats(), mesh = stage.group.children[0];
      const p = mesh.geometry.getAttribute('position');
      const c = mesh.geometry.getAttribute('color');
      assert.ok(s.braidedSurfaceTriangles >= 300);
      assert.deepEqual(p.array,repeat.group.children[0].geometry.getAttribute('position').array);
      assert.deepEqual(c.array,repeat.group.children[0].geometry.getAttribute('color').array);
      let vividMint=0, scouredStone=0, wetLoam=0, lowRelief=0, highRelief=0, greenLead=0;
      const n=s.braidedSurfaceTriangles*3;
      for (let i=0;i<n;i++) {
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
        const r=c.getX(i),g=c.getY(i),b=c.getZ(i);
        assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z));
        assert.ok(y>=.011&&y<=.021,'real playable cue and belly clearance');
        if(g>.215 && g>r*1.5 && b>r*.8) vividMint++;
        if(y<=.01425) lowRelief++;
        if(y>=.0188) highRelief++;
        if(g<.14) wetLoam++;
        if(g>.18 && r>.04) scouredStone++;
        greenLead +=g-r;
      }
      assert.ok(vividMint/n<.08,'no conspicuous continuous pale turquoise game-board overlays');
      assert.ok(lowRelief/n>.22 && highRelief/n>.08,
        'real riverbank troughs and raised stony levees must be physically visible in the existing 3D geometry');
      assert.ok(wetLoam/n>.13 && scouredStone/n>.06,
        'distinct planted lowlands and exposed rock shoulders in the existing material batches');
      assert.ok(greenLead/n>.11,'retain genuinely green living moss distinct from dry rock');
      assert.equal(s.publicCellsMoved,0);
      assert.equal(s.meshCount,1);
      assert.equal(s.textures,0);
      assert.ok(s.triangles<3100);
    } finally {stage.dispose();repeat.dispose();}
  }
});
