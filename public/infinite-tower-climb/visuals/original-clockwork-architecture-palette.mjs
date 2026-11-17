// P0: a single real 8->9 crossing must not recolor the enormous incoming
// architecture violet while the original bronze doorway is still visible.
// Only source-backed presentation changes; never a collider, projectile,
// warning/hazard tell, physics state, fake platform or camera control.
// Keep one existing color per architectural material and alter no geometry.
const ARCHITECTURE = Object.freeze({
  stone:'stone',dark:'dark',metal:'metal',copper:'metal',
  edge:'edge',landing:'landing',tread:'dark',ceramic:'stone'
});
export const ORIGINAL_CLOCKWORK_ARCHITECTURAL_CHANNELS = ARCHITECTURE;

// Optical history is NOT a new source event. A cold WebGL renderer can submit
// eight frames without even a quarter-second of visible material transition.
// The former frame-count-only retirement was abruptly erasing the genuine
// Clockwork bearing room from both original 1x films. This one same-run
// presentation clock requires BOTH returned frames and their bounded elapsed
// rendered duration; it never synthesizes a crossing, collision or actor.
// Preserve a finite 60-return/160-source-tick safety ceiling.
// The actor, floor, guardian and collision state are never sampled from this
// display-only record, and a stale poll cannot spend the return budget.
const actualSourceKind=kind=>kind==='recorded-source-zero-hp' ||
  kind==='verified-original-roof-receipt';
export const SOURCE_EARNED_RETURN_SECONDS=.95;
const MIN_SOURCE_EARNED_RETURN_FRAMES=5;
export function advanceSourceEarnedPaletteReturn(state,returnedDt) {
  if(!state ||
     !Number.isSafeInteger(state.returnedFrames) ||
     state.returnedFrames<0 || state.returnedFrames>60 ||
     !Number.isFinite(state.returnedSeconds) ||
     state.returnedSeconds<0 || state.returnedSeconds>1.5 ||
     !Number.isFinite(returnedDt) || returnedDt<0) return null;
  // Callers must do so only after a successful source-matched render return.
  // Browser polls and GPU stalls never advance a previously certified image.
  const returnedFrames=Math.min(60,state.returnedFrames+1);
  const returnedSeconds=Math.min(1.5,
    state.returnedSeconds+Math.min(.1,returnedDt));
  const progress=Math.min(1,returnedSeconds/SOURCE_EARNED_RETURN_SECONDS,
    returnedFrames/MIN_SOURCE_EARNED_RETURN_FRAMES);
  return {returnedFrames,returnedSeconds,progress};
}
const boundedWeight=weight=>Number.isFinite(weight) &&
  weight>=0 && weight<=1;
// A historical optical tail represents material actually submitted by the
// SAME original 3D renderer. A stored source certificate alone is not an
// image, and no returned call can contribute more than the existing 100ms
// bounded display interval. Reject records claiming impossible time or an
// unrendered predecessor, rather than blending a fictitious bronze frame.
function actualReturnedPaletteHistory(frames,seconds) {
  return Number.isSafeInteger(frames) && frames>=1 && frames<=60 &&
    Number.isFinite(seconds) && seconds>=0 && seconds<=1.5 &&
    seconds<=Math.min(1.5,frames*.1)+1e-9;
}
function materialTailValid(tail) {
  return tail?.historicalOpticalTail===true &&
    tail.previouslySourceVerified===true &&
    Number.isSafeInteger(tail.authenticatedSourceTick) &&
    Number.isSafeInteger(tail.authenticatedCrossingTick) &&
    tail.authenticatedSourceTick>=tail.authenticatedCrossingTick &&
    actualReturnedPaletteHistory(tail.returnedFrames,tail.returnedSeconds) &&
    Math.min(tail.returnedSeconds/SOURCE_EARNED_RETURN_SECONDS,
      tail.returnedFrames/MIN_SOURCE_EARNED_RETURN_FRAMES)<1 &&
    boundedWeight(tail.oldWeight);
}
export function observedVerifiedClockworkPaletteTail(source,handoff,departure) {
  const proof=handoff?.lastVerifiedProof;
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(source.player?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     handoff?.runToken!==source.runToken ||
     handoff.retiring!==true ||
     !actualReturnedPaletteHistory(
       handoff.retirementFrames,handoff.retirementSeconds) ||
     Math.min(handoff.retirementSeconds/SOURCE_EARNED_RETURN_SECONDS,
       handoff.retirementFrames/MIN_SOURCE_EARNED_RETURN_FRAMES)>=1 ||
     proof?.runToken!==source.runToken ||
     !actualSourceKind(proof.kind) ||
     !Number.isSafeInteger(proof.sourceTick) ||
     !Number.isSafeInteger(proof.crossingTick) ||
     proof.crossingTick>proof.sourceTick ||
     !Number.isSafeInteger(source.tick) ||
     source.tick<proof.sourceTick ||
     source.tick-proof.crossingTick>160 ||
     !boundedWeight(departure))return null;
  return {historicalOpticalTail:true,previouslySourceVerified:true,
    runToken:source.runToken,authenticatedSourceTick:proof.sourceTick,
    authenticatedCrossingTick:proof.crossingTick,
    returnedFrames:handoff.retirementFrames,
    returnedSeconds:handoff.retirementSeconds,oldWeight:1-departure,
    evidence:'Past genuine same-run physical guardian exit; this is NOT a current source sample or native-film acceptance'};
}


