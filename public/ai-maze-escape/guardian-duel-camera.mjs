// Original 3D camera direction only. The caller has independently required
// a currently disclosed, reciprocal, unlocked guardian encounter in Follow.
// This helper does not observe hidden cells, simulation rules or an actor's
// destination. It only interprets the same witnessed performance clock.
export function publicGuardianDuelCameraElevation(aspect,strength,beat,reducedMotion=false){
  const neutral=21;
  if(reducedMotion || !Number.isFinite(aspect) || aspect<.35 || aspect>=.60
    || !Number.isFinite(strength) || strength<=.70
    || !Number.isFinite(beat) || beat<=0 || beat>1)return neutral;
  // Pass356: authentic 390px notice/brace/release images showed the camera
  // CONTINUING to pitch down while Thornback is acting, exposing a tall
  // foreground retaining wall and shifting the actor pair against different
  // architecture at every beat. Make this one readable original three-quarter
  // camera settle DURING the witnessed warning, then HOLD through grounded
  // brace and shell release. The moderate 16.2m elevation looks OVER real
  // opaque foreground stone; it never makes that stone transparent, creates
  // a false path or changes public map/AI/physical actor positions. The actual
  // native full-mesh ±.95 bounds and genuine wall/pressure tests still decide.
  const attention=Math.max(0,Math.min(1,(strength-.70)/.10));
  const t=Math.max(0,Math.min(1,(beat-.04)/.33));
  const reveal=t*t*(3-2*t);
  return neutral-4.8*attention*reveal;
}

// Source-bound, full-mesh portrait pairing. The host already proved a
// disclosed, reciprocal and open encounter before passing the two FULL
// connected actor bounds measured from the actual current WebGL camera.
// Negative evidence (clipped, missing, invalid, reduced motion) never zooms.
export function publicGuardianPhysicalCloseupHalfHeight(
  aspect,strength,baselineHeight,currentHeight,bodies,reducedMotion=false){
  if(reducedMotion || !Number.isFinite(aspect) || aspect<.35 || aspect>=.60
    || !Number.isFinite(strength) || strength<=.70
    || !Number.isFinite(baselineHeight) || baselineHeight<=0
    || !Number.isFinite(currentHeight) || currentHeight<=0
    || !Array.isArray(bodies) || bodies.length!==2)return currentHeight;
  for(const b of bodies){
    if(!b || !['left','right','bottom','top'].every(k=>Number.isFinite(b[k]))
      || b.left>=b.right || b.bottom>=b.top
      || b.left<=-.95 || b.right>=.95 || b.bottom<=-.95 || b.top>=.95)
      return currentHeight;
  }
  const horizontal=Math.max(...bodies.map(b=>Math.max(Math.abs(b.left),Math.abs(b.right))));
  const top=Math.max(0,...bodies.map(b=>b.top));
  const bottom=Math.max(0,...bodies.map(b=>-b.bottom));
  // Stricter than native +/- .95: width reserves .12 NDC for safe headroom,
  // +.70 protects the mobile mission chip, -.84 protects real bottom controls.
  // The 0.79 cap forbids an abrupt, unnatural extreme zoom. No model scaling.
  const safe=Math.max(baselineHeight*.79,currentHeight*horizontal/.88,
    currentHeight*top/.70,currentHeight*bottom/.84);
  return Number.isFinite(safe)?Math.min(currentHeight,safe):currentHeight;
}

/**
 * Source-witnessed guardian over-the-shoulder composition. The approved
 * actor-axis orbit keeps both actors onscreen at warning, but original
 * unaltered 390px brace/release WebGL compressed them into ONE silhouette.
 * On that same witnessed clock, reveal the two opposed physical bodies by
 * easing a little back toward the normal diorama azimuth. This never moves
 * an actor or authorizes a private guardian/camera, new route or collider.
 */
export function publicGuardianDuelShoulderOrbit(aspect,strength,beat,currentOrbit,reducedMotion=false){
  if(reducedMotion || !Number.isFinite(aspect) || aspect<.35 || aspect>=.60
    || !Number.isFinite(strength) || strength<=.70
    || typeof beat!=='number' || !Number.isFinite(beat) || beat<=0 || beat>1
    || !Number.isFinite(currentOrbit) || Math.abs(currentOrbit)<.03)return 0;
  const attention=Math.max(0,Math.min(1,(strength-.70)/.10));
  // Complete the camera's bounded three-quarter shoulder reveal DURING
  // the public warning, before the physical guardian brace starts. Do not
  // keep orbiting around the characters WHILE their connected fins act.
  // Preserve the proven maximum 0.52rad correction and at least 33% of the
  // underlying public actor-axis orbit: no reversal, manual camera takeover,
  // new map knowledge, or relaxed strict NDC/44px native acceptance gates.
  const t=Math.max(0,Math.min(1,(beat-.04)/.33));
  if(t<=0)return 0;
  const reveal=t*t*(3-2*t);
  return -Math.sign(currentOrbit)*Math.min(.52,Math.abs(currentOrbit)*.67)*attention*reveal;
}
