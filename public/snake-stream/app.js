import { createFallbackRenderer } from './fallback.mjs';
import { createGardenAudio } from './audio.mjs';
import { spectatorCopy } from './view-copy.mjs';
import { createOverview } from './overview.mjs';

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
let cameraMode = ['follow', 'detail'].includes(params.get('camera')) ? params.get('camera') : 'overview';
let loading = true;
let reconnecting = false;
let animationId = 0;
let drawFailed = false;
const overview = createOverview(document.querySelector('.stage'), () => { cameraMode = 'overview'; syncControls(); });

if (params.get('controls') === '1') broadcast.classList.add('show-controls');

function syncControls() {
  for (const button of document.querySelectorAll('[data-control]')) {
    const control = button.dataset.control;
    const active = control === 'reduced-motion' ? reducedMotion
      : control === 'muted' ? muted
        : control === 'camera' ? cameraMode !== 'overview' : cleanFeed;
    button.setAttribute('aria-pressed', String(active));
  }
  if ($('view-label')) $('view-label').textContent = cameraMode === 'overview' ? 'Follow snake' : cameraMode === 'follow' ? 'Meet the snake' : 'Garden view';
  if ($('audio-label')) $('audio-label').textContent = muted ? 'Sound off' : 'Sound on';
  broadcast.dataset.camera = cameraMode;
  if (frame?.snapshot) overview.update(frame.snapshot, cameraMode !== 'overview');
}

for (const button of document.querySelectorAll('[data-control]')) {
  button.addEventListener('click', async () => {
    switch (button.dataset.control) {
      case 'reduced-motion': reducedMotion = !reducedMotion; break;
      case 'muted': muted = await audio.setMuted(!muted); break;
      case 'camera': cameraMode = cameraMode === 'overview' ? 'follow' : cameraMode === 'follow' ? 'detail' : 'overview'; break;
      case 'clean-feed':
        cleanFeed = !cleanFeed;
        broadcast.classList.toggle('clean-feed', cleanFeed);
        break;
    }
    syncControls();
  });
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && cleanFeed) { cleanFeed = false; broadcast.classList.remove('clean-feed'); syncControls(); }
});
syncControls();

function updateText(next) {
  const snapshot = next.snapshot;
  const hud = next.hud;
  const copy = snapshot ? spectatorCopy(snapshot) : null;
  broadcast.dataset.scene = loading ? 'maintenance' : (reconnecting || drawFailed) ? 'recovery' : next.scene || 'normal';
  $('primary').textContent = snapshot ? `LENGTH ${snapshot.length} / ${snapshot.goal}` : 'LENGTH — / —';
  $('secondary').textContent = copy?.occupancy || 'The garden is waking';
  $('record').textContent = hud?.recordLabel || 'BEST —';
  $('intent').textContent = copy?.intent || 'Finding a way forward';
  $('caption').textContent = hud?.caption || (snapshot?.dangerLevel === 2 ? 'Finding a safe route away from danger.' : 'Collect fruit. Grow longer. Keep a path open.');
  $('audience-copy').textContent = snapshot ? `${snapshot.foodsCollected} fruit collected · Each new run finds its own path` : 'A new path, every run';
  $('integrity').textContent = snapshot ? 'INTEGRITY: VERIFIED' : 'INTEGRITY: PREPARING';
  if ($('run-goal')) $('run-goal').textContent = snapshot ? `THE GOAL · GROW TO ${snapshot.goal}` : 'GROW THROUGH THE GARDEN';
  if (drawFailed) {
    $('scene-title').textContent = 'The game is still growing';
    $('scene-copy').textContent = 'This browser cannot draw the game view. Try reloading or another browser.';
  } else if (loading) {
    $('scene-title').textContent = 'The garden is waking';
    $('scene-copy').textContent = 'Preparing your view of a living little world.';
  } else if (next.scene === 'result') {
    $('scene-title').textContent = snapshot?.result?.reason === 'victory' ? 'A garden conquered' : 'Every path tells a story';
    $('scene-copy').textContent = `${hud?.resultLabel || 'Run complete'} · Length ${snapshot?.length || 0} · A new adventure follows.`;
  } else if (next.scene === 'intermission') {
    $('scene-title').textContent = 'Another path awaits';
    $('scene-copy').textContent = 'The next autonomous run begins in a moment.';
  } else if (next.scene === 'recovery') {
    $('scene-title').textContent = 'Finding our way back';
    $('scene-copy').textContent = 'Restoring the latest verified view.';
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
    broadcast.dataset.scene = 'recovery';
    $('scene-title').textContent = 'The game is still growing';
    $('scene-copy').textContent = 'This browser cannot draw the game view. Try reloading or another browser.';
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
      if (next.snapshot) overview.update(next.snapshot, cameraMode !== 'overview');
    } catch {
      reconnecting = true;
      broadcast.dataset.scene = 'recovery';
      $('scene-title').textContent = 'Reconnecting to the garden';
      $('scene-copy').textContent = 'Waiting for the latest game view.';
      $('caption').textContent = 'Connection interrupted · reconnecting automatically';
    }
    if (polling) await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }
}

function draw(timestamp) {
  if (!polling) return;
  if (!document.hidden && renderer && frame && !drawFailed) {
    const alpha = Math.min(1, Math.max(0, (timestamp - receivedAt) / interval));
    try { renderer.draw(frame, previousFrame, alpha, timestamp, { reducedMotion, cameraMode }); }
    catch (error) { useFallback(error); }
  }
  animationId = requestAnimationFrame(draw);
}

window.__snakePresentation = Object.freeze({
  stats: () => ({ ...renderer?.stats(), reducedMotion, cleanFeed, connected: !reconnecting, audio: audio.stats() }),
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
