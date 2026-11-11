// Scene-only, source-observed guardian camera guard. No simulation decisions,
// camera cuts, screen-space substitutes, randomness, new draw calls or timing authority.
// This module stays pure so mobile/desktop recovery rules can be tested without WebGL.
const finite = Number.isFinite;

export function guardianFramePressure(ndc, aspect) {
  if (!Array.isArray(ndc) || ndc.length !== 3 || !ndc.every(finite) ||
    !finite(aspect) || aspect <= 0) return Infinity;
  const horizontal = aspect < .85 ? .82 : .88;
  return Math.max(0, Math.abs(ndc[0]) / horizontal - 1,
    Math.abs(ndc[1]) / .8 - 1,
    ndc[2] < -1 || ndc[2] > 1 ? 2 : 0);
}

// A guardian camera repair must not purchase an enemy close-up by moving the
// real climber outside the phone's tighter 78% action safe area.
export function actorFramePressure(ndc, aspect) {
  if (!Array.isArray(ndc) || ndc.length !== 3 || !ndc.every(finite) ||
    !finite(aspect) || aspect <= 0) return Infinity;
  return Math.max(0, Math.abs(ndc[0]) / (aspect < .85 ? .78 : .82) - 1,
    Math.abs(ndc[1]) / .78 - 1,
    ndc[2] < -1 || ndc[2] > 1 ? 2 : 0);
}

export function guardianCameraRecoveryBlend(pressure, elapsedSeconds) {
  if (!finite(pressure) || !finite(elapsedSeconds) ||
    pressure <= .02 || elapsedSeconds <= 0) return 0;
  // Never respond to simulated time, software-GL frame count or future
  // trajectory; this is a strictly bounded continuous physical camera move.
  return Math.min(.30, 1 - Math.exp(-Math.min(.06, elapsedSeconds) *
    (7 + Math.min(2, pressure) * 9)));
}

export function acceptGuardianCameraRescue({
  aspect, guardianBefore, guardianAfter, actorBefore, actorAfter,
  actorCoreClear, guardianCoreClear,
}) {
  const start = guardianFramePressure(guardianBefore, aspect);
  const end = guardianFramePressure(guardianAfter, aspect);
  const playerStart = actorFramePressure(actorBefore, aspect);
  const playerEnd = actorFramePressure(actorAfter, aspect);
  // Existing protagonist safety and exterior tower sightlines always win.
  // A cropped hero or blocked world cannot be exchanged for a pretty boss.
  if (!actorCoreClear || !guardianCoreClear || playerStart > 0 ||
    playerEnd > 0 || !finite(start) || !finite(end) || start <= .02) return false;
  // Avoid chase-camera oscillation from insignificant NDC fluctuations:
  // approve only a measurable improvement in the *same actual* guardian.
  return end < start - .025;
}


