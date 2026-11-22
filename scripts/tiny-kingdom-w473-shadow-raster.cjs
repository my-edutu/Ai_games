'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('const SOLAR_ATLAS_SIZE=384'),end=html.indexOf('function directionalCastShadows(time){',start);
assert(start>0&&end>start,'extract genuine production raster and upload functions');
const glCalls={full:0,partial:0,textures:0};
const gl={
 TEXTURE2:2,TEXTURE0:0,TEXTURE_2D:3553,TEXTURE_WRAP_S:10242,
 TEXTURE_WRAP_T:10243,TEXTURE_MIN_FILTER:10241,TEXTURE_MAG_FILTER:10240,
 CLAMP_TO_EDGE:33071,LINEAR:9729,RGBA:6408,UNSIGNED_BYTE:5121,
 createTexture(){glCalls.textures++;return {id:glCalls.textures}},
 activeTexture(){},bindTexture(){},texParameteri(){},uniform1i(){},uniform1f(){},
 texImage2D(){glCalls.full++},texSubImage2D(){glCalls.partial++}
};
const context={
 gl,gpuAvailable:true,swiftGpu:false,
 uniforms:{solarShadowAtlas:'atlas',solarShadowAtlasActive:'active'},
 city:[[0,1,1],[-5,3,2],[2,4,0]],
 trees:Array.from({length:20},(_,i)=>({x:-30+i*3,z:8+i*.45,s:.8})),
 solarShadowStage:t=>({bucket:Math.floor((t%24)*2),
  centerTime:Math.floor((t%24)*2)/2+.25}),
 climateAt:()=>({season:0,weather:'clear'}),
 sunShadow:t=>({strength:(t%24<6||t%24>20)?0:.9,distance:2,dx:.8,dz:.6}),
 dropShadowPoint:(x,z,height,sun)=>[
  x+sun.dx*height*sun.distance,0,z+sun.dz*height*sun.distance],
 clearStaticShadowCache(){},
};
vm.createContext(context);
vm.runInContext(`let presentationEpoch=0,lastFrozenFrameKey=null,solarShadowActive=null;
${html.slice(start,end)}`,context,{timeout:10000});
const prepare=(t)=>vm.runInContext(`prepareSolarShadowAtlas(${t},sunShadow(${t}))`,context);
const audit=()=>vm.runInContext('getSolarShadowAtlasAudit()',context);
test('one real bounded texture, exact solar reuse, night clears and no hidden homes',()=>{
 assert.equal(prepare(11),true);
 const first=audit();
 assert.equal(first.textureBytes,384*384*4);
 assert(first.realStaticCasters>=20);
 assert(first.darkenedTexels>100);
 assert.equal(glCalls.textures,1);
 assert.equal(glCalls.full,1);
 assert.equal(first.staticShadowGeometrySubmitted,0);
 assert.equal(prepare(11),true);
 const reused=audit();
 assert.equal(reused.uploads,first.uploads);
 assert(reused.reuses>first.reuses);
 assert.equal(prepare(11.6),true);
 const next=audit();
 assert.equal(next.uploads,first.uploads+1);
 assert.equal(glCalls.partial,1);
 assert.equal(prepare(22),true);
 const night=audit();
 assert.equal(night.realStaticCasters,0);
 assert.equal(night.darkenedTexels,0);
 assert.equal(glCalls.partial,2);
 assert.equal(night.residentCitizenShadowGeometryPreserved,true);
 vm.runInContext('setSolarShadowAtlasForTesting(false)',context);
 assert.equal(prepare(22),false);
 assert.equal(audit().mode,'original-resident-geometry');
 assert.equal(glCalls.textures,1);
});
