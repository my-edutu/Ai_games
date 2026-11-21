'use strict';
// W285: source-executed contract on the real renderer's retained shutter and
// genuine completed-work GPU paths. The workload is actual house growth, not
// a fabricated citizen, receipt, marketplace or preview frame.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
new vm.Script(source);
function extract(name){
 const at=source.indexOf('function '+name+'(');
 assert(at>=0,'missing running renderer function '+name);
 const open=source.indexOf('{',at);let depth=0;
 for(let i=open;i<source.length;i++){
  if(source[i]==='{')depth++;
  if(source[i]==='}'&&--depth===0)return source.slice(at,i+1);
 }
 throw Error('unclosed renderer function '+name);
}
const context={Boolean,Math,gpuAvailable:true,swiftGpu:true,
 city:Array.from({length:17},(_,i)=>[i,0,0]),
 SOFTWARE_HOME_CLUSTER_MIN_HOMES:18,
 marketShutterResidentOverride:null,recordedWorkOverride:null};
const oldCity=JSON.stringify(context.city);
vm.runInNewContext([
 extract('growingSceneResidentAllowed'),
 extract('marketShutterResidencyRequested'),
 extract('recordedWorkResidencyRequested'),
 'this.check=function(){return [growingSceneResidentAllowed(),marketShutterResidencyRequested(),recordedWorkResidencyRequested()]}'
].join('\n'),context);
const compare=(expected,label)=>assert.deepEqual(Array.from(context.check()),expected,label);
compare([false,false,false],'17-home software settlement keeps safe CPU fallback');
context.city.push([17,0,0]);
compare([true,true,true],'grown software settlement retains real shutters and recorded work');
context.city.push([18,0,0]);
compare([true,true,true],'continued Day-120 growth must not change residency eligibility');
context.city.pop();context.city.pop();
compare([false,false,false],'restore of smaller settlement drops residency eligibility');
context.swiftGpu=false;
compare([true,true,true],'native GPU supports source-resident original assets at any city size');
context.swiftGpu=true;
context.marketShutterResidentOverride=true;context.recordedWorkOverride=true;
compare([false,true,true],'explicit GPU test override works before software growth');
context.marketShutterResidentOverride=false;context.recordedWorkOverride=false;
compare([false,false,false],'explicit opt-out always uses original CPU mesh');
context.gpuAvailable=false;
context.marketShutterResidentOverride=true;context.recordedWorkOverride=true;
compare([false,false,false],'failed WebGL must never report a resident GPU buffer');
assert.equal(JSON.stringify(context.city),oldCity,'render-only tests cannot grow the actual city');
assert(source.includes('renderMarketOperatingShutters(0,true)'),
 'retained shutter topology must come from the eight actual market leaves');
assert(source.includes('renderRecordedWorkdayProps(events)'),
 'completed-work buffer must come from authentic recorded events');
console.log('W285 real grown-town original shutters and earned-work residency: source contract PASS; GPU parity, Day-120 footage and device FPS require browser evidence.');
