'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
// Phase-1 world/actor streaming: the whole authentic citizen geometry must
// have an independent bounded stream even on slow/software WebGL. An actual
// driver allocation denial falls back to the original combined live mesh.
function extractFunction(name){
 const start=html.indexOf('function '+name+'(');
 assert.ok(start>=0,'Missing '+name);
 const body=html.indexOf('{',start);
 let depth=0;
 for(let i=body;i<html.length;i++){
  if(html[i]==='{')depth++;
  else if(html[i]==='}'&&!--depth)return html.slice(start,i+1);
 }
 throw Error('Unterminated '+name);
}
assert.match(html,/let actorStreamSplitEnabled=gpuAvailable,actorDynamicVertexScratch/);
const decide=new Function(extractFunction('decideOriginalSoftwareActorStreamBuffer')+
 '\nreturn decideOriginalSoftwareActorStreamBuffer;')();
const buffer={id:'real-original-actor-vbo'},absent=()=>{throw Error('unexpected GL allocation')};
assert.deepEqual(decide(false,true,true,null,absent),{enabled:true,buffer:null,failed:false});
assert.deepEqual(decide(true,false,true,null,absent),{enabled:true,buffer:null,failed:false});
assert.deepEqual(decide(true,true,false,null,absent),{enabled:false,buffer:null,failed:false});
assert.deepEqual(decide(true,true,true,buffer,absent),{enabled:true,buffer,failed:false});
let allocations=0;
assert.deepEqual(decide(true,true,true,null,()=>{allocations++;return buffer}),
 {enabled:true,buffer,failed:false});
assert.equal(allocations,1);
assert.deepEqual(decide(true,true,true,null,()=>{allocations++;return null}),
 {enabled:false,buffer:null,failed:true});
assert.equal(allocations,2);
assert.match(html,/ensureOriginalSoftwareActorStreamBuffer\(\);\s*const worldPropsStream=data;/);
assert.match(html,/if\(gpuAvailable&&actorStreamSplitEnabled\)\{\s*actorDynamicVertexScratch\.length=0;/);
assert.match(html,/if\(!canRetainIndependentDynamicStreams\(data\.length,actorFrameData\.length\)\)\{/);
assert.match(html,/for\(const vertex of actorFrameData\)data\.push\(vertex\)/);
assert.match(html,/softwareActorSplitAllocationFailures/);
console.log('Phase-1 software world/actor VBO admission, bounded overflow and original fallback PASS');
