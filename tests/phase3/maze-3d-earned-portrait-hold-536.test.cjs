'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const load = () => import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);

test('real 390-class photographed contact stays legible before the earned retreat, without altering 320',async()=>{
  const { publicEarnedGuardianCounterCameraAct: act }=await load();
  const p390=390/844, p320=320/740;
  assert.equal(act(0,true,false,p390),0);
  assert.equal(act(.24,true,false,p390),0,'do not abandon the original two-actor contact image');
  assert.ok(act(.34,true,false,p390)>0 && act(.34,true,false,p390)<.06,
    'the physical after-hit remains a close encounter, not an instant far overhead view');
  assert.ok(act(.54,true,false,p390)>.45 && act(.54,true,false,p390)<.56,
    'the real withdrawal begins to take over smoothly');
  assert.equal(act(.81,true,false,p390),1);
  assert.equal(act(.93,true,false,p390),1);
  assert.equal(act(.35,true,false,p320),.5,
    'keep the previous independently pictured 320px act exactly');
  assert.equal(act(.35,true,false),.5,'preserve all existing no-aspect callers');
  for(let i=0;i<100;i++) {
    const a=act(i/100,true,false,p390),b=act((i+1)/100,true,false,p390);
    assert.ok(a>=0 && a<=1 && b>=a-1e-12,
      'no visual cut or discontinuous camera act within the genuine counter');
  }
});

test('the retained close contact never exposes a lost, private, terminal or reduced-motion scene',async()=>{
  const { publicEarnedGuardianCounterCameraAct: act }=await load();
  for(const aspect of [390/844, .5, .59]) {
    for(const p of [undefined,NaN,Infinity,-Infinity,-1,1,2])
      assert.equal(act(p,true,false,aspect),1);
    for(const p of [0,.25,.5,.75]) {
      assert.equal(act(p,false,false,aspect),1);
      assert.equal(act(p,true,true,aspect),1);
    }
  }
  for(const aspect of [320/740, 844/390,1280/900,NaN]) {
    assert.equal(act(.35,true,false,aspect),.5,
      'other viewports retain their earlier native-tested camera act');
  }
  assert.match(source,/const earnedShotAct=publicEarnedGuardianCounterCameraAct\([\s\S]*?settings\.reducedMotion,aspect\)/);
  assert.match(source,/publicGuardianEarnedRecoilSafeContactHalfHeight\(/);
  assert.match(source,/publicGuardianEarnedRecoilFinalPairShift\(/);
  assert.match(source,/publicGuardianEarnedRecoilPairStageLift\(/);
});
