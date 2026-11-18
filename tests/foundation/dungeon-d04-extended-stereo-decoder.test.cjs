'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {run,inspectPcm}=require('../browser/dungeon-d04-stereo-stem-decoder.cjs');

test('D04 bounded diagnostic decoder handles full 42s original A/V window without mistaking silence for impact',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'d04-decoder-'));
 const oldProbe=process.env.D04_FFPROBE,oldDecode=process.env.D04_FFMPEG;
 try{
  const input=path.join(dir,'original.webm');fs.writeFileSync(input,'fixture only');
  const probe=path.join(dir,'probe.cjs'),decoder=path.join(dir,'decode.cjs');
  fs.writeFileSync(probe,`#!/usr/bin/env node\nprocess.stdout.write(JSON.stringify({streams:[{codec_name:'opus',channels:2,sample_rate:'48000'}]}));\n`,{mode:0o700});
  fs.writeFileSync(decoder,`#!/usr/bin/env node\nconst fs=require('node:fs');let remaining=42*48000*8;const chunk=Buffer.alloc(1024*1024);while(remaining>0){const size=Math.min(chunk.length,remaining);fs.writeSync(1,chunk,0,size);remaining-=size;}\n`,{mode:0o700});
  process.env.D04_FFPROBE=probe;process.env.D04_FFMPEG=decoder;
  const result=run(input);
  assert.equal(result.status,'COMBAT_FX_STEM_SILENT_OR_UNVERIFIED',
   'simulated silent decoded PCM must remain unverified, not DECODE_FAILED/ENOBUFS');
  assert.equal(result.durationSeconds,42);
  assert.equal(result.originalCombatFxRight.samplesAboveNoise,0);
  assert.equal(result.sampleSynchronized,false);
  assert.equal(inspectPcm(Buffer.alloc(45*48000*8+8)).status,'INVALID_STEREO_PCM',
   'diagnostic PCM must still have a finite 45s memory bound');
 }finally{
  if(oldProbe===undefined)delete process.env.D04_FFPROBE;else process.env.D04_FFPROBE=oldProbe;
  if(oldDecode===undefined)delete process.env.D04_FFMPEG;else process.env.D04_FFMPEG=oldDecode;
  fs.rmSync(dir,{recursive:true,force:true});
 }
});
