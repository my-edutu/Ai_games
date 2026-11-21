'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const cameraUrl=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/guardian-duel-camera.mjs')).href;

test('Pass508 genuine earned mobile post-parry lens looks over native foreground reef without changing non-encounters',async()=>{
  const {publicGuardianEarnedRecoilRevealElevation:lift}=await import(cameraUrl);
  assert.equal(lift(390/844,11.5,true,false),31);
  assert.equal(lift(320/740,21,true,false),31);
  assert.equal(lift(390/844,27,true,false),31,'a previously shallow earned view must clear the physical foreground');
  assert.equal(lift(390/844,35,true,false),35,'do not lower an already clear view');
  for(const aspect of [320/740,390/844]){
    assert.equal(lift(aspect,11.5,false,false),11.5,'unearned anticipation stays trusted');
    assert.equal(lift(aspect,11.5,true,true),11.5,'reduced motion stays put');
  }
  for(const aspect of [844/390,1280/900,.2,NaN])
    assert.equal(lift(aspect,11.5,true,false),11.5,'do not alter landscape/invalid cameras');
  assert.equal(lift(390/844,-1,true,false),-1,'invalid physical offset is not staged');
});
