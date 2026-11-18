import { pointFor } from './coordinates.mjs';
import { observedSourceFloorNineRouteSupport, observedSourceOriginalVisibilityWindow } from './source-physical-arrival-palette.mjs';

// One final physically measured camera arbitration for the SAME source-earned
// old bronze gateway and the actually drawn living climber. This scores real
// projected body/door positions, not game ticks, a cosmetic fade or CI success.
// The scene owns Three.js projection, opaque-core rays and camera rollback.
const finite = Number.isFinite;
function valid(bounds) {
  return Array.isArray(bounds) && bounds.length === 4 &&
    bounds.every(finite) && bounds[3] >= 0 &&
    bounds[2] >= -1 && bounds[2] <= 1;
}
function overflow(bounds, x, y) {
  return Math.max(0, Math.abs(bounds[0]) + bounds[3] * .12 - x) +
    Math.max(0, Math.abs(bounds[1]) + bounds[3] - y);
}
export function sourceDoorwayFrameGain(beforeHero, beforeDoor, afterHero, afterDoor,
    heroClear, doorClear) {
  if (![beforeHero, beforeDoor, afterHero, afterDoor].every(valid) ||
      heroClear !== true || doorClear !== true ||
      afterHero[3] < .055 ||
      Math.abs(afterHero[0]) + afterHero[3] * .12 >= .82 ||
      Math.abs(afterHero[1]) + afterHero[3] >= .82 ||
      Math.abs(afterDoor[0]) + afterDoor[3] * .12 >= 1.35 ||
      Math.abs(afterDoor[1]) + afterDoor[3] >= 1.18) return 0;
  const heroBefore = overflow(beforeHero, .61, .65);
  const heroAfter = overflow(afterHero, .61, .65);
  const doorBefore = overflow(beforeDoor, .60, .67);
  const doorAfter = overflow(afterDoor, .60, .67);
  // The bronze door must genuinely improve; making only the actor prettier
  // is NOT justification for an earned-gateway camera change.
  if (doorBefore < .04 || doorAfter >= doorBefore - .009 ||
      heroAfter > heroBefore + .035) return 0;
  const gain = doorBefore - doorAfter + (heroBefore - heroAfter) * 1.7;
  return gain > .016 ? Math.min(2, gain) : 0;
}
export function sourceDoorwayFrameSteps(dt, aspect) {
  if (!finite(dt) || dt <= 0 || dt > .5 ||
      !finite(aspect) || aspect <= .35 || aspect >= 2.5) return null;
  const frame = Math.min(.06, dt);
  // A stable exterior 3D camera, no sudden cut or independent animation.
  return {
    gazeMetres: Math.min(.64, frame * (aspect < .85 ? 9 : 7)),
    orbitRadians: Math.min(.035, frame * (aspect < .85 ? .72 : .55)),
    // One camera's bounded radial withdrawal/physical shoulder lift,
    // NOT a jump cut or separate cinematic camera. Only the source-earned
    // three-subject shot below may use these values.
    pullbackMetres: Math.min(.65, frame * (aspect < .85 ? 10 : 8)),
    liftMetres: Math.min(.31, frame * (aspect < .85 ? 5.5 : 4)),
  };
}


// Source-authenticated FIRST Floor9 doorway: the existing four tiny camera
// probes could not see around actual moving-platform skirts or the reopened
// bronze guardian gateway in the normal-speed portrait film. Search a bounded
// exterior volume, starting with the least disruptive physical shoulder and
// escalating only when current source-owned triangles really block the body
// or original gate. The camera owner still requires safe projection, solid-
// core clearance and a strictly improved genuine ray result for every move.
// The final two shoulder candidates are wider but still strictly bounded;
// the real source-body and gateway ray budget must demonstrate improvement,
// while the composed camera enforces hard crop/core veto. This avoids
// repeatedly approving a 5m cosmetic shift that still leaves two skinned
// shoulder rays covered by the successor platform.
// Returned offsets are meters/radians applied to the PRESENT camera, not
// a predicted player trajectory, synthetic scene or replayed frame.
const DESKTOP_SOURCE_CLEARANCE = Object.freeze([
  Object.freeze([-.045,1.6,1.8]),Object.freeze([.045,1.6,1.8]),
  Object.freeze([-.105,2.8,2.8]),Object.freeze([.105,2.8,2.8]),
  Object.freeze([0,3.6,3.8]),
  Object.freeze([-.24,3.8,6.2]),Object.freeze([.24,3.8,6.2]),
  Object.freeze([0,-1.9,3.8])
]);
const PORTRAIT_SOURCE_CLEARANCE = Object.freeze([
  Object.freeze([-.06,1.8,2.2]),Object.freeze([.06,1.8,2.2]),
  Object.freeze([-.115,3.2,3.2]),Object.freeze([.115,3.2,3.2]),
  Object.freeze([0,4.0,4.0]),
  Object.freeze([-.245,4.0,6.5]),Object.freeze([.245,4.0,6.5]),
  Object.freeze([0,-1.7,4.0])
]);
export function sourceDeckGatewayClearanceCandidates(aspect, actualDeckRays) {
  if (!finite(aspect) || aspect<.38 || aspect>2.1 ||
      actualDeckRays?.active!==true ||
      !Number.isSafeInteger(actualDeckRays.bodyBlockedRays) ||
      !Number.isSafeInteger(actualDeckRays.gatewayBlockedRays) ||
      actualDeckRays.bodyBlockedRays<0 ||
      actualDeckRays.gatewayBlockedRays<0 ||
      actualDeckRays.bodyBlockedRays+actualDeckRays.gatewayBlockedRays===0)
    return null;
  return aspect<.85 ? PORTRAIT_SOURCE_CLEARANCE : DESKTOP_SOURCE_CLEARANCE;
}

