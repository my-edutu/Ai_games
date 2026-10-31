'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repo = path.resolve(__dirname, '../..');
const pathToWorld = path.join(repo, 'public/snake-stream/world.mjs');
const START = '      // BEGIN R35 PERIMETER LICHEN\n';
const END = '      // END R35 PERIMETER LICHEN\n';
const removeSlice = source => {
  const a = source.indexOf(START), b = source.indexOf(END);
  assert.ok(a >= 0 && b > a, 'R35 perimeter lichen source is isolated and reversible');
  assert.equal(source.indexOf(START, a + 1), -1, 'only one perimeter-limited material treatment');
  return source.slice(0, a) + source.slice(b + END.length);
};
const loadWorld = source => import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

function fieldData(world) {
  const mesh = world.group.children.find(object => object.isMesh && object.material?.map?.image?.width === 1024 && object.material.map.image.height === 512);
  assert.ok(mesh, 'find the actual authored 3D courtyard texture');
  return mesh.material.map.image.data;
}

test('perimeter-lichen patina keeps the central board byte-identical and the moss at the inhabited garden edge', async () => {
  const THREE = await import('three');
  const current = fs.readFileSync(pathToWorld, 'utf8');
  const previous = removeSlice(current);
  const [beforeFactory, afterFactory] = await Promise.all([loadWorld(previous), loadWorld(current)]);
  for (const [width, height] of [[28,16],[8,8]]) {
    const before = beforeFactory.createWorld(THREE,{width,height});
    const after = afterFactory.createWorld(THREE,{width,height});
    try {
      const old = fieldData(before), fresh = fieldData(after), w = 1024, h = 512;
      let edgeChanged = 0, edgeGreener = 0, innerChanged = 0, untouchedEdge = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const gx = (x+.5)/w*width, gz=(y+.5)/h*height;
        const border = Math.min(gx,width-gx,gz,height-gz);
        const offset = (y*w+x)*4;
        const changed = fresh[offset] !== old[offset] || fresh[offset+1] !== old[offset+1] || fresh[offset+2] !== old[offset+2];
        assert.equal(fresh[offset+3],255, 'no transparency or lost food/hazard occlusion');
        if (border >= 3) innerChanged += +changed;
        else if (changed) {
          edgeChanged++;
          if ((fresh[offset+1]-fresh[offset]) > (old[offset+1]-old[offset])) edgeGreener++;
        } else untouchedEdge++;
      }
      assert.equal(innerChanged, 0, 'all central path and HUD-critical playing cells retain their old pigment bytes');
      assert.ok(edgeChanged > 2200, `visible lichen coverage near garden border, got ${edgeChanged}`);
      assert.ok(edgeGreener > edgeChanged * .80, `ratio ${edgeGreener}/${edgeChanged}: ` + 'affected stone becomes greener rather than disguised as a reward/hazard');
      assert.ok(untouchedEdge > 2200, 'avoid an artificial continuous green rectangle around the garden');
      for (const name of ['staticMeshes','drawObjects','geometries','materials','textures','staticInstances'])
        assert.equal(after.stats()[name], before.stats()[name], `${name} does not grow`);
      assert.equal(after.stats().staticMeshes,13);
      assert.equal(after.stats().textures,4);
      assert.deepEqual(after.cameraOccluders,before.cameraOccluders, 'no changes to sightline occluders');
      const snapshot={obstacles:[0],hazards:[{cell:1,active:true}],portals:[{entry:2,exit:width*height-2}],food:{cell:3,kind:'normal'}};
      for (const reducedMotion of [false,true]) {
        before.update(snapshot,{time:1.6,reducedMotion});
        after.update(snapshot,{time:1.6,reducedMotion});
      }
      assert.deepEqual(after.stats(),before.stats(), 'all public cue pools, live hazard phases and resource counts unchanged');
    } finally { after.dispose(); before.dispose(); }
  }
});
