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
 * Public, source-earned two-character PERFORMANCE COURT. The strict
 * original silhouette-intersection still handles any connected actor hit.
 * The additional court protects the negative space BETWEEN and just below
 * their complete actual projected bodies on mobile: otherwise the original
 * full-resolution recoil leaves an unrelated tall fossil canopy occupying
 * the entire foreground while neither actor is technically ray-occluded.
 *
 * The caller exclusively passes non-colliding ornamental roots on currently
 * visible public cells during the same-run lantern counter. A real wall,
 * hazard, unrevealed cell or gameplay collider must never be sent here.
 * Require a closer ornament in real WebGL NDC depth so distant architecture
 * remains as the backdrop, and keep the sightline confined to the physical
 * two-actor footprint, not the whole screen or an invented destination.
 */
export function publicEarnedGuardianScenicPerformanceCourt(pip,thornback,scenic,earned=false){
  if(!earned||!pip||!thornback||!scenic)return false;
  const fields=['left','right','bottom','top','nearestZ'];
  if(![pip,thornback,scenic].every(box=>
    fields.every(key=>Number.isFinite(box[key])) && box.left<box.right
    && box.bottom<box.top && box.nearestZ>-1 && box.nearestZ<1))return false;
  // Only an actually nearer foreground object is eligible. Backdrop keeps
  // its silhouette rather than fading merely for sharing two screen pixels.
  if(scenic.nearestZ>=Math.max(pip.nearestZ,thornback.nearestZ)-.025)return false;
  const left=Math.max(-.95,Math.min(pip.left,thornback.left)-.04);
  const right=Math.min(.95,Math.max(pip.right,thornback.right)+.04);
  const bottom=Math.max(-.83,Math.min(pip.bottom,thornback.bottom)-.34);
  const top=Math.min(.82,Math.max(pip.top,thornback.top)+.16);
  const overlapX=Math.max(0,Math.min(right,scenic.right)-Math.max(left,scenic.left));
  const overlapY=Math.max(0,Math.min(top,scenic.top)-Math.max(bottom,scenic.bottom));
  return overlapX>=.11 && overlapY>=.12;
}

/**
 * Earned lantern-counter front-quarter camera direction.
 *
 * The authentic 390px public counter footage puts the connected Thornback
 * head behind its enormous own dorsal armor. Moving more decorative meshes
 * and raising the camera never revealed its acting. Instead, select a
 * physically different, three-quarter silhouette of the SAME current
 * Pip/Thornback pair: the camera rotates toward Thornback's genuine
 * facing relationship to the already witnessed Pip, preserving both
 * connected bodies and the original full-frame NDC acceptance checks.
 *
 * This is presentation ONLY. The caller proves a currently visible,
 * same-run, genuinely earned public counter in Follow. No hidden enemy
 * coordinates, private map, animation clock, solver move or collider enters.
 * In-place Vector3 mutation avoids allocating during a native WebGL frame.
 */
/**
 * Source-earned camera priority for an ALREADY VISIBLE counter, not an AI
 * attack or newly discovered enemy. The old Follow stage required zero
 * public proximity warning; a genuinely parried close Thornback can
 * remain visibly nearby, so its own physical reaction never got framed.
 * A DIFFERENT currently dangerous guardian still owns the warning shot.
 * Models are current sanitized scene instances, not private map actors.
 */
export function publicEarnedGuardianCounterCameraPriority(
  earnedModel, attentionModel, attentionStrength, attentionParried) {
  if(!earnedModel)return false;
  if(attentionStrength==null || attentionStrength===0)return true;
  if(!Number.isFinite(attentionStrength)||attentionStrength<0)return false;
  return attentionModel===earnedModel && attentionParried===true;
}


/**
 * One continuous, genuinely earned guardian COUNTER scene:
 * the previous native full-frame photographs show a closer two-body warning
 * at tick 93 but an immediate broad overhead reposition at tick 94, hiding
 * the lantern impact and shriveling both expressive silhouettes.
 *
 * Pass522's source-held portrait-offset still jumped away from the original
 * actual warning camera: the portrait-offset target was not the camera that
 * framed both actors at tick93. Preserve the already RENDERED camera through
 * first clear impact, then ease toward the authentic retreat shot over the
 * latter half of the same genuine two-second lantern-counter clock.
 * Window .08–.62 is presentation only, not a longer or invented parry.
 * This function merely stages a camera; never advances AI, authoritative
 * world clock, hazards, public map discovery or actor positions.
 */