// Three-subject COLD Floor8 guardian -> Floor9 walkway composition.
// Unlike a colored HUD, the third subject is a point on the ACTUAL already
// authored walkable f9:ground mesh beyond the genuine HP-zero gateway.
// This ONLY informs the real follow camera. No platform, future footfall,
// doorway, collision, source tick, AI decision or player position is made.
export function observedSourceWalkableCrossfloorShot(source, held) {
  const p=source?.player, w=source?.lastGuardianCrossing;
  if(source?.lifecycle!=='running' || source.floor!==9 ||
      source.theme!=='void' || !(p?.health>0) ||
      !Array.isArray(source.platforms) ||
      !held || held.guardianGateRetained!==true ||
      held.floor!==9 || held.oldCapId!=='f8:cap' ||
      held.runToken!==source.runToken ||
      typeof source.runToken!=='string' || !source.runToken ||
      !observedSourceOriginalVisibilityWindow(source,held)?.sourceBound ||
      ![source.tick,source.chunkBaseY,source.worldWidth,
        held.sourceTick,held.thresholdX,held.oldRoofY,
        held.oldCapX,held.oldCapWidth,p.x,p.y,p.halfWidth,p.halfHeight]
        .every(Number.isSafeInteger) ||
      source.worldWidth<=0 || held.oldCapWidth<=0 ||
      p.halfWidth<=0 || p.halfHeight<=0 ||
      held.thresholdX!==held.oldCapX+Math.floor(held.oldCapWidth*.76))
    return null;
  // A published but contradictory guardian crossing must always veto a
  // lower-authority historical camera receipt.
  if(w!=null) {
    const cap=w.cap, guardian=w.guardian;
    if(w.runToken!==source.runToken || w.fromFloor!==8 || w.toFloor!==9 ||
       cap?.id!=='f8:cap' || cap.x!==held.oldCapX ||
       cap.width!==held.oldCapWidth ||
       cap.y+cap.height!==held.oldRoofY ||
       w.exitX!==held.thresholdX ||
       !Number.isSafeInteger(w.sourceTick) ||
       w.sourceTick!==held.crossingTick ||
       source.tick<w.sourceTick ||
       guardian?.kind!=='guardian' || guardian.active!==false ||
       !Number.isFinite(guardian.health) || guardian.health>0)
      return null;
  } else if(held.verifiedObservedFloorAdvance!==true ||
      held.crossingTick!=null || source.tick-held.sourceTick>12)
    return null;
  const ground=source.platforms.find(deck=>deck?.id==='f9:ground');
  if(!ground || ![ground.x,ground.y,ground.width,ground.height]
        .every(Number.isSafeInteger) ||
      ground.width<=0 || ground.height<=0 ||
      ground.y+ground.height!==held.oldRoofY ||
      !observedSourceFloorNineRouteSupport(source,ground,held.oldRoofY))
    return null;
  // This shot is for the ACTUAL just-crossed old sill. Do not drag the lens
  // backward during the later authentic jump to f9:p2 or a distant ascent.
  const soles=p.y-p.halfHeight;
  if(soles<held.oldRoofY-2500 || soles>held.oldRoofY+22000 ||
      Math.abs(p.x-held.thresholdX)>90000)return null;
  const nearest=Math.max(held.thresholdX+p.halfWidth+2000,
    ground.x+p.halfWidth+2000);
  const farthest=ground.x+ground.width-p.halfWidth-2000;
  if(nearest>farthest || farthest>source.worldWidth ||
      nearest<0)return null;
  // This is existing grounded corridor geometry just ahead of the living
  // climber, not an invented player destination or simulated landing.
  const x=Math.max(nearest,Math.min(farthest,p.x+20000));
  const world=pointFor(x,held.oldRoofY,source.chunkBaseY,
    source.worldWidth,25);
  if(![world.x,world.y,world.z].every(finite))return null;
  return {sourceBound:true,sourceTick:source.tick,platformId:ground.id,
    anchorX:x,world:[world.x,world.y+.2,world.z],
    limitation:'Actual post-guardian walkable F9 roof point only; projection is not painted/native video evidence'};
}

