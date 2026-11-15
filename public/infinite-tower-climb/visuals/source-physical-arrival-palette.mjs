// Physically owned Clockwork -> Void entrance palette. This is not a floor
// transition or a new route: every shade follows an already-observed genuine
// zero-HP guardian, the original cap/roof and the living player on F9.
// Source distance, not the browser clock or slow WebGL submissions, controls
// how the original bronze engineering becomes the next biome's violet metal.
import { observedStagedOriginalCapBeforeRecordedCrossing } from './crossfloor-arrival.mjs';
const valid=Number.isSafeInteger;
const clamp01=n=>Math.min(1,Math.max(0,n));
const smooth=n=>{const t=clamp01(n);return t*t*(3-2*t);};

// Source-authenticated successor-platform contact after the first F9 jump.
// The earlier 16m-old-roof ceiling cut off the original GPU doorway as soon
// as the REAL climber mounted f9:p2 in the 1x source trace (ticks ~525-535).
// Only an existing F9 platform's exact authoritative sole+horizontal support
// permits the short additional raised-deck range. Never fabricate support.
export function observedSourceSuccessorRaisedDeck(source, roofY) {
  const p=source?.player;
  if(source?.floor!==9 || !p || !Number.isSafeInteger(roofY) ||
     ![p.x,p.y,p.halfWidth,p.halfHeight].every(valid) ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     p.grounded!==true || p.vy!==0 ||
     !(p.state==='standing' || p.state==='hurt') ||
     typeof p.groundedPlatformId!=='string' ||
     !/^f9:[a-z0-9-]+$/.test(p.groundedPlatformId) ||
     p.groundedPlatformId==='f9:ground' ||
     !Array.isArray(source.platforms))return false;
  const sole=p.y-p.halfHeight;
  // The real first F9 raised deck is often BELOW the old 16m airborne ceiling.
  // A grounded raised support must be accepted from the first positive step,
  // while the same immutable 23m maximum and strict current-platform contact
  // still veto distant or fabricated geometry.
  if(sole<=roofY || sole>roofY+230000)return false;
  return source.platforms.some(platform =>
    platform?.id===p.groundedPlatformId &&
    [platform.x,platform.y,platform.width,platform.height].every(valid) &&
    platform.width>0 && platform.height>0 &&
    platform.y+platform.height===sole &&
    p.x-p.halfWidth>=platform.x &&
    p.x+p.halfWidth<=platform.x+platform.width);
}

