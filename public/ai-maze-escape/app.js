import { computePublicView, drawMinimap, publicObjective, publicHeldGateStatus } from './map-view.mjs';
import { createMazeAudio } from './audio.js';

const MAX_TRAIL=240;
const POLL_DELAY_MS=180;
const POLL_TIMEOUT_MS=6000;
let canvas=document.getElementById('maze');
const byId=id=>document.getElementById(id);
const elements={broadcast:byId('broadcast'),hud:byId('hud'),tick:byId('tick'),steps:byId('steps'),time:byId('time'),keys:byId('keys'),progress:byId('progress'),progressFill:byId('progress-fill'),intentMode:byId('intent-mode'),intentCopy:byId('intent-copy'),confidence:byId('confidence-fill'),inventory:byId('inventory'),caption:byId('caption'),profile:byId('profile'),integrity:byId('integrity'),sceneCard:byId('scene-card'),sceneTitle:byId('scene-title'),sceneMessage:byId('scene-message'),minimap:byId('minimap')};
const query=new URLSearchParams(location.search);
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const settings={quality:query.get('quality')==='high'?'high':'auto',reducedMotion:query.get('reducedMotion')==='1'||motionPreference.matches,highContrast:query.get('highContrast')==='1',muted:true,cleanFeed:query.get('cleanFeed')==='1'};
const audio=createMazeAudio();
let frame=null, scene=null, fallbackCanvas=null, pollTimer=0, recoveryTimer=0, requestController=null, stopped=false, raf=0, rendererState='loading',cameraMode=query.get('camera')==='overview'?'overview':query.get('camera')==='detail'?'detail':'follow', lastCaption='', lastRunToken='', failedPolls=0, initialising=false;

