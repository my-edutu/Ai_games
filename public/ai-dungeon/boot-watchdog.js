'use strict';
/**
 * A non-module startup guard: even if an ES module import fails, the spectator
 * cannot mistake an empty stage for a working autonomous 3D dungeon.
 * A failing stream produces a visible recovery panel and an actionable log.
 */
(function(){
 const MAX_WAIT_MS=13000,STEP_MS=500;
 let ticks=0;
 const message=document.getElementById('recovery');
 const errors=[];
 window.addEventListener('error',event=>{if(event.message)errors.push(String(event.message).slice(0,180))});
 window.addEventListener('unhandledrejection',event=>{errors.push(String(event.reason?.message||event.reason||'Unknown module failure').slice(0,180))});

 // Startup success is not a lifetime guarantee for an unattended broadcast.
 // Detect frozen frames, stale simulation snapshots and WebGL context loss.
 let lastFrame=0,lastTick=-1,lastFrameAt=Date.now(),lastTickAt=Date.now(),contextLost=false,restoredFrameBaseline=null;
 const canvas=document.getElementById('world');
 const degraded=(status,heading)=>{
  document.body.dataset.rendererStatus=status;
  if(!message)return;
  message.hidden=false;
  message.textContent=heading+' — the autonomous simulation may still be running.';
 };
 canvas?.addEventListener('webglcontextlost',event=>{
  // WebGL will not permit restoration unless this cancelable event is handled.
  event.preventDefault();contextLost=true;restoredFrameBaseline=null;
  degraded('context-lost','3D graphics context lost; waiting for recovery');
 });
 canvas?.addEventListener('webglcontextrestored',()=>{
  contextLost=false;
  // Old diagnostics remain visible while Three.js reconstructs its context.
  // Never call the spectator ready until its frame counter changes again.
  restoredFrameBaseline=window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame||0;
  lastFrameAt=lastTickAt=Date.now();
  document.body.dataset.rendererStatus='recovering';
  if(message){message.hidden=false;message.textContent='3D graphics restored — verifying a fresh rendered frame.';}
 });
 setInterval(()=>{
  const now=Date.now();
  if(document.hidden){lastFrameAt=lastTickAt=now;return}
  const frame=window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame||0;
  const tick=window.__DUNGEON_PUBLIC_STATE__?.tick;
  if(frame>0&&frame!==lastFrame){lastFrame=frame;lastFrameAt=now}
  if(Number.isFinite(tick)&&tick!==lastTick){lastTick=tick;lastTickAt=now}
  if(contextLost)return;
  if(restoredFrameBaseline!==null){
   if(frame>0&&frame!==restoredFrameBaseline&&Number.isFinite(tick)){
    restoredFrameBaseline=null;lastFrame=frame;lastFrameAt=lastTickAt=now;
    document.body.dataset.rendererStatus='ready';if(message)message.hidden=true;
   }
   return;
  }
  if(document.body.dataset.rendererStatus==='failed')return;
  if(frame>3&&Number.isFinite(tick)&&(now-lastFrameAt>25000||now-lastTickAt>25000)){
   degraded('stalled',now-lastFrameAt>25000?'3D renderer stalled':'Autonomous stream stalled');
  }else if(document.body.dataset.rendererStatus==='stalled'&&now-lastFrameAt<3000&&now-lastTickAt<3000){
   document.body.dataset.rendererStatus='ready';if(message)message.hidden=true;
  }
 },1000);
 const timer=setInterval(()=>{
  ticks++;
  if(contextLost){ticks=0;return}
  if(restoredFrameBaseline===null&&window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame>3&&window.__DUNGEON_PUBLIC_STATE__?.tick>0){
   clearInterval(timer);document.body.dataset.rendererStatus='ready';if(message)message.hidden=true;return;
  }
  if(ticks*STEP_MS<MAX_WAIT_MS)return;
  clearInterval(timer);document.body.dataset.rendererStatus='failed';
  if(!message)return;
  message.hidden=false;
  message.textContent='';
  const heading=document.createElement('strong');heading.textContent='THE 3D EXPEDITION IS NOT READY';
  const desc=document.createElement('span');desc.className='watchdog-detail';desc.textContent='The browser could not start the dungeon renderer. The autonomous stream may still be running.';
  const detail=document.createElement('small');detail.className='watchdog-detail';
  detail.textContent=errors.slice(0,2).join(' / ')||'Verify local module routes, WebGL and the /dungeon/health endpoint.';
  const retry=document.createElement('button');retry.type='button';retry.textContent='TRY AGAIN';retry.className='icon-button';
  retry.addEventListener('click',()=>location.reload());
  message.append(heading,desc,detail,retry);
  console.error('[DUNGEON] startup watchdog — missing healthy render frame after '+MAX_WAIT_MS+'ms; observed errors:',errors);
 },STEP_MS);
})();
