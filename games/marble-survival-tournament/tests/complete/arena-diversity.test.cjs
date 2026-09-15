'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const runtimePath = path.resolve(__dirname, '../../../../dist/games/marble-survival-tournament/src/index.js');
const {
  NamedRng,
  parseMarbleConfig,
  generateMarbleArena,
  generateMarbleArenaCandidate,
  validateMarbleArena,
} = require(runtimePath);

function bucket(value, size) {
  return Math.round(value / size);
}

function structuralFingerprint(arena) {
  return JSON.stringify({
    lanes: arena.safeLanes.map((value) => bucket(value, 300)),
    obstacles: arena.obstacles.map((item) => [bucket(item.x, 400), bucket(item.y, 500), bucket(item.width, 200), bucket(item.height, 180)]),
    bumpers: arena.bumpers.map((item) => [bucket(item.x, 400), bucket(item.y, 500), bucket(item.radius, 100)]),
    hazards: arena.hazards.map((item) => [item.kind, bucket(item.x, 400), bucket(item.y, 500), bucket(item.width, 300), bucket(item.height, 250)]),
    wind: arena.windZones.map((item) => [bucket(item.x, 500), bucket(item.y, 500), Math.sign(item.forceX), Math.sign(item.forceY), bucket(Math.abs(item.forceX), 2)]),
    sweepers: arena.sweepers.map((item) => [item.axis, bucket(item.baseX, 400), bucket(item.baseY, 500), bucket(item.amplitude, 300), bucket(item.periodTicks, 30)]),
  });
}

function mirroredChampionship(arena) {
  const centre = arena.width / 2;
  const left = arena.obstacles.filter((item) => item.x + item.width <= centre).sort((a, b) => a.y - b.y);
  const right = arena.obstacles.filter((item) => item.x >= centre).sort((a, b) => a.y - b.y);
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a.y !== b.y || a.width !== b.width || a.height !== b.height) return false;
    if (Math.abs((a.x + a.width / 2) + (b.x + b.width / 2) - arena.width) > 1) return false;
  }
  if (arena.bumpers.length % 2 !== 0) return false;
  const bumpers = arena.bumpers.slice().sort((a, b) => a.x - b.x);
  for (let index = 0; index < bumpers.length / 2; index += 1) {
    const a = bumpers[index];
    const b = bumpers[bumpers.length - 1 - index];
    if (a.y !== b.y || a.radius !== b.radius) return false;
    if (Math.abs(a.x + b.x - arena.width) > 1) return false;
  }
  return true;
}

test('championship candidate exposes validator diagnostics before fallback', () => {
  assert.equal(typeof generateMarbleArenaCandidate, 'function');
  const config = parseMarbleConfig();
  const candidate = generateMarbleArenaCandidate(config, 4, NamedRng.fromSeed('marble-diversity-r4-s0'));
  const report = validateMarbleArena(candidate, config);
  assert.equal(report.valid, true, JSON.stringify({ lanes: candidate.safeLanes, obstacles: candidate.obstacles, issues: report.issues }, null, 2));
});

test('arena generation produces meaningful structural diversity without fallback', () => {
  const config = parseMarbleConfig();
  const seedCount = 12;
  for (let roundIndex = 0; roundIndex < 5; roundIndex += 1) {
    const fingerprints = new Set();
    for (let seedIndex = 0; seedIndex < seedCount; seedIndex += 1) {
      const rng = NamedRng.fromSeed(`marble-diversity-r${roundIndex}-s${seedIndex}`);
      const arena = generateMarbleArena(config, roundIndex, rng);
      const report = validateMarbleArena(arena, config);
      assert.equal(report.valid, true, `round ${roundIndex} seed ${seedIndex}: ${JSON.stringify(report.issues)}`);
      assert.equal(arena.fallbackUsed, false, `round ${roundIndex} seed ${seedIndex} unexpectedly used fallback`);
      fingerprints.add(structuralFingerprint(arena));
    }
    assert.ok(fingerprints.size >= 4, `round ${roundIndex} only produced ${fingerprints.size} structural variants across ${seedCount} seeds`);
  }
});

test('championship variants remain exactly mirrored and deterministic', () => {
  const config = parseMarbleConfig();
  for (let seedIndex = 0; seedIndex < 8; seedIndex += 1) {
    const seed = `marble-championship-fairness-${seedIndex}`;
    const first = generateMarbleArena(config, 4, NamedRng.fromSeed(seed));
    const second = generateMarbleArena(config, 4, NamedRng.fromSeed(seed));
    assert.equal(structuralFingerprint(first), structuralFingerprint(second));
    assert.equal(mirroredChampionship(first), true, `championship seed ${seedIndex} lost mirror fairness`);
  }
});
