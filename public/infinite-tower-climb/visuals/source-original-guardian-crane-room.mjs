// An ORIGINAL, authored Clockwork load path built BEFORE Floor 8's boss win.
// The original 1x desktop/portrait videos show the old room vanish into a much
// wider Void ring: the historical mesh extractor had 675 source triangles but
// ZERO left/right flank faces. Do not mislabel new steel as extracted history.
// Instead prepaint two *real* F8-cap-anchored crane frames. A source-pinned
// 390x844 film at tick 476-530 showed their former r31.25 foreground piers
// in the camera-side corridor to the moving hero. Physically re-engineer
// the SAME eight original members as rear CORE-SIDE cantilevers, behind
// the r22.4 inner edge of the source-owned walking ring. The same original
// meshes are then reparented with the original cap/gateway on F9.
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

  const inner=plan.innerPierRadius;
  // Exterior follow cameras view the r25 hero FROM OUTSIDE the cylinder:
  // a pier beyond r27.18 still becomes a large near-field camera curtain.
  // Preserve the two real prepainted piers, but transfer load to the inner
  // reinforced clockwork core, leaving the entire annular actor sightline
  // r22.4..27.18 physically unobstructed by these optional members.
  const corePier=inner+1.55;
  if(corePier>=22.4)return null;
  const gateAngle=plan.stations[0].angle+
    (plan.thresholdX-plan.stations[0].sourceX)*
    (plan.stations[5].angle-plan.stations[0].angle)/
    (plan.stations[5].sourceX-plan.stations[0].sourceX);
  if(!finite(gateAngle) || gateAngle<=plan.stations[0].angle ||
      gateAngle>=plan.stations[5].angle) return null;
  const beams=[];
  for(const station of [plan.stations[0],plan.stations[5]]) {
    const a=station.angle;
    // All eight SAME F8-authored members now live behind the genuine
    // inner roof lip; no front pier or overhead tie is between an exterior
    // portrait camera and the original HP-open hero/gateway/raised route.
    // The two piers join the prepainted inner canopy at y16.4, while
    // crown ties maintain one mechanically continuous silhouette at y18.2.
    beams.push({role:'under-roof-knee',
      from:[a,inner,-4],to:[a,corePier,-1.2],radius:.20});
    beams.push({role:'core-wall-pier',
      from:[a,corePier,-1.2],to:[a,corePier,16.4],radius:.26});
    beams.push({role:'upper-return',
      from:[a,corePier,16.4],to:[a,inner,16.4],radius:.16});
    beams.push({role:'crown-tie',
      from:[a,corePier,16.4],to:[gateAngle,corePier,18.2],radius:.13});
  }
  return {sourceBound:true,previewOnly:true,nonColliding:true,
    oldCapId:'f8:cap',receivingPlatformId:'f9:ground',
    thresholdX:plan.thresholdX, beams,
    // This architecture does not certify native footage or collision.
    evidence:'New original art painted in F8 and retained as identical F9 mesh'};
}
