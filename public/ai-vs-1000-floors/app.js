import {createAscentAudio} from './audio.js';
const $ = id => document.getElementById(id);
const SAVE_KEY = 'thousand-floors-save-v1';
const PREF_KEY = 'thousand-floors-settings-v1';
const SEED = 'thousand-dawn-2026';
const reviewValue = Number(new URLSearchParams(location.search).get('review'));
const reviewFloor = Number.isInteger(reviewValue) && reviewValue >= 1 && reviewValue <= 1000 ? reviewValue : null;
const audio = createAscentAudio();
let worker, view, snapshot, pendingSnapshot = null, latestVerifiedSave = null, paused = false, speed = 1, camera = 'follow', initialized = false;
let bootToken = 0, bootTimer, lastFrame = 0, elapsed = 0, milestoneTimer, lastEvent = -1, baseline = true;
let storageOK = true, saveRejected = false, qualityAdapted = false;
let warmupUntil = 0, slowSeconds = 0, slowSamples = 0, frameGapMs = 0, maxFrameGapMs = 0, adaptationReason = null;
const settings = {reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches, quality:'high', qualityManual:false, cleanFeed:false};
let savedPreferences = null;
try {savedPreferences = localStorage.getItem(PREF_KEY);} catch {storageOK = false;}
try {
  const savedSettings = JSON.parse(savedPreferences || 'null');
  if (savedSettings && typeof savedSettings === 'object') {
    if (typeof savedSettings.reducedMotion === 'boolean') settings.reducedMotion = savedSettings.reducedMotion;
    if (['high','low'].includes(savedSettings.quality)) settings.quality = savedSettings.quality;
    settings.qualityManual = typeof savedSettings.qualityManual === 'boolean' ? savedSettings.qualityManual : savedSettings.quality === 'low';
    if (typeof savedSettings.cleanFeed === 'boolean') settings.cleanFeed = savedSettings.cleanFeed;
  }
} catch {/* A malformed preference is not a failed campaign save or unavailable storage. */}
function storageNote() {
  $('save-note').textContent = reviewFloor ? 'Scene review · progress is not saved' : !storageOK ? 'Progress is temporary · storage unavailable' : '';
}
function savePreferences() {try {localStorage.setItem(PREF_KEY, JSON.stringify(settings));} catch {storageOK = false; storageNote();}}
function resize() {view?.resize(innerWidth, innerHeight, Math.min(devicePixelRatio || 1, settings.quality === 'low' ? 1 : 2));}
function applySettings() {
  $('reduced-motion').checked = settings.reducedMotion; $('quality-select').value = settings.quality;
  $('clean-feed').checked = settings.cleanFeed; document.body.classList.toggle('clean-feed', settings.cleanFeed);
  view?.setReducedMotion(settings.reducedMotion); view?.setQuality(settings.quality); resize();
}
function resetFrameObservations(now = performance.now()) {
  lastFrame = 0; slowSeconds = 0; slowSamples = 0; frameGapMs = 0;
  warmupUntil = now + 2000;
}
function observeFrameGap(gapSeconds, now) {
  if (!initialized || document.hidden || paused || now < warmupUntil || gapSeconds <= 0) return;
  frameGapMs = Math.round(gapSeconds * 1000);
  maxFrameGapMs = Math.max(maxFrameGapMs, frameGapMs);
  if (qualityAdapted || settings.qualityManual || settings.quality !== 'high') return;
  if (gapSeconds > .05) {
    // Wall time catches a one-frame-per-second renderer without waiting for 100 frames.
    // A single long stall cannot satisfy the independent sample requirement.
    slowSeconds += Math.min(gapSeconds, 2); slowSamples++;
  } else {
    slowSeconds = Math.max(0, slowSeconds - gapSeconds * 2);
    if (slowSeconds === 0) slowSamples = 0;
  }
  if (slowSeconds >= 4 && slowSamples >= 3) {
    qualityAdapted = true; adaptationReason = 'sustained-active-frame-gaps';
    settings.quality = 'low'; applySettings(); toast('Scene quality adjusted.');
  }
}
function controlsReady(ready) {for (const id of ['pause-button','speed-button','camera-button','recover-button','restart-button']) $(id).disabled = !ready;}
function showState(title, message, mode = 'retry') {
  if ($('settings-dialog').open) $('settings-dialog').close();
  $('hud').inert = true;
  $('state-title').textContent = title; $('state-message').textContent = message;
  $('retry-button').hidden = mode !== 'retry'; $('fresh-button').hidden = mode !== 'fresh';
  $('loading-state').hidden = false;
  if (mode === 'retry') $('retry-button').focus();
  if (mode === 'fresh') $('fresh-button').focus();
}
function fail(message, kind = 'startup') {
  clearTimeout(bootTimer); initialized = false; pendingSnapshot = null; controlsReady(false); worker?.postMessage({type:'pause',paused:true}); audio.setPaused(true);
  showState(kind === 'graphics' ? 'The view needs a fresh start.' : 'The ascent needs a fresh start.', message);
}
function transport(data) {
  if (typeof data.paused === 'boolean' && data.paused !== paused) resetFrameObservations();
  paused = data.paused ?? paused; speed = data.speed ?? speed;
  $('pause-label').textContent = paused ? 'Resume' : 'Pause'; $('pause-icon').textContent = paused ? '▷' : 'Ⅱ';
  $('pause-button').setAttribute('aria-label', paused ? 'Resume ascent' : 'Pause ascent');
  $('speed-label').textContent = speed + '×'; $('speed-button').setAttribute('aria-label', `Playback speed: ${speed} times`);
  $('run-state').textContent = reviewFloor ? 'SCENE REVIEW' : paused ? 'ASCENT PAUSED' : snapshot?.status === 'complete' ? 'CROWN REACHED' : 'AUTONOMOUS ASCENT';
  document.body.classList.toggle('paused', paused); audio.setPaused(paused);
}
function toast(text) {clearTimeout(milestoneTimer); $('milestone').textContent = text; $('milestone').hidden = false; milestoneTimer = setTimeout(() => {$('milestone').hidden = true;}, 3200);}
function renderSnapshot(next) {
  snapshot = next;
  view.setSnapshot(next);
  $('floor-number').textContent = String(next.floor).padStart(3, '0');
  $('district-name').textContent = String(next.layout.district.name).slice(0, 60);
  $('district-index').textContent = `${String(next.layout.district.index + 1).padStart(2,'0')} — 10`;
  $('intent').textContent = String(next.intent).slice(0, 150);
  $('checkpoint-label').textContent = `Checkpoint · Floor ${String(next.checkpointFloor).padStart(3, '0')}`;
  $('recovery-description').textContent = `Return to Floor ${String(next.checkpointFloor).padStart(3, '0')} to retrace the route. Your current floor is ${next.floor}.`;
  $('progress-fill').style.width = `${next.completedFloors / 10}%`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', next.completedFloors);
  $('intent-caption').textContent = next.status === 'complete' ? 'EXPLORER / CROWN REACHED' : next.status === 'recovering' ? 'EXPLORER / FINDING ITS FOOTING' : 'EXPLORER / LIVE INTENT';
  if (next.status === 'complete') transport({});
}
function consumeFeedback(next) {
  audio.consume(next.events);
  const events = next.events.filter(event => event.seq > lastEvent);
  if (events.length) lastEvent = Math.max(lastEvent, ...events.map(event => event.seq));
  if (!baseline) {
    const event = events.find(event => event.type === 'complete') || events.find(event => event.type === 'checkpoint') || events.find(event => event.type === 'recover') || events.find(event => event.type === 'hit');
    if (event) toast(event.type === 'complete' ? 'The crown is yours. 1,000 floors cleared.' : event.type === 'checkpoint' ? `A safe footing · Checkpoint ${next.checkpointFloor}` : event.type === 'recover' ? 'Back on solid ground.' : 'A setback. The explorer finds its footing.');
  }
  baseline = false;
}
function persistVerifiedSave() {
  // This is the latest serialization received from the worker, never a reconstructed render snapshot.
  if (!latestVerifiedSave || reviewFloor || saveRejected) return;
  try {localStorage.setItem(SAVE_KEY, latestVerifiedSave);} catch {storageOK = false; storageNote();}
}
function armStartupTimeout(token) {
  clearTimeout(bootTimer);
  bootTimer = setTimeout(() => {
    if (!initialized && token === bootToken) fail(reviewFloor ? 'The replay is taking longer than expected. Try again to rebuild this scene review. Your saved ascent is untouched.' : 'The explorer is taking longer than expected to arrive. Try again to reconnect to your ascent.');
  }, reviewFloor ? 120000 : 15000);
}
async function boot() {
  const token = ++bootToken; clearTimeout(bootTimer); worker?.terminate(); worker = null; view?.dispose(); view = null;
  initialized = false; saveRejected = false; baseline = true; lastEvent = -1; snapshot = null; pendingSnapshot = null; latestVerifiedSave = null; audio.reset(); audio.setPaused(true); controlsReady(false);
  showState(reviewFloor ? `Replaying the path to Floor ${String(reviewFloor).padStart(3, '0')}.` : 'The ascent is waking.', reviewFloor ? 'The explorer is retracing the actual ascent. This can take up to two minutes. Your saved progress stays untouched.' : 'Preparing your explorer and a little piece of sky.', 'loading');
  let saved = null;
  if (!reviewFloor) {try {saved = localStorage.getItem(SAVE_KEY);} catch {storageOK = false;}}
  storageNote();
  try {
    const {createFloorScene} = await import('./scene.js');
    if (token !== bootToken) return;
    view = createFloorScene($('game-canvas'), {reducedMotion:settings.reducedMotion, onError:() => fail('Your browser interrupted the 3D view. Try again to restore your saved ascent.', 'graphics')});
    applySettings(); view.setCamera(camera);
    worker = new Worker('./worker.js', {type:'module'});
    worker.addEventListener('message', ({data}) => {
      if (token !== bootToken) return;
      try {
        if (data.type === 'initialized') {
          clearTimeout(bootTimer); initialized = true; saveRejected = false; resetFrameObservations();
          snapshot = data.snapshot; consumeFeedback(snapshot); renderSnapshot(snapshot); transport(data); controlsReady(true); $('loading-state').hidden = true; $('hud').inert = false;
          if ($('loading-state').contains(document.activeElement)) $('pause-button').focus();
        } else if (data.type === 'snapshot' && initialized) {
          snapshot = data.snapshot;
          consumeFeedback(snapshot);
          // Keep authority current while applying at most one scene/HUD snapshot per frame.
          pendingSnapshot = snapshot;
        }
        else if (data.type === 'transport') transport(data);
        else if (data.type === 'save' && initialized && !reviewFloor && !saveRejected && typeof data.serialized === 'string') {
          latestVerifiedSave = data.serialized; persistVerifiedSave();
        } else if (data.type === 'save-rejected') {
          clearTimeout(bootTimer); saveRejected = true; initialized = false; controlsReady(false);
          showState('Your saved ascent could not be restored.', 'The saved data has been kept. Start fresh only if you want to replace it with a new ascent.', 'fresh');
        } else if (data.type === 'error') fail('The explorer could not continue. Try again to restore your saved progress.');
      } catch {fail('The view could not be restored. Try again to reload the ascent.');}
    });
    worker.addEventListener('error', event => {event.preventDefault(); if (token === bootToken) fail('The ascent could not start in this browser. Try again to reload your saved progress.');});
    worker.postMessage({type:'init', seed:SEED, saved, ...(reviewFloor ? {reviewFloor} : {})});
    armStartupTimeout(token);
  } catch {if (token === bootToken) fail('The 3D scene is unavailable. Check that your browser supports WebGL, then try again. Your saved ascent is kept.', 'graphics');}
}
function command(message) {if (worker && initialized) worker.postMessage(message);}
function pauseToggle() {command({type:'pause', paused:!paused});}
function cameraCycle() {
  if (!initialized) return;
  const modes = ['follow','wide','orbit']; camera = modes[(modes.indexOf(camera) + 1) % modes.length];
  view.setCamera(camera); $('camera-label').textContent = camera[0].toUpperCase() + camera.slice(1);
  $('camera-button').setAttribute('aria-label', `Camera: ${camera}`);
}
async function soundToggle() {
  const enabled = await audio.toggle(); $('sound-button').setAttribute('aria-pressed', String(enabled));
  $('sound-button').setAttribute('aria-label', enabled ? 'Mute sound' : 'Enable sound');
  $('sound-label').textContent = enabled ? 'Sound on' : 'Sound off';
  $('sound-waves').setAttribute('d', enabled ? 'M16 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14' : 'm17 9 5 6m0-6-5 6');
  if (!enabled && audio.getDiagnostics().context === 'uninitialized') toast('Sound is unavailable in this browser.');
}
function restart() {
  if (!worker) return;
  initialized = false; pendingSnapshot = null; controlsReady(false);
  audio.reset(); audio.setPaused(true); baseline = true; lastEvent = -1; saveRejected = false;
  $('restart-confirmation').hidden = true; $('settings-dialog').close();
  showState(reviewFloor ? `Replaying the path to Floor ${String(reviewFloor).padStart(3, '0')}.` : 'A new ascent begins.', reviewFloor ? 'The explorer is retracing the actual ascent. This can take up to two minutes. Your saved progress stays untouched.' : 'Your explorer is finding its first footing.', 'loading');
  worker.postMessage({type:'restart',seed:SEED,...(reviewFloor ? {reviewFloor} : {})});
  armStartupTimeout(bootToken);
}
$('pause-button').addEventListener('click', pauseToggle);
$('speed-button').addEventListener('click', () => command({type:'speed',speed:speed === 4 ? 1 : speed * 2}));
$('camera-button').addEventListener('click', cameraCycle);
$('sound-button').addEventListener('click', soundToggle);
$('settings-button').addEventListener('click', () => {$('restart-confirmation').hidden = true; $('settings-dialog').showModal();});
$('settings-dialog').addEventListener('click', event => {if (event.target === $('settings-dialog')) {const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close();}});
$('reduced-motion').addEventListener('change', event => {settings.reducedMotion = event.target.checked; applySettings(); savePreferences();});
$('quality-select').addEventListener('change', event => {settings.quality = event.target.value; settings.qualityManual = true; adaptationReason = 'manual-selection'; resetFrameObservations(); applySettings(); savePreferences();});
$('clean-feed').addEventListener('change', event => {settings.cleanFeed = event.target.checked; applySettings(); savePreferences();});
$('recover-button').addEventListener('click', () => {command({type:'checkpoint-recover'}); $('settings-dialog').close();});
$('restart-button').addEventListener('click', () => {$('restart-confirmation').hidden = false; $('cancel-restart').focus();});
$('cancel-restart').addEventListener('click', () => {$('restart-confirmation').hidden = true; $('restart-button').focus();});
$('confirm-restart').addEventListener('click', restart); $('fresh-button').addEventListener('click', restart);
$('retry-button').addEventListener('click', boot);
addEventListener('keydown', event => {
  if ($('settings-dialog').open || event.altKey || event.ctrlKey || event.metaKey || /INPUT|SELECT|TEXTAREA|BUTTON/.test(event.target.tagName)) return;
  if (event.code === 'Space') {event.preventDefault(); pauseToggle();}
  else if (event.key.toLowerCase() === 'c') cameraCycle();
  else if (event.key.toLowerCase() === 'm') soundToggle();
});
addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => {audio.setHidden(document.hidden); resetFrameObservations(); if (document.hidden) {persistVerifiedSave(); command({type:'save'});}});
addEventListener('pagehide', () => {persistVerifiedSave(); command({type:'save'}); audio.setHidden(true);});
addEventListener('pageshow', () => {audio.setHidden(document.hidden); resetFrameObservations();});
function frame(time) {
  requestAnimationFrame(frame);
  const gap = lastFrame ? Math.max(0, (time - lastFrame) / 1000) : 0;
  const delta = gap ? Math.min(gap, .1) : 1 / 60; lastFrame = time;
  if (!view || !initialized || document.hidden) return;
  if (!paused) elapsed += delta;
  try {
    if (pendingSnapshot) {const latest = pendingSnapshot; pendingSnapshot = null; renderSnapshot(latest);}
    view.update(paused ? 0 : delta, elapsed);
  } catch {fail('The 3D view was interrupted. Try again to restore the ascent.', 'graphics');}
  observeFrameGap(gap, time);
}
Object.defineProperty(window, '__FLOORS_DIAGNOSTICS__', {value:() => ({initialized,paused,speed,camera,review:!!reviewFloor,quality:settings.quality,presentation:{frameGapMs,maxFrameGapMs,slowSeconds:Math.round(slowSeconds * 100) / 100,qualitySource:settings.qualityManual ? 'manual' : qualityAdapted ? 'automatic' : 'default',adaptationReason},storageAvailable:storageOK,snapshot:snapshot ? {floor:snapshot.floor,tick:snapshot.tick,status:snapshot.status,checkpointFloor:snapshot.checkpointFloor,action:snapshot.hero.action} : null,renderer:view?.getDiagnostics() ?? null,audio:audio.getDiagnostics()}),writable:false});
document.body.classList.toggle('scene-review', !!reviewFloor);
applySettings(); storageNote(); requestAnimationFrame(frame); boot();
