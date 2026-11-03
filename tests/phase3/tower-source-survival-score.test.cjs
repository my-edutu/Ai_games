'use strict';
// Real public-source contract, not a full-motion game quality score.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const audio = fs.readFileSync(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/audio.mjs'), 'utf8');
const atmosphere = fs.readFileSync(path.join(__dirname,
  '../../public/infinite-tower-climb/visuals/atmosphere.mjs'), 'utf8');
const detect = vm.runInNewContext(audio.replace(/^export /gm, '') +
  '\nobservedSurvivalChange', {});
const snap = (changes = {}) => ({ runToken: 'expedition', floor: 6, tick: 100,
  lifecycle: 'running', player: { health: 4, maxHealth: 8 }, ...changes });
test('genuine fixed-step critical threshold and relief earn audio states', () => {
  const healthy = snap(), critical = snap({ tick: 101, player: { health: 2, maxHealth: 8 } });
  const relief = snap({ tick: 102, player: { health: 4, maxHealth: 8 } });
  assert.equal(detect(healthy, critical), 'critical');
  assert.equal(detect(critical, relief), 'recovered');
  assert.equal(detect(healthy, relief), null);
});
test('first sight, reconnect, duplicate, skipped packet, fake heal and death never sound', () => {
  const p = snap(), n = snap({ tick: 101, player: { health: 2, maxHealth: 8 } });
  assert.equal(detect(null, n), null);
  for (const q of [
    { ...n, runToken: 'another' }, { ...n, floor: 7 },
    { ...n, tick: 100 }, { ...n, tick: 109 }, { ...n, lifecycle: 'result' },
    { ...n, player: { health: 0, maxHealth: 8 } },
    { ...n, player: { health: 2, maxHealth: 9 } },
    { ...n, player: { health: NaN, maxHealth: 8 } },
  ]) assert.equal(detect(p, q), null);
  assert.equal(detect({ ...p, lifecycle: 'intermission' }, n), null);
});
test('one existing physical atmosphere draw and gesture-gated sound own survival feedback', () => {
  assert.match(audio, /observedSurvivalChange\(lastSurvivalSnapshot, snapshot\)/);
  assert.match(audio, /voices\.size >= 12/);
  assert.match(atmosphere, /new THREE\.InstancedMesh\(geometry, material, MAX_MOTES\)/);
  assert.match(atmosphere, /guardianWarning \? \.30 : \.65/);
  assert.match(atmosphere, /i % 3 === 0 \? 30\.2/);
});
