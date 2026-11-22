// P0 first authentic F8->F9 shot: an old rendered camera can put the hero
// and open gate inside NDC while seeing them through real bronze panels.
// Compare the SAME source-owned physical triangle samples on both proposed
// cameras. This only vetoes presentation; gameplay, roof, HP and passage
// remain the authority. A partially obstructed but unchanged lens is not a
// physical improvement, and a clear body must not lose its gateway.
const keys=Object.freeze([
  'bodyBlockedRays','gatewayBlockedRays','originalGateBlockedRays',
  'originalCapBlockedRays','originalCapBlockedBodyRays','originalCapBlockedGatewayRays',
  'originalGalleryBlockedRays','originalGalleryBlockedBodyRays',
  'originalGalleryBlockedGatewayRays','architectureBlockedRays'
]);
const sane=v=>v?.active===true &&
  Number.isSafeInteger(v.rays) && v.rays>=3 && v.rays<=9 &&
  Number.isSafeInteger(v.score) && v.score>=0 &&
  keys.every(k=>Number.isSafeInteger(v[k]) && v[k]>=0 &&
    v[k]<=v.rays) &&
  v.bodyBlockedRays+v.gatewayBlockedRays<=v.rays &&
  v.score===v.bodyBlockedRays*2+v.gatewayBlockedRays &&
  v.originalCapBlockedBodyRays<=v.bodyBlockedRays &&
  v.originalCapBlockedGatewayRays<=v.gatewayBlockedRays &&
  v.originalGateBlockedRays<=v.bodyBlockedRays &&
  v.originalCapBlockedRays===v.originalCapBlockedBodyRays+
    v.originalCapBlockedGatewayRays &&
  v.originalGalleryBlockedRays===v.originalGalleryBlockedBodyRays+
    v.originalGalleryBlockedGatewayRays &&
  v.originalGalleryBlockedBodyRays<=v.bodyBlockedRays &&
  v.originalGalleryBlockedGatewayRays<=v.gatewayBlockedRays &&
  v.architectureBlockedRays<=v.bodyBlockedRays+v.gatewayBlockedRays;

export function assessOriginalGatewayPhysicalCameraBridge(before,after){
  if(!sane(before)||!sane(after)||before.rays!==after.rays)
    return {allowed:false,reason:'missing-or-incomparable-source-triangles',gain:0};
  // No newly occluded skinned shoulder, source doorway or first-F9
  // structural owner may be traded for a tidier 2D composition.
  if(keys.some(k=>after[k]>before[k]) || after.score>before.score)
    return {allowed:false,reason:'physical-occlusion-regression',gain:0};
  if(after.score>0 && after.score===before.score)
    return {allowed:false,reason:'no-physical-sightline-improvement',gain:0};
  return {allowed:true,reason:after.score===0?
    'actual-geometry-clear':'actual-geometry-improved',
    gain:before.score-after.score};
}

// A real retained bronze cap/gallery obscuring the skinned actor needs
// exterior pullback and lift, not near-identical tiny yaw trials. Use the
// existing source-authorized 6 candidates and spend only THREE physical
// camera probes. Source-owner counts are required; invalid evidence fails
// closed, and every actual scene/world/ray veto still runs downstream.
export function selectOriginalGatewayThreeSubjectTrials(candidates,before){
  if(!sane(before)||!Array.isArray(candidates)||candidates.length!==6||
     !candidates.every(c=>Array.isArray(c)&&c.length===3&&
       c.every(Number.isFinite)))return [];
  const oldForegroundBlocked=before.originalCapBlockedRays>0||
    before.originalGalleryBlockedRays>0;
  return oldForegroundBlocked?candidates.slice(3,6):candidates.slice(1,4);
}

