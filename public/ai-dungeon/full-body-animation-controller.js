/**
 * AI Dungeon source-rig animation arbiter.
 *
 * This is a read-only presentation controller. A state is derived exclusively
 * from the existing public unit, actual rendered travel and witnessed damage /
 * evasion beats. It NEVER creates an attack, a target, a grid step or a hit.
 *
 * Ownership (high -> low):
 *   defeat > verified injury > witnessed evasion > authored one-shot >
 *   guard > travelled locomotion > idle.
 *
 * The existing imported AnimationMixer remains the base pose. All secondary
 * quaternion deltas are reversed before its next update; the arbiter decides
 * which secondary performance can touch that base pose in the current frame.
 * Source-rig bone names/retargeting are an adapter contract, not modified here.
 */
const ACTIONS=new Set(['idle','move','attack','cast','hurt','guard']);
const ONESHOTS=new Set(['attack','cast','hurt']);
const ONE_SHOT_RECOVERY=Object.freeze({attack:.62,cast:.64,hurt:.55});
const finite=Number.isFinite;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const safeAge=(n,max=5)=>finite(n)?clamp(n,0,max):0;
const MODES=Object.freeze(['idle','move','guard','cast','attack','evade','hurt','defeat']);
export const FULL_BODY_ANIMATION_MODES=MODES;

/**
 * Actual pinned TacticalSlash rigs contain both a horizontal melee clip
 * and a distinct 41-joint two-handed ranged release. Selecting the generic
 * first "attack" clip for a Ranger wrongly performs sword-body mechanics.
 * This is presentation-only and does not authorize an arrow or a hit.
 */
const SOURCE_CLIP_PREFERENCES=Object.freeze({
 idle:[/\bidle\b/i,/idle/i,/stand/i],
 move:[/run/i,/walk/i,/move/i],
 attack:[/attack/i,/melee/i,/slash/i,/shoot/i],
 cast:[/cast/i,/spell/i,/magic/i,/attack/i],
 hurt:[/hit/i,/hurt/i,/damage/i,/impact/i],
 defeat:[/^death(?:[_\s-]|$)/i],
 guard:[/block/i,/shield/i,/defend/i,/idle/i]
});
const RANGER_SOURCE_RELEASE=/(?:ranged|bow|archer)[_\s-]*(?:shoot|attack|release)/i;
export function chooseImportedSourceClip(available=[],action='idle',kind=''){
 if(!Array.isArray(available))return null;
 if(action==='defeat')return available.find(c=>typeof c?.name==='string'&&SOURCE_CLIP_PREFERENCES.defeat[0].test(c.name))||null;
 if(kind==='ranger'&&action==='attack'){
  const ranged=available.find(clip=>typeof clip?.name==='string'&&
   RANGER_SOURCE_RELEASE.test(clip.name));
  if(ranged)return ranged;
 }
 const prefer=SOURCE_CLIP_PREFERENCES[action]||SOURCE_CLIP_PREFERENCES.idle;
 for(const regex of prefer){
  const found=available.find(clip=>typeof clip?.name==='string'&&regex.test(clip.name));
  if(found)return found;
 }
 return available.find(clip=>typeof clip?.name==='string'&&/idle/i.test(clip.name))||
  available[0]||null;
}


/**
 * Select two separated ORIGINAL skinned outsole sample vertices, not the
 * higher instep/boot shaft. The earlier diagnostic selected any foot-weighted
 * vertex up to 120mm above the lowest source bind vertex, then called the
 * horizontal extremes "heel/toe". That can contaminate world-floor contact
 * evidence with the top of the shoe and authorise unsafe IK experiments.
 *
 * This is deliberately a SOURCE INSPECTION contract, not a foot-lock or an
 * anatomical heel/toe guarantee. Return null for insufficient true outsole
 * area, missing source skin weight, non-finite coordinates or an impossible
 * footprint. No source skeleton, clip, material or authority is modified.
 */
/**
 * Original foot->toes longitudinal direction in the SOURCE bind pose.
 * Callers must independently verify the named deform bones share the actual
 * imported skin, the toes are descendants of the same-side foot, and both
 * points came from their source inverse-bind matrices in mesh geometry space.
 * Never guess an axis from rendered movement, root yaw or visible silhouettes.
 * This is a diagnostic only: it does NOT authorize an IK/contact correction.
 */
/**
 * Bounded original-skeleton SWING toe clearance, not stance IK or a foot plant.
 *
 * In original GLB 1440px/390px measured Walking_A frames, the true skinned
 * source toe can intersect stone by 40–92mm while its matching heel is already
 * 120–240mm AIRBORNE. That is toe drag, not a valid stance/plant candidate.
 *
 * Start only when the true source sole has crossed 10mm into stone,
 * rather than waiting for deep drag after which slew-limited correction
 * cannot catch up. The original airborne-heel and contact exclusions apply.
 * The caller probes the REAL source foot joint in the current post-mixer
 * hierarchy and provides the observed toe lift from one 0.1rad local-X trial.
 * Return a restrained reversible ankle bend only if that ORIGINAL source toe
 * actually clears upward under the probe. Never infer a joint axis from world
 * yaw, never alter a source clip, grid root, contact, opponent or authority.
 * Release immediately on interruption, teleport, injury, guard and death.
 */

/**
 * Original Walking_A may drive a skinned swing toe 40–90mm through stone
 * while its matching heel is airborne. A .1rad trial can be insufficient.
 * Select only a measured heel-safe original-foot candidate among four
 * reversible ±.1/±.2rad source-bone probes. NOT IK or certified stance lock.
 */
export function selectOriginalSourceSwingAnkleTrial({
 toeWorldY=NaN,heelWorldY=NaN,floorTopY=NaN,trials=[],previousCorrectionRad=0
}={}){
 if(![toeWorldY,heelWorldY,floorTopY,previousCorrectionRad].every(finite)||
  Math.abs(previousCorrectionRad)>.23||
  Math.abs(floorTopY+.02)>.005||!Array.isArray(trials)||trials.length>4||
  heelWorldY-floorTopY<.075||heelWorldY-floorTopY>.28||
  toeWorldY-floorTopY>=-.01||toeWorldY-floorTopY<-.16)return null;
 let best=null;
 for(const entry of trials){
  const {signed,toe,heel}=entry??{};
  // A previously supported original foot may have a second, less dramatic
  // SAME-SIGNED heel-safe trial. Do not pick a stronger opposing sample only
  // for the downstream joint slew to discard the entire rendered frame.
  if(previousCorrectionRad!==0&&Math.sign(signed)!==Math.sign(previousCorrectionRad))continue;
  if(![signed,toe,heel].every(finite)||
   Math.abs(signed)<.09||Math.abs(signed)>.225||
   toe-toeWorldY<.006||toe-toeWorldY>.09||
   heel-floorTopY<.045||heel-floorTopY>.34||
   Math.abs(heel-heelWorldY)>.07||toe-floorTopY>.09)continue;
  if(best===null||toe>best.toe)best={signed,toe,heel};
 }
 return best;
}

export function planOriginalSourceSwingToeClearance({
 mode='idle',sourceClipName='',sourceAnatomyVerified=false,sourceWeight=NaN,
 alive=false,visible=false,groundedMoving=false,teleport=false,
 reducedMotion=false,interrupted=false,rootTravel=NaN,
 floorTopY=NaN,heelWorldY=NaN,toeWorldY=NaN,
 trialToeWorldY=NaN,trialAngleRad=NaN,previousCorrectionRad=NaN
}={}){
 if(mode!=='move'||!/^walking[_\s-]*a$/i.test(sourceClipName)||
  sourceAnatomyVerified!==true||alive!==true||visible!==true||
  groundedMoving!==true||teleport||reducedMotion||interrupted||
  ![sourceWeight,rootTravel,floorTopY,heelWorldY,toeWorldY,
    trialToeWorldY,trialAngleRad,previousCorrectionRad].every(finite)||
  sourceWeight<.5||sourceWeight>1.001||
  rootTravel<.008||rootTravel>.24||
  Math.abs(floorTopY+.02)>.005||
  Math.abs(trialAngleRad)<.045||Math.abs(trialAngleRad)>.225||
  Math.abs(previousCorrectionRad)>.23)return 0;
 const heelClear=heelWorldY-floorTopY,toeClear=toeWorldY-floorTopY;
 // A lifted heel and submerged toe are an original swing-foot obstacle.
 // A true planted foot MUST NOT be corrected by this swing-only contract.
 if(heelClear<.075||heelClear>.28||toeClear>=-.01||toeClear<-.16)return 0;
 const witnessedLift=trialToeWorldY-toeWorldY;
 if(witnessedLift<.006||witnessedLift>.08)return 0;
 // Correct some of the intrusion, not the whole foot in a single keyframe.
 // Keep at least two visible source poses before the full .15rad envelope.
 const liftDemand=Math.min(.04,-.005-toeClear);
 // A legal crossfade still has the original Walking_A skeleton, but the
 // outgoing Idle clip partially owns the ankle. Ease its toe correction
 // continuously from zero at 50% original source weight to full at 90%.
 // Never pitch an Idle-dominated source rig to fix a walking-only obstacle.
 const sourceShare=clamp((sourceWeight-.5)/.4,0,1);
 const sourceEase=sourceShare*sourceShare*(3-2*sourceShare);
 const signedTarget=Math.sign(trialAngleRad)*sourceEase*
  Math.min(.22,Math.abs(trialAngleRad)*liftDemand/witnessedLift);
 // Every frame restores the imported mixer pose before its ankle overlay.
 // The previous frame's rate window may lie entirely on the WRONG side of
 // the newest real skinned-toe trial. Clamping into that stale window
 // otherwise pitches the original foot DOWN while the trial lifted it UP.
 // A zero-share crossfade also must not leak an old correction. Reset the
 // cosmetic delta instead of preserving a physically opposing bend.
 if(sourceEase===0||(previousCorrectionRad!==0&&
  Math.sign(previousCorrectionRad)!==Math.sign(trialAngleRad)))return 0;
 return clamp(signedTarget,
  Math.max(-.22,previousCorrectionRad-.08),
  Math.min(.22,previousCorrectionRad+.08));
}

/**
 * Hold ONLY a real recent original-world root-travel witness across adjacent
 * same-owner Walking_A display frames. Software WebGL can produce multiple
 * source-keyframed poses after one authoritative movement snapshot while the
 * actual presented root remains fixed. Requiring nonzero displacement on
 * each of those frames silently disables swing-toe correction.
 *
 * The last actual displacement is NOT replayed or added: it is a short-lived
 * provenance receipt only for a bounded real-sole/ankle probe. Leave idle,
 * guard, strike, hurt, teleport, reduced-motion, hidden or interrupted actors
 * unchanged. No source clip, footstep, hit, target or authority is invented.
 */
const EMPTY_NATIVE_SWING_TRAVEL=Object.freeze({travel:0,age:0});
export function advanceOriginalSourceSwingTravelWitness({
 previousTravel=0,previousAge=0,travel=0,frameInterval=0,
 mode='idle',walkingClip=false,alive=false,visible=false,
 teleport=false,reducedMotion=false,interrupted=false
}={}){
 if(mode!=='move'||walkingClip!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  ![previousTravel,previousAge,travel,frameInterval].every(finite)||
  previousTravel<0||previousTravel>.24||previousAge<0||previousAge>.5||
  travel<0||travel>.24||frameInterval<=0||frameInterval>.25)
  return EMPTY_NATIVE_SWING_TRAVEL;
 if(travel>=.008)return {travel,age:0};
 const age=previousAge+frameInterval;
 return previousTravel>=.008&&age<=.18?
  {travel:previousTravel,age}:EMPTY_NATIVE_SWING_TRAVEL;
}

/**
 * Source-clip pose may continue across multiple rendered frames within one
 * authoritative tick. A cached 180ms *real* walk receipt may authorize a
 * bounded original-ankle swing probe even when the separate ground-stamp
 * observer reports no new same-frame root step. It never authorizes movement,
 * contact, a foot plant, or an animation owner of its own.
 */
export function hasOriginalSourceSwingTravelWitness({
 mode='idle',sourceClipName='',sourceWeight=NaN,
 ownerLocomotion=false,travel=NaN,age=NaN,
 alive=false,visible=false,teleport=false,
 reducedMotion=false,interrupted=false
}={}){
 return mode==='move'&&/^walking[_\s-]*a$/i.test(sourceClipName)&&
  ownerLocomotion===true&&alive===true&&visible===true&&
  teleport===false&&reducedMotion===false&&interrupted===false&&
  [sourceWeight,travel,age].every(finite)&&
  sourceWeight>=.5&&sourceWeight<=1.001&&
  travel>=.008&&travel<=.24&&age>=0&&age<=.18;
}

/**
 * Verify the ACTUAL post-mixer skinned toe rose after the final clamped
 * original foot rotation, with the original heel still airborne.
 * This is swing-only, never world-space plant IK or simulation contact.
 */
export function confirmOriginalSourceSwingToeLift({
 beforeToeY=NaN,afterToeY=NaN,beforeHeelY=NaN,afterHeelY=NaN,
 floorTopY=NaN,appliedAngleRad=NaN
}={}){
 if(![beforeToeY,afterToeY,beforeHeelY,afterHeelY,
  floorTopY,appliedAngleRad].every(finite)||
  Math.abs(floorTopY+.02)>.005||
  Math.abs(appliedAngleRad)<.0001||Math.abs(appliedAngleRad)>.221||
  beforeHeelY-floorTopY<.075||beforeHeelY-floorTopY>.28||
  afterHeelY-floorTopY<.045||afterHeelY-floorTopY>.34||
  // A final skinned-foot proof must honor the same 10mm original swing gate.
  // The old 25mm final check rejected every safe early-band candidate.
  beforeToeY-floorTopY>=-.01||
  afterToeY-beforeToeY<=.001||afterToeY-beforeToeY>.08||
  afterToeY-floorTopY>.09)return null;
 return afterToeY-beforeToeY;
}


/**
 * Derive a permissible native lower-leg hinge from the EXISTING licensed
 * Walking_A quaternion track. Joint names, original source duration and
 * genuinely rotating, consistently collinear keyframes are all required.
 * This is not an invented IK target, new clip, mesh, or contact event.
 * The source rig's actual skinned heel/toe must independently pass the
 * measured trial, owner, chain, stretch and stone-clearance gates.
 */
/**
 * A measured original-source knee bend can have a fully aligned, authentic
 * Walking_A quaternion hinge but still fail the separate bone-length sanity
 * budget. Report the ACTUAL rejected constraint: a misleading "twisted
 * hinge" diagnosis previously led to unsupported IK redesign proposals.
 * Pure, fail-closed and presentation-only. No physical bounds are relaxed.
 */
export function assessImportedSourceKneeGeometry({
 upperLength=NaN,lowerLength=NaN,bendSine=NaN,hingeAlignment=NaN,
 sourceBindUpperLength=null,sourceBindLowerLength=null
}={}){
 if(![upperLength,lowerLength,bendSine,hingeAlignment].every(finite))
  return {accepted:false,reason:'invalid-original-knee-measurement'};
 // The pinned CC0 source has a true .112316m lowerleg-to-foot bind segment.
 // No unreferenced relaxation of the original .12m world-length guard:
 // only same-skeleton inverse binds and matching uniform scale permit it.
 const hasBind=sourceBindUpperLength!==null||sourceBindLowerLength!==null;
 if(hasBind){
  if(![sourceBindUpperLength,sourceBindLowerLength].every(finite)||
   sourceBindUpperLength<.075||sourceBindUpperLength>.75||
   sourceBindLowerLength<.075||sourceBindLowerLength>.75)
   return {accepted:false,reason:'invalid-original-inverse-bind-segments'};
  const upperScale=upperLength/sourceBindUpperLength;
  const lowerScale=lowerLength/sourceBindLowerLength;
  if(upperLength<.04||upperLength>1.2||lowerLength<.04||lowerLength>1.2||
   upperScale<.35||upperScale>4||lowerScale<.35||lowerScale>4||
   Math.abs(upperScale-lowerScale)>Math.max(upperScale,lowerScale)*.075)
   return {accepted:false,reason:'original-inverse-bind-length-mismatch'};
 }else if(upperLength<.12||upperLength>1.2||
  lowerLength<.12||lowerLength>1.2)
  return {accepted:false,reason:'source-leg-segment-length-out-of-bounds'};
 // At 89 degrees the cross-product is MAXIMALLY conditioned, not
 // degenerate. Real 41-joint Walking_A right knee measured sine .999509.
 // Reject nearly collinear original joints or physically impossible sine,
 // then require the genuine source hinge to align with the measured plane.
 if(bendSine<=.085||bendSine>1.000001)
  return {accepted:false,reason:'degenerate-source-knee-bend-plane'};
 if(hingeAlignment<.72)
  return {accepted:false,reason:'source-hinge-not-in-actual-leg-bend-plane'};
 return {accepted:true,reason:hasBind?
  'verified-source-knee-plane-from-inverse-bind':'verified-source-knee-plane'};
}

