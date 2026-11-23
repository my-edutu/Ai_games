'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
test('T1 physical woodland beds replace narrow painted streaks across every public board size', async () => {
  const THREE = await import('three');
  const {createWorld} = await import('../../public/snake-stream/world.mjs');
  const {createCourtyardEcology} = await import('../../public/snake-stream/courtyard-ecology.mjs');
  for (const [width,height,minCoverage,ferns] of [[8,8,.37,40],[28,16,.31,130],[40,24,.23,71]]) {
    const world=createWorld(THREE,{width,height});
    const ecology=createCourtyardEcology(THREE,{width,height,world});
    const s=ecology.stats(),p=ecology.group.children[0].geometry.attributes.position.array;
    let physicalArea=0,surfaceTriangles=0;
    for(let i=0;i<p.length;i+=9){
      const a=[p[i],p[i+1],p[i+2]],b=[p[i+3],p[i+4],p[i+5]],c=[p[i+6],p[i+7],p[i+8]];
      if(Math.max(a[1],b[1],c[1])>.02101)continue;
      physicalArea+=Math.abs((b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]))/2;
      surfaceTriangles++;
    }
    assert.ok(physicalArea/(width*height)>minCoverage,width+'x'+height+': real 3D floor coverage, not a flat texture');
    assert.ok(surfaceTriangles>100);
    assert.equal(s.meshCount,1);assert.equal(s.textures,0);
    assert.ok(s.triangles<3100,'original strict native geometry budget');
    assert.equal(s.interstitialFernClumps,ferns,'no discarded original fern geometry');
    assert.ok(p.every(Number.isFinite),'no invalid terrain vertex');
    const duplicate=createCourtyardEcology(THREE,{width,height});
    assert.deepEqual(duplicate.group.children[0].geometry.attributes.position.array,p,'no private simulation state or random runtime geometry');
    duplicate.dispose();ecology.dispose();world.dispose();
  }
});
