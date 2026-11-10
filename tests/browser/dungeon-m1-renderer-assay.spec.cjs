'use strict';
/**
 * Stage A causal profiling evidence only. Displays a naturally reached, immutable
 * real Warden HP-loss snapshot in the ORIGINAL Three.js renderer, compares actual
 * delivered frames with original MediaRecorder OFF/ON/OFF in one Chromium process.
 * This is neither a scripted battle nor a five-stage experiential acceptance test.
 */
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const cp=require('node:child_process');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const VIEW=process.env.DUNGEON_M1_VIEWPORT==='mobile'?'mobile':'desktop';
const SIZE=VIEW==='mobile'?{width:390,height:844}:{width:1440,height:832};
const SEED='gauntlet-corpus-v1-0';
function realWarden(){
 const game=DungeonRuntime.create(SEED);let previous=game.publicState();
 for(let tick=1;tick<=2600;tick++){
  const state=game.step(),boss=state.units.find(u=>u.kind==='warden'),
   before=previous.units.find(u=>u.kind==='warden');
  if(boss&&before&&boss.hp<before.hp&&state.units.some(u=>u.faction==='party'&&u.hp>0))
   return {state,tick};
  previous=state;
 }
 throw Error('No real source living-Warden HP-loss checkpoint in seed');
}
const percentile=(samples,p)=>samples.length?
 [...samples].sort((a,b)=>a-b)[Math.ceil(samples.length*p)-1]:null;
function describe(block){
 const raf=block.samples.map(s=>s.rafMs),draw=block.samples.map(s=>s.renderMs);
 return {...block,rafP50Ms:percentile(raf,.5),rafP95Ms:percentile(raf,.95),
  rafP99Ms:percentile(raf,.99),directP50Ms:percentile(draw,.5),
  directP95Ms:percentile(draw,.95),directP99Ms:percentile(draw,.99)};
}
// Native Chrome events are diagnostic inclusive slices, NOT a GPU time proxy.
// Sample the real held Warden across all three recorder OFF/ON/OFF segments.
async function startNativeWardenTrace(page){
 const report={status:'UNAVAILABLE',eventCount:0,method:'CDP Tracing + JS CPU profiler; overlapping slice durations are not wall-clock time'};
 const names=new Map(),totals=new Map(),long=[];let c=null,started=false,profiler=false,done;
 const completed=new Promise(resolve=>done=resolve);
 try{
  c=await page.context().newCDPSession(page);
  c.on('Tracing.dataCollected',({value=[]})=>{
   for(const e of value){
    report.eventCount++;
    const tid=e.pid+':'+e.tid;
    if(e.ph==='M'&&e.name==='thread_name'&&e.args?.name)names.set(tid,String(e.args.name).slice(0,80));
    if(e.ph!=='X'||!Number.isFinite(e.dur)||e.dur<1000)continue;
    const ms=e.dur/1000,name=String(e.name).slice(0,100),key=tid+'|'+name;
    const x=totals.get(key)||{tid,name,count:0,inclusiveMs:0,maxMs:0};
    x.count++;x.inclusiveMs+=ms;x.maxMs=Math.max(x.maxMs,ms);totals.set(key,x);
    if(ms>=100&&long.length<160)long.push({tid,name,ms:Math.round(ms),timestampUs:e.ts});
   }
  });
  c.once('Tracing.tracingComplete',()=>done(true));
  await c.send('Profiler.enable');await c.send('Profiler.start');profiler=true;
  await c.send('Tracing.start',{
   categories:'toplevel,devtools.timeline,disabled-by-default-devtools.timeline.frame,blink,cc,gpu,viz,renderer.scheduler,blink.user_timing',
   transferMode:'ReportEvents',options:'record-as-much-as-possible'
  });
  report.status='RUNNING';started=true;
 }catch(e){report.error=String(e).slice(0,400)}
 return async()=>{
  if(profiler)try{
   const {profile}=await c.send('Profiler.stop'),nodes=new Map((profile?.nodes||[]).map(n=>[n.id,n]));
   const counts=new Map();for(const id of profile?.samples||[])counts.set(id,(counts.get(id)||0)+1);
   report.jsCpuSamples=(profile?.samples||[]).length;
   report.jsHotspots=[...counts].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([id,samples])=>({
    name:nodes.get(id)?.callFrame?.functionName||'(unknown)',
    url:String(nodes.get(id)?.callFrame?.url||'').slice(0,150),
    line:nodes.get(id)?.callFrame?.lineNumber??null,samples
   }));
  }catch(e){report.cpuError=String(e).slice(0,400)}
  if(started)try{
   await c.send('Tracing.end');
   report.status=await Promise.race([completed,new Promise(resolve=>setTimeout(()=>resolve(false),25000))])?'RECORDED':'PARTIAL';
  }catch(e){report.status='PARTIAL';report.stopError=String(e).slice(0,400)}
  try{await c?.detach()}catch{}
  report.threads=[...names].map(([id,name])=>({id,name})).slice(0,80);
  report.topSlices=[...totals.values()].sort((a,b)=>b.inclusiveMs-a.inclusiveMs).slice(0,40)
   .map(x=>({...x,thread:names.get(x.tid)||'',inclusiveMs:Math.round(x.inclusiveMs),maxMs:Math.round(x.maxMs)}));
  report.longSlices=long.sort((a,b)=>b.ms-a.ms).slice(0,40)
   .map(x=>({...x,thread:names.get(x.tid)||''}));
  return report;
 };
}

