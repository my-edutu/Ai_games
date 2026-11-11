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
 toeWorldY=NaN,heelWorldY=NaN,floorTopY=NaN,trials=[]
}={}){
 if(![toeWorldY,heelWorldY,floorTopY].every(finite)||
  Math.abs(floorTopY+.02)>.005||!Array.isArray(trials)||trials.length>4||
  heelWorldY-floorTopY<.075||heelWorldY-floorTopY>.28||
  toeWorldY-floorTopY>=-.01||toeWorldY-floorTopY<-.16)return null;
 let best=null;
 for(const entry of trials){
  const {signed,toe,heel}=entry??{};
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
  beforeToeY-floorTopY>=-.025||
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
 * Requires an actual positive skinned-toe response after licensed ankle aid. */
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
  trialLift<.008||trialLift>.075||trialHeelClear<.055||
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
export function selectOriginalSourceSwingCalfTrial({
 afterAnkleToeY=NaN,afterAnkleHeelY=NaN,floorTopY=NaN,trials=[]
}={}){
 if(![afterAnkleToeY,afterAnkleHeelY,floorTopY].every(finite)||
  Math.abs(floorTopY+.02)>.005||!Array.isArray(trials)||trials.length>4||
  afterAnkleToeY-floorTopY>-.02||afterAnkleToeY-floorTopY<-.16||
  afterAnkleHeelY-floorTopY<.065||afterAnkleHeelY-floorTopY>.34)return null;
 let best=null;
 for(const trial of trials){
  const {signed,toe,heel}=trial??{};
  if(![signed,toe,heel].every(finite)||
   Math.abs(signed)<.09||Math.abs(signed)>.21||
   toe-afterAnkleToeY<.008||toe-afterAnkleToeY>.075||
   heel-floorTopY<.055||heel-floorTopY>.36||
   Math.abs(heel-afterAnkleHeelY)>.06)continue;
  if(!best||toe>best.toe)best={signed,toe,heel};
 }
 return best;
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
 * Once an original licensed Idle skinned-shoe pose is calibrated to the
 * measured stone-top Y, the regular full-body presentation frame must retain
 * that ONE attachment offset. Recomputing visualPivot.position each frame
 * previously erased the ground placement, recreating a measured ~23cm hover.
 * Compose from the independent current-frame performance Y (never prior
 * pivot.position.y): this is non-accumulating and does not move simulation.
 */
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
  if(reducedMotion||visible!==true||teleport||groundedMoving!==true||
   walkingClip!==true||
   ![sourceDuration,effectiveSpeed,sourceTime,frameInterval,groundedTravel].every(finite)||
   sourceDuration<=.002||effectiveSpeed<=.001||sourceTime<0||
   frameInterval<=0||groundedTravel>.54)return ordinary;
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

export function planImportedWalkingBlendRate({mode='idle',sourceStep=0,
 frameDelta=0,frameInterval=frameDelta,sourceDuration=0,sourceTime=0,
 effectiveSpeed=1,walkingClip=false,groundedMoving=false,groundedTravel=0,
 teleport=false,reducedMotion=false,visible=true}={}){
 const visibleStep=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 if(mode!=='move'||!walkingClip||!groundedMoving||teleport||reducedMotion||
  visible!==true||visibleStep<=0||
  ![sourceStep,frameInterval,sourceDuration,sourceTime,effectiveSpeed,groundedTravel].every(finite)||
  sourceStep<0||sourceStep>.28||frameInterval<=0||
  sourceDuration<=.002||sourceTime<0||effectiveSpeed<=.001||
  groundedTravel<0||groundedTravel>.54)return null;
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
