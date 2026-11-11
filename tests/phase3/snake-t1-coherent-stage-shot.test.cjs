const {test} = require('node:test');
const assert = require('node:assert/strict');

// Exact current-head native production models, not mocks or actual WebGL pixels.
// These are design/clearance/resource regression controls, not visual acceptance.
async function stage(width, height) {
  const THREE = await import('three');
  const { createLivingGarden } = await import('../../public/snake-stream/living-garden.mjs');
  const { cameraComposition } = await import('../../public/snake-stream/camera.mjs');
  const garden = createLivingGarden(THREE, {width, height});
  return {THREE, garden, cameraComposition};
}

test('T1 reauthored full-board stage shot is more spatial and still safely fits all real playable corners', async () => {
  const {THREE, garden, cameraComposition} = await stage(28, 16);
  try {
    const composition = cameraComposition({width:28,height:16,aspect:16/9});
    const o = composition.offset;
    assert.ok(o.y/Math.hypot(o.x,o.z) < 1.04,
      'actual desktop overview should reveal garden depth, not preserve old almost-plan view');
    const camera = new THREE.PerspectiveCamera(36,16/9,.1,180);
    camera.position.set(o.x+composition.target.x,o.y+composition.target.y,o.z+composition.target.z);
    camera.lookAt(composition.target.x,composition.target.y,composition.target.z);
    camera.updateMatrixWorld();camera.updateProjectionMatrix();
    for(const x of [-14.5,14.5]) for(const z of [-8.5,8.5]) {
      const point=new THREE.Vector3(x,.25,z).project(camera);
      assert.ok(Math.abs(point.x)<.98&&Math.abs(point.y)<.98,
        'full board corners must remain within original safe overview');
    }
  } finally {garden.dispose();}
});

test('T1 integrated foliage shapes nearer living frame with no playable-cell intrusion or resource loss', async () => {
  for(const [width,height,triangles] of [[8,8,18713],[28,16,21833],[40,24,21997]]) {
    const {garden}=await stage(width,height);
    try {
      assert.equal(garden.stats().triangles, triangles, 'preserve original terrain + 48 connecting native corner triangles');
      assert.equal(garden.stats().cornerCatchments,4);
      assert.equal(garden.stats().meshCount,4);
      assert.equal(garden.stats().textures,1);
      assert.equal(garden.stats().canopyTrees,10);
      const p=garden.group.getObjectByName('Living garden / foliage').geometry.getAttribute('position');
      const W=width/2,H=height/2;
      let inboard=0,nearForeground=0;
      for(let i=0;i<p.count;i++) {
        const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
        if(Math.abs(x)<W && Math.abs(z)<H && y<1.25) inboard++;
        if(z>H+2&&z<H+8&&Math.abs(x)<=W+2.8&&y>3) nearForeground++;
      }
      assert.equal(inboard,0,'no rooted bank, low crown or leaf can cross a live cell');
      if(width===28) assert.ok(nearForeground>220,
        'new forest foreground should occupy real physical near-rim volume, not empty corners');
    } finally {garden.dispose();}
  }
});

test('T1 shoreline opens dark side-cliff slabs into readable layered forest landform, without reducing authored geometry', async()=>{
  const {garden}=await stage(28,16);
  try {
    const p=garden.group.getObjectByName('Living garden / moss').geometry.getAttribute('position');
    const y=[];
    for(let i=0;i<p.count;i++) {
      const x=p.getX(i),z=p.getZ(i);
      if(Math.abs(x)>17&&Math.abs(z)<8)y.push(p.getY(i));
    }
    y.sort((a,b)=>a-b);
    assert.ok(y.length>300);
    assert.ok(y[Math.floor(y.length*.9)] < 2.85,
      'side slopes should be layered banks, rather than a 3m-tall flat flank');
  } finally {garden.dispose();}
});