/**
 * One physically authenticated palette sample for BOTH existing Three.js F9
 * geometry and its sky/fog/light rig. The already-source-proven eight-return
 * material tail has no authority to create an F9 crossing, actor, camera or
 * sampled frame. Returning scalars prevents scene callers mutating world GPU
 * material ownership. Do not use this as evidence that native pixels changed.
 */
export function observedCertifiedClockworkHorizon(source,proof,opticalTail=null) {
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(source.player?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     !Number.isSafeInteger(source.tick))return null;
  const current=proof?.sourceBound===true &&
    actualSourceKind(proof.kind) &&
    Number.isSafeInteger(proof.sourceTick) &&
    proof.sourceTick===source.tick &&
    Number.isSafeInteger(proof.crossingTick) &&
    proof.crossingTick<=source.tick &&
    boundedWeight(proof.oldWeight);
  if(current) return {
    sourceBound:true,sourceTick:source.tick,oldWeight:proof.oldWeight,
    historicalOpticalTail:false,kind:'live-same-run-physical-gateway'
  };
  if(!materialTailValid(opticalTail) ||
     opticalTail.runToken!==source.runToken ||
     source.tick<opticalTail.authenticatedSourceTick ||
     source.tick-opticalTail.authenticatedCrossingTick>160)
    return null;
  return {
    sourceBound:true,sourceTick:source.tick,oldWeight:opticalTail.oldWeight,
    historicalOpticalTail:true,kind:'previous-certified-returned-material'
  };
}

export function createOriginalClockworkArchitecturalPalette(materials,bronzePalette) {
  const channels = [];
  for (const [key,sourceKey] of Object.entries(ARCHITECTURE)) {
    const color=materials?.[key]?.color;
    const warm=bronzePalette?.[sourceKey];
    if(!color || typeof color.clone!=='function' ||
        typeof color.copy!=='function' || typeof color.lerp!=='function' ||
        !Number.isSafeInteger(warm) || warm<0 || warm>0xffffff)continue;
    channels.push({key,color,normal:color.clone(),bronze:color.clone().set(warm)});
  }
  let lastWeight=0,sourceTick=null;
  return {
    update(proof,opticalTail=null) {
      // An original already-defeated guardian crossing OR independently
      // checked original grounded receipt is required. A floor-number change,
      // delayed RAF, or retained decoration is never proof on its own.
      const valid=proof?.sourceBound===true &&
        (proof.kind==='recorded-source-zero-hp' ||
         proof.kind==='verified-original-roof-receipt') &&
        Number.isSafeInteger(proof.sourceTick) &&
        Number.isSafeInteger(proof.crossingTick) &&
        Number.isFinite(proof.oldWeight) &&
        proof.oldWeight>=0 && proof.oldWeight<=1;
      const tail=!valid && materialTailValid(opticalTail);
      const weight=valid?proof.oldWeight:tail?opticalTail.oldWeight:0;
      // Rebuild every update from the original unaltered Floor9 tint: no
      // cumulative lerp, browser-frame-rate dependence or palette drift.
      for(const c of channels)c.color.copy(c.normal).lerp(c.bronze,weight);
      lastWeight=weight;sourceTick=valid?proof.sourceTick:null;
      return {sourceBound:valid,historicalOpticalTail:tail,sourceTick,oldWeight:weight,
        architecturalMaterials:channels.length,
        untouched:'hazards, warnings, emissive route and character cues'};
    },
    restore(){
      for(const c of channels)c.color.copy(c.normal);
      lastWeight=0;sourceTick=null;
    },
    diagnostics(){return {sourceTick,oldWeight:lastWeight,
      architecturalMaterials:channels.length,drawCallsAdded:0,
      geometryAdded:0,sourceBound:sourceTick!==null};}
  };
}

