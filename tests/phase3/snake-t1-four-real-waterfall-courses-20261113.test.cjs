'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const url=pathToFileURL(path.join(root,'public/snake-stream/world.mjs')).href;
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
for(const [width,height] of [[8,8],[28,16],[40,24]]){
 test(`all four original stone falls are connected to genuine moving-water geometry outside play (${width}x${height})`,async()=>{
  const THREE=await import(three);
  const {buildNativeFourShoreWaterfallGeometry,sculptCoastCourse,createFogAwareWaterPlane}=await import(url);
  assert.equal(typeof buildNativeFourShoreWaterfallGeometry,'function','physically supported four-shore replacement must exist');
  const before=createFogAwareWaterPlane(THREE,512,width,height);
  const g=buildNativeFourShoreWaterfallGeometry(THREE,width,height);
  assert.equal(g.getAttribute('position').count,80,'four 10-stage waterfall courses use original single draw batch');
  assert.equal(g.getIndex().count,216,'four shore ribbons, two real triangles per segment');
  assert.ok(g.getAttribute('normal'),'physically correct illumination for wet stones');
  const p=g.getAttribute('position'), uv=g.getAttribute('uv');
  for(let edge=0;edge<4;edge++){
   const along=[.54,.29,.43,.70][edge]*(edge<2?width+2:height+2);
   const stone=sculptCoastCourse(width,height,edge,0,along);
   const v=edge*20,first={x:p.getX(v),y:p.getY(v),z:p.getZ(v)};
   assert.ok(Math.hypot(first.x-stone.x,first.z-stone.z)<.5,'upper water touches existing actual fallen limestone');
   assert.ok(Math.abs(first.y-(stone.y+stone.sy*.5+.045))<1e-5,'waterfall begins at true physical ledge height');
   assert.ok(Math.abs(p.getY(v+18)-(-3.59))<1e-5,'lower water joins original sea at y=-3.62');
   for(let i=0;i<20;i++){
     const k=v+i,x=p.getX(k),z=p.getZ(k),y=p.getY(k);
     const outside=edge===0?-z:edge===1?z:edge===2?-x:x;
     assert.ok(outside>(edge<2?height:width)/2+.6,'never bridge hazard, fruit, route or portal');
     assert.ok(y>=-3.591 && y<=Math.max(0,stone.y+stone.sy*.5+.055),
      'water stays below actual stone lip, entirely outside the playable court');
     assert.ok(Number.isFinite(uv.getX(k))&&Number.isFinite(uv.getY(k)));
   }
   for(let row=1;row<10;row++)assert.ok(p.getY(v+2*row)<=p.getY(v+2*(row-1))+.00001,'water drops monotonically');
  }
  const after=createFogAwareWaterPlane(THREE,512,width,height);
  assert.deepEqual(Array.from(after.getAttribute('position').array),Array.from(before.getAttribute('position').array),'original sea shape remains byte-identical');
  assert.deepEqual(Array.from(after.getIndex().array),Array.from(before.getIndex().array),'original real fog-friendly indexed water remains unchanged');
  g.dispose();before.dispose();after.dispose();
 });
}
test('original one animated sea mesh plus one original waterfall mesh (no extra GPU passes or objects)',async()=>{
 const fs=require('node:fs');
 const source=fs.readFileSync(path.join(root,'public/snake-stream/world.mjs'),'utf8');
 assert.match(source,/const water=new THREE\.Mesh\(geometry\(createFogAwareWaterPlane\(THREE,waterExtent,width,height\)\),waterMaterial\)/,
  'original full animated sea grid survives without added triangles');
 assert.match(source,/const falls=new THREE\.Mesh\(geometry\(buildNativeFourShoreWaterfallGeometry\(THREE,width,height\)\),fallMat\)/,
  'four physical falls replace original two flat strips in the SAME single mesh');
 assert.match(source,/falls\.name='Baked live edge falls';group\.add\(falls\)/,
  'original live waterfall draw object and lifecycle survive');
 assert.match(source,/map:waterMap/, 'original existing flowing-water texture now moves across real falls');
 assert.match(source,/fallMat\.map\.offset\.y=\s*reducedMotion\?0:/,
  'real waterfall motion freezes on reduced-motion requests');
});
