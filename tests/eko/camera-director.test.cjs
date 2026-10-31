'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
async function api(){
  const text=fs.readFileSync(path.resolve(__dirname,'../../public/eko-run/camera-director.js'),'utf8');
  return import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
}
test('pure cinematic shot is a genuine side/over-shoulder 3D viewpoint, preserving route authority',async()=>{
  const {computeCameraShot}=await api();
  const player={playerX:43.6,playerY:.26};
  const before=JSON.stringify(player);
  const side=computeCameraShot({...player,portrait:false,style:'broadcast'});
  const cinematic=computeCameraShot({...player,portrait:false,style:'street-cinema'});
  assert.ok(cinematic.x<side.x-5,'3/4 camera must view the city from behind Tayo');
  assert.ok(cinematic.z>6 && cinematic.z<16);
  assert.ok(cinematic.targetX>player.playerX,'hazards should remain in sight');
  assert.ok(cinematic.x<player.playerX);
  assert.equal(JSON.stringify(player),before,'camera cannot mutate public player observations');
  assert.deepEqual(cinematic,computeCameraShot({...player,portrait:false,style:'street-cinema'}));
  assert.ok(Object.isFrozen(cinematic));
});
test('portrait cinematic shot is compositionally safe and style selector is bounded',async()=>{
  const {computeCameraShot,nextCameraStyle,AVAILABLE_CAMERA_STYLES}=await api();
  assert.deepEqual(AVAILABLE_CAMERA_STYLES,['broadcast','street-cinema']);
  assert.equal(nextCameraStyle('broadcast'),'street-cinema');
  assert.equal(nextCameraStyle('street-cinema'),'broadcast');
  const portrait=computeCameraShot({playerX:15,portrait:true,style:'street-cinema'});
  assert.ok(portrait.z>portrait.x-15);
  assert.ok(portrait.targetX>15 && portrait.targetX<20);
  assert.ok(portrait.x<15);
  assert.throws(()=>computeCameraShot({playerX:NaN}),TypeError);
  assert.throws(()=>computeCameraShot({playerX:3,style:'editor-cheat-mode'}),RangeError);
});
