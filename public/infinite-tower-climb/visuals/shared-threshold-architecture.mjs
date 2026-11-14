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
