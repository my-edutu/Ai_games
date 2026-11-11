import { createTowerScene } from './visuals/scene.mjs';
import { createTowerAudio } from './visuals/audio.mjs';
import { createHUD } from './visuals/hud.mjs';
import { nextTowerStatePollDelay } from './visuals/live-state-cadence.mjs';
import { createPresentedPhaseLatch } from './visuals/presented-phase-latch.mjs';

const params = new URLSearchParams(location.search);
const enabled = name => ['1', 'true'].includes(params.get(name));
const disabled = name => ['0', 'false'].includes(params.get(name));
const reduced = enabled('reducedMotion') || (!disabled('reducedMotion') && matchMedia('(prefers-reduced-motion: reduce)').matches);
const clean = enabled('cleanFeed');
const requestedQuality = params.get('quality');
const quality = ['low', 'high'].includes(requestedQuality) ? requestedQuality : innerWidth < 700 ? 'low' : 'high';
const audio = createTowerAudio();
let view = null, current = null, closed = false, suspended = false, request = null, timer = null;
let failures = 0, soundRequest = 0;
const presentedPhase = createPresentedPhaseLatch();
const hud = createHUD({
  initialQuality: quality,
  onCamera: mode => view?.setCamera(mode),
  onSound: async value => {
    const operation = ++soundRequest;
    const active = await audio.setEnabled(value);
    if (!closed && operation === soundRequest && value && !active) hud.feedback('Sound unavailable', 'Sound could not start in this browser');
  },
  onMotion: value => view?.setMotion(value),
  onQuality: value => view?.setQuality(value),
  onFullscreen: async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { hud.feedback('Fullscreen unavailable', 'Fullscreen is unavailable in this view'); }
  },
});
try {
  view = createTowerScene(document.getElementById('tower-canvas'), {
    camera: params.get('camera') === 'overview' ? 'overview' : 'follow',
    quality,
    reducedMotion: reduced,
    onStatus: (message, kind) => hud.status(message, kind),
    onSubmittedFrame: exactSnapshot => {
      // A returned Three.js render, NOT an HTTP response or sampled source
      // tick, owns the ordinary visible HUD phase. Event/restart truth is
      // retained in the source-only accessibility path below.
      const committed = presentedPhase.submitted(exactSnapshot);
      if (!committed || closed || suspended) return;
      const d = window.__TOWER_RENDER_DIAGNOSTICS__?.() || {};
      hud.update(committed, { ...d, sourceScene: committed.scene });
    },
  });
} catch (error) {
  console.error('Tower graphics could not start:', error);
  hud.status('3D graphics unavailable in this browser', 'error');
}
window.__TOWER_RENDER_DIAGNOSTICS__ = () => ({ ...(view?.diagnostics() || { frames: 0, renderer: 'unavailable' }), ...audio.diagnostics(), requestsInFlight: request ? 1 : 0, presentedPhase: presentedPhase.diagnostics() });
async function poll() {
  if (closed || suspended || request) return;
  timer = null;
  const pending = { controller: new AbortController(), timeout: null, startedAtMs: performance.now() };
  request = pending;
  pending.timeout = setTimeout(() => pending.controller.abort(), 2500);
  try {
    const query = new URLSearchParams({ w: String(innerWidth), h: String(innerHeight), reducedMotion: String(document.body.dataset.reducedMotion === 'true' ? 1 : 0), cleanFeed: clean ? '1' : '0', muted: audio.diagnostics().soundEnabled ? '0' : '1' });
    const response = await fetch(`/tower/state?${query}`, { cache: 'no-store', signal: pending.controller.signal });
    if (!response.ok) throw new Error(`state-${response.status}`);
    const data = await response.json();
    if (!data.snapshot || !Number.isFinite(data.snapshot.tick)) throw new Error('invalid-public-state');
    if (closed || suspended || request !== pending) return;
    current = data; failures = 0;
    window.__TOWER_PUBLIC_STATE__ = data.snapshot;
    view?.setStale(false);
    presentedPhase.accept(data);
    view?.accept(data);
    audio.accept(data);
    const diagnostics = window.__TOWER_RENDER_DIAGNOSTICS__();
    const renderState = diagnostics.renderProgress?.state;
    const faultState = diagnostics.renderFault?.state;
    const graphicsFault = faultState === 'retrying' || faultState === 'failed';
    const graphicsPending = ['waiting', 'starting', 'stalled'].includes(renderState);
    const terminal = ['result', 'intermission'].includes(data.scene);
    const recovery = !view || diagnostics.contextLost || graphicsFault ||
      data.scene === 'recovery' || (graphicsPending && !terminal);
    const recoveryKind = !view ? 'unavailable'
      : diagnostics.contextLost ? 'context'
      : faultState === 'failed' ? 'render-failed'
      : faultState === 'retrying' ? 'render-retry'
      : data.scene === 'recovery' ? 'authority'
      : renderState === 'stalled' ? 'stalled'
      : graphicsPending ? 'starting' : undefined;
    const recoveryMessage = !view ? 'Your browser could not start 3D graphics. Enable WebGL and reload this page.'
      : diagnostics.contextLost ? 'Graphics are reconnecting. The expedition continues.'
      : faultState === 'failed' ? '3D rendering stopped after bounded retries. Switch graphics quality or reload; the expedition continues.'
      : faultState === 'retrying' ? 'The 3D renderer is retrying. The expedition continues without inventing frames.'
      : data.scene === 'recovery' ? 'The expedition is restoring verified game state.'
      : renderState === 'stalled' ? 'The 3D view is delayed. The expedition continues; try Low graphics quality.'
      : graphicsPending ? 'Preparing the 3D view. The expedition continues.'
      : 'The expedition is restoring verified game state.';
    // Genuine result/intermission/upgrade and graphics failure must remain
    // accessible even if the browser cannot submit a 3D frame. For ordinary
    // ascent/combat, keep HUD and world on the same exact submitted snapshot.
    const sourceOnly = !view || graphicsFault || diagnostics.contextLost ||
      ['result', 'intermission', 'upgrade', 'recovery'].includes(data.scene);
    if (sourceOnly) presentedPhase.immediate(data);
    const visibleFrame = presentedPhase.visible();
    const pendingFirstFrame = !!view && presentedPhase.pending() && !visibleFrame;
    const hudFrame = visibleFrame || data;
    const hudScene = pendingFirstFrame ? 'recovery' : hudFrame.scene;
    // Do not leak an HTTP-accepted floor, run token or score as if the 3D
    // renderer had submitted them. For a first pending normal frame, recovery
    // has NO authoritative HUD snapshot until exact Three.js submission.
    // Genuine result/upgrade/recovery and failed-WebGL source-only access
    // remain available through the explicit immediate() path.
    const presentationFrame = pendingFirstFrame ? { scene: 'recovery', audio: { captions: [] } }
      : recovery ? { ...hudFrame, scene: 'recovery' } : hudFrame;
    hud.update(presentationFrame,
      { ...diagnostics, recoveryMessage,
        recoveryKind: pendingFirstFrame && !recoveryKind ? 'starting' : recoveryKind,
        sourceScene: pendingFirstFrame ? 'recovery' : hudScene });
    if (faultState === 'failed') hud.status('3D rendering stopped · switch graphics quality or reload', 'error');
    else if (recovery || graphicsPending || pendingFirstFrame) hud.status(renderState === 'stalled' && !graphicsFault ? '3D view delayed · expedition continues' : 'Preparing the 3D view', 'degraded');
    else hud.status('LIVE EXPEDITION', 'online');
  } catch (error) {
    if (closed || suspended || request !== pending) return;
    failures++;
    view?.setStale(true);
    hud.status('Reconnecting to the expedition', 'degraded');
    hud.update({ ...(current || {}), scene: 'recovery' }, {
      ...window.__TOWER_RENDER_DIAGNOSTICS__(),
      recoveryMessage: 'The connection was interrupted. Reconnecting automatically.',
      recoveryKind: 'connection',
      sourceScene: current?.scene,
    });
  } finally {
    clearTimeout(pending.timeout);
    if (request === pending) {
      request = null;
      if (!closed && !suspended) timer = setTimeout(poll, nextTowerStatePollDelay({
        startedAtMs: pending.startedAtMs,
        completedAtMs: performance.now(),
        failures,
      }));
    }
  }
}
function stopPolling() {
  clearTimeout(timer); timer = null;
  const pending = request;
  request = null;
  if (pending) { clearTimeout(pending.timeout); pending.controller.abort(); }
}
function dispose() {
  if (closed) return;
  closed = true; stopPolling();
  removeEventListener('pagehide', pagehide); removeEventListener('pageshow', pageshow);
  presentedPhase.clear(); view?.dispose(); audio.dispose(); hud.dispose();
}
function pagehide(event) {
  if (!event.persisted) { dispose(); return; }
  // The browser preserves the scene and controls while this document is cached.
  suspended = true; stopPolling(); view?.setStale(true);
}
function pageshow(event) {
  if (!event.persisted || closed || !suspended) return;
  suspended = false; poll();
}
addEventListener('pagehide', pagehide);
addEventListener('pageshow', pageshow);
poll();
