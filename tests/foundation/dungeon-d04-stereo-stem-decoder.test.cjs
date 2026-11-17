'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inspectPcm}=require('../browser/dungeon-d04-stereo-stem-decoder.cjs');
function pcm(n,lf,rf){const b=Buffer.alloc(n*8);for(let i=0;i<n;i++){
 b.writeFloatLE(lf(i),i*8);b.writeFloatLE(rf(i),i*8+4);}return b;}
test('native real WebM stem decoder requires meaningful isolated right-channel PCM, without claiming synchronization',()=>{
 const b=pcm(4800,i=>0.006, i=> i>=2000&&i<4000?0.002:0);
 const r=inspectPcm(b);
 assert.equal(r.status,'DECODED_ORIGINAL_FX_STEM_UNALIGNED');
 assert.equal(r.originalCombatFxRight.samplesAboveNoise,2000);
 assert.equal(r.originalCombatFxRight.firstAboveNoiseSeconds,2000/48000);
 assert.equal(r.sampleSynchronized,false);
 assert.equal(r.decodedVideoContact,false);
 assert.equal(r.physicalContactOnsetVerified,false);
});
test('never mistake mixed ambience/mono upmix or silent right channel for original combat FX',()=>{
 const stereo=pcm(4800,()=>0.008,()=>0);
 assert.equal(inspectPcm(stereo).status,'COMBAT_FX_STEM_SILENT_OR_UNVERIFIED');
 assert.equal(inspectPcm(stereo,{channels:1}).status,'INVALID_STEREO_PCM');
});
test('reject invalid, unbounded and nonfinite decoded PCM',()=>{
 assert.equal(inspectPcm(Buffer.alloc(11)).status,'INVALID_STEREO_PCM');
 const n=pcm(32,()=>NaN,()=>0.001);
 assert.equal(inspectPcm(n).status,'INVALID_STEREO_PCM');
});
