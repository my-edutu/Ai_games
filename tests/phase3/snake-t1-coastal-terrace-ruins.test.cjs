'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');

// The existing island and 3D ruins must produce a visible NON-RECTILINEAR
// full-width silhouette. Numbers are sampled from actual public board sizes,
// not from game authority or screenshot mockups. These are presentation-only
// assets; the four original contour materials/batches and all gameplay cues stay.
test('T1 original rear causeway and front frieze form two continuous scenic tidal terraces',async()=>{
 const THREE=await import('three');
 const worldModule=await import('../../public/snake-stream/world.mjs');
 const {sculptRearCauseway,sculptFrontFrieze,createWorld}=worldModule;
 assert.equal(typeof sculptRearCauseway,'function','original stone terrace geometry has an inspectable continuous sculptor');
 assert.equal(typeof sculptFrontFrieze,'function','original front-frieze architecture is deliberately sculpted');
 for(const [width,height,originalInstances] of [[8,8,4045],[28,16,7390],[40,24,8661]]) {
  const rear=[],front=[];
  for(let x=-width/2;x<=width/2;x+=.4){
   const top=sculptRearCauseway(width,height,x,'limestone');
   const lower=sculptRearCauseway(width,height,x,'bedrock');
   const frieze=sculptFrontFrieze(width,height,x);
   for(const p of [top,lower,frieze])for(const v of Object.values(p))assert.ok(Number.isFinite(v),'actual 3D positions and scales are finite');
   assert.ok(top.z<-height/2-2.55,'rear causeway stays behind original playable garden and its guardians');
   assert.ok(lower.y<top.y-.52,'full 3D strata have genuine vertical relief');
   assert.ok(top.sx>.8 && top.sz>.25 && lower.sy>.4,'original existing masonry remains physically present');
   assert.ok(frieze.z>height/2+.91,'front masonry cannot enter occupied gameplay cells');
   rear.push(top.z);front.push(frieze.z);
  }
  const spread=arr=>Math.max(...arr)-Math.min(...arr);
  assert.ok(spread(rear)>.55,`${width}x${height} has broad scenic broken rear-terrace silhouette`);
  assert.ok(spread(front)>.20,`${width}x${height} front frieze follows a real irregular shore rather than a ruler line`);
  const world=createWorld(THREE,{width,height});
  try{
   const stats=world.stats();
   assert.equal(stats.staticMeshes,13,'original static scene batches, not new draw objects');
   assert.equal(stats.textures,4,'no GPU textures or fake scenic captures');
   assert.equal(stats.staticInstances,originalInstances,'retain every original stone/forest/architectural instance');
   assert.equal(stats.drawObjects,33,'original complete 3D scene draw-object count unchanged');
   assert.equal(stats.geometries,33,'original authored geometry count unchanged');
   assert.equal(stats.materials,22,'original physically shaded material count unchanged');
  } finally {world.dispose();}
 }
});
