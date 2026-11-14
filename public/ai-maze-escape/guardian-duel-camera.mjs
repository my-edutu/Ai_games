// Original 3D camera direction only. The caller has independently required
// a currently disclosed, reciprocal, unlocked guardian encounter in Follow.
// This helper does not observe hidden cells, simulation rules or an actor's
// destination. It only interprets the same witnessed performance clock.
export function publicGuardianDuelCameraElevation(aspect,strength,beat,reducedMotion=false){
  const neutral=21;
  if(reducedMotion || !Number.isFinite(aspect) || aspect<.35 || aspect>=.60
    || !Number.isFinite(strength) || strength<=.70
    || !Number.isFinite(beat) || beat<=0 || beat>1)return neutral;
  // Exact-source Pass329 390px brace/release frames still view the shell and
  // Pip's planted boots mostly from above; the four linked court signals
  // hide their physical warning profile. Make the already WITNESSED warning
  // -> brace -> release an authored three-quarter LOWER reveal, not a new
  // event or private-map camera request. Its 21 -> 13.57 -> 11.5 elevation
  // is smooth, bounded and stable at full release. Native physical full-body
  // +/- .95 and HUD occlusion gates must approve the actual scene, not us.
  // No zoom, altered actor roots, renderer resources or game authority.
  const attention=Math.max(0,Math.min(1,(strength-.70)/.10));
  const t=Math.max(0,Math.min(1,(beat-.07)/.60));
  const reveal=t*t*(3-2*t);
  return neutral-9.5*attention*reveal;
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
  const t=Math.max(0,Math.min(1,(beat-.16)/.57));
  if(t<=0)return 0;
  const reveal=t*t*(3-2*t);
  // Pass338 exact Pass337 390px WebGL brace still merges the guardian shell
  // with Pip into a near-vertical column. At the same PUBLIC brace and shell
  // release, open up the opposed three-quarter shot rather than repainting
  // yet another static terrace. Pass338's 0.66rad overshot the original
  // native Follow lens depth contract (>0.20rad orbit) and timed out the
  // uncropped 390px WebGL capture. Pass339 holds at most 0.52rad while
  // retaining at least 33% of the authentic original actor-axis orbit.
  // No camera-side reversal. The existing exact full-body NDC
  // fitter, pressure priority and native 44px HUD tests remain authoritative.
  return -Math.sign(currentOrbit)*Math.min(.52,Math.abs(currentOrbit)*.67)*attention*reveal;
}
