'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
async function load(){
 const code=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/rendered-frame-capture.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
}
test('one real capture request per completed WebGL render; no duplicate frames',async()=>{
 const {createRenderedFrameCapture}=await load();
 let frame=0,requested=0,next=0;const tasks=new Map();
 const pump=createRenderedFrameCapture({readFrame:()=>frame,requestFrame:()=>requested++,
  schedule:fn=>{tasks.set(++next,fn);return next},cancel:id=>tasks.delete(id)});
 pump.start();for(const f of [0,0,1,1,1,2,2]){
  frame=f;const [id,fn]=tasks.entries().next().value;tasks.delete(id);fn();
 }
 assert.equal(requested,3);assert.equal(pump.stats().lastFrame,2);
 assert.equal(pump.stop().requestedFrames,3);assert.equal(tasks.size,0);
});
test('invalid render IDs, cleanup and stop do not invent video',async()=>{
 const {createRenderedFrameCapture}=await load();
 let frame=NaN,requested=0,next=0;const tasks=new Map();
 const pump=createRenderedFrameCapture({readFrame:()=>frame,requestFrame:()=>requested++,
  schedule:fn=>{tasks.set(++next,fn);return next},cancel:id=>tasks.delete(id)});
 pump.start();for(const f of [NaN,Infinity,-1,1.4,4]){
  frame=f;const [id,fn]=tasks.entries().next().value;tasks.delete(id);fn();
 }
 assert.equal(requested,1);pump.stop();assert.equal(tasks.size,0);
});
test('requestFrame exception terminates pump without fake success or retry loop',async()=>{
 const {createRenderedFrameCapture}=await load();let next=0;const tasks=new Map();
 const pump=createRenderedFrameCapture({readFrame:()=>4,requestFrame:()=>{throw Error('track lost')},
  schedule:fn=>{tasks.set(++next,fn);return next},cancel:id=>tasks.delete(id)});
 pump.start();const [id,fn]=tasks.entries().next().value;tasks.delete(id);fn();
 assert.equal(pump.stats().active,false);assert.equal(pump.stats().requestedFrames,0);
 assert.match(pump.stats().failure,/track lost/);
 assert.equal(pump.start().active,false);assert.equal(tasks.size,0);
});