export function observedSourcePhysicalArrivalPalette(source,held=null) {
  const p=source?.player, w=source?.lastGuardianCrossing;
  if(!source || !p || source.lifecycle!=='running' ||
     source.floor!==9 || source.theme!=='void' ||
     typeof source.runToken!=='string' || !source.runToken ||
     !(p.health>0) || !valid(source.tick) ||
     ![p.x,p.y,p.halfWidth,p.halfHeight].every(valid) ||
     p.halfWidth<=0 || p.halfHeight<=0 ||
     !Array.isArray(source.platforms))return null;
  const ground=source.platforms.find(item=>item?.id==='f9:ground');
  if(!ground || ![ground.x,ground.y,ground.width,ground.height].every(valid) ||
     ground.width<=0 || ground.height<=0)return null;
  let crossingX,roofY,sourceTick,kind;
  if(w!=null){
    const cap=w.cap,guardian=w.guardian;
    if(w.runToken!==source.runToken || w.fromFloor!==8 ||
       w.toFloor!==9 || cap?.id!=='f8:cap' ||
       guardian?.kind!=='guardian' || guardian.active!==false ||
       !valid(guardian.health) || guardian.health>0 ||
       ![w.sourceTick,w.crossingX,w.exitX,w.halfWidth,w.halfHeight,
          cap.x,cap.y,cap.width,cap.height].every(valid) ||
       cap.width<=0 || cap.height<=0 ||
       w.halfWidth!==p.halfWidth || w.halfHeight!==p.halfHeight ||
       w.exitX!==cap.x+Math.floor(cap.width*.76) ||
       w.crossingX<w.exitX || w.crossingX>w.exitX+60000 ||
       ground.y+ground.height!==cap.y+cap.height)return null;
    crossingX=w.crossingX;roofY=cap.y+cap.height;
    sourceTick=w.sourceTick;kind='recorded-source-zero-hp';
    // If the old GPU original is still held, it must be the SAME real roof,
    // not an unrelated decorative gate from a prior expedition.
    if(held && (held.runToken!==source.runToken ||
       held.floor!==9 || held.oldRoofY!==roofY ||
       held.thresholdX!==w.exitX))return null;
  } else {
    // The first portrait browser receipt may arrive BEFORE the immutable
    // HP-zero crossing record. Accept ONLY the already validated same-run
    // former cap and grounded source corridor; never infer a victory.
    if(!observedStagedOriginalCapBeforeRecordedCrossing(source,held) ||
       ![held?.observedCrossingX,held?.oldRoofY,held?.sourceTick].every(valid) ||
       ground.y+ground.height!==held.oldRoofY)return null;
    crossingX=held.observedCrossingX;roofY=held.oldRoofY;
    sourceTick=held.sourceTick;kind='verified-original-roof-receipt';
  }
  const sole=p.y-p.halfHeight,travel=p.x-crossingX,age=source.tick-sourceTick;
  if(!valid(sole) || !valid(travel) || !valid(age) || age<0 || age>70 ||
     travel<0 || travel>100000 ||
     sole<roofY-2500 || sole>roofY+230000 ||
     p.x-p.halfWidth<ground.x ||
     p.x+p.halfWidth>ground.x+ground.width ||
     !(p.grounded===false && p.state==='airborne' &&
         p.groundedPlatformId==null && Number.isFinite(p.vy) ||
       p.grounded===true && (p.state==='standing' || p.state==='hurt') &&
         p.vy===0 && sole===roofY &&
         (p.groundedPlatformId==='f9:ground' ||
          p.groundedPlatformId==='f8:cap') ||
       observedSourceSuccessorRaisedDeck(source,roofY)))return null;
  // The full-body climber remains warm at the actual old sill, and walks
  // through a 90m material transition into the existing next-floor palette.
  // This changes NO geometry, physics, inputs, tick, enemy or gameplay state.
  // The actual F9 grounded runway may end only ~1.5m beyond the boss
  // crossing. An old horizontal-only 9m tint corridor could therefore NEVER
  // complete during honest onward gameplay, then disappear abruptly when the
  // avatar jumped up the next platform. Use the current authoritative feet
  // in BOTH walk and ascent dimensions, in the same fixed source units.
  // This is a conservative straight-line displacement from the REAL old
  // sill (not fictitious distance walked or a simulated extra frame).
  const rise=Math.max(0,sole-roofY);
  const pathDisplacement=Math.hypot(travel,rise);
  // The actual first supported F9 landing is 12.6m ABOVE the old cap,
  // but only ~2m horizontally beyond it. A 90m Euclidean palette runway
  // can therefore never finish before the source-authenticated 70-tick
  // doorway owner expires: the ORIGINAL opaque bronze world disappears
  // while its materials are still more than 80% bronze in normal-speed film.
  // Use TWO genuine source travel axes. The already-validated airborne feet
  // or exact grounded raised-platform support can earn the same completion
  // by rising 7m CLEAR of the source doorway, without any synthetic stride,
  // landing, collision, elapsed-display clock or invented scene frame.
  // Horizontal travel keeps its original full 90m envelope for ground runs.
  const horizontalProgress=smooth((travel-6000)/84000);
  const verticalProgress=smooth((rise-10000)/60000);
  const physicalProgress=Math.max(horizontalProgress,verticalProgress);
  // Original 1x desktop/portrait films: physical F9 source advanced through
  // the bronze sill while software WebGL had only returned ONE successor
  // frame. Floor9 platforms, authored architectural material, old gate and
  // sky independently sampled the latest source distance, replacing the
  // bronze world with violet before a human-visible optical handoff.
  //
  // Bind all existing material owners to the SAME actual retained original
  // GPU doorway and successful frame count. No pose/physics is held, no
  // fake crossing/geometry is made, and no source tick is replayed. A first
  // drawn F9 frame shows original bronze contact; successive REAL WebGL
  // submissions expose the authentic successor materials. When the source
  // leaves the 70-tick original corridor, the GPU owner retires or 12 frames
  // have submitted, ordinary world palettes apply without this display gate.
  const originalGpuVisible=held?.guardianGateRetained===true &&
    held.runToken===source.runToken && held.floor===9 &&
    valid(held.firstWorldRenderTick) &&
    held.firstWorldRenderTick<=source.tick &&
    source.tick-held.firstWorldRenderTick<=70 &&
    valid(held.submittedFrames) &&
    held.submittedFrames>=0 && held.submittedFrames<12 &&
    Number.isFinite(held.visibleSeconds) &&
    held.visibleSeconds>=0 && held.visibleSeconds<3 &&
    Number.isFinite(held.originalGatewayOpacity) &&
    held.originalGatewayOpacity>0 &&
    held.opticalExitSubmitted!==true;
  // A genuine 10,000-unit grounded stride after the first GPU return
  // must start tinting the REAL roof toward Void. Holding progress at zero
  // until multiple frames returned made the floor appear frozen under a
  // moving body, and failed the actual Three.js world contact regression.
  // Still permit at most ~5% material transition after the first return;
  // an unsubmitted first F9 frame remains bronze, and the full source
  // progress cannot overtake the old physical gateway until its own bounded
  // sequence has been drawn.
  // Actual native 1x recordings show only a few WebGL returns while the
  // authentic climber leaves the 70-tick original corridor. Spreading the
  // handoff across 12-15 returned frames made the scene remain nearly
  // opaque bronze and then jump to fully violet when the source witness
  // expired. Keep the first real F9 draw genuinely bronze, preserve the
  // small observed source stride after the first return, then let the
  // next THREE returned frames finish a source-earned physical departure.
  // Dropped RAFs and polls advance nothing. The same true source progress
  // is still the upper bound, and it never changes actor/physics state.
  const gpuProgress=originalGpuVisible
    ?held.submittedFrames===0?0:
      held.submittedFrames===1?smooth(2/15):
      smooth((held.submittedFrames-1)/3):1;
  const progress=Math.min(physicalProgress,gpuProgress);
  const oldWeight=1-progress;
  return {sourceBound:true,sourceTick:source.tick,crossingTick:sourceTick,
    kind,travel,rise,pathDisplacement,roofY,oldWeight,progress,
    horizontalProgress,verticalProgress,physicalProgress,
    ...(originalGpuVisible?{
      opticalBridgeSourceBound:true,
      originalGatewayGpuReturns:held.submittedFrames
    }:{}),
    limitation:'Original real 3D sill and source distance constrained by authentic old-gateway WebGL returns; NOT native pixel, fabricated floor, collider or review evidence'};
}

