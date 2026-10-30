'use strict';
// Controlled-interface tests of capture evidence acceptance and cleanup.
// These do not render or certify any pixels; actual visual evidence is separate.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
const driver=fs.readFileSync(path.join(ROOT,'scripts/capture-city-traffic.cjs'),'utf8');
async function run(mode){
 const handlers={};let reads=0,shots=0,report,closed=false,launched=false,cameraMode='aerial';
 const page={on(event,handler){handlers[event]=handler;},
  async goto(){if(mode==='error')handlers.console({type:()=> 'error',text:()=> 'Injected rendering error'});},
  async waitForSelector(){},async waitForFunction(){},async waitForTimeout(){},async setViewportSize(){},async reload(){},
  async screenshot(){if(mode==='interrupted'&&++shots===3)throw new Error('Injected capture interruption');},
  locator(){return{async click(){}};},
  async evaluate(fn){const source=fn.toString();
   if(source.includes('getDiagnostics'))return{cameraMode,paused:true,failed:mode==='error'||mode==='failed-diagnostics',webgl:true,pixelRatio:1};
   if(source.includes('getSnapshot'))return{tick:360,metrics:{},signals:16,pedestrians:48};
   if(source.includes("value:'street'"))cameraMode='street';
   if(source.includes("value:'follow'"))cameraMode='follow';
   if(source.includes("value:'aerial'"))cameraMode='aerial';
  }};
 const fakeFs={mkdirSync(){},readFileSync(file){
  if(mode==='missing-source')throw Object.assign(new Error('Injected unavailable source'),{code:'ENOENT'});
  const bytes=fs.readFileSync(path.resolve(ROOT,file));
  return mode==='drift'&&reads++>=8?Buffer.concat([bytes,Buffer.from('\n// concurrent edit\n')]):bytes;
 },writeFileSync(file,text){if(file.endsWith('-report.json'))report=JSON.parse(text);}};
 const proc={argv:['node','capture-city-traffic.cjs','--label=gate-test','--output=/tmp/traffic-capture-gate'],env:{},exitCode:0};
 const context={require(name){if(name==='node:fs')return fakeFs;if(name==='@playwright/test')return{chromium:{async launch(){launched=true;return{async newPage(){return page;},async close(){closed=true;}};}}};return require(name);},process:proc,console:{log(){},error(){}}};
 await vm.runInNewContext(driver,context,{filename:'capture-city-traffic.cjs'});
 return{exitCode:proc.exitCode,report,closed,launched};
}
test('capture succeeds only with complete, stable, error-free evidence',async()=>{
 const r=await run('clean');assert.equal(r.exitCode,0);assert.equal(r.closed,true);assert.equal(r.report.complete,true);assert.equal(r.report.sourceStable,true);assert.equal(r.report.scenes.length,6);
});
for(const mode of ['error','failed-diagnostics','drift'])test(`capture rejects ${mode} and retains diagnostics`,async()=>{
 const r=await run(mode);assert.equal(r.exitCode,1);assert.equal(r.closed,true);assert.ok(r.report);if(mode==='drift')assert.equal(r.report.sourceStable,false);
});
test('interrupted capture retains partial evidence and closes the browser',async()=>{
 const r=await run('interrupted');assert.equal(r.exitCode,1);assert.equal(r.closed,true);assert.equal(r.report.complete,false);assert.match(r.report.executionError,/interruption/);assert.equal(r.report.scenes.length,2);
});
test('missing source fingerprint cannot leak a launched browser',async()=>{
 const r=await run('missing-source');assert.equal(r.exitCode,1);assert.ok(!r.launched||r.closed);
});
