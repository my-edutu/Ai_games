'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function subject(){
  const m=await import(pathToFileURL(path.resolve(__dirname,
    '../../public/ai-maze-escape/map-view.mjs')).href);
  return {closer:m.publicPhysicalPressureContactHalfHeight,
    reframe:m.publicPhysicalPressureHorizontalReframe};
}
// Genuine full connected 2026-11-11 Pass268 source-bound native WebGL:
// real tick-6, known trap cell 92, seed maze-visual-reference-3.
const hero={left:-.07666523496107956,right:.4287484924672529,
  bottom:-.016495480761199045,top:.323718705001994};
const jaw={left:-.7768572531630937,right:.20378421416322798,
  bottom:-.29763326623800335,top:.18328800751124913};
test('genuine off-centre 390px Pip + jaw contact becomes a sizeable full-model stage with stricter margin',async()=>{
  const {closer,reframe}=await subject(), start=6.6927, aspect=390/844;
  const next=closer(hero,jaw,start,aspect,true);
  assert.ok(next<start*.855 && next>=5.45,'true connected action now earns about 18% optical magnification');
  const zoom=start/next;
  assert.ok(zoom<=1.18+1e-10,'never exceed authored optical limit');
  const pan=reframe(
    {left:hero.left*zoom,right:hero.right*zoom},
    {left:jaw.left*zoom,right:jaw.right*zoom},next,aspect,.89)/(next*aspect);
  const bounds=[hero,jaw];
  for(const b of bounds){
    assert.ok(b.left*zoom-pan>=-.8900001,'left physical extremity retained');
    assert.ok(b.right*zoom-pan<=.8900001,'right physical extremity retained');
    assert.ok(b.bottom*zoom>=-.89,'bottom physical extremity retained');
    assert.ok(b.top*zoom<=.89,'top physical extremity retained');
  }
});
test('320px native same source fits, but diagonal/withdrawal/reduced-motion caller gates and landscape never zoom',async()=>{
  const {closer}=await subject();
  assert.ok(closer(hero,jaw,7.1516,320/740,true)<7.1516*.855);
  assert.equal(closer(hero,jaw,7.1516,320/740,false),7.1516);
  assert.equal(closer(hero,jaw,6.6927,844/390,true),6.6927);
  assert.equal(closer(hero,jaw,5.45,390/844,true),5.45);
});
test('genuine oversize connected actors, vertical crop and invalid source diagnostics refuse zoom',async()=>{
  const {closer,reframe}=await subject(), start=6.6927, aspect=390/844;
  assert.equal(closer(hero,{...jaw,left:-1.5},start,aspect,true),start);
  assert.equal(closer(hero,{...jaw,top:.87},start,aspect,true),start);
  assert.equal(closer(hero,{...jaw,left:NaN},start,aspect,true),start);
  assert.equal(closer(hero,null,start,aspect,true),start);
  assert.equal(closer(hero,jaw,Infinity,aspect,true),Infinity);
  assert.equal(closer(hero,jaw,start,NaN,true),start);
  assert.equal(reframe(hero,jaw,start,aspect,.96),0);
  assert.equal(reframe(hero,jaw,start,aspect,.75),0);
});
test('old safe pressure/withdrawal camera default remains the original strict .945 reframe',async()=>{
  const {reframe}=await subject(), start=6.6927, aspect=390/844;
  assert.equal(reframe(hero,jaw,start,aspect),0,'already safe frame stays stationary');
  const shiftedJaw={...jaw,left:-.98,right:-.01};
  const old=reframe(hero,shiftedJaw,start,aspect);
  assert.ok(old<0,'only an authentic overrun pans toward the real jaw');
  assert.equal(old,reframe(hero,shiftedJaw,start,aspect,.945));
});
