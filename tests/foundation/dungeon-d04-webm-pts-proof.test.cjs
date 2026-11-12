'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {inspectRealWebMVideoPTS,classifyEncodedFrameYield}=require('../browser/dungeon-d04-webm-pts-proof.cjs');
// Parser fixtures are synthetic EBML bytes, NOT real Dungeon footage.
function el(hex,children){
 const id=Buffer.from(hex,'hex'),body=Buffer.isBuffer(children)?children:Buffer.concat(children);
 const n=body.length;
 if(n>16383)throw Error('fixture too large');
 const len=n<127?Buffer.from([0x80|n]):Buffer.from([0x40|(n>>8),n&255]);
 return Buffer.concat([id,len,body]);
}
const uint=n=>Buffer.from(n>255?[(n>>8)&255,n&255]:[n]);
function block(track,relative,byte){
 const payload=Buffer.from([0x80|track,(relative>>8)&255,relative&255,0x80,byte]);
 return el('a3',payload);
}
function realShapedWebM({frames=[0,80],includeAudio=true,timecodeScale=null}={}){
 const tracks=[el('ae',[el('d7',uint(1)),el('83',uint(1))])];
 if(includeAudio)tracks.push(el('ae',[el('d7',uint(2)),el('83',uint(2))]));
 const cluster=[el('e7',uint(1000)),...frames.map((ms,i)=>block(1,ms,0x12+i))];
 if(includeAudio)cluster.push(block(2,50,0x55));
 return el('18538067',[
  ...(timecodeScale?[el('1549a966',[el('2ad7b1',timecodeScale)])]:[]),
  el('1654ae6b',tracks),el('ec',Buffer.alloc(1300,0)),el('1f43b675',cluster)]);
}
function capture(bytes,{requested=3,consent=true}={}){
 return {source:'real-webgl-receipt-readback-serial-original-audio',status:'RECORDED',
  phase:'after-all-primary-encoders-settled',primaryRecordersSettled:true,
  optedInAtStart:consent,originalSoundstageTrackLive:true,
  mimeType:'video/webm;codecs=vp8,opus',videoTracks:1,audioTracks:1,
  bytes:bytes.length,base64:bytes.toString('base64'),recordingMs:4000,
  framePump:{mode:'real-webgl-render-receipt-readback',receiptStart:4,receiptEnd:7,
   requestedFrames:requested,requestFailures:0,samples:[
    {receipt:5,atMs:900,colors:100,signature:'11111111'},
    {receipt:6,atMs:1100,colors:101,signature:'22222222'},
    {receipt:7,atMs:1300,colors:102,signature:'33333333'}]}};
}
test('D04 EBML counts encoded video PTS independent of original audio blocks',()=>{
 const media=capture(realShapedWebM());
 const proof=inspectRealWebMVideoPTS(media);
 assert.equal(proof.status,'PARSED');
 assert.equal(proof.videoFrames,2);
 assert.deepEqual(proof.ptsMs,[1000,1080]);
 assert.equal(proof.audioTrackFound,true);
 assert.equal(proof.sampleSynchronized,false);
 assert.equal(classifyEncodedFrameYield(media,proof),'SPARSE_ENCODED_VIDEO_PTS_UNALIGNED');
});
test('single actual encoded block never counts as moving or sample-synced',()=>{
 const media=capture(realShapedWebM({frames:[0]}));
 const proof=inspectRealWebMVideoPTS(media);
 assert.equal(proof.videoFrames,1);
 assert.equal(classifyEncodedFrameYield(media,proof),'ONE_ENCODED_VIDEO_FRAME_UNALIGNED');
});
test('no original audio track cannot claim authentic combined WebM evidence',()=>{
 const media=capture(realShapedWebM({includeAudio:false}));
 assert.equal(inspectRealWebMVideoPTS(media).status,'UNAVAILABLE');
});
test('wrong source, absent consent and inconsistent bytes fail closed',()=>{
 const media=capture(realShapedWebM());
 for(const altered of [
  {...media,source:'synthetic-2d-canvas-encoder-control-not-gameplay'},
  {...media,optedInAtStart:false},
  {...media,bytes:media.bytes+1},
  {...media,base64:'!!!'}
 ]) {
  assert.equal(inspectRealWebMVideoPTS(altered).status,'UNAVAILABLE');
  assert.equal(classifyEncodedFrameYield(altered,inspectRealWebMVideoPTS(altered)),
   'ENCODED_FRAME_TIMING_UNVERIFIED');
 }
});
test('corrupt cluster, missing valid video receipts, duplicate timing fail closed',()=>{
 const media=capture(realShapedWebM());
 assert.equal(inspectRealWebMVideoPTS({...media,base64:Buffer.from([0x18,0x53,0x80]).toString('base64'),bytes:3}).status,'UNAVAILABLE');
 assert.equal(classifyEncodedFrameYield({...media,framePump:{...media.framePump,requestFailures:1}},
  inspectRealWebMVideoPTS(media)),'ENCODED_FRAME_TIMING_UNVERIFIED');
 const duplicate=capture(realShapedWebM({frames:[0,0]}));
 assert.equal(classifyEncodedFrameYield(duplicate,inspectRealWebMVideoPTS(duplicate)),
  'ENCODED_FRAME_TIMING_UNVERIFIED');
});

test('D04 honors declared Matroska TimestampScale rather than inventing millisecond defaults',()=>{
 const bytes=realShapedWebM({timecodeScale:Buffer.from([0x1e,0x84,0x80])}); // 2,000,000 ns/tick
 const proof=inspectRealWebMVideoPTS(capture(bytes));
 assert.equal(proof.status,'PARSED');
 assert.deepEqual(proof.ptsMs,[2000,2160]);
 assert.equal(proof.sampleSynchronized,false);
});
