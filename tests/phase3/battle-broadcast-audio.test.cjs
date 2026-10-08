'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-battle-royale/app.js'),'utf8');
test('live mix uses capped spatialized multi-layer sound cues from real public combat events',()=>{
  assert.match(src,/function panForCue\(/);
  assert.match(src,/function noiseForCue\(/);
  assert.match(src,/createStereoPanner/);
  assert.match(src,/createBiquadFilter/);
  assert.match(src,/MAX_VOICES/);
  assert.match(src,/activeVoices/);
  assert.match(src,/function tone\(cue,snapshot\)/);
  assert.match(src,/audioCues\|\|\[\],snapshot/);
  assert.doesNotMatch(src,/new Audio\(|fetch\(.*\.mp3|Math\.random\(/);
});
