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

// Optical history is NOT a new source event. The live F9 presenter may keep
// the last certified same-run old->new material weight for at most eight
// SUCCESSFUL WebGL returns after the original physical witness expires.
// The actor, floor, guardian and collision state are never sampled from this
// display-only record, and a stale poll cannot spend the return budget.
const actualSourceKind=kind=>kind==='recorded-source-zero-hp' ||
  kind==='verified-original-roof-receipt';
const boundedWeight=weight=>Number.isFinite(weight) &&
  weight>=0 && weight<=1;
function materialTailValid(tail) {
  return tail?.historicalOpticalTail===true &&
    tail.previouslySourceVerified===true &&
    Number.isSafeInteger(tail.authenticatedSourceTick) &&
    Number.isSafeInteger(tail.authenticatedCrossingTick) &&
    tail.authenticatedSourceTick>=tail.authenticatedCrossingTick &&
    Number.isSafeInteger(tail.returnedFrames) &&
    tail.returnedFrames>=0 && tail.returnedFrames<8 &&
    boundedWeight(tail.oldWeight);
}
export function observedVerifiedClockworkPaletteTail(source,handoff,departure) {
  const proof=handoff?.lastVerifiedProof;
  if(source?.floor!==9 || source.theme!=='void' ||
     source.lifecycle!=='running' || !(source.player?.health>0) ||
     typeof source.runToken!=='string' || !source.runToken ||
     handoff?.runToken!==source.runToken ||
     handoff.retiring!==true ||
     !Number.isSafeInteger(handoff.retirementFrames) ||
     handoff.retirementFrames<0 || handoff.retirementFrames>=8 ||
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
    authenticatedSourceTick:proof.sourceTick,
    authenticatedCrossingTick:proof.crossingTick,
    returnedFrames:handoff.retirementFrames,oldWeight:1-departure,
    evidence:'Past genuine same-run physical guardian exit; this is NOT a current source sample or native-film acceptance'};
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
  return Number.isSafeInteger(roof) &&
    roof>=held.oldRoofY-2500 && roof<=held.oldRoofY+900000;
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
