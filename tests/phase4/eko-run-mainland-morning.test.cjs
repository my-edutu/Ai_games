const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const eko = require('../../dist/games/eko-street-run/src/index.js');
const world = require('../../dist/games/eko-street-run/src/presentation/world/index.js');

function snapshot(overrides = {}) {
  const config = eko.createDefaultConfig({ seed: 'phase4-mainland' });
  const state = eko.createInitialState(config);
  const base = eko.createRenderSnapshot(state, []);
  return {
    ...base,
    ...overrides,
    player: { ...base.player, ...(overrides.player || {}) },
    route: { ...base.route, ...(overrides.route || {}) },
    recentEvents: overrides.recentEvents || base.recentEvents,
  };
}

const VIEWPORTS = [
  { width: 390, height: 844, dpr: 3, safeArea: { top: 47, right: 0, bottom: 34, left: 0 } },
  { width: 1366, height: 768, dpr: 1, safeArea: { top: 0, right: 0, bottom: 0, left: 0 } },
];

test('Mainland Morning identity is behavioral and spatial rather than label-dependent', () => {
  const district = world.getMainlandMorningDistrict();
  assert.equal(district.id, 'mainland-morning');
  assert.ok(district.identitySignals.length >= 8);
  const categories = new Set(district.identitySignals.map((signal) => signal.category));
  for (const required of ['road-geometry', 'drainage', 'transport', 'commerce', 'architecture', 'pedestrian-motion', 'soundscape']) {
    assert.equal(categories.has(required), true, `missing identity category ${required}`);
  }
  assert.equal(district.identitySignals.some((signal) => /flag|generic african/i.test(signal.description)), false);
  assert.ok(district.worldNodes.some((node) => node.kind === 'danfo-preview'));
  assert.ok(district.worldNodes.some((node) => node.kind === 'open-drain-preview'));
});

test('world presentation is immutable and cannot mutate authoritative checksum', () => {
  const config = eko.createDefaultConfig({ seed: 'phase4-isolation' });
  const state = eko.createInitialState(config);
  const before = eko.checksumState(state);
  const model = world.createMainlandMorningPresentation(eko.createRenderSnapshot(state, []), [], {
    viewport: VIEWPORTS[1], quality: 'high', muted: false, reducedMotion: false,
  });
  assert.equal(eko.checksumState(state), before);
  assert.equal(Object.isFrozen(model), true);
  assert.equal(Object.isFrozen(model.camera), true);
  assert.equal(Object.isFrozen(model.nodes), true);
});

test('camera preserves commitment visibility and safe-area framing on mobile and desktop', () => {
  for (const viewport of VIEWPORTS) {
    const model = world.createMainlandMorningPresentation(snapshot({
      tick: 180,
      player: { position: { x: 9, y: 0 }, velocity: { x: 6.5, y: 0 }, movementState: 'grounded' },
    }), [], { viewport, quality: 'high', muted: false, reducedMotion: false });
    assert.ok(model.camera.lookAhead >= 4.5);
    assert.ok(model.camera.visibleWorld.minX <= 8.65);
    assert.ok(model.camera.visibleWorld.maxX >= 13.5);
    assert.ok(model.camera.safeFrame.top >= viewport.safeArea.top);
    assert.ok(model.camera.safeFrame.bottom >= viewport.safeArea.bottom);
    assert.equal(model.comprehension.playerVisible, true);
    assert.equal(model.comprehension.safeRouteVisible, true);
    assert.equal(model.comprehension.decisionSpaceVisible, true);
  }
});

test('quality degradation removes ambience before critical gameplay information', () => {
  const snap = snapshot({ tick: 240, player: { position: { x: 12, y: 0 }, velocity: { x: 6, y: 0 } } });
  const high = world.createMainlandMorningPresentation(snap, [], { viewport: VIEWPORTS[1], quality: 'high', muted: false, reducedMotion: false });
  const low = world.createMainlandMorningPresentation(snap, [], { viewport: VIEWPORTS[0], quality: 'low', muted: false, reducedMotion: false });
  assert.ok(low.nodes.length < high.nodes.length);
  for (const role of ['player-anchor', 'safe-route', 'progress-marker', 'decision-preview']) {
    assert.equal(low.nodes.some((node) => node.role === role), true, `low tier removed ${role}`);
  }
  assert.ok(low.quality.ambientDensity < high.quality.ambientDensity);
  assert.equal(low.quality.authoritativeTickRateHz, 60);
});

