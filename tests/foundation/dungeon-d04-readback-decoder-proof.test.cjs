'use strict';
// Synthetic decoder fixtures test a strict parser, NOT Dungeon footage.
// Only Playwright's authentic WebGL source may produce runtime evidence.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const child=require('node:child_process');
const {decodeReceiptReadbackMotion}=require('../browser/dungeon-d04-decoded-video-proof.cjs');
const bytes=Buffer.alloc(2048,7);
const authentic=()=>({
 source:'real-webgl-receipt-readback-serial-video-only',
 status:'RECORDED',bytes:bytes.length,base64:bytes.toString('base64'),
 videoTracks:1,audioTracks:0
});
const hashes=['11111111111111111111111111111111','22222222222222222222222222222222'];
function withDecoderFrames(list,callback,{codec='vp8'}={}){
 const original=child.spawnSync;
 child.spawnSync=(exe)=>{
  if(exe==='ffprobe')return {status:0,stdout:codec+'\n'};
  if(exe==='ffmpeg')return {status:0,stdout:'#version: 2\n'+list.map((hash,i)=>
   '0, '+i+', '+i+', 1, 576, '+hash).join('\n')+'\n'};
  throw Error('Unexpected decoder binary '+exe);
 };
 try{return callback()}finally{child.spawnSync=original}
}
test('D04 receipt-readback decode fails closed without authenticated real WebGL source',()=>{
 assert.equal(typeof decodeReceiptReadbackMotion,'function');
 assert.equal(decodeReceiptReadbackMotion({...authentic(),source:'synthetic-2d-canvas'}).status,'UNAVAILABLE');
 assert.equal(decodeReceiptReadbackMotion({...authentic(),base64:'AAAA'}).status,'UNAVAILABLE');
 assert.equal(decodeReceiptReadbackMotion({...authentic(),videoTracks:0}).status,'UNAVAILABLE');
});
test('strict decode distinguishes two real-source frame hashes from a single/static frame',()=>{
 const moving=withDecoderFrames(hashes,()=>decodeReceiptReadbackMotion(authentic()));
 assert.equal(moving.status,'DECODED');
 assert.equal(moving.source,'ffmpeg-decoded-real-webgl-receipt-readback-video');
 assert.equal(moving.frameCount,2);assert.equal(moving.distinctFrames,2);
 const staticVideo=withDecoderFrames([hashes[0],hashes[0]],()=>decodeReceiptReadbackMotion(authentic()));
 assert.equal(staticVideo.frameCount,2);assert.equal(staticVideo.distinctFrames,1);
 const invalid=withDecoderFrames(hashes,()=>decodeReceiptReadbackMotion(authentic()),{codec:'h264'});
 assert.equal(invalid.status,'UNAVAILABLE','no codec substitution');
});