test('Original living Warden: one-runner unrecorded/recorded/unrecorded '+VIEW,async({page})=>{
 test.setTimeout(15*60*1000);fs.mkdirSync('artifacts',{recursive:true});
 const {state,tick}=realWarden(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 await page.route('**/dungeon/state',route=>route.fulfill({json:state}));
 await page.setViewportSize(SIZE);await page.goto('/dungeon');
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.renderedState?.checksum??null
 ),{timeout:120000,intervals:[350,900,1300]}).toBe(state.checksum);
 await expect.poll(()=>page.evaluate(()=>
  window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame??0
 ),{timeout:120000}).toBeGreaterThan(8);
 await page.locator('#audio-toggle').click();
 const audioEnabled=(await page.locator('#audio-toggle').getAttribute('aria-pressed'))==='true';
 const stopNativeTrace=await startNativeWardenTrace(page);
 const observed=await page.evaluate(async()=>{
  const canvas=document.getElementById('world');
  const mime=['video/webm;codecs=vp8,opus','video/webm'].find(t=>window.MediaRecorder?.isTypeSupported(t));
  async function measure(record){
   let video=null,stream=null,recorder=null,stopPump=null,mode='off',
    error=null,bytes=0,chunks=0,audioTracks=0;
   if(record){
    try{
     video=canvas.captureStream(0);
     let track=video.getVideoTracks()[0];
     if(!track)throw Error('No actual WebGL video track');
     if(typeof track.requestFrame!=='function'){
      video.getTracks().forEach(t=>t.stop());
      video=canvas.captureStream(24);
      mode='timed-fallback';
     }else{
      mode='render-driven';
      let frame=null,handle=null,active=true;
      const pump=()=>{
       if(!active)return;
       const current=window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame;
       if(Number.isSafeInteger(current)&&current>=0&&current!==frame){
        track.requestFrame();frame=current;
       }
       handle=requestAnimationFrame(pump);
      };
      handle=requestAnimationFrame(pump);
      stopPump=()=>{active=false;if(handle!==null)cancelAnimationFrame(handle)};
     }
     const sound=window.__DUNGEON_CAPTURE_SOUND__?.();
     stream=new MediaStream([...video.getVideoTracks(),...(sound?.getAudioTracks()||[])]);
     audioTracks=stream.getAudioTracks().length;
     recorder=new MediaRecorder(stream,{mimeType:mime,
      videoBitsPerSecond:canvas.clientWidth>590?2400000:1100000,
      audioBitsPerSecond:112000});
     recorder.ondataavailable=e=>{if(e.data?.size){bytes+=e.data.size;chunks++}};
     recorder.start(1600);
    }catch(e){error=String(e);mode='unavailable'}
   }
   const start=performance.now(),samples=[];
   let previousTime=null,previousFrame=null;
   await new Promise(resolve=>{
    let done=false;
    const end=()=>{if(done)return;done=true;clearTimeout(timer);resolve()};
    const timer=setTimeout(end,125000);
    const observe=ts=>{
     if(done)return;
     const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
     if(d?.webgl&&Number.isSafeInteger(d.frame)&&d.frame!==previousFrame){
      if(previousTime!==null&&ts>previousTime){
       samples.push({frame:d.frame,rafMs:Math.round((ts-previousTime)*10)/10,
        renderMs:Number(d.directRenderMs)||0,
        drawCalls:d.drawCalls,physicalPixels:d.directRenderBudget?.renderPixels??null});
      }
      previousTime=ts;previousFrame=d.frame;
     }
     if(samples.length>=20||performance.now()-start>=120000)end();
     else requestAnimationFrame(observe);
    };
    requestAnimationFrame(observe);
   });
   stopPump?.();
   if(recorder&&recorder.state!=='inactive'){
    await new Promise(resolve=>{
     const timer=setTimeout(resolve,12000);
     recorder.onstop=()=>{clearTimeout(timer);resolve()};
     try{recorder.stop()}catch(e){clearTimeout(timer);error=String(e);resolve()}
    });
   }
   stream?.getTracks().forEach(t=>t.stop());
   video?.getTracks().forEach(t=>t.stop());
   const d=window.__DUNGEON_RENDER_DIAGNOSTICS__;
   return {record,mode,bytes,chunks,audioTracks,error,samples,
    elapsedMs:Math.round(performance.now()-start),
    sourceChecksum:d?.renderedState?.checksum??null,
    softwareWebGL:d?.softwareWebGL,webglRenderer:d?.webglRendererName,
    postFX:d?.postFX,surfaceResizes:d?.surfaceResizes,
    renderPipeline:d?.renderPipeline??null};
  }
  const blocks=[];
  for(const record of [false,true,false])blocks.push(await measure(record));
  return {mime,blocks,canvas:{width:canvas.clientWidth,height:canvas.clientHeight}};
 });
 const nativeChromiumTrace=await stopNativeTrace();
 const receipt={
  schemaVersion:1,verdict:'INSTRUMENTED_HOLD_NOT_FULL_ADVENTURE',
  sourceSha:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  immutableBaseline:'281735d0910c6b2443648af976003d50412ee324',
  viewport:VIEW,seed:SEED,size:SIZE,realWarden:{tick,checksum:state.checksum,run:state.run,floor:state.floor},
  method:'Actual original living-Warden public snapshot held constant; single Chrome SwiftShader renderer, OFF/ON/OFF original MediaRecorder; excludes disk streaming',
  nativeChromiumTrace,
  requestedEncoderMime:observed.mime,audioOptedIn:audioEnabled,canvas:observed.canvas,
  blocks:observed.blocks.map(describe),pageErrors:errors,
  fiveStageMotionComparison:false,lockedBaselineAB:false,independentBlindCritics:0,
  looks:'UNVERIFIED',feels:'UNVERIFIED',plays:'UNVERIFIED'
 };
 const path='artifacts/dungeon-m1-renderer-assay-'+VIEW;
 fs.writeFileSync(path+'.json',JSON.stringify(receipt,null,2));
 await page.locator('#world').screenshot({path:path+'-actual-warden.png',timeout:90000});
 expect(errors).toEqual([]);
 expect(audioEnabled).toBe(true);
 expect(observed.blocks.map(b=>b.samples.length).every(n=>n>=8)).toBe(true);
 expect(observed.blocks.every(b=>b.sourceChecksum===state.checksum)).toBe(true);
 expect(observed.blocks[1].mode).not.toBe('unavailable');
 expect(observed.blocks[1].bytes).toBeGreaterThan(2048);
});
