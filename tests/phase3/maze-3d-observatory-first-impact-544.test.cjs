'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const world=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');

test('Pass544 visible first true guardian impact synchronises existing observatory before delayed public tile wave',async()=>{
 const moduleUrl=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
 const {publicGuardianObservatoryImpactDrop:depth,publicGuardianEarnedResonance:wave}=await import(moduleUrl);
 assert.equal(wave(0,1,false).wave,0,'the genuinely original guardian-end tile ripple is delayed');
 assert.equal(depth(0,true,0,false),.82,'authentic first frame sinks the whole root');
 assert.equal(depth(.10,true,.40,false),.82,'no rebound as public ripple catches up');
 assert.equal(depth(.70,true,.95,false),.95,'original ripple ultimately owns physical pose');
 assert.equal(depth(.50,true,1.2,false),1,'physical range bounded');
 for(const [phase,earned,late,reduced] of [[0,false,1,false],[0,true,1,true],[NaN,true,1,false],[-.01,true,1,false],[1.01,true,1,false]]){
  assert.equal(depth(phase,earned,late,reduced),0,'invalid/absent/reduced cannot fabricate physical hit');
 }
 assert.match(world,/const earnedParry=witnessedLane && options\.guardianParried===true/);
 assert.match(world,/onLane && earnedParry && signal\.cell===guardianCell/);
 assert.match(world,/const observedImpactDepth=publicGuardianObservatoryImpactDrop\(\s*guardianCounterPhase,/);
 assert.match(world,/signal\.observatory\.instrument\.position\.y=-1\.72\*observedImpactDepth/);
 assert.match(world,/const resonance=publicGuardianEarnedResonance\(/);
});