function validWalkableNdc(ndc) {
  return Array.isArray(ndc) && ndc.length===3 &&
    ndc.every(finite) && ndc[2]>=-1 && ndc[2]<=1;
}
// If the genuine third physical subject was already legible, camera repairs
// for two other subjects must not throw it outside the same safe screen.
// The caller independently verifies real core/triangle paths and can only
// invoke this with a source-earned anchor, never a guessed targetPlatform.
export function sourceWalkableCrossfloorProjectionHeld(before,after) {
  if(!validWalkableNdc(before) || !validWalkableNdc(after))return false;
  const overflowBefore=Math.max(0,Math.abs(before[0])-.72)+
    Math.max(0,Math.abs(before[1])-.70);
  const overflowAfter=Math.max(0,Math.abs(after[0])-.72)+
    Math.max(0,Math.abs(after[1])-.70);
  return Math.abs(after[0])<=.88 && Math.abs(after[1])<=.82 &&
    overflowAfter<=overflowBefore+.035;
}


/*
 * The original 1x Floor8 -> Floor9 film showed a second P0 failure beyond
 * offscreen cropping: a source-true old gateway, full climber and next-floor
 * walkable endpoint can all project INSIDE the viewport yet visually stack
 * into one bronze silhouette. Previous sourceDoorwayFrameGain and
 * sourceWalkableCrossfloorFrameGain were ZERO in this case, so the director
 * never even tested a better genuine 3D angle.
 *
 * Score the ENTIRE current three-subject on-screen composition, not a
 * synthetic cutscene or fake destination. The caller only invokes this with
 * an immutable HP-zero source passage and a real f9:ground roof, and vetoes
 * every improving camera against authentic old-cap, gate, gallery, Void
 * bearing, successor-deck triangles and solid-core rays before accepting it.
 * Prevent cheating by shrinking the actor/gate or moving a subject offscreen.
 * This is an optical *proposal*; only native film can demonstrate success.
 */
export function sourceThreeSubjectSilhouetteRelief(
  beforeHero,beforeDoor,beforeWalkable,
  afterHero,afterDoor,afterWalkable,
  heroCoreClear,doorCoreClear,walkableCoreClear
) {
  if (![beforeHero,beforeDoor,afterHero,afterDoor].every(valid) ||
      !validWalkableNdc(beforeWalkable) || !validWalkableNdc(afterWalkable) ||
      heroCoreClear!==true || doorCoreClear!==true ||
      walkableCoreClear!==true ||
      beforeHero[3]<.055 || beforeDoor[3]<.035 ||
      afterHero[3]<beforeHero[3]*.90 ||
      afterDoor[3]<beforeDoor[3]*.84 ||
      Math.abs(afterHero[0])+afterHero[3]*.12>.76 ||
      Math.abs(afterHero[1])+afterHero[3]>.76 ||
      Math.abs(afterDoor[0])+afterDoor[3]*.12>.82 ||
      Math.abs(afterDoor[1])+afterDoor[3]>.82 ||
      Math.abs(afterWalkable[0])>.84 ||
      Math.abs(afterWalkable[1])>.78)
    return 0;
  const overlap=(a,b,minX,minY)=>{
    const dx=(a[0]-b[0])/minX;
    const dy=(a[1]-b[1])/minY;
    return Math.max(0,1-Math.hypot(dx,dy));
  };
  const crowded=(hero,door,route)=>{
    const hg=overlap(hero,door,
      Math.max(.16,hero[3]*.75+door[3]*.58),
      Math.max(.20,hero[3]+door[3]*.72));
    const gr=overlap(door,route,
      Math.max(.16,door[3]*.63+.10),
      Math.max(.18,door[3]*.70+.11));
    const hr=overlap(hero,route,
      Math.max(.19,hero[3]*.70+.10),
      Math.max(.20,hero[3]*.82+.10));
    return 1.15*hg+.82*gr+.65*hr;
  };
  const before=crowded(beforeHero,beforeDoor,beforeWalkable);
  const after=crowded(afterHero,afterDoor,afterWalkable);
  // This is not a licence to improve separation by sacrificing the current
  // camera's previously readable full body, open door or real landing.
  if(before<.035 || after>=before-.002 ||
      overflow(afterHero,.61,.65)>overflow(beforeHero,.61,.65)+.014 ||
      overflow(afterDoor,.60,.67)>overflow(beforeDoor,.60,.67)+.014)
    return 0;
  return Math.min(.28,before-after);
}

