'use strict';
const {stripR52Canopy} = require('../helpers/snake-r52-canopy-archive.cjs');
const {stripR50Stone} = require('../helpers/snake-stone-archive.cjs');
const { stripR44Fruit } = require('../helpers/snake-fruit-archive.cjs');
const { restorePreR42Water, applyR42Water } = require('../helpers/snake-water-flow-archive.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const worldPath = path.resolve(__dirname, '../../public/snake-stream/world.mjs');
const begin = '      // BEGIN R41 COURTYARD ROOT CHANNELS\n';
const end = '      // END R41 COURTYARD ROOT CHANNELS\n';
const blob = s => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(s) + '\0').update(s).digest('hex');
function atlas(world) {
  const court = world.group.children.find(mesh => mesh.isMesh && mesh.material?.map?.image?.width === 1024
    && mesh.material.map.image.height === 512);
  assert.ok(court, 'inspect original rendered 3D court');
  return { court, data: court.material.map.image.data };
}
test('R41 exact-parent source controls bounded original garden root channels, public cues, geometry and resources', async () => {
  const source = fs.readFileSync(worldPath, 'utf8');
  const a = source.indexOf(begin), b = source.indexOf(end);
  assert.ok(a >= 0 && b > a && source.indexOf(begin, a + 1) < 0, 'single reversible R41 block');
  const previous = source.slice(0, a) + source.slice(b + end.length);
  assert.equal(blob(stripR52Canopy(stripR50Stone(restorePreR42Water(stripR44Fruit(previous))))), '6a4c53673b8ef922ce2363f7c899760c06358b5f', 'exact old GitHub world blob');
  const THREE = await import('three');
  const prior = await import('data:text/javascript;base64,' + Buffer.from(previous).toString('base64'));
  const { createWorld } = await import('../../public/snake-stream/world.mjs');
  for (const [width, height] of [[28,16],[8,8]]) {
    const before = prior.createWorld(THREE, {width,height}), after = createWorld(THREE,{width,height});
    try {
      const old = atlas(before), fresh = atlas(after);
      let changed=0, greener=0, center=0, totalOuter=0, untouchedOuter=0;
      for(let y=0;y<512;y++)for(let x=0;x<1024;x++){
        const gx=(x+.5)/1024*width,gz=(y+.5)/512*height;
        const border=Math.min(gx,gz,width-gx,height-gz), i=(y*1024+x)*4;
        const altered=old.data[i]!==fresh.data[i]||old.data[i+1]!==fresh.data[i+1]||old.data[i+2]!==fresh.data[i+2];
        assert.equal(fresh.data[i+3],255,'no transparency/cue hiding');
        if(border>=3){center+=Number(altered);continue;}
        totalOuter++;
        if(altered){changed++;if(fresh.data[i+1]-fresh.data[i]>=old.data[i+1]-old.data[i])greener++;}
        else untouchedOuter++;
      }
      assert.equal(center,0,'original central playing field bytes unchanged');
      assert.ok(changed>1700,'materially visible root weathering');
      assert.ok(greener>changed*.85,'root channels are greener, not prize-colored');
      assert.ok(untouchedOuter>2000&&changed<totalOuter*.65,'broken roots, never a full green border carpet');
      const priorPositions=old.court.geometry.getAttribute('position').array;
      const freshPositions=fresh.court.geometry.getAttribute('position').array;
      assert.equal(Buffer.compare(Buffer.from(priorPositions.buffer,priorPositions.byteOffset,priorPositions.byteLength),
        Buffer.from(freshPositions.buffer,freshPositions.byteOffset,freshPositions.byteLength)),0,'identical true 3D floor');
      for(const key of ['staticMeshes','drawObjects','geometries','materials','textures','staticInstances'])
        assert.equal(after.stats()[key],before.stats()[key],'resource budget '+key);
      assert.deepEqual(after.cameraOccluders,before.cameraOccluders,'camera occluders remain');
      const snapshot={obstacles:[3],hazards:[{cell:5,active:true}],portals:[{entry:9,exit:width*height-3}],food:{cell:12}};
      const frozen=JSON.stringify(snapshot);
      for(const reducedMotion of [false,true]){
        before.update(snapshot,{time:2.2,reducedMotion});
        after.update(snapshot,{time:2.2,reducedMotion});
      }
      assert.equal(JSON.stringify(snapshot),frozen,'public snapshot immutable');
      assert.deepEqual(after.stats(),before.stats(),'public hazard/portal/effect pools stay live');
    } finally {before.dispose();after.dispose();}
    assert.equal(after.group.children.length,0,'scene disposes');
  }
});
