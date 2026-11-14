'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {restoreBendParent,previousBlob,blob}=require('../fixtures/snake-t2-restore-bend-parent.cjs');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/snake-stream/serpent.mjs'),'utf8');

test('full current snake keeps the immutable original Git source control despite cumulative shader work',()=>{
  assert.match(source,/export function installSingleSampleScaleRelief\(/);
  assert.match(source,/distributeSerpentBendRings\(path\)/);
  const original=restoreBendParent(source);
  assert.equal(blob(original),previousBlob);
  assert.doesNotMatch(original,/installSingleSampleScaleRelief/);
  assert.doesNotMatch(original,/distributeSerpentBendRings/);
});
