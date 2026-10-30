'use strict';
// Independent integration probe: every state and body comes from the actual
// server, and the production worker keeps its native fetch/JSON/timer ordering.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
const root=path.resolve(__dirname,'../../../..');
const out=path.join(__dirname,process.env.ESCAPE_WORKER_PROBE_OUT||'worker-native-probe.json');
const files=['app.js','network.js','state-worker.js','bootstrap.js','room3d.js','scenery3d.js','mechanisms3d.js','archivist3d.js'].map(name=>'public/ai-escape-room/'+name).concat('scripts/serve-escape-room-stream.cjs');
const hashes=()=>Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(read,predicate,timeout=10000){const end=Date.now()+timeout;let value;do{value=await read();if(predicate(value))return value;await sleep(120);}while(Date.now()<end);throw new Error('Timed out observing native condition: '+JSON.stringify(value).slice(-1200));}

(async()=>{
  const report={started:new Date().toISOString(),sourceBefore:hashes(),browser:'Chromium / ANGLE SwiftShader WebGL',viewport:{width:1920,height:1080},stallMs:2600,console:[],checks:{}};
  let browser,context,page,worker,browserCDP,workerSession;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader']});
    context=await browser.newContext({viewport:report.viewport});page=await context.newPage();page.setDefaultTimeout(20000);
    page.on('console',event=>{if(['error','warning'].includes(event.type()))report.console.push({at:Date.now(),type:event.type(),text:event.text()});});
    page.on('pageerror',error=>report.console.push({at:Date.now(),type:'pageerror',text:error.message}));
    await page.addInitScript(()=>{
      const rows=window.__NATIVE_MAIN_EVENTS__=[];
      const log=value=>rows.push({at:performance.timeOrigin+performance.now(),...value});
      const NativeWorker=window.Worker,fetch=window.fetch,timer=window.setTimeout;
      window.__NATIVE_FLAGS__={};
      window.fetch=function(input,...args){const url=new URL(typeof input==='string'?input:input.url,location.href);if(url.pathname==='/escape-room/state')log({event:'window-fetch-state'});return fetch.call(this,input,...args);};
      window.setTimeout=function(callback,delay,...args){if(delay===1800)log({event:'main-network-timer',delay});return timer.call(this,callback,delay,...args);};
      window.Worker=class extends NativeWorker{
        constructor(url,options){super(url,options);log({event:'worker-created',url:String(url),name:options?.name});this.addEventListener('message',event=>log({event:'received',type:event.data?.type,id:event.data?.id,tick:event.data?.state?.tick,runToken:event.data?.state?.runToken}));}
        postMessage(message,...args){
          log({event:'sent',type:message?.type,id:message?.id});super.postMessage(message,...args);
          if(message?.type==='poll'&&window.__NATIVE_FLAGS__.stallNext){
            window.__NATIVE_FLAGS__.stallNext=false;log({event:'stall-start',id:message.id});
            const end=performance.now()+2600;while(performance.now()<end){}
            log({event:'stall-end',id:message.id});
          }
          if(message?.type==='poll'&&window.__NATIVE_FLAGS__.replayNext){
            window.__NATIVE_FLAGS__.replayNext=false;
            queueMicrotask(()=>{const frame=structuredClone(window.__ESCAPE_PUBLIC_STATE__);window.__ESCAPE_PRESENT_FRAME__(frame);log({event:'replay-start',id:message.id,tick:frame.tick,runToken:frame.runToken});});
          }
        }
        terminate(){log({event:'worker-terminated'});return super.terminate();}
      };
    });
    const created=page.waitForEvent('worker',{timeout:30000});
    await page.goto('http://127.0.0.1:4177/escape-room',{waitUntil:'domcontentloaded',timeout:30000});worker=await created;
    assert.equal(worker.url(),'http://127.0.0.1:4177/escape-room/state-worker.js');
    await page.waitForFunction(()=>Boolean(window.__ESCAPE_PUBLIC_STATE__&&window.__ESCAPE_RENDER_DIAGNOSTICS__?.webgl),null,{polling:100,timeout:45000});
    report.initial=await page.evaluate(()=>({network:{...window.__ESCAPE_NETWORK_DIAGNOSTICS__},public:{runToken:window.__ESCAPE_PUBLIC_STATE__.runToken,tick:window.__ESCAPE_PUBLIC_STATE__.tick},mainEvents:window.__NATIVE_MAIN_EVENTS__}));
    assert.equal(report.initial.network.transport,'worker');assert.equal(report.initial.network.reason,null);assert.equal(report.initial.network.workerStarts,1);
    assert.ok(report.initial.mainEvents.findIndex(event=>event.event==='received'&&event.type==='ready')<report.initial.mainEvents.findIndex(event=>event.event==='sent'&&event.type==='poll'));
    assert.ok(!report.initial.mainEvents.some(event=>event.event==='window-fetch-state'));
    report.checks.realWorkerHandshake=true;
    await worker.evaluate(()=>{
      const rows=self.__NATIVE_WORKER_EVENTS__=[],log=value=>rows.push({at:performance.timeOrigin+performance.now(),...value});
      let currentId;const timers=new Map(),message=self.onmessage,fetch=self.fetch,post=self.postMessage,timer=self.setTimeout,clear=self.clearTimeout;
      self.onmessage=function(event){currentId=event.data?.id;log({event:'received',type:event.data?.type,id:currentId});return message.call(this,event);};
      self.setTimeout=function(callback,delay,...args){
        if(delay!==1800)return timer.call(this,callback,delay,...args);
        const id=currentId;log({event:'deadline-armed',id,delay});const key=timer.call(this,function(...values){log({event:'deadline-fired',id});timers.delete(key);return callback.apply(this,values);},delay,...args);timers.set(key,id);return key;
      };
      self.clearTimeout=function(key){if(timers.has(key)){log({event:'deadline-cleared',id:timers.get(key)});timers.delete(key);}return clear.call(this,key);};
      self.postMessage=function(message,...args){log({event:'posted',type:message?.type,id:message?.id,error:message?.error,tick:message?.state?.tick,runToken:message?.state?.runToken});return post.call(this,message,...args);};
      self.fetch=async function(input,options){
        const id=currentId;log({event:'fetch-start',id,url:String(input)});options?.signal?.addEventListener('abort',()=>log({event:'abort',id}),{once:true});
        try{
          const response=await fetch.call(this,input,options);log({event:'headers',id,status:response.status});const json=response.json.bind(response);
          response.json=async function(){log({event:'native-body-start',id});try{const state=await json();log({event:'body-complete',id,tick:state.tick,runToken:state.runToken});return state;}catch(error){log({event:'body-error',id,name:error.name,message:error.message});throw error;}};
          return response;
        }catch(error){log({event:'fetch-error',id,name:error.name,message:error.message});throw error;}
      };
    });
    const events=()=>worker.evaluate(()=>self.__NATIVE_WORKER_EVENTS__);
    await page.evaluate(()=>{window.__NATIVE_FLAGS__.stallNext=true;});
    const mainStall=await until(()=>page.evaluate(()=>window.__NATIVE_MAIN_EVENTS__),rows=>rows.some(row=>row.event==='stall-end'),15000);
    const start=mainStall.find(row=>row.event==='stall-start'),end=mainStall.find(row=>row.event==='stall-end');
    const stallEvents=await until(events,rows=>rows.some(row=>row.id===start.id&&row.event==='posted'&&row.type==='state'));
    const selected=stallEvents.filter(row=>row.id===start.id),complete=selected.find(row=>row.event==='body-complete');
    const delivered=await until(()=>page.evaluate(()=>window.__NATIVE_MAIN_EVENTS__),rows=>rows.some(row=>row.id===start.id&&row.event==='received'&&row.type==='state'));
    const delivery=delivered.find(row=>row.id===start.id&&row.event==='received'&&row.type==='state');
    assert.ok(complete.at>=start.at&&complete.at<end.at,'native worker JSON finishes while the main thread is blocked');
    assert.ok(delivery.at-complete.at>1800,'a completed body remains deliverable past the original network deadline');
    assert.ok(selected.some(row=>row.event==='deadline-cleared'));
    assert.ok(!selected.some(row=>row.event==='abort'||row.event==='deadline-fired'));
    report.stall={start,end,delivery,workerEvents:selected,deliveryAfterBodyMs:delivery.at-complete.at};report.checks.completedBodySurvivesMainStall=true;
    console.log('Worker completed a genuine body during the main-thread stall and delivered it afterwards.');

    // Chromium's worker target rejects network emulation; the page network
    // agent applies it to the shared context. Actual worker events below must
    // prove that the delay/throttle reached the genuine worker request.
    browserCDP=await context.newCDPSession(page);
    await browserCDP.send('Network.enable');
    const throttle=values=>browserCDP.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1,...values});
    const restored=async()=>{await throttle({});};
    async function timeoutCase(label,conditions,requireHeaders){
      await throttle(conditions);const from=Date.now();
      const rows=await until(events,rows=>rows.some(row=>row.at>=from&&row.event==='posted'&&row.type==='error'&&row.error?.name==='TimeoutError'),12000);
      const failure=rows.find(row=>row.at>=from&&row.event==='posted'&&row.type==='error'&&row.error?.name==='TimeoutError');
      const request=rows.filter(row=>row.id===failure.id),fetchStart=request.find(row=>row.event==='fetch-start'),fired=request.find(row=>row.event==='deadline-fired');
      assert.ok(fetchStart&&fired&&request.some(row=>row.event==='abort'));
      assert.ok(!request.some(row=>row.event==='body-complete'));
      if(requireHeaders){assert.ok(request.some(row=>row.event==='headers'&&row.status===200));assert.ok(request.some(row=>row.event==='native-body-start'));}
      else assert.ok(!request.some(row=>row.event==='headers'),'the delayed-header request must remain before headers at timeout');
      assert.ok(fired.at-fetchStart.at>=1700&&fired.at-fetchStart.at<3500,'worker network timeout remains bounded');
      report[label]={conditions,workerEvents:request,deadlineElapsedMs:fired.at-fetchStart.at};report.checks[label]=true;
      await restored();
      const recovery=await until(events,rows=>rows.some(row=>row.id>failure.id&&row.event==='posted'&&row.type==='state'),12000);
      const state=recovery.find(row=>row.id>failure.id&&row.event==='posted'&&row.type==='state');
      await page.waitForFunction(expected=>{const state=window.__ESCAPE_PUBLIC_STATE__;return state&&(state.runToken!==expected.runToken||state.tick>=expected.tick)&&document.querySelector('#connection').textContent==='LIVE';},state,{polling:100,timeout:10000});
      report[label].recovery=state;report.checks[label+'Recovery']=true;
      console.log(label+' aborted a genuinely incomplete request and resumed real public state.');
    }
    await timeoutCase('beforeHeadersTimeout',{latency:3000},false);
    await timeoutCase('partialBodyTimeout',{downloadThroughput:2048},true);

    await throttle({latency:3000});
    await page.evaluate(()=>{window.__NATIVE_FLAGS__.replayNext=true;});
    const replayRows=await until(()=>page.evaluate(()=>window.__NATIVE_MAIN_EVENTS__),rows=>rows.some(row=>row.event==='replay-start'),15000);
    const replay=replayRows.find(row=>row.event==='replay-start');
    await until(events,rows=>rows.some(row=>row.id===replay.id&&row.event==='received'&&row.type==='abort'));
    await sleep(2200);
    const replayState=await page.evaluate(()=>({public:{runToken:window.__ESCAPE_PUBLIC_STATE__.runToken,tick:window.__ESCAPE_PUBLIC_STATE__.tick},connection:document.querySelector('#connection').textContent,network:{...window.__ESCAPE_NETWORK_DIAGNOSTICS__},mainEvents:window.__NATIVE_MAIN_EVENTS__}));
    assert.equal(replayState.public.runToken,replay.runToken);assert.equal(replayState.public.tick,replay.tick);assert.equal(replayState.connection,'REPLAY');assert.equal(replayState.network.inFlight,0);
    assert.ok(!replayState.mainEvents.some(row=>row.event==='sent'&&row.type==='poll'&&row.id>replay.id));
    report.replay={request:replay,state:replayState.public,workerEvents:(await events()).filter(row=>row.id===replay.id)};report.checks.replayCancelsAndIgnoresLateDelivery=true;
    await restored();await page.evaluate(()=>window.__ESCAPE_RESUME_LIVE__());
    await page.waitForFunction(first=>{const state=window.__ESCAPE_PUBLIC_STATE__;return state&&(state.runToken!==first.runToken||state.tick>first.tick)&&document.querySelector('#connection').textContent==='LIVE';},replay,{polling:100,timeout:10000});report.checks.resumeLiveAdvances=true;
    report.finalBeforeDispose=await page.evaluate(()=>({network:{...window.__ESCAPE_NETWORK_DIAGNOSTICS__},public:{runToken:window.__ESCAPE_PUBLIC_STATE__.runToken,tick:window.__ESCAPE_PUBLIC_STATE__.tick},mainEvents:window.__NATIVE_MAIN_EVENTS__}));
    assert.equal(report.finalBeforeDispose.network.transport,'worker');assert.equal(report.finalBeforeDispose.network.workerStarts,1);assert.equal(report.finalBeforeDispose.network.reason,null);
    assert.ok(!report.finalBeforeDispose.mainEvents.some(row=>row.event==='window-fetch-state'||row.event==='main-network-timer'));
    report.workerEvents=await events();
    const closed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Worker did not close after pagehide')),10000);worker.once('close',()=>{clearTimeout(timer);resolve();});});
    await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));await closed;
    await sleep(600);
    report.disposal=await page.evaluate(()=>({network:{...window.__ESCAPE_NETWORK_DIAGNOSTICS__},mainEvents:window.__NATIVE_MAIN_EVENTS__}));
    assert.equal(report.disposal.network.disposed,true);assert.equal(report.disposal.network.inFlight,0);
    const terminated=report.disposal.mainEvents.filter(row=>row.event==='worker-terminated');assert.equal(terminated.length,1);
    assert.ok(!report.disposal.mainEvents.some(row=>row.event==='sent'&&row.type==='poll'&&row.at>terminated[0].at));report.checks.pagehideTerminatesWorkerAndPolling=true;
    assert.ok(!report.console.some(row=>row.type==='pageerror'));
  }catch(error){report.error=error.stack;process.exitCode=1;}
  finally{
    if(worker&&!report.workerEvents)report.workerEvents=await worker.evaluate(()=>self.__NATIVE_WORKER_EVENTS__).catch(()=>null);
    if(page&&!report.mainEvents)report.mainEvents=await page.evaluate(()=>window.__NATIVE_MAIN_EVENTS__).catch(()=>null);
    await context?.close().catch(()=>{});await browser?.close().catch(()=>{});
    report.sourceAfter=hashes();report.sourceUnchanged=JSON.stringify(report.sourceBefore)===JSON.stringify(report.sourceAfter);if(!report.sourceUnchanged)process.exitCode=1;
    report.finished=new Date().toISOString();fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({out,checks:report.checks,sourceUnchanged:report.sourceUnchanged,error:report.error}));
  }
})();