test('muted and reduced-motion modes preserve critical multimodal cue equivalence', () => {
  const events = [{ schemaVersion: 1, sequence: 7, tick: 100, type: 'checkpoint.reached', data: { checkpointIndex: 1, x: 10 } }];
  const full = world.createMainlandMorningPresentation(snapshot({ tick: 100, recentEvents: events }), events, {
    viewport: VIEWPORTS[1], quality: 'high', muted: false, reducedMotion: false,
  });
  const accessible = world.createMainlandMorningPresentation(snapshot({ tick: 100, recentEvents: events }), events, {
    viewport: VIEWPORTS[0], quality: 'low', muted: true, reducedMotion: true,
  });
  assert.ok(full.cues.length > 0);
  assert.equal(accessible.cues.every((cue) => cue.captionKey && cue.visualToken), true);
  assert.equal(accessible.cues.some((cue) => cue.audioToken !== null), false);
  assert.equal(accessible.motion.maxCameraShake, 0);
  assert.ok(accessible.motion.ambientMotionScale <= 0.25);
});

test('presentation is reconstructible and render-rate independent for the same public snapshot', () => {
  const snap = snapshot({ tick: 377, player: { position: { x: 11.25, y: 0.4 }, velocity: { x: 5, y: -1 } } });
  const options = { viewport: VIEWPORTS[1], quality: 'medium', muted: false, reducedMotion: false };
  const a = world.createMainlandMorningPresentation(snap, [], { ...options, presentationHz: 30 });
  const b = world.createMainlandMorningPresentation(JSON.parse(JSON.stringify(snap)), [], { ...options, presentationHz: 120 });
  assert.deepEqual(a, b);
});

test('Three.js adapter builds a real scene graph without acquiring gameplay authority', () => {
  const model = world.createMainlandMorningPresentation(snapshot(), [], {
    viewport: VIEWPORTS[1], quality: 'medium', muted: false, reducedMotion: false,
  });
  const three = world.createThreeMainlandMorningScene(model);
  assert.equal(three.scene.isScene, true);
  assert.equal(three.camera.isPerspectiveCamera, true);
  assert.equal(three.scene.userData.presentationOnly, true);
  assert.ok(three.scene.children.length >= 5);
  assert.equal(three.scene.getObjectByName('eko-safe-route') !== undefined, true);
});

test('Three.js remains presentation-only by static boundary scan', () => {
  const authorityDirs = ['config', 'state', 'runtime', 'physics', 'rules'];
  for (const dir of authorityDirs) {
    const root = path.join(process.cwd(), 'games/eko-street-run/src', dir);
    const stack = [root];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.isFile() && full.endsWith('.ts')) assert.doesNotMatch(fs.readFileSync(full, 'utf8'), /from ["']three["']|require\(["']three["']\)/);
      }
    }
  }
});

test('invalid viewport and quality inputs fail closed', () => {
  assert.throws(() => world.createMainlandMorningPresentation(snapshot(), [], {
    viewport: { width: 0, height: 844, dpr: 3, safeArea: { top: 0, right: 0, bottom: 0, left: 0 } }, quality: 'high', muted: false, reducedMotion: false,
  }), /INVALID_VIEWPORT/);
  assert.throws(() => world.createMainlandMorningPresentation(snapshot(), [], {
    viewport: VIEWPORTS[1], quality: 'ultra', muted: false, reducedMotion: false,
  }), /INVALID_QUALITY/);
});

test('five-second comprehension contract exposes player route progress and district without decorative dominance', () => {
  const model = world.createMainlandMorningPresentation(snapshot({ tick: 60, player: { position: { x: 3, y: 0 }, velocity: { x: 4, y: 0 } } }), [], {
    viewport: VIEWPORTS[1], quality: 'high', muted: false, reducedMotion: false,
  });
  assert.equal(model.comprehension.pass, true);
  assert.deepEqual(model.visualHierarchy.slice(0, 4), ['player', 'safe-route', 'decision-preview', 'progress']);
  assert.ok(model.identityScore >= 0.8);
  assert.ok(model.decorativeLoad <= 0.45);
});
