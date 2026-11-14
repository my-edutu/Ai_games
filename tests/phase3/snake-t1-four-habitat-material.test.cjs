'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

// Native T1 composition guard: neither its counts nor its sample colours
// claim real Chromium image improvement, motion quality, or presentation FPS.
test('T1 living floor contains connected moss, weathered leaf-litter, exposed limestone and protected sunstone in the same authored board coordinates',async()=>{
  const {sampleGardenEcotone,sampleForestFloorMaterials}=await import('../../public/snake-stream/garden-biomes.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    let leaf=0,moss=0,stone=0,mixed=0,centre=0,count=0;
    const samples=[];
    for(let z=0;z<=40;z++)for(let x=0;x<=64;x++){
      const u=(x+.0001)/64.0002,v=(z+.0001)/40.0002;
      const ecotone=sampleGardenEcotone(u,v,width,height);
      const s=sampleForestFloorMaterials(u,v,ecotone);
      const same=sampleForestFloorMaterials(u,v,ecotone);
      assert.deepEqual(s,same,'same board means immutable stable cosmetic geography');
      for(const n of Object.values(s)) assert.ok(Number.isFinite(n)&&n>=0&&n<=1,'habitats always bounded');
      leaf+=s.leafLitter>.38;moss+=s.mossCanopy>.48;stone+=s.limestone>.36;
      mixed+=s.leafLitter>.15&&s.mossCanopy>.2;
      if(x===32&&z===20)centre=s.leafLitter+s.mossCanopy;
      samples.push(s.leafLitter-s.mossCanopy);
      count++;
    }
    assert.ok(leaf/count>.10 && leaf/count<.55,`large coherent leaf litter, not uniform painted floor: ${leaf/count}`);
    assert.ok(moss/count>.24 && moss/count<.76,`deep living moss persists through the old garden: ${moss/count}`);
    assert.ok(stone/count>.07,`honest exposed limestone remains: ${stone/count}`);
    assert.ok(mixed/count>.04,`physical habitat transition has overlapping woodland margins: ${mixed/count}`);
    assert.ok(centre<.20,`the original bright central sunstone must remain readable: ${centre}`);
    assert.ok(Math.max(...samples)-Math.min(...samples)>1.0,'real cross-valley material contrast, not minor pixel noise');
  }
});
