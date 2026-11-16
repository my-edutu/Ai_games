'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname,'../..');
const source = fs.readFileSync(path.join(root,'public/ai-maze-escape/scene.js'),'utf8');
const helper = () => import(pathToFileURL(path.join(root,
  'public/ai-maze-escape/guardian-duel-camera.mjs')).href);
test('Pass416: camera flank requires two extra truly clear actor anchors and current public event',async()=>{
  const {choosePublicEarnedParryFlank:pick}=await helper();
  const original={angle:0,safe:true,cleared:7,pipTorsoClear:false,guardianHeadClear:true};
  const realGain={angle:.44,safe:true,cleared:9,pipTorsoClear:true,guardianHeadClear:true};
  assert.equal(pick([original,realGain],true,false),.44);
  assert.equal(pick([original,realGain],false,false),0);
  assert.equal(pick([original,realGain],true,true),0);
  assert.equal(pick([original,{...realGain,cleared:8}],true,false),0);
  assert.equal(pick([original,{...realGain,safe:false}],true,false),0);
  assert.equal(pick([original,{...realGain,guardianHeadClear:false}],true,false),0);
  assert.equal(pick([original,{...realGain,pipTorsoClear:false}],true,false),0);
  assert.equal(pick([original,{...realGain,angle:Infinity}],true,false),0);
});
test('Pass416: actual public models/raycast/camera path, original collision and privacy untouched',()=>{
  assert.match(source,/earnedGuardianFrame && verifiedGuardianModel\?\.parent/);
  assert.match(source,/t\.lanternParried===true/);
  assert.match(source,/Array\.isArray\(s\.visibleCells\)/);
  assert.match(source,/for\(const root of \[explorer\.group,verifiedGuardianModel\]\)/);
  assert.match(source,/publicRecoilRay\.setFromCamera/);
  assert.match(source,/world\.describePublicRayHit\(hit\)/);
  assert.match(source,/if\(!physicalShotSafe\(\)\)\{safe=false;break;\}/);
  assert.match(source,/choosePublicEarnedParryFlank\(/);
  assert.match(source,/camera\.position\.copy\(basePosition\)/);
  assert.doesNotMatch(source,/privateMaze.*publicRecoilCamera|secretRoute.*publicRecoilCamera/);
});
