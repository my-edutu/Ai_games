'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const publicRoot = path.resolve(__dirname, '../../public/complete-runtime');
const policyPath = path.join(publicRoot, 'audio-policy.js');
const enginePath = path.join(publicRoot, 'audio3d.js');

function loadPolicy() {
  assert.equal(fs.existsSync(policyPath), true, 'audio-policy.js must exist');
  const context = { globalThis: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(policyPath, 'utf8'), context, { filename: policyPath });
  return context.globalThis.MarbleAudioPolicy;
}

test('audio policy caps semantic contact voices and rejects weak impacts', () => {
  const policy = loadPolicy();
  assert.ok(policy);
  assert.ok(policy.MAX_VOICES > 0 && policy.MAX_VOICES <= 8);
  const state = policy.createState();
  const events = Array.from({ length: 20 }, (_, index) => ({
    seq: index + 1,
    type: 'physics-contact',
    data: { kind: index % 2 === 0 ? 'marble' : 'bumper', impulse: 4_000 + index * 100, marbleId: index % 8 },
  }));
  events.push({ seq: 30, type: 'physics-contact', data: { kind: 'world', impulse: 1, marbleId: 1 } });
  const cues = policy.selectCues(events, state, 1_000);
  assert.ok(cues.length <= policy.MAX_VOICES);
  assert.equal(cues.some((cue) => cue.impulse <= policy.MIN_IMPULSE), false);
  assert.equal(cues.every((cue) => ['marble', 'bumper', 'sweeper', 'obstacle', 'world'].includes(cue.kind)), true);
});

test('audio policy is idempotent across repeated snapshots and respects cooldowns', () => {
  const policy = loadPolicy();
  const state = policy.createState();
  const event = { seq: 10, type: 'physics-contact', data: { kind: 'sweeper', impulse: 7_500, marbleId: 2 } };
  const first = policy.selectCues([event], state, 2_000);
  const duplicate = policy.selectCues([event], state, 2_020);
  const next = policy.selectCues([{ ...event, seq: 11 }], state, 2_030);
  assert.equal(first.length, 1);
  assert.equal(duplicate.length, 0);
  assert.equal(next.length, 0);
});

test('audio engine is bounded, opt-in, and consumes only sanitized snapshots', () => {
  assert.equal(fs.existsSync(enginePath), true, 'audio3d.js must exist');
  const source = fs.readFileSync(enginePath, 'utf8');
  assert.match(source, /MarbleAudioPolicy/);
  assert.match(source, /sound-toggle/);
  assert.match(source, /createDynamicsCompressor/);
  assert.match(source, /activeVoices/);
  assert.match(source, /\/api\/snapshot/);
  assert.doesNotMatch(source, /chat|payment|operatorToken|rootSeed|tournamentSeed/);
});
