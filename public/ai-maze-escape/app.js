import { computePublicView, drawMinimap, publicObjective, publicHeldGateStatus, publicKeyCollectionMoment, publicImmediatePressureCue, publicPressureWithdrawalCue, publicVisibleDiagonalPressureCue, publicDistinctPublicPredecessor } from './map-view.mjs';
import { createMazeAudio } from './audio.js';
import { advanceGateVisualClock, PUBLIC_PICKUP_VISUAL_SECONDS, observedGateOpenings } from './gate-moment.mjs';

const MAX_TRAIL=240;
const POLL_DELAY_MS=180;
const POLL_TIMEOUT_MS=6000;
// Short, single-chip game feedback, never a new panel or autonomous AI order.
// The physical shards and HUD must use the SAME render-frame-limited clock.
let canvas=document.getElementById('maze');
const byId=id=>document.getElementById(id);
const elements={broadcast:byId('broadcast'),hud:byId('hud'),tick:byId('tick'),steps:byId('steps'),time:byId('time'),keys:byId('keys'),progress:byId('progress'),progressFill:byId('progress-fill'),intentMode:byId('intent-mode'),intentCopy:byId('intent-copy'),confidence:byId('confidence-fill'),inventory:byId('inventory'),caption:byId('caption'),profile:byId('profile'),integrity:byId('integrity'),sceneCard:byId('scene-card'),sceneTitle:byId('scene-title'),sceneMessage:byId('scene-message'),minimap:byId('minimap')};
const query=new URLSearchParams(location.search);
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
const settings={quality:query.get('quality')==='high'?'high':'auto',reducedMotion:query.get('reducedMotion')==='1'||motionPreference.matches,highContrast:query.get('highContrast')==='1',muted:true,cleanFeed:query.get('cleanFeed')==='1'};
const audio=createMazeAudio();
let frame=null, scene=null, fallbackCanvas=null, pollTimer=0, recoveryTimer=0, requestController=null, stopped=false, raf=0, rendererState='loading',cameraMode=query.get('camera')==='overview'?'overview':query.get('camera')==='detail'?'detail':'follow', lastCaption='', lastRunToken='', captionSource='', captionUntil=0, wasInDanger=false, wasNearPressure=false, failedPolls=0, initialising=false, pickupMilestone=null, gateMilestone=null;
let hudVisualTime=0, lastHudRenderNow=0;
// Preserve the last DISTINCT public pressure witness across repeated polls of
// one authoritative tick. This is a presentation predecessor, not AI memory.
let lastDistinctPressureSnapshot=null;

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
  // Public connection state, not a guessed gameplay event. Live danger is
  // already represented by one actionable mission chip; don't duplicate it
  // as a second banner over the actual 3D stage on narrow phones.
  elements.broadcast.dataset.connection=failedPolls?'reconnecting':graphicsUnavailable
    ?'graphics-degraded':snapshot?'live':'connecting';
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
const intentLabels={'exploring':'Exploring','inspecting-hazard':'Inspecting jaws','returning-key':'Find key','unlocking-route':'At gate','searching-exit':'To exit','evading-threat':'Evading','revising-map':'Rerouting','fallback':'Exploring','escaped':'Escaped'};
const goals={'exploring':'Find passage','inspecting-hazard':'Study jaws','returning-key':'Find key','unlocking-route':'Gate ahead','searching-exit':'Find the exit','evading-threat':'Avoid warden','revising-map':'New route','fallback':'Explore','escaped':'Escaped'};
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
  const snapshot=value.snapshot;
  const previousPublicSnapshot=frame?.snapshot;
  // A native tick-6 withdrawal remains on screen while /maze/state can deliver
  // the same tick repeatedly. Reusing raw frame.snapshot erased the published
  // tick-5 witness and reverted the live instruction to an unrelated gate.
  // The shared scene-camera helper rejects run changes, skipped ticks and
  // malformed/nonconsecutive public evidence; no private route is consulted.
  lastDistinctPressureSnapshot=publicDistinctPublicPredecessor(
    lastDistinctPressureSnapshot,previousPublicSnapshot,snapshot);
  // The exact public before→after transition that authorizes Pip's real 3D
  // key shards also earns a single brief game HUD beat. No hidden state or
  // authoritative simulation time is involved.
  const observedPickup=publicKeyCollectionMoment(frame?.snapshot,snapshot);
  // A confirmed same-run CLOSED->OPEN passage gets one short action chip:
  // no phantom gate, hidden-map reveal, extra panel or invented AI command.
  const witnessedOpenings=observedGateOpenings(frame?.snapshot,snapshot);
  if(gateMilestone && (gateMilestone.runToken!==snapshot.runToken || snapshot.result
    || !snapshot.doors.some(d=>d.open
      && ((d.a===gateMilestone.a && d.b===gateMilestone.b)
        || (d.b===gateMilestone.a && d.a===gateMilestone.b)))))
    gateMilestone=null;
  if(witnessedOpenings.length && snapshot.lifecycle==='running'){
    const gate=witnessedOpenings[0];
    gateMilestone={runToken:snapshot.runToken,a:gate.a,b:gate.b,until:hudVisualTime+1.35};
  }
  if(pickupMilestone && (pickupMilestone.runToken!==snapshot.runToken || snapshot.result))pickupMilestone=null;
  if(observedPickup && snapshot.lifecycle==='running')
    pickupMilestone={runToken:snapshot.runToken,until:hudVisualTime+PUBLIC_PICKUP_VISUAL_SECONDS};
  frame=value;
  window.__MAZE_PUBLIC_STATE__=snapshot;
  window.__MAZE_VIEW__=computePublicView(snapshot,value.camera,cameraMode==='overview');
  elements.tick.textContent=String(snapshot.tick);
  elements.steps.textContent=String(snapshot.steps??Math.max(0,snapshot.travelledRoute.length-1));
  elements.time.textContent=formatTime(snapshot.timeRemaining,value.stepDurationMs);
  elements.keys.textContent=String(snapshot.inventory.length);
  const discovered=Math.min(100,snapshot.discoveredCells.length*100/(snapshot.width*snapshot.height));
  elements.progress.textContent=`${Math.floor(discovered)}%`;
  elements.progressFill.style.width=`${discovered}%`;
  const liveIntentLabel=intentLabels[snapshot.intent.mode]||snapshot.intent.mode.replaceAll('-',' ');
  elements.intentMode.textContent=liveIntentLabel;
  elements.intentCopy.textContent=snapshot.intent.explanation;
  const ended=value.scene==='result'||value.scene==='intermission';
  const escaped=snapshot.result?.reason==='escape';
  // Native real-WebGL guardian captures showed WARDEN NEARBY above the stale
  // generic Find a passage / Explore mission. An actually disclosed urgent
  // encounter must outrank a non-urgent landmark without pretending the AI
  // switched actions: intentMode still reports the genuine current AI intent.
  const exposedDanger=!ended && (value.scene==='danger'||snapshot.intent.mode==='evading-threat');
  // Real 390px source WebGL at the public one-step pressure court still showed
  // "Key for gate" over visibly moving jaws. Prioritise the ACTUALLY visible
  // adjacent trap in the SAME compact mission chip. This never changes Pip's
  // genuine autonomous intent or invents an undisclosed engine event.
  // A pressure mechanism witnessed during a real adjacent approach remains
  // the urgent objective through ONE witnessed connected withdrawal. The
  // broader map/gate goal returns immediately thereafter; AI remains real.
  const pressureCue=!ended && !exposedDanger
    ? publicImmediatePressureCue(snapshot)
      || publicPressureWithdrawalCue(lastDistinctPressureSnapshot,snapshot)
    : null;
  // The original full-frame 390px tick-4 scene ALREADY shows the public
  // mechanical relay and Pip's visible diagonal approach. Its old generic
  // "Find key" card hid the fair visual warning until contact at tick 5.
  // Distinguish sighting from actual one-cell danger: the sighting never
  // asserts a collision, planned movement, an accessible route or an attack.
  // A source-witnessed key pickup is physically on screen: Pip and its
  // original shards must agree with the single mission chip. A diagonal
  // sighting is advisory, NOT an active strike. Restore the Watch jaws cue
  // after the real pickup beat expires; immediate pressure still wins above.
  const witnessedKeyCelebration=!ended && pickupMilestone?.runToken===snapshot.runToken
    && hudVisualTime<pickupMilestone.until;
  const pressureApproach=!ended && !exposedDanger && !pressureCue
    && !witnessedKeyCelebration
    ? publicVisibleDiagonalPressureCue(snapshot) : null;
  // Genuine inspection at a currently disclosed diagonal vantage must
  // outrank only the advisory Watch jaws chip, never a live strike or Warden.
  // A real one-step contact/withdrawal warning outranks an inspection
  // intent. The deliberate lantern survey is a safe DIAGONAL observation,
  // not an urgent strike; never show red danger with a 'Study jaws' action.
  // AI intent still reports exactly what Pip is doing in the Details chip.
  const observingPressure=!ended && !exposedDanger && !pressureCue && !!pressureApproach
    && snapshot.intent.mode==='inspecting-hazard';
  const urgent=exposedDanger||!!pressureCue;
  elements.broadcast.dataset.urgency=String(urgent);
  elements.broadcast.dataset.pressureApproach=String(!!pressureApproach);
  byId('run-phase').textContent=ended?(escaped?'JOURNEY COMPLETE':'ATTEMPT ENDED'):exposedDanger?'WARDEN NEARBY':observingPressure?'STUDYING JAWS':pressureCue?'PRESSURE NEARBY':pressureApproach?'JAWS IN SIGHT':'LIVE EXPLORATION';
  const landmark=publicObjective(snapshot);
  // Plain-language HUD truth for an already OBSERVED matching-key gate.
  // A real public danger outranks both this gate and any nearby landmark.
  const keyedSealedGate=!ended && !urgent && !pressureApproach && !landmark && publicHeldGateStatus(snapshot);
  // Danger, termination and a currently matching CLOSED lock outrank a
  // collectible celebration; AI intent continues to report its real plan.
  const freshGate=!ended && !urgent && !pressureApproach && !keyedSealedGate
    && gateMilestone?.runToken===snapshot.runToken
    && hudVisualTime<gateMilestone.until;
  elements.broadcast.dataset.gateMoment=String(freshGate);
  const freshKey=!ended && !urgent && !pressureApproach && !keyedSealedGate && !freshGate
    && pickupMilestone?.runToken===snapshot.runToken
    && hudVisualTime<pickupMilestone.until;
  byId('goal-label').textContent=ended?'Journey result':exposedDanger?'Immediate danger':observingPressure?'Observed pressure court':pressureCue?'Visible pressure hazard':pressureApproach?'Disclosed mechanism':keyedSealedGate?'Known sealed gate':freshGate?'PASSAGE OPEN':freshKey?'KEY FOUND':landmark?'Discovered landmark':'Current goal';
  byId('goal-title').textContent=ended?(escaped?'Escaped':'Run ended'):exposedDanger?'Avoid warden':observingPressure?'Study jaws':pressureCue?'Avoid jaws':pressureApproach?'Watch jaws':keyedSealedGate?'Key for gate':freshGate?'Gate opened':freshKey?'Key collected':landmark?(landmark.kind==='key'?'Key spotted':'Exit spotted'):goals[snapshot.intent.mode]||'Find the exit';
  byId('intent-label').textContent=ended?'Result':'Pip';
  byId('objective').textContent=ended?(escaped?'Exit reached':'Next run soon'):exposedDanger?'Keep clear':observingPressure?'Choosing a safe route':pressureCue?'Keep clear of the jaws':pressureApproach?'Jaws in sight':freshGate?'Explore onward':landmark?(landmark.steps===0?'At the landmark':`${landmark.steps} known step${landmark.steps===1?'':'s'} away`):keyedSealedGate?'Gate still closed':'Explore';
  if(freshKey)byId('objective').textContent='Keep exploring';
  // A witnessed key pickup should not show a second visible "Find key" call
  // directly below "Key collected". Keep the original autonomous strategy
  // EXACTLY as published, available in Details and the accessible status;
  // shorten only the temporary visible intent while this REAL pickup plays.
  if(freshKey && snapshot.intent.mode==='returning-key'){
    elements.intentMode.textContent='Searching';
    elements.intentMode.setAttribute('aria-label',`Pip AI: ${liveIntentLabel}`);
  }else elements.intentMode.removeAttribute('aria-label');
  elements.confidence.style.width=`${Math.round(snapshot.intent.confidence*100)}%`;
  elements.inventory.textContent=String(snapshot.inventory.length);
  elements.inventory.setAttribute('aria-label',`${snapshot.inventory.length} ${snapshot.inventory.length===1?'key':'keys'} collected`);
  elements.profile.textContent=`${snapshot.profile} · Expedition ${snapshot.level}`;
  elements.integrity.textContent=snapshot.authorityChecksum?'Live view connected':'Connecting';
  // A real event earns a short caption, not a permanent dashboard ticker.
  // Repeated snapshot polling must neither replay old audio nor revive it
  // every 180ms. This cosmetic presentation never changes agent authority.
  let eventCaption=null;
  if(lastRunToken!==snapshot.runToken){
    lastRunToken=snapshot.runToken;captionSource='';
    eventCaption='New maze';
  }
  const captions=value.audio?.captions??[];
  const sourceCaption=captions.length?String(captions.at(-1)):'';
  if(sourceCaption && sourceCaption!==captionSource){
    captionSource=sourceCaption;
    eventCaption=viewerCaption(sourceCaption);
  }
  if(exposedDanger && !wasInDanger && Array.isArray(snapshot.threats)
    && snapshot.threats.length) eventCaption='Thornback is nearby.';
  if(pressureCue && !wasNearPressure) eventCaption='Pip sees the pressure jaws.';
  // This is an actual one-tick autonomous WAIT, not a proximity-based
  // invented mechanic. A missed polling tick cannot generate the caption.
  if(observingPressure
    && previousPublicSnapshot?.intent?.mode!=='inspecting-hazard')
    eventCaption='Pip stops to inspect the jaws.';
  wasInDanger=exposedDanger;
  wasNearPressure=!!pressureCue;
  if(eventCaption){
    lastCaption=eventCaption;
    captionUntil=performance.now()+5400;
    if(elements.caption.textContent!==lastCaption)elements.caption.textContent=lastCaption;
  }
  byId('captions').dataset.eventActive=String(performance.now()<captionUntil);
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
function animate(now){
  if(stopped)return;
  // Match scene.js's physical-shard clock: under a CPU/SwiftShader stall,
  // presentation cannot expire while the 3D event is still being drawn.
  // This affects neither the authoritative tick nor the agent's movement.
  const wallDelta=Math.max(0,lastHudRenderNow?(now-lastHudRenderNow)/1000:.016);
  lastHudRenderNow=now;
  hudVisualTime=advanceGateVisualClock(hudVisualTime,wallDelta);
  try{scene?.render(now)}catch(error){stopGraphics(error)}
  raf=requestAnimationFrame(animate);
}
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
