const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {pathToFileURL}=require('node:url');
const modulePath=pathToFileURL(join(__dirname,'../../public/ai-maze-escape/guardian-duel-camera.mjs')).href;

test('actual original 320px autonomous recoil complete Pip + Thornback fit with unchanged +/-0.95 threshold',async()=>{
  const {publicGuardianEarnedRecoilFinalPairShift:fit}=await import(modulePath);
  // Unaltered SHA-matched Pass475 screenshot metadata; 320x740, seed 13 tick94.
  const hero={left:-.9554259474853662,right:.004143006900978132,bottom:-.15286744368338767,top:.29757081409220953};
  const guardian={left:-.1295484673347395,right:.9043151963072749,bottom:-.39676920684157213,top:.1539545458612699};
  const aspect=320/740,halfHeight=5.62;
  const shift=fit(aspect,halfHeight,[hero,guardian],true,false);
  assert.ok(shift<0,'real physical optical correction moves left, not actor');
  const ndc=shift/(halfHeight*aspect);
  for(const body of [hero,guardian]){
    assert.ok(body.left-ndc>=-.94,'entire source-connected body must fit stronger left bound');
    assert.ok(body.right-ndc<=.94,'entire source-connected body must fit stronger right bound');
    assert.ok(body.left-ndc>=-.95 && body.right-ndc<=.95,'original browser standard remains strict');
  }
});
test('safe 390px pre-counter bounds require no needless optical shift',async()=>{
  const {publicGuardianEarnedRecoilFinalPairShift:fit}=await import(modulePath);
  assert.equal(fit(390/844,5.62,[
    {left:-.4128745,right:.409577,bottom:-.03418,top:.49824},
    {left:-.607751,right:.612454,bottom:-.4461,top:.3071}
  ],true),0);
});
test('invalid, unearned, reduced-motion and physically over-wide stages cannot masquerade as safe',async()=>{
  const {publicGuardianEarnedRecoilFinalPairShift:fit}=await import(modulePath);
  const narrow=[{left:-.9554,right:.0041,bottom:-.15,top:.30},
    {left:-.1295,right:.9043,bottom:-.39,top:.15}];
  assert.equal(fit(320/740,5.62,narrow,false),0);
  assert.equal(fit(320/740,5.62,narrow,true,true),0);
  assert.equal(fit(844/390,5.62,narrow,true),0);
  assert.equal(fit(320/740,5.62,[narrow[0]],true),0);
  assert.equal(fit(320/740,5.62,[{...narrow[0],left:NaN},narrow[1]],true),0);
  assert.equal(fit(320/740,5.62,[
    {left:-.98,right:-.10,bottom:-.15,top:.30},
    {left:.10,right:.98,bottom:-.39,top:.15}],true),0);
  const source=readFileSync(join(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(source,/finalEarnedBodies\.push\(\{left,right,bottom,top\}\)/);
  assert.match(source,/publicGuardianEarnedRecoilFinalPairShift\(\s*aspect,halfHeight,finalEarnedBodies,true,settings\.reducedMotion\)/);
});
