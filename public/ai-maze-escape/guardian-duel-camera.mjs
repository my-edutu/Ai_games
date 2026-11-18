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

/**
 * Reframe the REAL full connected Pip/Thornback meshes after a publicly
 * witnessed earned lantern counter displaces the guardian. Source-bound
 * 390x844 WebGL seed 13 tick 8 recorded a guardian left edge -0.977049
 * despite Pip remaining fully in-frame. A one-off local camera translation,
 * not a zoom or an authored enemy move, can center both genuine bodies.
 *
 * The shift is in world units along camera-right: positive moves the actors
 * left. No persistent easing target, hidden map cells, engine rules, manual
 * views, or model geometry are touched. If both full actors cannot physically
 * fit within the STRONGER 0.925 NDC interior, return zero and let native
 * strict tests reject the shot rather than falsely claiming camera safety.
 */
export function publicGuardianEarnedRecoilPairShift(
  aspect,halfHeight,bodies,earned=false,reducedMotion=false) {
  if(!earned || reducedMotion || !Number.isFinite(aspect) || aspect<.35 || aspect>=.60
    || !Number.isFinite(halfHeight) || halfHeight<=0
    || !Array.isArray(bodies) || bodies.length!==2)return 0;
  for(const body of bodies)
    if(!body || !['left','right','bottom','top'].every(k=>Number.isFinite(body[k]))
      || body.left>=body.right || body.bottom>=body.top)return 0;
  const left=Math.min(bodies[0].left,bodies[1].left);
  const right=Math.max(bodies[0].right,bodies[1].right);
  const safe=.925;
  if(right-left>safe*2 || left>=-safe && right<=safe)return 0;
  const low=right-safe,high=left+safe;
  const centered=(left+right)*.5;
  return Math.max(low,Math.min(high,centered))*halfHeight*aspect;
}

// The actual PUBLIC guardian moves after the earned lantern counter; aim
// toward its present connected body, not a speculative route/destination.
// Caller requires same-run, current-visibility, genuine recoil and Follow.
// Bounds prevent a distant spectator target and retain full-body NDC tests.
export function publicGuardianEarnedRecoilPairFocus(
  aspect,hero,guardian,earned=false,reducedMotion=false,cellSize=2.4){
  const none={x:0,z:0};
  if(!earned||reducedMotion||!Number.isFinite(aspect)
    ||aspect<.35||aspect>=.60
    ||![hero?.x,hero?.z,guardian?.x,guardian?.z,cellSize].every(Number.isFinite)
    ||cellSize<=0)return none;
  const dx=guardian.x-hero.x,dz=guardian.z-hero.z;
  const d=Math.hypot(dx,dz);
  if(d<cellSize*.2||d>cellSize*4)return none;
  const bounded=v=>Math.max(-cellSize*.85,Math.min(cellSize*.85,v));
  return {x:bounded(dx*.4),z:bounded(dz*.4)};
}


/**
 * Mobile earned-counter close-up, evaluated from the complete CURRENT physical
 * Pip and Thornback mesh envelopes (not centers, icons or a future route).
 * The authoritative visible retreat, not a guessed threat, owns this beat.
 *
 * Prior first-fit horizontal pan can be included so the proposal measures
 * exactly what will be on screen.  The extra pan centers the two actual
 * bodies; zoom is permitted only when BOTH bodies fit the stronger .80 NDC
 * horizontal, .69 top (goal HUD) and .78 bottom (one-hand controls) limits.
 * A 34% image-scale cap prevents a violent cut between simulation ticks.
 * No camera or gameplay state is persisted and no model size changes.
 */
