'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { restorePreR56Portrait } = require('../helpers/snake-r56-portrait-camera-archive.cjs');
const file = path.resolve(__dirname, '../../public/snake-stream/camera.mjs');
const gitBlob = source => crypto.createHash('sha1')
  .update('blob ' + Buffer.byteLength(source) + '\0').update(source).digest('hex');

test('R56 tall portrait shows more of the real garden without clipping a cell or changing other camera modes', async () => {
  const source = fs.readFileSync(file, 'utf8'), prior = restorePreR56Portrait(source);
  assert.equal(gitBlob(prior), 'c40b3dafd5becf38e77c72e7b8d7dba5414f6c12',
    'pre-R56 camera bytes are exactly the original Git object');
  const THREE = await import('three');
  const { cameraComposition: before } = await import('data:text/javascript;base64,'+
    Buffer.from(prior).toString('base64'));
  const { cameraComposition: after } = await import('../../public/snake-stream/camera.mjs');
  const bounds = (plan, aspect, width, height) => {
    const camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 180);
    camera.position.set(plan.target.x+plan.offset.x,plan.target.y+plan.offset.y,plan.target.z+plan.offset.z);
    camera.lookAt(plan.target.x,plan.target.y,plan.target.z);
    camera.updateMatrixWorld();
    const corners = [-width/2,width/2].flatMap(x =>
      [-height/2,height/2].map(z=>new THREE.Vector3(x,0,z).project(camera)));
    const xs=corners.map(v=>v.x), ys=corners.map(v=>v.y);
    return { vertical:Math.max(...ys)-Math.min(...ys),
      horizontal:Math.max(...xs)-Math.min(...xs),
      maxX:Math.max(...xs.map(Math.abs)),maxY:Math.max(...ys.map(Math.abs)) };
  };
  for (const [width,height] of [[28,16],[8,8],[40,24]]) {
    for (const aspect of [390/844,368/598]) {
      const args={width,height,aspect,mode:'overview',head:{x:0,z:0},direction:{x:0,z:1}};
      const beforePlan=before(args), afterPlan=after(args);
      assert.deepEqual(afterPlan.target,beforePlan.target,'fixed authority-facing world center');
      const oldSize=bounds(beforePlan,aspect,width,height), nextSize=bounds(afterPlan,aspect,width,height);
      assert.ok(nextSize.maxX<0.94 && nextSize.maxY<0.94,
        'all real board corners remain safely in portrait perspective');
      assert.ok(nextSize.vertical>oldSize.vertical*1.07,
        'portrait board vertical footprint must grow by a real 7% (not CSS zoom): '+
        JSON.stringify({width,height,aspect,oldSize,nextSize}));
      assert.ok(nextSize.horizontal>oldSize.horizontal*0.93,
        'vertical improvement must not make the other axis illegible');
      assert.ok(Number.isFinite(Math.hypot(...Object.values(afterPlan.offset))));
    }
  }
  for(const aspect of [16/9,640/360,390/844,368/598]){
    for(const mode of ['detail','follow']){
      const args={width:28,height:16,aspect,mode,head:{x:11,z:-6},direction:{x:1,z:0},food:{x:12,z:-6},
        occluders:[{x:14,y:1,z:-8,radius:1.2}]};
      assert.deepEqual(after(args),before(args),'unrelated full-scale cinematography is unchanged');
    }
    if(aspect>=1) assert.deepEqual(after({width:28,height:16,aspect}),
      before({width:28,height:16,aspect}),'landscape overview remains exact');
  }
  assert.equal(restorePreR56Portrait(source), prior, 'no non-camera source affected');
});