export function publicEarnedGuardianCounterCameraAct(
  phase,earned=false,reducedMotion=false,aspect=0) {
  if(!earned || reducedMotion || !Number.isFinite(phase)
    || phase<0 || phase>=1)return 1;
  // Pass526: real 390px tick94 camera hides Thornback behind disclosed
  // foreground foliage, whereas the later genuine 320px higher view reveals
  // both actors. Begin the SAME earned camera transition earlier, retaining
  // first impact, without touching world motion, privacy or physical fit.
  // Pass536: the original exact-HEAD 390x844 tick93 camera presents Pip and
  // Thornback close, both readable; the authentic tick94 after-hit camera
  // immediately pulls them toward opposite +/- .90 screen edges, making
  // their connected body recoil and lantern contact tiny among parapets.
  // Preserve the ACTUALLY photographed contact framing through the early
  // true two-second parry, then ease into the already fitted retreat. Only
  // 390-class portrait uses this longer first act; 320, landscape, desktop,
  // invalid, reduced-motion and stale events keep the existing behavior.
  // The scene's full connected-mesh +/- .95 final fitter remains unchanged.
  const portraitContact=Number.isFinite(aspect) && aspect>=.45 && aspect<.60;
  const start=portraitContact ? .27 : .08;
  const t=Math.max(0,Math.min(1,(phase-start)/.54));
  return t*t*(3-2*t);
}

export function setPublicEarnedGuardianFrontQuarterOffset(
  offset,aspect,hero,guardian,earned=false,reducedMotion=false) {
  if(!earned||reducedMotion||!Number.isFinite(aspect)
    ||aspect<.35||aspect>=.60
    ||![offset?.x,offset?.y,offset?.z,hero?.x,hero?.z,
      guardian?.x,guardian?.z].every(Number.isFinite))return false;
  const dx=hero.x-guardian.x,dz=hero.z-guardian.z;
  const separation=Math.hypot(dx,dz);
  const radius=Math.hypot(offset.x,offset.z);
  if(separation<.65||radius<1)return false;
  const normal=Math.atan2(offset.z,offset.x);
  const face=Math.atan2(dz,dx);
  const difference=angle=>Math.atan2(Math.sin(angle-normal),Math.cos(angle-normal));
  // Pass518 genuine full-frame 320/390 earned counter: both published
  // actors occupied opposite edges, too small for a readable face/reaction.
  // Stage the nearer 30-degree face-quarter, not a nearly sideways 45-degree
  // silhouette, and permit the REAL azimuth to reach that view from +X/+Z.
  // This compresses physical pair separation in projection before the
  // existing FULL connected-mesh NDC lens fitter. Radius/elevation, actor
  // roots, hidden-map protection and strict no-crop thresholds are unchanged.
  // Accept only after fresh, uncropped exact-SHA source-bound WebGL evidence.
  // Pass534: the original SHA-matched native seed-13 tick94 390x844
  // rendered BOTH complete bodies at the lateral +/-0.90 margins, with
  // Thornback's expressive face largely in side profile among tall parapets.
  // The same true 320x740 event reads its face considerably better, so do
  // not change that independently tested narrow portrait composition.
  //
  // Only in 390-class PORTRAIT, turn farther toward the CURRENT PUBLIC
  // hero-to-guardian axis and keep an authentic 20-degree shoulder flank.
  // This reduces projected model separation and reveals the full acting
  // pair before the existing REAL full-mesh lens/backoff/NDC safety fits it.
  // No new camera, hidden route, enemy, actor movement, geometry or budget;
  // no change to the genuine contact continuity/ease or manual cameras.
  const frontPair=aspect>=.45;
  const flank=frontPair?Math.PI/9:Math.PI/6;
  const left=difference(face-flank),right=difference(face+flank);
  const delta=Math.abs(left)<=Math.abs(right)?left:right;
  const maxTurn=frontPair?2.50:1.82;
  const turn=Math.max(-maxTurn,Math.min(maxTurn,delta));
  if(Math.abs(turn)<.045)return false;
  offset.x=radius*Math.cos(normal+turn);
  offset.z=radius*Math.sin(normal+turn);
  return true;
}

