'use strict';
// Original audio is opt-in, and gate cues must follow actual public gameplay.
// This source-backed contract is safety evidence, NOT independent game review.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createTowerAudio } = require('../../public/infinite-tower-climb/visuals/audio.mjs');

function fakeAudio() {
  const pitches = [];
  class Param {
    constructor() { this.value = 0; }
    setValueAtTime(value) { this.value = value; pitches.push(value); }
    setTargetAtTime(value) { this.value = value; }
    linearRampToValueAtTime(value) { this.value = value; }
    exponentialRampToValueAtTime(value) { this.value = value; }
  }
  class Node {
    connect() {}
    disconnect() {}
    start() {}
    stop() {}
  }
  class FakeContext {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = new Node(); }
    createGain() { const n = new Node(); n.gain = new Param(); return n; }
    createDynamicsCompressor() { const n = new Node(); n.threshold = new Param(); n.ratio = new Param(); return n; }
    createOscillator() { const n = new Node(); n.frequency = new Param(); return n; }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
  }
  return { FakeContext, pitches };
}
function frame({ runToken = 'stable-run', floor = 8, guardian = true,
  health = 8, maxHealth = 8, active = true, score = 0 } = {}) {
  return {
    scene: 'running', snapshot: {
      runToken, floor, theme: 'ruins', tick: 100,
      lifecycle: 'running', player: {state:'standing', x: 180000,
        y: 3150000, vx:0, vy:0, health:5, maxHealth:5, score},
      enemies: guardian ? [{ id: `f${floor}:guardian`, kind:'guardian',
        health, maxHealth, active, telegraph:false }] : [],
      intent: {mode:'engaging-enemy'}, progress: {floorsCleared:floor},
    },
    audio: { voices: [], musicState: 'guardian' },
  };
}
test('opt-in guardian audio communicates actual damage and a real guardian-floor transition once', async () => {
  const {FakeContext,pitches} = fakeAudio();
  const oldWindow = global.window;
  global.window = {AudioContext:FakeContext};
  const audio = createTowerAudio();
  try {
    assert.equal(await audio.setEnabled(true),true);
    audio.accept(frame());
    assert.deepEqual(pitches,[], 'a living full-health guardian is not a reward');
    audio.accept(frame({health:5}));
    assert.ok(pitches.includes(150), 'real same-floor boss damage gets restrained metal feedback');
    const n = pitches.length;
    audio.accept(frame({health:5}));
    assert.equal(pitches.length,n, 'replayed snapshot must not repeat damage');
    audio.accept(frame({floor:9,guardian:false}));
    assert.ok([104,220,330,440].every(x=>pitches.includes(x)),
      'the actual authority cleared a still-active guardian gate on the floor transition');
    const m = pitches.length;
    audio.accept(frame({floor:9,guardian:false}));
    assert.equal(pitches.length,m,'identical snapshot cannot repeat a win chord');
  } finally {
    audio.dispose();
    if(oldWindow===undefined)delete global.window;else global.window=oldWindow;
  }
});
test('no fabricated gate award across a new run, unrelated floor, or muted playback', async () => {
  const {FakeContext,pitches} = fakeAudio();
  const oldWindow = global.window;
  global.window = {AudioContext:FakeContext};
  const audio = createTowerAudio();
  try {
    await audio.setEnabled(true);
    audio.accept(frame());
    audio.accept(frame({runToken:'new-run',floor:9,guardian:false}));
    assert.equal(pitches.filter(x=>x===220).length,0,'restart cannot masquerade as a guardian defeat');
    assert.equal(pitches.filter(x=>x===104).length,0,'restart cannot fabricate the mechanical release');
    audio.accept(frame({runToken:'new-run',floor:11,guardian:false}));
    assert.equal(pitches.filter(x=>x===220).length,0,'an unrelated floor skip is not a gate kill');
    audio.accept(frame({runToken:'new-run',floor:12,guardian:true,health:8}));
    audio.setEnabled(false);
    const before=pitches.length;
    audio.accept(frame({runToken:'new-run',floor:13,guardian:false}));
    assert.equal(pitches.length,before,'muted listeners must not hear the transition');
  } finally {
    audio.dispose();
    if(oldWindow===undefined)delete global.window;else global.window=oldWindow;
  }
});