function press(id,value,label){const button=byId(id);if(!button)return;button.setAttribute('aria-pressed',String(value));if(label){button.setAttribute('aria-label',label);button.title=label}}
function applySettings(){
  document.body.dataset.reducedMotion=String(settings.reducedMotion);
  document.body.dataset.highContrast=String(settings.highContrast);
  elements.broadcast.classList.toggle('clean-feed',settings.cleanFeed);
  press('motion-toggle',settings.reducedMotion,settings.reducedMotion?'Restore full motion':'Reduce motion');
  press('contrast-toggle',settings.highContrast,settings.highContrast?'Use standard contrast':'Enable high contrast');
  press('feed-toggle',settings.cleanFeed,settings.cleanFeed?'Show adventure information':'Enable clean feed');
  press('sound-toggle',!settings.muted,settings.muted?'Enable sound':'Mute sound');
  scene?.setSettings(settings);scene?.resize();
  if(frame?.snapshot){drawMinimap(elements.minimap,frame.snapshot,settings.highContrast);drawFallback()}
}
function showCard(title,message){elements.sceneCard.hidden=false;elements.sceneTitle.textContent=title;elements.sceneMessage.textContent=message}
function refreshSceneCard(){
  if(failedPolls)byId('run-phase').textContent='RECONNECTING';
  const graphicsUnavailable=rendererState==='fallback'||rendererState==='recovering';
  byId('graphics-status').hidden=!graphicsUnavailable;
  byId('graphics-message').textContent=rendererState==='recovering'?'Restoring 3D · the live map continues':'Live map · 3D is unavailable';
  const snapshot=frame?.snapshot;
  if(frame?.scene==='result'){
    const outcome=snapshot?.result?.reason;
    showCard(outcome==='escape'?'ESCAPED':outcome==='capture'?'CAUGHT':outcome==='timer-expired'?'TIME UP':'RUN OVER',outcome==='escape'?'Pip made it out.':'Next maze loading');return
  }
  if(frame?.scene==='intermission'){showCard('NEXT MAZE','New run loading');return}
  if(failedPolls){showCard('RECONNECTING','Last known scene retained');return}
  if(rendererState==='loading'&&!fallbackCanvas){showCard('LOADING','Starting 3D maze');return}
  if(!snapshot){showCard('CONNECTING','Waiting for live game');return}
  if(frame.scene==='recovery'){showCard('RESTORING','Reconnecting to live game');return}
  elements.sceneCard.hidden=true;
}
function formatTime(ticks,interval=360){
  const remaining=Number.isFinite(ticks)?Math.max(0,ticks):0;
  const step=Number.isFinite(interval)&&interval>0?interval:360;
  const seconds=Math.ceil(remaining*step/1000);
  const part=(n)=>String(n).padStart(2,'0');
  return seconds>=3600
    ? `${Math.floor(seconds/3600)}:${part(Math.floor(seconds%3600/60))}:${part(seconds%60)}`
    : `${Math.floor(seconds/60)}:${part(seconds%60)}`;
}
const intentLabels={'exploring':'Exploring','returning-key':'Find key','unlocking-route':'At gate','searching-exit':'To exit','evading-threat':'Evading','revising-map':'Rerouting','fallback':'Exploring','escaped':'Escaped'};
const goals={'exploring':'Find a passage','returning-key':'Find key','unlocking-route':'Gate ahead','searching-exit':'Find the exit','evading-threat':'Avoid warden','revising-map':'New route','fallback':'Explore','escaped':'Escaped'};
function viewerCaption(value){
  if(/^Key collected:/i.test(value))return 'Pip found a key.';
  if(/^Route unlocked:/i.test(value))return 'A locked passage opened.';
  if(/^Run ended: capture/i.test(value))return 'A warden caught the explorer.';
  if(/^Run ended: trap-death/i.test(value))return 'The explorer was caught by a trap.';
  if(/^Run ended: timer-expired/i.test(value))return 'Time ran out. A new garden awaits.';
  return value;
}
function update(value){
  if(!value?.snapshot)return;
  frame=value;
  const snapshot=value.snapshot;
  window.__MAZE_PUBLIC_STATE__=snapshot;
  window.__MAZE_VIEW__=computePublicView(snapshot,value.camera,cameraMode==='overview');
  elements.tick.textContent=String(snapshot.tick);
  elements.steps.textContent=String(snapshot.steps??Math.max(0,snapshot.travelledRoute.length-1));
  elements.time.textContent=formatTime(snapshot.timeRemaining,value.stepDurationMs);
  elements.keys.textContent=String(snapshot.inventory.length);
  const discovered=Math.min(100,snapshot.discoveredCells.length*100/(snapshot.width*snapshot.height));
  elements.progress.textContent=`${Math.floor(discovered)}%`;
  elements.progressFill.style.width=`${discovered}%`;
  elements.intentMode.textContent=intentLabels[snapshot.intent.mode]||snapshot.intent.mode.replaceAll('-',' ');
  elements.intentCopy.textContent=snapshot.intent.explanation;
  const ended=value.scene==='result'||value.scene==='intermission';
  const escaped=snapshot.result?.reason==='escape';
  byId('run-phase').textContent=ended?(escaped?'JOURNEY COMPLETE':'ATTEMPT ENDED'):value.scene==='danger'?'WARDEN NEARBY':'LIVE EXPLORATION';
  const landmark=publicObjective(snapshot);
  // Plain-language HUD truth for an already OBSERVED matching-key gate.
  // An active danger or reachable public landmark always outranks this cue.
  const keyedSealedGate=!ended && !landmark && value.scene!=='danger'
    && snapshot.intent.mode!=='evading-threat' && publicHeldGateStatus(snapshot);
  byId('goal-label').textContent=ended?'Journey result':landmark?'Discovered landmark':keyedSealedGate?'Known sealed gate':'Current goal';
  byId('goal-title').textContent=ended?(escaped?'Escaped':'Run ended'):landmark?(landmark.kind==='key'?'Key spotted':'Exit spotted'):keyedSealedGate?'Key for gate':goals[snapshot.intent.mode]||'Find the exit';
  byId('intent-label').textContent=ended?'Result':'Pip';
  byId('objective').textContent=ended?(escaped?'Exit reached':'Next run soon'):landmark?(landmark.steps===0?'At the landmark':`${landmark.steps} known step${landmark.steps===1?'':'s'} away`):keyedSealedGate?'Gate still closed':'Explore';
  elements.confidence.style.width=`${Math.round(snapshot.intent.confidence*100)}%`;
  elements.inventory.textContent=String(snapshot.inventory.length);
  elements.inventory.setAttribute('aria-label',`${snapshot.inventory.length} ${snapshot.inventory.length===1?'key':'keys'} collected`);
  elements.profile.textContent=`${snapshot.profile} · Expedition ${snapshot.level}`;
  elements.integrity.textContent=snapshot.authorityChecksum?'Live view connected':'Connecting';
  if(lastRunToken!==snapshot.runToken){lastRunToken=snapshot.runToken;lastCaption='New maze'}
  const captions=value.audio?.captions??[];
  if(captions.length)lastCaption=viewerCaption(captions.at(-1));
  elements.caption.textContent=lastCaption;
  elements.broadcast.dataset.scene=value.scene;
  try{scene?.update(value)}catch(error){stopGraphics(error)}
  audio.update(value);
  drawMinimap(elements.minimap,snapshot,settings.highContrast);drawFallback();refreshSceneCard();
}
function drawFallback(){if(!fallbackCanvas||!frame?.snapshot)return;drawMinimap(fallbackCanvas,frame.snapshot,settings.highContrast)}
function fallback(recovering=false){
  rendererState=recovering?'recovering':'fallback';canvas.dataset.renderer=rendererState;
  if(!fallbackCanvas){
    fallbackCanvas=document.createElement('canvas');fallbackCanvas.id='maze-fallback';fallbackCanvas.setAttribute('aria-label','Live discovered maze in map view');
    Object.assign(fallbackCanvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',background:'#1c3933'});
    canvas.after(fallbackCanvas);
  }
  drawFallback();refreshSceneCard();
}
function stopGraphics(error){
  console.warn('The 3D view stopped; using the live map.',error.name);
  clearTimeout(recoveryTimer);scene?.dispose();scene=null;fallback();
}
function graphicsStatus(status){
  if(stopped)return;
  clearTimeout(recoveryTimer);
  if(status==='recovering'){
    fallback(true);
    recoveryTimer=setTimeout(()=>{if(rendererState==='recovering')fallback()},4000);
  }else{
    rendererState='ready';fallbackCanvas?.remove();fallbackCanvas=null;refreshSceneCard();
  }
}
async function initScene(){
  if(initialising||stopped)return;initialising=true;
  try{
    const {createMazeScene}=await import('./scene.js');
    if(stopped)return;
    scene=createMazeScene(canvas,settings,graphicsStatus);
    scene.setCameraMode(cameraMode);if(frame)scene.update(frame);
    rendererState='ready';fallbackCanvas?.remove();fallbackCanvas=null;refreshSceneCard();
  }catch(error){console.warn('The 3D view could not start; using the live map.',error.name);scene?.dispose();scene=null;fallback()}
  finally{initialising=false}
}
async function poll(){
  if(stopped)return;
  requestController=new AbortController();
  const timeout=setTimeout(()=>requestController?.abort(),POLL_TIMEOUT_MS);
  try{
    const response=await fetch(`/maze/state?w=${innerWidth}&h=${innerHeight}&reducedMotion=${settings.reducedMotion?1:0}&cleanFeed=${settings.cleanFeed?1:0}`,{cache:'no-store',signal:requestController.signal});
    if(!response.ok)throw new Error('Source unavailable');
    const value=await response.json();clearTimeout(timeout);failedPolls=0;update(value);
  }catch(error){if(!stopped){console.warn('Maze public view update failed:',error.name,error.message);failedPolls++;elements.integrity.textContent='Reconnecting';refreshSceneCard()}}
  finally{clearTimeout(timeout);requestController=null;if(!stopped)pollTimer=setTimeout(poll,POLL_DELAY_MS)}
}
function animate(now){if(stopped)return;try{scene?.render(now)}catch(error){stopGraphics(error)}raf=requestAnimationFrame(animate)}
function setCamera(mode){cameraMode=mode;scene?.setCameraMode(mode);press('camera-toggle',mode!=='follow',mode==='follow'?'Switch to overview camera':mode==='overview'?'Switch to detail camera':'Follow the explorer');const label=byId('camera-toggle')?.querySelector('.button-label');if(label)label.textContent=mode==='follow'?'Follow':mode==='overview'?'Overview':'Detail';if(frame)window.__MAZE_VIEW__=computePublicView(frame.snapshot,frame.camera,mode==='overview')}
byId('camera-toggle')?.addEventListener('click',()=>setCamera(cameraMode==='follow'?'overview':cameraMode==='overview'?'detail':'follow'));
byId('sound-toggle')?.addEventListener('click',async event=>{const button=event.currentTarget;if(button.disabled)return;button.disabled=true;try{const enable=settings.muted;await audio.setEnabled(enable);settings.muted=!enable;applySettings()}catch{settings.muted=true;elements.caption.textContent='Sound could not start. The adventure is still fully captioned.';applySettings()}finally{button.disabled=false}});
byId('motion-toggle')?.addEventListener('click',()=>{settings.reducedMotion=!settings.reducedMotion;applySettings()});
byId('contrast-toggle')?.addEventListener('click',()=>{settings.highContrast=!settings.highContrast;applySettings()});
byId('feed-toggle')?.addEventListener('click',()=>{settings.cleanFeed=!settings.cleanFeed;applySettings()});
byId('map-panel')?.addEventListener('toggle',event=>{if(event.currentTarget.open)requestAnimationFrame(()=>{if(!stopped&&frame)drawMinimap(elements.minimap,frame.snapshot,settings.highContrast)})});
byId('retry-3d').addEventListener('click',()=>{
  if(initialising||stopped)return;
  clearTimeout(recoveryTimer);scene?.dispose();scene=null;
  const replacement=canvas.cloneNode(false);replacement.removeAttribute('data-renderer');
  canvas.replaceWith(replacement);canvas=replacement;rendererState='loading';refreshSceneCard();initScene();
});
byId('fullscreen-toggle')?.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await elements.broadcast.requestFullscreen()}catch{elements.caption.textContent='Fullscreen is unavailable in this viewer. The adventure continues here.'}});
addEventListener('fullscreenchange',()=>press('fullscreen-toggle',!!document.fullscreenElement,document.fullscreenElement?'Exit fullscreen':'Enter fullscreen'));
addEventListener('resize',()=>{scene?.resize();if(frame){drawMinimap(elements.minimap,frame.snapshot,settings.highContrast);drawFallback()}},{passive:true});
addEventListener('keydown',event=>{if(event.key!=='Escape')return;const panel=document.activeElement?.closest('details[open]')||['settings-panel','map-panel','intent-details'].map(byId).find(element=>element?.open);if(panel){panel.open=false;panel.querySelector('summary')?.focus()}});
addEventListener('pagehide',()=>{stopped=true;clearTimeout(pollTimer);clearTimeout(recoveryTimer);requestController?.abort();cancelAnimationFrame(raf);scene?.dispose();audio.dispose()},{once:true});
// A page restored from the back-forward cache needs a fresh graphics/audio host.
addEventListener('pageshow',event=>{if(event.persisted)location.reload()});
applySettings();setCamera(cameraMode);refreshSceneCard();initScene();poll();raf=requestAnimationFrame(animate);