// The post-director Floor9 doorway search previously selected the best
// projected pair and tested real world triangles ONLY after ranking. When
// that winning trial passed behind the original F8 cap, it discarded the
// entire search even if a second camera could see the REAL gate, full actor
// and walkable Floor9 together. Try a small one-frame physical orbit AND
// exterior pullback; check each meaningful proposal with the actual current
// source-owned meshes before ranking. These are frame increments (metres),
// not a teleported camera, invented landing or camera mode override.
export function sourceWalkableThreeSubjectOrbitCandidates(steps,hasRealDeck){
  if(hasRealDeck!==true || !steps ||
     ![steps.orbitRadians,steps.pullbackMetres,steps.liftMetres].every(finite) ||
     steps.orbitRadians<=0 || steps.orbitRadians>.035 ||
     steps.pullbackMetres<=0 || steps.pullbackMetres>.65 ||
     steps.liftMetres<=0 || steps.liftMetres>.31)return null;
  const a=steps.orbitRadians,d=steps.pullbackMetres,h=steps.liftMetres;
  return [[0,0,0],[-a,0,0],[a,0,0],
    [0,d,h],[-a,d,h],[a,d,h]];
}
// Only an existing, source-authenticated F8 cap/gate and F9 geometry may
// witness this choice. Reject absent, stale, nonfinite or worsened real mesh
// rays for ANY of the original three subjects. Never rank a crop-only fix
// above a genuinely unobstructed actor/arch/deck.
export function sourceThreeSubjectRaySafe(before,after){
  const keys=['bodyBlockedRays','gatewayBlockedRays',
    'originalGateBlockedRays','originalCapBlockedBodyRays',
    'originalCapBlockedGatewayRays','architectureBlockedRays','score'];
  if(before?.active!==true || after?.active!==true ||
     keys.some(k=>!Number.isSafeInteger(before[k]) ||
       !Number.isSafeInteger(after[k]) || before[k]<0 || after[k]<0))
    return false;
  return keys.every(k=>after[k]<=before[k]);
}

// A *third* source-authenticated subject can initiate a small reversible
// gaze correction even when the old gateway is already legible. This stops
// the camera treating a visible bronze arch and player over featureless air
// as a completed physical arrival. Existing real-geometry rays must still
// veto any candidate that re-hides the skinned actor or old gate.
export function sourceWalkableCrossfloorFrameGain(
    beforeHero,beforeDoor,beforeRoute,afterHero,afterDoor,afterRoute,
    heroClear,doorClear,routeClear) {
  if(![beforeHero,beforeDoor,afterHero,afterDoor].every(valid) ||
     !validWalkableNdc(beforeRoute) || !validWalkableNdc(afterRoute) ||
     heroClear!==true || doorClear!==true || routeClear!==true ||
     afterHero[3]<.055 ||
     Math.abs(afterHero[0])+afterHero[3]*.12>=.82 ||
     Math.abs(afterHero[1])+afterHero[3]>=.82 ||
     Math.abs(afterDoor[0])+afterDoor[3]*.12>=.84 ||
     Math.abs(afterDoor[1])+afterDoor[3]>=.84 ||
     Math.abs(afterRoute[0])>=.90 || Math.abs(afterRoute[1])>=.83)
    return 0;
  const before=Math.max(0,Math.abs(beforeRoute[0])-.61)+
    Math.max(0,Math.abs(beforeRoute[1])-.64);
  const after=Math.max(0,Math.abs(afterRoute[0])-.61)+
    Math.max(0,Math.abs(afterRoute[1])-.64);
  const heroBefore=overflow(beforeHero,.61,.65);
  const heroAfter=overflow(afterHero,.61,.65);
  const gateBefore=overflow(beforeDoor,.60,.67);
  const gateAfter=overflow(afterDoor,.60,.67);
  if(before<.045 || after>before-.012 ||
      heroAfter>heroBefore+.025 || gateAfter>gateBefore+.025)
    return 0;
  return Math.min(1,before-after+
    (heroBefore-heroAfter)*.5+(gateBefore-gateAfter)*.5);
}