/**
 * Narrow, source-witnessed 320px counter performance stage.
 *
 * The 2026-11-20 native 320x740 full-frame seed-13 image places Pip at the
 * extreme left and Thornback far above/right of the long terrace, leaving a
 * large empty seaward cliff. The former maximum 1.82rad turn never actually
 * reached the hero-to-guardian front quarter (dot ~.333 for the measured
 * reference pair), so the exact physical two-body fitter could not request
 * a legible portrait action shot.
 *
 * Give only the SAME-RUN, CURRENTLY PUBLIC earned recoil a more frontal 18deg
 * actor-pair azimuth, keeping camera radius/height, physical meshes, collision,
 * AI, fog-of-war and the final strict +/-0.95 mesh-envelope fit unchanged.
 * This is an optical request, NOT a claim of screenshot acceptance.
 */
export function setPublicEarnedGuardianNarrowPairStage(
  offset,aspect,hero,guardian,earned=false,reducedMotion=false) {
  if(!earned || reducedMotion || !Number.isFinite(aspect)
    || aspect<.35 || aspect>=.45
    || ![offset?.x,offset?.y,offset?.z,hero?.x,hero?.z,
      guardian?.x,guardian?.z].every(Number.isFinite))return false;
  const dx=hero.x-guardian.x,dz=hero.z-guardian.z;
  const separation=Math.hypot(dx,dz);
  const radius=Math.hypot(offset.x,offset.z);
  if(separation<.65 || radius<1)return false;
  const normal=Math.atan2(offset.z,offset.x);
  const face=Math.atan2(dz,dx);
  const flank=Math.PI/10; // Physical 18deg three-quarter stage; not a top-down icon.
  const difference=angle=>Math.atan2(Math.sin(angle-normal),Math.cos(angle-normal));
  const left=difference(face-flank),right=difference(face+flank);
  const delta=Math.abs(left)<=Math.abs(right)?left:right;
  // The prior narrow 1.82rad camera can be 0.9rad away from the FRONT quarter
  // even after its base turn. Keep the additional real camera motion bounded.
  const turn=Math.max(-1.04,Math.min(1.04,delta));
  if(Math.abs(turn)<.045)return false;
  offset.x=radius*Math.cos(normal+turn);
  offset.z=radius*Math.sin(normal+turn);
  return true;
}


/**
 * Earned, physically framed wide-portrait counter reveal.
 *
 * The exact-source 390x844 seed-13 counter still photographs Thornback mostly
 * sideways behind ornament while the 320x740 version reads its connected face.
 * Preserve the genuinely filmed initial impact: only AFTER .24 of the real
 * public same-run counter clock may the existing single Follow camera steer
 * toward the physical Pip/Thornback axis. Never reposition/scale a character,
 * reveal a private cell, change a route/collider, or bypass the subsequent
 * conservative full-model NDC fitter. No new allocations or renderer resources.
 */
