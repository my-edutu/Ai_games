const test = require('node:test');
const assert = require('node:assert/strict');

// T1 scene-scale quality contract: the actual source-owned quarry blocks must
// resemble varied ancient masonry across whole boards instead of a dense
// uniform spreadsheet. Material maps and real top geometry share this plan.
// This is native evidence ONLY, not a substitute for authentic WebGL review.
test('whole playable court uses larger varied source-owned ruins slabs without losing any cell', async () => {
 const THREE=await import('three');
 const {createWorld,planCohesiveRuinsPaving}=await import('../../public/snake-stream/world.mjs');
 for(const [width,height,maxCount] of [[8,8,15],[28,16,96],[40,24,185]]){
  const slabs=planCohesiveRuinsPaving(width,height);
  const covered=new Uint8Array(width*height);
  for(const s of slabs){
   assert.ok(Number.isInteger(s.x)&&Number.isInteger(s.z)&&Number.isInteger(s.w)&&Number.isInteger(s.h));
   assert.ok(s.x>=0&&s.z>=0&&s.w>=1&&s.h>=1&&s.x+s.w<=width&&s.z+s.h<=height);
   for(let z=s.z;z<s.z+s.h;z++)for(let x=s.x;x<s.x+s.w;x++)covered[z*width+x]++;
  }
  assert.ok(Array.from(covered).every(c=>c===1),'every authoritative cell must be supported by exactly one actual slab');
  assert.ok(slabs.length<=maxCount,`court must become coarser continuous stone architecture, ${width}x${height}: ${slabs.length}`);
  assert.ok(slabs.some(s=>s.w>=4&&s.h>=2),'must have major original masonry units, not 1x1 tiles');
  assert.ok(slabs.some(s=>s.w<=2),'must retain fine eroded ruins beside larger plates');
  const world=createWorld(THREE,{width,height});
  try{
   const stats=world.stats();
   assert.equal(stats.staticMeshes,13,'all original complete world static material batches remain');
   assert.equal(stats.textures,4,'no missing water/stone/vegetation materials');
  }finally{world.dispose();}
 }
});
