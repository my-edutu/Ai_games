'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=html.indexOf('if(!gl){'),b=html.indexOf('\n// G064:',a);
const code=html.slice(a,b);
function context(withDepth){
 const ctx={calls:[],fillStyle:'',beginPath(){this.calls.push('begin')},
 moveTo(){},lineTo(){},closePath(){},fill(){this.calls.push('fill')},fillRect(){}};
 if(withDepth){ctx.createImageData=(w,h)=>({data:new Uint8ClampedArray(w*h*4)});
  ctx.putImageData=(img)=>{ctx.last=new Uint8ClampedArray(img.data)};}
 return ctx;
}
function player(ctx){
 const canvas={width:64,height:64,getContext:()=>ctx};
 return new Function('canvas','performance',
  'let gl=null,canvasFallbackRasterAudit=()=>({});'+code+
  ';return {gl,audit:()=>canvasFallbackRasterAudit()}')(canvas,{now:()=>1});
}
const vertex=(x,y,z,r,g,b)=>[x,y,z,0,1,0,r,g,b,0];
const near=[...vertex(-.6,-.6,2,1,0,0),...vertex(.6,-.6,2,1,0,0),
 ...vertex(0,.6,2,1,0,0)];
const far=[...vertex(-.7,-.7,4,0,1,0),...vertex(.7,-.7,4,0,1,0),
 ...vertex(0,.7,4,0,1,0)];
const matrix=[1,0,0,0,0,1,0,0,0,0,1,.1,0,0,0,1];
test('W539 complete game script parses, true no-WebGL pixel spine exists',()=>{
 const inline=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(inline);assert.doesNotThrow(()=>new Function(inline[1]));
 assert.ok(code.includes('function drawSoftwareDepthFrame('));
});
test('W539 near roof/worker resolves physically in FRONT independent of submission order',()=>{
 for(const order of [[...near,...far],[...far,...near]]){
  const ctx=context(true),{gl,audit}=player(ctx);
  gl.uniformMatrix4fv(null,false,matrix);
  gl.bufferData(gl.ARRAY_BUFFER,Float32Array.from(order));gl.drawArrays();
  const p=(32*64+32)*4,rgba=Array.from(ctx.last.slice(p,p+4));
  assert.ok(rgba[0]>220&&rgba[1]<40&&rgba[2]<40&&rgba[3]===255,
   'near red face must occlude far green at center: '+rgba);
  const a=audit();assert.equal(a.backend,'retained-pixel-depth');
  assert.equal(a.submitted,2);assert.equal(a.visible,2);
  assert.ok(a.depthPixels>0);assert.ok(a.depthSurfaceBytes>0);
  assert.equal(a.hardwareFps,'NOT MEASURED');
 }
});
test('W539 bounded buffer reuse and fallback retain original submitted geometry',()=>{
 const ctx=context(true),{gl,audit}=player(ctx);
 gl.uniformMatrix4fv(null,false,matrix);
 gl.bufferData(gl.ARRAY_BUFFER,Float32Array.from([...near,...far]));
 gl.drawArrays();gl.drawArrays();
 assert.equal(audit().depthSurfaceRebuilds,1);
 assert.equal(audit().reusedBufferDraws,1);
 assert.equal(audit().capacityTriangles,256);
 const legacyCtx=context(false),legacy=player(legacyCtx);
 legacy.gl.uniformMatrix4fv(null,false,matrix);
 legacy.gl.bufferData(legacy.gl.ARRAY_BUFFER,Float32Array.from([...near,...far]));
 legacy.gl.drawArrays();
 assert.equal(legacy.audit().backend,'legacy-canvas-paths');
 assert.ok(legacyCtx.calls.includes('fill'));
 assert.equal(legacy.audit().submitted,2);
});
