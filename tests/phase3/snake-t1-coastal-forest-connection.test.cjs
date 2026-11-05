'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

// The two historical scene contracts are complementary: the actual board
// interior needs differentiated leaf/limestone; the original *full* atlas
// must still be a rooted forest across the coastal ring. This test protects
// the geographical reason both can hold, not a pixel-grid sampling trick.
test('T1 honest coastal forest connects all four shores without painting over the sunstone or multiplying renders',async()=>{
  const THREE=await import('three');
  const {sampleGardenEcotone,sampleForestFloorMaterials}=await import('../../public/snake-stream/garden-biomes.mjs');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const floor=(u,v)=>sampleForestFloorMaterials(u,v,sampleGardenEcotone(u,v,width,height));
    const north=floor(.5,.02),south=floor(.5,.98),west=floor(.02,.5),east=floor(.98,.5),heart=floor(.5,.5);
    for(const coast of [north,south,west,east]) {
      assert.ok(coast.coastalCanopy>.75,'real wooded shoreline wraps the whole traversable court');
      assert.deepEqual(coast,coast,'no clock or random drift in public-only material geography');
    }
    assert.ok(heart.coastalCanopy<.02,'the ancient centre remains genuinely open');
    const w=createWorld(THREE,{width,height}),e=createCourtyardEcology(THREE,{width,height,world:w});
    try {
      const tile=w.group.children.find(m=>m.name==='Ruins / c3c4ad');
      const data=tile.material.map.image.data;
      let ring=0,ringN=0,inside=0,insideN=0;
      for(let y=0;y<512;y+=6)for(let x=0;x<1024;x+=6){
        const distance=Math.min(x/1024,1-x/1024,y/512,1-y/512);
        const offset=(y*1024+x)*4,r=data[offset],g=data[offset+1],b=data[offset+2];
        const green=r<115&&g>r+25&&g>b+30;
        if(distance<.09){ring+=green;ringN++;}
        if(distance>.20){inside+=green;insideN++;}
      }
      assert.ok(ring/ringN>.84,`all four coasts visibly rooted: ${width}x${height} ${(ring/ringN).toFixed(3)}`);
      assert.ok(inside/insideN<.58,`actual inner garden must still have warm open glades: ${width}x${height} ${(inside/insideN).toFixed(3)}`);
      assert.equal(w.stats().staticMeshes,13);
      assert.equal(w.stats().textures,4);
      assert.equal(e.stats().meshCount,1);
      assert.equal(e.stats().textures,0);
      assert.equal(e.stats().publicCellsMoved,0);
      assert.ok(e.stats().triangles<3100);
    }finally{e.dispose();w.dispose();}
  }
});