// These are projections of three CURRENT source-owned 3D subjects. This
// evaluator never claims video pixels, and never licenses a camera without
// the separate world-triangle and solid-core vetoes. A point-only hero or
// empty theoretical doorway must not masquerade as a readable crossing.
export function assessOriginalGatewayThreeSubjectCameraFrame({
  heroNdc,gateNdc,walkableNdc,steel
}={}) {
  const ndc=(p,length)=>Array.isArray(p)&&p.length===length&&
    p.every(Number.isFinite)&&p[2]>=-1&&p[2]<=1;
  if(!ndc(heroNdc,4)||!ndc(gateNdc,4)||!ndc(walkableNdc,3) ||
     heroNdc[3]<.055||gateNdc[3]<.025 ||
     Math.abs(heroNdc[0])+heroNdc[3]*.14>.76||
     Math.abs(heroNdc[1])+heroNdc[3]>.76 ||
     Math.abs(gateNdc[0])+gateNdc[3]*.10>.80 ||
     Math.abs(gateNdc[1])+gateNdc[3]>.80 ||
     Math.abs(walkableNdc[0])>.78||Math.abs(walkableNdc[1])>.76)
    return {accepted:false,reason:'cropped-real-hero-gate-or-walkable-deck',score:0};
  if(steel?.sourceBound!==true ||
     !Number.isFinite(steel.projectedMetalArea)||
     steel.projectedMetalArea<.004||
     !Number.isSafeInteger(steel.projectedPanes)||
     steel.projectedPanes<2)
    return {accepted:false,reason:'original-attached-gateway-steel-not-readable',score:0};
  // Favor a clear physical three-subject frame, especially the REAL opened
  // bronze metal; never reward an offscreen, tiny or borrowed portal.
  const separated=Math.min(1,Math.hypot(
    heroNdc[0]-gateNdc[0],heroNdc[1]-gateNdc[1])/.55);
  return {accepted:true,reason:'real-three-subject-projection',
    score:Math.min(1,steel.projectedMetalArea/.12)*.45+
      Math.min(1,heroNdc[3]/.20)*.30+
      Math.min(1,gateNdc[3]/.20)*.10+separated*.15};
}


/**
 * Reuse the ACTUAL safe gateway camera instead of running a second six-pose
 * optical search over the same live Three.js roof and original bronze mesh.
 * This is only an early-exit on an already fully readable, zero-occlusion
 * source-owned three-subject shot. Ambiguous, cropped, obscured or tiny
 * silhouettes MUST run the unchanged bounded physical camera search.
 * No wall clock, simulation edits, camera cut, asset, source event or win.
 */
export function sourceGatewayNeedsExpensiveOpticalSearch({
  deckView,steel,heroNdc,gateNdc,walkableNdc
}={}) {
  if(deckView?.active!==true ||
     !Number.isSafeInteger(deckView.score) ||
     deckView.score!==0 ||
     deckView.bodyBlockedRays!==0 || deckView.gatewayBlockedRays!==0)
    return true;
  const frame=assessOriginalGatewayThreeSubjectCameraFrame({
    heroNdc,gateNdc,walkableNdc,steel
  });
  if(!frame.accepted)return true;
  // The 2D centres must be meaningfully distinct as well as physically
  // clear. Do not mistake a visually collapsed gateway for good composition.
  if(Math.hypot(heroNdc[0]-gateNdc[0],
      heroNdc[1]-gateNdc[1])<.22 ||
     heroNdc[3]<.115 || gateNdc[3]<.06 ||
     steel.projectedMetalArea<.018) return true;
  return false;
}


/**
 * P0 source-physical PORTRAIT doorway camera composition. The genuine
 * Floor8 lens may retain both the bronze gate and skinned climber, yet
 * look toward an old focus while the player is already moving above the
 * walkable successor roof. Three existing reversible exterior trials all
 * used the identical gaze, making the same offscreen destination fail
 * repeatedly on the 390x844 native film.
 *
 * Plan exactly THREE alternative focus points from the CURRENT real hero,
 * original gateway, and source-owned Floor9 receiving roof. The Scene
 * spends NO additional camera/triangle/metal queries: it replaces the
 * gaze in the same three physical vetoed trials. This helper cannot grant
 * a guardian win, change the camera position, change source state or
 * certify visible WebM pixels. The bounded spatial and returned-frame
 * step rejects a borrowed faraway run/world and reduces sudden panning.
 */
export function sourceOriginalGatewayJointGazeCandidates({
  aspect,dt,currentGaze,hero,gateway,walkable
}={}) {
  const point=p=>Array.isArray(p) && p.length===3 &&
    p.every(Number.isFinite);
  if(!Number.isFinite(aspect) || aspect<.33 || aspect>=.85 ||
     !Number.isFinite(dt) || dt<=0 || dt>.2 ||
     ![currentGaze,hero,gateway,walkable].every(point))
    return null;
  const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  // Same original metal, physically nearby live body and successor roof.
  // New-run, stale-world and HP-zero proofs are already mandatory in Scene.
  if(dist(hero,gateway)>85 || dist(hero,walkable)>85 ||
     dist(gateway,walkable)>85) return null;
  const destination=hero.map((v,i)=>v*.48+
    gateway[i]*.34+walkable[i]*.18);
  const delta=destination.map((v,i)=>v-currentGaze[i]);
  const length=Math.hypot(...delta);
  if(!Number.isFinite(length) || length<.0001)return null;
  const step=Math.min(length,5.5,1.1+70*dt);
  // Three DIFFERENT physically sourced sightline proposals; do not add
  // another frame, reviewer, synthetic hero pose or GPU-costly ray.
  return [.33,.66,1].map(weight=>currentGaze.map(
    (v,i)=>v+delta[i]/length*step*weight));
}