// One physically occupied ORIGINAL bronze arch, never a fabricated successor
// portal. Keep it solid until the recorded body has CLEARED its opening; after
// that, optical retirement is limited by BOTH genuine 3D departure and
// successful renderer submissions. In 1x footage the source climber can be
// halfway up the successor tower when the old GPU's 1.65s disposal timer
// fires: that deleted the original door at nonzero opacity. Permit a bounded
// 3s / 60-return retirement tail so its existing materials may actually fade
// to zero with genuine source ascent; never count a browser poll as a frame.
export function observedSourceGatewayDeparturePresence(source,held) {
  if(held?.guardianGateRetained!==true ||
     !valid(held?.submittedFrames) || held.submittedFrames<0 ||
     held.submittedFrames>60 ||
     !Number.isFinite(held.visibleSeconds) ||
     held.visibleSeconds<0 || held.visibleSeconds>=3 ||
     !valid(held.thresholdX)) return null;
  const physical=observedSourcePhysicalArrivalPalette(source,held);
  if(!physical?.sourceBound)return null;
  const p=source.player;
  const wholeBodyCleared=
    p.x-p.halfWidth>=held.thresholdX+4000 ||
    physical.rise>=70000;
  // One original GPU return MUST show the complete bronze gate and
  // survivor. After that, real source clearance and actual successful
  // submissions allow its original material to recede within a finite
  // four-return sequence. The earlier .9s/6-return minimum could not finish
  // before the observed cold video advanced 60-70 authoritative ticks,
  // producing a one-frame discontinuity at source-proof retirement.
  const displayedSeconds=smooth((held.visibleSeconds-.08)/.30);
  const submittedFrames=smooth((held.submittedFrames-1)/3);
  const visibleProgress=Math.min(displayedSeconds,submittedFrames);
  // Do not erase the real bronze gate while the actual climber still occupies
  // the threshold. Only a fully-cleared original opening can retire its
  // physically shared surrounding gallery / material.
  const consumed=wholeBodyCleared
    ?Math.min(physical.progress,visibleProgress):0;
  return {sourceBound:true,sourceTick:source.tick,
    actualSourcePosition:true,wholeBodyCleared,
    opacity:1-consumed,sourceProgress:physical.progress,
    submittedProgress:visibleProgress,
    limitation:'Existing original gate material only; no actual video pixel or acceptance claim'};
}

