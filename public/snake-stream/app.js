import { createFallbackRenderer } from './fallback.mjs';
import { createGardenAudio } from './audio.mjs';
import { spectatorCopy, goalProgress } from './view-copy.mjs';
import { createOverview } from './overview.mjs';
import { selectCinematicShot } from './cinematic-director.mjs';
import { resolveSpectatorShot } from './cinematic-director.mjs';
import { selectInitialSpectatorCamera } from './cinematic-director.mjs';
import { nextManualSpectatorCamera } from './cinematic-director.mjs';

const MAX_PARTICLES = 240;
const POLL_MS = 125;
const $ = id => document.getElementById(id);
const broadcast = $('broadcast');
let canvas = $('game');
const params = new URLSearchParams(location.search);
const audio = createGardenAudio();
let frame, previousFrame, renderer;
let receivedAt = 0;
let interval = POLL_MS;
let polling = true;
let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let muted = true;
let cleanFeed = false;
let cameraMode = selectInitialSpectatorCamera(params, reducedMotion);
let loading = true;
let reconnecting = false;
let animationId = 0;
let drawFailed = false;
const overview = createOverview(document.querySelector('.stage'), () => { cameraMode = 'overview'; syncControls(); });

if (params.get('controls') === '1') broadcast.classList.add('show-controls');

function syncControls() {
  for (const button of document.querySelectorAll('[data-control]')) {
    const control = button.dataset.control;
    if (control === 'settings') {
      const expanded = String(broadcast.classList.contains('show-controls'));
      if (button.getAttribute('aria-expanded') !== expanded) button.setAttribute('aria-expanded', expanded);
      continue;
    }
    const active = control === 'reduced-motion' ? reducedMotion
      : control === 'muted' ? muted
        : control === 'cinematic' ? cameraMode === 'cinematic'
        : control === 'camera' ? cameraMode !== 'overview' : cleanFeed;
    button.setAttribute('aria-pressed', String(active));
  }
  if ($('view-label')) setText('view-label', cameraMode === 'overview' ? 'Follow snake'
    : cameraMode === 'follow' ? 'Meet the snake'
      : cameraMode === 'detail' ? 'Garden view' : 'Garden overview');
  if ($('audio-label')) setText('audio-label', muted ? 'Sound off' : 'Sound on');
  broadcast.dataset.camera = cameraMode;
  if (frame?.snapshot) overview.update(frame.snapshot, resolveSpectatorShot(cameraMode, frame.snapshot, reducedMotion) !== 'overview');
}

for (const button of document.querySelectorAll('[data-control]')) {
  button.addEventListener('click', async () => {
    switch (button.dataset.control) {
      case 'reduced-motion': reducedMotion = !reducedMotion; break;
      case 'muted': muted = await audio.setMuted(!muted); break;
      case 'camera': cameraMode = nextManualSpectatorCamera(cameraMode); break;
      case 'cinematic': cameraMode = cameraMode === 'cinematic' ? 'overview' : 'cinematic'; break;
      case 'settings': broadcast.classList.toggle('show-controls'); break;
      case 'clean-feed':
        cleanFeed = !cleanFeed;
        broadcast.classList.toggle('clean-feed', cleanFeed);
        if (cleanFeed) broadcast.classList.remove('show-controls');
        break;
    }
    syncControls();
  });
}
// A clean stream contains no clickable HUD: touching the game itself brings
// controls back, including on phones where an Escape key is unavailable.
document.querySelector('.stage').addEventListener('click', () => {
  if (!cleanFeed) return;
  cleanFeed = false;
  broadcast.classList.remove('clean-feed');
  syncControls();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && cleanFeed) { cleanFeed = false; broadcast.classList.remove('clean-feed'); syncControls(); }
  else if (event.key === 'Escape' && broadcast.classList.contains('show-controls')) {
    broadcast.classList.remove('show-controls');
    syncControls();
  }
  // Optional cinematic spectator mode is also accessible without editing a URL.
  // Keep the established three-button camera cycle and its accessibility tests.
  if (event.key.toLowerCase() === 'c' && !event.altKey && !event.ctrlKey && !event.metaKey
      && !event.target?.closest?.('input, textarea, [contenteditable]')) {
    cameraMode = cameraMode === 'cinematic' ? 'overview' : 'cinematic';
    syncControls();
  }
});
syncControls();

// Polling may return the same public view many times. Rewriting identical text
// still creates DOM mutations and can invalidate the full-page composition.
function setText(id, value) {
  const element = $(id);
  if (element.textContent !== value) element.textContent = value;
}

function setScene(value) {
  if (broadcast.dataset.scene !== value) broadcast.dataset.scene = value;
}

// Public-only presentation metadata, updated at the poll rate rather than RAF.
function updateGoalProgress(snapshot) {
  const meter = $('run-progress');
  if (!meter) return;
  const percent = String(goalProgress(snapshot));
  const valueText = snapshot ? `Length ${snapshot.length} of goal ${snapshot.goal}` : 'Waiting for a new run';
  if (meter.getAttribute('aria-valuenow') !== percent) {
    meter.setAttribute('aria-valuenow', percent);
    meter.style.setProperty('--goal-progress', `${percent}%`);
  }
  if (meter.getAttribute('aria-valuetext') !== valueText) meter.setAttribute('aria-valuetext', valueText);
}

