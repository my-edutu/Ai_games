const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function snapshot(overrides = {}) {
  const config = eko.createDefaultConfig({ seed: 'phase4-review3' });
  const state = eko.createInitialState(config);
  const base = eko.createRenderSnapshot(state, []);
  return {
    ...base,
    tick: overrides.tick ?? 360,
    player: {
      ...base.player,
      position: overrides.position ?? { x: 15, y: 0 },
      velocity: overrides.velocity ?? { x: 6.2, y: 0 },
      movementState: overrides.movementState ?? 'grounded',
    },
  };
}

const PORTRAIT = {
  width: 390,
  height: 844,
  dpr: 3,
  safeArea: { top: 47, right: 0, bottom: 34, left: 0 },
};

const LANDSCAPE = {
  width: 1366,
  height: 768,
  dpr: 1,
  safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
};

for (const viewport of [PORTRAIT, LANDSCAPE]) {
  test(`review 3: Three camera projection preserves ${viewport.width}x${viewport.height} viewport aspect`, () => {
    const model = eko.createMainlandMorningPresentation(snapshot(), [], {
      viewport,
      quality: 'high',
      muted: false,
      reducedMotion: false,
    });
    const three = eko.createThreeMainlandMorningScene(model);
    const expectedAspect = viewport.width / viewport.height;
    assert.ok(Math.abs(model.camera.aspect - expectedAspect) < 1e-12, 'camera plan must retain the validated viewport aspect');
    assert.ok(Math.abs(three.camera.aspect - expectedAspect) < 1e-12, 'Three projection must use the exact planned viewport aspect');
    assert.ok(Math.abs(three.camera.aspect - model.camera.aspect) < 1e-12, 'planned and rendered camera projections must agree');
  });
}

test('review 3: five-second progress claim is backed by an actually visible progress marker', () => {
  const model = eko.createMainlandMorningPresentation(snapshot({
    tick: 60,
    position: { x: 3, y: 0 },
    velocity: { x: 4, y: 0 },
  }), [], {
    viewport: PORTRAIT,
    quality: 'low',
    muted: true,
    reducedMotion: true,
  });
  const progress = model.nodes.find((node) => node.role === 'progress-marker');
  assert.ok(progress, 'presentation must expose a progress marker');
  const halfWidth = progress.width * 0.5;
  const actuallyVisible = progress.x - halfWidth >= model.camera.visibleWorld.minX
    && progress.x + halfWidth <= model.camera.visibleWorld.maxX;
  assert.equal(actuallyVisible, true, 'progress marker must be inside the committed camera region');
  assert.equal(model.comprehension.progressVisible, actuallyVisible, 'comprehension must report measured visibility rather than a hard-coded pass');
  assert.equal(model.comprehension.pass, true);
});
