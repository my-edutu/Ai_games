const test = require('node:test');
const assert = require('node:assert/strict');

const character = require('../../dist/games/eko-street-run/src/presentation/character/index.js');
const eko = require('../../dist/games/eko-street-run/src/index.js');

function makeSnapshot(overrides = {}) {
  const config = eko.createDefaultConfig({ seed: 'phase3-character' });
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

const REQUIRED_OUTFITS = [
  'yoruba-agbada-fila',
  'igbo-isi-agu-red-cap',
  'hausa-baban-riga-cap',
  'lagos-streetwear',
];
const REQUIRED_LANDMARKS = ['head', 'leftHand', 'rightHand', 'hips', 'leftFoot', 'rightFoot'];

test('Phase 3 exposes exactly four respectful equal-collision outfit families', () => {
  assert.deepEqual([...character.OUTFIT_IDS].sort(), [...REQUIRED_OUTFITS].sort());
  const outfits = character.listOutfits();
  assert.equal(outfits.length, 4);
  assert.equal(new Set(outfits.map((outfit) => outfit.id)).size, 4);
  for (const outfit of outfits) {
    assert.equal(outfit.collisionProfile, 'tayo-standard');
    assert.deepEqual(outfit.mechanicalModifiers, []);
    assert.equal(typeof outfit.culturalContext, 'string');
    assert.ok(outfit.culturalContext.length >= 24);
    assert.equal(outfit.sourcePolicy, 'original-design');
    for (const landmark of REQUIRED_LANDMARKS) assert.equal(outfit.landmarkVisibility[landmark], true);
    assert.ok(outfit.decorativeEnvelope.minX >= -0.72);
    assert.ok(outfit.decorativeEnvelope.maxX <= 0.72);
    assert.ok(outfit.decorativeEnvelope.minY >= -0.04);
    assert.ok(outfit.decorativeEnvelope.maxY <= 2.18);
    assert.ok(outfit.palette.primary !== outfit.palette.backgroundSafeOutline);
    assert.equal(outfit.behaviouralTraits, undefined);
  }
});

test('outfit selection and character presentation never change authoritative checksum', () => {
  const config = eko.createDefaultConfig({ seed: 'phase3-authority-isolation' });
  const state = eko.createInitialState(config);
  const before = eko.checksumState(state);
  const snapshot = eko.createRenderSnapshot(state, []);
  for (const outfitId of REQUIRED_OUTFITS) {
    const presentation = character.createCharacterPresentation(snapshot, { outfitId });
    assert.equal(presentation.outfit.id, outfitId);
    assert.equal(eko.checksumState(state), before);
  }
});

test('terminal lifecycle has precedence over stale movement state', () => {
  const failed = makeSnapshot({ lifecycle: 'failed', player: { movementState: 'rising', velocity: { x: 4, y: 8 } } });
  const completed = makeSnapshot({ lifecycle: 'completed', player: { movementState: 'falling', velocity: { x: 4, y: -8 } } });
  assert.equal(character.resolveCharacterFrame(failed).animation, 'failure');
  assert.equal(character.resolveCharacterFrame(completed).animation, 'celebration');
});

test('animation resolver exposes explicit traversal and impact semantics', () => {
  assert.equal(character.resolveCharacterFrame(makeSnapshot()).animation, 'idle');
  assert.equal(character.resolveCharacterFrame(makeSnapshot({ player: { movementState: 'grounded', velocity: { x: 5, y: 0 } } })).animation, 'run');
  assert.equal(character.resolveCharacterFrame(makeSnapshot({ player: { movementState: 'rising', velocity: { x: 3, y: 7 } } })).animation, 'ascent');
  assert.equal(character.resolveCharacterFrame(makeSnapshot({ player: { movementState: 'falling', velocity: { x: 3, y: -7 } } })).animation, 'descent');
  assert.equal(character.resolveCharacterFrame(makeSnapshot({ player: { movementState: 'sliding', velocity: { x: 5, y: 0 } } })).animation, 'slide');
  assert.equal(character.resolveCharacterFrame(makeSnapshot({ player: { movementState: 'vaulting', velocity: { x: 5, y: 0 } } })).animation, 'vault');
  assert.equal(character.resolveCharacterFrame(makeSnapshot({ player: { movementState: 'stumbling', stumbleTicksRemaining: 18 } })).animation, 'hit');
  assert.equal(character.resolveCharacterFrame(makeSnapshot({ player: { movementState: 'stumbling', stumbleTicksRemaining: 6 } })).animation, 'recovery');
  assert.equal(character.resolveCharacterFrame(makeSnapshot({ player: { landingCompressionTicksRemaining: 4 } })).animation, 'landing');
});

test('jump event wins takeoff for its semantic tick and stale jump events cannot override current air state', () => {
  const takeoff = makeSnapshot({
    tick: 44,
    player: { movementState: 'rising', velocity: { x: 2, y: 11 } },
    recentEvents: [{ schemaVersion: 1, sequence: 1, tick: 44, type: 'player.jumped', data: {} }],
  });
  const stale = makeSnapshot({
    tick: 48,
    player: { movementState: 'rising', velocity: { x: 2, y: 7 } },
    recentEvents: [{ schemaVersion: 1, sequence: 1, tick: 44, type: 'player.jumped', data: {} }],
  });
  assert.equal(character.resolveCharacterFrame(takeoff).animation, 'takeoff');
  assert.equal(character.resolveCharacterFrame(stale).animation, 'ascent');
});

test('same authoritative tick resolves identical semantic pose across presentation sampling rates', () => {
  const snapshot = makeSnapshot({ tick: 137, player: { movementState: 'grounded', velocity: { x: 5.5, y: 0 } } });
  const at30 = character.createCharacterPresentation(snapshot, { outfitId: 'lagos-streetwear', presentationHz: 30 });
  const at60 = character.createCharacterPresentation(snapshot, { outfitId: 'lagos-streetwear', presentationHz: 60 });
  const at120 = character.createCharacterPresentation(snapshot, { outfitId: 'lagos-streetwear', presentationHz: 120 });
  assert.deepEqual(at30.frame, at60.frame);
  assert.deepEqual(at60.frame, at120.frame);
  assert.deepEqual(at30.pose, at120.pose);
});

test('reduced motion preserves semantic animation while reducing cyclic amplitude', () => {
  const snapshot = makeSnapshot({ tick: 91, player: { movementState: 'grounded', velocity: { x: 6, y: 0 } } });
  const full = character.createCharacterPresentation(snapshot, { reducedMotion: false });
  const reduced = character.createCharacterPresentation(snapshot, { reducedMotion: true });
  assert.equal(full.frame.animation, 'run');
  assert.equal(reduced.frame.animation, 'run');
  assert.ok(Math.abs(reduced.pose.bobY) <= Math.abs(full.pose.bobY));
  assert.ok(Math.abs(reduced.pose.lean) <= Math.abs(full.pose.lean));
});

test('critical pose landmarks stay finite, bounded and visible for every outfit and critical animation', () => {
  const critical = ['idle', 'run', 'takeoff', 'ascent', 'apex', 'descent', 'landing', 'slide', 'vault', 'hit', 'recovery', 'failure'];
  for (const outfitId of REQUIRED_OUTFITS) {
    for (const animation of critical) {
      const pose = character.createPoseForAnimation(animation, 0.42, { reducedMotion: false });
      for (const landmark of REQUIRED_LANDMARKS) {
        const point = pose.landmarks[landmark];
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
        assert.ok(point.x >= -0.72 && point.x <= 0.72, `${outfitId}/${animation}/${landmark} x out of envelope`);
        assert.ok(point.y >= -0.04 && point.y <= 2.18, `${outfitId}/${animation}/${landmark} y out of envelope`);
      }
      const svg = character.renderCharacterSvg({ outfitId, animation, phase: 0.42, reducedMotion: false });
      assert.match(svg, /^<svg\b/);
      for (const landmark of REQUIRED_LANDMARKS) assert.match(svg, new RegExp(`data-landmark="${landmark}"`));
    }
  }
});

test('unknown outfit fails closed without arbitrary fallback ambiguity', () => {
  assert.throws(() => character.getOutfitDefinition('unknown-outfit'), /UNKNOWN_OUTFIT/);
  assert.throws(() => character.createCharacterPresentation(makeSnapshot(), { outfitId: 'unknown-outfit' }), /UNKNOWN_OUTFIT/);
});

test('presentation structures are deeply frozen and reconstructible from the same snapshot', () => {
  const snapshot = makeSnapshot({ tick: 212, player: { movementState: 'falling', velocity: { x: 3, y: -5 } } });
  const a = character.createCharacterPresentation(snapshot, { outfitId: 'yoruba-agbada-fila' });
  const b = character.createCharacterPresentation(snapshot, { outfitId: 'yoruba-agbada-fila' });
  assert.deepEqual(a, b);
  assert.equal(Object.isFrozen(a), true);
  assert.equal(Object.isFrozen(a.outfit), true);
  assert.equal(Object.isFrozen(a.pose), true);
  assert.throws(() => { a.pose.lean = 999; }, TypeError);
});
