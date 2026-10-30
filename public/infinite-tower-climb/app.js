import { createTowerScene } from './visuals/scene.mjs';
import { createTowerAudio } from './visuals/audio.mjs';
import { createHUD } from './visuals/hud.mjs';

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
const hud = createHUD({
  initialQuality: quality,
  onCamera: mode => view?.setCamera(mode),
  onSound: async value => {
    const operation = ++soundRequest;
    const active = await audio.setEnabled(value);
    if (!closed && operation === soundRequest && value && !active) hud.status('Sound could not start in this browser', 'degraded');
  },
  onMotion: value => view?.setMotion(value),
  onQuality: value => view?.setQuality(value),
  onFullscreen: async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { hud.status('Fullscreen is unavailable in this view', 'degraded'); }
  },
});
try {
  view = createTowerScene(document.getElementById('tower-canvas'), {
    camera: params.get('camera') === 'overview' ? 'overview' : 'follow',
    quality,
    reducedMotion: reduced,
    onStatus: (message, kind) => hud.status(message, kind),
  });
} catch (error) {
  console.error('Tower graphics could not start:', error);
  hud.status('3D graphics unavailable in this browser', 'error');
}
window.__TOWER_RENDER_DIAGNOSTICS__ = () => ({ ...(view?.diagnostics() || { frames: 0, renderer: 'unavailable' }), ...audio.diagnostics(), requestsInFlight: request ? 1 : 0 });
async function poll() {
  if (closed || suspended || request) return;
  timer = null;
  const pending = { controller: new AbortController(), timeout: null };
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
    view?.accept(data);
    audio.accept(data);
    const diagnostics = window.__TOWER_RENDER_DIAGNOSTICS__();
    const renderState = diagnostics.renderProgress?.state;
    const graphicsPending = ['waiting', 'starting', 'stalled'].includes(renderState);
    const terminal = ['result', 'intermission'].includes(data.scene);
    const recovery = !view || diagnostics.contextLost || data.scene === 'recovery' || (graphicsPending && !terminal);
    const recoveryMessage = !view ? 'Your browser could not start 3D graphics. Enable WebGL and reload this page.'
      : diagnostics.contextLost ? 'Graphics are reconnecting. The expedition continues.'
      : data.scene === 'recovery' ? 'The expedition is restoring verified game state.'
      : renderState === 'stalled' ? 'The 3D view is delayed. The expedition continues; try Low graphics quality.'
      : graphicsPending ? 'Preparing the 3D view. The expedition continues.'
      : 'The expedition is restoring verified game state.';
    hud.update(recovery ? { ...data, scene: 'recovery' } : data, { ...diagnostics, recoveryMessage });
    if (recovery || graphicsPending) hud.status(renderState === 'stalled' ? '3D view delayed · expedition continues' : 'Restoring the expedition', 'degraded');
    else hud.status('LIVE EXPEDITION', 'online');
  } catch (error) {
    if (closed || suspended || request !== pending) return;
    failures++;
    view?.setStale(true);
    hud.status('Reconnecting to the expedition', 'degraded');
    hud.update({ ...(current || {}), scene: 'recovery' }, { recoveryMessage: 'The connection was interrupted. Reconnecting automatically.', ...audio.diagnostics() });
  } finally {
    clearTimeout(pending.timeout);
    if (request === pending) {
      request = null;
      if (!closed && !suspended) timer = setTimeout(poll, failures ? Math.min(3000, 400 * failures) : 100);
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
  view?.dispose(); audio.dispose(); hud.dispose();
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
