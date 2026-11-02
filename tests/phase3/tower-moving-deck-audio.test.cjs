'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const audioModule = import(pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/audio.mjs')).href);

test('opt-in AI replanning audio follows real distinct selected decks and never predicts a landing', async () => {
  const [{ createTowerAudio }] = await Promise.all([audioModule]);
  const beforeWindow = global.window;
  let oscillators = 0;
  class Param {
    value = 0;
    setTargetAtTime(value) { this.value = value; }
    setValueAtTime(value) { this.value = value; }
    linearRampToValueAtTime(value) { this.value = value; }
    exponentialRampToValueAtTime(value) { this.value = value; }
  }
  class Node {
    connect() { return this; }
    disconnect() {}
    start() {}
    stop() {}
  }
  class FakeContext {
    state = 'suspended';
    currentTime = 0;
    createDynamicsCompressor() { return Object.assign(new Node(), {
      threshold: new Param(), ratio: new Param(),
    }); }
    createGain() { return Object.assign(new Node(), { gain: new Param() }); }
    createOscillator() {
      oscillators++;
      return Object.assign(new Node(), { frequency: new Param(), type: 'sine' });
    }
    async resume() { this.state = 'running'; }
    async close() { this.state = 'closed'; }
  }
  global.window = { AudioContext: FakeContext };
  const audio = createTowerAudio();
  const available = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => ({ id: 'floor-7:' + id }));
  function frame(tick, target, overrides = {}) {
    return { snapshot: {
      lifecycle: 'running', runToken: 'expedition-7', floor: 7, tick, theme: 'foundry',
      player: { x: 120000, y: 80000, vy: 0, vx: 0, state: 'standing',
        health: 4, score: 0, attacking: false },
      intent: { mode: 'aligning', targetPlatformId: 'floor-7:' + target },
      enemies: [], platforms: available, ...overrides,
    }, audio: { voices: [], musicState: 'ascent' } };
  }
  try {
    assert.equal(await audio.setEnabled(true), true);
    assert.equal(oscillators, 3, 'the persistent audio pad uses exactly three voices');
    const first = frame(1, 'a');
    const immutable = JSON.stringify(first);
    audio.accept(first);
    assert.equal(JSON.stringify(first), immutable, 'sound cannot mutate replay snapshots');
    assert.equal(oscillators, 3, 'no first-observation tone on a new run');
    audio.accept(frame(2, 'b'));
    assert.equal(oscillators, 4, 'observed same-floor decision change earns one soft cue');
    audio.accept(frame(2, 'b'));
    assert.equal(oscillators, 4, 'repeated packets never retrigger choice audio');
    audio.accept(frame(3, 'c', { enemies: [{ active: true, kind: 'scout', telegraph: true }] }));
    assert.equal(oscillators, 4, 'imminent genuine enemy attack owns the audio stage');
    audio.accept(frame(4, 'd'));
    assert.equal(oscillators, 5, 'a subsequent genuine new deck target earns a new cue');
    audio.accept(frame(5, 'e', { player: { ...frame(5, 'e').snapshot.player, attacking: true } }));
    assert.equal(oscillators, 5, 'melee action overrides cosmetic route notes');
    audio.accept(frame(6, 'a', { intent: { mode: 'aligning', targetPlatformId: 'nonexistent' } }));
    assert.equal(oscillators, 5, 'a missing platform is not an audible destination');
    audio.accept(frame(7, 'a', { runToken: 'expedition-8' }));
    assert.equal(oscillators, 5, 'a different run cannot reuse old choice history');
    await audio.setEnabled(false);
    audio.accept(frame(8, 'b', { runToken: 'expedition-8' }));
    assert.equal(oscillators, 5, 'viewer mute remains authoritative');
  } finally {
    audio.dispose();
    if (beforeWindow === undefined) delete global.window;
    else global.window = beforeWindow;
  }
});
