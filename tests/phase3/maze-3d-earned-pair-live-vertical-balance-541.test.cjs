'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const camera=pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href;
const scene=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');

// Actual unmodified full-body 390x844 autonomous WebGL, seed 13, tick 94,
// Pass540b exact-HEAD #44803706980, image SHA256 d08348603d67...825198.
// These bounds are sourced from the native captured JSON, NOT hand-built art.
const native390=[
  {left:-.8893210942,right:.0336231441,bottom:.0686211884,top:.5047305038},
  {left:-.4796435151,right:.8893210942,bottom:-.2685983156,top:.3773593314}
];
test('Pass541 authentic 390px public two-actor recoil moves out of foreground while keeping both whole bodies and HUD safe',async()=>{
  const {publicGuardianEarnedRecoilPairStageLift:stage}=await import(camera);
  const aspect=390/844,h=8.5;
  const shift=stage(aspect,h,native390,true,false);
  const displacement=shift/h;
  assert.ok(displacement>.075&&displacement<.15,
    '390px true contact must visibly move towards the stage centre, not add a decorative micro-shader');
  const originalCentre=(Math.max(...native390.map(b=>b.top))
    +Math.min(...native390.map(b=>b.bottom)))/2;
  const settledCentre=originalCentre-displacement;
  assert.ok(Math.abs(settledCentre-.02)<1e-9,
    'actual two full-mesh envelopes, not an invisible event label, own the optical composition');
  for(const body of native390){
    assert.ok(body.top-displacement<=.63&&body.bottom-displacement>=-.75,
      'stronger original top mission and lower 44px control reserves preserved');
    assert.ok(body.left>=-.95&&body.right<=.95,
      'unchanged strict +/- .95 source-bound horizontal framing contract');
  }
  assert.equal(stage(aspect,h,native390,true,false),shift,'no randomness or runtime dependence');
});
test('Pass541 repair preserves original strict Pass527 and Pass528 real low-frame camera lift, not just new high-frame correction',async()=>{
  const {publicGuardianEarnedRecoilPairStageLift:stage}=await import(camera);
  const early=[
    {left:-.9000,right:-.0077149,bottom:-.2161108,top:.2262768},
    {left:-.4791513,right:.9000,bottom:-.5399237,top:.1265308}
  ];
  const second=[
    {left:-.896187,right:-.049280,bottom:-.208340,top:.214876},
    {left:-.490237,right:.896187,bottom:-.536033,top:.130853}
  ];
  for(const bodies of [early,second]){
    const move=-stage(390/844,8.2,bodies,true,false)/8.2;
    assert.ok(move>.28&&move<=.30,'preserve stronger original real below-centre full-pair lift');
    for(const b of bodies)assert.ok(b.top+move<=.63 && b.bottom+move>=-.75,
      'no weakening old full-body top HUD and lower control reserves');
  }
});
test('Pass541 legacy 320px, landscape, desktop, stale, invalid and reduced-motion camera stay untouched',async()=>{
  const {publicGuardianEarnedRecoilPairStageLift:stage}=await import(camera);
  const h=8.5,aspect=390/844;
  assert.equal(stage(320/740,h,native390,true,false),
    // Original 320-class calculation: after .63 high-reserve failure no lift.
    Math.min(.30,Math.max(0,.13-(.5047305038-.2685983156)/2),.63-.5047305038)>=.02
      ? -Math.min(.30,Math.max(0,.13-(.5047305038-.2685983156)/2),.63-.5047305038)*h : 0);
  for(const [a,earned,reduced,rects] of [
    [aspect,false,false,native390],
    [aspect,true,true,native390],
    [844/390,true,false,native390],
    [1280/900,true,false,native390],
    [.2,true,false,native390],
    [aspect,true,false,[native390[0]]],
    [aspect,true,false,[native390[0],{...native390[1],top:NaN}]],
    [aspect,true,false,[{...native390[0],right:1.01},native390[1]]],
    [aspect,true,false,[{...native390[0],bottom:-.78},native390[1]]]
  ])assert.equal(stage(a,h,rects,earned,reduced),0);
});
test('Pass541 the production scene stages only the witnessed physical complete pair after exact full-mesh fit',()=>{
  assert.match(scene,/if\(earnedGuardianFrame && verifiedGuardianModel\?\.parent\)\{/);
  assert.match(scene,/const stageLift=publicGuardianEarnedRecoilPairStageLift\(/);
  assert.match(scene,/stageLift\*earnedContactStageBlend/);
  assert.match(scene,/publicGuardianEarnedRecoilSafeContactHalfHeight\(/);
  assert.match(scene,/publicGuardianEarnedRecoilFinalPairShift\(/);
  assert.doesNotMatch(scene,/secretRoute.*stageLift|privateMaze.*stageLift/);
});