function updateText(next) {
  const snapshot = next.snapshot;
  const hud = next.hud;
  const copy = snapshot ? spectatorCopy(snapshot) : null;
  updateGoalProgress(snapshot);
  setScene(loading ? 'maintenance' : (reconnecting || drawFailed) ? 'recovery' : next.scene || 'normal');
  setText('primary', snapshot ? `LENGTH ${snapshot.length} / ${snapshot.goal}` : 'LENGTH — / —');
  setText('secondary', copy?.occupancy || 'The garden is waking');
  setText('record', hud?.recordLabel || 'BEST —');
  setText('intent', copy?.intent || 'Finding a way forward');
  setText('caption', hud?.caption || (snapshot?.dangerLevel === 2 ? 'Finding a safe route away from danger.' : 'Collect fruit. Grow longer. Keep a path open.'));
  setText('audience-copy', snapshot ? `${snapshot.foodsCollected} fruit collected · Each new run finds its own path` : 'A new path, every run');
  setText('integrity', snapshot ? 'INTEGRITY: VERIFIED' : 'INTEGRITY: PREPARING');
  if ($('run-goal')) setText('run-goal', snapshot ? `THE GOAL · GROW TO ${snapshot.goal}` : 'GROW THROUGH THE GARDEN');
  if (drawFailed) {
    setText('scene-title', 'The game is still growing');
    setText('scene-copy', 'This browser cannot draw the game view. Try reloading or another browser.');
  } else if (loading) {
    setText('scene-title', 'The garden is waking');
    setText('scene-copy', 'Preparing your view of a living little world.');
  } else if (next.scene === 'result') {
    setText('scene-title', snapshot?.result?.reason === 'victory' ? 'A garden conquered' : 'Every path tells a story');
    setText('scene-copy', `${hud?.resultLabel || 'Run complete'} · Length ${snapshot?.length || 0} · A new adventure follows.`);
  } else if (next.scene === 'intermission') {
    setText('scene-title', 'Another path awaits');
    setText('scene-copy', 'The next autonomous run begins in a moment.');
  } else if (next.scene === 'recovery') {
    setText('scene-title', 'Finding our way back');
    setText('scene-copy', 'Restoring the latest verified view.');
  }
}

function useFallback(error) {
  renderer?.dispose();
  const replacement = canvas.cloneNode(false);
  canvas.replaceWith(replacement);
  canvas = replacement;
  try {
    renderer = createFallbackRenderer(canvas);
    loading = false;
    drawFailed = false;
    broadcast.dataset.renderMode = 'fallback';
    if (frame) updateText(frame);
  } catch {
    drawFailed = true;
    loading = false;
    setScene('recovery');
    setText('scene-title', 'The game is still growing');
    setText('scene-copy', 'This browser cannot draw the game view. Try reloading or another browser.');
  }
  broadcast.dataset.rendererStatus = error ? 'safe-view' : 'ready';
}

async function initializeRenderer() {
  try {
    const { createSceneRenderer } = await import('./renderer.mjs');
    renderer = createSceneRenderer(canvas, { maxParticles: MAX_PARTICLES, onFailure: useFallback });
    loading = false;
    broadcast.dataset.renderMode = '3d';
    if (frame) updateText(frame);
  } catch (error) { useFallback(error); }
}

async function poll() {
  while (polling) {
    try {
      const response = await fetch('/snapshot', { cache: 'no-store', headers: { accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error('Snapshot unavailable');
      const next = await response.json();
      const changed = next.snapshot && (next.snapshot.runToken !== frame?.snapshot?.runToken || next.snapshot.revision !== frame?.snapshot?.revision);
      if (changed || !frame) {
        previousFrame = frame;
        const now = performance.now();
        interval = Math.min(250, Math.max(POLL_MS, now - receivedAt));
        receivedAt = now;
        frame = next;
        audio.accept(next);
      } else frame = next;
      reconnecting = false;
      updateText(next);
      if (next.snapshot) overview.update(next.snapshot, resolveSpectatorShot(cameraMode, next.snapshot, reducedMotion) !== 'overview');
    } catch {
      reconnecting = true;
      setScene('recovery');
      setText('scene-title', 'Reconnecting to the garden');
      setText('scene-copy', 'Waiting for the latest game view.');
      setText('caption', 'Connection interrupted · reconnecting automatically');
    }
    if (polling) await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }
}

function draw(timestamp) {
  if (!polling) return;
  if (!document.hidden && renderer && frame && !drawFailed) {
    const alpha = Math.min(1, Math.max(0, (timestamp - receivedAt) / interval));
    // A live cinematic composition only selects between EXISTING true WebGL
    // cameras using the real public simulation step. It cannot modify the game.
    const activeShot = resolveSpectatorShot(cameraMode, frame.snapshot, reducedMotion);
    try { renderer.draw(frame, previousFrame, alpha, timestamp, { reducedMotion, cameraMode: activeShot }); }
    catch (error) { useFallback(error); }
  }
  animationId = requestAnimationFrame(draw);
}

window.__snakePresentation = Object.freeze({
  stats: () => ({ ...renderer?.stats(), viewerCameraMode: cameraMode,
    reducedMotion, cleanFeed, connected: !reconnecting, audio: audio.stats() }),
});
window.addEventListener('pagehide', () => {
  polling = false;
  cancelAnimationFrame(animationId);
  renderer?.dispose();
  audio.dispose();
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderer?.resetTiming?.(); });
window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
initializeRenderer();
poll();
animationId = requestAnimationFrame(draw);
