'use strict';
// Isolated D04 evidence policy; never imported by the game or legacy spectator.
// Earlier genuine Chrome sessions ran five MediaRecorders simultaneously while
// software WebGL delivered only a few frames. Reduce diagnostic observer load
// to ONE genuine original-canvas + consented-soundstage recorder. This is a
// controlled evidence intervention, not proof of a renderer/encoder root cause.
const REASON='Single-primary-encoder trial: concurrent diagnostic recorder intentionally disabled';
const SKIPPABLE=Object.freeze([
 'real-webgl-canvas-video-only',
 'real-opted-in-soundstage-audio-only',
 'real-webgl-canvas-native-video-only',
 'synthetic-2d-canvas-encoder-control-not-gameplay'
]);
// The diagnostic recorder's OUTER observer must not discard PCM while the
// bounded soundstage 12s module-load or >=20s capture phase is still active.
// Evidence-only: this NEVER authorizes any sound after the 400ms combat cutoff.
const D04_PCM_EVIDENCE_SECONDS=5.5;
// Real tick-11 HP contact was admitted >14s after the earlier primary
// 5.5s WebM started. Retain ONE consented original canvas+soundstage window
// long enough to attempt decoding that later real contact. This does not
// extend D04's 400ms sound deadline or establish sample synchronization.
const D04_PRIMARY_AV_CLIP_MS=22000;
const D04_PRIMARY_AV_WATCHDOG_MS=34000;
function d04PcmEvidenceWatchdogMs(seconds){
 if(!Number.isFinite(seconds)||seconds<.5||seconds>10)
  throw new RangeError('Unbounded D04 PCM duration');
 const moduleLoadMs=12000,captureMs=Math.max(20000,Math.ceil(seconds*1000)+12000);
 return moduleLoadMs+captureMs+8000;
}
function createD04CaptureProfile(){
 return Object.freeze({
  id:'single-primary-authentic-av',
  concurrentRecorders:Object.freeze(['real-canvas-plus-opted-in-soundstage']),
  concurrentIsolatedProbes:false,
  allowSerialDiagnostics:true,
  audioSource:'opted-in-original-soundstage',
  sampleSynchronized:false,
  primaryClipMs:D04_PRIMARY_AV_CLIP_MS,
  primaryWatchdogMs:D04_PRIMARY_AV_WATCHDOG_MS,
  pcmCaptureSeconds:D04_PCM_EVIDENCE_SECONDS,
  pcmReceiptTimeoutMs:d04PcmEvidenceWatchdogMs(D04_PCM_EVIDENCE_SECONDS)
 });
}
function skippedConcurrentD04Probe(source){
 if(!SKIPPABLE.includes(source))throw new TypeError('Unknown optional D04 diagnostic source');
 return Object.freeze({source,status:'SKIPPED',reason:REASON,
  evidence:'NOT_CAPTURED_NOT_GAMEPLAY_NOT_AV_PROOF'});
}
module.exports={createD04CaptureProfile,skippedConcurrentD04Probe,d04PcmEvidenceWatchdogMs};
