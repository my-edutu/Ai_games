'use strict';
// Native browser COMPOSITOR screenshot anchors for source-to-PTS searching.
// This reads real Chrome frames without changing the game, render snapshots,
// WebM bytes, encoder clock or fixed-step host. Never grade gameplay from it.
const fs=require('node:fs');
const path=require('node:path');
// Original baseline desktop danger 42634400305 yielded only 2/5 distinct
// native-film matching anchors. Collect more independently matchable frames
// across the same unchanged WebM without loosening the >=3-anchor gate.
// Original 2026-11-10 baseline moving desktop was missing an event-to-video
// clock despite two good screenshots: only 2 of 8 sparse compositor frames
// matched unique unmodified WebM pictures. Request more REAL compositor frames
// throughout the same continuous 60-75s recording; never relax the three
// unambiguous, span-separated native video match requirement.
// At most 24 JPEGs, separated by >=2.8 seconds, are retained (usually <3MB).
// This is read-only evidence capture, never a game-clock or image substitute.
// In real 25fps candidate danger video, 23-24 stored JPEGs yielded 15/13
// independently matched original WebM anchors. CDP was asked to encode ONE
// OF EVERY TWO COMPOSITOR FRAMES while Playwright already recorded the full
// video. At 25fps this requests ~875 extra JPEG transports in a 70s run
// just to store <=24 anchors. Sample 1/12 instead: ~146 opportunities,
// still substantially above the 24-anchor cap and 3-unique-match gate.
// This is a capture-interference experiment, NOT measured performance gain.
// Both immutable baseline and candidate use this same observational harness.
const MIN_SPACING_MS=2800, MAX_ANCHORS=24, CDP_FRAME_STRIDE=12;
function frameTimestampMs(metadata,nowMs){
  const seconds=metadata?.timestamp;
  if(!Number.isFinite(seconds)||seconds<1_000_000_000)return null;
  const ms=seconds*1000;
  return Math.abs(ms-nowMs)<=15000?ms:null;
}
function retainAnchor(anchors,timeMs){
  return Number.isFinite(timeMs)&&anchors.length<MAX_ANCHORS&&
    (!anchors.length||timeMs-anchors.at(-1).startAtMs>=MIN_SPACING_MS);
}
async function beginTowerNativeCompositorAnchors({page,dir,viewport,clock=Date.now,
  save=(file,bytes)=>fs.writeFileSync(file,bytes,{flag:'wx'})}){
  const anchors=[],errors=[];
  let client=null,started=false,stopped=false;
  let receivedFrames=0,encodedCharsDelivered=0,jpegBytesStored=0;
  const onFrame=frame=>{
    // Always release Chromium's screencast backpressure. The screencast is a
    // passive frame witness, never the player or the authoritative recorder.
    if(client&&Number.isSafeInteger(frame?.sessionId))
      void client.send('Page.screencastFrameAck',{sessionId:frame.sessionId})
        .catch(error=>{if(errors.length<8)errors.push('ack: '+String(error?.message||error));});
    if(!started||stopped)return;
    receivedFrames++;
    // Counts are observational transport costs, never submitted GPU frames
    // or the presented native-video frame rate. O(1) in the hot callback.
    if(typeof frame?.data==='string')encodedCharsDelivered+=frame.data.length;
    const stamp=frameTimestampMs(frame?.metadata,clock());
    if(!retainAnchor(anchors,stamp))return;
    try{
      const encoded=frame?.data;
      if(typeof encoded!=='string'||encoded.length>4_000_000)return;
      const bytes=Buffer.from(encoded,'base64');
      if(bytes.length<128||bytes.length>2_000_000||
         bytes[0]!==0xff||bytes[1]!==0xd8||
         bytes[bytes.length-2]!==0xff||bytes[bytes.length-1]!==0xd9)return;
      const name='compositor-frame-'+String(anchors.length).padStart(2,'0')+'.jpg';
      save(path.join(dir,name),bytes);
      jpegBytesStored+=bytes.length;
      anchors.push({file:name,startAtMs:stamp,endAtMs:stamp,
        witness:'unaltered-Chromium-compositor-CDP-frame',
        timestampSource:'Page.screencastFrame.metadata.timestamp',
        claimedVideoMatch:false});
    }catch(error){
      if(errors.length<8)errors.push('anchor-write: '+String(error?.message||error));
    }
  };
  try{
    client=await page.context().newCDPSession(page);
    client.on('Page.screencastFrame',onFrame);
    await client.send('Page.startScreencast',{
      format:'jpeg',quality:85,everyNthFrame:CDP_FRAME_STRIDE,
      maxWidth:viewport.width,maxHeight:viewport.height});
    started=true;
  }catch(error){
    if(errors.length<8)errors.push('start: '+String(error?.message||error));
  }
  return {anchors,errors,get started(){return started;},
    get samplingStats(){
      return {everyNthCompositorFrame:CDP_FRAME_STRIDE,
        deliveredCDPFrames:receivedFrames,
        deliveredBase64Characters:encodedCharsDelivered,
        storedAnchorJPEGBytes:jpegBytesStored,
        storedAnchorCount:anchors.length,maxStoredAnchors:MAX_ANCHORS,
        minAnchorSeparationMs:MIN_SPACING_MS,
        meaning:'Capture transport pressure only; NOT video FPS, GPU time, event visibility or gameplay acceptance'};
    },
    async stop(){
      if(stopped)return;
      stopped=true;
      if(client){
        if(started)try{await client.send('Page.stopScreencast');}
          catch(error){if(errors.length<8)errors.push('stop: '+String(error?.message||error));}
        client.off('Page.screencastFrame',onFrame);
        try{await client.detach();}
          catch(error){if(errors.length<8)errors.push('detach: '+String(error?.message||error));}
      }
    }};
}
module.exports={frameTimestampMs,retainAnchor,beginTowerNativeCompositorAnchors,
  MIN_SPACING_MS,MAX_ANCHORS,CDP_FRAME_STRIDE};