// Portrait cameras cannot orbit through the REAL, physically oversized boss
// on the way from one safe duel shoulder to the other. Original unmodified
// 390x844 film bddbfd92 at 20.5s shows both fighters; ~21s the guardian's
// armour/maul becomes almost full-screen and hides the actual climber.
// Recalculate a radial exterior standoff for the CURRENT drawn guardian,
// without moving either actor, changing the 20Hz clock, cutting the camera,
// hiding the enemy or making a source/visual-quality claim. A caller may
// request the full destination or a bounded per-render continuation.
// Both live subjects must retain exterior sightlines through the whole move.
export function guardianExteriorPortraitStandoff(view, guardian, actor,
  guardianHalfHeight, aspect, maxRadialStep = Infinity, coreRadius = 23.5) {
  const valid = p => !!p && [p.x,p.y,p.z].every(finite);
  if (![view,guardian,actor].every(valid) ||
      ![guardianHalfHeight,aspect,coreRadius].every(finite) ||
      guardianHalfHeight <= 0 || aspect <= 0 || aspect >= .85 ||
      coreRadius <= 0 || (maxRadialStep !== Infinity &&
        (!finite(maxRadialStep) || maxRadialStep <= 0))) return null;
  const radius = Math.hypot(view.x,view.z);
  if (radius <= coreRadius + 1.1 ||
      Math.abs(guardian.y - actor.y) > guardianHalfHeight * 5 + 8) return null;
  // The guardian's current source body is a minimum: its original articulated
  // hammer, shoulders and overhead clutch reach farther than the hitbox.
  // The standoff is intentionally much larger than the renderer's near plane.
  const minClearance = Math.min(33, Math.max(25.5, 15 + guardianHalfHeight * 5));
  const before = Math.hypot(view.x-guardian.x, view.y-guardian.y,
    view.z-guardian.z);
  if (before >= minClearance - .15) return null;
  const clear = (x,z,subject) => {
    const dx=subject.x-x,dz=subject.z-z;
    const den=dx*dx+dz*dz;
    const t=den>1e-8?Math.max(0,Math.min(1,-(x*dx+z*dz)/den)):0;
    return Math.hypot(x+t*dx,z+t*dz) > coreRadius + .05;
  };
  const ux=view.x/radius, uz=view.z/radius;
  let fullLift=null;
  // Search only exterior radial positions, not possible through-core short
  // cuts; do not invent a wide safe camera if the geometry vetoes it.
  for(let i=1;i<=32;i++){
    const lift=i*.75, x=view.x+ux*lift,z=view.z+uz*lift;
    if(!clear(x,z,actor)||!clear(x,z,guardian)) return null;
    if(Math.hypot(x-guardian.x,view.y-guardian.y,z-guardian.z)
        >=minClearance){fullLift=lift;break;}
  }
  if(fullLift===null)return null;
  const step=Math.min(fullLift,maxRadialStep);
  const x=view.x+ux*step,z=view.z+uz*step;
  if(!clear(x,z,actor)||!clear(x,z,guardian))return null;
  return {x,y:view.y,z,step,fullLift,guardianDistanceBefore:before,
    guardianDistanceAfter:Math.hypot(x-guardian.x,view.y-guardian.y,
      z-guardian.z)};
}

// Normal-speed original portrait evidence at candidate 653fa1c6 shows a
// nearly 100-degree exterior shoulder change inside ~one source second during
// the LIVING guardian sequence. Existing safe-center orbit pacing alone does
// not bind the downstream, legitimately emergency-restaged camera. Use the
// last SUCCESSFULLY SUBMITTED view, never a future or inferred source pose,
// to propose one short exterior arc. The scene must independently prove that
// this cap preserves BOTH real silhouettes, tower-core clearance and any
// authoritative airborne landing. A failed proposal is never applied.
export function boundedObservedGuardianOrbit(previous, proposed, dt, aspect,
  radiansPerSecond = 1.05, minimumExteriorRadius = 27.35) {
  const valid = p => p && [p.x, p.y, p.z].every(finite);
  if (!valid(previous) || !valid(proposed) ||
      ![dt, aspect, radiansPerSecond, minimumExteriorRadius].every(finite) ||
      dt <= 0 || aspect <= 0 || aspect >= .85 ||
      radiansPerSecond < .25 || radiansPerSecond > 2.5 ||
      minimumExteriorRadius < 23.5) return null;
  const prevRadius = Math.hypot(previous.x, previous.z);
  const targetRadius = Math.hypot(proposed.x, proposed.z);
  if (prevRadius < minimumExteriorRadius ||
      targetRadius < minimumExteriorRadius) return null;
  const a = Math.atan2(previous.x, previous.z);
  const b = Math.atan2(proposed.x, proposed.z);
  const arc = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  const budget = Math.min(.13, dt) * radiansPerSecond;
  if (Math.abs(arc) <= budget + 1e-8) return null;
  const bounded = a + Math.sign(arc) * budget;
  return {
    x: Math.sin(bounded) * targetRadius, y: proposed.y,
    z: Math.cos(bounded) * targetRadius,
    angularDemand: Math.abs(arc), angularStep: budget,
  };
}