/** Compare licensed joint lengths in ONE coordinate frame. The rendered
 * avatar may be fitted non-uniformly in X/Y/Z. Source inverse-bind lengths
 * cannot be compared with that deformed world-space distance: undo ONLY the
 * asset-root world transform first. Joint topology and the original skin stay
 * untouched. Reject non-affine, absent, or nonfinite witnesses. */
export function measureImportedKneeSegmentsInAssetCoordinates({
 upperWorld,kneeWorld,footWorld,inverseAssetWorld
}={}){
 const joints=[upperWorld,kneeWorld,footWorld],m=inverseAssetWorld;
 if(joints.some(p=>!Array.isArray(p)||p.length!==3||!p.every(finite))||
  !m||m.length!==16)return null;
 for(let i=0;i<16;i++)if(!finite(m[i]))return null;
 if(Math.abs(m[3])>1e-8||Math.abs(m[7])>1e-8||
  Math.abs(m[11])>1e-8||Math.abs(m[15]-1)>1e-8)return null;
 const local=p=>[
  m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],
  m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
  m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]
 ];
 const [upper,knee,foot]=joints.map(local);
 if([...upper,...knee,...foot].some(x=>!finite(x)))return null;
 const upperLength=Math.hypot(...upper.map((v,i)=>v-knee[i]));
 const lowerLength=Math.hypot(...knee.map((v,i)=>v-foot[i]));
 if(![upperLength,lowerLength].every(finite)||upperLength<=.00001||
  lowerLength<=.00001)return null;
 return {upperLength,lowerLength};
}

export function inferImportedSourceKneeBendAxis(clip,boneName){
 if(!clip||clip.name!=='Walking_A'||typeof boneName!=='string'||
  !/^[a-zA-Z0-9_.-]{3,64}$/.test(boneName)||
  !Array.isArray(clip.tracks)||clip.tracks.length>1500||
  !finite(clip.duration)||clip.duration<.3||clip.duration>5)return null;
 const expected=boneName.toLowerCase();
 const matches=clip.tracks.filter(track=>
  typeof track?.name==='string'&&
  track.name.toLowerCase().endsWith(expected+'.quaternion')&&
  (track.name.length===expected.length+11||
   /[|/.]/.test(track.name[track.name.length-(expected.length+12)])));
 if(matches.length!==1)return null;
 const track=matches[0],times=track.times,values=track.values;
 if(!times||!values||times.length<4||times.length>320||
  values.length!==times.length*4)return null;
 const steps=[];
 let previous=null;
 for(let i=0;i<times.length;i++){
  const time=times[i],q=[
   values[i*4],values[i*4+1],values[i*4+2],values[i*4+3]];
  if(!finite(time)||(i>0&&time<=times[i-1])||
   q.some(v=>!finite(v))||Math.abs(Math.hypot(...q)-1)>.035)return null;
  if(previous){
   if(q.reduce((sum,v,j)=>sum+v*previous[j],0)<0)
    for(let j=0;j<4;j++)q[j]=-q[j];
   const [x,y,z,w]=previous,[u,v,s,r]=q;
   const dx=w*u-x*r-y*s+z*v;
   const dy=w*v-y*r-z*u+x*s;
   const dz=w*s-z*r-x*v+y*u;
   const dw=w*r+x*u+y*v+z*s;
   const length=Math.hypot(dx,dy,dz);
   const angle=2*Math.atan2(length,Math.abs(dw));
   // The pinned CC0 swordsman Walking_A left lowerleg has a real 1.0504rad
   // quaternion step between licensed keys 11->12 at 24fps. A generic
   // .85rad reject gate falsely dropped its otherwise coherent X hinge.
   // Permit that documented source interval with narrow headroom; retain
   // finite/quaternion, multi-key axis-dominance and large-spike rejection.
   if(!finite(angle)||angle>1.15)return null;
   if(angle>=.025&&length>.000001)
    steps.push({angle,axis:[dx/length,dy/length,dz/length]});
  }
  previous=q;
 }
 if(steps.length<2)return null;
 const peak=steps.reduce((a,b)=>b.angle>a.angle?b:a);
 if(peak.angle<.06)return null;
 const strong=steps.filter(sample=>sample.angle>=.42*peak.angle);
 if(strong.length<2)return null;
 const alignment=Math.min(...strong.map(sample=>Math.abs(
  sample.axis.reduce((sum,v,i)=>sum+v*peak.axis[i],0))));
 if(alignment<.92)return null;
 return Object.freeze({
  source:'verified-original-Walking_A-knee-quaternion-axis',
  axis:Object.freeze(peak.axis),trackName:track.name,
  sampleCount:strong.length,dominance:alignment,
  peakStepRadians:peak.angle
 });
}

/** Original connected-calf SWING clearance, not stance IK or game contact.
 * Begin only if still 20mm beneath stone after an actual ankle lift,
 * retaining positive skinned-sole trials and 0.06rad/frame knee slew.
 * Requires an actual positive skinned-toe response after licensed ankle aid.\n * Original mobile source probe #43106822043 measured a safe 5.696mm knee\n * lift at 0.2rad. Keep 4mm minimum for source candidate evaluation; the\n * rate-limited live joint must independently pass its own skinned-foot proof. */
export function planOriginalSourceSwingCalfAssist({
 mode='idle',sourceClipName='',sourceAnatomyVerified=false,
 sourceLegChainVerified=false,sourceWeight=NaN,ownerLocomotion=false,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 interrupted=false,rootTravel=NaN,frameAge=NaN,floorTopY=NaN,
 afterAnkleToeY=NaN,afterAnkleHeelY=NaN,ankleLiftMeters=NaN,
 trialCalfToeY=NaN,trialCalfHeelY=NaN,trialAngleRad=NaN,
 previousAssistRad=NaN
}={}){
 if(mode!=='move'||!/^walking[_\s-]*a$/i.test(sourceClipName)||
  sourceAnatomyVerified!==true||sourceLegChainVerified!==true||
  ownerLocomotion!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  ![sourceWeight,rootTravel,frameAge,floorTopY,afterAnkleToeY,
   afterAnkleHeelY,ankleLiftMeters,trialCalfToeY,trialCalfHeelY,
   trialAngleRad,previousAssistRad].every(finite)||
  sourceWeight<.5||sourceWeight>1.001||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.18||
  Math.abs(floorTopY+.02)>.005||
  ankleLiftMeters<.001||ankleLiftMeters>.08||
  Math.abs(trialAngleRad)<.09||Math.abs(trialAngleRad)>.21||
  Math.abs(previousAssistRad)>.18)return 0;
 const toeClear=afterAnkleToeY-floorTopY;
 const heelClear=afterAnkleHeelY-floorTopY;
 const trialLift=trialCalfToeY-afterAnkleToeY;
 const trialHeelClear=trialCalfHeelY-floorTopY;
 if(toeClear>-.02||toeClear<-.16||heelClear<.065||heelClear>.34||
  trialLift<.004||trialLift>.075||trialHeelClear<.055||
  trialHeelClear>.36||Math.abs(trialCalfHeelY-afterAnkleHeelY)>.06)return 0;
 const share=clamp((sourceWeight-.5)/.4,0,1);
 const eased=share*share*(3-2*share);
 // At the exact walking crossfade threshold the signed trial angle can
 // produce -0. This is a no-op: return canonical zero so a dormant calf
 // controller cannot expose a directional correction or fail its contract.
 if(eased===0||(previousAssistRad!==0&&
  Math.sign(previousAssistRad)!==Math.sign(trialAngleRad)))return 0;
 // A licensed 0.2rad knee probe is evidence only, never an instant knee
 // snap. Preserve the existing 0.06rad/frame slew and require up to three
 // consecutive same-owner source frames to reach the new 0.18rad ceiling.
 // The Three.js adapter must still remeasure the SAME skinned heel and toe
 // after the actual clamped rotation before this cosmetic pose can apply.
 const demand=Math.min(.04,-.01-toeClear);
 const target=Math.sign(trialAngleRad)*eased*
  Math.min(.18,Math.abs(trialAngleRad)*demand/trialLift);
 return clamp(target,Math.max(-.18,previousAssistRad-.06),
  Math.min(.18,previousAssistRad+.06));
}

/**
 * Choose from both genuine signed original-calf X-axis trials ONLY after
 * sampling the SAME skinned toe/heel vertices. The older 'highest toe wins'
 * path could select a larger toe lift with a COLLAPSED heel, let the later
 * safety planner reject it, and discard the other physically viable trial.
 *
 * This is a candidate selector, not an IK solver or foot-plant certificate.
 * No source skeleton/keyframe, authoritative position or attack is changed.
 */
/** A missed original measured knee frame retires its old signed correction.
 * Same-side accepted frame preserves the existing 0.18rad cap. No joint edits. */
export function retireOriginalSourceCalfMemory(priorAngleRad,side,currentFrameMask){
 if(!Number.isFinite(priorAngleRad)||Math.abs(priorAngleRad)>.180001||
  !['left','right'].includes(side)||!Number.isInteger(currentFrameMask)||
  currentFrameMask<0||currentFrameMask>3)return 0;
 return currentFrameMask&(side==='left'?1:2)?priorAngleRad:0;
}

export function selectOriginalSourceSwingCalfTrial({
 afterAnkleToeY=NaN,afterAnkleHeelY=NaN,floorTopY=NaN,trials=[],previousAssistRad=0
}={}){
 if(![afterAnkleToeY,afterAnkleHeelY,floorTopY,previousAssistRad].every(finite)||
  Math.abs(previousAssistRad)>.18||
  Math.abs(floorTopY+.02)>.005||!Array.isArray(trials)||trials.length>4||
  afterAnkleToeY-floorTopY>-.02||afterAnkleToeY-floorTopY<-.16||
  afterAnkleHeelY-floorTopY<.065||afterAnkleHeelY-floorTopY>.34)return null;
 let best=null;
 for(const trial of trials){
  const {signed,toe,heel}=trial??{};
  // Retain a compatible authentic calf hinge when both physical trial
  // directions lift the same skinned toe. The existing 0.06rad/frame
  // limiter cannot apply an opposite-signed winner without a reset.
  if(previousAssistRad!==0&&Math.sign(signed)!==Math.sign(previousAssistRad))continue;
  if(![signed,toe,heel].every(finite)||
   Math.abs(signed)<.09||Math.abs(signed)>.21||
   toe-afterAnkleToeY<.004||toe-afterAnkleToeY>.075||
   heel-floorTopY<.055||heel-floorTopY>.36||
   Math.abs(heel-afterAnkleHeelY)>.06)continue;
  if(!best||toe>best.toe)best={signed,toe,heel};
 }
 return best;
}

/**
 * Licensed source-ankle relief for a genuinely loaded, near-ground shoe.
 * Correct BOTH measured original weighted outsole endpoints; never lift one
 * end by burying the other. This is a bounded single-frame cosmetic joint
 * correction, not a foot lock, raycast, fabricated step or IK target.
 * The final applied angle is separately remeasured against real skin.
 */
/**
 * Select from at most TWO already evaluated original-rig ankle poses using
 * the REAL final weighted heel AND toe. The first accepted source-weighted
 * correction may remain visibly buried even when a separately witnessed
 * 45mrad original bone pose is demonstrably closer to stone.
 *
 * The adapter owns pose restoration, legal owner and joint slew; this
 * stateless verifier refuses all unmeasured, unsafe or unbounded candidates.
 * A true moving planted foot additionally requires multiple world-foot
 * observations; this is NEVER evidence of stationary contact by itself.
 */
export function chooseOriginalSourceStanceAppliedWitness({
 floorTopY=NaN,beforeHeelY=NaN,beforeToeY=NaN,
 previousCorrectionRad=0,candidates=[],
 spatialWitnessRequired=false,beforeHeelXZ=null,beforeToeXZ=null
}={}){
 if(![floorTopY,beforeHeelY,beforeToeY,previousCorrectionRad].every(finite)||
  Math.abs(previousCorrectionRad)>.14||
  Math.abs(floorTopY+.02)>.005||
  !Array.isArray(candidates)||candidates.length<1||
  candidates.length>2)return null;
 // Source-ankle XZ displacement is evaluated in the same world frame and
 // original skinned vertex as the two-point height proof. It is a bounded
 // anti-skating constraint, NOT an invented ground anchor or inverse-IK step.
 const xy=v=>Array.isArray(v)&&v.length===2&&v.every(finite);
 if(spatialWitnessRequired&&(!xy(beforeHeelXZ)||!xy(beforeToeXZ)))return null;
 const beforeWorst=Math.max(Math.abs(beforeHeelY-floorTopY),
  Math.abs(beforeToeY-floorTopY));
 if(!finite(beforeWorst)||beforeWorst>.055)return null;
 let best=null;
 for(let index=0;index<candidates.length;index++){
  const {delta,heelY,toeY,heelXZ,toeXZ}=candidates[index]??{};
  if(![delta,heelY,toeY].every(finite)||
   Math.abs(delta)<.001||Math.abs(delta)>.14000001||
   Math.abs(delta-previousCorrectionRad)>.04500001||
   (previousCorrectionRad!==0&&Math.sign(delta)!==Math.sign(previousCorrectionRad))||
   heelY<floorTopY-.035||heelY>floorTopY+.035||
   toeY<floorTopY-.035||toeY>floorTopY+.035||
   heelY<beforeHeelY-.004||toeY<beforeToeY-.004)
   continue;
  const heelShiftXZMeters=spatialWitnessRequired&&xy(heelXZ)?
   Math.hypot(heelXZ[0]-beforeHeelXZ[0],heelXZ[1]-beforeHeelXZ[1]):NaN;
  const toeShiftXZMeters=spatialWitnessRequired&&xy(toeXZ)?
   Math.hypot(toeXZ[0]-beforeToeXZ[0],toeXZ[1]-beforeToeXZ[1]):NaN;
  // A source weight-bearing sole must not gain a few mm vertically by
  // skating >18mm across stone during an otherwise unchanged root frame.
  if(spatialWitnessRequired&&(!finite(heelShiftXZMeters)||
   !finite(toeShiftXZMeters)||heelShiftXZMeters>.01800001||
   toeShiftXZMeters>.01800001))continue;
  const afterWorst=Math.max(Math.abs(heelY-floorTopY),
   Math.abs(toeY-floorTopY));
  if(beforeWorst-afterWorst<.0015)continue;
  // A new physical pose must buy >=1mm ADDITIONAL original-shoe
  // improvement to justify a larger angle / visible pose change.
  if(!best||best.afterWorst-afterWorst>.001)
   best=Object.freeze({delta,afterHeel:heelY,afterToe:toeY,
    afterWorst,candidateIndex:index,
    heelShiftXZMeters:spatialWitnessRequired?heelShiftXZMeters:null,
    toeShiftXZMeters:spatialWitnessRequired?toeShiftXZMeters:null});
 }
 return best;
}

/**
 * One authentic original Walking_A loaded shoe can bury BOTH weighted
 * outsole ends when its ankle pitch only trades toe penetration for heel
 * penetration. A source-derived LOWERLEG hinge may be tried, but only after
 * the exact licensed joint, inverse binds, source knee axis and world bend
 * plane have been independently verified by the Three.js adapter.
 *
 * This chooses between at most two genuinely sampled, reversible ±45mrad
 * original bone poses. The opposite original foot is read simultaneously.
 * No target/IK step, artificial contact or authoritative translation exists.
 */
/** Original loaded-vs-airborne source leg chain: a nonlocking thigh trial.
 * Unlike blind ankle pitch, any original upper-leg bend affects the WHOLE
 * weighted foot and must be checked against the opposing planted shoe.
 * The adapter probes +/-45mrad on the verified source Walking_A upper-leg
 * quaternion track and returns to the identical original pose on rejection.
 * This is a single-frame safety gate, never IK, contact, or a fake step.
 */
/**
 * The other original shoe may have JUST been corrected by a valid stance
 * ankle stage in this SAME Mixer frame. Do not prohibit safe independent
 * swing-thigh trials simply because that shoe was physically corrected.
 *
 * A current, matching original-GLB source receipt AND a new live skinned
 * readback must agree before the opposite stance can be treated as stable.
 * The swing trial still has to preserve BOTH real heels/toes and XZ positions.
 * No new foot target, contact lock, authority or synthetic gait is introduced.
 */
