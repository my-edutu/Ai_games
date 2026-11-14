const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');

const root = resolve(__dirname, '../..');
const path = name => resolve(root, 'public/infinite-tower-climb', name);

test('routine HUD diagnostics preserve source/render liveness without traversing the full Three.js world', async () => {
  const { createTowerLiveHudDiagnostics } = await import(
    pathToFileURL(path('visuals/live-hud-diagnostics.mjs')).href);
  let quickReads = 0;
  const view = {
    hudDiagnostics() {
      quickReads++;
      return {
        renderer: 'three-webgl',
        frames: 12,
        renderProgress: { state: 'current', lastSubmitted: { tick: 475, floor: 9 } },
        renderFault: { state: 'live' },
        resolution: { scale: .72 },
        contextLost: false
      };
    },
    diagnostics() { throw new Error('Full 3D diagnostics must never run in the routine HUD path'); }
  };
  const audio = { diagnostics: () => ({ soundEnabled: false, soundPending: false }) };
  const phase = { diagnostics: () => ({ rendererCommitted: 12 }) };
  const hud = createTowerLiveHudDiagnostics(view, audio, {}, phase);
  assert.equal(quickReads, 1);
  assert.equal(hud.frames, 12);
  assert.equal(hud.renderProgress.lastSubmitted.tick, 475);
  assert.equal(hud.renderProgress.lastSubmitted.floor, 9);
  assert.equal(hud.resolution.scale, .72);
  assert.equal(hud.renderFault.state, 'live');
  assert.equal(hud.requestsInFlight, 1);
  assert.equal(hud.soundEnabled, false);
  assert.equal(hud.presentedPhase.rendererCommitted, 12);
});

test('unavailable graphics remain truthful and fully inspectable forensic diagnostics remain opt-in', async () => {
  const { createTowerLiveHudDiagnostics } = await import(
    pathToFileURL(path('visuals/live-hud-diagnostics.mjs')).href);
  const hud = createTowerLiveHudDiagnostics(null, null, null, null);
  assert.equal(hud.frames, 0);
  assert.equal(hud.renderer, 'unavailable');
  assert.equal(hud.requestsInFlight, 0);
  const app = readFileSync(path('app.js'), 'utf8');
  const scene = readFileSync(path('visuals/scene.mjs'), 'utf8');
  assert.match(app, /createTowerLiveHudDiagnostics\(view, audio, request, presentedPhase\)/);
  assert.match(app, /__TOWER_RENDER_DIAGNOSTICS__\s*=\s*\(\)\s*=>\s*\(\{\s*\.\.\.\(view\?\.diagnostics\(\)/);
  assert.match(scene, /function hudDiagnostics\(\)/);
  assert.match(scene, /return\s*\{\s*accept, setCamera, setMotion, setStale, setQuality, hudDiagnostics, diagnostics, dispose\s*\}/);
  // The full forensic path must keep its raw world/source evidence for
  // genuine external captures; only frequent in-game HUD refresh becomes cheap.
  assert.match(scene, /world:\s*world\.diagnostics\(\)/);
});
