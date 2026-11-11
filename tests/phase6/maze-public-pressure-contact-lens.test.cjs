'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function subject(){
  return (await import(pathToFileURL(path.resolve(__dirname,
    '../../public/ai-maze-escape/map-view.mjs')).href))
    .publicPhysicalPressureContactHalfHeight;
}
const hero={left:-.0765,right:.41985,bottom:-.016,top:.31656};
const jaw={left:-.7607,right:.1996,bottom:-.291,top:.179};
test('true original 390px connected Pip and jaws earn substantial but still genuinely uncropped contact composition',async()=>{
  const closer=await subject(),start=6.6927;
  const next=closer(hero,jaw,start,390/844,true);
  assert.ok(next<start*.86 && next>=5.45,'real pressure beat gets up to 18% physically safe lens staging');
  const zoom=start/next;
  assert.ok(Math.min(hero.left,jaw.left)*zoom>-.90);
  assert.ok(Math.max(hero.right,jaw.right)*zoom<.90);
  assert.ok(Math.min(hero.bottom,jaw.bottom)*zoom>-.90);
  assert.ok(Math.max(hero.top,jaw.top)*zoom<.90);
});
test('original 320px pressure shot can share exact full-model gate; landscape, withdrawn and noneligible cannot',async()=>{
  const closer=await subject();
  assert.ok(closer(hero,jaw,7.1516,320/740,true)<7.1516);
  assert.equal(closer(hero,jaw,7.1516,320/740,false),7.1516);
  assert.equal(closer(hero,jaw,6.6927,844/390,true),6.6927);
  assert.equal(closer(hero,jaw,5.45,390/844,true),5.45);
});
test('unsafe connected extremity and nonfinite diagnostics never allow a cosmetic zoom that crops models',async()=>{
  const closer=await subject(),start=6.6927;
  assert.equal(closer({...jaw,left:-.82},hero,start,390/844,true),start);
  assert.equal(closer(hero,{...jaw,top:.81},start,390/844,true),start);
  assert.equal(closer(hero,{...jaw,left:NaN},start,390/844,true),start);
  assert.equal(closer(hero,null,start,390/844,true),start);
  assert.equal(closer(hero,jaw,Infinity,390/844,true),Infinity);
  assert.equal(closer(hero,jaw,start,NaN,true),start);
});
