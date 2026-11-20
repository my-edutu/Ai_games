// An original, source-grounded Floor 8 cap shares its actual roof elevation
// with Floor 9 ground. Partition ONLY that original F9 walking-surface mesh
// in the same cylinder; no additional platform, overlap or collider.
export function actualGatewayReceivingRoofSpans(platform,worldWidth,thresholdX,arc=2.2){
  const safe=Number.isSafeInteger;
  if(!platform || platform.id!=='f9:ground' ||
     ![platform.x,platform.width,worldWidth,thresholdX].every(safe) ||
     platform.width<120000 || worldWidth<=0 || !Number.isFinite(arc) ||
     arc<=0 || arc>Math.PI ||
     platform.x<0 || platform.x+platform.width>worldWidth ||
     thresholdX-platform.x<24000 ||
     platform.x+platform.width-thresholdX<65000)return null;
  const end=platform.x+platform.width;
  const rise=Math.min(48000,Math.floor((end-thresholdX)*.45));
  const cuts=[platform.x,thresholdX,thresholdX+rise,end];
  if(cuts.some((x,i)=>i>0 && x<=cuts[i-1]))return null;
  return ['approach','threshold','successor'].map((kind,i)=>{
    const startX=cuts[i],endX=cuts[i+1];
    return {kind,startX,endX,
      angle:(endX-startX)/worldWidth*arc,
      offset:((startX+endX)/2-(platform.x+platform.width/2))/worldWidth*arc};
  });
}

// Treat the segmented roof as ONE existing gameplay surface. This syncs only
// its three presentation shaders to the same source-owned bronze-to-Void
// material, with a legible downstream destination while the gateway is visible.
// No independent clock; restart/retirement resets all three to canonical Void.
export function syncGatewayReceivingRoofColours(palette){
  const join=palette?.roofJoin;
  if(!palette?.top?.color || !join?.middle?.color ||
     !join?.successor?.color || !palette.topVoid)return false;
  join.middle.color.copy(palette.top.color).lerp(palette.topVoid,.52);
  join.successor.color.copy(palette.top.color).lerp(palette.topVoid,.91);
  return true;
}
