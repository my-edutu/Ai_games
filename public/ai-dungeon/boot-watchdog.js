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
 const timer=setInterval(()=>{
  ticks++;
  if(window.__DUNGEON_RENDER_DIAGNOSTICS__?.frame>3&&window.__DUNGEON_PUBLIC_STATE__?.tick>0){
   clearInterval(timer);document.body.dataset.rendererStatus='ready';return;
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