export function setPublicEarnedGuardianWideContactReveal(
  offset, aspect, hero, guardian, counterPhase,
  earned=false, reducedMotion=false, maxTurnRadians=1.55) {
  if(!earned || reducedMotion || !Number.isFinite(aspect)
    || aspect<.45 || aspect>=.60 || !Number.isFinite(counterPhase)
    || counterPhase<=.24 || counterPhase>=1
    || !Number.isFinite(maxTurnRadians) || maxTurnRadians<=0
    || maxTurnRadians>1.55
    || ![offset?.x,offset?.y,offset?.z,hero?.x,hero?.z,
      guardian?.x,guardian?.z].every(Number.isFinite))return false;
  const dx=hero.x-guardian.x, dz=hero.z-guardian.z;
  const separation=Math.hypot(dx,dz), radius=Math.hypot(offset.x,offset.z);
  if(separation<.65 || radius<1)return false;
  const normal=Math.atan2(offset.z,offset.x);
  const face=Math.atan2(dz,dx);
  // Preserve a readable 15-degree shoulder rather than a flat head-on icon.
  // Wrap before bounding, so the camera takes the shortest physical orbit.
  const difference=a=>Math.atan2(Math.sin(a-normal),Math.cos(a-normal));
  const a=difference(face-Math.PI/12),b=difference(face+Math.PI/12);
  const delta=Math.abs(a)<=Math.abs(b)?a:b;
  const t=Math.max(0,Math.min(1,(counterPhase-.24)/.44));
  const eased=t*t*(3-2*t);
  // Pass539: Pass538's forced near-frontal swing failed the REAL 390px
  // WebGL public-geometry ray at Thornback's boots. The original Pass537
  // flank passed every body-anchor ray; allow that live lens only a small
  // additional public pair turn until a new uncropped native render proves
  // more. A source angle is never evidence that a foot can be seen.
  const turn=Math.max(-maxTurnRadians,Math.min(maxTurnRadians,delta))*eased;
  if(Math.abs(turn)<.000001)return false;
  offset.x=radius*Math.cos(normal+turn);
  offset.z=radius*Math.sin(normal+turn);
  return true;
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
  // Pass508 original source-bound 390px earned-recoil frame (Pass507, tick94)
  // still hides most of Thornback behind the PUBLIC foreground reef and raised
  // stone deck, even with its authentic full-body spring. A genuinely earned
  // Follow shot needs to look OVER that solid deck rather than making the
  // character taller, fading a real wall or exposing an undiscovered tile.
  // Tilt only the live already-witnessed post-counter camera upward to a
  // higher, isometric 31m orbit. Existing full-mesh strict +/-0.95 NDC,
  // visible-stage privacy and no-crop screenshot gates still decide acceptance.
  // No motion/optical change for threat warnings, reduced motion, other
  // viewports, replay, terminal scenes or hidden/stale counter events.
  return Math.max(currentY,31.0);
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
/**
 * Pass524: the ORIGINAL exact-HEAD 390x844 WebGL earned-counter screenshot
 * of the natural tick93->94 autonomous encounter proves that simply keeping
 * the prior live camera cuts off Thornback's connected shell on recoil.
 * Tick94 true public full-body NDC: Pip [-.859661,.228709], Thornback
 * [-.274811,1.293283]. Their union spans 2.153, too wide for a pan alone.
 *
 * Back off only the minimum physical orthographic lens required to fit the
 * TWO CURRENT published character meshes. The caller then recenters the
 * same full-mesh bounds under the EXISTING strict +/- .95 native screenshot
 * test. The .90 horizontal and .88 vertical budgets are STRONGER than the
 * original threshold; a >32% cutaway or invalid geometry fails closed.
 * Does not read hidden cells, alter AI, move actors or add GPU resources.
 */
export function publicGuardianEarnedRecoilSafeContactHalfHeight(
  aspect,halfHeight,bodies,earned=false,reducedMotion=false){
  if(!earned||reducedMotion||!Number.isFinite(aspect)
    ||aspect<.35||aspect>=.60||!Number.isFinite(halfHeight)
    ||halfHeight<=0||!Array.isArray(bodies)||bodies.length!==2)
    return halfHeight;
  for(const b of bodies)
    if(!b||!['left','right','top','bottom'].every(k=>Number.isFinite(b[k]))
      ||b.left>=b.right||b.bottom>=b.top)return halfHeight;
  const left=Math.min(bodies[0].left,bodies[1].left);
  const right=Math.max(bodies[0].right,bodies[1].right);
  const top=Math.max(bodies[0].top,bodies[1].top);
  const bottom=Math.min(bodies[0].bottom,bodies[1].bottom);
  const scale=Math.max(1,(right-left)/1.8,(top-bottom)/1.76);
  if(!Number.isFinite(scale)||scale>1.32
    ||top/scale>.94||bottom/scale<-.94)return halfHeight;
  return halfHeight*scale;
}

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

/**
 * Pass527: compose the REAL currently published lantern-counter diorama in a
 * portrait viewport, not a distant strip under empty sea. Exact incoming
 * full-frame WebGL seed-13 tick94 at 390x844 put connected Pip in
 * y [-.2161,+.2263] and Thornback in [-.5399,+.1265]. Their union center
 * is -.1568, while the upper stage is mostly empty ocean. Shift the EXISTING
 * optical camera up-axis (not a world mesh, geometry, crop, or camera target)
 * to give the genuine linked action a stronger middle-upper hierarchy.
 *
 * The caller passes FINAL projected complete-mesh envelopes AFTER optical
 * backoff, zoom and lateral pan. A move may only lift the visible public
 * pair, never leave either body's full vertical outline beyond the stronger
 * -.75 / +.63 staging limits. This is presentation-only, no private cells,
 * renderer allocations, collision, extra hit, or authority changes.
 * Returned world units are along camera UP; negative moves subjects UP.
 */
export function publicGuardianEarnedRecoilPairStageLift(
  aspect, halfHeight, bodies, earned=false, reducedMotion=false) {
  if (!earned || reducedMotion || !Number.isFinite(aspect)
    || aspect < .35 || aspect >= .60
    || !Number.isFinite(halfHeight) || halfHeight <= 0
    || !Array.isArray(bodies) || bodies.length !== 2) return 0;
  for (const body of bodies)
    if (!body || !['left','right','bottom','top'].every(k=>Number.isFinite(body[k]))
      || body.left >= body.right || body.bottom >= body.top
      || body.left < -.95 || body.right > .95
      || body.bottom < -.95 || body.top > .95) return 0;
  const top = Math.max(bodies[0].top,bodies[1].top);
  const bottom = Math.min(bodies[0].bottom,bodies[1].bottom);
  // Use a native-viewport-safe actor union, not a speculative viewport crop.
  // -.75 clears Map/Details touch controls; +.63 leaves the mission/header.
  if (bottom < -.75 || top >= .63) return 0;
  const center = (top+bottom)*.5;
  // Pass541 original full 390x844 WebGL at tick94 puts the complete
  // guardian counter ABOVE screen centre while nearly half the view is
  // unrelated foreground terrace. Use the ACTUAL, post-fit TWO-body NDC
  // envelope to seat the public contact nearer the optical centre, rather
  // than continuing to lift an already high pair. No actor, model scale,
  // terrain, control, or private path moves. Only 390-class portrait changes.
  // Camera-UP movement shifts the pictured bodies DOWN. Their final bounds
  // remain inside the existing stronger -.75/+ .63 touch/HUD reserves;
  // the original strict +/- .95 screen proof remains authoritative.
  // Preserve the exact-source Pass526/527/528 LOW two-body shot: its
  // union centre is ~-.16 NDC and the existing physically verified UP
  // lift (.28-.30 NDC) is necessary to clear empty ocean. Only an
  // ALREADY HIGH union gets the new downward optical correction.
  // This distinction comes solely from actual complete mesh bounds, not
  // a guessed level, invisible threat or alternate gameplay clock.
  if (aspect >= .45 && center >= -.05) {
    const requested = Math.max(-.24,Math.min(.24,center-.02));
    const safeShift = Math.max(top-.63,Math.min(bottom+.75,requested));
    return Math.abs(safeShift) >= .035 ? safeShift*halfHeight : 0;
  }
  // Retain the independently rendered 320px lift and every other viewport.
  const liftNdc = Math.min(.30,Math.max(0,.13-center),.63-top);
  return liftNdc >= .02 ? -liftNdc*halfHeight : 0;
}

/**
 * Pass528: native Pass527 showed the stage lift never reached the real
 * first-contact frame: the separate earnedShotAct multiplier was still zero.
 * Begin a bounded smooth camera-UP response immediately on a genuine,
 * witnessed same-run hit; no invented event, private map, AI, collision,
 * actor relocation or resource creation. Reset on any missing witness.
 */
export function publicGuardianEarnedContactStageResponse(
  current,delta,earned=false,reducedMotion=false) {
  if(!earned||reducedMotion||!Number.isFinite(current)
    ||current<0||current>1||!Number.isFinite(delta)||delta<0)return 0;
  const dt=Math.min(.1,delta);
  return Math.min(1,current+(1-current)*(1-Math.exp(-10*dt)));
}


/**
 * The original source-bound 320/390 counter is a real impact, not a generic
 * danger tint. The caller must independently prove a current, public, same-run
 * visible parried guardian; a purely chronological rendering clock never
 * authenticates an enemy or an AI action. This pure envelope gates the single
 * pooled physical stage light and existing lantern/sunlight handoff.
 *
 * Hold the authentic first-contact illumination through the actual planted
 * recoil, then smoothly settle over the final .35 of the public two-second
 * witness. Wrong run/hidden/terminal/reduced-motion restores neutral lighting.
 */
export function publicEarnedGuardianCounterLighting(
  counterPhase,authenticated=false,reducedMotion=false) {
  if(!authenticated || reducedMotion || typeof counterPhase!=='number'
    || !Number.isFinite(counterPhase) || counterPhase<0
    || counterPhase>=1)return 0;
  const fade=Math.max(0,Math.min(1,(1-counterPhase)/.35));
  return fade*fade*(3-2*fade);
}
