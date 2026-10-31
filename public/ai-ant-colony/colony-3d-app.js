(function(){
  'use strict';
  const C=window.Ant3D,$=id=>document.getElementById(id),canvas=$('colony-scene'),store=new C.FrameStore();
  const media=matchMedia('(prefers-reduced-motion: reduce)');let reduced=media.matches,manualMotion=false;
  let selectedShot='nest';let renderer=null,graphicsError=false,contextLost=false,active=false,epoch=0,timer=0,raf=0,request=null,lastGood=0,networkError=false,sourceStatus={},lastFrame=0;
  const text=(id,value)=>{$(id).textContent=String(value??'').replace(/[\u0000-\u001f]/g,' ').slice(0,180);};
  const title=value=>String(value||'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  function motion(){document.body.dataset.reducedMotion=String(reduced);$('reduce-motion').setAttribute('aria-pressed',String(reduced));$('reduce-motion').textContent=reduced?'Motion reduced':'Reduce motion';}
  motion();media.addEventListener('change',event=>{if(!manualMotion){reduced=event.matches;motion();}});
  $('reduce-motion').addEventListener('click',()=>{manualMotion=true;reduced=!reduced;motion();});
  function fallback(message){graphicsError=true;$('render-fallback').hidden=false;text('fallback-message',message);}
  function bootRenderer(){
    try{renderer?.dispose();renderer=new window.Ant3DRenderer(canvas);graphicsError=false;contextLost=false;$('render-fallback').hidden=true;window.__ANT3D_METRICS__=renderer.metrics;}
    catch{renderer=null;fallback('This device could not start WebGL2. The classic colony view does not require this 3D renderer.');}
  }
  function status(){
    let kind='waiting',message='Connecting to the colony…';const s=store.current,now=performance.now();
    const stale=networkError||!lastGood||now-lastGood>2500||(!sourceStatus.paused&&s&&now-store.acceptedAt>2500);
    if(graphicsError||contextLost){kind='graphics';message='3D unavailable · classic view available';}
    else if(s&&stale){kind='stale';message='Reconnecting · showing last verified state';}
    else if(s&&sourceStatus.simulationFault){kind='recovery';message='Simulation recovery · verified state held';}
    else if(s&&sourceStatus.lastStepAgeMs>2500){kind='recovery';message='Waiting for a new simulation frame';}
    else if(s&&sourceStatus.paused){kind='paused';message='Simulation paused';}
    else if(s&&s.lifecycle!=='active'){kind='result';message=s.lifecycle==='quarantined'?'Restoring verified state':s.lifecycle==='intermission'?'Next colony preparing':'Colony cycle complete';}
    else if(s){kind='live';message='Autonomous colony · live';}
    document.body.dataset.connection=kind;text('connection',message);
    return{paused:stale||Boolean(sourceStatus.paused)||Boolean(sourceStatus.simulationFault)||sourceStatus.lastStepAgeMs>2500||s?.lifecycle!=='active',reducedMotion:reduced};
  }
  function hud(s){
    text('population',s.goal.population.toLocaleString());text('target',`/ ${s.goal.targetPopulation.toLocaleString()} target`);
    const pct=Math.round(s.goal.progress*100);$('progress-fill').style.width=`${pct}%`;$('progress-fill').parentElement.setAttribute('aria-valuenow',String(pct));
    text('queen',`Queen ${Math.round(s.queen.health/s.queen.maxHealth*100)}%`);text('food',`Food ${s.colony.foodStore.toLocaleString()}`);text('brood',`Brood ${s.colony.brood}`);
    text('danger',s.colony.threat>=60?'Queen under threat':`Threat ${Math.round(s.colony.threat)} / 100`);$('danger').dataset.alert=String(s.colony.threat>=60);
    text('environment',`Day ${s.environment.day} · ${title(s.environment.season)} · ${title(s.environment.weather)}`);
    text('strategy',s.lifecycle==='active'?s.colony.strategyReason:s.headline);
    text('caption',Array.isArray(s.captions)?s.captions.at(-1)||s.headline:s.headline);
    window.__ANT3D_STATE__=s;
  }
  async function poll(){
    if(!active||request)return;const mine=epoch,controller=new AbortController();request=controller;const timeout=setTimeout(()=>controller.abort(),2000);
    try{
      const response=await fetch('/ant/state',{cache:'no-store',signal:controller.signal});if(!response.ok)throw new Error('state-unavailable');
      const raw=await response.text();if(raw.length>1500000)throw new Error('oversized-state');const payload=JSON.parse(raw);
      if(!active||mine!==epoch)return;const result=store.accept(payload.snapshot,performance.now());if(!['accepted','duplicate'].includes(result))throw new Error('unverified-state');
      lastGood=performance.now();networkError=false;sourceStatus=payload.status||{};if(result==='accepted')hud(store.current);status();
    }catch{if(active&&mine===epoch){networkError=true;status();}}
    finally{clearTimeout(timeout);if(request===controller)request=null;if(active&&mine===epoch)timer=setTimeout(poll,150);}
  }
  function draw(now){
    if(!active)return;raf=requestAnimationFrame(draw);if(now-lastFrame<30)return;lastFrame=now;
    const options=status();if(!store.current||!renderer||contextLost)return;
    try{renderer.render(store.current,store.entities(now,reduced||options.paused),options.paused?store.acceptedAt:now,options);}
    catch{cancelAnimationFrame(raf);raf=0;fallback('The 3D view stopped drawing. Open the classic view or retry; the simulation has not been changed.');status();}
  }
  function start(){if(active)return;active=true;epoch++;if(request?.signal.aborted)request=null;poll();raf=requestAnimationFrame(draw);}
  function stop(){active=false;epoch++;clearTimeout(timer);cancelAnimationFrame(raf);raf=0;request?.abort();request=null;}
  window.addEventListener('pagehide',stop);window.addEventListener('pageshow',()=>{if(!document.hidden)start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start();});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;fallback('The graphics context was interrupted. Waiting for the browser to restore it; the classic view remains available.');status();});
  canvas.addEventListener('webglcontextrestored',()=>{bootRenderer();if(renderer&&store.current)renderer.setShot(selectedShot,store.current);if(active&&!raf)raf=requestAnimationFrame(draw);status();});
  $('retry-view').addEventListener('click',()=>location.reload());
  const labels={nest:'INSIDE THE NEST',forest:'FOREST FLOOR',world:'THE WHOLE COLONY',threat:'PERIMETER WATCH'};
  for(const button of document.querySelectorAll('[data-shot]'))button.addEventListener('click',()=>{if(!renderer||!store.current)return;selectedShot=button.dataset.shot;renderer.setShot(selectedShot,store.current);for(const other of document.querySelectorAll('[data-shot]'))other.setAttribute('aria-pressed',String(other===button));text('shot-label',labels[button.dataset.shot]);});
  const points=new Map();let pinch=0;
  canvas.addEventListener('pointerdown',e=>{points.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{const old=points.get(e.pointerId);if(!old||!renderer)return;points.set(e.pointerId,[e.clientX,e.clientY]);const c=renderer.camera;
    if(points.size===2){const[a,b]=[...points.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)c.distance=C.clamp(c.distance*pinch/Math.max(1,d),5,160);pinch=d;}
    else{c.yaw-=(e.clientX-old[0])*.006;c.pitch=C.clamp(c.pitch+(e.clientY-old[1])*.004,.20,1.45);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{points.delete(e.pointerId);pinch=0;});
  canvas.addEventListener('wheel',e=>{if(renderer){e.preventDefault();renderer.camera.distance=C.clamp(renderer.camera.distance*Math.exp(C.clamp(e.deltaY,-100,100)*.002),5,160);}},{passive:false});
  canvas.addEventListener('keydown',e=>{if(!renderer)return;const c=renderer.camera;let handled=true;if(e.key==='ArrowLeft')c.yaw-=.12;else if(e.key==='ArrowRight')c.yaw+=.12;else if(e.key==='ArrowUp')c.pitch=C.clamp(c.pitch+.1,.2,1.45);else if(e.key==='ArrowDown')c.pitch=C.clamp(c.pitch-.1,.2,1.45);else if(e.key==='+'||e.key==='=')c.distance=C.clamp(c.distance*.9,5,160);else if(e.key==='-')c.distance=C.clamp(c.distance*1.1,5,160);else if(e.key==='Home'&&store.current)renderer.setShot(c.mode,store.current);else handled=false;if(handled)e.preventDefault();});
  $('fullscreen').hidden=!document.fullscreenEnabled;$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('observatory').requestFullscreen();}catch{text('caption','Fullscreen is unavailable in this browser.');}});
  bootRenderer();start();
})();
