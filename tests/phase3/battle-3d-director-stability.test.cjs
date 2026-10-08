'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/arena3d.js'),'utf8');
test('hands-free cinematic director limits camera cuts and follows only published decisive fights',()=>{
  assert.match(src,/function chooseSpectatorTarget\(/);
  assert.match(src,/let heldSpectator/);
  assert.match(src,/SPECTATOR_HOLD_MS/);
  assert.match(src,/function smoothCameraTarget\(/);
  assert.match(src,/snapshot\.recentEvents/);
  assert.match(src,/snapshot\.result\?\.winnerId/);
  assert.match(src,/reducedMotion/);
  assert.doesNotMatch(src,/Math\.random\(|\.step\(/);
});
