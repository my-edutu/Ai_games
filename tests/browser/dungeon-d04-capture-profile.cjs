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
function createD04CaptureProfile(){
 return Object.freeze({
  id:'single-primary-authentic-av',
  concurrentRecorders:Object.freeze(['real-canvas-plus-opted-in-soundstage']),
  concurrentIsolatedProbes:false,
  allowSerialDiagnostics:true,
  audioSource:'opted-in-original-soundstage',
  sampleSynchronized:false
 });
}
function skippedConcurrentD04Probe(source){
 if(!SKIPPABLE.includes(source))throw new TypeError('Unknown optional D04 diagnostic source');
 return Object.freeze({source,status:'SKIPPED',reason:REASON,
  evidence:'NOT_CAPTURED_NOT_GAMEPLAY_NOT_AV_PROOF'});
}
module.exports={createD04CaptureProfile,skippedConcurrentD04Probe};
