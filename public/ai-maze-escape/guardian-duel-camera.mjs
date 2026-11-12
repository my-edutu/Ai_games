// Original 3D camera direction only. The caller has independently required
// a currently disclosed, reciprocal, unlocked guardian encounter in Follow.
// This helper does not observe hidden cells, simulation rules or an actor's
// destination. It only interprets the same witnessed performance clock.
export function publicGuardianDuelCameraElevation(aspect,strength,beat,reducedMotion=false){
  const neutral=21;
  if(reducedMotion || !Number.isFinite(aspect) || aspect<.35 || aspect>=.60
    || !Number.isFinite(strength) || strength<=.70
    || !Number.isFinite(beat) || beat<=0 || beat>1)return neutral;
  // Smooth the verified high recognition into a lower true 3D shot as
  // Thornback's connected foreclaws brace and its original shell unseals.
  // No zoom, crop, extra renderer resources or new gameplay event.
  const attention=Math.max(0,Math.min(1,(strength-.70)/.10));
  const t=Math.max(0,Math.min(1,(beat-.10)/.68));
  const reveal=t*t*(3-2*t);
  return neutral-6.2*attention*reveal;
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
