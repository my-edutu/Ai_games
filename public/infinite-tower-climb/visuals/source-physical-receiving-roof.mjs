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

// The authentic Floor 8 guardian cap and ACTUAL Floor 9 ground share one
// physical collision-height threshold. These anchors place newly authored,
// noninteractive 3D supporting metal UNDER that already walkable roof.
// They do not re-create the old floor, simulate contact or move the gateway.
export function actualGatewayReceivingLoadPathBays(platform,worldWidth,thresholdX,oldCap,arc=2.2) {
  const spans=actualGatewayReceivingRoofSpans(platform,worldWidth,thresholdX,arc);
  const safe=Number.isSafeInteger;
  if(!spans || !oldCap || oldCap.id!=='f8:cap' ||
     ![oldCap.x,oldCap.width].every(safe) || oldCap.width<=0 ||
     oldCap.x<platform.x || oldCap.x+oldCap.width>platform.x+platform.width ||
     thresholdX<=oldCap.x+16000 || thresholdX>=oldCap.x+oldCap.width-16000 ||
     !spans.every((span,i)=>span.kind===['approach','threshold','successor'][i]))
    return null;
  // Two load path anchors per EXISTING source-grounded material band.
  // Each stays inside the physical deck footprint and comes from its
  // immutable x-to-cylindrical-angle transform, not another floor model.
  return spans.map(span=>{
    const anchors=[.23,.77].map(t=>{
      const x=Math.round(span.startX+(span.endX-span.startX)*t);
      return {sourceX:x,angle:(x-(platform.x+platform.width/2))/worldWidth*arc};
    });
    return {kind:span.kind,startX:span.startX,endX:span.endX,
      anchors,sourceBound:true};
  });
}

// The real source-owned F9 landing top, steel load beam, rim and emissive
// underlip must expose the same physical gateway-to-Void spatial transition.
// No independent clock, collider, platform or new gateway is introduced.
const BAND_REVEAL=Object.freeze({middle:.52,successor:.91});
const BAND_CHANNELS=Object.freeze([
  ['beam','body','bodyVoid'],['edge','rim','rimVoid'],
  ['lamp','glow','glowVoid','glowEmissiveVoid']
]);
export function syncGatewayReceivingRoofColours(palette){
  const join=palette?.roofJoin;
  if(!palette?.top?.color || !join?.middle?.color ||
     !join?.successor?.color || !palette.topVoid)return false;
  for(const [kind,mix] of Object.entries(BAND_REVEAL)){
    join[kind].color.copy(palette.top.color).lerp(palette.topVoid,mix);
    for(const [name,key,voidKey,emissiveVoid] of BAND_CHANNELS){
      const material=join[`${name}${kind==='middle'?'Middle':'Successor'}`];
      const original=palette[key],destination=palette[voidKey];
      if(!material?.color || !original?.color || !destination)continue;
      material.color.copy(original.color).lerp(destination,mix);
      if(emissiveVoid && material.emissive && original.emissive &&
         palette[emissiveVoid])
        material.emissive.copy(original.emissive)
          .lerp(palette[emissiveVoid],mix);
    }
  }
  return true;
}

// Actual original-gateway owner retirement/restart must clear ALL old bronze
// from its real grounded F9 landing, not just the top's former shader.
export function resetGatewayReceivingRoofColours(palette){
  if(!palette?.top?.color || !palette.topVoid)return false;
  for(const [key,destinationKey,emissiveKey] of [
    ['top','topVoid',null],['body','bodyVoid',null],
    ['rim','rimVoid',null],['glow','glowVoid','glowEmissiveVoid'],
    ['crystal','crystalVoid','crystalEmissiveVoid']
  ]){
    const material=palette[key],destination=palette[destinationKey];
    if(!material?.color || !destination)continue;
    material.color.copy(destination);
    if(emissiveKey && material.emissive && palette[emissiveKey])
      material.emissive.copy(palette[emissiveKey]);
  }
  syncGatewayReceivingRoofColours(palette);
  return true;
}
