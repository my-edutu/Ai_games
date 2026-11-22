'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(process.env.TINY_HTML||path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const inline=html.match(/<script>([\s\S]*?)<\/script>/);
test('W537 actual complete playable game script parses',()=>{
 assert.ok(inline,'original inline production game required');
 assert.doesNotThrow(()=>new Function(inline[1]));
});
test('W537 Canvas2D implements all real original scene-light uniform calls',()=>{
 const i=html.indexOf("if(!gl){const ctx=canvas.getContext('2d')");
 assert.ok(i>=0);
 const fallback=html.slice(i,i+5400);
 for(const method of ['uniform4fv:noop','uniform4f:noop','uniform2f:noop','uniform1i:noop'])
  assert.ok(fallback.includes(method),'missing '+method);
 assert.ok(fallback.includes('uniformMatrix4fv:(_,__,m)=>{projection=m}'));
});
test('W537 preserve authentic people/houses crossing 390px viewport and reject only fully offscreen original triangles',()=>{
 const start=inline[1].indexOf('function canvasTriangleOutsideViewport(');
 const end=inline[1].indexOf('\nif(!gl){',start);
 assert.ok(start>0&&end>start);
 const outside=vm.runInNewContext(inline[1].slice(start,end)+'\ncanvasTriangleOutsideViewport');
 const t=(a,b,c)=>outside(a,b,c);
 assert.equal(t([0,0],[.3,.2],[-.4,.6]),false);
 assert.equal(t([-2,.2],[2,.2],[0,.2]),false,'real roof spanning screen stays');
 assert.equal(t([-.8,-2],[.3,3],[.5,-.5]),false,'real adult crossing screen stays');
 assert.equal(t([-1.002,-.3],[-.99,.2],[-1.1,.5]),false);
 assert.equal(t([1.0008,.2],[1.0009,.3],[1.0007,.4]),false);
 assert.equal(t([-1.5,.1],[-1.7,.7],[-2,.8]),true);
 assert.equal(t([1.2,.1],[1.3,.2],[1.5,.5]),true);
 assert.equal(t([.1,1.2],[.3,1.4],[.6,1.7]),true);
 assert.equal(t([.1,-1.2],[.3,-1.4],[.6,-1.7]),true);
});
test('W537 retain full world submission and expose honest software wall-time diagnosis',()=>{
 assert.ok(html.includes('getCanvasFallbackRasterAudit:()=>canvasFallbackRasterAudit()'));
 assert.ok(html.includes('if(canvasTriangleOutsideViewport(a,b,c)){rejectedOffscreen++;continue;}'));
 assert.ok(html.includes('fallbackStats.submitted=vertices.length/30'));
 assert.ok(html.includes("hardwareFps:'NOT MEASURED'"));
});
