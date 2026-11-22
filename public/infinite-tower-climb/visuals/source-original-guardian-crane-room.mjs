// An ORIGINAL, authored Clockwork load path built BEFORE Floor 8's boss win.
// The original 1x desktop/portrait videos show the old room vanish into a much
// wider Void ring: the historical mesh extractor had 675 source triangles but
// ZERO left/right flank faces. Do not mislabel new steel as extracted history.
// Instead prepaint two *real* F8-cap-anchored outboard crane frames. The SAME
// rendered meshes are then reparented with the original cap/gateway on F9.
// No cloned doorway, collision, platform, source event, or future actor pose.
const finite=Number.isFinite, integer=Number.isSafeInteger;
export function planOriginalGuardianOutboardCranes(plan) {
  if(plan?.structuralPreviewOnly!==true || plan.sourceBound!==true ||
      plan.oldCapId!=='f8:cap' || plan.receivingPlatformId!=='f9:ground' ||
      plan.nonColliding!==true || !integer(plan.thresholdX) ||
      !Array.isArray(plan.stations) || plan.stations.length!==6 ||
      !Array.isArray(plan.ties) || plan.ties.length!==5 ||
      ![plan.innerPierRadius,plan.outerCrownRadius].every(finite) ||
      plan.innerPierRadius<19 || plan.innerPierRadius>21 ||
      plan.outerCrownRadius<29 || plan.outerCrownRadius>31 ||
      !plan.stations.every((s,i)=>integer(s?.sourceX) &&
        finite(s?.angle) && (i===0 ||
        (s.sourceX>plan.stations[i-1].sourceX &&
         s.angle>plan.stations[i-1].angle))) ||
      plan.stations[0].sourceX>=plan.thresholdX ||
      plan.stations[5].sourceX<=plan.thresholdX ||
      plan.stations[5].sourceX-plan.stations[0].sourceX<96000)
    return null;

  const outer=plan.outerCrownRadius+1.25; // 3.8m OUTSIDE the walkable r27.2 lip
  const inner=plan.innerPierRadius;
  const gateAngle=plan.stations[0].angle+
    (plan.thresholdX-plan.stations[0].sourceX)*
    (plan.stations[5].angle-plan.stations[0].angle)/
    (plan.stations[5].sourceX-plan.stations[0].sourceX);
  if(!finite(gateAngle) || gateAngle<=plan.stations[0].angle ||
      gateAngle>=plan.stations[5].angle) return null;
  const beams=[];
  for(const station of [plan.stations[0],plan.stations[5]]) {
    const a=station.angle;
    // Low compression knee is fully BELOW the real source roof as it passes
    // through the r22.4..27.2 walking strip; no steel curtain through boots.
    beams.push({role:'under-roof-knee',
      from:[a,inner,-4],to:[a,outer,-1.2],radius:.20});
    // Piers sit outside the source walking annulus and frame rather than
    // bisect the original source-held live guardian/hero corridor.
    beams.push({role:'outboard-pier',
      from:[a,outer,-1.2],to:[a,outer,15.6],radius:.26});
    beams.push({role:'upper-return',
      from:[a,outer,15.6],to:[a,inner,12.4],radius:.16});
    beams.push({role:'crown-tie',
      from:[a,outer,15.6],to:[gateAngle,outer,18.2],radius:.13});
  }
  return {sourceBound:true,previewOnly:true,nonColliding:true,
    oldCapId:'f8:cap',receivingPlatformId:'f9:ground',
    thresholdX:plan.thresholdX, beams,
    // This architecture does not certify native footage or collision.
    evidence:'New original art painted in F8 and retained as identical F9 mesh'};
}
