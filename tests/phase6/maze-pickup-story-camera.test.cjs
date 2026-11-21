'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),fs=require('node:fs');

const camera=import(pathToFileURL(path.resolve(__dirname,
  '../../public/ai-maze-escape/pickup-story-camera.mjs')).href);

// Judge the actual production camera transform, not an invented duplicate.
test('witnessed key camera makes an authentic front three-quarter 3D hero view',async()=>{
  const {setWitnessedPickupStoryCameraOffset:stage}=await camera;
  for(const heading of [0,Math.PI/2,Math.PI,-Math.PI/2,.43,-2.2]){
    const offset={x:13,y:17,z:16,set(x,y,z){this.x=x;this.y=y;this.z=z}};
    assert.equal(stage(offset,heading),true);
    const horizontal=Math.hypot(offset.x,offset.z);
    assert.ok(horizontal>19&&horizontal<20,'substantial isometric diorama distance');
    const facing=(offset.x*Math.sin(heading)+offset.z*Math.cos(heading))/horizontal;
    assert.ok(facing>.95,'hero face must aim toward physical camera at any observed heading');
    assert.ok(offset.y/horizontal<.73,'show hero face and dimensional stage, not top-down floor');
  }
});
test('invalid or undisclosed heading cannot move reused physical camera',async()=>{
  const {setWitnessedPickupStoryCameraOffset:stage}=await camera;
  const offset={x:13,y:17,z:16,set(x,y,z){this.x=x;this.y=y;this.z=z}};
  for(const invalid of [undefined,null,NaN,Infinity,-Infinity,{},'north']){
    assert.equal(stage(offset,invalid),false);
    assert.deepEqual([offset.x,offset.y,offset.z],[13,17,16]);
  }
  assert.equal(stage(null,0),false);
});
test('scene requests the story orbit only for witnessed source pickup, never AI/private state',()=>{
  const scene=fs.readFileSync(path.resolve(__dirname,
    '../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(scene,/if \(pickupCue\) recentPublicPickup = \{\.\.\.pickupCue,runToken:snapshot\.runToken,start:gateVisualTime,/);
  assert.match(scene,/cameraHeading:heading/);
  assert.match(scene,/s\.inventory\.includes\(recentPublicPickup\.id\)/);
  assert.match(scene,/s\.cells\.some\(cell => cell\.cell === recentPublicPickup\.cell\)/);
  assert.match(scene,/setWitnessedPickupStoryCameraOffset\(pickupCameraOffset,/);
  assert.match(scene,/pickupCameraHeroFacing:/);
  assert.doesNotMatch(scene,/hiddenState\.(?:goal|route|threat)/);
});
