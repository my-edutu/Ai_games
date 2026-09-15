const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

const viewport = { width: 390, height: 844, dpr: 3, safeArea: { top: 47, right: 0, bottom: 34, left: 0 } };

function reverseSnapshot() {
  const config = eko.createDefaultConfig({ seed: 'phase4-review1' });
  const state = eko.createInitialState(config);
  const base = eko.createRenderSnapshot(state, []);
  return {
    ...base,
    tick: 420,
    player: { ...base.player, facing: -1, position: { x: 18, y: 0 }, velocity: { x: -6, y: 0 }, movementState: 'grounded' },
  };
}

test('review 1: highlighted safe-route geometry follows authoritative facing and camera commitment space', () => {
  const model = eko.createMainlandMorningPresentation(reverseSnapshot(), [], { viewport, quality: 'high', muted: false, reducedMotion: false });
  const route = model.nodes.find((node) => node.role === 'safe-route');
  const decision = model.nodes.find((node) => node.role === 'decision-preview');
  assert.ok(route && decision);
  const routeMin = route.x - route.width * 0.5;
  const routeMax = route.x + route.width * 0.5;
  assert.ok(routeMin < 18, 'reverse route must extend ahead to the left of Tayo');
  assert.ok(routeMax <= 19.5, 'reverse route should not spend most of its visual weight behind Tayo');
  assert.ok(decision.x < 18, 'decision preview must follow facing');
  assert.ok(routeMin >= model.camera.visibleWorld.minX - 0.5, 'highlighted route must remain within committed camera information');
});
