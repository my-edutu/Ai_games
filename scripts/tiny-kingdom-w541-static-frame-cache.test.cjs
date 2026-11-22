'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('if(!gl){'),end=html.indexOf('\n// G064:',start);
assert.ok(start>0&&end>start,'real original Canvas2D game backend');
const code=html.slice(start,end);
const matrix=[1,0,0,0,0,1,0,0,0,0,1,.1,0,0,0,1];
const v=(x,y,z,color)=>[x,y,z,0,1,0,...color,0];
function tri(x,y,z=3,color=[.6,.5,.4]){
 return [...v(x-.11,y-.1,z,color),...v(x+.11,y-.1,z,color),
 ...v(x,y+.13,z,color)];
}
const staticSource=[
 ...Array.from({length:96},(_,i)=>tri(-.45+i*.0003,-.2)).flat(),
 ...Array.from({length:96},(_,i)=>tri(.1+i*.0003,.0,2.5,[.35,.65,.4])).flat()
];
const movingA=tri(.12,.07,1,[1,.2,.1]),
 movingB=tri(-.13,.06,1,[.1,.2,1]);
function setup(source=staticSource,width=100,height=88){
 const ctx={last:null,fillRect(){},beginPath(){},moveTo(){},
  lineTo(){},closePath(){},fill(){},createImageData(w,h){
   return {data:new Uint8ClampedArray(w*h*4)};
  },putImageData(img){this.last=new Uint8ClampedArray(img.data)}};
 const canvas={width,height,getContext:()=>ctx};
 const run=new Function('canvas','performance','staticSource',
  'let gl=null,canvasFallbackRasterAudit=()=>({});let scenicMeshCache=staticSource;'+
   code+';return {gl,audit:()=>canvasFallbackRasterAudit(),setStatic:s=>{scenicMeshCache=s}}');
 const game=run(canvas,{now:()=>1},source);
 game.gl.uniformMatrix4fv(null,false,matrix);
 return {...game,ctx,source};
}
function frame(p,dynamic=movingA,disabled=false){
 const prior=globalThis.__tinyKingdomDisableStaticFrameCache;
 globalThis.__tinyKingdomDisableStaticFrameCache=disabled;
 try{
  p.gl.bufferData(p.gl.ARRAY_BUFFER,Float32Array.from([...p.source,...dynamic]));
  p.gl.drawArrays();
  return p.ctx.last;
 }finally{
  if(prior===undefined)delete globalThis.__tinyKingdomDisableStaticFrameCache;
  else globalThis.__tinyKingdomDisableStaticFrameCache=prior;
 }
}
test('W541 actual whole playable inline JavaScript parses; static-depth cache is bounded',()=>{
 const inline=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(inline);assert.doesNotThrow(()=>new Function(inline[1]));
 assert.match(code,/SOFTWARE_STATIC_BASE_MAX_PIXELS=1500000/);
 assert.match(code,/rasterRange\(staticCount,count\)/);
});
test('W541 real static picture reused while moving citizen pixel/depth updates correctly',()=>{
 const p=setup(),uncached=setup();
 const a=frame(p,movingA);
 assert.equal(p.audit().staticFrameCache.builds,1);
 assert.equal(p.audit().staticFrameCache.hits,0);
 assert.deepEqual(a,frame(uncached,movingA,true));
 const b=frame(p,movingB);
 assert.equal(p.audit().staticFrameCache.hits,1);
 assert.equal(p.audit().staticFrameCache.staticProjectionCacheHits,1);
 assert.equal(p.audit().staticFrameCache.staticProjectionTrianglesSkippedLastFrame,192);
 assert.equal(p.audit().staticFrameCache.builds,1);
 assert.notDeepEqual(a,b,'the live moving actor must change the actual pixels');
 assert.deepEqual(b,frame(uncached,movingB,true));
 assert.equal(p.audit().submitted,193,'all real source triangles retained');
 assert.equal(p.audit().staticFrameCache.preservesLiveActors,true);
});
test('W541 camera, lighting and original immutable world revision invalidate safely',()=>{
 const p=setup(),fresh=setup();
 frame(p);
 const changed=matrix.slice();changed[12]=.17;
 p.gl.uniformMatrix4fv(null,false,changed);
 fresh.gl.uniformMatrix4fv(null,false,changed);
 assert.deepEqual(frame(p,movingB),frame(fresh,movingB,true));
 assert.equal(p.audit().staticFrameCache.builds,2);
 p.gl.uniform3f('sunTint',.72,.84,.91);
 fresh.gl.uniform3f('sunTint',.72,.84,.91);
 assert.deepEqual(frame(p,movingA),frame(fresh,movingA,true));
 assert.equal(p.audit().staticFrameCache.builds,3);
 const alternative=staticSource.map((x,i)=>i%30===6?x*.8:x);
 p.source=alternative;fresh.source=alternative;
 p.setStatic(alternative);fresh.setStatic(alternative);
 assert.deepEqual(frame(p,movingB),frame(fresh,movingB,true));
 assert.equal(p.audit().staticFrameCache.builds,4);
 assert.equal(p.audit().staticFrameCache.changedAuthority,false);
 assert.equal(p.audit().hardwareFps,'NOT MEASURED');
});
test('W541 same-source 390px view stays pixel-identical to exhaustive painting',()=>{
 const a=setup(staticSource,390,844),b=setup(staticSource,390,844);
 frame(a,movingA);
 const cached=frame(a,movingB),exhaustive=frame(b,movingB,true);
 assert.deepEqual(cached,exhaustive);
 assert.equal(a.audit().staticFrameCache.hits,1);
 assert.ok(a.audit().staticFrameCache.bytes<=390*844*8);
});