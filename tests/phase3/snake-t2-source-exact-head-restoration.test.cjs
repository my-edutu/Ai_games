'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {restoreBendParent,previousBlob,blob} = require('../fixtures/snake-t2-restore-bend-parent.cjs');

// This is a browser-import provenance gate, not a visual/performance success.
test('scaled, physically grounded T2 head restores the genuine immutable df113 bend parent', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../public/snake-stream/serpent.mjs'), 'utf8');
  assert.equal(blob(restoreBendParent(source)), previousBlob);
  assert.match(source, /head\.scale\.setScalar\(1\.28\)/);
  assert.match(source, /headGroundingLift/);
  assert.doesNotMatch(restoreBendParent(source), /headGroundingLift|head\.scale\.setScalar/);
  assert.throws(() => restoreBendParent(source.replace('head.scale.setScalar(1.28);', 'head.scale.setScalar(1.31);')),
    /head-scale reversal drift/, 'head-size drift must not forge an old source');
  assert.throws(() => restoreBendParent(source.replace('(head.scale.y - 1) * 0.38;', '(head.scale.y - 1) * 0.41;')),
    /head grounding reversal drift/, 'ground contact drift must fail closed');
  assert.throws(() => restoreBendParent(source.replace('const bellyRib = Math.pow(', 'const bellyRib = Math.max(0, Math.pow(')),
    /Original exact Git source hash mismatch/, 'unrecognized changes cannot forge the parent');
});
