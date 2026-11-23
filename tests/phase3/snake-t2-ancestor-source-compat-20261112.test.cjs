'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {restoreBendParent,previousBlob,blob}=require('../fixtures/snake-t2-restore-bend-parent.cjs');
const source=fs.readFileSync(path.join(__dirname,'../../public/snake-stream/serpent.mjs'),'utf8');
test('T2 current portal pose can reconstruct immutable original bend parent without loosening SHA',()=>{
  const original=restoreBendParent(source);
  assert.equal(blob(original),previousBlob,'historical source must be byte-identical');
  assert.equal(previousBlob,'c8af8e31e827cb50addabb2782f7f1f4e36faa12');
});
test('T2 ancestor reversal must reject unrecognized portal fragment surgery',()=>{
  const altered=source.replace('const ownDirection = options.fragmentDirections?.[p] || options.direction;',
    'const ownDirection = userInventedHeading;');
  assert.notEqual(altered,source);
  assert.throws(()=>restoreBendParent(altered),/source|heading|reversal|hash|drift/i);
});
