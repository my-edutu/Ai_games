const test = require('node:test');
const assert = require('node:assert/strict');
const character = require('../../dist/games/eko-street-run/src/presentation/character/index.js');

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16) / 255);
}

function luminance(hex) {
  const channels = rgb(hex).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('every outfit has at least 3:1 dominant-to-outline luminance separation', () => {
  for (const outfit of character.listOutfits()) {
    assert.ok(contrast(outfit.palette.primary, outfit.palette.backgroundSafeOutline) >= 3, `${outfit.id} primary/outline contrast is too weak`);
  }
});

test('reduced motion preserves distinct silhouettes for critical traversal states', () => {
  const states = ['run', 'ascent', 'descent', 'landing', 'slide', 'vault', 'hit', 'recovery'];
  const signatures = states.map((animation) => {
    const pose = character.createPoseForAnimation(animation, 0.37, { reducedMotion: true });
    return JSON.stringify(pose.landmarks);
  });
  assert.equal(new Set(signatures).size, states.length);
});

test('all outfit families share identical gameplay pose landmarks for the same semantic frame', () => {
  const reference = character.createPoseForAnimation('landing', 0.4, { reducedMotion: false });
  for (const outfit of character.listOutfits()) {
    const pose = character.createPoseForAnimation('landing', 0.4, { reducedMotion: false });
    assert.deepEqual(pose.landmarks, reference.landmarks, outfit.id);
    assert.equal(outfit.collisionProfile, 'tayo-standard');
  }
});
