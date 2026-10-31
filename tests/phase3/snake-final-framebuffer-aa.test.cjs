'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const file = path.resolve(__dirname, '../../public/snake-stream/renderer.mjs');
const oldLine = "  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });\n";
const block = /^.*\/\/ BEGIN R40 FINAL FRAMEBUFFER SAMPLES\n[\s\S]*?^.*\/\/ END R40 FINAL FRAMEBUFFER SAMPLES\n/gm;
const gitBlob = source => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');

test('R40 final framebuffer policy is byte-reversible to verified production parent, preserving static MSAA and truthful presentation', () => {
  const source = fs.readFileSync(file, 'utf8');
  assert.equal((source.match(block) || []).length, 1, 'one bounded R40 production change');
  const predecessor = source.replace(block, oldLine);
  assert.equal(gitBlob(predecessor), 'dce31f68dcc0a28b5792a502f6575e7939f6289d', 'actual prior Git blob');
  assert.ok(predecessor.includes('antialias: true, alpha: false'), 'genuine predecessor AA policy');
  assert.ok(source.includes('antialias: false, alpha: false'), 'current final canvas is single-sample');
  assert.equal(source.split('samples: cacheSamples').length, 2, 'static-world target retains original MSAA');
  for (const marker of ['frameGate.canDraw()', 'frameGate.submitted()', 'buildMotion(snapshot',
    'world.update(snapshot', 'syncContactShadowInstances(contacts', 'renderer.shadowMap.enabled = true',
    "onFailure?.('The 3D context was interrupted.')"]) {
    assert.ok(source.includes(marker), 'retain rendering and recovery invariant: '+marker);
  }
});
