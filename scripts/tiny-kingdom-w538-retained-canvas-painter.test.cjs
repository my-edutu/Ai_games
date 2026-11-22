'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=html.indexOf('if(!gl){'),b=html.indexOf('\n// G064:',a);
test('W538 full production game syntax and original scene buffer lifecycle',()=>{
 assert.ok(a>0&&b>a);
 const s=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(s);assert.doesNotThrow(()=>new Function(s[1]));
 assert.ok(html.slice(a,b).includes('const paintOrder=[]'));
 assert.ok(html.slice(a,b).includes('paintOrder.sort('));
 assert.ok(html.slice(a,b).includes('retainedAllWorldData:true'));
});
test('W538 actual original-format triangles retain painted view and buffers across camera frames',()=>{
 const code=html.slice(a,b);
 const ctx={fillStyle:'',calls:[],beginPath(){this.calls.push('begin')},
 moveTo(x,y){this.calls.push(['move',x,y])},
 lineTo(x,y){this.calls.push(['line',x,y])},
 closePath(){this.calls.push('close')},fill(){this.calls.push(this.fillStyle)},
 fillRect(){}};
 const canvas={width:390,height:844,getContext:()=>ctx};
 const f=new Function('canvas','performance','let gl=null,canvasFallbackRasterAudit=()=>({});'+code+';return {gl,audit:()=>canvasFallbackRasterAudit()}');
 const {gl,audit}=f(canvas,{now:()=>1});
 gl.uniformMatrix4fv(null,false,[1,0,0,0,0,1,0,0,0,0,1,.1,0,0,0,1]);
 const p=(v,c)=>[...v,0,1,0,...c,0];
 const tri=(a,b,c,col)=>[...p(a,col),...p(b,col),...p(c,col)];
 const verts=Float32Array.from([
 ...tri([-.2,-.3,2],[.2,-.3,2],[0,.2,2],[.6,.7,.4]),
 ...tri([-1.5,-.4,2],[1.2,-.4,2],[0,.4,2],[.9,.4,.3]),
 ...tri([1.3,0,2],[1.4,.2,2],[1.7,.5,2],[.5,.3,.7]),
 ...tri([-.1,-.1,4],[.1,-.1,4],[0,.3,4],[.3,.2,.8])
 ]);
 gl.bufferData(gl.ARRAY_BUFFER,verts);gl.drawArrays();
 const first=JSON.stringify(ctx.calls);
 gl.drawArrays();
 const status=audit();
 assert.equal(status.submitted,4);assert.equal(status.visible,3);
 assert.equal(status.offscreen,1);assert.equal(status.draws,2);
 assert.equal(status.bufferGrowths,1);assert.equal(status.reusedBufferDraws,1);
 assert.equal(status.capacityTriangles,256);
 assert.equal(status.retainedBufferBytes,256*(7*8+4));
 assert.equal(JSON.stringify(ctx.calls.slice(ctx.calls.length/2)),first);
 assert.equal(status.retainedAllWorldData,true);assert.equal(status.hardwareFps,'NOT MEASURED');
});
