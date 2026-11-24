'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const load=()=>import(pathToFileURL(path.join(root,'public/ai-maze-escape/guardian-duel-camera.mjs')).href);

// Exact source-bound full-mesh diagnostic rectangles, NOT guesswork:
// native Pass523 390x844 WebGL #44658903983, seed maze-visual-reference-13,
// same-run witnessed public tick93 -> tick94, unaltered original screenshot
// SHA e5e81fc22287af89023d0edd8438d727f4099ede97a0d65d4e7c18edabb801ab.
const nativeEarnedBodies=[
  {left:-.8596610941378441,right:.22870859569858165,bottom:-.25882162961221483,top:.28043700347674066},
  {left:-.2748114409656078,right:1.2932834426425253,bottom:-.626327306140584,top:.11804310483920397}
];

test('real earned counter fits both full physical bodies without weakening 0.95 native NDC acceptance',async()=>{
  const {publicGuardianEarnedRecoilSafeContactHalfHeight:backoff,
    publicGuardianEarnedRecoilFinalPairShift:pan}=await load();
  const aspect=390/844,baseline=9;
  const safe=backoff(aspect,baseline,nativeEarnedBodies,true,false);
  assert.ok(safe>baseline*1.19&&safe<baseline*1.22,
    'original real 2.153-NDC union needs a modest physical lens backoff');
  const factor=baseline/safe;
  const bodies=nativeEarnedBodies.map(b=>Object.fromEntries(
    Object.entries(b).map(([k,v])=>[k,v*factor])));
  const shift=pan(aspect,safe,bodies,true,false);
  assert.ok(shift>0,'the genuine rightward recoil must also physically recenter');
  const ndcPan=shift/(safe*aspect);
  for(const b of bodies){
    assert.ok(b.left-ndcPan>=-.95&&b.right-ndcPan<=.95,
      'the EXACT unchanged native physical full-body x tolerance stays enforced');
    assert.ok(b.bottom>=-.95&&b.top<=.95,
      'the unchanged native connected head/boots y tolerance stays enforced');
  }
});

test('legitimate already-framed or unearned images never receive artificial cutaway',async()=>{
  const {publicGuardianEarnedRecoilSafeContactHalfHeight:backoff}=await load();
  const safePair=[{left:-.5,right:0,top:.2,bottom:-.3},
    {left:.1,right:.6,top:.3,bottom:-.4}];
  assert.equal(backoff(390/844,9,safePair,true,false),9);
  for(const [aspect,bodies,earned,reduced] of [
    [390/844,nativeEarnedBodies,false,false],
    [390/844,nativeEarnedBodies,true,true],
    [844/390,nativeEarnedBodies,true,false],
    [390/844,[nativeEarnedBodies[0]],true,false],
    [390/844,[nativeEarnedBodies[0],{left:NaN,right:1,top:1,bottom:0}],true,false],
    [390/844,[{left:-5,right:-4,top:.3,bottom:-.2},nativeEarnedBodies[1]],true,false]
  ])assert.equal(backoff(aspect,9,bodies,earned,reduced),9,
    'invalid, private, landscape, impossible or reduced-motion staging fails closed');
});

test('production reframes only the actual current public full-body pair after all prior camera stages',()=>{
  const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
  assert.match(source,/if\(earnedGuardianFrame && verifiedGuardianModel\?\.parent\)\{/);
  assert.match(source,/const safeContactHeight=publicGuardianEarnedRecoilSafeContactHalfHeight\(/);
  assert.match(source,/const ndcScale=halfHeight\/safeContactHeight/);
  assert.match(source,/publicGuardianEarnedRecoilFinalPairShift\(/);
  assert.match(source,/camera\.position\.addScaledVector\(pressureReframeRight,finalEarnedShift\)/);
});
