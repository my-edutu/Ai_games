'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

// T1 integrated experience gate: the ACTUAL original 3D masonry must stage an
// architectural focal point proportionate to all three native boards, rooted
// into the rear shore and visible in the original safe camera overview.
// Source/geometry checks are NOT an authentic browser visual acceptance.
test('T1 real stone gateway spans the rear planted shore, forms an irregular tall arch and preserves full-stage camera', async () => {
  const THREE = await import('three');
  const { sculptRuinedGateway, createWorld } = await import('../../public/snake-stream/world.mjs');
  const { cameraComposition } = await import('../../public/snake-stream/camera.mjs');
  for (const [width, height] of [[8,8], [28,16], [40,24]]) {
    const stage = sculptRuinedGateway(width,height);
    const duplicate = sculptRuinedGateway(width,height);
    assert.deepEqual(stage,duplicate,'no visual RNG, time or authoritative state');
    assert.equal(stage.arch.length,11,'original eleven voussoir masonry pieces must remain');
    assert.equal(stage.plantings.length,7,'original seven crown-planter groups must remain');
    assert.equal(stage.columns.length,2,'preserve the two original piers');
    assert.ok(stage.span >= 4.3 && stage.span <= 11.5,'stage scale bounded');
    assert.ok(stage.span >= Math.min(11.3,width*.35),'architecture must remain prominent on broad boards');
    assert.ok(stage.z < -height/2-1.5,'every real stone must be behind gameplay');
    assert.ok(stage.apexY > stage.columns[0].height+1.35,'arched opening must be substantial');
    assert.ok(stage.apexY > 4.3 && stage.apexY < 8.0,'hero background remains within camera frustum');
    const first = stage.arch[0], last = stage.arch[10];
    assert.ok(Math.abs(first.x-stage.columns[1].x)<.001,'right spring rests on right pier');
    assert.ok(Math.abs(last.x-stage.columns[0].x)<.001,'left spring rests on left pier');
    assert.ok(Math.abs(stage.arch[5].y-stage.apexY)<.04,'highest voussoir crowns the existing arch');
    assert.ok(stage.arch.every(s=>s.z===stage.z && s.sy>.38 && s.sx>.36),'every actual stone has useful 3D volume');
    assert.ok(stage.plantings.every(p=>p.y>=stage.columns[0].height && p.z===stage.z),'original vegetation roots to actual arch');
    for (const aspect of [16/9, 390/844]) {
      const view = cameraComposition({width,height,aspect});
      const target=view.target,offset=view.offset;
      const distance=Math.hypot(offset.x,offset.y,offset.z);
      assert.ok(distance>0);
      const camera=new THREE.PerspectiveCamera(36,aspect,.1,180);
      camera.position.set(target.x+offset.x,target.y+offset.y,target.z+offset.z);
      camera.lookAt(target.x,target.y,target.z);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
      for (const p of [{x:stage.arch[5].x,y:stage.apexY,z:stage.z}, ...stage.columns.map(c=>({x:c.x,y:c.height+.65,z:stage.z}))]) {
        const projected=new THREE.Vector3(p.x,p.y,p.z).project(camera);
        assert.ok(Math.abs(projected.x)<.97 && Math.abs(projected.y)<.97 && projected.z>=-1&&projected.z<=1,
          `honest original overview must contain the complete 3D gateway (${width}x${height}, aspect ${aspect}): ${JSON.stringify(projected)}`);
      }
    }
    const world=createWorld(THREE,{width,height});
    try {assert.equal(world.stats().staticMeshes,13);assert.equal(world.stats().textures,4);}finally{world.dispose();}
  }
});
