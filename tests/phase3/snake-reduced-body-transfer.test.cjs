'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { restorePreR55 } = require('../helpers/snake-r45-archive.cjs');

const file = path.resolve(__dirname, '../../public/snake-stream/serpent.mjs');
const blob = source => crypto.createHash('sha1')
  .update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');
const used = (attribute, components) => Buffer.from(attribute.array.buffer,
  attribute.array.byteOffset, components * attribute.array.BYTES_PER_ELEMENT);

test('R55 reuses only identical reduced public body vertices; every different body, LOD, swallow and live pose still uploads', async () => {
  const source = fs.readFileSync(file, 'utf8');
  const priorSource = restorePreR55(source);
  assert.equal(blob(priorSource), '5c999e0bf4c4f7803527af42da8c680aa1a2144e',
    'exact original character Git blob remains recoverable');
  const THREE = await import('three');
  const { createSerpent: oldFactory } = await import('data:text/javascript;base64,' +
    Buffer.from(priorSource).toString('base64'));
  const { createSerpent } = await import('../../public/snake-stream/serpent.mjs');
  const old = oldFactory(THREE), next = createSerpent(THREE);
  const straight = Object.freeze(Array.from({length: 8}, (_, i) => Object.freeze({x:i,z:0})));
  const disconnected = Object.freeze([
    Object.freeze([{x:0,z:0},{x:1,z:0},{x:2,z:0}].map(Object.freeze)),
    Object.freeze([{x:8,z:6},{x:8,z:7},{x:8,z:8}].map(Object.freeze)),
  ]);
  const preserved = JSON.stringify({straight,disconnected});
  const baseline = next.stats();
  const control = {detail:'low',time:1,delta:1/60,reducedMotion:true,
    runToken:'r55-a',direction:{x:1,z:0},danger:0,food:{x:4,z:4},eating:0};
  const update = (paths,opts) => {old.update(paths,opts);next.update(paths,opts);};
  const compare = label => {
    const a=old.group.getObjectByName('Continuous sculpted serpent body').geometry;
    const b=next.group.getObjectByName('Continuous sculpted serpent body').geometry;
    assert.equal(b.drawRange.count,a.drawRange.count,label+' index count');
    assert.equal(next.stats().bodyVertices,old.stats().bodyVertices,label+' vertex count');
    const vertices=next.stats().bodyVertices;
    for (const attribute of ['position','normal','uv']) {
      const components=vertices*b.attributes[attribute].itemSize;
      assert.equal(Buffer.compare(used(a.attributes[attribute],components),used(b.attributes[attribute],components)),0,
        label+' '+attribute+' GPU payload parity');
    }
    assert.equal(Buffer.compare(used(a.index,a.drawRange.count),used(b.index,b.drawRange.count)),0,
      label+' portal-safe index parity');
    for (const key of ['geometries','materials','textures','bufferBytes','maxBodyRings'])
      assert.equal(next.stats()[key],baseline[key],label+' unchanged bounded '+key);
    const originalHead=old.group.getObjectByName('Expressive head');
    const newHead=next.group.getObjectByName('Expressive head');
    assert.equal(newHead.position.y,originalHead.position.y,label+' meaningful head pose');
  };
  try {
    update([straight],control);
    compare('first reduced pose');
    const body=next.group.getObjectByName('Continuous sculpted serpent body').geometry;
    const initialVersions=['position','normal','uv'].map(k=>body.attributes[k].version);
    const indexVersion=body.index.version;
    for(let i=0;i<8;i++){
      update([straight],{...control,time:2+i*.2});
      compare('frozen reduced frame '+i);
    }
    for(let i=0;i<3;i++) assert.equal(body.attributes[['position','normal','uv'][i]].version,initialVersions[i],
      'no duplicate GPU vertex transfer on unchanged reduced pose');
    assert.equal(body.index.version,indexVersion,'existing R36 topology reuse stays intact');
    assert.equal(next.stats().reducedBodyTransfer.reusedFrames,8);
    assert.ok(next.stats().reducedBodyTransfer.requestedBytesAvoided>0,
      'real Three BufferAttribute upload requests eliminated, not measured GPU bus/FPS');
    update([straight],{...control,time:4,danger:0.95,food:{x:-9,z:2}});
    compare('public danger priority while body remains frozen');
    assert.equal(body.attributes.position.version,initialVersions[0],
      'danger can animate expressive head without uploading identical body vertices');
    update(disconnected,{...control,time:4.2});
    compare('teleport-separated body');
    assert.ok(body.attributes.position.version>initialVersions[0],'portal/body changes must upload');
    assert.equal(next.stats().paths,2,'portal discontinuity preserved');
    const changedVersion=body.attributes.position.version;
    update(disconnected,{...control,time:4.5,detail:'high'});
    compare('high detail transition');
    assert.ok(body.attributes.position.version>changedVersion,'LOD geometry transition must upload');
    const detailVersion=body.attributes.position.version;
    update(disconnected,{...control,time:4.7,detail:'high',eating:0.7});
    compare('active swallow');
    assert.ok(body.attributes.position.version>detailVersion,'active eating geometry must upload');
    const eatingVersion=body.attributes.position.version;
    update(disconnected,{...control,time:4.9,detail:'high',reducedMotion:false,eating:0});
    compare('time-varying live body');
    assert.ok(body.attributes.position.version>eatingVersion,'normal animation must always update');
    assert.equal(JSON.stringify({straight,disconnected}),preserved,'presentation never mutates public paths');
  } finally {old.dispose();next.dispose();}
});
