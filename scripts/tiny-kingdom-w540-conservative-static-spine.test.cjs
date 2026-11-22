'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=html.indexOf('if(!gl){'),b=html.indexOf('\n// G064:',a);
assert.ok(a>0&&b>a,'the real no-WebGL production renderer must exist');
const code=html.slice(a,b);
const matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function triangle(x,y,z=0){
 const v=(a,b)=>[a,b,z,0,1,0,1,.25,.15,0];
 return [...v(x-.06,y-.06),...v(x+.06,y-.06),...v(x,y+.09)];
}
function context(){
 return {last:null,createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
  putImageData(img){this.last=new Uint8ClampedArray(img.data)},
  fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){}};
}
function draw(source,disable){
 const ctx=context(),canvas={width:100,height:80,getContext:()=>ctx};
 const ctor=new Function('canvas','performance','source',
  'let gl=null,canvasFallbackRasterAudit=()=>({});let scenicMeshCache=source;'+code+
  ';return {gl,audit:()=>canvasFallbackRasterAudit()}');
 const live=ctor(canvas,{now:()=>1},source);
 const before=globalThis.__tinyKingdomDisableStaticChunkCull;
 globalThis.__tinyKingdomDisableStaticChunkCull=disable;
 try{
  live.gl.uniformMatrix4fv(null,false,matrix);
  live.gl.bufferData(live.gl.ARRAY_BUFFER,Float32Array.from(source));
  live.gl.drawArrays();
 }finally{
  if(before===undefined)delete globalThis.__tinyKingdomDisableStaticChunkCull;
  else globalThis.__tinyKingdomDisableStaticChunkCull=before;
 }
 return {pixels:ctx.last,audit:live.audit()};
}
test('W540 screen-culling exact active game script parses',()=>{
 const js=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(js,'complete playable inline source');
 assert.doesNotThrow(()=>new Function(js[1]));
 assert.ok(code.includes('prepareConservativeStaticSoftwareChunks'));
});
test('W540 skips only provably offscreen original world chunks; pixels and depth agree',()=>{
 const mesh=Float32Array.from([
  ...Array.from({length:96},(_,i)=>triangle(-8-i*.002,-.5)).flat(),
  ...Array.from({length:96},(_,i)=>triangle(.25,-.25+i*.001)).flat()
 ]);
 const a=draw(mesh,false),b=draw(mesh,true);
 assert.equal(a.audit.submitted,192);
 assert.equal(a.audit.visible,b.audit.visible,'all potentially visible triangles remain');
 assert.equal(a.audit.offscreen,b.audit.offscreen,'original per-triangle outside classifications preserved');
 assert.equal(a.audit.staticChunkBoxesTested,2);
 assert.equal(a.audit.staticChunkBoxesRejected,1);
 assert.equal(a.audit.staticChunkCulledTriangles,96);
 assert.equal(b.audit.staticChunkCulledTriangles,0);
 assert.deepEqual(a.pixels,b.pixels,'physical colour/depth screenshot is byte-for-byte identical');
 assert.equal(a.audit.backend,'retained-pixel-depth');
});
test('W540 source block with viewport-crossing roof stays in full painter',()=>{
 const far=Array.from({length:95},(_,i)=>triangle(-8-i*.002,-.5)).flat();
 const crossing=[...triangle(-.98,-.5),...triangle(0,.3)];
 // One real viewport-crossing face in the same spatial box as far-off
 // source faces must force the WHOLE chunk to remain.
 const mesh=Float32Array.from([...far,...crossing.slice(0,30),
  ...Array.from({length:96},(_,i)=>triangle(.15,-.3+i*.001)).flat()]);
 assert.equal(mesh.length/30,192);
 const a=draw(mesh,false),b=draw(mesh,true);
 assert.equal(a.audit.staticChunkBoxesRejected,0);
 assert.equal(a.audit.staticChunkCulledTriangles,0);
 assert.deepEqual(a.pixels,b.pixels);
});