export function verifyOriginalSourceOppositeStanceForSwingThigh({
 proof=null,measured=null,oppositeSide='',sourceInstanceId='',
 sourceClipName='',floorTopY=NaN
}={}){
 const vec2=v=>Array.isArray(v)&&v.length===2&&v.every(finite);
 if(!proof||!measured||!['left','right'].includes(oppositeSide)||
  typeof sourceInstanceId!=='string'||!sourceInstanceId||
  sourceClipName!=='Walking_A'||!finite(floorTopY)||
  Math.abs(floorTopY+.02)>.005||
  proof.source!=='same-original-GLB-two-point-stanced-shoe'||
  proof.side!==oppositeSide||proof.sourceInstanceId!==sourceInstanceId||
  proof.sourceClip!==sourceClipName||
  ![proof.beforeHeelY,proof.beforeToeY,proof.afterHeelY,
   proof.afterToeY,proof.beforeWorstMeters,proof.afterWorstMeters,
   proof.floorTopY,proof.appliedAngleRad,
   measured.heelY,measured.toeY].every(finite)||
  !vec2(measured.heelXZ)||!vec2(measured.toeXZ)||
  Math.abs(proof.floorTopY-floorTopY)>.0001||
  Math.abs(proof.appliedAngleRad)>.12000001||
  proof.beforeWorstMeters-proof.afterWorstMeters<.0015||
  Math.abs(proof.afterHeelY-measured.heelY)>.0015||
  Math.abs(proof.afterToeY-measured.toeY)>.0015||
  Math.abs(proof.afterWorstMeters-Math.max(
   Math.abs(proof.afterHeelY-floorTopY),
   Math.abs(proof.afterToeY-floorTopY)))>.0015||
  ![measured.heelY,measured.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 return Object.freeze({sameFrameLoadedStance:true,oppositeSide,
  sourceInstanceId,sourceClipName,contactLocked:false});
}

export function chooseOriginalSourceSwingThighSupport({
 mode='idle',sourceClipName='',sourceWeight=NaN,ownerLocomotion=false,
 sourceThighAxisVerified=false,sourceChainVerified=false,
 sourceInstanceSame=false,alive=false,visible=false,teleport=false,
 reducedMotion=false,interrupted=false,rootTravel=NaN,frameAge=NaN,
 side='',floorTopY=NaN,previousCorrectionRad=0,before=null,trials=[]
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||ownerLocomotion!==true||
  sourceThighAxisVerified!==true||sourceChainVerified!==true||
  sourceInstanceSame!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||!['left','right'].includes(side)||
  ![sourceWeight,rootTravel,frameAge,floorTopY,previousCorrectionRad].every(finite)||
  sourceWeight<.65||sourceWeight>1.001||rootTravel<.008||
  rootTravel>.24||frameAge<0||frameAge>.18||
  Math.abs(floorTopY+.02)>.005||
  Math.abs(previousCorrectionRad)>.13500001||
  !before||!Array.isArray(trials)||trials.length<1||trials.length>5)return null;
 const opposite=side==='left'?'right':'left';
 const goodPoint=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
 const goodFoot=f=>f&&[f.heelY,f.toeY].every(finite)&&
  goodPoint(f.heelXZ)&&goodPoint(f.toeXZ);
 const source=before[side],loaded=before[opposite];
 if(!goodFoot(source)||!goodFoot(loaded))return null;
 // One shoe must be truly swinging while the other is near the exact stone.
 if(source.heelY<floorTopY+.075||source.heelY>floorTopY+.36||
  source.toeY>=floorTopY-.008||source.toeY<floorTopY-.16||
  source.heelY-source.toeY<.08||
  ![loaded.heelY,loaded.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 let best=null;
 for(const trial of trials){
  const delta=trial?.delta,after=trial?.after;
  const severeBurial=source.toeY<floorTopY-.025;
  const isNormalTrial=Math.abs(Math.abs(delta)-.045)<=.00001;
  const isSevereTrial=severeBurial&&Math.abs(Math.abs(delta)-.09)<=.00001;
  // Only a PREVIOUSLY ACCEPTED, same-signed 90mrad original source thigh
  // may probe 135mrad one frame later, with max 45mrad extra travel.
  const isContinuedTrial=severeBurial&&
   Math.abs(Math.abs(delta)-.135)<=.00001&&
   Math.abs(previousCorrectionRad)>=.089&&
   Math.abs(previousCorrectionRad)<=.13500001&&
   Math.sign(delta)===Math.sign(previousCorrectionRad)&&
   Math.abs(delta-previousCorrectionRad)<=.04500001;
  // A physically witnessed source leg cannot jump from 0 to 90 mrad in
  // one displayed frame merely because the weighted toe is deeply buried.
  // Build through separately remeasured 45 mrad stages (0→45→90→135),
  // rather than correcting a geometric collision with an abrupt hip snap.
  const allowableStep=.04500001;
  if(!finite(delta)||(!isNormalTrial&&!isSevereTrial&&!isContinuedTrial)||
   Math.abs(delta-previousCorrectionRad)>allowableStep||
   (previousCorrectionRad!==0&&Math.sign(delta)!==Math.sign(previousCorrectionRad))||
   !goodFoot(after?.[side])||!goodFoot(after?.[opposite]))continue;
  const moved=after[side],other=after[opposite];
  const shift=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  if(shift(moved.heelXZ,source.heelXZ)>.025||
   shift(moved.toeXZ,source.toeXZ)>.025||
   moved.heelY<source.heelY-.04||moved.heelY>source.heelY+.04||
   moved.toeY>floorTopY+.035||moved.toeY<floorTopY-.16||
   loaded.heelY-other.heelY>.003||other.heelY-loaded.heelY>.003||
   loaded.toeY-other.toeY>.003||other.toeY-loaded.toeY>.003||
   shift(other.heelXZ,loaded.heelXZ)>.003||
   shift(other.toeXZ,loaded.toeXZ)>.003)continue;
  const improvement=moved.toeY-source.toeY;
  if(improvement<.004||improvement>.06)continue;
  if(!best||improvement>best.improvementMeters)
   best=Object.freeze({angleRad:delta,side,improvementMeters:improvement,
    beforeToeY:source.toeY,afterToeY:moved.toeY,
    beforeHeelY:source.heelY,afterHeelY:moved.heelY,
    oppositeFootVerified:true,contactLocked:false});
 }
 return best;
}

/**
 * An original 41-joint Walking_A ankle/calf rescue can leave its authentic
 * weighted toe buried. A later independently sampled original upperleg
 * trial is allowed to improve that SAME source shoe, but its result must
 * replace—not silently invalidate—the earlier frame's final-sole receipt.
 *
 * This is source-skin evidence reconciliation, NOT IK, a foot lock, a source
 * clip edit, a new target or a fabricated authority step. Every input comes
 * from the actual post-mixer GLB clone. Fail closed if the intervening pose
 * was not identical or if the second adjustment changes the shoe unsafely.
 */

/**
 * The authentic Walking_A upperleg can be proven at 90/135mrad, then stop
 * lifting the original toe by the 4mm necessary for NEW clearance. Do not
 * instantly drop the imported hip to zero. Sample one 45mrad return toward
 * source pose and independently check the ORIGINAL weighted heels and toes
 * on BOTH feet. This is continuity, never IK, a contact lock or new travel.
 */
/**
 * Preserve a previously VERIFIED original Walking_A upperleg correction while
 * its source-skinned swing toe is still severely below the stone. Source phase
 * can reduce this frame's incremental clearance below the new-rescue 4mm gate,
 * but immediately resetting 45/90/135mrad to zero visibly pops the native hip.
 *
 * Not IK or a new plant: this reuses only the same joint angle witnessed on
 * the same original clip and clone, and checks real heel/toe XYZ for BOTH shoes.
 * Never continue through restored contact, clip exit, teleport or injury.
 */
export function planOriginalSourceSwingThighHold({
 mode='idle',sourceClipName='',sourceWeight=NaN,ownerLocomotion=false,
 sourceThighAxisVerified=false,sourceChainVerified=false,
 sourceInstanceSame=false,priorSourceProofVerified=false,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 interrupted=false,rootTravel=NaN,frameAge=NaN,side='',
 floorTopY=NaN,previousCorrectionRad=0,before=null,trials=[]
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||ownerLocomotion!==true||
  sourceThighAxisVerified!==true||sourceChainVerified!==true||
  sourceInstanceSame!==true||priorSourceProofVerified!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  !['left','right'].includes(side)||
  ![sourceWeight,rootTravel,frameAge,floorTopY,previousCorrectionRad].every(finite)||
  sourceWeight<.65||sourceWeight>1.001||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.18||
  Math.abs(floorTopY+.02)>.005||
  ![.045,.09,.135].some(v=>Math.abs(Math.abs(previousCorrectionRad)-v)<.0001)||
  !before||!Array.isArray(trials)||!trials.length||trials.length>5)return null;
 const foot=f=>f&&[f.heelY,f.toeY].every(finite)&&
  [f.heelXZ,f.toeXZ].every(v=>Array.isArray(v)&&v.length===2&&v.every(finite));
 const swing=before[side],loaded=before[side==='left'?'right':'left'];
 if(!foot(swing)||!foot(loaded)||
  swing.heelY<floorTopY+.04||swing.heelY>floorTopY+.36||
  swing.toeY>=floorTopY-.035||swing.toeY<floorTopY-.16||
  ![loaded.heelY,loaded.toeY].every(y=>y>=floorTopY-.055&&y<=floorTopY+.035))
  return null;
 const xz=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 for(const trial of trials){
  const after=trial?.after,delta=trial?.delta;
  if(!finite(delta)||Math.abs(delta-previousCorrectionRad)>.0001||
   !foot(after?.[side])||!foot(after?.[side==='left'?'right':'left']))continue;
  const moved=after[side],other=after[side==='left'?'right':'left'];
  const lift=moved.toeY-swing.toeY;
  if(lift<.001||lift>.04||
   moved.toeY<floorTopY-.16||moved.toeY>floorTopY+.035||
   Math.abs(moved.heelY-swing.heelY)>.04||
   xz(moved.heelXZ,swing.heelXZ)>.025||
   xz(moved.toeXZ,swing.toeXZ)>.025||
   Math.abs(other.heelY-loaded.heelY)>.003||
   Math.abs(other.toeY-loaded.toeY)>.003||
   xz(other.heelXZ,loaded.heelXZ)>.003||
   xz(other.toeXZ,loaded.toeXZ)>.003)continue;
  return Object.freeze({angleRad:delta,side,continuityHold:true,
   priorSupportedAngleRad:previousCorrectionRad,
   oppositeFootVerified:true,contactLocked:false,
   beforeToeY:swing.toeY,afterToeY:moved.toeY,
   beforeHeelY:swing.heelY,afterHeelY:moved.heelY,
   improvementMeters:lift,
   penetrationAfterMeters:Math.max(0,floorTopY-moved.toeY)});
 }
 return null;
}

export function planOriginalSourceSwingThighEaseOut({
 mode='idle',sourceClipName='',sourceWeight=NaN,ownerLocomotion=false,
 sourceThighAxisVerified=false,sourceChainVerified=false,
 sourceInstanceSame=false,priorSourceProofVerified=false,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 interrupted=false,rootTravel=NaN,frameAge=NaN,side='',
 floorTopY=NaN,previousCorrectionRad=0,before=null,trials=[]
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||ownerLocomotion!==true||
  sourceThighAxisVerified!==true||sourceChainVerified!==true||
  sourceInstanceSame!==true||priorSourceProofVerified!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  !['left','right'].includes(side)||
  ![sourceWeight,rootTravel,frameAge,floorTopY,previousCorrectionRad].every(finite)||
  sourceWeight<.65||sourceWeight>1.001||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.18||
  Math.abs(floorTopY+.02)>.005||
  ![.045,.09,.135].some(v=>Math.abs(Math.abs(previousCorrectionRad)-v)<.0001)||
  !before||!Array.isArray(trials)||!trials.length||trials.length>5)return null;
 const opposite=side==='left'?'right':'left';
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
 const foot=f=>f&&[f.heelY,f.toeY].every(finite)&&
  point(f.heelXZ)&&point(f.toeXZ);
 const swing=before[side],loaded=before[opposite];
 if(!foot(swing)||!foot(loaded)||swing.heelY<floorTopY+.04||
  swing.heelY>floorTopY+.36||
  swing.toeY<floorTopY-.16||swing.toeY>floorTopY+.035||
  ![loaded.heelY,loaded.toeY].every(y=>y>=floorTopY-.055&&y<=floorTopY+.035))
  return null;
 const target=Math.sign(previousCorrectionRad)*
  Math.max(0,Math.round(Math.abs(previousCorrectionRad)*1000)/1000-.045);
 const xz=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 for(const trial of trials){
  const delta=trial?.delta,after=trial?.after;
  if(!finite(delta)||Math.abs(delta-target)>.0001||
   Math.abs(delta-previousCorrectionRad)>.04500001||
   !foot(after?.[side])||!foot(after?.[opposite]))continue;
  const moved=after[side],other=after[opposite];
  if(delta===0&&(
   Math.abs(moved.heelY-swing.heelY)>.001||
   Math.abs(moved.toeY-swing.toeY)>.001||
   xz(moved.heelXZ,swing.heelXZ)>.001||
   xz(moved.toeXZ,swing.toeXZ)>.001))continue;
  if(moved.toeY<swing.toeY-.0015||
   moved.toeY<floorTopY-.16||moved.toeY>floorTopY+.035||
   Math.abs(moved.heelY-swing.heelY)>.04||
   xz(moved.heelXZ,swing.heelXZ)>.025||
   xz(moved.toeXZ,swing.toeXZ)>.025||
   Math.abs(other.heelY-loaded.heelY)>.003||
   Math.abs(other.toeY-loaded.toeY)>.003||
   xz(other.heelXZ,loaded.heelXZ)>.003||
   xz(other.toeXZ,loaded.toeXZ)>.003)continue;
  return Object.freeze({angleRad:delta,side,continuityRelease:true,
   priorSupportedAngleRad:previousCorrectionRad,
   oppositeFootVerified:true,contactLocked:false,
   beforeToeY:swing.toeY,afterToeY:moved.toeY,
   beforeHeelY:swing.heelY,afterHeelY:moved.heelY,
   improvementMeters:Math.max(0,moved.toeY-swing.toeY),
   penetrationAfterMeters:Math.max(0,floorTopY-moved.toeY)});
 }
 return null;
}

export function reconcileOriginalSourceSwingToeProofWithThigh({
 proof=null,side='',sourceInstanceId='',sourceClipName='',
 floorTopY=NaN,before=null,after=null,thighImprovementMeters=NaN,
 continuityKind='rescue'
}={}){
 // A measured continuation OR a 45mrad bounded return of the preceding
 // ORIGINAL upperleg is not a new 4mm clearance rescue. It still needs a fresh, two-shoe physical
 // trial, an exact same-frame licensed ankle/calf proof, and >=1mm lift.
 // Never relax ordinary rescues or accept unsupported release/foot-locks.
 const hold=continuityKind==='hold';
 const release=continuityKind==='release';
 if(!hold&&!release&&continuityKind!=='rescue')return null;
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
 const foot=f=>f&&[f.heelY,f.toeY].every(finite)&&
  point(f.heelXZ)&&point(f.toeXZ);
 if(!proof||!['left','right'].includes(side)||
  proof.source!=='same-original-GLB-foot-skinned-vertices'||
  proof.side!==side||proof.sourceClip!=='Walking_A'||
  sourceClipName!=='Walking_A'||typeof sourceInstanceId!=='string'||
  !sourceInstanceId||proof.sourceInstanceId!==sourceInstanceId||
  !foot(before)||!foot(after)||![floorTopY,thighImprovementMeters,
   proof.floorTopY,proof.beforeToeY,proof.afterToeY,
   proof.beforeHeelY,proof.afterHeelY,proof.liftMeters].every(finite)||
  Math.abs(floorTopY+.02)>.005||
  Math.abs(proof.floorTopY-floorTopY)>.0001||
  (release?(thighImprovementMeters<-.0015||thighImprovementMeters>.04):
   hold?(thighImprovementMeters<.001||thighImprovementMeters>.04):
   (thighImprovementMeters<.004||thighImprovementMeters>.06))||
  Math.abs(before.toeY-proof.afterToeY)>.0015||
  Math.abs(before.heelY-proof.afterHeelY)>.0015||
  Math.abs((proof.afterToeY-proof.beforeToeY)-proof.liftMeters)>.0015)
  return null;
 const toeLift=after.toeY-before.toeY;
 const xz=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 if(Math.abs(toeLift-thighImprovementMeters)>.001||
  after.toeY>floorTopY+.035||after.toeY<floorTopY-.16||
  after.heelY<before.heelY-.04||after.heelY>before.heelY+.04||
  xz(after.heelXZ,before.heelXZ)>.025||
  xz(after.toeXZ,before.toeXZ)>.025)return null;
 const totalLift=after.toeY-proof.beforeToeY;
 if(totalLift<.004||totalLift>.12)return null;
 return Object.freeze({...proof,
  afterToeY:after.toeY,afterHeelY:after.heelY,
  liftMeters:totalLift,
  penetrationAfterMeters:Math.max(0,floorTopY-after.toeY),
  combinedSourceThighMeters:toeLift,
  combinedSourceThighKind:continuityKind,
  combinedSourceThighVerified:true,
  contactLocked:false});
}

export function chooseOriginalSourceLoadedKneeWitness({
 mode='idle',sourceClipName='',sourceWeight=NaN,ownerLocomotion=false,
 sourceHingeVerified=false,sourceInstanceSame=false,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 interrupted=false,rootTravel=NaN,frameAge=NaN,
 floorTopY=NaN,side='',previousCorrectionRad=0,before=null,trials=[]
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||ownerLocomotion!==true||
  sourceHingeVerified!==true||sourceInstanceSame!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  ![sourceWeight,rootTravel,frameAge,floorTopY,previousCorrectionRad].every(finite)||
  sourceWeight<.65||sourceWeight>1.001||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.18||
  Math.abs(floorTopY+.02)>.005||Math.abs(previousCorrectionRad)>.04501||
  !['left','right'].includes(side)||!Array.isArray(trials)||
  trials.length<1||trials.length>2||!before)return null;
 const first=before[side],other=before[side==='left'?'right':'left'];
 if(!first||!other||![first.heelY,first.toeY,other.heelY,other.toeY].every(finite))return null;
 const heel=first.heelY-floorTopY,toe=first.toeY-floorTopY;
 // An airborne or already well-grounded shoe must retain the source pose.
 if(heel<-.045||heel>.035||toe<-.045||toe>.035||
  Math.abs(heel-toe)>.055||Math.min(heel,toe)>-.008)return null;
 const beforeWorst=Math.max(Math.abs(heel),Math.abs(toe));
 let best=null;
 for(const trial of trials){
  const signed=trial?.signed,after=trial?.after,loaded=after?.[side],
   opposite=after?.[side==='left'?'right':'left'];
  if(!finite(signed)||Math.abs(Math.abs(signed)-.045)>.00001||
   (previousCorrectionRad!==0&&Math.sign(signed)!==Math.sign(previousCorrectionRad))||
   !loaded||!opposite||
   ![loaded.heelY,loaded.toeY,opposite.heelY,opposite.toeY].every(finite))continue;
  // The other shoe cannot silently teleport when only one source knee turns.
  if(Math.abs(opposite.heelY-other.heelY)>.0025||
   Math.abs(opposite.toeY-other.toeY)>.0025)continue;
  const verified=verifyRestoredRootOriginalSourceSoleSafety({
   source:'same-original-GLB-restored-root',floorTopY,before,after
  });
  if(!verified||loaded.heelY<floorTopY-.055||
   loaded.toeY<floorTopY-.055||
   loaded.heelY>floorTopY+.035||loaded.toeY>floorTopY+.035)continue;
  const afterWorst=Math.max(Math.abs(loaded.heelY-floorTopY),
   Math.abs(loaded.toeY-floorTopY));
  const improvement=beforeWorst-afterWorst;
  if(improvement<.0015||
   loaded.heelY<first.heelY-.004||loaded.toeY<first.toeY-.004)continue;
  if(!best||afterWorst<best.afterWorst)
   best=Object.freeze({delta:signed,side,
    beforeHeelY:first.heelY,beforeToeY:first.toeY,
    afterHeelY:loaded.heelY,afterToeY:loaded.toeY,
    beforeWorst,afterWorst,improvementMeters:improvement,
    feetVerified:verified.feetVerified,contactLocked:false});
 }
 return best;
}

export function planOriginalSourceStanceAnkleRelief({
 mode='idle',sourceClipName='',sourceWeight=NaN,ownerLocomotion=false,
 rootTravel=NaN,frameAge=NaN,alive=false,visible=false,teleport=false,
 reducedMotion=false,interrupted=false,floorTopY=NaN,heelY=NaN,toeY=NaN,
 trials=[],previousCorrectionRad=0
}={}){
 if(mode!=='move'||!/^walking[_\s-]*a$/i.test(sourceClipName)||
  ownerLocomotion!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  ![sourceWeight,rootTravel,frameAge,floorTopY,heelY,toeY,previousCorrectionRad].every(finite)||
  sourceWeight<.55||sourceWeight>1.001||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.18||
  Math.abs(floorTopY+.02)>.005||Math.abs(previousCorrectionRad)>.14||
  !Array.isArray(trials)||trials.length>4)return null;
 const beforeHeel=heelY-floorTopY,beforeToe=toeY-floorTopY;
 // Real loaded original heel and toe sit near the stone together. An
 // airborne heel belongs to the independent licensed swing-foot planner.
 if(beforeHeel<-.045||beforeHeel>.035||beforeToe<-.045||beforeToe>.035||
  Math.abs(beforeHeel-beforeToe)>.055||
  Math.min(beforeHeel,beforeToe)>-.008)return null;
 const beforeWorst=Math.max(Math.abs(beforeHeel),Math.abs(beforeToe));
 let best=null;
 let fineCandidates=[];
 for(const candidate of trials){
  const {signed,toe,heel}=candidate??{};
  if(![signed,toe,heel].every(finite)||
   !((Math.abs(signed)>=.044&&Math.abs(signed)<=.046)||
    (Math.abs(signed)>=.11&&Math.abs(signed)<=.121))||
   (previousCorrectionRad!==0&&Math.sign(signed)!==Math.sign(previousCorrectionRad)))
   continue;
  const h=heel-floorTopY,t=toe-floorTopY;
  // Do not solve a buried toe by creating a buried heel or a visibly
  // floating edge. Both anatomical outsole endpoints must remain bounded.
  if(h<-.035||h>.035||t<-.035||t>.035||
   Math.abs(h-t)>.055||
   h<beforeHeel-.004||t<beforeToe-.004)continue;
  const worst=Math.max(Math.abs(h),Math.abs(t));
  // Native source-rig trials include the REAL 45mrad per-frame limit.
  // A fine-scale 1.5mm improvement is actionable even when a coarse
  // 120mrad trial buries the other original outsole edge; actual applied
  // quaternions must independently pass final skinned heel/toe safety.
  const fine=Math.abs(signed)<=.046;
  if(beforeWorst-worst<(fine?.0015:.003))continue;
  if(fine)fineCandidates.push({signed,toe,heel,worst});
  if(!best||worst<best.worst)best={signed,toe,heel,worst};
 }
 if(!best)return null;
 const share=clamp((sourceWeight-.55)/.35,0,1);
 const ease=share*share*(3-2*share);
 const desired=best.signed*ease*clamp((beforeWorst-best.worst)/.018,.45,1);
 const delta=clamp(desired,
  Math.max(-.14,previousCorrectionRad-.045),
  Math.min(.14,previousCorrectionRad+.045));
 if(Math.abs(delta)<.001||Math.sign(delta)!==Math.sign(best.signed))return null;
 // A coarse 120mrad ORIGINAL-joint skin trial may legitimately establish
 // direction but the source-weighted 45mrad frame then lifts the REAL shoe
 // too little to pass final clearance. Allow at most ONE second attempt
 // using an ALREADY witnessed, safe, same-direction native 45mrad source
 // trial. Its applied skin must independently pass the same two-point
 // final gate. No new target, guessed IK or relaxation of the 45mrad slew.
 let fineFallbackDelta=null;
 if(sourceWeight>=.65){
  const matching=fineCandidates.filter(v=>
   Math.sign(v.signed)===Math.sign(best.signed)&&
   Math.abs(Math.abs(v.signed)-.045)<.001);
  const fineBest=matching.sort((a,b)=>a.worst-b.worst)[0];
  const candidate=fineBest?.signed??0;
  if(fineBest&&Math.abs(candidate)>Math.abs(delta)+.008&&
   Math.abs(candidate)<=.14&&
   Math.abs(candidate-previousCorrectionRad)<=.04500001)
   fineFallbackDelta=candidate;
 }
 return Object.freeze({signed:best.signed,delta,fineFallbackDelta,
  trialToeY:best.toe,trialHeelY:best.heel});
}

export function planOriginalSourceToeBindAxis({
 footBind=null,toesBind=null,originalFootChain=false,source=''
}={}){
 const point=v=>Array.isArray(v)&&v.length===3&&v.every(finite);
 if(source!=='original-skeleton-inverse-bind'||originalFootChain!==true||
  !point(footBind)||!point(toesBind))return null;
 const dx=toesBind[0]-footBind[0],dy=toesBind[1]-footBind[1],
  dz=toesBind[2]-footBind[2];
 const length=Math.hypot(dx,dz);
 // Mesh-local source units are unscaled KayKit rig units. Distant controls,
 // toe chains on other limbs and near-vertical helper bones fail closed.
 if(!finite(length)||length<.035||length>.45||
  Math.abs(dy)>.16)return null;
 return Object.freeze({
  source:'original-foot-to-toes-inverse-bind-axis',
  footX:footBind[0],footZ:footBind[2],
  toeX:toesBind[0],toeZ:toesBind[2],
  forwardX:dx/length,forwardZ:dz/length,
  sourceBoneSeparation:length
 });
}

/**
 * A source-foot/toes axis can disambiguate heel vs toe; the lowest weighted
 * shoe vertices alone cannot. An invalid explicit axis MUST NOT silently
 * revert to its sideways extrema and claim anatomical verification.
 */
export function selectOriginalOutsolePatchVertices(candidates,anchorBindY,sourceAxis=null){
 if(!Array.isArray(candidates)||!finite(anchorBindY)||candidates.length>8192)return null;
 const low=[];
 for(const sample of candidates){
  if(!Number.isSafeInteger(sample?.index)||sample.index<0||
   ![sample.x,sample.z,sample.bindY,sample.weight].every(finite)||
   sample.weight<.55||sample.weight>1.001||
   sample.bindY<anchorBindY-.001||sample.bindY>anchorBindY+.032)continue;
  low.push(sample);
 }
 if(low.length<2)return null;
 const extrema=axis=>{
  let lowEnd=low[0],highEnd=low[0];
  for(const point of low){
   if(point[axis]<lowEnd[axis])lowEnd=point;
   if(point[axis]>highEnd[axis])highEnd=point;
  }
  return {heel:lowEnd,toe:highEnd,spanMeters:highEnd[axis]-lowEnd[axis]};
 };
 const x=extrema('x'),z=extrema('z');
 const anatomical=sourceAxis!==null;
 if(anatomical&&(sourceAxis?.source!=='original-foot-to-toes-inverse-bind-axis'||
  ![sourceAxis.forwardX,sourceAxis.forwardZ,sourceAxis.footX,sourceAxis.footZ,
    sourceAxis.toeX,sourceAxis.toeZ].every(finite)||
  Math.abs(Math.hypot(sourceAxis.forwardX,sourceAxis.forwardZ)-1)>.002))
  return null;
 let selected;
 if(anatomical){
  let lowEnd=low[0],highEnd=low[0],lo=Infinity,hi=-Infinity;
  for(const point of low){
   const projection=(point.x-sourceAxis.footX)*sourceAxis.forwardX+
    (point.z-sourceAxis.footZ)*sourceAxis.forwardZ;
   if(projection<lo){lo=projection;lowEnd=point;}
   if(projection>hi){hi=projection;highEnd=point;}
  }
  const toeProjection=(sourceAxis.toeX-sourceAxis.footX)*sourceAxis.forwardX+
   (sourceAxis.toeZ-sourceAxis.footZ)*sourceAxis.forwardZ;
  // The heel must really extend behind foot.l/r while a distinct outsole
  // point extends PAST the original toes.l/r bind joint, not a boot side.
  if(!(lo<-.015&&hi>toeProjection+.005))return null;
  selected={heel:lowEnd,toe:highEnd,spanMeters:hi-lo};
 }else selected=x.spanMeters>z.spanMeters?x:z;
 if(!finite(selected.spanMeters)||selected.spanMeters<.045||
  selected.spanMeters>.50||selected.heel.index===selected.toe.index)return null;
 const bindThicknessMeters=Math.abs(selected.heel.bindY-selected.toe.bindY);
 if(bindThicknessMeters>.032)return null;
 return {...selected,bindThicknessMeters,
  anatomicalHeelToeVerified:anatomical,
  source:anatomical?'original-foot-to-toes-inverse-bind-axis':
   'unoriented-original-low-outsole-extrema'};
}


export function auditImportedAnimationClips(clips=[]){
 const entries=[],names=new Set(),rootMotionTracks=[];
 let invalidClips=0,invalidTracks=0;
 if(!Array.isArray(clips))return Object.freeze({clips:[],invalidClips:1,invalidTracks:0,rootMotionTracks:[]});
 for(const clip of clips.slice(0,80)){
  if(!clip||typeof clip.name!=='string'||!finite(clip.duration)||clip.duration<0||
   !Array.isArray(clip.tracks)){invalidClips++;continue}
  const name=clip.name.slice(0,96);
  let rotation=0,translation=0,scale=0;
  for(const track of clip.tracks.slice(0,1500)){
   if(typeof track?.name!=='string'){invalidTracks++;continue}
   const path=track.name;
   if(path.endsWith('.quaternion'))rotation++;
   else if(path.endsWith('.position'))translation++;
   else if(path.endsWith('.scale'))scale++;
   if(/(?:^|[/.:])(?:root|armature|scene|master)\.position$/i.test(path))
    rootMotionTracks.push((name+':'+path).slice(0,160));
  }
  if(names.has(name))invalidClips++;
  names.add(name);
  entries.push(Object.freeze({name,duration:Number(clip.duration.toFixed(3)),
   tracks:clip.tracks.length,rotation,translation,scale}));
 }
 return Object.freeze({clips:entries,invalidClips,invalidTracks,
  rootMotionTracks:rootMotionTracks.slice(0,24)});
}

/**
 * The licensed Idle clip and reversible full-body guard envelope must hand
 * pelvis, loaded ankles, shoulder and weapon elbow ownership to Walking_A
 * coherently, even when software WebGL delivers only a few real frames.
 * A 360ms measured frame cannot take seven pseudo-50ms frames to enter guard,
 * but one frame must not snap the entire original 180ms pose either.
 *
 * Bound to 90ms of visible pose progress per sampled frame: at least two
 * genuinely visible presentations express the complete transfer. Normal
 * 60Hz playback retains its original 180ms cadence. No event, hit, movement,
 * clip, geometry or world-space foot contact is invented.
 */
export function planNativeGuardVisibleDelta({
 frameDelta=0,frameInterval=frameDelta,visible=true,
 reducedMotion=false,teleport=false
}={}){
 if(visible!==true||reducedMotion||teleport||
  !finite(frameDelta)||frameDelta<0||frameDelta>.05||
  !finite(frameInterval)||frameInterval<=0||frameInterval>2)return 0;
 return Math.min(.09,Math.max(frameDelta,frameInterval));
}

/**
 * Genuine source-Walking_A must not throw an original skinned foot into a
 * swing on a visually near-stationary Idle/Guard -> Move crossfade. An exact
 * original-GLB nine-tick trace observed ~5mm root travel but ~163mm of sole
 * vertex travel at entry. Defer only extremely slow *initial* source clip
 * selection until 24mm of independently witnessed root travel accumulates.
 * Gameplay movement, facing and every real authority action stay unchanged.
 * Normal 60Hz movement and any meaningful physical step enter immediately.
 */
const IMMEDIATE_NATIVE_WALK=Object.freeze({defer:false,pendingMeters:0});
export function planNativeWalkStartFromTravel({
 mode='idle',previousMode='idle',sourceClipName='',groundedMoving=false,
 groundedTravel=NaN,frameInterval=NaN,pendingMeters=0,
 alive=false,visible=true,teleport=false,reducedMotion=false,interrupted=false
}={}){
 if(mode!=='move'||!['idle','guard'].includes(previousMode)||
  typeof sourceClipName!=='string'||
  !/^(?:walking[_\s-]*a|walk|run)(?:$|[_\s-])/i.test(sourceClipName)||
  groundedMoving!==true||alive!==true||visible!==true||teleport||
  reducedMotion||interrupted||
  !finite(groundedTravel)||groundedTravel<0||
  !finite(frameInterval)||frameInterval<=0||frameInterval>2||
  !finite(pendingMeters)||pendingMeters<0||pendingMeters>.024)return IMMEDIATE_NATIVE_WALK;
 const cumulative=Math.min(.024,pendingMeters+groundedTravel);
 // A real 5mm/16ms step is not equivalent to a 5mm/80ms near-standstill.
 // Never delay a genuine >=12mm frame or an actor already in Walking_A.
 const slow=groundedTravel<.012&&groundedTravel/frameInterval<.25;
 return slow&&cumulative<.024?
  {defer:true,pendingMeters:cumulative}:IMMEDIATE_NATIVE_WALK;
}


/**
 * Authentic Idle can remain the source clip while the visual root has moved
 * only 5-12 mm; the original Walking_A entry planner has correctly deferred
 * a 41-joint swing. Do not start a SECOND procedural pelvis-to-sole gait
 * before that original source handoff. The 160ms final additive stride
 * deceleration must also consume bounded REAL displayed time, not assume
 * every delivered software-WebGL pose represented only <=50ms.
 *
 * This is presentation-only: no root movement, keyframes, contact, foot IK,
 * new skeleton, cast/attack or source clip change. Reject stale/hidden,
 * invalid, interrupted or dead owner evidence instead of carrying poses.
 */
export function planNativeSourceIdleGaitFrame({
 mode='idle',sourceAction='idle',sourceClipName='',pendingMeters=0,
 groundedMoving=false,alive=true,visible=true,teleport=false,
 reducedMotion=false,interrupted=false,frameDelta=0,frameInterval=frameDelta
}={}){
 if(alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  !finite(frameDelta)||frameDelta<0||frameDelta>.05||
  !finite(frameInterval)||frameInterval<=0||frameInterval>2)
  return {suppress:false,releaseDelta:0};
 const originalIdle=sourceClipName==='Idle'&&
  (sourceAction==='idle'||sourceAction==='guard');
 // A legitimate move owner can arrive one original-GLB rendered frame
 // BEFORE any world-root displacement. The Walking_A entry gate legitimately
 // returns {defer:true,pendingMeters:0} on that frame. Original Idle still
 // owns the pelvis, shoe joints, chest and weapon arms: the old second gait
 // may NOT wake up simply because accumulated metres are precisely zero.
 // Source/action identity, real moving owner and 24mm upper bound remain
 // mandatory; a missing Walking_A asset still uses the procedural fallback.
 const suppress=mode==='move'&&originalIdle&&groundedMoving===true&&
  finite(pendingMeters)&&pendingMeters>=0&&pendingMeters<.024;
 const slowing=originalIdle&&(mode==='idle'||mode==='guard')&&
  groundedMoving===false;
 return {suppress,releaseDelta:slowing?
  Math.min(.09,Math.max(frameDelta,frameInterval)):frameDelta};
}

/** Classify a real visual frame without relying on wall-clock time. */
export function advanceFullBodyController(previous=null,{
 unit={},grounded=null,damageBeat=null,evasionBeat=null,combatFacing=null,
 actionAge=0,frameDelta=0,frameInterval=frameDelta,visible=true,reducedMotion=false,teleport=false
}={}){
 const raw=unit?.action;
 const authorityAction=ACTIONS.has(raw)?raw:'idle';
 const actionTick=Number.isSafeInteger(unit?.actionTick)&&unit.actionTick>=0?unit.actionTick:null;
 const alive=!(finite(unit?.hp)&&unit.hp<=0);
 const injury=alive&&damageBeat&&damageBeat.id===unit.id&&damageBeat.kind===unit.kind&&
  finite(damageBeat.damage)&&damageBeat.damage>0&&
  finite(damageBeat.maxHp)&&damageBeat.maxHp>0&&
  finite(damageBeat.age)&&damageBeat.age>=0&&damageBeat.age<.55&&!damageBeat.fatal;
 const evasion=alive&&!injury&&evasionBeat&&evasionBeat.id===unit.id&&
  evasionBeat.kind===unit.kind&&Number.isSafeInteger(evasionBeat.tick)&&
  Number.isInteger(evasionBeat.dx)&&Number.isInteger(evasionBeat.dz)&&
  Math.abs(evasionBeat.dx)+Math.abs(evasionBeat.dz)===1&&
  finite(evasionBeat.age)&&evasionBeat.age>=0&&evasionBeat.age<.58;
 // Never animate a "move" that has no actual rendered displacement.
 const walking=alive&&!teleport&&grounded?.moving===true&&grounded?.clipAction==='move'&&
  !reducedMotion;
 const requestedAge=safeAge(actionAge);
 // A genuine visual teleport cancels the old source attack/cast even if its
 // action label persists. Keep that tick quarantined until a NEW lawful tick,
 // or the first landed frame can replay a displaced swing or casting gesture.
 const teleportSuppressedTick=teleport?actionTick:
  previous?.teleportSuppressedTick===actionTick?actionTick:null;
 // An actual HP-loss reaction or legal one-cell evasion interrupts the
 // original sword/spell one-shot. The surviving public action label cannot
 // restart that imported clip after Hit_A or dodge; only a NEW source tick
 // may authorize a new attack/cast. No damage or movement is synthesized.
 const interruptionSuppressedTick=(injury||evasion)&&
  ['attack','cast'].includes(authorityAction)&&actionTick!==null?actionTick:
  Number.isSafeInteger(previous?.interruptionSuppressedTick)&&
   previous.interruptionSuppressedTick===actionTick?actionTick:null;
 const sourceOneShotSuppressed=Boolean(teleport||(
  Number.isSafeInteger(teleportSuppressedTick)&&teleportSuppressedTick===actionTick)||(
  Number.isSafeInteger(interruptionSuppressedTick)&&interruptionSuppressedTick===actionTick));
 const requestedOneShot=!sourceOneShotSuppressed&&
  Object.hasOwn(ONE_SHOT_RECOVERY,authorityAction)&&
  authorityAction!=='hurt'&&requestedAge<ONE_SHOT_RECOVERY[authorityAction];
 // Each fixed authoritative tick resets the unit action and actionTick, but
 // an imported sword/spell one-shot lasts longer than the 350ms server tick.
 // Preserve only RECOVERY of a previously witnessed event, and only during
 // one subsequent idle tick with no new walking, hit, evade or guard. A skipped
 // tick, new combat event or defeat must not resurrect stale visual damage.
 const priorOneShot=previous?.mode==='attack'||previous?.mode==='cast'?
  previous.mode:null;
 const delta=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 const eligibleHold=Boolean(alive&&!teleport&&!injury&&!evasion&&!reducedMotion&&
  authorityAction==='idle'&&!walking&&priorOneShot&&
  Number.isSafeInteger(previous?.actionTick)&&Number.isSafeInteger(actionTick)&&
  actionTick>=previous.actionTick&&actionTick-previous.actionTick<=1&&
  finite(previous.age)&&previous.age>=0);
 const heldStep=planFullBodyVisibleFrameStep({mode:priorOneShot??'idle',
  frameDelta,frameInterval,reducedMotion,visible});
 const inheritedAge=eligibleHold?Math.min(5,previous.age+heldStep):0;
 // A genuine original-rig WebGL frame can spend 280ms just as the next
 // 350ms public tick becomes idle. The licensed sword may already have
 // displayed its witnessed adjacent contact and recovery, yet this single
 // sparse frame leaps over the 620ms exit and erases all follow-through.
 // Preserve ONE final RECOVERY POSE only after such a witnessed source beat;
 // never invent a hit, new target, game action or original source clip.
 // A lawful source cast can similarly finish its licensed 640ms shoulder
 // and wrist release after a sparse next idle heartbeat. It is NOT a spell,
 // a target, an impact, or a new source event. This one terminal pose requires
 // a real cast already seen in recovery on the immediately prior event tick.
 const witnessedReleaseFrame=Boolean(eligibleHold&&previous?.holding!==true&&
  previous?.phase==='recovery'&&previous?.authorityAction===priorOneShot&&
  actionTick===previous.actionTick+1&&
  previous.age>=(priorOneShot==='cast'?.48:.28)&&
  previous.age<ONE_SHOT_RECOVERY[priorOneShot]&&
  inheritedAge>=ONE_SHOT_RECOVERY[priorOneShot]&&
  (priorOneShot==='cast'||(priorOneShot==='attack'&&
   previous?.confirmedContact?.actionTick===previous.actionTick)));
 const heldAge=witnessedReleaseFrame?
  Math.max(previous.age,ONE_SHOT_RECOVERY[priorOneShot]-1e-6):inheritedAge;
 const holding=Boolean(eligibleHold&&heldAge<ONE_SHOT_RECOVERY[priorOneShot]);
 const mode=!alive?'defeat':injury?'hurt':evasion?'evade':
  requestedOneShot?authorityAction:holding?priorOneShot:
  authorityAction==='guard'?'guard':walking?'move':'idle';
 // The renderer may hold one witnessed positive-HP-loss beat while the
 // authoritative heartbeat advances actionTick on every 350ms snapshot.
 // Source Hit_A belongs to the HP-drop EVENT, not the unrelated current
 // public tick: otherwise its skeleton and weapon snap back to impact.
 // A subsequent genuine HP drop carries a new eventTick and may restart.
 const damageEventTick=injury&&Number.isSafeInteger(damageBeat?.eventTick)&&
  damageBeat.eventTick>=0?damageBeat.eventTick:null;
 const visualActionTick=holding?previous.actionTick:
  mode==='hurt'&&damageEventTick!==null?damageEventTick:actionTick;
 const clipAction=mode==='evade'?'idle':mode;
 const beatAge=mode==='hurt'&&injury?damageBeat.age:
  mode==='evade'?evasionBeat.age:holding?heldAge:requestedAge;
 const age=safeAge(beatAge);
 const same=previous?.mode===mode;
 const tickChanged=ONESHOTS.has(mode)&&previous?.actionTick!==visualActionTick;
 const beatRestart=same&&(mode==='evade'||(mode==='hurt'&&injury))&&
  finite(previous?.age)&&age+.025<previous.age;
 const changed=!same||tickChanged||Boolean(beatRestart);
 const restarted=same&&Boolean(tickChanged||beatRestart);
 const completed=Boolean(previous&&ONESHOTS.has(previous.mode)&&mode==='idle'&&
  (previous.age>=(ONE_SHOT_RECOVERY[previous.mode]??.55)-.05||
   (authorityAction===previous.mode&&requestedAge>=(ONE_SHOT_RECOVERY[previous.mode]??.55))));
 const interrupted=Boolean(previous&&ONESHOTS.has(previous.mode)&&!completed&&
  (previous.mode!==mode||tickChanged||beatRestart));
 const transition=changed?0:clamp((finite(previous?.transition)?previous.transition:0)+
  (finite(frameDelta)?clamp(frameDelta,0,.05):0),0,1);
 // One bounded source-rig guard envelope connects pelvis, both soles, chest,
 // shoulders and elbows. The original imported Idle clip remains the base.
 // Fade legitimate guard entry and idle release on the SAME sampled frame
 // clock; injury/attack/evasion/teleport/defeat/reduced motion take immediate
 // ownership and cannot inherit a fake guard or defensive game effect.
 const guardWas=finite(previous?.guardProgress)?clamp(previous.guardProgress,0,1):0;
 const guardDelta=planNativeGuardVisibleDelta({frameDelta,frameInterval,visible,reducedMotion,teleport})/.18;
 // Original Idle -> Walking_A must ease out the defensive pelvis, soles,
 // chest, shoulders and weapon elbow while legitimate movement takes over.
 // This is pose-only, sourced from an already witnessed guard. Never retain
 // a gameplay guard, invent travel or carry the brace into hurt/evasion/death.
 const settlingGuard=guardWas>0&&
  (mode==='idle'||mode==='move')&&
  ['guard','idle','move'].includes(previous?.mode);
 const guardProgress=!alive||teleport||reducedMotion||visible!==true?0:
  mode==='guard'?clamp(guardWas+guardDelta,0,1):
  settlingGuard?clamp(guardWas-guardDelta,0,1):0;
 const guardBlend=guardProgress*guardProgress*(3-2*guardProgress);
 // This is a pose-ownership mask, NOT weights accumulated by several systems.
 const owner=Object.freeze({
  locomotion:mode==='move',
  duel:mode==='attack',
  cast:mode==='cast',
  guard:mode==='guard',
  evasion:mode==='evade',
  injury:mode==='hurt'&&Boolean(injury),
  defeat:mode==='defeat',
  support:mode==='move'||mode==='attack'||mode==='guard',
  // The real Warden warning is a genuine separate authority-backed telegraph.
  warning:alive&&!['hurt','evade'].includes(mode)
 });
 // This is a pose-only latch from a real, validated combat-facing result
 // and the SAME explicit authority target. It permits a finishing planted
 // stance when the next idle tick erases targetId. It never schedules a hit,
 // adds a damage cue, or selects a different nearby enemy.
 const confirmedAtSource=mode==='attack'&&!holding&&authorityAction==='attack'&&
  Number.isSafeInteger(actionTick)&&typeof unit?.targetId==='string'&&
  unit.targetId.trim().length>0&&unit.targetId.length<=96&&
  combatFacing?.targetId===unit.targetId&&combatFacing?.distance===1&&
  finite(combatFacing?.yaw)?
  Object.freeze({targetId:unit.targetId,distance:1,actionTick}):null;
 const confirmedContact=holding&&previous?.confirmedContact?.actionTick===visualActionTick?
  previous.confirmedContact:confirmedAtSource;
 // Keep the original Ranger's witnessed aim only while the SAME legitimate
 // 2H_Ranged_Shoot recovers through one idle authority tick. That tick has
 // already erased targetId; dropping the source aim there otherwise strips
 // its pelvis, planted legs, spine and weapon-supporting arms in mid-release.
 // Pose-only: this value is never an attack, hit, target selection or event.
 const rangedAtSource=unit?.kind==='ranger'&&mode==='attack'&&!holding&&
  authorityAction==='attack'&&Number.isSafeInteger(actionTick)&&
  typeof unit?.id==='string'&&unit.id.length>0&&unit.id.length<=96&&
  typeof unit?.targetId==='string'&&unit.targetId.trim().length>0&&
  unit.targetId.length<=96&&combatFacing?.targetId===unit.targetId&&
  Number.isInteger(combatFacing?.distance)&&combatFacing.distance>=1&&
  combatFacing.distance<=4&&finite(combatFacing?.yaw)?
  Object.freeze({actorId:unit.id,targetId:unit.targetId,
   distance:combatFacing.distance,actionTick}):null;
 const witnessedRangedAim=holding&&unit?.kind==='ranger'&&
  previous?.witnessedRangedAim?.actorId===unit?.id&&
  previous.witnessedRangedAim.actionTick===visualActionTick?
  previous.witnessedRangedAim:rangedAtSource;
 const phase=mode==='attack'?age<.12?'anticipation':age<.28?'contact':age<.62?'recovery':'settled':
  mode==='cast'?age<.16?'anticipation':age<.48?'release':'recovery':
  mode==='hurt'?age<.12?'impact':'recovery':
  mode==='evade'?age<.16?'departure':'recovery':
  mode==='defeat'?'down':mode==='move'?'stride':mode;
 return Object.freeze({mode,phase,age,actionTick:visualActionTick,authorityAction,clipAction,
  holding,completed,confirmedContact,witnessedRangedAim,changed,restarted,interrupted,transition,
  guardProgress,guardBlend,owner,
  teleportSuppressedTick,interruptionSuppressedTick,reducedMotion:Boolean(reducedMotion)});
}

/**
 * Conservative planted-foot constraint over real cloned thigh/calf/foot joints.
 * This is bounded ankle counter-rotation, not fabricated root translation and
 * not a claim of three-dimensional ground-contact IK. It counteracts stance
 * drift while the REAL distance-paced stride is moving the actor.
 */
const NEUTRAL_LEGS=Object.freeze({
 left:Object.freeze({upper:0,lower:0,foot:0}),
 right:Object.freeze({upper:0,lower:0,foot:0})
});
export function planConstrainedFootSupport(phase=0,weight=0,{
 moving=false,teleport=false,reducedMotion=false
}={}){
 if(!moving||teleport||reducedMotion||!finite(phase)||!finite(weight)||
  weight<=0)return NEUTRAL_LEGS;
 const w=clamp(weight,0,1),wave=Math.sin(phase);
 const left=clamp(-wave,0,1)*w,right=clamp(wave,0,1)*w;
 // Damped counter-rotation prevents the loaded foot from being driven
 // through its visual support by a hip-led side-to-side gait. The original
 // heel and toe meshes remain children of the SAME imported foot joint.
 return {
  left:left>0?{upper:-.011*left,lower:.034*left,foot:-.062*left}:NEUTRAL_LEGS.left,
  right:right>0?{upper:-.011*right,lower:.034*right,foot:-.062*right}:NEUTRAL_LEGS.right
 };
}

/**
 * One-time source-rig visual grounding at asset attachment, NOT an IK solver.
 * Original pinned GLB shoes in the captured live Idle pose were ~0.23m ABOVE
 * the real authored cube top (-0.02m), despite the artist's asset-wide bounds
 * having been placed at floor height. Props/weapon tips may set those bounds.
 * Only trust BOTH real skinned shoe vertices from the same neutral source
 * clip, with close heights. Never translate DungeonRuntime root or retime
 * walking/action clips. No per-frame scan, mesh, geometry or GPU work.
 */
export function planOriginalSourceSoleGrounding({
 mode='idle',sourceClipName='',visible=true,reducedMotion=false,
 floorTopY=NaN,floorEvidence='',leftSoleWorldY=NaN,rightSoleWorldY=NaN,
 parentWorldScaleY=1
}={}){
 if(!['idle','guard'].includes(mode)||sourceClipName!=='Idle'||
  visible!==true||reducedMotion||floorEvidence!=='authored-cube-floor-top'||
  ![floorTopY,leftSoleWorldY,rightSoleWorldY].every(finite)||
  Math.abs(floorTopY+.02)>.003||Math.abs(leftSoleWorldY-rightSoleWorldY)>.035||
  !finite(parentWorldScaleY)||parentWorldScaleY<.5||parentWorldScaleY>3.5)
  return null;
 const minimum=Math.min(leftSoleWorldY,rightSoleWorldY);
 const gap=minimum-floorTopY;
 // A tiny gap is source bob; a large/uneven gap is an untrusted pose or
 // different stage surface. Never ground that actor speculatively.
 if(gap<.06||gap>.36)return null;
 return Object.freeze({accepted:true,measuredFrom:'original-skinned-sole-vertices',
  floorTopY,offsetY:Number((-gap/parentWorldScaleY).toFixed(6)),
  worldOffsetY:Number((-gap).toFixed(6)),parentWorldScaleY,
  beforeMinSoleY:Number(minimum.toFixed(6)),
  originalSourceClip:sourceClipName,
  note:'asset-pivot-only-once; not world-space foot lock or native IK'});
}


/**
 * Final-source physical shoe witness for original Walking_A body support.
 * Both real skinned heel AND toe must remain non-sinking when the whole-body
 * presentation root rises. A better maximum error alone is not sufficient:
 * an improved buried toe must never be purchased by a deeper buried heel.
 * The opposite near-loaded source shoe must not be raised into visible hover.
 * No IK target or synthetic contact is created. Stateless, bounded, read-only.
 */
/**
 * A restored-root ankle retry must independently check BOTH source-skinned
 * shoes on the same original GLB. Neither an ankle trial nor a weighted sole
 * readback is evidence of a planted-foot IK or authoritative ground lock.
 */
export function verifyRestoredRootOriginalSourceSoleSafety({
 source='',floorTopY=NaN,before=null,after=null
}={}){
 if(source!=='same-original-GLB-restored-root'||!finite(floorTopY)||
  Math.abs(floorTopY+.02)>.005||!before||!after)return null;
 for(const side of ['left','right']){
  const first=before[side],last=after[side];
  if(!first||!last||
   ![first.heelY,first.toeY,last.heelY,last.toeY].every(finite))return null;
  // A source ankle retry must not drive any outsole endpoint >4 mm deeper
  // into stone, even if the opposite/other toe improves.
  for(const edge of ['heelY','toeY'])
   if(last[edge]<floorTopY-.004&&last[edge]<first[edge]-.004)
    return null;
  const nearLoaded=['heelY','toeY'].every(edge=>
   first[edge]>=floorTopY-.055&&first[edge]<=floorTopY+.035);
  // Respect the genuine opposite source shoe; do not force an already
  // airborne shoe down or introduce an obviously hovering loaded outsole.
  if(nearLoaded&&(last.heelY>floorTopY+.035||
   last.toeY>floorTopY+.035))return null;
 }
 return Object.freeze({source,floorTopY,feetVerified:2,contactLocked:false});
}

export function verifyOriginalSourceLoadedPelvisFootWitness({
 before=null,after=null,otherBefore=null,otherAfter=null,floorTopY=NaN
}={}){
 if(![before,after,otherBefore,otherAfter].every(f=>f&&
  finite(f.heelY)&&finite(f.toeY))||!finite(floorTopY))return null;
 const beforeWorst=Math.max(Math.abs(before.heelY-floorTopY),
  Math.abs(before.toeY-floorTopY));
 const afterWorst=Math.max(Math.abs(after.heelY-floorTopY),
  Math.abs(after.toeY-floorTopY));
 if(beforeWorst-afterWorst<.0015||
  after.heelY<before.heelY-.001||after.toeY<before.toeY-.001||
  after.heelY<floorTopY-.055||after.toeY<floorTopY-.055||
  after.heelY>floorTopY+.028||after.toeY>floorTopY+.028)return null;
 const otherNearLoaded=otherBefore.heelY>=floorTopY-.045&&
  otherBefore.heelY<=floorTopY+.025&&
  otherBefore.toeY>=floorTopY-.045&&
  otherBefore.toeY<=floorTopY+.025;
 if(otherNearLoaded&&Math.max(otherAfter.heelY,otherAfter.toeY)>
  floorTopY+.025)return null;
 return {beforeWorstMeters:beforeWorst,afterWorstMeters:afterWorst,
  improvementMeters:beforeWorst-afterWorst,otherNearLoaded};
}

/**
 * Original Walking_A can lower a genuinely loaded, skinned heel AND toe
 * beneath the authored -20mm stone plane while an airborne ankle correction
 * has no authority over the stance foot. Offer a restrained upward VISUAL
 * pelvis offset based on both genuine weighted original outsole vertices.
 *
 * The root/grid position, source mixer, weapon, keyframes, and source skeleton
 * remain untouched. No inferred IK target or foot plant is produced.
 * Because rendered-world Y can include fitted transforms, the live adapter
 * MUST independently remeasure the exact applied offset and reject it if the
 * real loaded foot is not improved or the other loaded foot floats.
 */
export function planOriginalSourceLoadedPelvisSupport({
 mode='idle',sourceClipName='',sourceWeight=NaN,ownerLocomotion=false,
 rootTravel=NaN,frameAge=NaN,alive=true,visible=true,
 teleport=false,reducedMotion=false,interrupted=false,
 floorTopY=NaN,floorEvidence='',
 left=null,right=null,previousLiftMeters=0
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.5||sourceWeight>1||
  ownerLocomotion!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  ![rootTravel,frameAge,floorTopY,previousLiftMeters].every(finite)||
  rootTravel<=.003||rootTravel>.54||frameAge<0||frameAge>.18||
  floorEvidence!=='authored-cube-floor-top'||
  Math.abs(floorTopY+.02)>.003||
  previousLiftMeters<0||previousLiftMeters>.01601)return null;
 if(!left||!right||![left.heelY,left.toeY,right.heelY,right.toeY].every(finite))
  return null;
 const feet={left,right};
 const qualified=Object.entries(feet).filter(([,f])=>{
  const heel=f.heelY-floorTopY,toe=f.toeY-floorTopY;
  return heel>=-.055&&heel<=.025&&toe>=-.055&&toe<=.025&&
   Math.abs(heel-toe)<=.045&&Math.min(heel,toe)<-.008;
 });
 if(!qualified.length)return null;
 let best=null;
 for(const [side,foot] of qualified){
  const beforeWorst=Math.max(Math.abs(foot.heelY-floorTopY),
   Math.abs(foot.toeY-floorTopY));
  const ideal=Math.max(0,Math.min(.016,floorTopY-(foot.heelY+foot.toeY)/2));
  // A real 8mm-per-displayed-frame ceiling avoids a sudden 16mm whole-body
  // jump when the native 41-joint source foot enters its loaded stroke.
  const lift=clamp(ideal,Math.max(0,previousLiftMeters-.008),
   Math.min(.016,previousLiftMeters+.008));
  if(lift<=.00001)continue;
  const afterHeel=foot.heelY+lift,afterToe=foot.toeY+lift;
  const afterWorst=Math.max(Math.abs(afterHeel-floorTopY),
   Math.abs(afterToe-floorTopY));
  if(beforeWorst-afterWorst<.0015||
   afterHeel>floorTopY+.028||afterToe>floorTopY+.028)continue;
  // Do not rescue one buried shoe by elevating an independently loaded,
  // already clear original shoe into a visible hover above the stone.
  const opposite=feet[side==='left'?'right':'left'];
  const oHeel=opposite.heelY-floorTopY,oToe=opposite.toeY-floorTopY;
  const otherNearLoaded=oHeel>=-.045&&oHeel<=.025&&
   oToe>=-.045&&oToe<=.025&&Math.abs(oHeel-oToe)<=.045;
  if(otherNearLoaded&&Math.max(oHeel,oToe)+lift>.025)continue;
  if(!best||beforeWorst-afterWorst>best.improvementMeters)
   best={side,liftMeters:lift,beforeWorstMeters:beforeWorst,
    afterWorstMeters:afterWorst,improvementMeters:beforeWorst-afterWorst,
    source:'measured-original-GLB-loaded-heel-and-toe',
    floorTopY,previousLiftMeters};
 }
 return best;
}

/**
 * Once an original licensed Idle skinned-shoe pose is calibrated to the
 * measured stone-top Y, the regular full-body presentation frame must retain
 * that ONE attachment offset. Recomputing visualPivot.position each frame
 * previously erased the ground placement, recreating a measured ~23cm hover.
 * Compose from the independent current-frame performance Y (never prior
 * pivot.position.y): this is non-accumulating and does not move simulation.
 */
/**
 * Viewer-perceived source shoe skating relief, NOT a planted-foot IK lock.
 * The previous and present displayed frames must expose two anatomically
 * selected WEIGHTED outsole endpoints from the SAME licensed GLB clone.
 * Only one clearly loaded source shoe and real XZ root travel authorize a
 * small, reversible presentation-only displacement of the ENTIRE rig.
 * Never move the authoritative root, invent an attack/step, or drive a joint.
 */
export function planOriginalSourceStanceSlideRelief({
 mode='idle',sourceClipName='',sourceWeight=NaN,sourceInstanceSame=false,
 ownerLocomotion=false,rootTravel=NaN,recentRootTravel=NaN,
 recentTravelAge=NaN,frameInterval=NaN,
 alive=true,visible=true,teleport=false,reducedMotion=false,
 interrupted=false,floorTopY=NaN,previous=null,current=null
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.65||sourceWeight>1.001||
  sourceInstanceSame!==true||ownerLocomotion!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  !finite(rootTravel)||rootTravel<0||rootTravel>.18||
  !finite(frameInterval)||frameInterval<=0||frameInterval>.35||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.003||
  !previous||!current)return null;
 // The simulation root moves at fixed ticks while Walking_A advances on
 // displayed rAF frames. Reuse ONLY a fresh, independent, true root-travel
 // witness; never infer or apply an authoritative step from clip motion.
 const currentStep=rootTravel>=.015;
 const recentStep=!currentStep&&finite(recentRootTravel)&&
  recentRootTravel>=.015&&recentRootTravel<=.18&&
  finite(recentTravelAge)&&recentTravelAge>=0&&recentTravelAge<=.18;
 if(!currentStep&&!recentStep)return null;
 const witnessedTravel=currentStep?rootTravel:recentRootTravel;
 const points=side=>{
  const a=previous[side],b=current[side];
  if(!a||!b||![a.heel,a.toe,b.heel,b.toe].every(p=>
   Array.isArray(p)&&p.length===3&&p.every(finite)))return null;
  const span=Math.hypot(a.heel[0]-a.toe[0],a.heel[2]-a.toe[2]);
  const nextSpan=Math.hypot(b.heel[0]-b.toe[0],b.heel[2]-b.toe[2]);
  if(span<.11||span>.38||nextSpan<.11||nextSpan>.38||
   Math.abs(nextSpan-span)>.018)return null;
  return {a,b,
   loaded:[a.heel,a.toe,b.heel,b.toe].every(p=>
    p[1]>=floorTopY-.026&&p[1]<=floorTopY+.029)};
 };
 const left=points('left'),right=points('right');
 if(!left||!right||Number(left.loaded)+Number(right.loaded)!==1)return null;
 const side=left.loaded?'left':'right',sample=left.loaded?left:right;
 const dx=sample.b.heel[0]-sample.a.heel[0],
  dz=sample.b.heel[2]-sample.a.heel[2];
 const toeDx=sample.b.toe[0]-sample.a.toe[0],
  toeDz=sample.b.toe[2]-sample.a.toe[2];
 const heelTravel=Math.hypot(dx,dz),toeTravel=Math.hypot(toeDx,toeDz);
 if(heelTravel<.025||heelTravel>.14||toeTravel<.025||toeTravel>.14||
  Math.hypot(dx-toeDx,dz-toeDz)>.012)return null;
 const meanX=(dx+toeDx)/2,meanZ=(dz+toeDz)/2;
 const drift=Math.hypot(meanX,meanZ);
 if(drift<.025||drift>.14)return null;
 // At most 18 mm of original source-rig presentation shift or 55% of
 // genuine root displacement. Keep >=8 mm of visible witnessed shoe travel:
 // even qualifying relief is explicitly NOT a world-space foot lock.
 const reduction=Math.min(.018,.55*witnessedTravel,drift-.008);
 if(reduction<.004)return null;
 return Object.freeze({
  source:'same-original-GLB-weighted-two-point-stance',
  side,worldDeltaX:-meanX/drift*reduction,
  worldDeltaZ:-meanZ/drift*reduction,
  driftBeforeMeters:drift,reductionMeters:reduction,
  witnessedRootTravelMeters:witnessedTravel,
  witnessedRootTravelAgeSeconds:currentStep?0:recentTravelAge,
  footSpanMeters:Math.hypot(sample.b.heel[0]-sample.b.toe[0],
   sample.b.heel[2]-sample.b.toe[2]),
  contactLocked:false
 });
}

export function composeOriginalSourceGroundedPivotY(presentationY=0,anchor=null){
 if(!finite(presentationY))return 0;
 const offset=anchor?.accepted===true&&finite(anchor.offsetY)&&
  anchor.offsetY<=0&&anchor.offsetY>=-.75?anchor.offsetY:0;
 return presentationY+offset;
}

/**
 * A source GLB death is a terminal one-shot, not a new attack on each server
 * heartbeat. DungeonRuntime legally increments every unit's actionTick even
 * after HP reaches zero, so using the general one-shot tick rule would reset
 * Death_A every 350 ms instead of letting its original 0.792 s pose settle.
 * Only a true living->defeated source-action transition starts/restarts death.
 * A genuine revival changes the source action away from defeat first.
 */
export function shouldRestartImportedOneShot(action,previousAction,previousTick,nextTick,forceRestart=false){
 if(!['attack','cast','hurt','defeat'].includes(action))return false;
 if(action==='defeat')return previousAction!=='defeat';
 return previousTick!==nextTick||Boolean(forceRestart);
}

/**
 * The genuine source GLB has one "Idle" AnimationAction for both neutral and
 * guarded stance. Reusing the exact running clip must not reset its 41-joint
 * keyframe clock when only presentation ownership changes idle <-> guard.
 * This keeps skinned chest, feet and right-hand weapon attachment continuous;
 * the separate additive guard layer still owns its normal bounded pose.
 */
export function shouldRetainImportedSharedIdleClock({
 previousMode=null,nextMode=null,previousClipName=null,nextClipName=null,
 sameAction=false,sourceRunning=false,newEvent=false
}={}){
 return sameAction===true&&sourceRunning===true&&newEvent===false&&
  previousClipName==='Idle'&&nextClipName==='Idle'&&
  ((previousMode==='idle'&&nextMode==='guard')||
   (previousMode==='guard'&&nextMode==='idle'));
}

/**
 * Place only a newly witnessed lawful original one-shot at its exact event
 * age. Never scrub an already running mixer clip with this entry function;
 * uninterrupted recovery is owned by the monotonic forward-only planner.
 */
export function planImportedOneShotEntry({mode='idle',age=0,sourceDuration=0,
 effectiveSpeed=1,legalTransition=false,reducedMotion=false}={}){
 if(!legalTransition||reducedMotion||!Object.hasOwn(ONE_SHOT_RECOVERY,mode)||
  ![age,sourceDuration,effectiveSpeed].every(Number.isFinite)||
  age<0||age>=ONE_SHOT_RECOVERY[mode]||sourceDuration<=.002||
  effectiveSpeed<=.001)return null;
 return Math.min(Math.max(0,sourceDuration-.002),age*effectiveSpeed);
}

/**
 * The original 0.792s Death_A must not require 16 frames to finish when a
 * software WebGL capture yields only one visible frame per second.
 * Cap catch-up to 280ms to keep 3 distinct sampled native joint poses.
 * All nonterminal actions keep their former 50ms/frame behaviour.
 */
/**
 * A single bounded visible clock for authentic attack/cast source and overlay.
 * This cannot invent an event, move an authority actor or accelerate a hidden
 * scene. Keep distinct anticipatory poses despite sparse WebGL frame delivery.
 */
export function planFullBodyVisibleFrameStep({mode='idle',frameDelta=0,
 frameInterval=frameDelta,reducedMotion=false,visible=true}={}){
 const ordinary=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 if(reducedMotion||visible!==true||!['attack','cast'].includes(mode)||
  !finite(frameInterval)||frameInterval<0)return ordinary;
 return Math.max(ordinary,Math.min(.28,frameInterval));
}

/**
 * Apply the actual imported-rig attack/cast visual step once. The generic
 * action-age function re-clamps its delta to 50ms, undoing this clock's
 * bounded slow-frame correction. Injury and accessibility retain 50ms.
 */
export function advanceFullBodyVisibleActionAge(elapsed,options={}){
 const prior=finite(elapsed)?clamp(elapsed,0,5):0;
 return Math.min(5,prior+planFullBodyVisibleFrameStep(options));
}

/**
 * Advance the original GLB only toward the SAME witnessed visual event age.
 * On a delayed first sample preserve original anticipation; on later samples
 * catch up in bounded steps. The source clock never moves backwards.
 */
export function planImportedLivingSourceStep({mode='idle',age=0,sourceTime=0,
 sourceDuration=0,effectiveSpeed=1,frameDelta=0,frameInterval=frameDelta,
 reducedMotion=false,visible=true,groundedTravel=0,groundedMoving=false,
 walkingClip=false,teleport=false}={}){
 const ordinary=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 // Authentic Walking_A has a 41-joint foot cycle but sparse WebGL delivery
 // previously advanced its imported clip by 50ms while the actual actor root
 // and its witnessed footfall travelled up to 0.54m. Share the real distance
 // clock with original source locomotion; never create an authority move.
 if(mode==='move'){
  if(reducedMotion||visible!==true||teleport||walkingClip!==true||
   ![sourceDuration,effectiveSpeed,sourceTime,frameInterval,groundedTravel].every(finite)||
   sourceDuration<=.002||effectiveSpeed<=.001||sourceTime<0||
   frameInterval<=0||groundedTravel<0||groundedTravel>.54)return ordinary;
  // The original imported walking action may still own the visual move
  // during a valid zero-travel presentation frame, including fade-out.
  // Its source soles must not treadmill while the authoritative root is
  // independently witnessed to be stationary. Other invalid/noisy
  // locomotion receipts retain the previous elapsed-time fallback.
  if(groundedMoving!==true)
   return groundedMoving===false&&groundedTravel<=.0015&&
    frameInterval<=.5?0:ordinary;
  // Base source gait time on the SAME real root travel at 60Hz and slow capture.
  // Fixed-frame playback at ordinary rates previously lagged a fast-moving
  // root and oversped a creeping actor relative to its real footfall phase.
  // Two 0.53m footfall intervals approximate one original Walking_A cycle;
  // this is bounded cadence calibration, not verified sole-contact IK.
  // A valid moving owner can spend several real WebGL frames with its root
  // planted between server snapshots. Original Walking_A must not cycle its
  // imported feet while that measured root travel is exactly zero. Sub-3mm
  // genuine movement likewise advances only its tiny witnessed distance,
  // rather than falling back to a 16/50ms wall-clock step. The visible ground
  // stamp and leg stride already use this same root-distance clock.
  // Never seek backwards or fabricate movement, contact or footsteps.
  return clamp(groundedTravel/1.06*sourceDuration/effectiveSpeed,0,.28);
 }
 // Authentic Hit_A cannot outrun the age of a witnessed positive HP loss.
 // This prevents source wrist/spine recoil preceding the owned injury pose.
 // Never seek a still-playing source clip backwards or create another hit.
 if(mode==='hurt'&&!reducedMotion&&visible===true&&
  [age,sourceTime,sourceDuration,effectiveSpeed].every(finite)&&
  age>=0&&sourceTime>=0&&sourceDuration>.002&&effectiveSpeed>.001){
  const target=Math.min(sourceDuration-.002,age*effectiveSpeed);
  return Math.min(ordinary,Math.max(0,(target-sourceTime)/effectiveSpeed));
 }
 if(reducedMotion||visible!==true||!['attack','cast'].includes(mode)||
  ![age,sourceTime,sourceDuration,effectiveSpeed,frameInterval].every(finite)||
  age<0||sourceTime<0||sourceDuration<=.002||effectiveSpeed<=.001||
  frameInterval<0)return ordinary;
 const ceiling=Math.max(0,sourceDuration-.002);
 const deficit=Math.max(0,Math.min(ceiling/effectiveSpeed,age)-sourceTime/effectiveSpeed);
 // The first legitimate pose still shows anticipation; subsequent samples
 // move the licensed mixer only as far as the SAME full-body owner clock.
 // Adding an unconditional extra 50ms used to put wrist, weapon and soles
 // one sampled frame AHEAD of the owning pelvis/shoulder performance.
 if(age===0&&sourceTime===0)return ordinary;
 return Math.min(.28,frameInterval,deficit);
}


/**
 * Native Walking_A is distance-paced, while Three.js mixer fades must be
 * elapsed-time-paced. A single mixer.update(distanceStep) would incorrectly
 * drag out the old idle pose on creeping movement, and prematurely finish a
 * crossfade on large valid steps. The renderer may temporarily time-scale
 * only the active original walk action around mixer.update(visibleDelta).
 * Returning null preserves the existing clock for every other action.
 */
/**
 * On a real stopped move-to-idle OR move-to-guard arrival, the rendered root
 * has stopped travelling, but Three.js continues the outgoing Walking_A
 * AnimationAction as it fades into the same original Idle source clip.
 * Its original knee/ankle keyframes therefore cycle in place for ~230ms.
 * Freeze ONLY that outgoing clip's time while its weight fades; genuine Idle
 * still blends in on mixer time. The next lawful walk reset unpauses it.
 * This is not a world-space sole lock and never moves the authority root.
 */
/**
 * The pinned original 41-joint Walking_A already owns thigh, calf and ankle
 * swing. The previous independent +/-0.245 rad leg sine layered on TOP of the
 * imported walking keyframes, lifting skinned shoe soles a second time and
 * increasing visible skating. Transfer primarily to the authentic GLB while
 * retaining a small, bounded source-foot support. No joint IK is implied.
 *
 * Pure blend contract: only a verified, actively moving imported walking
 * action can suppress the cosmetic gait. Crossfades enter gradually; the
 * established share remains unchanged through stationary settling/guard
 * release so the overlay cannot swell just as the original walk freezes.
 * Injury, evasion, cast, strike, death, teleport, accessibility or invalid
 * source evidence always clear ownership; no authoritative movement changes.
 */
export function planNativeImportedLegOwnership({previous=1,mode='idle',
 sourceClipName='',sourceWeight=NaN,groundedMoving=false,settling=false,
 frameDelta=0,alive=true,teleport=false,reducedMotion=false}={}){
 if(!finite(previous)||previous<0||previous>1||!finite(frameDelta)||
  frameDelta<0||frameDelta>.35||alive!==true||teleport||reducedMotion)return 1;
 if(mode==='move'&&groundedMoving===true&&
  typeof sourceClipName==='string'&&/^(?:walking[_\s-]*a|walk|run)(?:$|[_\s-])/i.test(sourceClipName)&&
  finite(sourceWeight)&&sourceWeight>=0&&sourceWeight<=1){
  // The authentic 123-track Walking_A already keys hips, arms and all
  // imported leg joints. At full source weight it must own them completely:
  // even a 0.16 residual sine swings the real skinned shoe twice.
  // Match the original 180ms owner handoff to witnessed visible time,
  // never add another clip, touch source bind bones or move the grid root.
  const desired=1-sourceWeight;
  const cap=Math.min(1,frameDelta/.18);
  return clamp(desired,Math.max(0,previous-cap),Math.min(1,previous+cap));
 }
 // The original Walk -> Idle/Guard fade consumes the last valid planted
 // leg-support pose; do not ramp duplicated swing back up during that fade.
 if((mode==='idle'||mode==='guard')&&settling===true&&groundedMoving===false)
  return previous;
 return 1;
}

/**
 * Quiet final source root motion witnessed in original desktop/mobile WebGL:
 * ~3.9 / 7.4 mm during source Walking_A -> Idle. A strict 1.5mm stop threshold
 * misses the original shoe fade. Extend it only for low physical XZ velocity,
 * honest visible frame timing and a genuinely stopped walking authority owner.
 * NOT world-space IK or certified sole contact; no invented gameplay movement.
 */
export function planSourceWalkMicroArrival({groundedTravel=NaN,frameInterval=NaN,
 groundedMoving=false,visible=true,teleport=false,reducedMotion=false}={}){
 if(groundedMoving!==false||visible!==true||teleport||reducedMotion||
  !finite(groundedTravel)||groundedTravel<0)return false;
 if(groundedTravel<=.0015)return true;
 return groundedTravel<=.01&&finite(frameInterval)&&frameInterval>0&&
  frameInterval<=.35&&groundedTravel/frameInterval<=.35;
}

export function planImportedWalkArrivalFreeze({previousMode='idle',nextMode='idle',
 previousClipName='',groundedMoving=false,groundedTravel=NaN,
 frameInterval=NaN,teleport=false,reducedMotion=false,visible=true}={}){
 return previousMode==='move'&&['idle','guard'].includes(nextMode)&&
  typeof previousClipName==='string'&&/^(?:walking[_\s-]*a|walk|run|move)/i.test(previousClipName)&&
  planSourceWalkMicroArrival({groundedMoving,groundedTravel,
   frameInterval,teleport,reducedMotion,visible});
}


/**
 * A legitimate source attack/cast can interrupt Walking_A while the previous
 * 41-joint walking action is still crossfading into the new source clip.
 * When original renderer evidence proves the root has actually halted,
 * freeze ONLY that outgoing original walk phase, never the incoming native
 * sword, bow or spell clip. Do not assert a planted sole or alter authority.
 * Missing current action tick/owner, non-moving source evidence, teleport or
 * uncertain imported clip fails closed.
 */
export function planImportedCombatWalkStop({
 previousMode='idle',nextMode='idle',sourceClipName='',
 actionTick=null,ownerAuthorized=false,groundedMoving=false,
 groundedTravel=NaN,frameInterval=NaN,alive=true,visible=true,
 teleport=false,reducedMotion=false
}={}){
 return previousMode==='move'&&['attack','cast'].includes(nextMode)&&
  sourceClipName==='Walking_A'&&Number.isSafeInteger(actionTick)&&actionTick>=0&&
  ownerAuthorized===true&&alive===true&&
  finite(frameInterval)&&frameInterval>0&&frameInterval<=.5&&
  // A genuine zero-distance stop remains valid at the measured 360ms
  // original WebGL cadence; a drifting foot (>1.5mm) retains the much
  // stricter <=350ms micro-arrival velocity witness.
  finite(groundedTravel)&&groundedTravel>=0&&
  (groundedTravel<=.0015||frameInterval<=.35)&&
  planSourceWalkMicroArrival({groundedMoving,groundedTravel,
   frameInterval,visible,teleport,reducedMotion});
}

/** Same original source action, but a frame later: first finish genuinely
 * witnessed root movement, then stop the outgoing clip iff its starting
 * combat action tick still owns the pose and its source weight is positive. */
export function shouldFreezeDeferredImportedCombatWalk({
 targetMode='idle',currentMode='idle',clipName='',targetTick=null,
 currentTick=null,ownerAuthorized=false,sourceWeight=NaN,
 sourceRunning=false,sourcePaused=false,groundedMoving=false,
 groundedTravel=NaN,frameInterval=NaN,alive=true,visible=true,
 teleport=false,reducedMotion=false
}={}){
 return currentMode===targetMode&&
  Number.isSafeInteger(targetTick)&&targetTick>=0&&targetTick===currentTick&&
  finite(sourceWeight)&&sourceWeight>0&&sourceWeight<=1&&
  sourceRunning===true&&sourcePaused===false&&
  planImportedCombatWalkStop({previousMode:'move',nextMode:targetMode,
   sourceClipName:clipName,actionTick:currentTick,ownerAuthorized,
   groundedMoving,groundedTravel,frameInterval,alive,visible,
   teleport,reducedMotion});
}

/**
 * Real source walk fades can begin while the visual root still travels a few
 * centimetres. Freeze ONLY the outgoing licensed Walking_A clip after the
 * very first later visible idle/guard frame where the SAME root has stopped.
 * This does not impose world-space IK, authoritative movement or extra poses.
 */
export function shouldFreezeDeferredImportedWalk({
 targetMode='idle',currentMode='idle',clipName='',sourceWeight=NaN,
 sourceRunning=false,sourcePaused=false,groundedMoving=false,
 groundedTravel=NaN,frameInterval=NaN,alive=true,visible=true,teleport=false,reducedMotion=false
}={}){
 return ['idle','guard'].includes(targetMode)&&currentMode===targetMode&&
  typeof clipName==='string'&&/^(?:walking[_\s-]*a|walk|run)(?:$|[_\s-])/i.test(clipName)&&
  finite(sourceWeight)&&sourceWeight>0&&sourceWeight<=1&&
  sourceRunning===true&&sourcePaused===false&&alive===true&&
  planSourceWalkMicroArrival({groundedMoving,groundedTravel,frameInterval,
   visible,teleport,reducedMotion});
}


/** Tempo of only the original fading Walking_A, grounded in witnessed XZ
 * visual root movement; never IK, collision or authoritative foot motion. */
export function planImportedWalkExitBrake({
 targetMode='idle',currentMode='idle',clipName='',sourceWeight=NaN,
 sourceRunning=false,sourcePaused=false,groundedTravel=NaN,
 frameInterval=.016,alive=true,visible=true,teleport=false,reducedMotion=false
}={}){
 if(!['idle','guard'].includes(targetMode)||currentMode!==targetMode||
  typeof clipName!=='string'||
  !/^(?:walking[_\\s-]*a|walk|run)(?:$|[_\\s-])/i.test(clipName)||
  !finite(sourceWeight)||sourceWeight<=0||sourceWeight>1||
  sourceRunning!==true||sourcePaused!==false||
  !finite(groundedTravel)||groundedTravel<0||
  !finite(frameInterval)||frameInterval<=0||frameInterval>.35||
  alive!==true||visible!==true||teleport||reducedMotion)return null;
 // Preserve the earlier 40mm-per-16ms reference as 2.5 observed m/s.
 // A fading original Walking_A must not speed up at 20Hz or slow at 60Hz
 // for the same XZ root velocity; no root or source clip is rewritten.
 return clamp((groundedTravel/frameInterval)/2.5,0,1);
}

/**
 * Preserve the FINAL witnessed original Walking_A lower-body pose while its
 * stationary actor fades into the licensed Idle (or native defensive guard).
 * The existing source mixer still advances the full original skeleton.
 * Only six already-imported thigh/calf/ankle quaternions get a short,
 * reversible presentation handoff; this is NOT world-space sole IK.
 *
 * Never continue this landing through genuine travel, teleports, damage,
 * evasion, defeat, lost visibility, reduced motion or interrupted actions.
 */

/**
 * The original Walking_A -> Idle/Guard pelvis + six-leg landing, and lawful
 * Idle/Guard -> Walking_A re-entry, share a real rendered-frame clock.
 *
 * Earlier release timers consumed at most 50ms per frame even when software
 * WebGL spent 180-800ms presenting that frame. This held a frozen pelvis/sole
 * for seconds, long after the original 120/200ms source-mixer crossfade.
 * Use witnessed requestAnimationFrame elapsed time, capped to 250ms to avoid
 * skipping an entire recovery on one pathological render. Never invent a
 * gameplay tick, root step, foot plant, original clip or authority event.
 */
export function planNativeLandingVisibleDelta({
 frameDelta=0,frameInterval=frameDelta,visible=true,
 reducedMotion=false,teleport=false
}={}){
 if(visible!==true||reducedMotion||teleport||
  !finite(frameDelta)||frameDelta<0||frameDelta>.05||
  !finite(frameInterval)||frameInterval<=0||frameInterval>2)return 0;
 return Math.min(.25,frameInterval);
}

export function planSourceRigLandingRelease({mode='idle',sourceClipName='',
 sourceWalkFrozen=false,rootTravel=NaN,frameInterval=NaN,
 elapsed=NaN,moving=false,visible=true,alive=true,teleport=false,reducedMotion=false,
 interrupted=false}={}){
 if(!['idle','guard'].includes(mode)||sourceClipName!=='Idle'||
  sourceWalkFrozen!==true||!finite(elapsed)||
  elapsed<0||elapsed>2||alive!==true||interrupted||
  !planSourceWalkMicroArrival({groundedTravel:rootTravel,
   frameInterval,groundedMoving:moving,visible,teleport,reducedMotion}))return null;
 // Let the first authentic stopped foot frame stay planted, then release
 // smoothly to the independent, correctly clocked original Idle source.
 const t=clamp((elapsed-.03)/.17,0,1);
 return t*t*(3-2*t);
}

/**
 * One existing source Walking_A action has been paused at a REAL no-travel
 * move-to-guard crossfade. Do not instantly delete the reversible skinned
 * thigh/calf/ankle stride that was still supporting its planted foot.
 * Release it through the same bounded visible-frame deceleration as idle,
 * while the independently lawful native guard envelope gains ownership.
 * No root motion, new authority event, synthetic IK or source clip mutation.
 */

/**
 * Original skinned shoe vertices inherit the licensed pelvis parent.
 * Preserve the witnessed source hips during the existing <=200ms stationary
 * landing release, but only across bounded real imported transform changes.
 * No root movement, retarget, IK or authoritative step is implied.
 */
export function planSourceRigLandingPelvisSupport({
 release=NaN,sourcePelvis=false,localTravelMeters=NaN,angularTravelRadians=NaN
}={}){
 if(sourcePelvis!==true||![release,localTravelMeters,angularTravelRadians].every(finite)||
  release<0||release>1||localTravelMeters<0||localTravelMeters>.085||
  angularTravelRadians<0||angularTravelRadians>.4)return null;
 return release;
}

/**
 * The authentic walking clip can resume just as a witnessed, stationary
 * Walking_A -> Idle/Guard landing is still releasing its original pelvis and
 * six leg joints. Deleting that landing on move entry creates a one-frame
 * source shoe pop even when the actual root has travelled only millimetres.
 *
 * Hand off the last presented *licensed source* pose to Walking_A over a
 * measured <=120ms / <=120mm envelope. This NEVER locks a sole in world
 * space, changes locomotion or prolongs an attack, evasion, hurt or defeat.
 * Return null rather than infer anything from missing live source evidence.
 */
export function planSourceRigWalkReentryRelease({
 mode='idle',previousMode='idle',sourceClipName='',witnessedLanding=false,
 elapsed=NaN,rootTravelMeters=NaN,sourceWeight=NaN,moving=false,
 alive=true,visible=true,teleport=false,reducedMotion=false,interrupted=false
}={}){
 if(mode!=='move'||!['idle','guard'].includes(previousMode)||
  typeof sourceClipName!=='string'||
  !/^(?:walking[_\\s-]*a|walk|run)(?:$|[_\\s-])/i.test(sourceClipName)||
  witnessedLanding!==true||moving!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  ![elapsed,rootTravelMeters,sourceWeight].every(finite)||
  elapsed<0||elapsed>.5||rootTravelMeters<0||rootTravelMeters>.35||
  sourceWeight<=0||sourceWeight>1)return null;
 // Actual root translation may end this bridge *earlier* than time does.
 // Cumulative travel is measured only from genuine rendered actor positions.
 const t=clamp(Math.max(elapsed/.12,rootTravelMeters/.12),0,1);
 return t*t*(3-2*t);
}

export function planNativeWalkToGuardGait({mode='idle',sourceWalkFrozen=false,
 groundedMoving=false,groundedTravel=NaN,frameInterval=NaN,
 gaitWeight=0,guardBlend=0,alive=true,
 teleport=false,reducedMotion=false}={}){
 return mode==='guard'&&sourceWalkFrozen===true&&
  planSourceWalkMicroArrival({groundedTravel,frameInterval,groundedMoving,
   visible:true,teleport,reducedMotion})&&
  finite(gaitWeight)&&gaitWeight>0&&gaitWeight<=1&&
  finite(guardBlend)&&guardBlend>=0&&guardBlend<1&&
  alive===true&&!teleport&&!reducedMotion;
}

/**
 * Advance original walking crossfade WEIGHTS on actually displayed time,
 * without advancing the original Walking_A foot cycle by that same time.
 * Authentic 1440px/390px Chromium film shows sparse 360ms visible-frame
 * delivery: the old 50ms mixer step made an 180ms Idle -> Walking_A fade
 * span four rendered frames (up to ~1.4s on screen). We permit at most
 * 90ms of real mixer blending per witnessed frame, so two visible frames
 * can transfer ownership. The sole animation itself remains exclusively
 * distance-paced by planImportedLivingSourceStep and the per-action scale.
 * No new source clip, foot lock, gameplay displacement or authority tick.
 */
/**
 * The imported source Hit_A remains strictly pinned to the age of a genuine
 * same-actor positive-HP-loss event. Sparse, genuinely presented WebGL frames
 * must nevertheless let the source mixer CROSSFADE to the incoming injury:
 * advancing its weights by only the <=50ms source clock can hide most of the
 * original 41-joint flinch on a throttled desktop/mobile spectator.
 *
 * Spend at most 90ms on ONE visible mixer update, temporarily adjusting only
 * the active Hit_A action speed so its actual keyed bones consume exactly the
 * precomputed, HP-age-gated sourceStep. No new injury, authority tick, target,
 * foot plant, visual geometry, source bind mutation, or second mixer update.
 * Fails closed when original clip / event / timing evidence is incomplete.
 */
export function planImportedWitnessedHurtMixerFrame({
 mode='idle',sourceClipName='',verifiedInjury=false,age=NaN,
 sourceTime=NaN,sourceDuration=NaN,effectiveSpeed=NaN,
 sourceStep=NaN,frameDelta=NaN,frameInterval=frameDelta,
 visible=true,reducedMotion=false,teleport=false
}={}){
 if(mode!=='hurt'||sourceClipName!=='Hit_A'||verifiedInjury!==true||
  visible!==true||reducedMotion||teleport||
  ![age,sourceTime,sourceDuration,effectiveSpeed,sourceStep,
    frameDelta,frameInterval].every(finite)||
  age<0||age>=.55||sourceDuration<=.002||effectiveSpeed<=.001||
  sourceTime<0||sourceTime>age*effectiveSpeed+.002||
  sourceTime>=sourceDuration-.002||
  frameDelta<=0||frameDelta>.05||frameInterval<=0||frameInterval>.5||
  sourceStep<0||sourceStep>.0500001)return null;
 const mixerDelta=Math.min(.09,Math.max(frameDelta,frameInterval));
 return Object.freeze({
  source:'witnessed-original-Hit_A-clip-crossfade',
  mixerDelta,actionScale:sourceStep/mixerDelta,contactLocked:false
 });
}

export function planImportedWalkingMixerFrameDelta({mode='idle',walkingClip=false,
 frameDelta=0,frameInterval=frameDelta,sourceStep=NaN,sourceDuration=NaN,
 sourceTime=NaN,effectiveSpeed=NaN,groundedTravel=NaN,groundedMoving=false,
 visible=true,reducedMotion=false,teleport=false}={}){
 const ordinary=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 if(mode!=='move'||walkingClip!==true||visible!==true||reducedMotion||teleport||
  ![frameDelta,frameInterval,sourceStep,sourceDuration,sourceTime,effectiveSpeed,
    groundedTravel].every(finite)||frameDelta<=0||frameDelta>.05||
  frameInterval<=0||frameInterval>2||sourceStep<0||sourceStep>.28||
  sourceDuration<=.002||sourceTime<0||effectiveSpeed<=.001||
  groundedTravel<0||groundedTravel>.54||
  (groundedMoving!==true&&!(groundedMoving===false&&
    sourceStep===0&&groundedTravel<=.0015&&frameInterval<=.5)))return ordinary;
 return Math.min(.09,Math.max(ordinary,frameInterval));
}

export function planImportedWalkingBlendRate({mode='idle',sourceStep=0,
 frameDelta=0,frameInterval=frameDelta,sourceDuration=0,sourceTime=0,
 effectiveSpeed=1,walkingClip=false,groundedMoving=false,groundedTravel=0,
 teleport=false,reducedMotion=false,visible=true}={}){
 const visibleStep=planImportedWalkingMixerFrameDelta({
  mode,walkingClip,frameDelta,frameInterval,sourceStep,sourceDuration,
  sourceTime,effectiveSpeed,groundedTravel,groundedMoving,
  visible,reducedMotion,teleport
 });
 if(mode!=='move'||!walkingClip||teleport||reducedMotion||
  visible!==true||visibleStep<=0||
  ![sourceStep,frameInterval,sourceDuration,sourceTime,effectiveSpeed,groundedTravel].every(finite)||
  sourceStep<0||sourceStep>.28||frameInterval<=0||
  sourceDuration<=.002||sourceTime<0||effectiveSpeed<=.001||
  groundedTravel<0||groundedTravel>.54)return null;
 // Still give the THREE.AnimationMixer one real visible-time update to
 // complete the lawful original crossfade, but temporarily time-scale
 // ONLY the verified stationary native walking action to zero. Its
 // original knees/ankles remain stopped, never inventing root travel.
 if(groundedMoving!==true)
  return groundedMoving===false&&groundedTravel<=.0015&&
   frameInterval<=.5&&sourceStep===0?0:null;
 return sourceStep/visibleStep;
}

/**
 * Rejoin the original Walking_A keyframes on the same real left/right planted
 * foot as the distance-paced original-world ground stamps and joint overlays.
 * The mixer will advance this rendered frame's distance ONCE after re-entry.
 * No continuous seeking, assumed sole geometry or invented movement.
 */
/**
 * A long *genuine* root step may need more than the permitted 280ms of native
 * Walking_A playback. If the source clip was in phase before that step, the
 * cap leaves its ankles behind the already-advanced real grounded footfall.
 * Align only the missed fraction within this SAME displayed travel frame.
 * Never wind the native feet forward on planted/hidden/teleported frames.
 *
 * This is bounded source-clip retiming, NOT IK or evidence of sole contact.
 * Reject source/foot phases that were already unrelated rather than seeking
 * arbitrary animation frames. The existing mixer still evaluates once.
 */
export function planImportedWalkingContinuity({mode='idle',continuous=false,
 sourceTime=0,sourceDuration=0,effectiveSpeed=1,sourceStep=0,
 groundedTravel=NaN,footPhase=NaN,groundedMoving=false,walkingClip=false,
 frameInterval=0,visible=true,teleport=false,reducedMotion=false}={}){
 if(mode!=='move'||continuous!==true||!groundedMoving||!walkingClip||
  teleport||reducedMotion||visible!==true||
  ![sourceTime,sourceDuration,effectiveSpeed,sourceStep,groundedTravel,footPhase,frameInterval].every(finite)||
  sourceDuration<=.002||sourceDuration>10||sourceTime<0||sourceTime>sourceDuration+.002||
  effectiveSpeed<=.001||sourceStep<0||sourceStep>.28||frameInterval<=0||
  groundedTravel<=.003||groundedTravel>.54||footPhase<0||footPhase>1)return null;
 const needed=groundedTravel/1.06*sourceDuration/effectiveSpeed;
 // A normal 60Hz step already reached the stamped native phase. Only a
 // genuinely capped movement frame is allowed to seek a source skeleton.
 if(needed-sourceStep<=.02||Math.abs(sourceStep-.28)>.00001)return null;
 const cycle=x=>((x%1)+1)%1;
 const priorExpected=cycle(footPhase-groundedTravel/1.06);
 const priorActual=cycle(sourceTime/sourceDuration);
 const cyclicError=Math.min(Math.abs(priorExpected-priorActual),
  1-Math.abs(priorExpected-priorActual));
 if(cyclicError>.025)return null;
 const projected=cycle((sourceTime+sourceStep*effectiveSpeed)/sourceDuration);
 const missing=cycle(footPhase-projected);
 const expectedMissing=(needed-sourceStep)*effectiveSpeed/sourceDuration;
 // Reject a phase wrap that would reverse or skip too much source animation.
 // A legal .53m movement at original speed 1.25 needs only .164 of a cycle.
 if(missing<.018||missing>.20||Math.abs(missing-expectedMissing)>.025)return null;
 const start=cycle(sourceTime/sourceDuration+missing)*sourceDuration;
 return Number.isFinite(start)?start:null;
}

export function planImportedWalkingEntryPhase({mode='idle',previousMode='idle',
 sourceDuration=0,effectiveSpeed=1,frameDelta=.016,frameInterval=frameDelta,
 visible=true,footPhase=NaN,groundedTravel=NaN,groundedMoving=false,
 walkingClip=false,teleport=false,reducedMotion=false}={}){
 if(mode!=='move'||previousMode==='move'||groundedMoving!==true||
  walkingClip!==true||teleport||reducedMotion||visible!==true||
  ![sourceDuration,effectiveSpeed,frameDelta,frameInterval,footPhase,groundedTravel].every(finite)||
  sourceDuration<=.002||sourceDuration>10||effectiveSpeed<=.001||
  frameDelta<=0||frameInterval<=0||
  footPhase<0||footPhase>1||groundedTravel<=.003||groundedTravel>.54)return null;
 // Three.js caps source travel to 280ms per visible frame. The earlier
 // walking-entry seek subtracted UNBOUNDED root distance from a stamped
 // footfall, then mixer.update() advanced only the capped source time.
 // On a legal .53m visible step this left source ankles as much as 16.4%
 // of the original cycle out of phase with real grounded leg overlays.
 // Use the EXACT step the source planner will apply this frame, including
 // clip speed, bound, visibility and teleport checks. No second mixer step,
 // fake footprint, root motion or joint alteration is introduced here.
 const step=planImportedLivingSourceStep({mode:'move',sourceTime:0,
  sourceDuration,effectiveSpeed,frameDelta,frameInterval,
  reducedMotion,visible,groundedTravel,groundedMoving,walkingClip,teleport});
 const sourceCycleAdvance=step*effectiveSpeed/sourceDuration;
 const previousPhase=footPhase-sourceCycleAdvance;
 // Floating-point subtraction of two exactly equal stride fractions must
 // not wrap zero to the last Walking_A keyframe.
 const phase=Math.abs(previousPhase)<1e-10?0:((previousPhase%1+1)%1);
 return phase*sourceDuration;
}

export function planImportedDeathSourceStep({mode='idle',sourceTime=0,
 sourceDuration=0,effectiveSpeed=1,frameDelta=0,frameInterval=0,
 reducedMotion=false,visible=true}={}){
 const ordinary=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 if(mode!=='defeat'||reducedMotion||visible!==true||
  ![sourceTime,sourceDuration,effectiveSpeed,frameInterval].every(finite)||
  sourceDuration<=0||sourceTime<0||effectiveSpeed<=.001||frameInterval<0)
  return ordinary;
 const remaining=Math.max(0,(sourceDuration-sourceTime)/effectiveSpeed);
 return Math.min(remaining,Math.max(ordinary,clamp(frameInterval,0,.28)));
}

/**
 * Imported skinned source clips and reversible native full-body overlays must
 * share one witnessed clock. Slow browser frames can advance mixer time by
 * only 50ms even while the real event has moved into recovery. This bounded
 * source-time correction cannot change a hit, target, authority tick or grip.
 * It may catch up to a witnessed action age, but must never scrub an
 * unbroken imported clip backwards: only a new legal action can reset it.
 */
export function planImportedOneShotPhase({mode='idle',actionTick=null,age=0,sourceTime=0,
 sourceDuration=0,effectiveSpeed=1,frameDelta=0,reducedMotion=false}={}){
 const invalid=Object.freeze({valid:false,align:false,startTime:0,driftSeconds:0,remainingSeconds:0});
 if(reducedMotion||!['attack','cast','hurt'].includes(mode)||
  !Number.isSafeInteger(actionTick)||actionTick<0||
  ![age,sourceTime,sourceDuration,effectiveSpeed,frameDelta].every(Number.isFinite)||
  age<0||sourceTime<0||sourceDuration<=.002||effectiveSpeed<=.001||frameDelta<0)return invalid;
 const ceiling=Math.max(0,sourceDuration-.002);
 const step=Math.min(.28,frameDelta),advance=step*effectiveSpeed;
 const target=Math.min(ceiling,age*effectiveSpeed);
 const projected=Math.min(ceiling,sourceTime+advance);
 const driftSeconds=(target-projected)/effectiveSpeed;
 // Rewinding an active mixer creates abrupt reverse wrist/weapon/foot poses.
 // New legal events already reset their clip in changeAction; ordinary
 // source-age drift may only advance an uninterrupted clip.
 // A phase seek and the mixer step share ONE total visible-frame budget:
 // neither may sneak a second 125ms jump past the 280ms source-pose cap.
 const spareBudget=Math.max(0,.28-step);
 const align=driftSeconds>.028&&spareBudget>0;
 const correctionSeconds=align?Math.min(.125,driftSeconds,spareBudget):0;
 const startTime=Math.max(0,Math.min(ceiling,sourceTime+correctionSeconds*effectiveSpeed));
 const remainingSeconds=(target-Math.min(ceiling,startTime+advance))/effectiveSpeed;
 return {valid:true,align,startTime,driftSeconds,remainingSeconds};
}
