'use strict';
// Controlled-interface evidence acceptance and cleanup probe. No browser is launched,
// no screenshot is generated, and no visual or performance claim follows from this.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../..');
const label=process.argv.find(x=>x.startsWith('--label='))?.slice(8)||'review1';
if(!/^[a-z0-9-]+$/.test(label))throw new Error('Invalid evidence label');
const source=fs.readFileSync(path.join(ROOT,'scripts/capture-city-traffic.cjs'),'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const baseScenes=['aerial','street','follow','night','mobile','mobile-experiment'];
const detailScenes=['aerial','street','follow','citizen-p1','citizen-p2','citizen-p3','vehicle-car','vehicle-bus','vehicle-van','night','mobile','mobile-experiment','junction-390','junction-320'];
async function run(mode,details=false){
 let readCount=0,shots=0,launched=false,closeCalls=0,driverReport,reportAttempted=false;
 const events={},logs=[],screenshots=[],commands=[];
 const state={cameraMode:'aerial',paused:false,failed:mode==='failed-diagnostics',webgl:mode!=='no-webgl',pixelRatio:1};
 const snapshot={tick:360,metrics:{completedTrips:2},signals:Array.from({length:16},(_,id)=>({id})),pedestrians:['p1','p2','p3'].map(id=>({id})),vehicles:['car','bus','van'].map((kind,id)=>({id:`v${id}`,kind}))};
 const pageContext=vm.createContext({window:{cityTraffic:{getDiagnostics(){return{...state};},getSnapshot(){return snapshot;},command(command){commands.push(command);if(command.type==='set-camera')state.cameraMode=command.value;if(command.type==='set-paused')state.paused=command.value;}}}});
 const fault=stage=>{if(mode===stage)throw new Error(`Injected ${stage}`);};
 const page={
  on(event,handler){events[event]=handler;},
  async goto(){fault('navigation-failure');if(mode==='console-error')events.console({type:()=> 'error',text:()=> 'Injected rendering error'});if(mode==='page-error')events.pageerror(new Error('Injected page exception'));if(mode==='console-warning')events.console({type:()=> 'warning',text:()=> 'Injected warning'});},
  async waitForSelector(){fault('readiness-failure');},async waitForFunction(){},async waitForTimeout(){},
  async setViewportSize(){},async reload(){},
  async screenshot(options){shots++;if(mode==='screenshot-failure'&&shots===3)throw new Error('Injected screenshot interruption');screenshots.push(path.basename(options.path));},
  locator(){return{async click(){}};},
  async evaluate(fn,arg){pageContext.argument=arg;return vm.runInContext(`(${fn.toString()})(argument)`,pageContext);},
 };
 const fakeFs={mkdirSync(){},readFileSync(file){
  readCount++;
  if(mode==='initial-fingerprint-failure'&&readCount===1)throw Object.assign(new Error('Injected initial ENOENT'),{code:'ENOENT'});
  if(mode==='final-fingerprint-failure'&&readCount===9)throw Object.assign(new Error('Injected final ENOENT'),{code:'ENOENT'});
  const bytes=fs.readFileSync(path.join(ROOT,file));
  return mode==='source-drift'&&readCount>8?Buffer.concat([bytes,Buffer.from('\n// injected later bytes\n')]):bytes;
 },writeFileSync(filename,text){reportAttempted=true;fault('report-write-failure');driverReport=JSON.parse(text);}};
 const proc={argv:['node','capture-city-traffic.cjs','--label=closure-fixture','--output=/tmp/controlled-capture-output',...(details?['--details']:[])],env:{},exitCode:0};
 const context={require(name){
  if(name==='node:fs')return fakeFs;
  if(name==='@playwright/test')return{chromium:{async launch(){fault('launch-failure');launched=true;return{async newPage(){fault('new-page-failure');return page;},async close(){closeCalls++;}};}}};
  return require(name);
 },process:proc,console:{log(){},error(...args){logs.push(args.map(x=>x?.message||String(x)).join(' '));}}};
 await vm.runInNewContext(source,context,{filename:'capture-city-traffic.cjs'});
 const expectedExit=['clean','console-warning'].includes(mode)?0:1;
 const expectedScenes=details?detailScenes:baseScenes;
 const actualScenes=driverReport?.scenes.map(s=>s.scene)||[];
 const checks={exitCode:proc.exitCode===expectedExit,cleanup:launched?closeCalls===1:closeCalls===0};
 if(expectedExit===0){checks.complete=driverReport?.complete===true;checks.stable=driverReport?.sourceStable===true;checks.errorFree=driverReport?.errors.length===0;checks.exactScenes=JSON.stringify(actualScenes)===JSON.stringify(expectedScenes);}
 if(!['initial-fingerprint-failure','launch-failure','report-write-failure'].includes(mode))checks.reportRetained=Boolean(driverReport);
 if(['console-error','page-error'].includes(mode))checks.errorRecorded=driverReport?.errors.length===1;
 if(mode==='failed-diagnostics')checks.failureRecorded=driverReport?.scenes.every(s=>s.diagnostics.failed===true);
 if(mode==='no-webgl')checks.failureRecorded=driverReport?.scenes.every(s=>s.diagnostics.webgl===false);
 if(['source-drift','final-fingerprint-failure'].includes(mode))checks.sourceRejected=driverReport?.sourceStable===false;
 if(mode==='final-fingerprint-failure')checks.fingerprintErrorRecorded=driverReport?.errors.some(x=>x.includes('Source fingerprint failed'));
 if(['new-page-failure','navigation-failure','readiness-failure','screenshot-failure'].includes(mode)){checks.incomplete=driverReport?.complete===false;checks.executionError=typeof driverReport?.executionError==='string';}
 if(mode==='screenshot-failure')checks.partialScenes=driverReport?.scenes.length===2;
 if(mode==='initial-fingerprint-failure')checks.noLaunch=launched===false;
 return{mode,details,expectedExit,exitCode:proc.exitCode,launched,closeCalls,reportAttempted,screenshotCalls:shots,screenshotNames:screenshots,sceneNames:actualScenes,checks,pass:Object.values(checks).every(Boolean),logs,driverReport};
}
async function main(){
 const results={capturedAt:new Date().toISOString(),reviewer:'runtime_closure_review',scope:'Controlled browser interface only; no browser, screenshots, pixels, audio, or performance measurements',source:'scripts/capture-city-traffic.cjs',sourceSha256:sha(source),node:process.version,cases:[]};
 for(const mode of ['clean','console-warning','console-error','page-error','failed-diagnostics','no-webgl','source-drift','initial-fingerprint-failure','final-fingerprint-failure','launch-failure','new-page-failure','navigation-failure','readiness-failure','screenshot-failure','report-write-failure'])results.cases.push(await run(mode));
 results.cases.push(await run('clean',true));
 results.sourceStable=sha(fs.readFileSync(path.join(ROOT,results.source)))===results.sourceSha256;
 results.allExpectedOutcomes=results.cases.every(x=>x.pass)&&results.sourceStable;
 fs.writeFileSync(path.join(__dirname,`capture-${label}.cjs`),source);
 fs.writeFileSync(path.join(__dirname,`capture-${label}-results.json`),JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify({sourceSha256:results.sourceSha256,cases:results.cases.length,allExpectedOutcomes:results.allExpectedOutcomes,outcomes:results.cases.map(({mode,details,exitCode,launched,closeCalls,sceneNames,checks,pass})=>({mode,details,exitCode,launched,closeCalls,sceneCount:sceneNames.length,checks,pass}))},null,2));
 if(!results.allExpectedOutcomes)process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
