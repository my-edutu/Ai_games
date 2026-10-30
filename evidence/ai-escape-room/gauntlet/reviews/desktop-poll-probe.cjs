'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('@playwright/test');
const delayFirstBody=process.argv.includes('--delay-first-body');
const blockFirstContinuation=process.argv.includes('--block-first-continuation');
const checkIncompleteTransfer=process.argv.includes('--check-incomplete-transfer');
const out=path.join(__dirname,blockFirstContinuation?'desktop-poll-continuation.json':delayFirstBody?'desktop-poll-completed-transfer.json':'desktop-poll-probe.json');
(async()=>{
  const report={started:new Date().toISOString(),bodyDelayMs:delayFirstBody?1900:0,continuationBlockMs:blockFirstContinuation?2100:0,checkIncompleteTransfer,console:[]};let browser,context;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});
    context=await browser.newContext({viewport:{width:1920,height:1080}});
    const page=await context.newPage();page.setDefaultTimeout(20000);
    page.on('console',event=>{if(['warning','error'].includes(event.type()))report.console.push({time:Date.now(),type:event.type(),text:event.text()});});
    page.on('pageerror',error=>report.console.push({time:Date.now(),type:'pageerror',text:error.message}));
    await page.addInitScript(({delayFirstBody,blockFirstContinuation})=>{
      const rows=window.__POLL_PROBE__=[],nativeFetch=window.fetch;let sequence=0;
      const log=event=>{rows.push({at:performance.now(),...event});if(rows.length>240)rows.shift();};
      const nativeTimeout=window.setTimeout;
      window.setTimeout=function(callback,delay,...args){
        if(delay!==1800)return nativeTimeout.call(this,callback,delay,...args);
        const id=sequence+1;log({id,event:'deadline-armed',delay});
        return nativeTimeout.call(this,function(...values){log({id,event:'deadline-fired'});return callback.apply(this,values);},delay,...args);
      };
      const NativeObserver=window.PerformanceObserver;
      if(NativeObserver)window.PerformanceObserver=class extends NativeObserver{
        constructor(callback){
          const id=sequence+1;
          super((list,observer)=>{
            const entries=list.getEntries();
            if(entries.some(entry=>entry.entryType==='resource'))log({id,event:'resource-callback',entries:entries.map(entry=>({name:entry.name,initiatorType:entry.initiatorType,startTime:entry.startTime,responseEnd:entry.responseEnd}))});
            callback(list,observer);
          });
          this.probeId=id;
        }
        takeRecords(){const entries=super.takeRecords();log({id:this.probeId,event:'resource-records',entries:entries.map(entry=>({name:entry.name,initiatorType:entry.initiatorType,startTime:entry.startTime,responseEnd:entry.responseEnd}))});return entries;}
      };
      window.fetch=async function(input,options){
        const pathname=new URL(typeof input==='string'?input:input.url,location.href).pathname;
        if(pathname!=='/escape-room/state')return nativeFetch.call(this,input,options);
        const id=++sequence;log({id,event:'fetch-start'});
        options?.signal?.addEventListener('abort',()=>log({id,event:'abort'}),{once:true});
        try{
          const response=await nativeFetch.call(this,input,options);log({id,event:'headers',status:response.status});
          const nativeJSON=response.json.bind(response);
          response.json=async function(){
            log({id,event:'body-start'});
            // Fault injection only: keep the real response and native JSON read,
            // but defer its consumption beyond the app's network deadline once.
            if(delayFirstBody&&id===1){log({id,event:'body-deferred',delayMs:1900});await new Promise(resolve=>setTimeout(resolve,1900));}
            try{
              log({id,event:'native-body-start'});const pending=nativeJSON();
              if(blockFirstContinuation&&id===1){
                log({id,event:'main-thread-stall-start',durationMs:2100});
                const end=performance.now()+2100;while(performance.now()<end){}
                log({id,event:'main-thread-stall-end'});
              }
              const state=await pending;log({id,event:'body-complete',runToken:state.runToken,roomIndex:state.roomIndex,tick:state.tick});return state;
            }
            catch(error){log({id,event:'body-error',name:error.name,message:error.message});throw error;}
          };
          return response;
        }catch(error){log({id,event:'fetch-error',name:error.name,message:error.message});throw error;}
      };
      try{new PerformanceObserver(list=>{for(const entry of list.getEntries())log({event:'longtask',start:entry.startTime,duration:entry.duration});}).observe({type:'longtask',buffered:true});}catch{}
    },{delayFirstBody,blockFirstContinuation});
    await page.goto('http://127.0.0.1:4177/escape-room',{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>Boolean(window.__ESCAPE_PUBLIC_STATE__),null,{polling:100,timeout:45000});
    report.first=await page.evaluate(()=>({runToken:window.__ESCAPE_PUBLIC_STATE__.runToken,tick:window.__ESCAPE_PUBLIC_STATE__.tick,roomIndex:window.__ESCAPE_PUBLIC_STATE__.roomIndex,at:performance.now(),diagnostics:window.__ESCAPE_RENDER_DIAGNOSTICS__}));
    try{
      await page.waitForFunction(first=>{const state=window.__ESCAPE_PUBLIC_STATE__;return state&&(state.runToken!==first.runToken||state.tick>first.tick)&&document.querySelector('[data-testid="tick"]').textContent===String(state.tick);},report.first,{polling:100,timeout:10000});
      report.progressWithin10s=true;
    }catch(error){report.progressWithin10s=false;report.progressError=error.message;}
    await page.waitForTimeout(7000);
    report.last=await page.evaluate(()=>({runToken:window.__ESCAPE_PUBLIC_STATE__?.runToken,tick:window.__ESCAPE_PUBLIC_STATE__?.tick,roomIndex:window.__ESCAPE_PUBLIC_STATE__?.roomIndex,at:performance.now(),diagnostics:window.__ESCAPE_RENDER_DIAGNOSTICS__,events:window.__POLL_PROBE__,resources:performance.getEntriesByType('resource').filter(entry=>entry.name.includes('/escape-room/state')).map(entry=>({start:entry.startTime,responseEnd:entry.responseEnd,duration:entry.duration}))}));
    if(delayFirstBody){
      const firstEvents=report.last.events.filter(event=>event.id===1);
      report.completedTransferSurvivedDelay=firstEvents.some(event=>event.event==='body-complete')&&!firstEvents.some(event=>event.event==='abort');
      if(!report.completedTransferSurvivedDelay||!report.progressWithin10s)process.exitCode=1;
    }
    if(blockFirstContinuation){
      const firstEvents=report.last.events.filter(event=>event.id===1);
      report.continuationSurvivedBlock=firstEvents.some(event=>event.event==='body-complete')&&!firstEvents.some(event=>event.event==='abort');
      report.completedDeadlineCases=report.last.events.filter(event=>event.event==='deadline-fired').map(fired=>{
        const events=report.last.events.filter(event=>event.id===fired.id),nativeStart=events.find(event=>event.event==='native-body-start'),complete=events.find(event=>event.event==='body-complete');
        return{id:fired.id,nativeBodyBeforeDeadline:Boolean(nativeStart&&nativeStart.at<=fired.at),bodyCompletedAfterDeadline:Boolean(complete&&complete.at>=fired.at),aborted:events.some(event=>event.event==='abort'),resourceEntries:events.filter(event=>['resource-callback','resource-records'].includes(event.event)).flatMap(event=>event.entries)};
      });
      report.nativeCompletionExemptionObserved=report.completedDeadlineCases.some(value=>value.nativeBodyBeforeDeadline&&value.bodyCompletedAfterDeadline&&!value.aborted&&value.resourceEntries.some(entry=>entry.initiatorType==='fetch'&&entry.responseEnd>0));
      if(!report.continuationSurvivedBlock||!report.nativeCompletionExemptionObserved||!report.progressWithin10s)process.exitCode=1;
    }
    if(checkIncompleteTransfer){
      const cdp=await context.newCDPSession(page);
      await cdp.send('Network.enable');
      try{
        await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:2048,uploadThroughput:1048576});
        const from=await page.evaluate(()=>performance.now());
        report.incompleteTransferStartedAt=from;
        try{
          await page.waitForFunction(from=>{
            const rows=window.__POLL_PROBE__,started=new Set(rows.filter(event=>event.event==='fetch-start'&&event.at>=from).map(event=>event.id));
            return rows.some(event=>event.event==='abort'&&started.has(event.id));
          },from,{polling:100,timeout:10000});
          report.incompleteTransferAborted=true;
        }catch(error){report.incompleteTransferAborted=false;report.incompleteTransferError=error.message;process.exitCode=1;}
        report.throttledEvents=await page.evaluate(from=>window.__POLL_PROBE__.filter(event=>event.at>=from),from);
        report.partialBodyAborted=report.throttledEvents.filter(event=>event.event==='abort').some(abort=>{
          const events=report.throttledEvents.filter(event=>event.id===abort.id);
          return events.some(event=>event.event==='headers'&&event.status===200&&event.at<=abort.at)&&events.some(event=>event.event==='native-body-start'&&event.at<=abort.at)&&!events.some(event=>event.event==='body-complete'&&event.at<=abort.at);
        });
        if(blockFirstContinuation&&!report.partialBodyAborted)process.exitCode=1;
      }finally{
        await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
        await cdp.detach();
      }
    }
  }catch(error){report.error=error.stack;process.exitCode=1;}
  finally{await context?.close().catch(()=>{});await browser?.close().catch(()=>{});report.finished=new Date().toISOString();fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,first:report.first&&{tick:report.first.tick,roomIndex:report.first.roomIndex},last:report.last&&{tick:report.last.tick,roomIndex:report.last.roomIndex},progressWithin10s:report.progressWithin10s,completedTransferSurvivedDelay:report.completedTransferSurvivedDelay,continuationSurvivedBlock:report.continuationSurvivedBlock,nativeCompletionExemptionObserved:report.nativeCompletionExemptionObserved,incompleteTransferAborted:report.incompleteTransferAborted,partialBodyAborted:report.partialBodyAborted,error:report.error}));}
})();