/*
 * First 90m of the TRUE source-reached Floor9 runway, including the early
 * moving deck, shares the same old bronze material language as its physically
 * original Floor8 gateway. This does NOT tint globally shared Void crystal:
 * the actionable platform skin is a bounded floor-owned Three material set.
 * In a software-WebGL film, an opaque violet platform appeared before the
 * actual inherited doorway cleared; the incoming route must not contradict
 * the already-warm shaft, sky and original cap in that same rendered shot.
 */
export function observedOriginalClockworkSuccessorDeck(platform, held, runToken) {
  if (!platform || typeof platform.id!=='string' ||
      !platform.id.startsWith('f9:') ||
      typeof runToken!=='string' || !runToken ||
      held?.runToken!==runToken || held.floor!==9 ||
      held.guardianGateRetained!==true ||
      !held.originalDeckSurface?.color ||
      !Number.isSafeInteger(held.oldRoofY) ||
      !Number.isSafeInteger(platform.y) ||
      !Number.isSafeInteger(platform.height) ||
      platform.height<=0) return false;
  const roof=platform.y+platform.height;
  // The source-physically continuous threshold owns only the true landing
  // roof. Its FIRST raised/moving successor is already another place: painting
  // that entire elevated route bronze hid the genuine Void destination for
  // multiple original native frames after the Floor9 HUD appeared.
  // Keep the old gateway and its exact-height grounded receiving roof warm,
  // while the real, separately supported upper climb retains original Void
  // materials from its first successful draw. No invented platform or contact.
  return platform.id==='f9:ground' && platform.kind!=='moving' &&
    Number.isSafeInteger(roof) &&
    roof>=held.oldRoofY-2500 && roof<=held.oldRoofY+2500;
}

// Source-earned raised decks use already authored, identical PBR shader types,
// but separate two shared material owners. Otherwise the global old-room color
// lease repaints every elevated F9 platform bronze even when the player could
// clearly SEE the genuine next biome past the physical threshold. This is a
// spatial distinction, not an artificial scene cut or a new visual prop.
export function createSourceEarnedVoidDepartureMaterials(materials,held,runToken) {
  if(held?.floor!==9 || held.guardianGateRetained!==true ||
     typeof runToken!=='string' || !runToken ||
     held.runToken!==runToken ||
     !materials?.landing?.isMaterial || !materials?.copper?.isMaterial ||
     typeof materials.landing.clone!=='function' ||
     typeof materials.copper.clone!=='function')return null;
  const landing=materials.landing.clone();
  const rim=materials.copper.clone();
  landing.name='SourceEarnedVoidRaisedLanding';
  rim.name='SourceEarnedVoidRaisedDeckRim';
  return {landing,rim};
}

export function updateOriginalClockworkSuccessorRoute(deck, proof, opticalTail=null) {
  // Recreate each material's exact F9 baseline on every source receipt; no
  // accumulation, no timers, no mutation of action/guardian/hazard materials.
  const valid=proof?.sourceBound===true &&
    (proof.kind==='recorded-source-zero-hp' ||
     proof.kind==='verified-original-roof-receipt') &&
    Number.isSafeInteger(proof.sourceTick) &&
    Number.isSafeInteger(proof.crossingTick) &&
    Number.isFinite(proof.oldWeight) &&
    proof.oldWeight>=0 && proof.oldWeight<=1;
  const tail=!valid && materialTailValid(opticalTail);
  const weight=valid?proof.oldWeight:tail?opticalTail.oldWeight:0;
  if (deck) {
    deck.top.color.copy(deck.topVoid).lerp(deck.bronze,weight);
    deck.body.color.copy(deck.bodyVoid).lerp(deck.bronze,.82*weight);
    if(deck.rim)deck.rim.color.copy(deck.rimVoid).lerp(deck.bronze,.48*weight);
  }
  return {sourceBound:valid,historicalOpticalTail:tail,
    sourceTick:valid?proof.sourceTick:null,
    oldWeight:weight};
}
