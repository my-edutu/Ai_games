'use strict';
// Native browser COMPOSITOR screenshot anchors for source-to-PTS searching.
// This reads real Chrome frames without changing the game, render snapshots,
// WebM bytes, encoder clock or fixed-step host. Never grade gameplay from it.
const fs=require('node:fs');
const path=require('node:path');
const MIN_SPACING_MS=7000, MAX_ANCHORS=9;
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
  const onFrame=frame=>{
    // Always release Chromium's screencast backpressure. The screencast is a
    // passive frame witness, never the player or the authoritative recorder.
    if(client&&Number.isSafeInteger(frame?.sessionId))
      void client.send('Page.screencastFrameAck',{sessionId:frame.sessionId})
        .catch(error=>{if(errors.length<8)errors.push('ack: '+String(error?.message||error));});
    if(!started||stopped)return;
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
      format:'jpeg',quality:85,everyNthFrame:15,
      maxWidth:viewport.width,maxHeight:viewport.height});
    started=true;
  }catch(error){
    if(errors.length<8)errors.push('start: '+String(error?.message||error));
  }
  return {anchors,errors,get started(){return started;},
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
  MIN_SPACING_MS,MAX_ANCHORS};