export function publicGuardianEarnedRecoilPhysicalStage(
  aspect,halfHeight,bodies,earned=false,reducedMotion=false,priorShift=0) {
  const none={height:halfHeight,shift:0,scale:1};
  if(!earned || reducedMotion || !Number.isFinite(aspect)
    || aspect<.35 || aspect>=.60 || !Number.isFinite(halfHeight)
    || halfHeight<=0 || !Number.isFinite(priorShift)
    || !Array.isArray(bodies) || bodies.length!==2)return none;
  for(const body of bodies)
    if(!body || !['left','right','top','bottom'].every(k=>Number.isFinite(body[k]))
      || body.left>=body.right || body.bottom>=body.top)return none;
  const oldPanNdc=priorShift/(halfHeight*aspect);
  const left=Math.min(...bodies.map(b=>b.left))-oldPanNdc;
  const right=Math.max(...bodies.map(b=>b.right))-oldPanNdc;
  const top=Math.max(...bodies.map(b=>b.top));
  const bottom=Math.min(...bodies.map(b=>b.bottom));
  // Insist the earlier true full-mesh pan fits before any additional zoom.
  if(left<-.925 || right>.925 || top>=.69 || bottom<=-.78)return none;
  const center=Math.max(-.25,Math.min(.25,(left+right)*.5));
  const halfWidth=Math.max(Math.abs(left-center),Math.abs(right-center));
  const verticalSpan=top-bottom;
  if(halfWidth<=0 || verticalSpan<=0)return none;
  // Native 320px source: Thornback reaches +.621 while Pip extends to
  // -.284 NDC. Treating zero as an immutable optical center incorrectly
  // refused a genuine two-actor closeup. Lift the PHYSICAL camera along
  // its current up axis, retaining strict native HUD and model envelopes.
  // These .80/.68/-.75 limits are STRICTER than native +/- .95.
  const scale=Math.min(1.34,.80/halfWidth,1.43/verticalSpan);
  if(!Number.isFinite(scale) || scale<1.16)return none;
  const minVerticalPan=top-.68/scale;
  const maxVerticalPan=bottom+.75/scale;
  if(minVerticalPan>maxVerticalPan)return none;
  const desiredPan=(top+bottom)*.5+.08/scale;
  const verticalPan=Math.max(minVerticalPan,Math.min(maxVerticalPan,desiredPan));
  return {height:halfHeight/scale,shift:center*halfHeight*aspect,
    verticalShift:verticalPan*halfHeight,scale};
}


// The installed camera supplies TRUE projected connected-mesh rectangles.
// During a currently witnessed autonomous lantern counter, a known public,
// non-colliding fossil ornament may recede from the actor shot if it really
// covers a meaningful piece of a nearer character in screen space. The caller
// alone selects optional decor; this is NOT a visibility/path or AI rule.
export function publicGuardianScenicOccludesActor(actor,scenic,earned=false,reducedMotion=false) {
  if(!earned||reducedMotion||!actor||!scenic)return false;
  const properties=['left','right','bottom','top','nearestZ'];
  if(!properties.every(k=>Number.isFinite(actor[k])&&Number.isFinite(scenic[k])))
    return false;
  if(actor.left>=actor.right || actor.bottom>=actor.top
    || scenic.left>=scenic.right || scenic.bottom>=scenic.top
    || actor.nearestZ<=-1 || actor.nearestZ>=1
    || scenic.nearestZ<=-1 || scenic.nearestZ>=1)return false;
  // Smaller camera NDC depth is nearer. A distant backdrop stays untouched.
  if(scenic.nearestZ>=actor.nearestZ-.015)return false;
  const w=Math.max(0,Math.min(actor.right,scenic.right)-Math.max(actor.left,scenic.left));
  const h=Math.max(0,Math.min(actor.top,scenic.top)-Math.max(actor.bottom,scenic.bottom));
  // Require actual substantial overlap, not an unrelated plant beside Pip.
  return w>=Math.max(.08,(actor.right-actor.left)*.17)
    && h>=Math.max(.09,(actor.top-actor.bottom)*.17);
}

/**
 * Actor-facing Tideglass stage clearance, not a depth-only "is in front"
 * micro-adjustment. The caller must already own a current, same-run,
 * publicly discovered ACTUAL lantern counter, both connected actor meshes,
 * and an optional noncolliding fossil prop on a currently visible tile.
 *
 * Several exact-WebGL rejected passes compared the nearest tip of Pip's
 * lantern to a fossil's nearest tip; those boxes did not describe whether
 * the large fossil organ visually crowded Pip's torso. This strict 2D
 * silhouette intersection is paired with REAL disclosed-cell proximity
 * by the scene director. It NEVER operates on wall/route/hazard meshes.
 */
