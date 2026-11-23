'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

/**
 * Whole-playfield material geometry: protect a genuinely connected rooted
 * rainforest WHILE exposing large limestone/loam glades at actual board size.
 * This is native compositional evidence only, NEVER a Chromium or quality win.
 */
test('T1 complete board reveals connected forest, warm stone and deep rooted habitat rather than a uniform monochrome courtyard', async () => {
  const THREE = await import('three');
  const {createWorld} = await import('../../public/snake-stream/world.mjs');
  const {createCourtyardEcology} = await import('../../public/snake-stream/courtyard-ecology.mjs');
  for (const [width,height] of [[8,8],[28,16],[40,24]]) {
    const world=createWorld(THREE,{width,height});
    const court=createCourtyardEcology(THREE,{width,height,world});
    try {
      const stats=world.stats(), eco=court.stats();
      assert.equal(stats.staticMeshes,13,'all original scene batches remain intact');
      assert.equal(stats.textures,4,'no new world texture or render pass');
      assert.equal(eco.meshCount,1);
      assert.equal(eco.textures,0);
      assert.equal(eco.publicCellsMoved,0);
      assert.equal(eco.interstitialFernClumps,({8:40,28:130,40:71})[width],'retain exact existing living-root counts for every supported board');
      assert.ok(eco.stoneAtlas.groveFraction>.09 && eco.stoneAtlas.groveFraction<.43,
        `connected but bounded woodland instead of a dark continuous slab: ${width}x${height}: ${eco.stoneAtlas.groveFraction}`);
      const mesh=world.group.children.find(o=>o.isMesh && o.material?.map?.image?.width===1024 && o.material?.map?.image?.height===512);
      assert.ok(mesh, 'grade the original real stone material, not a new overlay');
      let warm=0,green=0,deep=0,total=0;
      const colors=new Set(),pixels=mesh.material.map.image.data;
      for(let y=72;y<440;y+=6)for(let x=74;x<950;x+=6){
        const offset=(y*1024+x)*4, r=pixels[offset], g=pixels[offset+1], b=pixels[offset+2];
        warm+=r>g+17;
        green+=g>r+25;
        deep+=(r+g+b)/3<93;
        colors.add([r>>4,g>>4,b>>4].join(':'));total++;
      }
      assert.ok(warm/total>.19,`${width}x${height} must contain substantial sunward limestone: ${warm/total}`);
      assert.ok(green/total>.30 && green/total<.52,`${width}x${height} must retain differentiated forest ground: ${green/total}`);
      assert.ok(deep/total>.26 && deep/total<.57,`${width}x${height} deep forest must have relief, not black monolith: ${deep/total}`);
      assert.ok(colors.size>120,`${width}x${height} natural materials must have rich continuous grain: ${colors.size}`);
    } finally {court.dispose();world.dispose();}
  }
});
