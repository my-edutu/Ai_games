'use strict';
// Synthetic WAVs are UNIT FIXTURES ONLY. They are never gameplay or A/V proof.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditD04OriginalPcmImpactOnsets}=require('../browser/dungeon-d04-original-pcm-onset-proof.cjs');
const rate=48000,frames=rate,first=0;
function fixture({burst=true,bus='d04-combat-fx-pre-master',
 topology='d04-original-foley-only-v1',clock='CONTIGUOUS_CONTEXT_TIME_ONLY'}={}){
 const wav=Buffer.alloc(44+frames*2);
 wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);
 wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
 wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
 wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);
 wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
 wav.write('data',36);wav.writeUInt32LE(frames*2,40);
 if(burst)for(let i=Math.floor(rate*.214);i<Math.floor(rate*.243);i++)
  wav.writeInt16LE(i%2?8500:-8500,44+i*2);
 return {status:'RECORDED',captureBus:bus,captureTopology:topology,pcmClock:{
  status:clock,firstSampleContextSeconds:first,lastSampleEndContextSeconds:1},
  sampleRate:rate,frames,bytes:wav.length,wavBase64:wav.toString('base64')};
}
const receipt=()=>({cueId:'1:1:4:damage:-:enemy-1-0',scene:'1:1',tick:4,
 kind:'damage',audio:true,visual:true,decision:'delivered',
 frameId:1,visualDrawableAtSubmission:true});
const started=()=>({cueId:'1:1:4:damage:-:enemy-1-0',
 sceneKey:'1:1',tick:4,audio:'impact',verifiedCanonicalCue:true,
 startedSources:2,scheduledContextMs:200});
const analyze=(pcm=fixture(),receipts=[receipt()],sourceStarts=[started()])=>
 auditD04OriginalPcmImpactOnsets({pcm,receipts,sourceStarts});
test('only real receipt identity + original FX bus + contiguous PCM clock can yield an onset candidate',()=>{
 const a=analyze();
 assert.equal(a.status,'ORIGINAL_PCM_TRANSIENT_CANDIDATE_VIDEO_UNALIGNED');
 assert.equal(a.candidateCount,1);
 assert.equal(a.candidates[0].status,'PCM_FX_TRANSIENT_NEAR_AUTHENTIC_START');
 assert.equal(a.sampleSynchronized,false);
 assert.equal(a.decodedVideoContact,false);
 assert.equal(a.audibleImpactOnsetVerified,false);
});
test('stale damage, unsubmitted audio, and non-drawable injury never certify PCM contact',()=>{
 for(const change of [{decision:'stale-frame'},{audio:false},
  {frameId:null},{visualDrawableAtSubmission:false}]){
  assert.equal(analyze(fixture(),[{...receipt(),...change}]).status,
   'NO_DRAWABLE_REAL_HP_IMPACT');
 }
});
test('missing or altered original source.start cue identity cannot launder unrelated PCM energy',()=>{
 for(const change of [{cueId:'1:1:4:damage:-:another'},
  {tick:5},{verifiedCanonicalCue:false},{audio:'whoosh'}]){
  const x=analyze(fixture(),[receipt()],[{...started(),...change}]);
  assert.equal(x.candidates[0].status,'NO_IDENTITY_MATCHED_ORIGINAL_START');
 }
});
test('other original sound nearby makes shared FX-bus energy ambiguous, not a verified impact',()=>{
 const x=analyze(fixture(),[receipt()],[started(),{
  ...started(),cueId:'1:1:4:swing:vanguard:-',audio:'whoosh',
  scheduledContextMs:230}]);
 assert.equal(x.candidates[0].status,'OVERLAPPING_ORIGINAL_FX_CUES');
 assert.equal(x.candidateCount,0);
});
test('silent authentic clock samples cannot count as a heard injury',()=>{
 const x=analyze(fixture({burst:false}));
 assert.equal(x.candidates[0].status,'NO_CLEAR_FX_TRANSIENT');
 assert.equal(x.status,'NO_UNAMBIGUOUS_ORIGINAL_PCM_TRANSIENT');
});
test('legacy master mix, missing clock, invalid WAV and truncated windows are fail-closed',()=>{
 assert.equal(analyze(fixture({bus:'original-master-mix'})).status,'ORIGINAL_PCM_CLOCK_UNVERIFIED');
 assert.equal(analyze(fixture({topology:'legacy-master-mix-v1'})).status,'ORIGINAL_PCM_CLOCK_UNVERIFIED');
 assert.equal(analyze(fixture({topology:null})).status,'ORIGINAL_PCM_CLOCK_UNVERIFIED');
 assert.equal(analyze(fixture({clock:'UNVERIFIED_NONCONTIGUOUS_CONTEXT_TIME'})).status,'ORIGINAL_PCM_CLOCK_UNVERIFIED');
 const corrupt=fixture();corrupt.wavBase64='YWJj';
 assert.equal(analyze(corrupt).status,'ORIGINAL_PCM_BYTES_UNVERIFIED');
 const x=analyze(fixture(),[receipt()],[{...started(),scheduledContextMs:10}]);
 assert.equal(x.candidates[0].status,'OUTSIDE_COMPLETE_PCM_WINDOW');
});
