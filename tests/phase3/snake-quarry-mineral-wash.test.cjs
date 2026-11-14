'use strict';
const {stripR52Canopy} = require('../helpers/snake-r52-canopy-archive.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {stripR50Stone, reapplyR50Stone} = require('../helpers/snake-stone-archive.cjs');
const sourcePath = path.resolve(__dirname, '../../public/snake-stream/world.mjs');
const blob = s => crypto.createHash('sha1').update('blob ' + Buffer.byteLength(s) + '\0').update(s).digest('hex');
function court(world) {
  const mesh = world.group.children.find(x => x.isMesh && x.material?.map?.image?.width === 1024 && x.material.map.image.height === 512);
  assert.ok(mesh, 'actual original courtyard atlas must be bound to 3D stone');
  return mesh;
}
test('R50 quarry mineral weathering has exact prior source, legible center, unchanged public truth and bounded GPU assets', async () => {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const beforeSource = stripR50Stone(source);
  assert.equal(blob(stripR52Canopy(beforeSource)), '0be8970978500ff369bfd0c132ff42aec4bf913b', 'exact verified original GitHub world blob');
  assert.equal(reapplyR50Stone(beforeSource, source), source, 'original atlas block is precisely reversible');
  const THREE = await import('three');
  const {createWorld: previousWorld} = await import('data:text/javascript;base64,' + Buffer.from(beforeSource).toString('base64'));
  const {createWorld} = await import('../../public/snake-stream/world.mjs');
  for (const [width,height] of [[28,16],[8,8]]) {
    const old = previousWorld(THREE, {width,height}), fresh = createWorld(THREE, {width,height});
    try {
      const oldMesh = court(old), newMesh = court(fresh);
      const a = oldMesh.material.map.image.data, b = newMesh.material.map.image.data;
      assert.equal(a.length, b.length);
      let changed = 0, brighter = 0, edgeChanged = 0, opaque = 0;
      for (let y=0; y<512; y++) for (let x=0; x<1024; x++) {
        const i = (y*1024+x)*4;
        const gx = (x+.5)/1024*width, gz = (y+.5)/512*height;
        const border = Math.min(gx,gz,width-gx,height-gz);
        const different = a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2];
        if (different) {
          changed++;
          if (b[i]+b[i+1]+b[i+2] > a[i]+a[i+1]+a[i+2]) brighter++;
          if (border <= 2.85) edgeChanged++;
        }
        if (a[i+3] === 255 && b[i+3] === 255) opaque++;
      }
      assert.ok(changed > (width >= 28 ? 2800 : 1000), `noticeable but contained quarry stone relief ${changed}`);
      assert.equal(brighter, 0, 'weathered stone is darker, never bright hazard or reward tint');
      assert.equal(edgeChanged, 0, 'every water-side and gameplay-edge pixel stays byte-identical');
      assert.equal(opaque, 1024*512, 'all stone remains fully opaque');
      for (const name of ['staticMeshes','geometries','materials','textures','drawObjects','staticInstances'])
        assert.equal(fresh.stats()[name], old.stats()[name], `same GPU budget: ${name}`);
      assert.deepEqual(fresh.cameraOccluders, old.cameraOccluders, 'camera collision-free staging stays original');
      for (const key of ['position','normal','uv']) {
        const p = oldMesh.geometry.getAttribute(key).array;
        const q = newMesh.geometry.getAttribute(key).array;
        assert.equal(Buffer.compare(Buffer.from(p.buffer,p.byteOffset,p.byteLength),Buffer.from(q.buffer,q.byteOffset,q.byteLength)),0,'same 3D geometry: '+key);
      }
      const snapshot = {obstacles:[1,4],hazards:[{cell:2,active:true},{cell:9,active:false}],portals:[{entry:3,exit:width*height-2}],food:{cell:5,kind:'normal'}};
      const immutable = JSON.stringify(snapshot);
      for (const reducedMotion of [true,false]) {
        old.update(snapshot,{time:4,reducedMotion}); fresh.update(snapshot,{time:4,reducedMotion});
        assert.deepEqual(fresh.stats(), old.stats(), 'all original live props, hazard/portal/fruit pools equal');
      }
      assert.equal(JSON.stringify(snapshot), immutable, 'public snapshot authority remains immutable');
    } finally { old.dispose(); fresh.dispose(); }
  }
});
