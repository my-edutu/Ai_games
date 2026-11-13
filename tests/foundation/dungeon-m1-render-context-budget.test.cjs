'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/render-context-plan.js');
async function load(){return import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'))}
function harness(name,{extension=true,unavailable=false}={}){
 const calls=[];let lost=0;const context={RENDERER:0x1F01,
  getExtension(key){return key==='WEBGL_debug_renderer_info'&&extension?{UNMASKED_RENDERER_WEBGL:0x9246}:key==='WEBGL_lose_context'?{loseContext(){lost++}}:null},
  getParameter(key){return key===0x9246?name:'WebKit WebGL'}};
 return {make(){calls.push('canvas');return {getContext(kind,options){calls.push([kind,options]);return unavailable?null:context}}},calls,lost:()=>lost};
}
test('verified SwiftShader selects a single-sample real rendering context and releases the probe',async()=>{
 const {planRendererAntialias}=await load();const h=harness('ANGLE (Google, SwiftShader Device (Subzero))');
 const b=planRendererAntialias(()=>h.make());
 assert.deepEqual({antialias:b.antialias,softwareDetected:b.softwareDetected,verified:b.verified},{antialias:false,softwareDetected:true,verified:true});
 assert.equal(h.calls[1][0],'webgl2');assert.equal(h.calls[1][1].antialias,false);
 assert.equal(h.lost(),1);
});
test('real GPU preserves original antialias fidelity while probe is safely torn down',async()=>{
 const {planRendererAntialias}=await load();const h=harness('ANGLE (NVIDIA GeForce RTX 3070)');
 const b=planRendererAntialias(()=>h.make());assert.equal(b.antialias,true);
 assert.equal(b.softwareDetected,false);assert.equal(b.verified,true);assert.equal(h.lost(),1);
});
test('privacy-restricted, absent, malformed or throwing WebGL retains native quality',async()=>{
 const {planRendererAntialias}=await load();
 for(const name of ['WebKit WebGL','',null]){
  const h=harness(name,{extension:false}),p=planRendererAntialias(()=>h.make());
  assert.equal(p.antialias,true);assert.equal(p.softwareDetected,false);assert.equal(h.lost(),1);
 }
 assert.equal(planRendererAntialias(()=>({getContext(){throw Error('blocked')}})).antialias,true);
 assert.equal(planRendererAntialias(()=>({getContext(){return null}})).antialias,true);
 assert.equal(planRendererAntialias(null).antialias,true);
});
test('failing GPU probe disposal never prevents the real game from starting',async()=>{
 const {planRendererAntialias}=await load();
 const b=planRendererAntialias(()=>({getContext(){return {RENDERER:0x1F01,getParameter(){return 'Google SwiftShader'},getExtension(key){if(key==='WEBGL_lose_context')throw Error('context lost');return null}}}}));
 assert.equal(b.antialias,false);assert.equal(b.softwareDetected,true);
});
