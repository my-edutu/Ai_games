'use strict';
// Execute the unchanged capture driver with a controlled browser interface.
// This tests evidence rejection and cleanup; it does NOT render or certify pixels.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..');
const driver=fs.readFileSync(path.join(ROOT,'scripts/capture-city-traffic.cjs'),'utf8');
async function scenario(mode) {
  const handlers={},logs=[];
  let reads=0,report,closed=false,launched=false,cameraMode='aerial';
  const page={
    on(event,handler){handlers[event]=handler;},
    async goto(){if(mode==='browser-error')handlers.console({type:()=> 'error',text:()=> 'Injected rendering error for evidence-gate test'});},
    async waitForSelector(){},async waitForFunction(){},async waitForTimeout(){},async setViewportSize(){},async reload(){},async screenshot(){},
    locator(){return{async click(){}};},
    async evaluate(fn){
      const source=fn.toString();
      if(source.includes('getDiagnostics'))return{cameraMode,paused:true,failed:mode==='browser-error',pixelRatio:1};
      if(source.includes('getSnapshot'))return{tick:360,metrics:{},signals:16,pedestrians:12};
      if(source.includes("value:'street'"))cameraMode='street';
      if(source.includes("value:'follow'"))cameraMode='follow';
      if(source.includes("value:'aerial'"))cameraMode='aerial';
    },
  };
  const fakeFs={
    mkdirSync(){},
    readFileSync(file){
      if(mode==='initial-hash-error')throw Object.assign(new Error('Injected unavailable source file'),{code:'ENOENT'});
      const bytes=fs.readFileSync(path.resolve(ROOT,file));
      return mode==='source-drift' && reads++>=8 ? Buffer.concat([bytes,Buffer.from('\n// Simulated concurrent edit\n')]) : bytes;
    },
    writeFileSync(file,text){if(file.endsWith('-report.json'))report=JSON.parse(text);},
  };
  const proc={argv:['node','capture-city-traffic.cjs','--label=runtime-integrity-probe','--output=/tmp/runtime-integrity-probe'],env:{},exitCode:0};
  const sandbox={
    require(name){
      if(name==='node:fs')return fakeFs;
      if(name==='@playwright/test')return{chromium:{async launch(){launched=true;return{async newPage(){return page;},async close(){closed=true;}};}}};
      return require(name);
    },
    process:proc,
    console:{log(...args){logs.push(args.map(String).join(' '));},error(...args){logs.push(args.map(String).join(' '));}},
  };
  await vm.runInNewContext(driver,sandbox,{filename:'scripts/capture-city-traffic.cjs'});
  return{mode,exitCode:proc.exitCode,browserLaunched:launched,browserClosed:closed,reportSaved:Boolean(report),recordedErrors:report?.errors,sourceStable:report?.sourceStable,recordedFailedDiagnostics:report?.scenes.some(scene=>scene.diagnostics.failed),scenes:report?.scenes.length};
}
(async()=>{
  const results=[];
  for(const mode of ['clean','browser-error','source-drift','initial-hash-error'])results.push(await scenario(mode));
  assert.equal(results[0].exitCode,0);
  assert.equal(results[0].sourceStable,true);
  assert.equal(results[1].exitCode,0);
  assert.ok(results[1].recordedErrors.length>0);
  assert.equal(results[1].recordedFailedDiagnostics,true);
  assert.equal(results[2].exitCode,0);
  assert.equal(results[2].sourceStable,false);
  assert.equal(results[3].exitCode,1);
  assert.equal(results[3].browserClosed,false);
  const output={reviewedAt:new Date().toISOString(),scope:'Unmodified capture-driver gate and cleanup behavior with a controlled browser interface; no actual browser or screenshot was created.',results};
  fs.writeFileSync(path.join(__dirname,'runtime-evidence-gate-results.json'),JSON.stringify(output,null,2)+'\n');
  console.log(JSON.stringify(output,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
