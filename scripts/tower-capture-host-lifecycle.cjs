'use strict';
// Original-20Hz capture HOST lifecycle. This is neutral CI evidence harness,
// NOT a fixture, game engine, clock controller, or alternate source authority.
// Start AFTER the real Playwright native-video page exists. The source game
// remains the exact checked-out baseline/candidate and advances normally.
const {spawn}=require('node:child_process');
const {setTimeout:delay}=require('node:timers/promises');
const READY_TEXT='Source-authentic Tower capture host listening on ';
// Keep the evidence host readiness/termination deadline referenced. A detached
// timer can let Node exit while a mocked child (or a crashed real child) leaves
// the readiness Promise unresolved, cancelling the entire integrity suite.
const sleep=ms=>delay(ms);
async function startFreshOriginalCaptureHost(options={}) {
 const env=options.env||process.env;
 if(env.CI!=='true'||env.TOWER_CAPTURE_UNALTERED_SOURCE!=='1'||
    env.TOWER_CAPTURE_LATE_HOST_START!=='1')
   throw new Error('Fresh original capture host is restricted to explicit CI source-evidence mode');
 const port=options.port??4176;
 const timeoutMs=options.timeoutMs??16000;
 if(!Number.isInteger(port)||port<1||port>65535||
    !Number.isFinite(timeoutMs)||timeoutMs<100||timeoutMs>60000)
   throw new RangeError('original capture host launch bounds');
 const launch=options.spawnProcess||spawn;
 const check=options.checkHealth||(async url=>{
   const response=await fetch(url,{signal:AbortSignal.timeout(1500)});
   return response.ok?response.json():null;
 });
 const now=options.now||Date.now,wait=options.wait||sleep;
 const launchedAtMs=now();
 // This launches ONLY the current checkout's original host. No baseline
 // assets, simulation rules, snapshots, ticks, port alias or game files change.
 const child=launch(process.execPath,
   ['scripts/tower-source-capture-server.cjs','--port='+port],
   {cwd:options.cwd||process.cwd(),env,stdio:['ignore','pipe','pipe']});
 let exited=false,exitReason='',listening=false,stdout='',stderr='',stopped=false;
 let exitResolve;
 const exitedPromise=new Promise(resolve=>{exitResolve=resolve;});
 const onExit=(reason)=>{if(exited)return;exited=true;exitReason=reason;exitResolve();};
 child.once('error',error=>onExit('spawn: '+String(error?.message||error)));
 child.once('exit',(code,signal)=>onExit('exit='+code+', signal='+signal));
 child.stdout?.on('data',chunk=>{
   stdout=(stdout+String(chunk)).slice(-2048);
   if(stdout.includes(READY_TEXT+port))listening=true;
 });
 child.stderr?.on('data',chunk=>{stderr=(stderr+String(chunk)).slice(-2048);});
 async function stop(){
   if(stopped)return;
   stopped=true;
   if(!exited) {
     child.kill('SIGTERM');
     await Promise.race([exitedPromise,wait(2000)]);
     if(!exited)child.kill('SIGKILL');
   }
 }
 try {
   // A health reply from a STALE host is insufficient. Require the exact
   // child we spawned to announce that it successfully bound this port.
   while(now()-launchedAtMs<timeoutMs){
     if(exited)throw new Error('Original source host stopped: '+exitReason+' '+stderr);
     if(listening) {
       try{
         const health=await check('http://127.0.0.1:'+port+'/tower/health');
         // The health endpoint could belong to an older process if our child
         // died while the request was in flight: require live ownership NOW.
         if(health?.status==='healthy'&&!exited)
           return {launchedAtMs,readyAtMs:now(),port,stop,
             authority:'unaltered-current-checkout-20Hz-original-host'};
       }catch{/* Not ready yet; fail closed after bounded wait. */}
     }
     await wait(90);
   }
   throw new Error('Original source host did not bind and report healthy inside '+timeoutMs+
     'ms; stdout='+stdout+' stderr='+stderr);
 }catch(error){await stop();throw error;}
}
module.exports={startFreshOriginalCaptureHost,READY_TEXT};
