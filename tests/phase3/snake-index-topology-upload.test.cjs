'use strict';
const { restorePreR45 } = require('../helpers/snake-r45-archive.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const sourcePath = path.resolve(__dirname, '../../public/snake-stream/serpent.mjs');
const blocks = /^[ \t]*\/\/ BEGIN R36 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R36 [^\n]*\n/gm;
const blob = source => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');
const usedBytes = (array, count) => Buffer.from(array.buffer, array.byteOffset, count * array.BYTES_PER_ELEMENT);

test('living serpent reuses unchanged GPU index topology without dropping portal breaks, poses, or LOD transitions', async () => {
  const THREE = await import('three');
  const source = fs.readFileSync(sourcePath, 'utf8');
  const blocksFound = source.match(blocks) || [];
  assert.equal(blocksFound.length, 7, 'exactly seven bounded production additions');
  const original = source.replace(blocks, '');
  const r37Blocks = /^[ \t]*\/\/ BEGIN R37 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R37 [^\n]*\n/gm;
  const r39Blocks = /^[ \t]*\/\/ BEGIN R39 [^\n]*\n[\s\S]*?^[ \t]*\/\/ END R39 [^\n]*\n/gm;
  assert.equal((source.match(r39Blocks) || []).length, 3, 'R39 remains in BOTH old/new rendered arms');
  assert.equal((original.match(r37Blocks) || []).length, 2);
  // The previous R36 implementation shares the later eyelid choreography:
  // removing R37 is ONLY for its exact archived Git hash, never visual/model A/B.
  assert.equal(blob(restorePreR45(original.replace(r37Blocks, '').replace(r39Blocks, ''))), 'feb317e2c4f8465ff77f33f4d400a4292a795330', 'control is the verified prior Git blob');
  const { createSerpent: createPrior } = await import('data:text/javascript;base64,' + Buffer.from(original).toString('base64'));
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const previous = createPrior(THREE), current = createSerpent(THREE);
  const line = Object.freeze(Array.from({length: 9}, (_, i) => Object.freeze({x: 0, z: i})));
  const arc = Object.freeze([{x: 0,z: 0},{x: 0,z: 1},{x: 1,z: 1},{x: 2,z: 1},{x: 3,z: 1}].map(Object.freeze));
  const gap = Object.freeze([[{x: 1,z: 0},{x: 1,z: 1},{x: 1,z: 2}],
    [{x: -4,z: -3},{x: -4,z: -2},{x: -4,z: -1},{x: -4,z: 0}]].map(part => Object.freeze(part.map(Object.freeze))));
  const broken = Object.freeze([[{x: 5,z: 5}], [{x: -3,z: -2},{x: -3,z: -1}]].map(part => Object.freeze(part.map(Object.freeze))));
  const cases = [
    ...Array.from({length: 9}, (_, i) => ({paths:[line], detail:'low', time:.3+i*.17, runToken:'a'})),
    {paths:[arc], detail:'low', time:3.1,runToken:'a'},
    {paths:gap,detail:'low',time:3.3,runToken:'a'},
    {paths:gap,detail:'low',time:3.9,runToken:'a',reducedMotion:true},
    {paths:broken,detail:'low',time:4.2,runToken:'a'},
    {paths:[line],detail:'high',time:4.4,runToken:'b'},
    {paths:[line],detail:'high',time:4.6,runToken:'b'},
    {paths:[line],detail:'low',time:4.8,runToken:'b'},
    {paths:[line],detail:'low',time:5.0,runToken:'b'},
  ];
  const frozen = JSON.stringify(cases);
  const beforeBudget = current.stats();
  try {
    let stableIndexVersion, stablePositionVersion;
    for (let i = 0; i < cases.length; i++) {
      const {paths, detail, time, runToken, reducedMotion=false} = cases[i];
      const options = {detail,time,runToken,reducedMotion,delta:1/60,direction:{x:0,z:-1},danger:.2,food:{x:2,z:2}};
      previous.update(paths, options);
      current.update(paths, options);
      const a = previous.group.getObjectByName('Continuous sculpted serpent body').geometry;
      const b = current.group.getObjectByName('Continuous sculpted serpent body').geometry;
      assert.equal(b.drawRange.count,a.drawRange.count,'same live triangle count case '+i);
      assert.equal(current.stats().bodyRings,previous.stats().bodyRings,'same ring count case '+i);
      const active = detail==='low'?9:21, rings=current.stats().bodyRings;
      for (const [attribute, components] of [['position',3],['normal',3],['uv',2]]) {
        const x=a.attributes[attribute].array, y=b.attributes[attribute].array;
        assert.equal(Buffer.compare(usedBytes(x,rings*active*components),usedBytes(y,rings*active*components)),0,
          attribute+' exact live vertex parity case '+i);
      }
      assert.equal(Buffer.compare(usedBytes(a.index.array,a.drawRange.count),usedBytes(b.index.array,b.drawRange.count)),0,
        'same live index bytes and portal discontinuities case '+i);
      if(i===0){stableIndexVersion=b.index.version;stablePositionVersion=b.attributes.position.version;}
      if(i>0&&i<9){
        assert.equal(b.index.version,stableIndexVersion,'steady topology must not re-upload index data');
        assert.ok(b.attributes.position.version>stablePositionVersion,'animated body positions continue updating');
      }
      if(i===10||i===13||i===15) assert.ok(b.index.version>stableIndexVersion,'changing topology/LOD must update index buffer');
    }
    const now=current.stats();
    assert.ok(now.indexReuseFrames>=10,'reused at least ten actual CPU index-upload requests');
    assert.ok(now.indexUploadRequests<cases.length-9,'only true topology transitions require index uploads');
    assert.equal(now.truncated,false,'no body cap truncation');
    for(const key of ['geometries','materials','textures','bufferBytes','maxBodyRings'])
      assert.equal(now[key],beforeBudget[key],'unchanged resource budget '+key);
    assert.equal(JSON.stringify(cases),frozen,'rendering may never alter immutable public motion paths');
  } finally { previous.dispose(); current.dispose(); }
});
