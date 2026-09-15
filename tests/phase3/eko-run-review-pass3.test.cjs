const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');
const character = require('../../dist/games/eko-street-run/src/presentation/character/index.js');

function snapshot(seed = 'phase3-review3') {
  const config = eko.createDefaultConfig({ seed });
  const state = eko.createInitialState(config);
  state.tick = 321;
  state.player.velocity = { x: 4.5, y: -2.25 };
  state.player.movementState = 'falling';
  return eko.createRenderSnapshot(state, []);
}

test('malformed public snapshot facing fails closed instead of silently becoming right-facing', () => {
  const base = snapshot();
  const malformed = { ...base, player: { ...base.player, facing: 0 } };
  assert.throws(() => character.createCharacterPresentation(malformed), /INVALID_PRESENTATION_SNAPSHOT: facing/);
});

test('SVG adapter rejects invalid facing instead of collapsing directional landmarks', () => {
  assert.throws(() => character.renderCharacterSvg({
    outfitId: 'lagos-streetwear',
    animation: 'run',
    phase: 0.25,
    facing: 0,
  }), /INVALID_FACING/);
});

test('JSON round-trip renderer restart reconstructs identical character presentation', () => {
  const base = snapshot('phase3-restart');
  const serialized = JSON.parse(JSON.stringify(base));
  const before = character.createCharacterPresentation(base, { outfitId: 'hausa-baban-riga-cap', reducedMotion: true });
  const after = character.createCharacterPresentation(serialized, { outfitId: 'hausa-baban-riga-cap', reducedMotion: true });
  assert.deepEqual(after, before);
});

test('large safe integer ticks keep animation phase finite and bounded', () => {
  const base = snapshot('phase3-large-tick');
  const huge = { ...base, tick: Number.MAX_SAFE_INTEGER - 8 };
  const frame = character.resolveCharacterFrame(huge);
  assert.ok(Number.isFinite(frame.phase));
  assert.ok(frame.phase >= 0 && frame.phase < 1);
  assert.ok(Number.isInteger(frame.semanticTick));
});

test('presentation generation remains bounded under repeated reconstruction', () => {
  const base = snapshot('phase3-bounded');
  for (let index = 0; index < 2000; index += 1) {
    const candidate = { ...base, tick: base.tick + index };
    const presentation = character.createCharacterPresentation(candidate, {
      outfitId: character.OUTFIT_IDS[index % character.OUTFIT_IDS.length],
      reducedMotion: index % 2 === 0,
      presentationHz: [30, 60, 120][index % 3],
    });
    assert.ok(presentation.frame.phase >= 0 && presentation.frame.phase < 1);
    assert.ok(Number.isFinite(presentation.pose.landmarks.head.x));
    assert.ok(Number.isFinite(presentation.pose.landmarks.head.y));
  }
});
