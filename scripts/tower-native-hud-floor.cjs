'use strict';
// P0 observational ONLY: read unmodified native WebM RGB, never alter a game
// frame, invent a source event, infer a walkable crossing, or award a review.
// The original Tower HUD has a large white Floor digit at a fixed top-left
// position in its supported 390x844 and 960x600 captures. The two counters
// of the 8 and the one counter of the 9 are physically distinguishable.
const {execFileSync}=require('node:child_process');
const W=74,H=110,FPS=4,FRAME_BYTES=W*H*3,MAX_DURATION=240;
const BOUNDS={left:11,right:64,top:38,bottom:90};
function recognizeFloorGlyph(frame){
  if(!Buffer.isBuffer(frame)||frame.length!==FRAME_BYTES)return {digit:null,reason:'invalid-rgb-frame'};
  const on=new Uint8Array(W*H),seen=new Uint8Array(W*H);
  for(let y=BOUNDS.top;y<BOUNDS.bottom;y++)for(let x=BOUNDS.left;x<BOUNDS.right;x++){
    const i=y*W+x,n=i*3,r=frame[n],g=frame[n+1],b=frame[n+2];
    if(Math.min(r,g,b)>142&&Math.max(r,g,b)-Math.min(r,g,b)<55)on[i]=1;
  }
  let best=null;
  // Largest connected white component in the digit's source-owned HUD slot;
  // ignore tiny particles and the label. All flood fills are bounded by ROI.
  for(let y=BOUNDS.top;y<BOUNDS.bottom;y++)for(let x=BOUNDS.left;x<BOUNDS.right;x++){
    const start=y*W+x;
    if(!on[start]||seen[start])continue;
    const queue=[start];seen[start]=1;
    let left=x,right=x,top=y,bottom=y;
    for(let qi=0;qi<queue.length;qi++){
      const index=queue[qi],xx=index%W,yy=Math.floor(index/W);
      left=Math.min(left,xx);right=Math.max(right,xx);
      top=Math.min(top,yy);bottom=Math.max(bottom,yy);
      for(const neighbor of [index-1,index+1,index-W,index+W]){
        const nx=neighbor%W,ny=Math.floor(neighbor/W);
        if(nx<BOUNDS.left||nx>=BOUNDS.right||ny<BOUNDS.top||ny>=BOUNDS.bottom||
           !on[neighbor]||seen[neighbor])continue;
        seen[neighbor]=1;queue.push(neighbor);
      }
    }
    if(queue.length>=70&&(!best||queue.length>best.area))best={left,right,top,bottom,area:queue.length,indices:queue};
  }
  if(!best)return {digit:null,reason:'no-large-white-hud-glyph'};
  const width=best.right-best.left,height=best.bottom-best.top;
  if(width<12||width>40||height<20||height>52)
    return {digit:null,reason:'unexpected-glyph-dimensions'};
  const shape=new Uint8Array(W*H);
  for(const i of best.indices)shape[i]=1;
  const visited=new Uint8Array(W*H);
  let holes=0;
  const x0=best.left-1,x1=best.right+1,y0=best.top-1,y1=best.bottom+1;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const start=y*W+x;if(shape[start]||visited[start])continue;
    const queue=[start];visited[start]=1;
    let exterior=false;
    for(let qi=0;qi<queue.length;qi++){
      const index=queue[qi],xx=index%W,yy=Math.floor(index/W);
      if(xx===x0||xx===x1||yy===y0||yy===y1)exterior=true;
      for(const n of [index-1,index+1,index-W,index+W]){
        const nx=n%W,ny=Math.floor(n/W);
        if(nx<x0||nx>x1||ny<y0||ny>y1||shape[n]||visited[n])continue;
        visited[n]=1;queue.push(n);
      }
    }
    if(!exterior&&queue.length>=3)holes++;
  }
  return {digit:holes===2?8:holes===1?9:null,
    reason:holes===2||holes===1?'closed-counter-shape':'unrecognized-white-shape',
    holes,area:best.area,bounds:{left:best.left,top:best.top,width:width+1,height:height+1}};
}
function findVisibleEightToNine(samples,fps=FPS){
  if(!Array.isArray(samples)||!(fps>0)||samples.length<Math.ceil(6*fps))return null;
  const digits=samples.map(s=>typeof s==='number'?s:s?.digit);
  const beforeFrames=Math.ceil(3*fps),afterFrames=Math.ceil(1*fps);
  for(let i=beforeFrames;i<=digits.length-afterFrames;i++){
    const before=digits.slice(i-beforeFrames,i),after=digits.slice(i,i+afterFrames);
    // Original portrait recordings can have ONE isolated misread 9 amid
    // twelve preceding 8 glyphs (e.g. a 0.25s obstruction) before the true
    // first 8->9 crossing. Reject a sustained earlier 9 or two glitches,
    // but do not discard the first real episode in favour of a later run.
    const strayNines=before.reduce((n,d,j)=>n+(d===9?1:0),0);
    const strayIsIsolated=strayNines===1 && before.every((d,j)=>
      d!==9 || (before[j-1]!==9 && before[j+1]!==9));
    if(digits[i]!==9||digits[i-1]===9||
       before.filter(d=>d===8).length<Math.ceil(beforeFrames*.75)||
       (strayNines>0&&!strayIsIsolated)||
       !after.every(d=>d===9))continue;
    return {nativeVideoSeconds:i/fps,precisionSeconds:1/fps,
      observedDigitBefore:8,observedDigitAfter:9,
      precedingEightFrames:before.filter(d=>d===8).length,
      followingNineFrames:afterFrames,method:'original-HUD-white-connected-component-holes'};
  }
  return null;
}
function compareHudToSource(clock,hud,frames){
  const events=Array.isArray(clock?.sourceEventTimecodes)?clock.sourceEventTimecodes:[];
  const candidates=events.filter(e=>e?.kind==='floor-transition'&&e.fromFloor===8&&
    e.toFloor===9&&e.observedEpisode===0&&e.inOriginalVideo===true&&Number.isFinite(e.nativeVideoSeconds));
  const e=candidates.length===1?candidates[0]:null;
  const result={status:'NOT EVALUATED',sourceEventIsScreenProof:false,
    hudGlyphIsPhysicalCrossingProof:false,guardianDefeatPixelsConfirmed:false,
    sourceTick:e?.sourceTick??null,sourceSearchSeconds:e?.nativeVideoSeconds??null,
    originalFramesSampled:frames,visibleHudFloorChange:hud,
    caveat:'An 8→9 glyph in ORIGINAL WebM is a real drawn HUD phase, not demonstrated body crossing, valid source-event timestamp, or synchronized gameplay action.'};
  if(!e||!hud)return result;
  const delta=hud.nativeVideoSeconds-e.nativeVideoSeconds;
  result.sourceSearchToDrawnHudDeltaSeconds=Math.round(delta*1000)/1000;
  result.status=Math.abs(delta)>1?'SOURCE_CUE_AND_DRAWN_HUD_DISAGREE':'DRAWN_HUD_NEAR_SOURCE_SEARCH_ONLY';
  return result;
}
function sampleOriginalHud(video){
  const rgb=execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-nostdin',
    '-i',video,'-vf','fps='+FPS+',crop='+W+':'+H+':0:0,format=rgb24',
    '-f','rawvideo','-pix_fmt','rgb24','pipe:1'],
    {timeout:120000,maxBuffer:FRAME_BYTES*FPS*(MAX_DURATION+4)});
  if(rgb.length%FRAME_BYTES!==0||rgb.length<FRAME_BYTES*FPS*60)
    throw Error('truncated original HUD frame sample');
  const samples=[];
  for(let i=0;i<rgb.length;i+=FRAME_BYTES)
    samples.push(recognizeFloorGlyph(rgb.subarray(i,i+FRAME_BYTES)));
  const observed=findVisibleEightToNine(samples);
  return {observed,frames:samples.length,counts:{
    eight:samples.filter(x=>x.digit===8).length,
    nine:samples.filter(x=>x.digit===9).length,
    unrecognized:samples.filter(x=>x.digit===null).length}};
}
module.exports={recognizeFloorGlyph,findVisibleEightToNine,compareHudToSource,
  sampleOriginalHud,W,H,FPS,FRAME_BYTES};
