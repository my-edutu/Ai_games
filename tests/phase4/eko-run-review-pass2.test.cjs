const test = require('node:test');
const assert = require('node:assert/strict');
const eko = require('../../dist/games/eko-street-run/src/index.js');

test('review 2: semantic presentation cues are fresh, deduplicated and never future-dated', () => {
  const events = [
    { schemaVersion: 1, sequence: 1, tick: 150, type: 'run.failed', data: { reason: 'old' } },
    { schemaVersion: 1, sequence: 2, tick: 198, type: 'checkpoint.reached', data: { checkpointIndex: 1, x: 10 } },
    { schemaVersion: 1, sequence: 2, tick: 198, type: 'checkpoint.reached', data: { checkpointIndex: 1, x: 10 } },
    { schemaVersion: 1, sequence: 3, tick: 201, type: 'player.landed', data: {} },
  ];
  const cues = eko.createPresentationCues(events, false, 200);
  const semantic = cues.filter((cue) => !cue.id.startsWith('mainland-ambience-'));
  assert.equal(semantic.length, 1);
  assert.equal(semantic[0].id, 'event-2-checkpoint.reached');
  assert.equal(cues.some((cue) => cue.id.includes('run.failed')), false);
  assert.equal(cues.some((cue) => cue.id.includes('player.landed')), false);
  assert.equal(cues.filter((cue) => cue.id === 'event-2-checkpoint.reached').length, 1);
});

test('review 2: muted fresh critical cue keeps caption and visual equivalents', () => {
  const events = [{ schemaVersion: 1, sequence: 9, tick: 297, type: 'run.failed', data: { reason: 'kill-plane' } }];
  const cues = eko.createPresentationCues(events, true, 300);
  const failure = cues.find((cue) => cue.id === 'event-9-run.failed');
  assert.ok(failure);
  assert.equal(failure.priority, 'critical');
  assert.equal(failure.audioToken, null);
  assert.equal(typeof failure.captionKey, 'string');
  assert.equal(typeof failure.visualToken, 'string');
});
