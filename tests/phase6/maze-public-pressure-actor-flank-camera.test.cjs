'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('true public pressure contact counter-flanks the actor, not the jaw post',async()=>{
  const {publicPressureActorCounterflankX: x}=await import('../../public/ai-maze-escape/map-view.mjs');
  assert.equal(x(2.4,0,2.4,true),-10.5,'Pip right of jaw earns opposite left-quarter angle');
  assert.equal(x(-2.4,0,2.4,true),10.5,'Pip left of jaw earns bounded right-quarter angle');
  assert.equal(x(0,0,2.4,true),3.5,'axially aligned bodies keep proven frontal view');
  assert.ok(x(1,0,2.4,true)<3.5,'partial approach eases without snapping sides');
  for(const v of [x(1,0,2.4,true),x(-1,0,2.4,true)])
    assert.ok(v>=-10.5 && v<=10.5,'camera orbit stays strictly inside authored flanks');
  for(const args of [[1,0,2.4,false],[1,0,2.4,true,true],[NaN,0,2.4,true],
    [1,NaN,2.4,true],[1,0,0,true],[1,0,Infinity,true]])
    assert.equal(x(...args),3.5,'invalid/private/inactive inputs do not stage a camera event');
});

test('the production scene uses the public camera decision on the actual source-driven contact beat',()=>{
  const scene=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(scene,/pressureContactCameraOffset\.x = publicPressureActorCounterflankX\(/);
  assert.match(scene,/pressurePortraitStage && pressureContactWeight > 0/);
  assert.match(scene,/pressureStageCameraOffset\.copy\(pressurePortraitCameraOffset\)/);
  assert.match(scene,/\.lerp\(pressureContactCameraOffset, pressureContactWeight\)/);
  assert.match(scene,/const pressureContactWeight = publicPressureContactOrbitWeight\(/);
});
