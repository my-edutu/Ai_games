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
