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



/**
 * Continuous, open-sided source-aligned F8 guardian -> REAL F9 ground
 * ceiling frame. Unlike isolated underside braces, these structural ribs
 * remain visible ABOVE the authentic traversable roof, giving the old bronze
 * machine room a supported physical successor rather than an instant
 * replacement. All anchors come from its current real F9 platform and the
 * previously verified original F8 guardian cap; none changes a collider,
 * enemy, input, source state, gate or victory condition.
 *
 * Exactly six stations around the actual already-walked gateway sill, not a
 * repeated fake portal on every platform. The interior support is outside
 * the real r=22.4..27.18 walking ring. Overhead members remain >6m above
 * its source-aligned top; NO exterior foreground posts cross the hero lane.
 */
export function actualGatewayReceivingGalleryCanopy(platform,worldWidth,thresholdX,oldCap,arc=2.2) {
  const bays=actualGatewayReceivingLoadPathBays(
    platform,worldWidth,thresholdX,oldCap,arc);
  if(!bays)return null;
  const startX=Math.max(oldCap.x+Math.ceil(oldCap.width*.52),
    thresholdX-48000);
  const endX=Math.min(platform.x+platform.width-12000,
    thresholdX+112000);
  if(endX-startX<96000 || startX>=thresholdX ||
     endX<=thresholdX+48000)return null;
  const stations=[];
  for(let i=0;i<6;i++){
    const sourceX=Math.round(startX+(endX-startX)*i/5);
    const band=bays.find(b=>sourceX>=b.startX &&
      sourceX<=(b.endX===platform.x+platform.width?b.endX:b.endX-1));
    if(!band)return null;
    const angle=(sourceX-(platform.x+platform.width/2))/worldWidth*arc;
    if(!Number.isFinite(angle))return null;
    stations.push({sourceX,angle,kind:band.kind});
  }
  if(!stations.some(s=>s.sourceX<thresholdX) ||
     !stations.some(s=>s.sourceX>thresholdX) ||
     stations.some((s,i)=>i>0&&s.angle<=stations[i-1].angle))
    return null;
  const ties=[];
  for(let i=1;i<stations.length;i++){
    if(stations[i].angle-stations[i-1].angle>.25)return null;
    ties.push({fromAngle:stations[i-1].angle,toAngle:stations[i].angle,
      kind:stations[i].kind});
  }
  return {sourceBound:true,oldCapId:'f8:cap',
    receivingPlatformId:'f9:ground',stations,ties,
    innerPierRadius:20.4,outerCrownRadius:30.0,
    minHeroRoofClearance:6.1,thresholdX,nonColliding:true};
}

/**
 * The ORIGINAL F8 canopy is painted before the guardian is defeated and
 * retained as the SAME three-dimensional owner over the genuine F9 ground.
 * Six roof stations used to form a solid forest of foreground posts exactly
 * where the earned doorway and full climber must be read on mobile. Open a
 * single source-coordinate portal bay by omitting only the two central
 * NONCOLLIDING vertical/diagonal legs. All five continuous crown/tie spans
 * and four outboard load-bearing stations remain in the original room and
 * are carried unchanged across the floor transition. This never opens the
 * authoritative guardian lock or creates a second door/platform/collision.
 */
export function sourceOpenGuardianRoofLoadPath(plan){
  const stations=plan?.stations,ties=plan?.ties;
  if(plan?.sourceBound!==true || plan.oldCapId!=='f8:cap' ||
      plan.receivingPlatformId!=='f9:ground' ||
      plan.nonColliding!==true || !Number.isSafeInteger(plan.thresholdX) ||
      !Array.isArray(stations) || stations.length!==6 ||
      !Array.isArray(ties) || ties.length!==5 ||
      !stations.every((station,i)=>Number.isSafeInteger(station?.sourceX) &&
        Number.isFinite(station.angle) &&
        (i===0 || (station.sourceX>stations[i-1].sourceX &&
          station.angle>stations[i-1].angle))) ||
      !ties.every((tie,i)=>tie?.fromAngle===stations[i].angle &&
        tie?.toAngle===stations[i+1].angle))return null;
  const right=stations.findIndex(station=>station.sourceX>plan.thresholdX);
  if(right!==2 && right!==3)return null;
  const left=right-1;
  if(stations[left].sourceX>=plan.thresholdX ||
     stations[right].sourceX<=plan.thresholdX)return null;
  return {
    sourceBound:true,thresholdX:plan.thresholdX,nonColliding:true,
    omittedLegSourceXs:[stations[left].sourceX,stations[right].sourceX],
    supportStations:stations.filter((station,i)=>i!==left&&i!==right),
    overheadTies:ties
  };
}

/**
 * This early frame has an ACTUAL generated F8 cap and source-published exit,
 * not an already-generated next-floor state. The successor ground formula in
 * the opt-in deterministic generator is full-width and shares this roof Y.
 * Reserve only NONCOLLIDING environmental steel before the floor changes.
 */
export function prebuildOriginalGuardianCanopyPlan(cap,width,exitX,arc=2.2){
  const safe=Number.isSafeInteger;
  if(cap?.id!=='f8:cap'||
     ![cap.x,cap.y,cap.width,cap.height,width,exitX].every(safe)||
     width<120000 || cap.height!==12000 ||
     cap.x!==Math.floor(width*.24) ||
     cap.width!==Math.floor(width*.52) ||
     exitX!==cap.x+Math.floor(cap.width*.76) ||
     !safe(cap.y+cap.height))return null;
  const plan=actualGatewayReceivingGalleryCanopy(
    {id:'f9:ground',x:0,width},width,exitX,cap,arc);
  return plan?{...plan,anticipatedRoofY:cap.y+cap.height,
    structuralPreviewOnly:true,authoritativeGameplay:false}:null;
}

// The real source-owned F9 landing top, steel load beam, rim and emissive
// underlip must expose the same physical gateway-to-Void spatial transition.
// No independent clock, collider, platform or new gateway is introduced.
const BAND_REVEAL=Object.freeze({middle:.52,successor:.91});
const BAND_CHANNELS=Object.freeze([
  ['beam','body','bodyVoid'],['edge','rim','rimVoid'],
  ['lamp','glow','glowVoid','glowEmissiveVoid']
]);
export function syncGatewayReceivingRoofColours(palette, sourceCertifiedReveal=1){
  const join=palette?.roofJoin;
  if(!palette?.top?.color || !join?.middle?.color ||
     !join?.successor?.color || !palette.topVoid ||
     !Number.isFinite(sourceCertifiedReveal) ||
     sourceCertifiedReveal<0 || sourceCertifiedReveal>1)return false;
  // Native original 1x Floor8→9 film showed a largely violet receiving
  // rim under a still-opaque bronze door: fixed 52%/91% Void colors were
  // being applied to the SAME F9 roof on its first GPU submission. The
  // source-earned old-roof material and all its real top/beam/rim/lamp
  // sectors now spend ONE optical departure scalar. Do not reveal the
  // successor color until the same original gateway/roof actually departs.
  // The relative spatial read (middle before successor) survives, but it
  // never overrides the live source-certified physical roof.
  for(const [kind,spatialReveal] of Object.entries(BAND_REVEAL)){
    const mix=spatialReveal*sourceCertifiedReveal;
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
