'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

// Source-exact RED control: this interwoven pair of cross-valley root galleries
// was absent from GitHub Actions source cfc65853. The entire living garden
// must be materially connected, not three horizontal painted strips.
test('T1 forest galleries physically connect all three meandering root courses away from the sunstone',async()=>{
  const {rootBridgeCentre,sampleGardenWatershed}=await import('../../public/snake-stream/garden-watersheds.mjs');
  assert.equal(typeof rootBridgeCentre,'function');
  for(const [width,height] of [[8,8],[28,16],[40,24]]) {
    for(const side of [-1,1]) {
      const points=[];
      for(const z of [-.73,-.5,-.26,.24,.5,.73]) {
        const x=rootBridgeCentre(z,side);
        assert.ok(Number.isFinite(x)&&x*side>.28&&x*side<.87,'side root stays beyond protected centre');
        const sample=sampleGardenWatershed(x,z,width,height);
        assert.ok(sample.distance<.046,'continuous real soil/stone/ferns from front to rear');
        assert.equal(sample.crosslink,true,'physical cross-valley bridge, not old parallel root');
        points.push(x);
      }
      assert.ok(Math.max(...points)-Math.min(...points)>.11,'gallery must not be a ruler-straight orthogonal stripe');
    }
  }
});

test('T1 interconnected gallery reshapes the REAL 3D stones and ONE atlas, no invented game cells or assets',async()=>{
  const THREE=await import('three');
  const {createWorld,sculptForestMosaicTile}=await import('../../public/snake-stream/world.mjs');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]) {
    const a=createWorld(THREE,{width,height}),garden=createCourtyardEcology(THREE,{width,height,world:a});
    try {
      const w=a.stats(),e=garden.stats();
      assert.equal(w.staticMeshes,13);assert.equal(w.textures,4);
      assert.equal(e.meshCount,1);assert.equal(e.textures,0);
      assert.ok(e.triangles<3100);assert.equal(e.publicCellsMoved,0);
      assert.equal(e.stoneAtlas.textureAdded,0);
      const stones=[];
      for(let z=0;z<height;z++)for(let x=0;x<width;x++){
        const t=sculptForestMosaicTile(x,z,width,height);
        assert.ok(t.scale>=.86&&t.scale<=.99);
        assert.ok(t.scale*(Math.cos(t.rotation)+Math.abs(Math.sin(t.rotation)))<=.995);
        stones.push(t.scale);
      }
      assert.ok(Math.max(...stones)-Math.min(...stones)>.055,'visible old-stone mineral joints with grounded variation');
      if(width===28){
        assert.equal(e.interstitialFernClumps,130);
        assert.ok(e.fernBiomeRootedSites>=95,'original rooted fern population now supports the interwoven galleries');
      }
    }finally {garden.dispose();a.dispose();}
  }
});
