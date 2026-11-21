'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('distant cliff strata form a closed, irregular, smoothly shaded single mesh', async () => {
  const THREE = await import('three');
  const { buildHeadlandGeometry } = await import('../../public/snake-stream/world.mjs');
  assert.equal(typeof buildHeadlandGeometry, 'function');
  const cliff = buildHeadlandGeometry(THREE);
  try {
    const sides = 28, rings = 15;
    const p = cliff.attributes.position, n = cliff.attributes.normal, uv = cliff.attributes.uv;
    assert.equal(p.count, rings * (sides + 1) + 1, 'one shared closed silhouette plus a cap');
    assert.ok(cliff.index.count <= 2500, 'must remain a small cached background mesh');
    for (let k = 0; k < rings; k++) {
      const first = k * (sides + 1), last = first + sides;
      assert.ok(Math.abs(p.getX(first) - p.getX(last)) < 1e-5, 'wrapped rock x seam');
      assert.ok(Math.abs(p.getY(first) - p.getY(last)) < 1e-5, 'wrapped rock height seam');
      assert.ok(Math.abs(p.getZ(first) - p.getZ(last)) < 1e-5, 'wrapped rock z seam');
      assert.ok(new THREE.Vector3().fromBufferAttribute(n, first).distanceTo(new THREE.Vector3().fromBufferAttribute(n,last)) < 1e-5,
        'merged normal across angular texture seam, no sharp vertical stripe');
      assert.ok(Math.abs(uv.getX(last) - uv.getX(first) - 3) < 1e-5, 'repeatable stone UV circumference');
      const radii=[];
      for (let i = 0; i < sides; i++) {
        const index = first + i;
        const x = p.getX(index), y = p.getY(index), z = p.getZ(index);
        for (const v of [x,y,z,n.getX(index),n.getY(index),n.getZ(index),uv.getX(index),uv.getY(index)])
          assert.ok(Number.isFinite(v),'finite geometry, normal and UV');
        assert.ok(y >= 0 && y <= 1.001, 'safe normalized elevation, no scene spikes');
        radii.push(Math.hypot(x,z));
      }
      assert.ok(Math.max(...radii) - Math.min(...radii) > 0.08,
        'rock profile is eroded across each stratum, not a featureless cone');
    }
    // The first capture exposed uniform horizontal saucer bands. A geological
    // edge must rise/fall around its circumference rather than forming plates.
    let irregularStrata = 0, largestRadialStep = 0;
    for (let k = 1; k < rings - 1; k++) {
      const elevations = [];
      for (let i = 0; i < sides; i++) {
        const index = k * (sides + 1) + i;
        elevations.push(p.getY(index));
        const previous = (k - 1) * (sides + 1) + i;
        largestRadialStep = Math.max(largestRadialStep,
          Math.abs(Math.hypot(p.getX(index), p.getZ(index)) - Math.hypot(p.getX(previous), p.getZ(previous))));
      }
      if (Math.max(...elevations) - Math.min(...elevations) >= .016) irregularStrata++;
    }
    assert.ok(irregularStrata >= 7, 'fractured strata must not render as flat stacked saucers');
    assert.ok(largestRadialStep < .24, `rock shelves may project but cannot become thin discs (max deltaRadius ${largestRadialStep})`);
    const profile = Array.from({length:rings},(_,k)=>Math.hypot(p.getX(k*(sides+1)),p.getZ(k*(sides+1))));
    const ledges = profile.slice(1,-1).filter((r,i)=>r>profile[i]+0.075 && r>profile[i+2]+0.075);
    assert.ok(ledges.length >= 2,'two non-repeating eroded ledges show physical rock bedding');
    assert.ok(profile.every(r=>r>.25&&r<1.3));
    assert.ok(!cliff.attributes.color, 'shared existing stone texture, no new shading pipeline');
    const ix=cliff.index;
    for(let i=0;i<ix.count;i++)assert.ok(ix.getX(i)<p.count, 'every triangle references an initialized vertex');
  } finally {cliff.dispose();}
});