// P0 physical 8→9 rendering: one bounded, source-authenticated optical
// envelope for the ORIGINAL bronze gateway, connected roof and gallery.
// Browser acceptance and a returned WebGL frame do not establish native pixels.
// Only the actual old-world material owners contribute; this cannot create
// a scene, new actor, collider, floor, victory or camera timeline.
const clamp = value => Math.max(0,Math.min(1,value));
export function sourceOwnedOriginalArchitectureCoverage(source,held) {
  if (!source || !held || held.guardianGateRetained!==true ||
      source.lifecycle!=='running' || source.floor!==9 ||
      source.theme!=='void' || !(source.player?.health>0) ||
      typeof source.runToken!=='string' || !source.runToken ||
      held.runToken!==source.runToken || held.floor!==9 ||
      !Number.isSafeInteger(source.tick) ||
      !Number.isSafeInteger(held.firstWorldRenderTick) ||
      source.tick<held.firstWorldRenderTick ||
      source.tick-held.firstWorldRenderTick>70 ||
      !Number.isSafeInteger(held.submittedFrames) ||
      held.submittedFrames<0 || held.submittedFrames>=30 ||
      !Number.isFinite(held.visibleSeconds) ||
      held.visibleSeconds<0 || held.visibleSeconds>=2.8 ||
      held.opticalExitSubmitted===true) return 0;
  let coverage=0;
  const sample=opacity=>{
    if(Number.isFinite(opacity)) coverage=Math.max(coverage,clamp(opacity));
  };
  // The world may pass a READ-ONLY primitive witness to the camera/sky
  // rather than expose actual writable GPU materials. Its scalar coverage
  // is measured from those same real meshes by the world owner.
  sample(held.originalArchitectureCoverage);
  sample(held.originalGatewayOpacity);
  sample(held.originalDeckSurface?.opacity);
  if(Array.isArray(held.originalGalleryMaterials))
    for(const material of held.originalGalleryMaterials) sample(material?.opacity);
  return coverage;
}
export function sourceAlignedIncomingShaftOpacity(source,held,nominalOpacity){
  if(!Number.isFinite(nominalOpacity))return 0;
  // The OLD cap can disappear only when genuinely expired/retired; neither
  // a speculative old run nor an expired resource may suppress normal F9.
  return Math.min(clamp(nominalOpacity),
    1-sourceOwnedOriginalArchitectureCoverage(source,held));
}
