'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

test('T1 weathered garden art direction connects fractured woodland, genuine 3D planted hollows, warm terraces and a readable original sunstone without new passes', async()=>{
  const THREE=await import('three');
  const {createWorld}=await import('../../public/snake-stream/world.mjs');
  const {createCourtyardEcology}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  const {sampleWeatheredTerrace}=await import('../../public/snake-stream/garden-biomes.mjs');
  for (const [width,height] of [[8,8],[28,16],[40,24]]){
    const world=createWorld(THREE,{width,height});
    const ecology=createCourtyardEcology(THREE,{width,height,world});
    try{
      const resources=world.stats(), ec=ecology.stats();
      assert.equal(resources.staticMeshes,13);
      assert.equal(resources.materials,22);
      assert.equal(resources.textures,4);
      assert.equal(ec.meshCount,1);assert.equal(ec.textures,0);
      assert.equal(ec.publicCellsMoved,0);
      assert.ok(ec.triangles<3100);
      assert.ok(ec.stoneAtlas.biomeFractions,
        'the real existing stone atlas should be weathered in distinct physical terrain biomes');
      assert.ok(ec.stoneAtlas.biomeFractions.terrace>.075,'limestone cliff exposures occupy meaningful whole-board area');
      assert.ok(ec.stoneAtlas.biomeFractions.litter>.08,'fallen-leaf woodland area reaches beyond a decorative corner');
      assert.ok(ec.stoneAtlas.biomeFractions.coolSlate>.06,'cool slate damp banks visibly break the flat beige/green court');
      const at=(u,v)=>sampleWeatheredTerrace(u,v,width,height);
      const centre=at(.5,.5), northern=at(.25,.12), south=at(.72,.85);
      assert.ok(centre.protectedSunstone>.85,'original central readable landmark remains clear');
      assert.ok(northern.protectedSunstone<.2 && south.protectedSunstone<.2);
      let contrast=0;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const a=at((x+.5)/width,(y+.5)/height);
        const b=at((x+.7)/width,(y+.5)/height);
        for(const key of ['terrace','litter','coolSlate','protectedSunstone']){
          assert.ok(Number.isFinite(a[key]) && a[key]>=0 && a[key]<=1);
          assert.ok(Math.abs(a[key]-b[key])<=.58,'continuous biome blends cannot teleport at tile boundaries');
        }
        contrast=Math.max(contrast,a.terrace+a.litter+a.coolSlate);
      }
      assert.ok(contrast>.45);
    }finally{ecology.dispose();world.dispose();}
  }
});