export function publicEarnedGuardianScenicStageOverlap(actor,scenic,earned=false) {
  if(!earned || !actor || !scenic)return false;
  const props=['left','right','bottom','top','nearestZ'];
  if(!props.every(k=>Number.isFinite(actor[k])&&Number.isFinite(scenic[k])))return false;
  if(actor.left>=actor.right || actor.bottom>=actor.top
    || scenic.left>=scenic.right || scenic.bottom>=scenic.top
    || actor.nearestZ<=-1 || actor.nearestZ>=1
    || scenic.nearestZ<=-1 || scenic.nearestZ>=1)return false;
  // A real substantial intersection, NEVER a nearby but visually
  // unrelated decoration. NDC values use the unmodified WebGL projection.
  const width=Math.max(0,Math.min(actor.right,scenic.right)
    -Math.max(actor.left,scenic.left));
  const height=Math.max(0,Math.min(actor.top,scenic.top)
    -Math.max(actor.bottom,scenic.bottom));
  return width>=Math.max(.08,(actor.right-actor.left)*.15)
    && height>=Math.max(.09,(actor.top-actor.bottom)*.15);
}

/**
 * Post-parry physical lens lift. The trusted native 320/390 seed-13 tick-8
 * source rays strike disclosed tile 93's floor BEFORE reaching Pip's torso
 * and boots. Only the already-gated same-run, visibly earned Follow recoil
 * may gain an above-deck three-quarter view. No future route, enemy location,
 * private topology, screenshot crop or model relocation is used here.
 * Native whole-mesh +/- .95 and public-occlusion tests own acceptance.
 */
export function publicGuardianEarnedRecoilRevealElevation(
  aspect,currentY,earned=false,reducedMotion=false){
  if(!earned||reducedMotion||!Number.isFinite(aspect)
    ||aspect<.35||aspect>=.60||!Number.isFinite(currentY)||currentY<=0)
    return currentY;
  // Change camera PITCH rather than shrinking actors: previous low 11.5m
  // post-parry offset let the foreground deck conceal the authentic boots.
  // Restore a readable diorama altitude only after the actual counter.
  return Math.max(currentY,23.0);
}

/**
 * Final, source-bound portrait correction AFTER the earned-recoil stage's
 * optical zoom and vertical pan. Earlier pair bounds were measured BEFORE
 * those lens changes; original native 320x740 seed-13 tick94 then showed
 * Pip at -0.955425 NDC (strict -0.95), while Thornback reached +0.904315.
 * The complete current models really fit together (1.859741 NDC wide).
 *
 * Recenter their current CONNECTED mesh silhouettes in existing camera-right
 * world units, with a stronger +/-0.94 margin. Never scale, crop, invent an
 * encounter, inspect private cells, relax thresholds or silently fit a pair
 * wider than the available physical screen. Caller supplies post-zoom bounds.
 */
export function publicGuardianEarnedRecoilFinalPairShift(
  aspect,halfHeight,bodies,earned=false,reducedMotion=false){
  if(!earned||reducedMotion||!Number.isFinite(aspect)
    ||aspect<.35||aspect>=.60||!Number.isFinite(halfHeight)
    ||halfHeight<=0||!Array.isArray(bodies)||bodies.length!==2)return 0;
  for(const body of bodies)
    if(!body||!['left','right','bottom','top'].every(k=>Number.isFinite(body[k]))
      ||body.left>=body.right||body.bottom>=body.top)return 0;
  const left=Math.min(bodies[0].left,bodies[1].left);
  const right=Math.max(bodies[0].right,bodies[1].right);
  const safe=.94;
  if(right-left>safe*2 || left>=-safe&&right<=safe)return 0;
  const low=right-safe,high=left+safe;
  if(low>high)return 0;
  return Math.max(low,Math.min(high,(left+right)*.5))*halfHeight*aspect;
}
