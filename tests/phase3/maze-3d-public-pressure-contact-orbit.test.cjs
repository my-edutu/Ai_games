'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const camera=path.resolve(__dirname,'../../public/ai-maze-escape/scene.js');

test('real public pressure contact gives a smooth two-shot orbit; no synthetic camera cause',async()=>{
  const {publicPressureContactOrbitWeight:weight}=await import(
    '../../public/ai-maze-escape/map-view.mjs');
  assert.equal(weight(.08,true,false,'follow',false),0,
    'disclosed warning remains frontal until the real cutting stroke');
  assert.equal(weight(.28,true,false,'follow',false),0);
  const middle=weight(.58,true,false,'follow',false);
  assert.ok(middle>.4&&middle<.6,'source-clock mid stroke truly traverses the orbit');
  assert.equal(weight(.99,true,false,'follow',false),1,
    'published near-contact creates a readable quarter angle');
  assert.equal(weight(.99,false,false,'follow',false),0,
    'a hidden or non-eligible hazard cannot steal a shot');
  assert.equal(weight(.99,true,false,'manual',false),0,
    'spectator camera stays autonomous from staged story shots');
  assert.equal(weight(.99,true,true,'follow',false),0,
    'reduced motion has no camera-orbit movement');
  assert.equal(weight(.99,true,false,'follow',true),0,
    'the real public withdrawal returns to the original frontal stage');
  for (const progress of [NaN,Infinity,-Infinity]) assert.equal(
    weight(progress,true,false,'follow',false),0,'invalid source clock cannot move lens');
  const source=fs.readFileSync(camera,'utf8');
  assert.match(source,/publicPressureContactOrbitWeight\(\s*pressureProgress,\s*pressurePortraitStage/,
    'production selects the same published physical pressure clock');
  assert.match(source,/pressureStageCameraOffset\.copy\(pressurePortraitCameraOffset\)\s*\.lerp\(pressureContactCameraOffset, pressureContactWeight\)/,
    'production camera uses a retained source-driven offset, not per-frame allocation');
});
