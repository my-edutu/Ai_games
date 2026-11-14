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
    update(proof) {
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
      const weight=valid?proof.oldWeight:0;
      // Rebuild every update from the original unaltered Floor9 tint: no
      // cumulative lerp, browser-frame-rate dependence or palette drift.
      for(const c of channels)c.color.copy(c.normal).lerp(c.bronze,weight);
      lastWeight=weight;sourceTick=valid?proof.sourceTick:null;
      return {sourceBound:valid,sourceTick,oldWeight:weight,
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

export function updateOriginalClockworkSuccessorRoute(deck, proof) {
  // Recreate each material's exact F9 baseline on every source receipt; no
  // accumulation, no timers, no mutation of action/guardian/hazard materials.
  const valid=proof?.sourceBound===true &&
    (proof.kind==='recorded-source-zero-hp' ||
     proof.kind==='verified-original-roof-receipt') &&
    Number.isSafeInteger(proof.sourceTick) &&
    Number.isSafeInteger(proof.crossingTick) &&
    Number.isFinite(proof.oldWeight) &&
    proof.oldWeight>=0 && proof.oldWeight<=1;
  const weight=valid?proof.oldWeight:0;
  if (deck) {
    deck.top.color.copy(deck.topVoid).lerp(deck.bronze,weight);
    deck.body.color.copy(deck.bodyVoid).lerp(deck.bronze,.82*weight);
    if(deck.rim)deck.rim.color.copy(deck.rimVoid).lerp(deck.bronze,.48*weight);
  }
  return {sourceBound:valid,sourceTick:valid?proof.sourceTick:null,
    oldWeight:weight};
}
