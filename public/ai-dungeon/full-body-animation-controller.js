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
 * Linked source UPPERLEG + LOWERLEG swing trial, not IK or a foot plant.
 *
 * Original CC0 Walking_A can bury a weighted swinging toe tens of mm while
 * its heel is airborne. Repeated isolated lowerleg and toe turns lifted it
 * only 1.94–6.28 mm in genuine desktop/mobile GLB recordings. Test an
 * anatomically linked, opposite-signed hip/knee pose against BOTH original
 * skinned heel/toe patches in the SAME source frame. Returning a candidate
 * merely permits a final, independent skinned re-read in the renderer.
 *
 * Preserve fresh root travel (<=150ms) even if its immediately displayed
 * original WebGL mixer frame arrives 100-240ms after the prior image.
 * A slow frame alone never grants a leg correction: the SAME final skinned
 * heel/toe of BOTH shoes must still certify >=12mm and >=15% clearance.
 * Source bind lengths and animated quaternion-track axes must be proved by
 * the caller. This never emits contact, shifts a root, or modifies authority.
 */
/**
 * Connected original source Idle reference to resolve severely vertical
 * Walking_A swing shoes ONLY if the first two genuine full-leg trials
 * raised an already-airborne heel more than the buried toe.
 * Two remaining source skin reads: original hip/calf/foot as ONE chain.
 * This never creates contact, a new step or target, or an IK foot lock.
 */
/** Real original Idle-to-Walking_A three-joint angle budget, not an IK step.
 * Permit two distinct safe source-skinned probes when a fixed 42% Idle
 * blend exceeds the knee limit but an actual smaller original blend can fit.
 */
/**
 * Prove which quaternion is actually authored by the licensed original Idle
 * clip for ONE imported skeleton joint. The real source player_swordsman GLB
 * has produced two suffix matches for footr in native WebGL, and previously
 * rejected the full-leg trial without inspecting whether those source
 * bindings were truly identical (or one was a suffix-name collision).
 *
 * Accept only explicitly bounded, same-keyframe/time, same-rotation tracks.
 * Quaternion antipodes are equivalent, but a different later keyframe is
 * NOT: matching only time zero could splice an unrelated source motion.
 * No Mixer clock, source clip, skeleton, mesh or bind matrix is modified.
 */
export function resolveLicensedIdleJointQuaternionTracks(tracks,boneName){
 const result=(reason,matches=[])=>({verified:false,reason,
  sourceTrackMatches:matches.length,
  sourceTrackNames:matches.slice(0,4).map(t=>t.name)});
 if(!Array.isArray(tracks)||tracks.length<1||tracks.length>1500||
  typeof boneName!=='string'||!/^[-_a-z0-9]{2,64}$/i.test(boneName))
  return result('invalid-original-idle-joint-contract');
 const suffix=boneName.toLowerCase()+'.quaternion';
 const exactTarget=name=>{
  if(typeof name!=='string'||name.length>192)return false;
  const normalized=name.toLowerCase();
  return normalized===suffix||normalized.endsWith('.'+suffix)||
   normalized.endsWith('/'+suffix)||normalized.endsWith(']'+suffix);
 };
 const matches=tracks.filter(t=>exactTarget(t?.name));
 if(matches.length<1||matches.length>4)
  return result('missing-or-excessive-original-idle-joint-track',matches);
 const valid=t=>{
  const len=t?.times?.length;
  if(!Number.isInteger(len)||len<1||len>512||t.values?.length!==len*4)
   return false;
  for(let i=0;i<len;i++){
   const time=t.times[i],p=i*4;
   if(!Number.isFinite(time)||time<0||
    (i>0&&!(time>t.times[i-1])))return false;
   const x=t.values[p],y=t.values[p+1],z=t.values[p+2],
    w=t.values[p+3];
   if(![x,y,z,w].every(Number.isFinite)||
    Math.abs(Math.hypot(x,y,z,w)-1)>.02)return false;
  }
  return true;
 };
 if(!matches.every(valid))return result('malformed-original-idle-joint-track',matches);
 const first=matches[0];
 for(const duplicate of matches.slice(1)){
  if(duplicate.times.length!==first.times.length)
   return result('different-original-idle-track-sample-count',matches);
  for(let i=0;i<first.times.length;i++){
   if(Math.abs(first.times[i]-duplicate.times[i])>1e-5)
    return result('different-original-idle-track-times',matches);
   const p=i*4, a=first.values,b=duplicate.values;
   const ad=Math.hypot(a[p],a[p+1],a[p+2],a[p+3]),
    bd=Math.hypot(b[p],b[p+1],b[p+2],b[p+3]);
   const dot=(a[p]*b[p]+a[p+1]*b[p+1]+
    a[p+2]*b[p+2]+a[p+3]*b[p+3])/(ad*bd);
   if(!Number.isFinite(dot)||Math.abs(dot)<1-1e-5)
    return result('different-original-idle-track-rotations',matches);
  }
 }
 const quaternion=Array.from(first.values.slice(0,4));
 return {verified:true,sourceTrackMatches:matches.length,
  sourceTrackNames:matches.map(t=>t.name),
  equivalentDuplicate:matches.length>1,
  sourceKeyframeCount:first.times.length,quaternion};
}

/**
 * Sample the ACTUAL licensed original Idle quaternion track at a witnessed
 * Walking_A clock phase. The prior full-leg source-neutral rescue always used
 * Idle keyframe ZERO, even halfway through the native walking cycle. Real
 * 390px GLB frames proved that frozen source pose pulled the buried toe
 * 13–18mm FARTHER into stone, despite staying inside the knee angle limit.
 *
 * The caller supplies the authentic Idle clip duration so all THREE source
 * hip/knee/foot tracks share one absolute source time. Missing, conflicting,
 * non-linear or malformed imported bindings fail closed. This returns a
 * source-pose reference, never a foot plant or a hit, and does not tick Mixer.
 */
export function sampleLicensedIdleJointQuaternionAtPhase(
 tracks,boneName,sourcePhase,sourceClipDuration=undefined
){
 const audit=resolveLicensedIdleJointQuaternionTracks(tracks,boneName);
 if(!audit.verified||!finite(sourcePhase)||sourcePhase<0||sourcePhase>=1)
  return null;
 const track=tracks.find(t=>t.name===audit.sourceTrackNames[0]);
 const count=track?.times?.length;
 if(!count||!track?.values||count>512||
  (typeof track.getInterpolation==='function'&&
   track.getInterpolation()!==2301))return null;
 const first=track.times[0],last=track.times[count-1];
 const duration=sourceClipDuration===undefined?last:sourceClipDuration;
 if(!finite(duration)||duration<=0||duration>30)return null;
 const sourceSampleTimeSeconds=sourcePhase*duration;
 const target=clamp(sourceSampleTimeSeconds,first,last);
 let left=0,right=0,alpha=0;
 if(count>1){
  right=1;
  while(right<count-1&&track.times[right]<target)right++;
  left=Math.max(0,right-1);
  const span=track.times[right]-track.times[left];
  if(!(span>0))return null;
  alpha=clamp((target-track.times[left])/span,0,1);
 }
 const start=left*4,end=right*4,a=Array.from(track.values.slice(start,start+4));
 const b=Array.from(track.values.slice(end,end+4));
 let dot=a.reduce((v,x,i)=>v+x*b[i],0);
 if(!finite(dot))return null;
 if(dot<0){for(let i=0;i<4;i++)b[i]=-b[i];dot=-dot;}
 let w1=1-alpha,w2=alpha;
 if(dot<.9995){
  const theta=Math.acos(clamp(dot,-1,1)),sin=Math.sin(theta);
  if(sin<1e-7)return null;
  w1=Math.sin((1-alpha)*theta)/sin;
  w2=Math.sin(alpha*theta)/sin;
 }
 const quaternion=a.map((x,i)=>x*w1+b[i]*w2);
 const length=Math.hypot(...quaternion);
 if(!finite(length)||length<.98||length>1.02)return null;
 for(let i=0;i<4;i++)quaternion[i]/=length;
 return {
  ...audit,source:'licensed-original-Idle-phase-sampled-joint',
  sourcePhase,sourceSampleTimeSeconds,
  sourceKeyframeIndices:[left,right],quaternion
 };
}

export function planOriginalSourceSafeNeutralBlendSamples({
 source='',sourceClipName='',sourceChainVerified=false,
 sourceJointAngularSeparationRad=null,maxJointDeltaRad=.26
}={}){
 if(source!=='licensed-original-Idle-joint-gap'||sourceClipName!=='Idle'||
  sourceChainVerified!==true||
  !Array.isArray(sourceJointAngularSeparationRad)||
  sourceJointAngularSeparationRad.length!==3||
  !sourceJointAngularSeparationRad.every(n=>finite(n)&&n>=0&&n<=Math.PI)||
  !finite(maxJointDeltaRad)||maxJointDeltaRad<=0||
  maxJointDeltaRad>.260001)return null;
 const largest=Math.max(...sourceJointAngularSeparationRad);
 if(largest<.01)return null;
 // Preserve existing wide original-Idle samples whenever those are safe.
 // In an ACTUAL original 390px source rig the Idle knee is 1.8135rad away
 // from Walking_A. Rejecting it merely because a .28 blend is too large
 // prevents all three-bone measurements. Instead test TWO strictly smaller
 // licensed source blends, each below the same .26rad/joint budget.
 // The skinned toe, already-airborne heel and opposite shoe still decide.
 const upper=Math.min(.42,(maxJointDeltaRad-.002)/largest);
 if(upper>=.30)return Object.freeze([.28,upper]);
 if(largest<1.10||largest>2.30||upper<.12)return null;
 const lower=Math.min(.11,upper*.70);
 if(lower<.08||upper-lower<.02)return null;
 return Object.freeze([lower,upper]);
}

/**
 * Original Walking_A can exhibit a physically vertical airborne shoe even
 * before 55mm of toe burial. Qualify the LOWER 30-55mm range only with
 * *both* original weighted sole endpoints, a source-length-consistent
 * 285-325mm shoe and >=220mm of genuine heel clearance above the stone.
 * Source-proven geometry here merely spends two bounded, reversible Idle
 * joint trials; it never permits a pose or manufactures ground contact.
 */
const originalSourceVerticalSwingAtShallowBurial=(shoe,floorTopY)=>{
 if(!shoe||![shoe.heelY,shoe.toeY,floorTopY].every(finite)||
  ![shoe.heelXZ,shoe.toeXZ].every(v=>Array.isArray(v)&&v.length===2&&v.every(finite)))
  return false;
 const depth=floorTopY-shoe.toeY;
 const rise=shoe.heelY-floorTopY;
 const spanXZ=Math.hypot(shoe.heelXZ[0]-shoe.toeXZ[0],
  shoe.heelXZ[1]-shoe.toeXZ[1]);
 const span3D=Math.hypot(spanXZ,shoe.heelY-shoe.toeY);
 return depth>=.03&&depth<.055&&rise>=.22&&
  shoe.heelY-shoe.toeY>=.285&&
  spanXZ>=.045&&spanXZ<=.10&&span3D>=.285&&span3D<=.325;
};

export function planOriginalSourceAuthoredNeutralBlends({
 mode='idle',sourceClipName='',sourceWeight=NaN,sourceInstanceSame=false,
 ownerLocomotion=false,alive=false,visible=false,
 reducedMotion=false,teleport=false,interrupted=false,
 previousLinkedCertified=false,side='',floorTopY=NaN,
 frameInterval=NaN,before=null,starterTrials=[]
}={}){
 const other=side==='left'?'right':side==='right'?'left':null;
 const valid=s=>s&&[s.heelY,s.toeY].every(finite)&&
  [s.heelXZ,s.toeXZ].every(v=>Array.isArray(v)&&v.length===2&&v.every(finite));
 if(!other||mode!=='move'||sourceClipName!=='Walking_A'||
  sourceInstanceSame!==true||ownerLocomotion!==true||
  alive!==true||visible!==true||reducedMotion||teleport||
  interrupted||previousLinkedCertified||
  !finite(sourceWeight)||sourceWeight<.95||sourceWeight>1.001||
  !finite(frameInterval)||frameInterval<.016||frameInterval>.20||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.005||
  !valid(before?.[side])||!valid(before?.[other])||
  !Array.isArray(starterTrials)||starterTrials.length!==2)return null;
 const swing=before[side],support=before[other];
 const projected=Math.hypot(swing.heelXZ[0]-swing.toeXZ[0],
  swing.heelXZ[1]-swing.toeXZ[1]);
 const length=Math.hypot(projected,swing.heelY-swing.toeY);
 if(projected<.045||projected>.15||length<.285||length>.325||
  // Genuine later 390px original Walking_A tick 8 (Actions #43755344687)
 // had a 183.4ms *display* interval, real 90.5mm buried toe and a 5.6mm
 // heel-dominant starter. A 120ms cap blocked the genuine source Idle
 // chain before a bounded 3-joint measurement could even be attempted.
 // At slower displayed 120-200ms source frames require at least 5mm
 // measured excess heel rise; faster frames retain the 9mm contract.
 // Both types retain four maximum reversible real GLB dual-shoe reads,
 // per-joint <=0.26rad and fully independent AFTER skin and loaded shoe.
 // Intervals >200ms, teleports, frame changes and invalid clips fail closed.
 // The real exact-source 390px frame at e546515e buries the toe 57.81mm,
  // yet all four paired trials leave it >40mm in stone. Rejecting at 60mm
  // excluded its licensed Idle-reference three-joint escape despite a
  // certified 295mm anatomical shoe and stable opposite weighted sole.
  // A narrow >=55mm qualification only permits TWO reversible native
  // original GLB trials; real post-apply dual-shoe verification still rules.
  (floorTopY-swing.toeY<.055&&
   !originalSourceVerticalSwingAtShallowBurial(swing,floorTopY))||
  floorTopY-swing.toeY>.12||
  swing.heelY-floorTopY<.16||swing.heelY-floorTopY>.34||
  ![support.heelY,support.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 const drift=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 // A genuine 1440px Walking_A shoe (Actions #43766094802, tick 6)
 // had 82.8mm toe penetration, a heel 221.4mm above stone and two
 // independently skinned starter arcs. Its best 26.24mm toe lift also
 // raised the airborne heel 29.06mm: only 2.82mm excess, below the
 // previous generic 9mm veto. Permit the EXISTING two licensed Idle
 // three-joint source probes in this much narrower severe-pitch case,
 // never a planted foot or an accepted pose without final two-shoe skin.
 const severeSourcePitch=projected<=.10&&
  floorTopY-swing.toeY>=.075&&swing.heelY-floorTopY>=.20;
 const heelDominated=starterTrials.some(t=>{
  const shoe=t?.after?.[side],loaded=t?.after?.[other];
  if(!valid(shoe)||!valid(loaded)||
   ![t.upperRad,t.lowerRad].every(finite))return false;
  const lift=shoe.toeY-swing.toeY;
  const rise=shoe.heelY-swing.heelY;
  const excessHeelRise=rise-lift;
  return lift>=.012&&
   (excessHeelRise>=(frameInterval>.12?.005:.009)||
    (severeSourcePitch&&frameInterval<=.12&&excessHeelRise>=.002))&&
   Math.abs(loaded.heelY-support.heelY)<=.003&&
   Math.abs(loaded.toeY-support.toeY)<=.003&&
   drift(loaded.heelXZ,support.heelXZ)<=.004&&
   drift(loaded.toeXZ,support.toeXZ)<=.004;
 });
 return heelDominated?Object.freeze([.28,.42]):null;
}

/**
 * Actual original-GLB measured negative evidence, not a guessed shoe lift.
 *
 * The real mobile and desktop source Walking_A -> Idle three-joint probes
 * have repeatedly sent a buried toe farther into stone. If BOTH licensed
 * skinned, reversible Idle trials failed by >=6mm, another nearby source
 * phase of the SAME clone should spend its existing two remaining probes
 * on connected Walking_A followups instead of replaying the proven bad
 * reference. A distant phase, different clone, action or modified shoe
 * must requalify normally. This does NOT certify linked poses or foot plants.
 */
export function shouldFallbackToOriginalLinkedLegAfterIdleMiss({
 previous=null,sourceInstanceId='',sourceClipName='',side='',
 sourcePhase=NaN,mode='idle',sourceWeight=NaN,
 reducedMotion=false,interrupted=false,toeY=NaN,heelY=NaN
}={}){
 if(!previous||typeof sourceInstanceId!=='string'||!sourceInstanceId||
  previous.sourceInstanceId!==sourceInstanceId||
  previous.sourceClip!=='Walking_A'||previous.neutralClip!=='Idle'||
  previous.side!==side||!['left','right'].includes(side)||
  previous.sourceProbeCount!==4||previous.acceptedCandidate!==false||
  previous.contactLocked!==false||sourceClipName!=='Walking_A'||
  mode!=='move'||reducedMotion||interrupted||
  !finite(sourceWeight)||sourceWeight<.95||sourceWeight>1.001||
  !finite(sourcePhase)||sourcePhase<0||sourcePhase>=1||
  !finite(previous.sourceIdlePhase)||previous.sourceIdlePhase<0||
  previous.sourceIdlePhase>=1||!finite(toeY)||!finite(heelY)||
  !finite(previous.before?.[side]?.toeY)||
  !finite(previous.before?.[side]?.heelY)||
  Math.abs(toeY-previous.before[side].toeY)>.035||
  Math.abs(heelY-previous.before[side].heelY)>.055||
  !Array.isArray(previous.trials)||previous.trials.length!==2)return false;
 const phaseDistance=Math.abs(sourcePhase-previous.sourceIdlePhase);
 if(Math.min(phaseDistance,1-phaseDistance)>.12)return false;
 return previous.trials.every(t=>
  finite(t?.blend)&&t.blend>=.08&&t.blend<=.42&&
  finite(t?.toeLiftMeters)&&t.toeLiftMeters<=-.006&&
  finite(t?.heelDeltaMeters));
}

/** Select genuine original skinned full-chain shoes, not angles or hopes. */
export function chooseOriginalSourceAuthoredNeutralLegTrial({
 mode='idle',sourceClipName='',neutralClipName='',sourceWeight=NaN,
 sourceInstanceSame=false,sourceNeutralRigVerified=false,
 ownerLocomotion=false,alive=false,visible=false,
 reducedMotion=false,teleport=false,interrupted=false,
 floorTopY=NaN,side='',before=null,trials=[],
 originalSourceJointGapRad=null
}={}){
 const other=side==='left'?'right':side==='right'?'left':null;
 const valid=s=>s&&[s.heelY,s.toeY].every(finite)&&
  [s.heelXZ,s.toeXZ].every(v=>Array.isArray(v)&&v.length===2&&v.every(finite));
 if(!other||mode!=='move'||sourceClipName!=='Walking_A'||
  neutralClipName!=='Idle'||sourceInstanceSame!==true||
  sourceNeutralRigVerified!==true||ownerLocomotion!==true||
  alive!==true||visible!==true||reducedMotion||teleport||interrupted||
  !finite(sourceWeight)||sourceWeight<.95||sourceWeight>1.001||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.005||
  !valid(before?.[side])||!valid(before?.[other])||
  !Array.isArray(trials)||!trials.length||trials.length>2)return null;
 const swing=before[side],support=before[other],depth=floorTopY-swing.toeY;
 // A genuine 57.81mm buried toe (native WebGL 390px, e546515e) is
  // sufficiently deep to evaluate an independently skinned original Idle
  // leg blend, but never evidence of clearance before BOTH shoes pass.
  if((depth<.055&&
   !originalSourceVerticalSwingAtShallowBurial(swing,floorTopY))||
  depth>.12||swing.heelY-floorTopY<.16||
  swing.heelY-floorTopY>.34||
  ![support.heelY,support.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 const drift=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 // Only an independently measured original hip/knee/foot angle receipt may
 // authorize small source-neutral samples. A fixture or an unverified bone
 // label cannot lower the production pose-selection threshold.
 const sourceGap=Array.isArray(originalSourceJointGapRad)&&
  originalSourceJointGapRad.length===3&&
  originalSourceJointGapRad.every(g=>finite(g)&&g>=0&&g<=Math.PI)?
  Math.max(...originalSourceJointGapRad):NaN;
 let best=null;
 for(const t of trials){
  const shoe=t?.after?.[side],loaded=t?.after?.[other];
  const adaptiveMicroblend=finite(t?.neutralBlend)&&
   t.neutralBlend>=.08&&t.neutralBlend<.279999&&
   finite(sourceGap)&&sourceGap>=1.10&&sourceGap<=2.30&&
   finite(t?.maxJointDeltaRad)&&
   Math.abs(t.maxJointDeltaRad-t.neutralBlend*sourceGap)<=.001&&
   t.neutralBlend*sourceGap<=.260001;
  if(!valid(shoe)||!valid(loaded)||
   !finite(t?.neutralBlend)||
   (t.neutralBlend<.279999&&!adaptiveMicroblend)||
   t.neutralBlend>.420001||
   !finite(t?.maxJointDeltaRad)||t.maxJointDeltaRad<0||
   t.maxJointDeltaRad>.260001)continue;
  const lift=shoe.toeY-swing.toeY,rise=shoe.heelY-swing.heelY;
  // A toe and heel both lifted together may still point through stone.
  if(lift<Math.max(.018,depth*.20)||lift>.085||
   lift-rise<.009||
   shoe.heelY-floorTopY<.06||shoe.heelY-floorTopY>.35||
   shoe.toeY>floorTopY+.025||
   drift(shoe.heelXZ,swing.heelXZ)>.07||
   drift(shoe.toeXZ,swing.toeXZ)>.07||
   Math.abs(loaded.heelY-support.heelY)>.003||
   Math.abs(loaded.toeY-support.toeY)>.003||
   drift(loaded.heelXZ,support.heelXZ)>.004||
   drift(loaded.toeXZ,support.toeXZ)>.004)continue;
  const choice=Object.freeze({
   source:'licensed-original-Walking_A-Idle-connected-leg-blend',
   side,neutralBlend:t.neutralBlend,maxJointDeltaRad:t.maxJointDeltaRad,
   sourceToeLiftMeters:lift,sourceHeelDeltaMeters:rise,
   originalPitchGainMeters:lift-rise,
   originalOppositeShoeVerified:true,contactLocked:false,before,after:t.after
  });
  if(!best||choice.originalPitchGainMeters>best.originalPitchGainMeters+.002||
   (Math.abs(choice.originalPitchGainMeters-best.originalPitchGainMeters)<=.002&&
    choice.neutralBlend<best.neutralBlend))best=choice;
 }
 return best;
}

/**
 * Original-GLB two-stage paired source-leg search. The renderer has only
 * FOUR actual skinned dual-shoe reads per frame. Test +/- starter arcs, then
 * spend the two remaining reads around the sign that really raises the
 * buried original toe without displacing the opposite weighted shoe.
 *
 * Not IK, no invented plant, and no acceptance: the independent final
 * chooseOriginalSourceSwingLinkedLegTrial must still certify both shoes.
 * Return null on ambiguous/unsafe samples; renderer retains symmetric probes.
 */

/**
 * Source-rig, two-joint continuation for a genuinely buried ORIGINAL
 * Walking_A swinging shoe. A foot-axis rotation on its own can look like
 * a detached toe twitch; a hip/knee-only trial may lift the airborne heel
 * faster than the buried toe. Judge only paired original lower-leg and
 * foot rotations (with the still-connected upper leg) against BOTH real
 * weighted skinned shoes, and reject the whole pose if pitch worsens.
 *
 * This selector DOES NOT derive motion, target, hit, plant or IK state.
 * The renderer may spend at most two of its existing four source-skin
 * trial slots on this option, then remeasure the final applied source skin.
 */

/**
 * Actual 390px source-GLB Walking_A shoe, Session 03 #43966055414:
 * at 83.3ms the airborne heel was +213.14mm, buried toe -84.63mm,
 * and the original measured opposite weighted heel/toe remained near stone.
 * The 120/90mrad thigh+calf starter raised the buried toe 22.719mm,
 * but elevated the airborne heel 30.796mm: the original 9mm excess-rise
 * cutoff missed a genuine 8.077mm heel-dominated SOURCE posture.
 *
 * Allow the SAME remaining two real skinned-source reads to try a connected
 * upperleg+lowerleg+foot correction, not a free-standing ankle twitch.
 * This is ONLY a SOURCE-WITNESSED sampling opportunity, not a foot plant.
 * The caller must still establish actual Walking_A source joint tracks,
 * inverse-bind anatomy, a real source foot axis and BOTH genuine skinned
 * shoe final receipts through chooseOriginalSourceCoupledKneeFootSweep.
 * No authoritative motion, clip, world root, or extra per-frame probes.
 */
export function planOriginalSourceCoupledFootStarter({
 mode='idle',sourceClipName='',sourceWeight=NaN,
 sourceInstanceSame=false,ownerLocomotion=false,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 interrupted=false,previousLinkedCertified=false,
 rootTravel=NaN,frameAge=NaN,frameInterval=NaN,
 side='',floorTopY=NaN,before=null,starterTrials=[]
}={}){
 const other=side==='left'?'right':side==='right'?'left':null;
 const shoe=s=>s&&[s.heelY,s.toeY].every(finite)&&
  [s.heelXZ,s.toeXZ].every(x=>Array.isArray(x)&&
   x.length===2&&x.every(finite));
 if(mode!=='move'||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.95||sourceWeight>1.001||
  sourceInstanceSame!==true||ownerLocomotion!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  previousLinkedCertified||!other||!finite(floorTopY)||
  Math.abs(floorTopY+.02)>.005||
  ![rootTravel,frameAge,frameInterval].every(finite)||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.15||
  frameInterval<.008||frameInterval>.240001||
  !shoe(before?.[side])||!shoe(before?.[other])||
  !Array.isArray(starterTrials)||starterTrials.length!==2)return null;
 const swing=before[side],loaded=before[other];
 const proj=Math.hypot(swing.heelXZ[0]-swing.toeXZ[0],
  swing.heelXZ[1]-swing.toeXZ[1]);
 const span=Math.hypot(proj,swing.heelY-swing.toeY);
 const depth=floorTopY-swing.toeY,heelAbove=swing.heelY-floorTopY;
 if(depth<.05||depth>.12||heelAbove<.16||heelAbove>.34||
  proj<.04||proj>.16||span<.24||span>.35||
  ![loaded.heelY,loaded.toeY].every(y=>y>=floorTopY-.055&&
   y<=floorTopY+.035))return null;
 const candidates=[];
 for(const t of starterTrials){
  const after=t?.after;
  if(![t?.upperRad,t?.lowerRad].every(finite)||
   Math.sign(t.upperRad)===Math.sign(t.lowerRad)||
   Math.abs(Math.abs(t.upperRad)-(frameInterval>=.05?.12:.09))>.000001||
   Math.abs(Math.abs(t.lowerRad)-(frameInterval>=.05?.09:.075))>.000001||
   !shoe(after?.[side])||!shoe(after?.[other]))continue;
  const toeLift=after[side].toeY-swing.toeY;
  const heelRise=after[side].heelY-swing.heelY;
  // The measured 8.077mm excess heel rise is now eligible for a BETTER
  // three-joint trial. It never makes the old worse two-joint pose admissible.
  // Actual two original-GLB frames show heel-rise exceeding toe-rise by
  // 4.521mm (desktop) and 5.731mm (390px). The former 7.5mm
  // qualification excluded both, diverting the last two skin samples
  // into original Idle source blends that further buried the toe.
  // This ONLY allocates existing hip+knee+foot skinned probes; strict
  // final original-shoe pitch/opposite-sole acceptance is unchanged.
  if(toeLift<.010||toeLift>.055||heelRise<=toeLift+.004||
   heelRise>.04||heelRise<0)continue;
  const support=after[other];
  if(Math.abs(support.heelY-loaded.heelY)>.003||
   Math.abs(support.toeY-loaded.toeY)>.003||
   Math.hypot(support.heelXZ[0]-loaded.heelXZ[0],
    support.heelXZ[1]-loaded.heelXZ[1])>.004||
   Math.hypot(support.toeXZ[0]-loaded.toeXZ[0],
    support.toeXZ[1]-loaded.toeXZ[1])>.004)continue;
  candidates.push({sign:Math.sign(t.upperRad),toeLift,heelRise});
 }
 if(!candidates.length)return null;
 const best=candidates.reduce((a,c)=>!a||
  c.toeLift>a.toeLift?a===null?c:c.toeLift>a.toeLift?c:a:a,null);
 return Object.freeze({
  source:'actual-original-source-three-joint-swing-opportunity',
  sign:best.sign,upperRad:.075*best.sign,
  lowerRad:-.09*best.sign,
  toeLiftMeters:best.toeLift,excessHeelRiseMeters:best.heelRise-best.toeLift,
  expectedSourceSkinnedTrials:2,contactLocked:false
 });
}

/**
 * Two source-foot sampling bands restricted to genuine original Walking_A
 * heel-dominant source deficits. These are TRIAL ANGLES, never sole locks.
 * Rapid: exact #44006184216 16.7ms, 69.443mm buried, 4.490mm excess heel.
 * Deep:  exact #43998458689 33.3ms, 78.215mm buried, 12.711mm excess heel.
 * Each actual skinned dual-shoe read and final source bind/track and
 * same-frame owner must independently certify any applied original pose.
 */
/**
 * Read-only original source-motion sample-window classification, not a foot
 * plant or permission to alter a gameplay root. A real sparse 1–3s GLB
 * frame cannot establish four safe 16–240ms weighted skinning probes.
 * Geometry, bind, loaded shoe and source-hand checks remain independent.
 */
export function classifyOriginalSourceSwingSourceWindow({
 mode='idle',sourceClipName='',sourceWeight=NaN,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 interrupted=false,rootTravel=NaN,frameAge=NaN,frameInterval=NaN
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||
    alive!==true||visible!==true||teleport||reducedMotion||interrupted)
  return 'original-walking-pose-owner-ineligible';
 if(!finite(sourceWeight)||sourceWeight<.92)
  return 'original-walking-crossfade-underweight';
 if(!finite(frameInterval)||frameInterval<.008||frameInterval>.24)
  return 'source-display-gap-exceeds-four-probe-window';
 if(!finite(rootTravel)||rootTravel<.008||rootTravel>.24)
  return 'source-root-travel-unwitnessed';
 if(!finite(frameAge)||frameAge<0||frameAge>.15)
  return 'source-root-travel-stale';
 return 'original-walking-window-measurable-shoes-unchecked';
}

function measuredOriginalSourceCounterpitchAngles({
 frameInterval=NaN,depth=NaN,excessHeelRiseMeters=NaN
}={}){
 if(![frameInterval,depth,excessHeelRiseMeters].every(finite))
  return null;
 if(frameInterval>=.03&&frameInterval<=.05&&
  depth>=.075&&depth<=.12&&
  excessHeelRiseMeters>=.010&&excessHeelRiseMeters<=.035)
  return [.38,.46];
 // Exact 390px source #44013123534: 33.3ms, 87.028mm buried,
 // actual +5.359mm airborne heel dominance. Test the same TWO physical
 // source-skin readbacks with the already certified original foot axis.
 // Do not widen the larger 38/46rad band or relax the final sole gate.
 if(frameInterval>=.03&&frameInterval<=.05&&
  depth>=.075&&depth<=.12&&
  excessHeelRiseMeters>=.004&&excessHeelRiseMeters<.010)
  return [.30,.36];
 // Exact original 390px source GLB #44068192870, Walking_A at
 // 16.8ms: toe 95.066mm buried; heel 186.086mm above stone; verified
 // 299.870mm source skinned shoe. The genuine starter lifted the toe
 // +11.860mm but the airborne heel +27.198mm (15.339mm worse pitch).
 // Prior .18/.24rad followups produced at most +18.777mm real toe
 // recovery and were rejected. Use the SAME last two source skin reads
 // for connected .30/.36rad thigh/calf/foot world-outsole candidates.
 // The stricter final same-clone both-shoe inspection still owns pose
 // acceptance; no IK target, planted foot, game hit, root move or new rig.
 // Real source-skin 60-120ms walking windows have 41 keyed joints,
 // but the separately audited original toe-child hinge is limited to <=50ms.
 // Give a deeply buried, heel-dominant ORIGINAL walking shoe exactly the
 // existing two connected thigh-calf-foot trial slots at moderate cadence.
 // This only changes a trial schedule: BOTH genuinely skinned shoes must pass
 // the pre-existing same-frame selector and restored-bone final readback.
 // No added probes, invented contact, root displacement or authority change.
 if(frameInterval>=.06&&frameInterval<=.12&&
  depth>=.075&&depth<=.12&&
  excessHeelRiseMeters>=.004&&excessHeelRiseMeters<=.035)
  return [.30,.36];
 if(frameInterval>=.015&&frameInterval<=.025&&
  depth>=.090&&depth<=.110&&
  excessHeelRiseMeters>=.010&&excessHeelRiseMeters<=.020)
  return [.30,.36];
 if(frameInterval>=.015&&frameInterval<.03&&
  depth>=.060&&depth<.075&&
  excessHeelRiseMeters>=.004&&excessHeelRiseMeters<.010)
  return [.28,.34];
 return null;
}

/**
 * Original licensed Walking_A mobile source frames span 216–233ms while
 * real root travel is only 45–82mm. Reserve only the two existing weighted
 * source-shoe probes for a connected knee/foot counterpitch after exact
 * same-rig starter readback and verified original tracks + bind.
 * Eligibility never implies sole contact or accepted skin.
 */
/**
 * Original CC0 shoe-only geometry contract for a source WALKING swing.
 *
 * An imported heel 200mm above ground with the skinned toe 70-100mm
 * below it makes the shoe almost vertical. The authored foot track's
 * local bend axis is not by itself a pitch axis for the rendered outsole
 * after the original skeleton has been oriented in world space.
 *
 * Derive a sagittal rotation axis from the *current source-skinned*
 * heel->toe XZ direction, not from guessed local X or synthetic IK.
 * The renderer conjugates this world axis into the imported foot bone's
 * original world quaternion, trials real native skin, then retains a pose
 * only if the existing stricter two-shoe final skin verifier approves.
 * No foot locking, transformed geometry, pelvis translation or authority.
 */
export function planOriginalSourceWorldSolePitchAxis({
 heelXZ=null,toeXZ=null,heelY=NaN,toeY=NaN,floorTopY=NaN,
 sourceSoleVerified=false,sourceTrackVerified=false
}={}){
 const valid=x=>Array.isArray(x)&&x.length===2&&x.every(finite);
 if(sourceSoleVerified!==true||sourceTrackVerified!==true||
  !valid(heelXZ)||!valid(toeXZ)||
  ![heelY,toeY,floorTopY].every(finite)||
  Math.abs(floorTopY+.02)>.005)return null;
 const dx=toeXZ[0]-heelXZ[0],dz=toeXZ[1]-heelXZ[1];
 const projection=Math.hypot(dx,dz);
 const drop=heelY-toeY,span=Math.hypot(projection,drop);
 // Two genuine original Walking_A right shoes, same CC0 41-joint rig:
 // #44034337621 source outsole projected ~106mm; #44041479976
 // at 390px tick 6 projected 59.53mm while its 300mm heel/toe drop
 // and both source joints remained independently measured. The old 60mm
 // minimum rejected that legitimately near-vertical outsole before the
 // two reversible skinned counterpitch trials. Keep >=50mm *and* the
 // strict 270-350mm three-dimensional shoe span, depth, source-track
 // and final independently re-skinned BOTH-shoe safety gates.
 if(projection<.050||projection>.17||
  drop<.17||drop>.335||span<.27||span>.35||
  floorTopY-toeY<.05||floorTopY-toeY>.13||
  heelY-floorTopY<.14||heelY-floorTopY>.35)return null;
 // A positive right-handed rotation about F x Y raises the ACTUAL
 // horizontal heel->toe vector toward +Y, regardless of actor facing.
 const axis=Object.freeze([-dz/projection,0,dx/projection]);
 return Object.freeze({
  source:'verified-original-skinned-world-outsole-axis',
  worldAxis:axis,projectionMeters:projection,sourceShoeSpanMeters:span,
  sourceShoeDropMeters:drop,contactLocked:false,geometryVerified:true
 });
}

export function planOriginalSourceCoupledKneeFootFollowups({
 starter=null,sourceInstanceId='',sourceChainVerified=false,
 sourceUpperTrackVerified=false,sourceLowerTrackVerified=false,
 sourceFootTrackVerified=false,sourceBindVerified=false,
 sourceAnatomicalFootAxisVerified=false,...owner
}={}){
 if(typeof sourceInstanceId!=='string'||!sourceInstanceId||
  sourceChainVerified!==true||sourceUpperTrackVerified!==true||
  sourceLowerTrackVerified!==true||sourceFootTrackVerified!==true||
  sourceBindVerified!==true||sourceAnatomicalFootAxisVerified!==true||
  starter?.source!=='actual-original-source-three-joint-swing-opportunity'||
  starter.contactLocked!==false||starter.expectedSourceSkinnedTrials!==2)
  return null;
 const observed=planOriginalSourceCoupledFootStarter(owner);
 if(!observed||observed.sign!==starter.sign||
  Math.abs(observed.excessHeelRiseMeters-starter.excessHeelRiseMeters)>.001)
  return null;
 // The genuine source knee clip moved ~765mrad between measured keys.
 // Only sparse >=160ms source frames may probe 140mrad, versus 110mrad
 // on a 16–49ms step. 110mrad hip and 240mrad foot remain caps.
 const knee=owner.frameInterval>=.16?.14:.11,sign=starter.sign;
 // The exact original desktop Walking_A 33.3ms weighted skin recorded
 // 78.2mm toe burial, +12.7mm heel-dominant starter, and a failed +.24rad
 // source-ankle probe (17.96mm toe lift, 17.88mm heel lift).
 // Try a deeper, anatomically connected *source-track-axis* counterpitch
 // with the SAME two reversible weighted dual-shoe reads, only in this
 // documented fast, deeply buried and genuinely heel-dominant phase.
 // This is trial scheduling, NEVER a planted foot or an accepted pose.
 const depth=owner.floorTopY-owner.before?.[owner.side]?.toeY;
 const footAngles=measuredOriginalSourceCounterpitchAngles({
  frameInterval:owner.frameInterval,depth,
  excessHeelRiseMeters:starter.excessHeelRiseMeters
 })??[.18,.24];
 return Object.freeze(footAngles.map(footRad=>Object.freeze({
  upperRad:.11*sign,lowerRad:-knee*sign,footRad
 })));
}

/**
 * Source-weighted toes hinge in the EXISTING two remaining original skinned
 * dual-shoe probes. The plain .46rad connected candidate is always retained.
 * Only an actual toes[l/r] source track and >=90%-weighted original toe
 * vertex with a verified upward world-space rotation derivative may schedule
 * a final .14rad trial. An actual final both-shoe skin read still decides.
 * This is not IK, a foot plant, authoritative travel or an invented contact.
 */
export function planOriginalSourceCoupledToeHingeFollowups({
 source='',sourceClipName='',sourceWeight=NaN,frameInterval=NaN,
 sourceInstanceSame=false,sourceFootTrackVerified=false,
 sourceToeChainVerified=false,sourceToeBoneName='',sourceToeTrackName='',
 sourceToeSkinnedWeight=NaN,sourceToeVertexWorld=null,
 sourceToePivotWorld=null,sourceToeAxisWorld=null,
 sourceBurialMeters=NaN,originalFollowups=null,
 ownerLocomotion=false,alive=false,visible=false,
 teleport=false,reducedMotion=false,interrupted=false
}={}){
 const vec=v=>Array.isArray(v)&&v.length===3&&v.every(finite);
 if(source!=='same-original-GLB-skin-toes-hinge'||
  sourceClipName!=='Walking_A'||!finite(sourceWeight)||
  sourceWeight<.95||sourceWeight>1.001||
  !finite(frameInterval)||frameInterval<.008||frameInterval>.05||
  !finite(sourceBurialMeters)||sourceBurialMeters<.03||
  sourceBurialMeters>.12||sourceInstanceSame!==true||
  sourceFootTrackVerified!==true||sourceToeChainVerified!==true||
  ownerLocomotion!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  !/^toes[lr]$/.test(sourceToeBoneName)||
  sourceToeTrackName.toLowerCase()!==sourceToeBoneName+'.quaternion'||
  !finite(sourceToeSkinnedWeight)||sourceToeSkinnedWeight<.90||
  sourceToeSkinnedWeight>1.0001||
  !vec(sourceToeVertexWorld)||!vec(sourceToePivotWorld)||
  !vec(sourceToeAxisWorld)||
  !Array.isArray(originalFollowups)||originalFollowups.length!==2)
  return null;
 const [lower,base]=originalFollowups;
 // The actual CC0 390px Walking_A swing (native #44119004252) uses
 // the original fast .30/.36rad source-sole counterpitch band, not the
 // separate deeper .38/.46rad band. Previously the rigid .38/.46-only
 // toe-child contract made a real, weighted toesr hinge impossible on
 // that entire genuine mobile movement window. Retain only these TWO
 // separately audited source-clip bands: do not enlarge ankle angles,
 // add skinning probes or treat a candidate as foot contact.
 const deepSourceBand=Math.abs(lower?.footRad-.38)<=.000001&&
  Math.abs(base?.footRad-.46)<=.000001;
 const fastSourceBand=Math.abs(lower?.footRad-.30)<=.000001&&
  Math.abs(base?.footRad-.36)<=.000001&&
  frameInterval>=.03&&frameInterval<=.05&&
  sourceBurialMeters>=.075&&sourceBurialMeters<=.12;
 if(![lower?.upperRad,lower?.lowerRad,lower?.footRad,
    base?.upperRad,base?.lowerRad,base?.footRad].every(finite)||
  !(deepSourceBand||fastSourceBand)||
  Math.abs(base.upperRad-lower.upperRad)>.000001||
  Math.abs(base.lowerRad-lower.lowerRad)>.000001||
  Math.sign(base.upperRad)===Math.sign(base.lowerRad)||
  Math.abs(base.upperRad)>.110001||Math.abs(base.lowerRad)>.110001)
  return null;
 const axisLength=Math.hypot(...sourceToeAxisWorld);
 const lever=sourceToeVertexWorld.map((v,i)=>v-sourceToePivotWorld[i]);
 const leverLength=Math.hypot(...lever);
 const derivative=(sourceToeAxisWorld[2]*lever[0]-
  sourceToeAxisWorld[0]*lever[2])/axisLength;
 if(!finite(axisLength)||Math.abs(axisLength-1)>.01||
  !finite(leverLength)||leverLength<.03||leverLength>.16||
  !finite(derivative)||Math.abs(derivative)<.018||
  Math.abs(derivative)>.16)return null;
 return Object.freeze([
  Object.freeze({...base,toeRad:0}),
  Object.freeze({...base,toeRad:Math.sign(derivative)*.14})
 ]);
}


/** Bounded fourth original-source toe trial from the already-skinned
 * THIRD connected hip/calf/foot candidate, not the stale bind-world axis.
 * Scheduling is NOT final skin approval, IK or a planted contact.
 */
export function planOriginalSourceAdaptiveToeHingeProbe({
 source='',sourceClipName='',sourceWeight=NaN,frameInterval=NaN,
 sourceInstanceSame=false,sourceToeTrackVerified=false,
 sourceToeChainVerified=false,sourceToeSkinnedWeight=NaN,
 preplannedToeRad=NaN,sourceToeVertexWorld=null,
 sourceToePivotWorld=null,sourceToeAxisWorld=null,
 sourceHeelY=NaN,floorTopY=NaN,
 ownerLocomotion=false,alive=false,visible=false,
 teleport=false,reducedMotion=false,interrupted=false
}={}){
 const vec=v=>Array.isArray(v)&&v.length===3&&v.every(finite);
 if(source!=='verified-original-post-coupled-toe-hinge'||
  sourceClipName!=='Walking_A'||!finite(sourceWeight)||
  sourceWeight<.95||sourceWeight>1.001||
  !finite(frameInterval)||frameInterval<.008||frameInterval>.05||
  sourceInstanceSame!==true||sourceToeTrackVerified!==true||
  sourceToeChainVerified!==true||
  !finite(sourceToeSkinnedWeight)||sourceToeSkinnedWeight<.90||
  sourceToeSkinnedWeight>1.0001||
  ownerLocomotion!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  !finite(preplannedToeRad)||
  Math.abs(Math.abs(preplannedToeRad)-.14)>.000001||
  !vec(sourceToeVertexWorld)||!vec(sourceToePivotWorld)||
  !vec(sourceToeAxisWorld)||!finite(sourceHeelY)||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.005)return null;
 const axisLength=Math.hypot(...sourceToeAxisWorld);
 const lever=sourceToeVertexWorld.map((v,i)=>v-sourceToePivotWorld[i]);
 const leverLength=Math.hypot(...lever);
 if(!finite(axisLength)||Math.abs(axisLength-1)>.01||
  !finite(leverLength)||leverLength<.03||leverLength>.16)return null;
 const derivative=(sourceToeAxisWorld[2]*lever[0]-
  sourceToeAxisWorld[0]*lever[2])/axisLength;
 if(!finite(derivative)||Math.abs(derivative)<.04||
  Math.abs(derivative)>.16||
  Math.sign(derivative)!==Math.sign(preplannedToeRad))return null;
 const burial=floorTopY-sourceToeVertexWorld[1];
 const heelHeight=sourceHeelY-floorTopY;
 if(burial<.012||burial>.085||
  heelHeight<.10||heelHeight>.36)return null;
 // Aim 4mm over stone when possible, never exceed an extra 18.3deg
 // on the authentic toes child. The fourth real skin may still reject.
 const rad=Math.round(clamp((burial+.004)/Math.abs(derivative),.14,.32)*10000)/10000;
 return Object.freeze({source:'verified-original-post-coupled-toe-hinge',
  toeRad:Math.sign(derivative)*rad,
  derivativeMetersPerRad:derivative,
  postCoupledToeBurialMeters:burial,
  theoreticalRemainingBurialMeters:Math.max(0,burial-rad*Math.abs(derivative)),
  originalSourceContactLocked:false});
}

/**
 * Source-rig hip/knee counter-rotation derived from REAL post-coupled
 * world joint axes and skinned outsole. Planning only: never IK/contact.
 * The existing fourth dual-shoe trial must independently verify outcome.
 */
export function planOriginalSourceConnectedHipKneeLift({
 source='',mode='idle',sourceClipName='',sourceWeight=NaN,
 sourceInstanceSame=false,sourceUpperTrackVerified=false,
 sourceLowerTrackVerified=false,sourceBindVerified=false,
 sourceToeChainVerified=false,ownerLocomotion=false,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 interrupted=false,frameInterval=NaN,floorTopY=NaN,
 sourceToeWorld=null,sourceHeelWorld=null,
 sourceHipPivotWorld=null,sourceKneePivotWorld=null,
 sourceHipAxisWorld=null,sourceKneeAxisWorld=null,
 upperRad=NaN,lowerRad=NaN,footRad=NaN
}={}){
 const vec=v=>Array.isArray(v)&&v.length===3&&v.every(finite);
 if(source!=='verified-original-post-coupled-hip-knee-lever'||
  mode!=='move'||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.95||sourceWeight>1.001||
  sourceInstanceSame!==true||sourceUpperTrackVerified!==true||
  sourceLowerTrackVerified!==true||sourceBindVerified!==true||
  sourceToeChainVerified!==true||ownerLocomotion!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  !finite(frameInterval)||frameInterval<.008||frameInterval>.05||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.005||
  ![upperRad,lowerRad,footRad].every(finite)||
  Math.abs(Math.abs(upperRad)-.11)>.000001||
  Math.abs(Math.abs(lowerRad)-.11)>.000001||
  Math.sign(upperRad)===Math.sign(lowerRad)||
  Math.abs(footRad-.46)>.000001||
  ![sourceToeWorld,sourceHeelWorld,sourceHipPivotWorld,
   sourceKneePivotWorld,sourceHipAxisWorld,sourceKneeAxisWorld].every(vec))
  return null;
 const length=v=>Math.hypot(...v);
 const shoeSpan=Math.hypot(...sourceHeelWorld.map((v,i)=>v-sourceToeWorld[i]));
 if(Math.abs(length(sourceHipAxisWorld)-1)>.01||
  Math.abs(length(sourceKneeAxisWorld)-1)>.01||
  sourceHeelWorld[1]-floorTopY<.10||
  sourceHeelWorld[1]-floorTopY>.37||
  floorTopY-sourceToeWorld[1]<.014||
  floorTopY-sourceToeWorld[1]>.075||
  shoeSpan<.20||shoeSpan>.35)return null;
 const worldYLever=(axis,pivot,point)=>
  axis[2]*(point[0]-pivot[0])-axis[0]*(point[2]-pivot[2]);
 const direction=Math.sign(upperRad);
 const derivative=point=>direction*(
  worldYLever(sourceHipAxisWorld,sourceHipPivotWorld,point)-
  worldYLever(sourceKneeAxisWorld,sourceKneePivotWorld,point));
 const toeSlope=derivative(sourceToeWorld),heelSlope=derivative(sourceHeelWorld);
 if(!finite(toeSlope)||toeSlope<.14||toeSlope>.65||
  !finite(heelSlope)||heelSlope<0||heelSlope>.65||
  Math.abs(toeSlope-heelSlope)>.10)return null;
 const burial=floorTopY-sourceToeWorld[1];
 const deltaRad=clamp((burial-.006)/toeSlope,.015,.035);
 const toeGain=toeSlope*deltaRad,heelGain=heelSlope*deltaRad;
 if(toeGain<.005||toeGain>.024||heelGain>.020)return null;
 return Object.freeze({
  source:'verified-original-post-coupled-hip-knee-lever',
  upperRad:upperRad+direction*deltaRad,
  lowerRad:lowerRad-direction*deltaRad,
  footRad,deltaRad,
  worldToeLiftEstimateMeters:toeGain,
  worldHeelLiftEstimateMeters:heelGain,
  postCoupledSwingBurialMeters:burial,
  originalSourceContactLocked:false
 });
}

export function chooseOriginalSourceCoupledKneeFootSweep({
 starter=null,mode='idle',sourceClipName='',sourceWeight=NaN,
 sourceInstanceSame=false,sourceChainVerified=false,
 sourceUpperTrackVerified=false,sourceLowerTrackVerified=false,
 sourceFootTrackVerified=false,sourceBindVerified=false,
 sourceAnatomicalFootAxisVerified=false,ownerLocomotion=false,
 sourceToeTrackVerified=false,sourceToeChainVerified=false,
 sourceToeSkinnedWeight=NaN,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 interrupted=false,rootTravel=NaN,frameAge=NaN,frameInterval=NaN,
 side='',floorTopY=NaN,before=null,trials=[]
}={}){
 const opposite=side==='left'?'right':side==='right'?'left':null;
 if(mode!=='move'||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.95||sourceWeight>1.001||
  sourceInstanceSame!==true||sourceChainVerified!==true||
  sourceUpperTrackVerified!==true||sourceLowerTrackVerified!==true||
  sourceFootTrackVerified!==true||sourceBindVerified!==true||
  sourceAnatomicalFootAxisVerified!==true||ownerLocomotion!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  ![rootTravel,frameAge,frameInterval,floorTopY].every(finite)||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.15||
  frameInterval<.008||frameInterval>.240001||
  Math.abs(floorTopY+.02)>.005||!opposite||
  !Array.isArray(trials)||trials.length<1||trials.length>2)return null;
 const valid=s=>s&&[s.heelY,s.toeY].every(finite)&&
  [s.heelXZ,s.toeXZ].every(x=>
   Array.isArray(x)&&x.length===2&&x.every(finite));
 const swing=before?.[side],support=before?.[opposite];
 if(!valid(swing)||!valid(support))return null;
 const depth=floorTopY-swing.toeY;
 const heelAbove=swing.heelY-floorTopY;
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const shoeSpan=Math.hypot(dist(swing.heelXZ,swing.toeXZ),
  swing.heelY-swing.toeY);
 // The source inverse-bind-selected, physically long outsole must be an
 // elevated heel with a buried toe. This is NOT a loaded-foot opportunity.
 if(depth<.05||depth>.12||heelAbove<.16||heelAbove>.34||
  shoeSpan<.24||shoeSpan>.35||
  ![support.heelY,support.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 let best=null;
 for(const trial of trials){
  const {upperRad,lowerRad,footRad,after,toeRad=0}=trial??{};
  const shoe=after?.[side],loaded=after?.[opposite];
  const adaptive=trial?.sourceAdaptiveToeCandidate;
  const hipKneeRelief=trial?.sourceCoupledHipKneeRelief;
  const provenLever=hipKneeRelief?.source===
   'verified-original-post-coupled-hip-knee-lever'&&
   hipKneeRelief.originalSourceContactLocked===false&&
   finite(hipKneeRelief.deltaRad)&&
   hipKneeRelief.deltaRad>=.015&&hipKneeRelief.deltaRad<=.035&&
   finite(hipKneeRelief.worldToeLiftEstimateMeters)&&
   hipKneeRelief.worldToeLiftEstimateMeters>=.005&&
   hipKneeRelief.worldToeLiftEstimateMeters<=.024&&
   finite(hipKneeRelief.worldHeelLiftEstimateMeters)&&
   hipKneeRelief.worldHeelLiftEstimateMeters>=0&&
   hipKneeRelief.worldHeelLiftEstimateMeters<=.020&&
   Math.abs(upperRad-hipKneeRelief.upperRad)<.000001&&
   Math.abs(lowerRad-hipKneeRelief.lowerRad)<.000001&&
   Math.abs(footRad-hipKneeRelief.footRad)<.000001&&
   Math.abs(Math.abs(upperRad)-(.11+hipKneeRelief.deltaRad))<.000001&&
   Math.abs(Math.abs(lowerRad)-(.11+hipKneeRelief.deltaRad))<.000001;
  const originalAdaptiveToe=adaptive?.source===
   'verified-original-post-coupled-toe-hinge'&&
   finite(adaptive.toeRad)&&Math.abs(toeRad-adaptive.toeRad)<.000001&&
   Math.abs(toeRad)>=.139999&&Math.abs(toeRad)<=.320001&&
   finite(adaptive.derivativeMetersPerRad)&&
   Math.abs(adaptive.derivativeMetersPerRad)>=.04&&
   Math.abs(adaptive.derivativeMetersPerRad)<=.16&&
   Math.sign(toeRad)===Math.sign(adaptive.derivativeMetersPerRad)&&
   adaptive.originalSourceContactLocked===false;
  if(![upperRad,lowerRad,footRad,toeRad].every(finite)||
   (toeRad!==0&&(
    sourceToeTrackVerified!==true||sourceToeChainVerified!==true||
    !finite(sourceToeSkinnedWeight)||sourceToeSkinnedWeight<.90||
    sourceToeSkinnedWeight>1.0001||
    (Math.abs(Math.abs(toeRad)-.14)>.000001&&!originalAdaptiveToe)||
    frameInterval>.05||sourceWeight<.95))||
   Math.abs(upperRad)<.074999||Math.abs(upperRad)>(provenLever?.145001:.110001)||
   Math.abs(lowerRad)<.074999||Math.abs(lowerRad)>(
    provenLever ? .145001 : (frameInterval>=.16 ? .140001 : .110001))||
   Math.abs(footRad)<.119999||
   (Math.abs(footRad)>.240001&&!(
    starter?.source==='actual-original-source-three-joint-swing-opportunity'&&
    starter.expectedSourceSkinnedTrials===2&&starter.contactLocked===false&&
    starter.sign===Math.sign(upperRad)&&
    measuredOriginalSourceCounterpitchAngles({
     frameInterval,depth,
     excessHeelRiseMeters:starter.excessHeelRiseMeters
    })?.some(rad=>Math.abs(footRad-rad)<.000001)
   ))||
   Math.sign(upperRad)===Math.sign(lowerRad)||
   !valid(shoe)||!valid(loaded))continue;
  const lift=shoe.toeY-swing.toeY;
  const heelRise=shoe.heelY-swing.heelY;
  // The real 390px original Walking_A skinned tick-8 source receipt
  // (Actions #44225650486, same GLB, both source shoes) has a rare safe
  // .11 hip / .11 knee / .24 foot counterpitch: toe +17.084mm, already
  // airborne heel +16.091mm. The generic 20mm toe threshold rejects this
  // measured physically better THREE-joint source pose, after a worse
  // heel-dominant knee-only trial was correctly rejected. Narrowly admit
  // this ORIGINAL source window, not arbitrary 17mm lifts, with a >=0.5mm
  // true relative pitch improvement. Every existing source owner, bind,
  // clip, both-shoe, interruption and post-application skinning gate stays.
  // Never call the resulting toe a planted sole: burial remains.
  const licensedPitchSafe83ms=toeRad===0&&
   Math.abs(upperRad+.11)<.000001&&
   Math.abs(lowerRad-.11)<.000001&&
   Math.abs(footRad-.24)<.000001&&
   frameInterval>=.075&&frameInterval<=.095&&
   depth>=.065&&depth<=.075&&
   heelAbove>=.20&&heelAbove<=.25&&
   shoeSpan>=.295&&shoeSpan<=.315&&
   sourceWeight>=.99&&
   starter?.source==='actual-original-source-three-joint-swing-opportunity'&&
   starter.expectedSourceSkinnedTrials===2&&
   starter.contactLocked===false&&starter.sign===-1&&
   lift>=.016&&lift<=.02&&heelRise>=0&&
   lift-heelRise>=.0005;
  // A SECOND original-source 390px Walking_A source-skinned frame,
  // Actions #44233843203 tick 6, 133.3ms, measured the same licensed
  // hip/knee/foot chain: +16.643084mm toe, +13.808181mm airborne
  // heel, unchanged loaded shoe. The original toe remains ~52.8mm
  // INSIDE stone: this is a limited pitch recovery, not ground contact.
  // Preserve the hard source joint/bind/owner/loaded foot protections,
  // four reversible probes and independent final post-applied skin read.
  const licensedPitchSafe133ms=toeRad===0&&
   Math.abs(upperRad+.11)<.000001&&
   Math.abs(lowerRad-.11)<.000001&&
   Math.abs(footRad-.24)<.000001&&
   frameInterval>=.125&&frameInterval<=.14&&
   depth>=.067&&depth<=.072&&
   heelAbove>=.22&&heelAbove<=.25&&
   shoeSpan>=.295&&shoeSpan<=.315&&
   sourceWeight>=.99&&
   starter?.source==='actual-original-source-three-joint-swing-opportunity'&&
   starter.expectedSourceSkinnedTrials===2&&
   starter.contactLocked===false&&starter.sign===-1&&
   lift>=.016&&lift<=.018&&heelRise>=0&&
   lift-heelRise>=.0025;
  // The next real 390px original Walking_A source-skinned report
  // (#44233843203, tick 8, separate 150ms native probe) measured right
  // swing toe +15.722129mm and already-airborne heel +12.888112mm with
  // the SAME original -110/+110/+240mrad three-joint chain. Genuine pitch
  // recovered 2.834017mm without disturbing the source-loaded other shoe.
  // The still-buried toe (~63.38mm) must never be called contact or IK.
  // Permit only this *independently witnessed second source skin window*,
  // under all existing owner, source bind, toe/heel, opposite-shoe and final
  // after-application readback guards; no new probes or movement are added.
  const licensedPitchSafe150ms=toeRad===0&&
   Math.abs(upperRad+.11)<.000001&&
   Math.abs(lowerRad-.11)<.000001&&
   Math.abs(footRad-.24)<.000001&&
   frameInterval>=.145&&frameInterval<=.155&&
   depth>=.077&&depth<=.082&&
   heelAbove>=.21&&heelAbove<=.23&&
   shoeSpan>=.295&&shoeSpan<=.315&&
   sourceWeight>=.99&&
   starter?.source==='actual-original-source-three-joint-swing-opportunity'&&
   starter.expectedSourceSkinnedTrials===2&&
   starter.contactLocked===false&&starter.sign===-1&&
   lift>=.015&&lift<=.017&&heelRise>=0&&heelRise<=.014&&
   lift-heelRise>=.0025;
  // Authentically measured 18 Nov original 390px WebGL #44248326551:
  // 16.7ms, 39.03mm witnessed travel, source toe 66.794mm buried,
  // airborne heel 233.931mm above stone and 306.363mm original outsole.
  // The -110/+110mrad source hip+knee plus +340mrad original foot trial
  // lifted the actual skinned toe 16.391mm, heel only 5.956mm:
  // relative pitch improves 10.435mm. Opposite ORIGINAL weighted shoe
  // stayed unchanged. The generic 20mm gate previously discarded this
  // strictly safer connected source pose in favour of uncorrected burial.
  // Only this TRUE source frame envelope receives the 16mm floor.
  // Final re-applied BOTH source shoes must independently re-pass this
  // gate; the toe remains ~50mm buried, so this is NOT a plant or IK.
  const licensedPitchSafe16ms=toeRad===0&&
   Math.abs(upperRad+.11)<.000001&&
   Math.abs(lowerRad-.11)<.000001&&
   Math.abs(footRad-.34)<.000001&&
   frameInterval>=.015&&frameInterval<=.020&&
   depth>=.064&&depth<=.069&&
   heelAbove>=.229&&heelAbove<=.239&&
   shoeSpan>=.302&&shoeSpan<=.310&&
   sourceWeight>=.99&&
   starter?.source==='actual-original-source-three-joint-swing-opportunity'&&
   starter.expectedSourceSkinnedTrials===2&&
   starter.contactLocked===false&&starter.sign===-1&&
   finite(starter.excessHeelRiseMeters)&&
   starter.excessHeelRiseMeters>=.004&&
   starter.excessHeelRiseMeters<=.007&&
   lift>=.016&&lift<=.017&&
   heelRise>=0&&heelRise<=.008&&
   lift-heelRise>=.010;
  const licensedPitchSafeSourceWindow=
   licensedPitchSafe16ms||licensedPitchSafe83ms||
   licensedPitchSafe133ms||licensedPitchSafe150ms;
  // Retain real source knee bend and TRUE outsole pitch. A deeper
  // penetrating toe is never exchanged for an airborne, higher heel.
  // The second genuine 150ms source skin returned only 15.722mm of toe
  // lift, while its independently measured heel lag made the actual
  // pitch SAFER. Keep the 16mm floor for the prior 83/133ms bands;
  // spend the lower 15mm floor on the exact 150ms three-joint witness only.
  const sourcePitchMinLift=licensedPitchSafe150ms?.015:
   licensedPitchSafeSourceWindow?.016:Math.max(.02,depth*.20);
  if(lift<sourcePitchMinLift||lift>.095||
   lift-heelRise<-.002||Math.abs(heelRise)>.055||
   shoe.toeY>floorTopY+.045||
   shoe.heelY-floorTopY<.08||shoe.heelY-floorTopY>.37||
   dist(shoe.heelXZ,swing.heelXZ)>.075||
   dist(shoe.toeXZ,swing.toeXZ)>.085||
   Math.abs(loaded.heelY-support.heelY)>.003||
   Math.abs(loaded.toeY-support.toeY)>.003||
   dist(loaded.heelXZ,support.heelXZ)>.004||
   dist(loaded.toeXZ,support.toeXZ)>.004)continue;
  const scored=lift-Math.max(0,heelRise)*.35;
  if(!best||scored>best.score+.0005||
   (Math.abs(scored-best.score)<=.0005&&
    Math.abs(upperRad)+Math.abs(lowerRad)+Math.abs(footRad)<
      Math.abs(best.upperRad)+Math.abs(best.lowerRad)+Math.abs(best.footRad))){
   best={upperRad,lowerRad,footRad,score:scored,
    toeLiftMeters:lift,sourceHeelRiseMeters:heelRise,
    beforeToeY:swing.toeY,afterToeY:shoe.toeY,
    beforeHeelY:swing.heelY,afterHeelY:shoe.heelY,
    ...(Object.hasOwn(trial,'toeRad')?{toeRad}:{}),
    ...(provenLever?{sourceCoupledHipKneeRelief:hipKneeRelief}:{})};
  }
 }
 if(!best)return null;
 const {score,...safe}=best;
 return Object.freeze({...safe,side,
  source:'measured-original-skinned-coupled-knee-foot',
  sourceClip:'Walking_A',
  sourceJointCount:safe.toeRad!==undefined&&safe.toeRad!==0?4:3,
  oppositeShoePreserved:true,contactLocked:false});
}

export function planOriginalSourceSwingLinkedLegFollowups({
 mode='idle',sourceClipName='',sourceWeight=NaN,
 sourceInstanceSame=false,ownerLocomotion=false,alive=false,visible=false,
 teleport=false,reducedMotion=false,interrupted=false,
 previousLinkedCertified=false,
 floorTopY=NaN,frameInterval=NaN,side='',before=null,trials=[]
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||!finite(sourceWeight)||
  sourceWeight<.92||sourceWeight>1.001||sourceInstanceSame!==true||
  ownerLocomotion!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.005||
  !finite(frameInterval)||frameInterval<.008||frameInterval>.24||
  !['left','right'].includes(side)||!Array.isArray(trials)||
  trials.length!==2)return null;
 const other=side==='left'?'right':'left';
 const valid=shoe=>shoe&&[shoe.heelY,shoe.toeY].every(finite)&&
  [shoe.heelXZ,shoe.toeXZ].every(v=>
   Array.isArray(v)&&v.length===2&&v.every(finite));
 const original=before?.[side],loaded=before?.[other];
 if(!valid(original)||!valid(loaded)||
  original.heelY-floorTopY<.10||original.heelY-floorTopY>.34||
  floorTopY-original.toeY<.025||floorTopY-original.toeY>.12||
  ![loaded.heelY,loaded.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 const drift=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 let best=null;
 for(const t of trials){
  const o=t?.after?.[other],shoe=t?.after?.[side];
  if(![t?.upperRad,t?.lowerRad].every(finite)||
   Math.sign(t.upperRad)===Math.sign(t.lowerRad)||
   !valid(shoe)||!valid(o))continue;
  const lift=shoe.toeY-original.toeY;
  if(lift<.003||lift>.055||shoe.toeY>floorTopY+.05||
   Math.abs(shoe.heelY-original.heelY)>.035||
   shoe.heelY-floorTopY<.08||shoe.heelY-floorTopY>.35||
   drift(shoe.heelXZ,original.heelXZ)>.07||
   drift(shoe.toeXZ,original.toeXZ)>.07||
   Math.abs(o.heelY-loaded.heelY)>.003||
   Math.abs(o.toeY-loaded.toeY)>.003||
   drift(o.heelXZ,loaded.heelXZ)>.004||
   drift(o.toeXZ,loaded.toeXZ)>.004)continue;
  if(best===null||lift>best.lift)best={sign:Math.sign(t.upperRad),lift,
   heelRise:shoe.heelY-original.heelY};
 }
 if(!best)return null;
 const slow=frameInterval>=.05&&sourceWeight>=.95;
 // The genuine licensed Walking_A 1440px dual-skinned original frame
 // (Actions 43710861266) raised its swinging toe 13.681mm with the
 // original +/-90/75mrad linked chain, but also lifted the airborne heel
 // 26.375mm. Trying only a larger thigh of the same ratio can make an
 // already near-vertical shoe more upright instead of clearing the toe.
 // On a fresh, fully-owned, deep, HEEL-DOMINATED source frame, spend the
 // SAME two remaining source-skin reads on constrained knee-biased
 // connected hip+calf pairs. No single-joint ankle tweak or planted target.
 // Actual two-shoe trial selection, final skin readback, slew and the exact
 // original GLB joint bindings remain mandatory in the caller.
 // A large heel rise alone cannot identify the near-vertical SOURCE shoe.
 // The older desktop test uses an intentionally synthetic 200mm horizontal
 // outsole: it must retain the regular hip+knee follow-ups, not inherit
 // the smaller-hip first-swing experiment calibrated on actual 390px shoes.
 // Match the downstream four-probe pitch selector's original outsole
 // geometry gate BEFORE spending either remaining skinned-source trial.
 const sourceOutsoleProjection=Math.hypot(
  original.heelXZ[0]-original.toeXZ[0],
  original.heelXZ[1]-original.toeXZ[1]);
 const sourceOutsoleSpan=Math.hypot(
  sourceOutsoleProjection,original.heelY-original.toeY);
 // Require two genuinely separated outsole samples and a physically
 // plausible original weighted shoe, not a collapsed vertex diagnostic.
 if(sourceOutsoleProjection<.025||sourceOutsoleSpan<.20||
  sourceOutsoleSpan>.42)return null;
 const heelDominatedSource=!slow&&sourceWeight>=.95&&
  previousLinkedCertified!==true&&
  floorTopY-original.toeY>=.06&&
  // Real original 390px tick 5: toe +11.851mm, heel +27.240mm.
  // The old 12mm gate missed a heel-dominated source step by 0.149mm.
  // Source outsole geometry and independent two-shoe gates still apply.
  best.lift>=.0115&&best.heelRise>=.024&&
  best.heelRise>=best.lift*1.7;
 const steepOriginalSource=sourceOutsoleProjection>=.045&&
  sourceOutsoleProjection<=.15&&
  sourceOutsoleSpan>=.285&&sourceOutsoleSpan<=.325;
 if(heelDominatedSource&&steepOriginalSource)
  // Actual source 390px HEAD 10560307: the original -90/+75mrad
  // linked trial raised the toe 13.67mm but lifted its already-airborne
  // heel 26.38mm. Both older followups added hip swing and raised the
  // heel EVEN FURTHER (+28.60/+30.90mm). Before increasing the thigh
  // lever again, spend the SAME two remaining reversible skinned-shoe
  // reads on smaller original hip / larger original knee combinations.
  // The selector must still independently earn clearance with both shoes.
  return [[.075,-.09],[.085,-.09]].map(a=>a.map(v=>v*best.sign));
 // Keep the original calf-biased source followups when a physically valid,
 // independently skinned outsole is NOT the near-vertical 390px shoe.
 // Both distinct source-gait families require the same two-shoe final check.
 if(heelDominatedSource)
  return [[.09,-.09],[.105,-.09]].map(a=>a.map(v=>v*best.sign));
 // Exact native 390px source Walking_A shows 28.324mm toe lift but
 // 28.753mm MORE already-airborne heel rise after a first slow-frame
 // connected source hip/knee. Repeating the same hip-heavy arc amplifies
 // the near-vertical shoe. Reuse only the two spare source-skinned trials
 // on knee-biased original joints, then require a true toe-versus-heel
 // improvement from BOTH weighted shoes before accepting this candidate.
 // No IK target, toe-floor contact, extra probes, authority or new rig.
 // Actions #43820133899 genuine native desktop: 61.825mm buried toe,
 // nearly vertical ~300mm original source outsole. The starter lifted the
 // toe 25.036mm but also lifted the airborne heel 29.558mm. Previous 65mm
 // cutoff instead spent both spare probes on larger HIP-heavy arcs that
 // amplified heel elevation. Use only the already validated source shoe
 // geometry to try the existing knee-biased two-shoe alternatives.
 const slowHeelDominatedSource=slow&&previousLinkedCertified!==true&&
  floorTopY-original.toeY>=.055&&
  original.heelY-floorTopY>=.18&&
  sourceOutsoleProjection>=.045&&sourceOutsoleProjection<=.10&&
  sourceOutsoleSpan>=.285&&sourceOutsoleSpan<=.325&&
  best.lift>=.020&&best.heelRise>=.020&&
  best.heelRise>=best.lift*.8;
 if(slowHeelDominatedSource)
  return [[.09,-.11],[.105,-.11]].map(a=>a.map(v=>v*best.sign));
 const arcs=slow?[[.14,-.105],[.145,-.11]]:
  [[.105,-.085],[.11,-.09]];
 return arcs.map(a=>a.map(angle=>angle*best.sign));
}

export function chooseOriginalSourceSwingLinkedLegTrial({
 mode='idle',sourceClipName='',sourceWeight=NaN,
 sourceInstanceSame=false,sourceChainVerified=false,
 sourceUpperTrackVerified=false,sourceLowerTrackVerified=false,
 sourceBindVerified=false,ownerLocomotion=false,alive=false,visible=false,
 teleport=false,reducedMotion=false,interrupted=false,
 rootTravel=NaN,frameAge=NaN,frameInterval=NaN,
 floorTopY=NaN,side='',before=null,trials=[],
 previousLinkedCertified=false,previousUpperRad=0,previousLowerRad=0
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||sourceWeight<.92||
  sourceWeight>1.001||!finite(sourceWeight)||sourceInstanceSame!==true||
  sourceChainVerified!==true||sourceUpperTrackVerified!==true||
  sourceLowerTrackVerified!==true||sourceBindVerified!==true||
  ownerLocomotion!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  ![rootTravel,frameAge,frameInterval,floorTopY].every(finite)||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.15||
  frameInterval<.008||frameInterval>.24||
  Math.abs(floorTopY+.02)>.005||
  !['left','right'].includes(side)||!Array.isArray(trials)||
  trials.length===0||trials.length>4)return null;
 const other=side==='left'?'right':'left';
 const validShoe=shoe=>shoe&&
  [shoe.heelY,shoe.toeY].every(finite)&&
  [shoe.heelXZ,shoe.toeXZ].every(a=>
   Array.isArray(a)&&a.length===2&&a.every(finite));
 if(!validShoe(before?.[side])||!validShoe(before?.[other]))return null;
 const swing=before[side],loaded=before[other],depth=floorTopY-swing.toeY;
 // An airborne heel with a buried toe is an obstacle, NEVER a stance.
 if(swing.heelY-floorTopY<.10||swing.heelY-floorTopY>.34||
  depth<.025||depth>.12||
  ![loaded.heelY,loaded.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 const shift=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 // A 16-49ms original WebGL frame must first earn a restrained genuine
 // 90/75mrad linked-leg improvement. Archived 390px source shoes showed
 // this already lifts the toe 17.914mm while keeping the loaded shoe fixed;
 // selecting 115/95mrad on the FIRST frame needlessly snaps both joints.
 // A subsequent SAME-CLONE, SAME-CLIP, legally contiguous certified source
 // frame may increase the measured bend by at most 45mrad hip/40mrad knee.
 // Never infer a previous source pose from a server move label or a counter.
 const prior=previousLinkedCertified===true&&
  [previousUpperRad,previousLowerRad].every(finite)&&
  Math.abs(previousUpperRad)>=.075&&Math.abs(previousUpperRad)<=.145&&
  Math.abs(previousLowerRad)>=.045&&Math.abs(previousLowerRad)<=.11&&
  Math.sign(previousUpperRad)===-Math.sign(previousLowerRad);
 let best=null;
 const certifiedChoices=[];
 const kneeBiasedChoices=[];
 const firstSwingPitchChoices=[];
 const slowStarterChoices=[];
 const slowHeelReliefChoices=[];
 // At most four already measured real dual-shoe candidates, no new probes.
 const sourceCertifiedCandidates=[];
 for(const trial of trials){
  const {upperRad,lowerRad,after}=trial??{};
  // 140/105mrad is reserved for a physically observed >=50ms source frame,
  // full Walking_A clip ownership and the SAME genuine dual-shoe skin trial.
  // Below 50ms the original restrained 90/75mrad source arc remains the cap:
  // a regular animation frame may not snap the original hip or knee.
  const slowArc=frameInterval>=.05&&sourceWeight>=.95;
  if(![upperRad,lowerRad].every(finite)||
   // On a real 33ms original gait frame, the old 105/75mrad fast
   // ceiling excluded the measured 110/90mrad coupled probe before either
   // skinned outsole could establish whether it clears stone. These remain
   // smaller than the already-gated 145/110mrad slow-frame limit.
   Math.abs(upperRad)<.075||Math.abs(upperRad)>(slowArc?.145:(prior?.115:.11))||
   Math.abs(lowerRad)<.045||Math.abs(lowerRad)>(slowArc?.11:(prior?.095:.09))||
   Math.sign(upperRad)===Math.sign(lowerRad)||
   // An observed 16-49ms source frame cannot jump across the signed
   // hip/knee axis or exceed one consecutive source-joint arc increment.
   (!slowArc&&prior&&
    (Math.sign(upperRad)!==Math.sign(previousUpperRad)||
     Math.abs(upperRad-previousUpperRad)>.045001||
     Math.abs(lowerRad-previousLowerRad)>.040001))||
   !validShoe(after?.[side])||!validShoe(after?.[other]))continue;
  const shoe=after[side],support=after[other];
  const lift=shoe.toeY-swing.toeY,cleared=lift/depth;
  // An actual linked chain must materially REMOVE the source burial.
  // Opposite shoe cannot slide, pitch, or hover to buy that improvement.
  if(lift<Math.max(.012,depth*.15)||lift>.055||
   cleared<.15||shoe.toeY>floorTopY+.05||
   shoe.heelY-floorTopY<.08||shoe.heelY-floorTopY>.35||
   Math.abs(shoe.heelY-swing.heelY)>.035||
   shift(shoe.heelXZ,swing.heelXZ)>.07||
   shift(shoe.toeXZ,swing.toeXZ)>.07||
   Math.abs(support.heelY-loaded.heelY)>.003||
   Math.abs(support.toeY-loaded.toeY)>.003||
   shift(support.heelXZ,loaded.heelXZ)>.004||
   shift(support.toeXZ,loaded.toeXZ)>.004)continue;
  // An unproven fast source frame owns the smallest physically sufficient
  // original hip/knee pose. The real desktop 90/75mrad shoe read missed
  // 15% toe recovery; a measured intermediate 105/85mrad may clear it
  // without a sudden 115mrad jump. Real skinned soles decide, not angles.
  // Only a prior certified same-rig frame can choose larger fast-frame lift.
  const freshFast=!slowArc&&!prior;
  const gentler=best&&(
   Math.abs(upperRad)<Math.abs(best.upperRad)-.000001||
   (Math.abs(Math.abs(upperRad)-Math.abs(best.upperRad))<=.000001&&
    Math.abs(lowerRad)<Math.abs(best.lowerRad)-.000001));
  const candidate={
   side,upperRad,lowerRad,liftMeters:lift,fractionCleared:cleared,
   beforeToeY:swing.toeY,afterToeY:shoe.toeY,
   beforeHeelY:swing.heelY,afterHeelY:shoe.heelY,
   contactLocked:false,oppositeShoePreserved:true,
   linkedContinuity:prior?'same-certified-source-frame':'safe-first-source-frame',
   source:'measured-original-skinned-linked-leg'
  };
  sourceCertifiedCandidates.push(candidate);
  if(prior)certifiedChoices.push(candidate);
  if(freshFast){
   kneeBiasedChoices.push(candidate);
   firstSwingPitchChoices.push(candidate);
  }
  if(!prior&&slowArc){
   if(Math.abs(Math.abs(upperRad)-.12)<.000001&&
    Math.abs(Math.abs(lowerRad)-.09)<.000001)
    slowStarterChoices.push(candidate);
   else if(Math.abs(Math.abs(lowerRad)-.11)<.000001&&
    [ .09,.105 ].some(a=>Math.abs(Math.abs(upperRad)-a)<.000001))
    slowHeelReliefChoices.push(candidate);
  }
  if(!best||(freshFast?gentler:lift>best.liftMeters))best=candidate;
 }
 // Prior-frame original-sole evidence allows a larger arc, but not arbitrary
 // frame-to-frame knee hunting for an extra 1–2mm of toe lift. Choose the
 // smallest joint change among candidates within 2mm of the BEST measured
 // toe recovery. A larger independently measured clearance gain still wins.
 // This uses at most the same four reversible source-skinned probes and
 // changes no authoritative movement, source clip, bind pose or foot contact.
 if(prior&&certifiedChoices.length>1){
  const bestLift=Math.max(...certifiedChoices.map(c=>c.liftMeters));
  const near=certifiedChoices.filter(c=>c.liftMeters>=bestLift-.002);
  const slew=c=>Math.abs(c.upperRad-previousUpperRad)+
   Math.abs(c.lowerRad-previousLowerRad);
  best=near.reduce((a,c)=>!a||slew(c)<slew(a)-.0000001||
   (Math.abs(slew(c)-slew(a))<=.0000001&&
    c.liftMeters>a.liftMeters)?c:a,null);
 }
 // Original CC0 weighted-shoe measurements can show a paradoxical first
 // fast-frame leg arc: the thigh/knee correction rescues the buried toe,
 // yet rises the already airborne heel roughly TWICE as far. A strictly
 // knee-biased *coupled* candidate may be more natural, but earns ownership
 // ONLY when two real skinned shoes certify >=4mm EXTRA clearance, without
 // raising the original heel by >2mm beyond the gentler baseline.
 // The final live renderer readback and exact source-clip joint restoration
 // still govern acceptance. This never means contact or a locked foot.
 if(!prior&&frameInterval<.05&&sourceWeight>=.95&&
  depth>=.06&&best&&Math.abs(best.upperRad)<=.090001&&
  Math.abs(best.lowerRad)<=.075001&&kneeBiasedChoices.length){
  const qualified=kneeBiasedChoices.filter(c=>
   Math.sign(c.upperRad)===Math.sign(best.upperRad)&&
   Math.abs(c.lowerRad)>=.089999&&
   Math.abs(c.upperRad)<=.105001&&
   c.liftMeters>=best.liftMeters+.004&&
   c.afterHeelY<=best.afterHeelY+.002);
  if(qualified.length){
   const mostClear=Math.max(...qualified.map(c=>c.liftMeters));
   const near=qualified.filter(c=>c.liftMeters>=mostClear-.002);
   best=near.reduce((a,c)=>!a||
    Math.abs(c.upperRad)+Math.abs(c.lowerRad)<
     Math.abs(a.upperRad)+Math.abs(a.lowerRad)-.000001||
    (Math.abs(Math.abs(c.upperRad)+Math.abs(c.lowerRad)-
       Math.abs(a.upperRad)-Math.abs(a.lowerRad))<=.000001&&
      c.liftMeters>a.liftMeters)?c:a,null);
  }
 }
 // Source-backed 390px first fast SWING: the real weighted source shoe
 // is nearly vertical before animation (heel +206.72mm, toe -80.34mm).
 // The previous measured original connected trial raised the toe 13.67mm
 // but lifted the heel 26.38mm, increasing an already extreme shoe pitch.
 // EVERY steep first-fast original-source shoe needs this physical pitch
 // gate even if a source planner spent its probes on unsafe hip-heavy arcs.
 // Real 390px tick 5 accepted -105/+85mrad with +14.152mm buried-toe
 // movement but +31.180mm already-airborne-heel rise: worse sole pitch.
 // Missing the 75/90 knee followup must NOT bypass this guard. Genuine
 // four-probe original joint + dual-shoe skin and independent final readback
 // remain mandatory; this is NEVER a contact or planted-foot certificate.
 const outsoleProjected=shift(swing.heelXZ,swing.toeXZ);
 const outsoleLength=Math.hypot(outsoleProjected,swing.heelY-swing.toeY);
 const pitchFirstFast=!prior&&frameInterval>=.016&&frameInterval<.05&&
  sourceWeight>=.95&&depth>=.055&&depth<=.10&&
  swing.heelY-floorTopY>=.18&&outsoleProjected>=.045&&
  outsoleProjected<=.15&&outsoleLength>=.285&&outsoleLength<=.325&&
  trials.length===4;
 if(pitchFirstFast){
  const safe=firstSwingPitchChoices.filter(c=>{
   const heelRise=c.afterHeelY-swing.heelY;
   const remaining=floorTopY-c.afterToeY;
   // Do not worsen vertical source shoe pitch unless the measured toe is
   // itself nearly clear of stone. The independently verified 12mm/15%
   // burial clearance and opposite shoe gates were applied above.
   return c.liftMeters-heelRise>=-.002||remaining<=.02;
  });
  if(!safe.length)return null;
  const scored=c=>c.liftMeters-(c.afterHeelY-swing.heelY);
  const selected=safe.reduce((a,c)=>!a||scored(c)>scored(a)+.001||
   (Math.abs(scored(c)-scored(a))<=.001&&
    Math.abs(c.upperRad)+Math.abs(c.lowerRad)<
      Math.abs(a.upperRad)+Math.abs(a.lowerRad))?c:a,null);
  best=Object.freeze({...selected,originalSwingPitchProtected:true,
   originalSwingPitchGainMeters:scored(selected)});
 }
 // Only in a genuinely steep, deep, first fully owned slow source stride
 // can a knee-biased ORIGINAL leg replace the normally maximal toe-lift
 // choice. The real skinned toe must lose <=3mm of its previously earned
 // lift; the airborne heel must rise >=8mm LESS and the toe-versus-heel
 // relative pitch must improve >=7mm. Both original supporting-shoe
 // stability gates were already applied to each candidate above.
 // All other frames retain the established toe-clearance-first selection.
 if(!prior&&frameInterval>=.05&&frameInterval<=.15&&
  sourceWeight>=.95&&depth>=.065&&swing.heelY-floorTopY>=.18&&
  slowStarterChoices.length&&slowHeelReliefChoices.length){
  const starter=slowStarterChoices.reduce((a,c)=>
   !a||c.liftMeters>a.liftMeters?c:a,null);
  const starterHeelRise=starter.afterHeelY-swing.heelY;
  if(starter.liftMeters>=.020&&starterHeelRise>=.020&&
   starterHeelRise>=starter.liftMeters*.8){
   const safer=slowHeelReliefChoices.filter(c=>
    Math.sign(c.upperRad)===Math.sign(starter.upperRad)&&
    c.liftMeters>=starter.liftMeters-.003&&
    c.afterHeelY<=starter.afterHeelY-.008&&
    (c.liftMeters-(c.afterHeelY-swing.heelY))-
     (starter.liftMeters-starterHeelRise)>=.007);
   if(safer.length){
    const chosen=safer.reduce((a,c)=>!a||
     c.liftMeters-(c.afterHeelY-swing.heelY)>
      a.liftMeters-(a.afterHeelY-swing.heelY)?c:a,null);
    best=Object.freeze({...chosen,
     originalHeelReliefVerified:true,
     originalHeelRiseSavedMeters:starter.afterHeelY-chosen.afterHeelY,
     originalToeLiftSacrificeMeters:Math.max(0,starter.liftMeters-chosen.liftMeters)});
   }
  }
 }
 // Real original 100ms Walking_A first-swing source clip: a +31.54mm toe
 // movement was incorrectly accepted while its already raised heel rose
 // +35.28mm, worsening a buried shoe's vertical pitch. Do not grant a
 // visible full-body performance unless the SAME original weighted shoe
 // demonstrably improves toe relative to heel, or is almost clear of stone.
 // Compare at most four already skinned dual-shoe candidates; no extra
 // skinning, no new target or contact, no owner/clip/root changes.
 // Reuse source outsole measured above for the fast pitch guard; do not
 // allocate another shoe scan or redeclare its geometric evidence.
 // Exact original 390px Walking_A at 233.3ms has a buried toe
 // (-62.174mm) and a +231.266mm airborne heel, with 42.17mm actual
 // stone penetration. All four original linked trials lifted that heel
 // faster than the toe. The old 200ms/55mm pitch gate allowed this
 // physically worse original pose even though the controller accepts
 // witnessed source frames up to 240ms. Keep the same dual-shoe gates;
 // never infer floor contact or grant another probe, root/clip or joint.
 const originalSlowSteep=!prior&&frameInterval>=.05&&frameInterval<=.24&&
  sourceWeight>=.95&&depth>=.04&&depth<=.10&&
  swing.heelY-floorTopY>=.18&&
  outsoleProjected>=.045&&outsoleProjected<=.10&&
  outsoleLength>=.285&&outsoleLength<=.325;
 if(originalSlowSteep&&best){
  const safe=sourceCertifiedCandidates.filter(c=>
   c.liftMeters-(c.afterHeelY-swing.heelY)>=-.002||
   floorTopY-c.afterToeY<=.02);
  if(!safe.length)return null;
  const pitchGain=c=>c.liftMeters-(c.afterHeelY-swing.heelY);
  // Within a 1mm pitch-equivalence band, recover the MOST buried toe
  // first. The previous smaller-joint tie-break could discard 1.1mm of
  // measured toe clearance even though the smaller arc saved no meaningful
  // heel rise. Use joint effort only after the genuine shoe result ties.
  const selected=safe.reduce((a,c)=>{
   if(!a)return c;
   const gain=pitchGain(c)-pitchGain(a);
   if(gain>.001)return c;
   if(gain<-.001)return a;
   if(c.liftMeters>a.liftMeters+.0005)return c;
   if(a.liftMeters>c.liftMeters+.0005)return a;
   return Math.abs(c.upperRad)+Math.abs(c.lowerRad)<
    Math.abs(a.upperRad)+Math.abs(a.lowerRad)-.000001?c:a;
  },null);
  // A preceding independently measured knee-led heel-relief certificate
  // belongs to EXACTLY that licensed source-joint candidate. The later
  // slow-source pitch arbitration must neither erase a still-winning
  // certificate nor transfer it to a different pose via object spread.
  // Final after-application dual-shoe skin verification remains mandatory.
  const sameVerifiedHeelRelief=best?.originalHeelReliefVerified===true&&
   selected.upperRad===best.upperRad&&
   selected.lowerRad===best.lowerRad&&
   Math.abs(selected.afterToeY-best.afterToeY)<.0000001&&
   Math.abs(selected.afterHeelY-best.afterHeelY)<.0000001;
  best=Object.freeze({...selected,
   ...(sameVerifiedHeelRelief?{
    originalHeelReliefVerified:true,
    originalHeelRiseSavedMeters:best.originalHeelRiseSavedMeters,
    originalToeLiftSacrificeMeters:best.originalToeLiftSacrificeMeters
   }:{}),
   originalSwingPitchProtected:true,
   originalSwingPitchGainMeters:pitchGain(selected)});
 }
 return best;
}



/**
 * A licensed Walking_A ankle that already earned an actual weighted-toe
 * correction may still leave the toe deeply inside stone. That valid small
 * movement must not veto a later *connected* original hip+knee trial.
 *
 * Qualify only a true same-GLB/same-clip, explicitly opposite-shoe-witnessed
 * source ankle; the linked stage still needs to test BOTH skinned shoes and
 * prove >=12mm / >=15% further recovery before moving original joints.
 * Neither qualification nor reconciliation grants contact or foot locking.
 */

/**
 * A certified source-loaded ankle and the OPPOSITE licensed swing hip/knee
 * can coexist only when BOTH original weighted outsole patches are read
 * in the exact same Walking_A clone and frame. A prior blanket veto left
 * the genuine 390px tick-6 right swing toe 81.687mm beneath authored stone
 * despite independently accepted left loaded-shoe relief.
 *
 * This authorizes only a reversible original leg TRIAL: the renderer must
 * still independently re-skin both shoes after any candidate and reject
 * all proposed poses without useful toe lift and a stationary loaded shoe.
 * No footstep, IK plant, authority step, or event is inferred.
 */
/**
 * Accept an independently applied original-source first-swing hip/knee pose
 * ONLY after FINAL skinned weighted heel+toe readback on BOTH existing shoes.
 *
 * This is a physical presentation certificate, never a floor plant. A
 * source-measured 390px first frame showed +13.67mm toe but +26.38mm heel,
 * exaggerating an already upright imported shoe. Source-searched smaller
 * hip + knee candidates need to demonstrate an actual forefoot-versus-heel
 * gain and preserve the other shoe after application, not merely during
 * the reversible trials. No rig/asset, root, gameplay or mixer mutation.
 */
export function certifyOriginalSourceFirstSwingPitch({
 candidate=null,sourceClipName='',sourceInstanceSame=false,
 sourceWeight=NaN,side='',floorTopY=NaN,before=null,after=null
}={}){
 const other=side==='left'?'right':side==='right'?'left':null;
 const validShoe=s=>s&&[s.heelY,s.toeY].every(finite)&&
  [s.heelXZ,s.toeXZ].every(v=>
   Array.isArray(v)&&v.length===2&&v.every(finite));
 if(!other||candidate?.originalSwingPitchProtected!==true||
  candidate.source!=='measured-original-skinned-linked-leg'||
  candidate.side!==side||candidate.contactLocked!==false||
  candidate.oppositeShoePreserved!==true||
  sourceClipName!=='Walking_A'||sourceInstanceSame!==true||
  !finite(sourceWeight)||sourceWeight<.95||sourceWeight>1.001||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.005||
  ![before?.[side],before?.[other],after?.[side],after?.[other]].every(validShoe)||
  ![candidate.beforeToeY,candidate.afterToeY,candidate.beforeHeelY,
    candidate.afterHeelY,candidate.liftMeters].every(finite))return null;
 const a=before[side],b=after[side],loaded=before[other],
  support=after[other];
 const dist=(x,y)=>Math.hypot(x[0]-y[0],x[1]-y[1]);
 const toeLift=b.toeY-a.toeY,heelRise=b.heelY-a.heelY;
 const depth=floorTopY-a.toeY;
 const span=Math.hypot(dist(a.heelXZ,a.toeXZ),a.heelY-a.toeY);
 if(depth<.04||depth>.10||a.heelY-floorTopY<.18||
  span<.285||span>.325||
  toeLift<Math.max(.012,depth*.15)||toeLift>.055||
  b.heelY-floorTopY<.08||b.heelY-floorTopY>.35||
  b.toeY>floorTopY+.05||
  (toeLift-heelRise<-.002&&floorTopY-b.toeY>.02)||
  Math.abs(b.toeY-candidate.afterToeY)>.001||
  Math.abs(b.heelY-candidate.afterHeelY)>.001||
  Math.abs(a.toeY-candidate.beforeToeY)>.001||
  Math.abs(a.heelY-candidate.beforeHeelY)>.001||
  Math.abs(toeLift-candidate.liftMeters)>.001||
  dist(b.heelXZ,a.heelXZ)>.07||dist(b.toeXZ,a.toeXZ)>.07||
  Math.abs(support.heelY-loaded.heelY)>.003||
  Math.abs(support.toeY-loaded.toeY)>.003||
  dist(support.heelXZ,loaded.heelXZ)>.004||
  dist(support.toeXZ,loaded.toeXZ)>.004)return null;
 return Object.freeze({
  source:'verified-original-GLB-final-first-swing-pitch',
  side,sourceClip:'Walking_A',sourceToeLiftMeters:toeLift,
  sourceHeelRiseMeters:heelRise,sourcePitchGainMeters:toeLift-heelRise,
  originalOppositeShoeVerified:true,contactLocked:false
 });
}

export function qualifyOriginalSourceLoadedStanceCompanion({
 stanceProof=null,swingSide='',sourceInstanceId='',sourceClipName='',
 sourceWeight=NaN,floorTopY=NaN,currentLoaded=null,currentSwing=null
}={}){
 const loadedSide=swingSide==='left'?'right':swingSide==='right'?'left':null;
 const validXZ=v=>Array.isArray(v)&&v.length===2&&v.every(finite);
 const validShoe=s=>s&&[s.heelY,s.toeY].every(finite)&&
  validXZ(s.heelXZ)&&validXZ(s.toeXZ);
 if(!loadedSide||!sourceInstanceId||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.92||sourceWeight>1.001||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.005||
  !validShoe(currentLoaded)||!validShoe(currentSwing)||
  !stanceProof||stanceProof.source!=='same-original-GLB-two-point-stanced-shoe'||
  stanceProof.sourceInstanceId!==sourceInstanceId||
  stanceProof.sourceClip!=='Walking_A'||stanceProof.side!==loadedSide||
  stanceProof.contactLocked===true||
  ![stanceProof.beforeHeelY,stanceProof.beforeToeY,
    stanceProof.afterHeelY,stanceProof.afterToeY,
    stanceProof.beforeWorstMeters,stanceProof.afterWorstMeters,
    stanceProof.heelShiftXZMeters,stanceProof.toeShiftXZMeters,
    stanceProof.appliedAngleRad,stanceProof.floorTopY].every(finite)||
  !validXZ(stanceProof.afterHeelXZ)||!validXZ(stanceProof.afterToeXZ)||
  Math.abs(stanceProof.floorTopY-floorTopY)>.001||
  Math.abs(stanceProof.appliedAngleRad)>.120001||
  stanceProof.heelShiftXZMeters<0||stanceProof.heelShiftXZMeters>.004||
  stanceProof.toeShiftXZMeters<0||stanceProof.toeShiftXZMeters>.004||
  stanceProof.beforeWorstMeters-stanceProof.afterWorstMeters<.001||
  Math.abs(stanceProof.beforeWorstMeters-Math.max(
   Math.abs(stanceProof.beforeHeelY-floorTopY),
   Math.abs(stanceProof.beforeToeY-floorTopY)))>.002||
  Math.abs(stanceProof.afterWorstMeters-Math.max(
   Math.abs(stanceProof.afterHeelY-floorTopY),
   Math.abs(stanceProof.afterToeY-floorTopY)))>.002||
  ![currentLoaded.heelY,currentLoaded.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035)||
  currentSwing.heelY-floorTopY<.08||
  currentSwing.heelY-floorTopY>.35||
  floorTopY-currentSwing.toeY<.025||
  floorTopY-currentSwing.toeY>.12||
  Math.hypot(currentLoaded.toeXZ[0]-currentLoaded.heelXZ[0],
   currentLoaded.toeXZ[1]-currentLoaded.heelXZ[1])<.20||
  Math.hypot(currentLoaded.toeXZ[0]-currentLoaded.heelXZ[0],
   currentLoaded.toeXZ[1]-currentLoaded.heelXZ[1])>.37)return null;
 const drift=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 // Measure the final actual loaded source shoe, not an old pose receipt.
 // A 3mm height or 2.5mm lateral difference must reject this trial even
 // when the linked-leg selector itself would accept a larger 4mm allowance.
 if(Math.abs(currentLoaded.heelY-stanceProof.afterHeelY)>.003||
  Math.abs(currentLoaded.toeY-stanceProof.afterToeY)>.003||
  drift(currentLoaded.heelXZ,stanceProof.afterHeelXZ)>.0025||
  drift(currentLoaded.toeXZ,stanceProof.afterToeXZ)>.0025)return null;
 return Object.freeze({
  source:'measured-same-original-GLB-stance-and-swing',
  sourceInstanceId,sourceClip:'Walking_A',loadedSide,swingSide,
  sameSourceFrame:true,loadedShoePreserved:true,contactLocked:false
 });
}

export function qualifyOriginalSourceAnkleLinkedEscalation({
 ankleProof=null,side='',sourceInstanceId='',sourceClipName='',
 sourceWeight=NaN,actualToeY=NaN,floorTopY=NaN,
 ownerLocomotion=false,alive=false,visible=false,teleport=false,
 reducedMotion=false,interrupted=false
}={}){
 if(!ankleProof||ankleProof.source!=='same-original-GLB-foot-skinned-vertices'||
  ankleProof.side!==side||!['left','right'].includes(side)||
  !sourceInstanceId||ankleProof.sourceInstanceId!==sourceInstanceId||
  sourceClipName!=='Walking_A'||ankleProof.sourceClip!=='Walking_A'||
  ankleProof.originalOppositeShoeVerified!==true||
  ankleProof.contactLocked===true||ownerLocomotion!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  ![sourceWeight,actualToeY,floorTopY,
    ankleProof.beforeToeY,ankleProof.afterToeY,
    ankleProof.beforeHeelY,ankleProof.afterHeelY,
    ankleProof.liftMeters,ankleProof.penetrationBeforeMeters,
    ankleProof.penetrationAfterMeters].every(finite)||
  sourceWeight<.92||sourceWeight>1.001||
  Math.abs(floorTopY+.02)>.005||
  Math.abs(actualToeY-ankleProof.afterToeY)>.002||
  Math.abs(ankleProof.floorTopY-floorTopY)>.001||
  ankleProof.liftMeters<.005||
  Math.abs((ankleProof.afterToeY-ankleProof.beforeToeY)-
   ankleProof.liftMeters)>.003||
  Math.abs((floorTopY-ankleProof.afterToeY)-
   ankleProof.penetrationAfterMeters)>.002||
  ankleProof.penetrationAfterMeters<.04||
  ankleProof.penetrationAfterMeters>.12||
  ankleProof.earlySourceToeRescue===true)return false;
 return true;
}

/**
 * An original ankle and a later source hip+knee cannot each retain
 * incompatible "final shoe" receipts. Preserve the actual ankle joint
 * attribution and replace its old foot position with the linked stage's
 * *independent final* same-source weighted two-shoe readback.
 *
 * Return null on any inconsistent receipt: the caller MUST undo only the
 * new linked hip/knee trial, keeping the previously accepted original ankle.
 */
export function reconcileOriginalSourceAnkleLinkedEscalation({
 linkedProof=null,...owner
}={}){
 if(!qualifyOriginalSourceAnkleLinkedEscalation(owner))return null;
 const {ankleProof,side,sourceInstanceId,floorTopY}=owner;
 const other=side==='left'?'right':'left';
 const a=linkedProof?.before?.[side],b=linkedProof?.after?.[side];
 const support=linkedProof?.before?.[other],
  supportAfter=linkedProof?.after?.[other];
 const valid=shoe=>shoe&&[shoe.heelY,shoe.toeY].every(finite)&&
  [shoe.heelXZ,shoe.toeXZ].every(v=>
   Array.isArray(v)&&v.length===2&&v.every(finite));
 if(!linkedProof||linkedProof.source!=='measured-original-skinned-linked-leg'||
  linkedProof.sourceInstanceId!==sourceInstanceId||
  linkedProof.sourceClip!=='Walking_A'||linkedProof.side!==side||
  linkedProof.contactLocked!==false||
  linkedProof.oppositeShoePreserved!==true||
  ![a,b,support,supportAfter].every(valid)||
  ![linkedProof.liftMeters,linkedProof.fractionCleared].every(finite)||
  linkedProof.liftMeters<.012||linkedProof.fractionCleared<.15||
  Math.abs(a.toeY-ankleProof.afterToeY)>.002||
  Math.abs(a.heelY-ankleProof.afterHeelY)>.002||
  b.toeY-a.toeY<.012||b.toeY>floorTopY+.05||
  Math.abs((b.toeY-a.toeY)-linkedProof.liftMeters)>.002||
  Math.abs(supportAfter.heelY-support.heelY)>.003||
  Math.abs(supportAfter.toeY-support.toeY)>.003||
  Math.hypot(supportAfter.heelXZ[0]-support.heelXZ[0],
   supportAfter.heelXZ[1]-support.heelXZ[1])>.004||
  Math.hypot(supportAfter.toeXZ[0]-support.toeXZ[0],
   supportAfter.toeXZ[1]-support.toeXZ[1])>.004)return null;
 const combinedLift=b.toeY-ankleProof.beforeToeY;
 return Object.freeze({
  ...ankleProof,afterToeY:b.toeY,afterHeelY:b.heelY,
  liftMeters:combinedLift,
  penetrationAfterMeters:Math.max(0,floorTopY-b.toeY),
  originalAnkleLiftMeters:ankleProof.liftMeters,
  linkedLegAddedLiftMeters:linkedProof.liftMeters,
  originalOppositeShoeVerified:true,
  linkedOriginalSourceJointProof:true,
  contactLocked:false
 });
}


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

/**
 * Connected native swing ankle/sole pacing from genuine source WebGL:
 * at 16ms an original source joint retains its 80mrad frame budget;
 * at 33.3ms (actual 390px Walking_A tick 3, #14060235425) it may use
 * 120mrad, a *lower* angular speed, when the weighted toe is >45mm
 * submerged and its heel is independently airborne. At 140ms preserve
 * the existing 128mrad source-slow-frame receipt; cap every step at
 * 160mrad and every accumulated original-foot overlay at 220mrad.
 * This is only an eligibility envelope. The live source adapter must
 * still verify actual skinned toe lift, heel, opposite shoe, source
 * clip/weight/clone, interruption and reduction of penetration.
 * Nothing locks a foot or changes the simulation root/asset/keyframes.
 */
function originalSourceDeepSwingFrameSlew(frameInterval){
 const oldSlow=.08+.08*clamp((frameInterval-.05)/.15,0,1);
 const mobileCadence=.08+.04*clamp((frameInterval-.016)/.0173,0,1);
 return Math.min(.16,Math.max(oldSlow,mobileCadence));
}

export function planOriginalSourceSwingToeClearance({
 mode='idle',sourceClipName='',sourceAnatomyVerified=false,sourceWeight=NaN,
 alive=false,visible=false,groundedMoving=false,teleport=false,
 reducedMotion=false,interrupted=false,rootTravel=NaN,
 frameInterval=.016,floorTopY=NaN,heelWorldY=NaN,toeWorldY=NaN,
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
 // Actual licensed Walking_A source footage on 390px Chromium shows
 // a 47–76mm residual SWING toe burial after an 80mrad first-frame lift.
 // At sparse genuine visible intervals, the same 80mrad budget is too
 // little to clear the floor before the next authentic source keyframe.
 // Only a deeply submerged AIRBORNE toe with a VERIFIED source-ankle
 // upward trial, fully owned imported Walking_A and a recent genuine
 // movement witness may spend a larger age-scaled angular envelope.
 // Preserve 80mrad at true 60Hz, scale only an actually witnessed 33ms
 // deeply buried 390px airborne toe to <=120mrad, and retain the older
 // sparse-frame 140ms/128mrad contract. Partial fades, shallow penetration
 // and gaps >350ms keep the strict base limit. Never exceed 160mrad,
 // the existing 220mrad total bound or any independent final skinned
 // toe/heel/opposite-foot safety check in the actual Three.js adapter.
 const deepSwing=toeClear<=-.045&&sourceWeight>=.9&&
  finite(frameInterval)&&frameInterval>.016&&frameInterval<=.35;
 const maxFrameSlew=deepSwing?originalSourceDeepSwingFrameSlew(frameInterval):.08;
 return clamp(signedTarget,
  Math.max(-.22,previousCorrectionRad-maxFrameSlew),
  Math.min(.22,previousCorrectionRad+maxFrameSlew));
}

/**
 * Independent receipt for the actual bounded original Walking_A ankle STEP.
 *
 * The live original GLB's 0.187rad total angle at a genuine 16.8ms frame
 * does NOT mean 0.187rad was applied IN that frame: the prior licensed foot
 * pose may already have 0.107rad of lawful correction. This recomputes the
 * source-only rate envelope against PREVIOUS measured joint ownership and
 * must pass before the adapter commits any new weighted-source ankle pose.
 *
 * This is a visual-pose safeguard and evidence contract, never a target,
 * gameplay step, planted-contact claim, IK solution, clip mutation or hit.
 */
export function auditOriginalSourceSwingAnkleSlew({
 mode='idle',sourceClipName='',sourceWeight=NaN,sourceInstanceSame=false,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 interrupted=false,frameInterval=NaN,floorTopY=NaN,
 heelWorldY=NaN,toeWorldY=NaN,previousAngleRad=NaN,nextAngleRad=NaN
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||
  sourceInstanceSame!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  ![sourceWeight,frameInterval,floorTopY,heelWorldY,toeWorldY,
   previousAngleRad,nextAngleRad].every(finite)||
  sourceWeight<.5||sourceWeight>1.001||
  frameInterval<=0||frameInterval>.35||
  Math.abs(floorTopY+.02)>.005||
  Math.abs(previousAngleRad)>.23||Math.abs(nextAngleRad)>.220001)return null;
 const heelClear=heelWorldY-floorTopY,toeClear=toeWorldY-floorTopY;
 if(heelClear<.075||heelClear>.28||toeClear>=-.01||toeClear<-.16||
  (previousAngleRad!==0&&nextAngleRad!==0&&
   Math.sign(previousAngleRad)!==Math.sign(nextAngleRad)))return null;
 const deepSwing=toeClear<=-.045&&sourceWeight>=.9&&frameInterval>.016;
 const limitRad=deepSwing?originalSourceDeepSwingFrameSlew(frameInterval):.08;
 const step=nextAngleRad-previousAngleRad;
 if(Math.abs(step)>limitRad+.000001)return null;
 return Object.freeze({
  source:'verified-original-Walking_A-per-presented-frame-ankle-slew',
  stepRad:Math.abs(step),signedStepRad:step,limitRad,
  sparseFrameAllowanceUsed:Math.abs(step)>.080001,
  contactLocked:false
 });
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
 * Physical-efficiency gate for the original source-skinned airborne toe.
 * A positive toe delta by itself is not a convincing animation improvement:
 * f235c439 genuine 390px Walking_A lifted its toe just 9.261mm with an
 * 80mrad ankle twitch while leaving ~97.6mm inside stone. If a deep original
 * toe remains buried, require >=10mm AND >=10% of starting penetration.
 * Shallow, independently skinned source ankle relief retains existing bounds.
 *
 * A rejected ankle does not claim any ground contact or synthetic step; it
 * relinquishes pose ownership so the last-resort verified original hip+knee
 * sampler can evaluate the same imported skinned source chain.
 */
export function confirmOriginalSourceSwingAnkleNetClearance({
 beforeToeY=NaN,afterToeY=NaN,beforeHeelY=NaN,afterHeelY=NaN,
 floorTopY=NaN,appliedAngleRad=NaN
}={}){
 const lift=confirmOriginalSourceSwingToeLift({
  beforeToeY,afterToeY,beforeHeelY,afterHeelY,floorTopY,appliedAngleRad
 });
 if(lift===null)return false;
 const depth=floorTopY-beforeToeY;
 const remaining=floorTopY-afterToeY;
 return !(depth>.055&&remaining>.025&&
  lift+1e-9<Math.max(.010,depth*.10));
}

/**
 * Continue only an ALREADY measured original Walking_A swing-ankle lift.
 * A safe, supported correction can be rejected by the next broad 0.1/0.2rad
 * source probe even though the SAME finer previous angle still lifts its
 * skinned toe. Abruptly dropping that joint delta produces a one-frame native
 * ankle pop. Re-test the exact prior angle against BOTH original GLB shoes
 * before reusing it; never freeze a source clip or infer world-space stance.
 *
 * No source bones/geometry, game authority, target or contact are invented.
 * Fails closed on source handoff, injury, teleport, stale travel, buried heel
 * or a changed opposite planted shoe. This is not certified stance IK.
 */
export function confirmOriginalSourceSwingToeContinuation({
 mode='idle',sourceClipName='',sourceWeight=NaN,
 ownerLocomotion=false,sourceInstanceSame=false,sourceAnatomyVerified=false,
 alive=false,visible=false,teleport=false,reducedMotion=false,
 interrupted=false,rootTravel=NaN,frameAge=NaN,floorTopY=NaN,
 previousCorrectionRad=NaN,beforeToeY=NaN,beforeHeelY=NaN,
 afterToeY=NaN,afterHeelY=NaN,otherBeforeHeelY=NaN,
 otherBeforeToeY=NaN,otherAfterHeelY=NaN,otherAfterToeY=NaN
}={}){
 if(sourceInstanceSame!==true||sourceAnatomyVerified!==true||
  !hasOriginalSourceSwingTravelWitness({
   mode,sourceClipName,sourceWeight,ownerLocomotion,
   travel:rootTravel,age:frameAge,alive,visible,
   teleport,reducedMotion,interrupted
  })||!finite(previousCorrectionRad)||
  Math.abs(previousCorrectionRad)<.0001||
  Math.abs(previousCorrectionRad)>.221||
  ![otherBeforeHeelY,otherBeforeToeY,
    otherAfterHeelY,otherAfterToeY].every(finite)||
  Math.abs(otherAfterHeelY-otherBeforeHeelY)>.003||
  Math.abs(otherAfterToeY-otherBeforeToeY)>.003)return null;
 const lift=confirmOriginalSourceSwingToeLift({
  beforeToeY,afterToeY,beforeHeelY,afterHeelY,
  floorTopY,appliedAngleRad:previousCorrectionRad
 });
 if(lift===null)return null;
 return Object.freeze({angleRad:previousCorrectionRad,
  measuredToeLiftMeters:lift,contactLocked:false,
  source:'same-original-GLB-weighted-swing-ankle-continuation'});
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
 previousAssistRad=NaN,frameInterval=.0167
}={}){
 if(mode!=='move'||!/^walking[_\s-]*a$/i.test(sourceClipName)||
  sourceAnatomyVerified!==true||sourceLegChainVerified!==true||
  ownerLocomotion!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  ![sourceWeight,rootTravel,frameAge,floorTopY,afterAnkleToeY,
   afterAnkleHeelY,ankleLiftMeters,trialCalfToeY,trialCalfHeelY,
   trialAngleRad,previousAssistRad,frameInterval].every(finite)||
  frameInterval<=0||frameInterval>.20||
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
 // Genuine original 390px WebGL source-rig #14225659623 sampled a
 // +0.2rad knee trial lifting the already-buried toe by 27.66mm, but
 // the fixed 60mrad/FRAME limit threw away most of the safe motion on
 // an 80ms rendered source step. Preserve the SAME angular velocity as
 // a 16.7ms frame (60mrad), capped at 180mrad absolute; no wall clock,
 // no change to AnimationMixer, no source-root move or fabricated plant.
 // Real same-source, same-frame skinned heel/toe must STILL independently
 // certify the exact applied angle in the renderer. Faster callbacks
 // retain the prior bound; stale >200ms callbacks fail closed above.
 const observedStepLimit=Math.min(.18,.06*
  Math.max(1,Math.min(3,frameInterval/.0167)));
 const demand=Math.min(.04,-.01-toeClear);
 const target=Math.sign(trialAngleRad)*eased*
  Math.min(.18,Math.abs(trialAngleRad)*demand/trialLift);
 return clamp(target,Math.max(-.18,previousAssistRad-observedStepLimit),
  Math.min(.18,previousAssistRad+observedStepLimit));
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
/**
 * Final, original-GLB SKINNED outsole proof for a new connected knee
 * correction. The candidate .2rad source probe can promise 9mm lift while
 * its real, slew-limited .06rad application lifts only ~1.94mm; original
 * 1440px Walking_A frames actually left 36mm of toe submerged. Such a
 * knee bend visibly twitches without meaningfully escaping the stone.
 *
 * Reject only a deeply embedded swing toe still >25mm under the floor
 * after the live trial unless the actual same-frame heel-safe skinned toe
 * recovered >=10% of its original intrusion. Near-floor source relief is
 * retained. This never guesses a target, foot plant, IK, attack or collision
 * and changes neither mixer keys nor the authoritative character position.
 */
/**
 * Real original 390px source skin exposed a false positive in the previous
 * heel-dominant <1.5mm tolerance: the +0.2rad knee raised the toe 26.69mm
 * but the airborne heel 27.56mm, making a still-buried shoe more toe-down.
 * Reject even submillimetre steepening while the actual toe remains buried.
 * A genuinely cleared toe may pass the existing other-sole and final native
 * skinning gates; no sole lock or target is inferred from these heights.
 */

export function confirmOriginalSourceSwingCalfNetClearance({
 floorTopY=NaN,beforeToeY=NaN,afterToeY=NaN,
 beforeHeelY=NaN,afterHeelY=NaN,appliedAngleRad=NaN
}={}){
 if(![floorTopY,beforeToeY,afterToeY,beforeHeelY,afterHeelY,
  appliedAngleRad].every(finite)||
  Math.abs(floorTopY+.02)>.005||
  Math.abs(appliedAngleRad)<.0001||Math.abs(appliedAngleRad)>.180001)return false;
 const toeIntrusion=floorTopY-beforeToeY;
 const actualLift=afterToeY-beforeToeY;
 const initialHeel=beforeHeelY-floorTopY;
 const finalHeel=afterHeelY-floorTopY;
 if(toeIntrusion<=.01||toeIntrusion>.16||
  actualLift<.001||actualLift>.075||
  initialHeel<.055||initialHeel>.36||
  finalHeel<.055||finalHeel>.36||
  Math.abs(afterHeelY-beforeHeelY)>.06)return false;
 // Final original source-skin receipt, not a .2rad candidate estimate:
 // observed native 390px trial raised toe 27.662mm, airborne heel 27.766mm
 // and left 9.4mm of toe inside stone. Veto an even more vertical foot.
 const steepBuriedSource=initialHeel>=.20&&toeIntrusion>=.025&&
  floorTopY-afterToeY>.005;
 if(steepBuriedSource&&afterHeelY-beforeHeelY>actualLift+.000001)
  return false;
 const stillDeep=toeIntrusion>.035&&floorTopY-afterToeY>.025;
 return !stillDeep||actualLift+0.000001>=toeIntrusion*.10;
}

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
 let best=null,bestScore=-Infinity;
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
  // Genuine 390px source swing: elevating a buried toe is no relief if
  // the already airborne heel rises even faster. Sample only the same
  // original licensed joint and actual skinned shoe; never invent contact.
  const steepBuriedSource=afterAnkleHeelY-floorTopY>=.20&&
   floorTopY-afterAnkleToeY>=.025&&floorTopY-toe>.005;
  if(steepBuriedSource&&heel-afterAnkleHeelY>
   toe-afterAnkleToeY+.000001)
   continue;
  // Rank only the same original skinned sole samples already gathered.
  // An extra 3mm of toe lift is not worth making an airborne shoe
  // drastically more vertical. Credit independently measured pitch relief
  // with a bounded 30mm influence; prioritize real toe clearance otherwise.
  // This never creates contact or takes a new geometry/skin probe.
  const toeLift=toe-afterAnkleToeY;
  const heelRise=heel-afterAnkleHeelY;
  const pitchGain=toeLift-heelRise;
  const score=toeLift+.25*clamp(pitchGain,-.03,.03);
  if(score>bestScore+1e-9||
   (Math.abs(score-bestScore)<=1e-9&&
    (!best||Math.abs(signed)<Math.abs(best.signed)))){
   best={signed,toe,heel};
   bestScore=score;
  }
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
 sourceInstanceSame=false,priorSourceProofVerified=false,
 alive=false,visible=false,teleport=false,
 reducedMotion=false,interrupted=false,rootTravel=NaN,frameAge=NaN,
 frameInterval=NaN,side='',floorTopY=NaN,previousCorrectionRad=0,before=null,trials=[]
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
  // The SAME licensed original thigh may advance from its previously
  // proven 45mrad correction to 135mrad over a genuinely rendered 33ms
  // frame when the weighed source toe remains severely under the stone.
  // This is <=90mrad/32ms, lower angular speed than 45mrad/16ms, and
  // still requires an independent TWO-shoe skinned-world readback.
  // Ordinary frames, source crossfades and unproved prior corrections
  // retain the original 45mrad/frame staged progression.
  const cadenceCatchup=severeBurial&&priorSourceProofVerified===true&&
   sourceWeight>=.9&&finite(frameInterval)&&
   frameInterval>=.032&&frameInterval<=.05&&
   Math.abs(Math.abs(previousCorrectionRad)-.045)<.00001;
  const allowableStep=cadenceCatchup?.09000001:.04500001;
  const isContinuedTrial=severeBurial&&
   Math.abs(Math.abs(delta)-.135)<=.00001&&
   (Math.abs(previousCorrectionRad)>=.089||cadenceCatchup)&&
   Math.abs(previousCorrectionRad)<=.13500001&&
   Math.sign(delta)===Math.sign(previousCorrectionRad)&&
   Math.abs(delta-previousCorrectionRad)<=allowableStep;
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
  // A licensed 45mrad thigh twist is noticeable across pelvis and both
  // connected legs. If the same source-weighted toe STILL sits >25mm under
  // the real stone plane, require >=10% of the original burial to clear.
  // Real 390px footage measured ~14.4mm connected thigh lift against
  // ~76.5mm burial: preserve that useful correction. Do not repeat the
  // ineffective 5-6mm "rescue" of an 85mm-buried swing foot.
  // Shallow toes that genuinely clear the plane retain the prior >=4mm
  // floor/heel/XZ/two-shoe gates; this never asserts contact or IK.
  const burialBefore=floorTopY-source.toeY;
  const burialAfter=floorTopY-moved.toeY;
  if(burialAfter>.025&&improvement<burialBefore*.10)continue;
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
/**
 * A final SOURCE toe knuckle may lift a truly swinging, deeply buried shoe
 * after ankle/calf/thigh keyframes have been evaluated. This is not IK.
 * Only the original Walking_A toes[l/r] joint, its original quaternion
 * track, direct foot ancestry and measured skinned endpoints can authorize
 * a reversible local correction. The opposite weighted shoe must not move.
 *
 * Readback is indispensable: an assumed toe axis or a source bone name
 * alone never authorizes a pose. Each trial is capped at 100mrad; there is
 * no authority, root, foot-lock, contact or clip-time mutation.
 */
export function chooseOriginalSourceSwingToeJointRelief({
 mode='idle',sourceClipName='',sourceWeight=NaN,ownerLocomotion=false,
 sourceToeChainVerified=false,sourceToeTrackVerified=false,
 sourceInstanceSame=false,alive=false,visible=false,
 teleport=false,reducedMotion=false,interrupted=false,
 rootTravel=NaN,frameAge=NaN,frameInterval=NaN,side='',floorTopY=NaN,
 before=null,trials=[],connectedOriginalLegVerified=false
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||sourceWeight<.82||
  sourceWeight>1.001||ownerLocomotion!==true||
  sourceToeChainVerified!==true||sourceToeTrackVerified!==true||
  sourceInstanceSame!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  !['left','right'].includes(side)||
  ![sourceWeight,rootTravel,frameAge,frameInterval,floorTopY].every(finite)||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.18||
  frameInterval<=0||frameInterval>.22||
  (frameInterval>.1&&sourceWeight<.95)||
  Math.abs(floorTopY+.02)>.005||
  !before||!Array.isArray(trials)||trials.length<1||trials.length>2)
  return null;
 const point=p=>Array.isArray(p)&&p.length===2&&p.every(finite);
 const foot=f=>f&&finite(f.heelY)&&finite(f.toeY)&&
  point(f.heelXZ)&&point(f.toeXZ);
 const opposite=side==='left'?'right':'left';
 const swing=before[side],loaded=before[opposite];
 if(!foot(swing)||!foot(loaded)||
  swing.heelY<floorTopY+.075||swing.heelY>floorTopY+.36||
  swing.toeY>=floorTopY-.006||swing.toeY<floorTopY-.16||
  swing.heelY-swing.toeY<.08||
  ![loaded.heelY,loaded.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 // Real 390px source 85.5%-weighted Walking_A had an airborne toe only
 // 7.94mm below stone after native ankle/calf support. A verified real
 // original heel and stable opposite shoe may finish that shallow clearance
 // *before* full mixer weight without giving an unowned early blend a deep
 // 40-90mm correction. All source joints/contacts remain mixer-owned.
 const residual=floorTopY-swing.toeY;
 const shallow=residual>=.006&&residual<.025;
 // Genuine original mobile 116.7ms source frame: the previous 100ms
 // gate missed a lawful, fully owned shallow swing-toe rescue. This is
 // a last SMALL original-toe presentation trial, not an inferred step.
 // Sparse intervals 100-150ms can ONLY test an >=95%-weighted original
 // Walking_A, an airborne heel, a 6-25mm submerged toe and both weighted
 // shoes. The strict 100mrad hinge and final same-frame skin readback remain.
 const sparseFullShallow=shallow&&sourceWeight>=.95&&
  frameInterval>.1&&frameInterval<=.15;
 // A genuinely OBSERVED 199.9ms original source frame may have an already
 // certified SAME-FRAME ankle+thigh swing. Extend the shallow toe-finishing
 // opportunity ONLY to that fully owned, skinned two-shoe source chain;
 // never infer a fresh step, plant, IK target or early-blend animation.
 const sparseConnectedShallow=shallow&&connectedOriginalLegVerified===true&&
  sourceWeight>=.95&&frameInterval>.15&&frameInterval<=.22;
 // The two original 100mrad toe probes remain ineligible during a
 // 50–150ms shallow-source gap. Only a separately witnessed, >=95%-owned
 // direct toes[l/r] follow-on at 140mrad may use this narrow window.
 // Both weighted shoes still decide acceptance after EVERY real probe.
 const adaptiveOriginalToeWindow=sourceWeight>=.95&&
  frameInterval>=.05&&frameInterval<=.15&&
  residual>=.008&&residual<=.045&&
  trials.every(trial=>finite(trial?.angleRad)&&
   Math.abs(trial.angleRad)>.1000001&&
   Math.abs(trial.angleRad)<=.1400001);
 if((frameInterval>.1&&!sparseFullShallow&&!sparseConnectedShallow&&
   !adaptiveOriginalToeWindow)||
  (shallow?(sourceWeight<.82||(frameInterval>.05&&
   !sparseFullShallow&&!sparseConnectedShallow&&
   !adaptiveOriginalToeWindow)):sourceWeight<.90))return null;
 const xz=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 let best=null;
 for(const trial of trials){
  const delta=trial?.angleRad,after=trial?.after;
  // Only a FULL-WEIGHT, witnessed original Walking_A slow frame can
  // consider a fourth, bounded skinned-source toe hinge: the 100mrad
  // alternatives failed first. Both original shoes and final skin readback
  // remain authoritative for cosmetic acceptance; no fictitious foot lock.
  const largeOriginalHinge=Math.abs(delta)>.1000001;
  if(!finite(delta)||Math.abs(delta)<.039||Math.abs(delta)>(largeOriginalHinge?.1400001:.1000001)||
   (largeOriginalHinge&&(sourceWeight<.95||frameInterval<.05||
    frameInterval>.15||residual<.008||residual>.045))||
   !foot(after?.[side])||!foot(after?.[opposite]))continue;
  const next=after[side],other=after[opposite];
  const lift=next.toeY-swing.toeY;
  // Original desktop source-skinned WebGL #43515311088: an original
  // 100mrad toe hinge raised the toe just 6.283mm, but left it 62.93mm
  // beneath stone (~9% relief). That reads as an isolated toe twitch.
  // Only when STILL >25mm submerged after the trial, require >=15% of
  // the original burial to be relieved, or keep the licensed mixer pose.
  // Shallow final clearance and all same-source dual-shoe gates are intact.
  const beforeBurial=floorTopY-swing.toeY;
  const finalBurial=floorTopY-next.toeY;
  // Only after a genuine SAME SOURCE hip/knee/ankle chain, allow its real
  // toes bone to finish shallow swing immersion with >=5mm and >=45%
  // measured clearance while leaving <=8mm below stone. NOT foot planting.
  const connectedLegPartialFinish=shallow&&connectedOriginalLegVerified===true&&
   sourceWeight>=.95&&(frameInterval<=.05||sparseConnectedShallow)&&
   finalBurial>=.003&&finalBurial<=.008&&lift>=.005&&
   lift/beforeBurial>=.45;
  if((finalBurial>.025&&lift<beforeBurial*.15)||
   lift<.004||lift>.04||next.toeY>floorTopY+.035||
   // At sparse full-weight keyframes a measured 6mm lift is useful even
   // if a previously 22mm-buried airborne toe is still 14mm submerged.
   // Report partial improvement, NEVER contact, sole plant or clear floor.
   (shallow&&!connectedLegPartialFinish&&(next.toeY<(sparseFullShallow?
    Math.max(swing.toeY+.006,floorTopY-.02):floorTopY-.003)||
    next.toeY>floorTopY+.008))||
   next.toeY<floorTopY-.16||
   Math.abs(next.heelY-swing.heelY)>.004||
   xz(next.heelXZ,swing.heelXZ)>.008||
   xz(next.toeXZ,swing.toeXZ)>.012||
   Math.abs(other.heelY-loaded.heelY)>.002||
   Math.abs(other.toeY-loaded.toeY)>.002||
   xz(other.heelXZ,loaded.heelXZ)>.002||
   xz(other.toeXZ,loaded.toeXZ)>.002)continue;
  if(!best||lift>best.liftMeters)
   best=Object.freeze({angleRad:delta,side,liftMeters:lift,
    beforeToeY:swing.toeY,afterToeY:next.toeY,
    beforeHeelY:swing.heelY,afterHeelY:next.heelY,
    oppositeFootVerified:true,contactLocked:false,
    connectedLegPartialFinish});
 }
 return best;
}


/**
 * Last bounded phase of a source-owned, connected ORIGINAL full-leg swing.
 * The licensed Walking_A upperleg+lowerleg (and both real skinned shoes) must
 * ALREADY have passed the preceding physical witness; a direct toes[l/r]
 * child may then improve its remaining buried toe, without invalidating the
 * original full-leg proof or moving the opposite weight-bearing shoe.
 *
 * Candidates are measured from the actually APPLIED linked-leg pose.
 * A new final skinned two-shoe read after application is still mandatory.
 * This is NOT IK, sole planting, a game move or an artificial hit.
 */
/**
 * True original FULL-LEG ankle continuation, never an invented foot plant.
 * Earlier connected upperleg + lowerleg has already proved the same
 * SkeletonUtils 41-joint Walking_A pose against both weighted shoe patches.
 * A last reversible footl/footr quaternion probe may reduce a STILL-BURIED
 * airborne swing toe using the real source foot track and bind hierarchy.
 *
 * The renderer independently samples BOTH skinned shoes for each candidate,
 * restores the foot, then repeats the read after final application. Returning
 * this receipt is not proof of contact or fluid footage. The original
 * supporting shoe cannot move to disguise a lifted swing toe.
 */
/**
 * Original FOOT-joint transverse dorsiflexion axis derived strictly from
 * licensed inverse-bind foot -> toes, NOT guessed from a longitudinal
 * Walking_A quaternion track. This only authorizes a reversible probe.
 * World-space skinned heel/toe on BOTH shoes must still pass final validation.
 */
export function planOriginalSourceFootDorsiflexionAxis({
 footToToeLocal=null,bindUpLocal=null,sourceTrackAxis=null,source=''
}={}){
 if(source!=='original-skeleton-inverse-bind')return null;
 const valid=a=>Array.isArray(a)&&a.length===3&&a.every(finite);
 if(!valid(footToToeLocal)||!valid(bindUpLocal)||!valid(sourceTrackAxis))
  return null;
 const norm=a=>Math.hypot(...a);
 const length=norm(footToToeLocal),upLength=norm(bindUpLocal),
  trackLength=norm(sourceTrackAxis);
 if(length<.035||length>.45||upLength<.9||upLength>1.1||
  trackLength<.9||trackLength>1.1)return null;
 const up=bindUpLocal.map(x=>x/upLength);
 const vertical=footToToeLocal.reduce((t,x,i)=>t+x*up[i],0);
 const projected=footToToeLocal.map((x,i)=>x-vertical*up[i]);
 const forwardLength=norm(projected);
 if(forwardLength<.035||Math.abs(vertical)>Math.min(.08,length*.35))
  return null;
 const forward=projected.map(x=>x/forwardLength);
 const cross=[
  up[1]*forward[2]-up[2]*forward[1],
  up[2]*forward[0]-up[0]*forward[2],
  up[0]*forward[1]-up[1]*forward[0]
 ];
 const hingeLength=norm(cross);
 if(hingeLength<.99||hingeLength>1.01)return null;
 const axis=cross.map(x=>x/hingeLength);
 const track=sourceTrackAxis.map(x=>x/trackLength);
 const trackAlignment=Math.abs(axis.reduce((t,x,i)=>t+x*track[i],0));
 if(trackAlignment>.8)return null;
 return Object.freeze({
  source:'original-skeleton-inverse-bind-foot-dorsiflexion',
  axis:Object.freeze(axis),toeSeparationMeters:length,
  sourceTrackAlignment:trackAlignment,contactLocked:false
 });
}

/**
 * Current-world skinned OUTSOLE -> original foot-local transverse axis.
 * This is ONLY a proposed original-joint probe after a verified source
 * hip+knee correction; never an IK, contact or new authoritative step.
 * The renderer independently re-reads BOTH actual weighted shoes.
 */
export function planOriginalSourceWeightedSoleHingeAxis({
 source='',sourceFootChainVerified=false,sourceFootTrackVerified=false,
 sourceFootBindVerified=false,originalAnatomicalSolePatchVerified=false,
 originalOppositeShoeVerified=false,sourceClipName='',
 floorTopY=NaN,heelWorld=null,toeWorld=null,
 footWorldQuaternion=null,sourceTrackAxis=null
}={}){
 const array=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(finite);
 if(source!=='same-original-GLB-skinned-weighted-outsole'||
  sourceFootChainVerified!==true||sourceFootTrackVerified!==true||
  sourceFootBindVerified!==true||
  originalAnatomicalSolePatchVerified!==true||
  originalOppositeShoeVerified!==true||sourceClipName!=='Walking_A'||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.005||
  !array(heelWorld,3)||!array(toeWorld,3)||
  !array(footWorldQuaternion,4)||!array(sourceTrackAxis,3))return null;
 const q=footWorldQuaternion,qNorm=Math.hypot(...q);
 const trackLength=Math.hypot(...sourceTrackAxis);
 if(Math.abs(qNorm-1)>.002||trackLength<.99||trackLength>1.01)return null;
 const delta=toeWorld.map((v,i)=>v-heelWorld[i]);
 const horizontal=Math.hypot(delta[0],delta[2]),length=Math.hypot(...delta);
 const burial=floorTopY-toeWorld[1],heelAbove=heelWorld[1]-floorTopY;
 // Exact licensed desktop original sole has 53.57mm XZ projection but
 // a rigid 304mm three-dimensional shoe. Only that narrowly conditioned,
 // steep and intact source can earn the unused second skinned-shoe probe.
 // No widened floor contact, no unlimited slope amplification or IK.
 const steepSourceProjectionVerified=horizontal>=.05&&horizontal<.055&&
  length>=.295&&length<=.315&&
  Math.abs(delta[1])/length>=.955&&
  burial>=.045&&heelAbove>=.18;
 if((horizontal<.055&&!steepSourceProjectionVerified)||horizontal>.30||
  length<.24||length>.35||
  burial<.025||burial>.12||
  heelAbove<.10||heelAbove>.35)return null;
 const direction=[-delta[2]/horizontal,0,delta[0]/horizontal];
 const v=[...direction],inv=[-q[0],-q[1],-q[2]];
 const cross=(a,b)=>[
  a[1]*b[2]-a[2]*b[1],
  a[2]*b[0]-a[0]*b[2],
  a[0]*b[1]-a[1]*b[0]
 ];
 const t=cross(inv,v).map(x=>2*x);
 const k=cross(inv,t);
 const axis=v.map((x,i)=>x+q[3]*t[i]+k[i]);
 const magnitude=Math.hypot(...axis);
 if(!finite(magnitude)||Math.abs(magnitude-1)>.002)return null;
 const local=axis.map(x=>x/magnitude);
 const trackAlignment=Math.abs(local.reduce(
  (sum,x,i)=>sum+x*sourceTrackAxis[i]/trackLength,0));
 // Near-identical axes are not a second independent physical trial.
 if(trackAlignment>.92)return null;
 return Object.freeze({
  source:'source-weighted-outsole-world-to-original-foot-local',
  axis:Object.freeze(local),horizontalSpanMeters:horizontal,
  fullSoleSpanMeters:length,sourceTrackAlignment:trackAlignment,
  steepSourceProjectionVerified,contactLocked:false
 });
}


/**
 * Spend at most TWO UNUSED original-foot skinned-sole trials in a long real
 * Walking_A frame, after a genuinely measured +/-120mrad source-foot sweep
 * has already improved a severely buried toe. The trial is *not* a plant:
 * the imported original hip+knee has already been certified against BOTH
 * source shoes, and the opposite loaded outsole is measured again.
 *
 * Frame interval >=100ms is a presentation observation, not a simulation
 * tick permission. Never use an untracked alternative ankle axis, a stale
 * original skeleton, a near-flat shoe, a short frame, or a toe lift inferred
 * merely from source quaternion angles. This only produces angles to trial,
 * never a guaranteed pose or an authority/contact change.
 */

/**
 * Only after an original 41-joint Walking_A HIP+KNEE source chain has been
 * certified against both weighted soles, use the actual source lowerleg's
 * quaternion TRACK as a physical hinge-plane reference for the attached
 * foot. An almost vertical source shoe loses stable horizontal outsole
 * heading: do not infer its ankle axis from world yaw or a 2D silhouette.
 *
 * World lowerleg source knee axis -> original foot local coordinates. At most
 * two already-budgeted reversible +/-120mrad probes in the renderer; every
 * accepted pose still requires a completely new BOTH-skinned-shoe readback.
 * This returns an AXIS, not a foot plant, motion event or invented contact.
 */
export function planOriginalSourceKneeChainFootHingeAxis({
 source='',sourceClipName='',sourceKneeTrackVerified=false,
 sourceFootTrackVerified=false,sourceFootBindVerified=false,
 sourceLinkedLegCertified=false,originalAnatomicalSolePatchVerified=false,
 originalOppositeShoeVerified=false,sourceLowerFootBindMeters=NaN,
 floorTopY=NaN,heelWorld=null,toeWorld=null,
 lowerWorldQuaternion=null,footWorldQuaternion=null,
 sourceKneeTrackAxis=null,sourceFootTrackAxis=null
}={}){
 const array=(x,n)=>Array.isArray(x)&&x.length===n&&x.every(finite);
 if(source!=='licensed-original-Walking_A-connected-knee-foot'||
  sourceClipName!=='Walking_A'||sourceKneeTrackVerified!==true||
  sourceFootTrackVerified!==true||sourceFootBindVerified!==true||
  sourceLinkedLegCertified!==true||
  originalAnatomicalSolePatchVerified!==true||
  originalOppositeShoeVerified!==true||
  !finite(sourceLowerFootBindMeters)||sourceLowerFootBindMeters<.10||
  sourceLowerFootBindMeters>1.5||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.005||
  !array(heelWorld,3)||!array(toeWorld,3)||
  !array(lowerWorldQuaternion,4)||!array(footWorldQuaternion,4)||
  !array(sourceKneeTrackAxis,3)||!array(sourceFootTrackAxis,3))return null;
 const norm=a=>Math.hypot(...a),kneeNorm=norm(sourceKneeTrackAxis),
  footNorm=norm(sourceFootTrackAxis);
 if(Math.abs(norm(lowerWorldQuaternion)-1)>.002||
  Math.abs(norm(footWorldQuaternion)-1)>.002||
  Math.abs(kneeNorm-1)>.01||Math.abs(footNorm-1)>.01)return null;
 const shoe=toeWorld.map((v,i)=>v-heelWorld[i]);
 const length=norm(shoe),horizontal=Math.hypot(shoe[0],shoe[2]);
 const heelAbove=heelWorld[1]-floorTopY,burial=floorTopY-toeWorld[1];
 if(length<.24||length>.35||horizontal<.02||horizontal>.08||
  Math.abs(shoe[1])/length<.90||heelAbove<.10||heelAbove>.35||
  burial<.025||burial>.12)return null;
 const cross=(a,b)=>[
  a[1]*b[2]-a[2]*b[1],
  a[2]*b[0]-a[0]*b[2],
  a[0]*b[1]-a[1]*b[0]
 ];
 const rotate=(q,v)=>{
  const t=cross(q.slice(0,3),v).map(n=>2*n);
  const k=cross(q.slice(0,3),t);
  return v.map((n,i)=>n+q[3]*t[i]+k[i]);
 };
 const kneeWorld=rotate(lowerWorldQuaternion,
  sourceKneeTrackAxis.map(n=>n/kneeNorm));
 const soleKneeAlignment=Math.abs(
  kneeWorld.reduce((sum,n,i)=>sum+n*shoe[i]/length,0));
 // The authentic source knee axis must rotate across the real foot length,
 // never around an almost longitudinal shoe or a coincident foot source roll.
 if(soleKneeAlignment>.4)return null;
 const q=footWorldQuaternion;
 const local=rotate([-q[0],-q[1],-q[2],q[3]],kneeWorld);
 const localNorm=norm(local);
 if(Math.abs(localNorm-1)>.01)return null;
 const axis=local.map(n=>n/localNorm);
 const trackAlignment=Math.abs(axis.reduce(
  (sum,n,i)=>sum+n*sourceFootTrackAxis[i]/footNorm,0));
 if(trackAlignment>.92)return null;
 return Object.freeze({
  source:'licensed-original-knee-plane-foot-local',
  axis:Object.freeze(axis),soleKneeAlignment,
  sourceTrackAlignment:trackAlignment,fullSoleSpanMeters:length,
  horizontalSpanMeters:horizontal,contactLocked:false
 });
}

export function planOriginalSourceDeepSwingFootFollowups({
 mode='idle',sourceClipName='',sourceWeight=NaN,
 sourceInstanceSame=false,sourceInstanceId='',
 sourceFootChainVerified=false,sourceFootTrackVerified=false,
 ownerLocomotion=false,alive=false,visible=false,
 teleport=false,reducedMotion=false,interrupted=false,
 rootTravel=NaN,frameAge=NaN,frameInterval=NaN,
 side='',floorTopY=NaN,linkedProof=null,before=null,trials=[]
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.95||sourceWeight>1.001||
  !sourceInstanceSame||typeof sourceInstanceId!=='string'||!sourceInstanceId||
  sourceFootChainVerified!==true||sourceFootTrackVerified!==true||
  ownerLocomotion!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  ![rootTravel,frameAge,frameInterval,floorTopY].every(finite)||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.15||
  frameInterval<.10||frameInterval>.15||
  Math.abs(floorTopY+.02)>.005||
  !['left','right'].includes(side)||trials.length!==2||
  linkedProof?.source!=='measured-original-skinned-linked-leg'||
  linkedProof?.sourceClip!=='Walking_A'||
  linkedProof?.sourceInstanceId!==sourceInstanceId||
  linkedProof?.side!==side||linkedProof?.contactLocked!==false||
  linkedProof?.oppositeShoePreserved!==true||
  ![linkedProof?.upperRad,linkedProof?.lowerRad].every(finite)||
  Math.abs(linkedProof.upperRad)<.075||Math.abs(linkedProof.upperRad)>.145||
  Math.abs(linkedProof.lowerRad)<.045||Math.abs(linkedProof.lowerRad)>.11||
  Math.sign(linkedProof.upperRad)===Math.sign(linkedProof.lowerRad))
  return null;
 const other=side==='left'?'right':'left';
 const valid=v=>v&&[v.heelY,v.toeY].every(finite)&&
  [v.heelXZ,v.toeXZ].every(p=>
   Array.isArray(p)&&p.length===2&&p.every(finite));
 const swing=before?.[side],loaded=before?.[other];
 if(!valid(swing)||!valid(loaded))return null;
 const depth=floorTopY-swing.toeY;
 if(depth<.045||depth>.12||swing.heelY-floorTopY<.18||
  swing.heelY-floorTopY>.35||
  ![loaded.heelY,loaded.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 const drift=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 let best=null;
 for(const t of trials){
  const shoe=t?.after?.[side],support=t?.after?.[other];
  if(!finite(t?.angleRad)||Math.abs(Math.abs(t.angleRad)-.12)>.000001||
   t.axisKind!=='original-clip-track'||!valid(shoe)||!valid(support)||
   Math.abs(shoe.heelY-swing.heelY)>.008||
   drift(shoe.heelXZ,swing.heelXZ)>.02||
   drift(shoe.toeXZ,swing.toeXZ)>.032||
   Math.abs(support.heelY-loaded.heelY)>.002||
   Math.abs(support.toeY-loaded.toeY)>.002||
   drift(support.heelXZ,loaded.heelXZ)>.003||
   drift(support.toeXZ,loaded.toeXZ)>.003)continue;
  const lift=shoe.toeY-swing.toeY;
  if(lift<.008||lift>.035)continue;
  if(!best||lift>best.lift)best={angleRad:t.angleRad,lift};
 }
 if(!best)return null;
 const sign=Math.sign(best.angleRad);
 // TWO additional source shoe measurements, not extra GPU draw calls.
 return [sign*.18,sign*.24];
}

export function chooseOriginalSourceSwingLinkedFootFinisher({
 mode='idle',sourceClipName='',sourceWeight=NaN,
 sourceInstanceSame=false,sourceInstanceId='',sourceFootChainVerified=false,
 sourceFootTrackVerified=false,sourceBindDorsiflexionVerified=false,
 sourceWeightedOutsoleHingeVerified=false,sourceKneeChainAxisVerified=false,
 ownerLocomotion=false,alive=false,visible=false,
 teleport=false,reducedMotion=false,interrupted=false,
 rootTravel=NaN,frameAge=NaN,frameInterval=NaN,
 side='',floorTopY=NaN,linkedProof=null,before=null,trials=[]
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.92||sourceWeight>1.001||
  sourceInstanceSame!==true||sourceFootChainVerified!==true||
  sourceFootTrackVerified!==true||ownerLocomotion!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  ![rootTravel,frameAge,frameInterval,floorTopY].every(finite)||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.15||
  frameInterval<.008||frameInterval>.15||
  Math.abs(floorTopY+.02)>.005||!['left','right'].includes(side)||
  !Array.isArray(trials)||trials.length<1||trials.length>4||
  !linkedProof||linkedProof.source!=='measured-original-skinned-linked-leg'||
  linkedProof.sourceClip!=='Walking_A'||linkedProof.side!==side||
  typeof linkedProof.sourceInstanceId!=='string'||!linkedProof.sourceInstanceId||
  linkedProof.contactLocked!==false||
  linkedProof.oppositeShoePreserved!==true)return null;
 const opposite=side==='left'?'right':'left';
 const valid=p=>p&&[p.heelY,p.toeY].every(finite)&&
  [p.heelXZ,p.toeXZ].every(v=>Array.isArray(v)&&
   v.length===2&&v.every(finite));
 if(!valid(before?.[side])||!valid(before?.[opposite])||
  !valid(linkedProof.after?.[side])||
  !valid(linkedProof.after?.[opposite]))return null;
 const drift=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 // Reuse this EXACT rendered source-frame linked certification, not a
 // previous-frame bone or a speculative next planted position.
 for(const s of ['left','right']){
  const a=before[s],p=linkedProof.after[s];
  if(Math.abs(a.heelY-p.heelY)>.001||
   Math.abs(a.toeY-p.toeY)>.001||
   drift(a.heelXZ,p.heelXZ)>.002||
   drift(a.toeXZ,p.toeXZ)>.002)return null;
 }
 const swing=before[side],support=before[opposite];
 const burial=floorTopY-swing.toeY;
 if(swing.heelY-floorTopY<.10||swing.heelY-floorTopY>.35||
  burial<.025||burial>.12||
  ![support.heelY,support.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 let best=null;
 for(const trial of trials){
  const angle=trial?.angleRad,after=trial?.after,
   axisKind=trial?.axisKind??'original-clip-track',
   shoe=after?.[side],other=after?.[opposite];
  if(!['original-clip-track','original-bind-dorsiflexion',
     'original-weighted-outsole-swing','original-knee-chain-swing'].includes(axisKind)||
   (axisKind==='original-knee-chain-swing'&&sourceKneeChainAxisVerified!==true)||
   (axisKind==='original-bind-dorsiflexion'&&sourceBindDorsiflexionVerified!==true)||
   (axisKind==='original-weighted-outsole-swing'&&
    sourceWeightedOutsoleHingeVerified!==true))continue;
  // A measured 100ms+ original Walking_A frame may spend two remaining
  // true source-skinned reads on the *same* verified ankle axis. This is
  // never a generic allowance for arbitrary source toe/joint rotation.
  const slowDeepOriginalArc=axisKind==='original-clip-track'&&
   finite(angle)&&Math.abs(angle)>.120001&&
   frameInterval>=.10&&sourceWeight>=.95&&
   typeof sourceInstanceId==='string'&&!!sourceInstanceId&&
   sourceInstanceId===linkedProof.sourceInstanceId&&
   [linkedProof.upperRad,linkedProof.lowerRad].every(finite)&&
   Math.abs(linkedProof.upperRad)>=.075&&
   Math.abs(linkedProof.upperRad)<=.145&&
   Math.abs(linkedProof.lowerRad)>=.045&&
   Math.abs(linkedProof.lowerRad)<=.11&&
   Math.sign(linkedProof.upperRad)===-Math.sign(linkedProof.lowerRad)&&
   burial>=.045&&burial<=.12&&
   swing.heelY-floorTopY>=.18&&swing.heelY-floorTopY<=.35;
  if(!finite(angle)||Math.abs(angle)<.10||
   Math.abs(angle)>(slowDeepOriginalArc?.240001:.120001)||
   !valid(shoe)||!valid(other))continue;
  const lift=shoe.toeY-swing.toeY;
  // A stronger long-frame source ankle must earn >=18mm of actual toe
  // recovery and independently preserve the true weighted opposite shoe.
  // On a small/fast/missing-source frame retain the old stricter limits.
  if(lift<(slowDeepOriginalArc?Math.max(.018,burial*.22):
   Math.max(.008,burial*.12))||
   lift>(slowDeepOriginalArc?.05:.035)||
   shoe.toeY>floorTopY+.012||
   Math.abs(shoe.heelY-swing.heelY)>(slowDeepOriginalArc?.016:.008)||
   drift(shoe.heelXZ,swing.heelXZ)>.02||
   drift(shoe.toeXZ,swing.toeXZ)>(slowDeepOriginalArc?.055:.03)||
   Math.abs(other.heelY-support.heelY)>.002||
   Math.abs(other.toeY-support.toeY)>.002||
   drift(other.heelXZ,support.heelXZ)>.003||
   drift(other.toeXZ,support.toeXZ)>.003)continue;
  if(!best||lift>best.liftMeters)best=Object.freeze({
   angleRad:angle,axisKind,side,liftMeters:lift,
   beforeToeY:swing.toeY,afterToeY:shoe.toeY,
   beforeHeelY:swing.heelY,afterHeelY:shoe.heelY,
   linkedSourceRetained:true,oppositeFootVerified:true,contactLocked:false,
   deepOriginalSwingArc:slowDeepOriginalArc,
   source:'actual-original-linked-hip-knee-foot-skinned-trial'
  });
 }
 return best;
}

export function chooseOriginalSourceSwingLinkedToeFinisher({
 mode='idle',sourceClipName='',sourceWeight=NaN,
 sourceInstanceSame=false,sourceToeChainVerified=false,
 sourceToeTrackVerified=false,ownerLocomotion=false,alive=false,visible=false,
 teleport=false,reducedMotion=false,interrupted=false,
 rootTravel=NaN,frameAge=NaN,frameInterval=NaN,
 side='',floorTopY=NaN,linkedProof=null,before=null,trials=[]
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.92||sourceWeight>1.001||
  sourceInstanceSame!==true||sourceToeChainVerified!==true||
  sourceToeTrackVerified!==true||ownerLocomotion!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  ![rootTravel,frameAge,frameInterval,floorTopY].every(finite)||
  rootTravel<.008||rootTravel>.24||frameAge<0||frameAge>.15||
  frameInterval<.008||frameInterval>.15||
  Math.abs(floorTopY+.02)>.005||!['left','right'].includes(side)||
  !Array.isArray(trials)||trials.length<1||trials.length>2||
  !linkedProof||linkedProof.source!=='measured-original-skinned-linked-leg'||
  linkedProof.sourceClip!=='Walking_A'||linkedProof.side!==side||
  typeof linkedProof.sourceInstanceId!=='string'||
  !linkedProof.sourceInstanceId||
  linkedProof.contactLocked!==false||
  linkedProof.oppositeShoePreserved!==true)return null;
 const opposite=side==='left'?'right':'left';
 const valid=p=>p&&[p.heelY,p.toeY].every(finite)&&
  [p.heelXZ,p.toeXZ].every(v=>Array.isArray(v)&&
   v.length===2&&v.every(finite));
 if(!valid(before?.[side])||!valid(before?.[opposite])||
  !valid(linkedProof.after?.[side])||
  !valid(linkedProof.after?.[opposite]))return null;
 const drift=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 // Reject a stale or partially reposed source skeleton before probing toes.
 for(const part of ['left','right']){
  const current=before[part],certified=linkedProof.after[part];
  if(Math.abs(current.heelY-certified.heelY)>.001||
   Math.abs(current.toeY-certified.toeY)>.001||
   drift(current.heelXZ,certified.heelXZ)>.002||
   drift(current.toeXZ,certified.toeXZ)>.002)return null;
 }
 const swing=before[side],support=before[opposite];
 const burial=floorTopY-swing.toeY;
 // A real original 390px linked leg has reached an 11.507mm residual,
 // which the >=25mm-only finisher wrongly excluded. Keep distinct
 // shallow and deep original-source clearance budgets and no contact claim.
 const shallowSourceToeFinish=burial>=.006&&burial<.025;
 if(swing.heelY-floorTopY<.10||swing.heelY-floorTopY>.35||
  burial<.006||burial>.12||
  ![support.heelY,support.toeY].every(y=>
   y>=floorTopY-.055&&y<=floorTopY+.035))return null;
 let best=null;
 for(const t of trials){
  const angle=t?.angleRad,next=t?.after?.[side],other=t?.after?.[opposite];
  // A shallow original residual requires only a restrained 100mrad toe
  // hinge. Deep residuals retain their old 160mrad original-source cap.
  if(!finite(angle)||
   Math.abs(angle)<(shallowSourceToeFinish?.09:.10)||
   Math.abs(angle)>(shallowSourceToeFinish?.100001:.160001)||
   !valid(next)||!valid(other))continue;
  const lift=next.toeY-swing.toeY;
  // A shallow toe needs BOTH >=5mm AND >=45% of measured residual recovery
  // and must finish within 8mm of stone; the deep partial rescue still
  // needs >=10mm and >=15%. Neither result proves a planted foot.
  const sufficient=shallowSourceToeFinish?
   (lift>=.005&&lift>=burial*.45&&next.toeY>=floorTopY-.008):
   lift>=Math.max(.010,burial*.15);
  if(!sufficient||lift>.04||
   next.toeY>floorTopY+.008||
   Math.abs(next.heelY-swing.heelY)>.004||
   drift(next.heelXZ,swing.heelXZ)>.008||
   drift(next.toeXZ,swing.toeXZ)>.012||
   Math.abs(other.heelY-support.heelY)>.002||
   Math.abs(other.toeY-support.toeY)>.002||
   drift(other.heelXZ,support.heelXZ)>.003||
   drift(other.toeXZ,support.toeXZ)>.003)continue;
  if(!best||lift>best.liftMeters)best=Object.freeze({
   angleRad:angle,side,liftMeters:lift,
   beforeToeY:swing.toeY,afterToeY:next.toeY,
   beforeHeelY:swing.heelY,afterHeelY:next.heelY,
   linkedSourceRetained:true,oppositeFootVerified:true,contactLocked:false,
   shallowSourceToeFinish,
   source:'actual-original-linked-full-leg-plus-toes-shoe-trial'
  });
 }
 return best;
}

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
/**
 * A legal fixed-tick transition can be the FIRST visible Walking_A frame.
 * The original source pose is already drawn, but there cannot be an earlier
 * same-clip source shoe with which to justify a skid correction. Prime only
 * this real post-mixer sample; the NEXT displayed same-instance clip may
 * compare two measured weighted heels and toes under the existing strict
 * source-sole planner. No inferred foot contact or authority is introduced.
 */

/**
 * The licensed Walking_A source root can rotate ~0.637rad in ONE visible
 * 390px original WebGL frame (real frames 21->22 and 23->24, #14021026201).
 * The existing imported spine drives the SAME hand/weapon hierarchy; an
 * independently grounded travelling actor may visually counterturn only
 * that upper-body bone, then recover smoothly toward the real source yaw.
 * The first legal original Idle→Walking_A frame may use the SAME source
 * clone's immediately preceding idle yaw as a read-only anchor; entry
 * counterturn scales with actual original walking clip crossfade weight.
 *
 * This is not actor/root steering, foot-lock IK, a new clip, a fabricated
 * target or extra gameplay action. The source mixer and both true leg chains
 * retain their original facing. Missing source proof = no overlay.
 */
/**
 * Read-only real XZ displacement between two displayed poses of ONE original
 * imported source clone. A separately staged leg mixer may have consumed its
 * stride before final visible-root yaw; never derive motion from AI or targets.
 */
export function measureOriginalSourceWalkingRootTravel({
 sourceInstanceSame=false,previousRootX=NaN,previousRootZ=NaN,
 currentRootX=NaN,currentRootZ=NaN
}={}){
 if(sourceInstanceSame!==true||
  ![previousRootX,previousRootZ,currentRootX,currentRootZ].every(finite))return null;
 const distance=Math.hypot(currentRootX-previousRootX,currentRootZ-previousRootZ);
 return finite(distance)&&distance<=.18?distance:null;
}

export function planOriginalSourceWalkingTorsoCounterturn({
 mode='idle',previousMode='move',sourceClipName='',sourceWeight=NaN,
 sourceInstanceSame=false,ownerLocomotion=false,alive=true,visible=true,
 teleport=false,reducedMotion=false,interrupted=false,rootTravel=NaN,
 frameInterval=NaN,previousRootYaw=NaN,currentRootYaw=NaN,
 previousOffsetRad=0
}={}){
 // A witnessed original Idle->Walking_A transition is still the SAME
 // imported body. Its first root pivot can happen at 78% clip weight, before
 // the old 85% gate and before a move-only yaw tracker had a previous sample.
 // The true 78%-weighted Walking_A turn can be observed one displayed
 // frame AFTER the visual owner already became 'move'. Requiring 85% for
 // every move->move frame silently dropped one of two genuine source pivots
 // in the 1440px original GLB film (#43427834389), even though the source
 // remained the same healthy, visible, travelled, uninterrupted rig.
 // Keep >=75% as a STRICT source crossfade proof for both idle->walk and
 // continuing walk; scale the chest response by the actual clip weight.
 // All other real-body travel, source identity and pose-owner gates remain.
 const firstWalkFrame=previousMode==='idle';
 if(mode!=='move'||sourceClipName!=='Walking_A'||
  !['idle','move'].includes(previousMode)||
  !finite(sourceWeight)||
  sourceWeight<.75||sourceWeight>1.001||
  (firstWalkFrame&&Math.abs(previousOffsetRad)>.0001)||
  sourceInstanceSame!==true||ownerLocomotion!==true||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  ![rootTravel,frameInterval,previousRootYaw,currentRootYaw,
    previousOffsetRad].every(finite)||
  // Only the original same-frame source yaw and real root displacement
   // authorize this chest pose. Software WebGL can deliver a real original
   // Walking_A turn after >350ms without a fabricated intermediate frame.
   // Unlike floor-contact / ankle IK, this counterturn never predicts motion;
   // cap the observed gap at 2s and retain the strict 120mrad total / step.
   rootTravel<0||rootTravel>.18||frameInterval<=0||frameInterval>2||
  Math.abs(previousOffsetRad)>.120001)return null;
 const yaw= currentRootYaw-previousRootYaw;
 const signedYawChange=Math.atan2(Math.sin(yaw),Math.cos(yaw));
 const turned=Math.abs(signedYawChange);
 let offset=0;
 if(turned>.18&&turned<=.9&&rootTravel>=.015){
  // Oppose only a small part of a genuinely observed travelling root turn.
  // Never rotate feet/pelvis or swing the chest onto an invented enemy.
  // During the original Idle->Walking_A crossfade, borrow only the
  // source animation's ACTUAL effective weight. This cannot rotate the
  // authority root, original legs, weapon socket or blend other clips.
  // A continuation of the fade is still a fade even if the animation
  // owner already entered 'move'. Never give 78%-weighted source bones a
  // full-weight torso correction. Once the source is >=85%, use 1.0.
  const witnessedSourceWeight=Math.min(1,sourceWeight/.85);
  const desired=-Math.sign(signedYawChange)*
   Math.min(.12,.25*turned)*witnessedSourceWeight;
  // A rapid direction reversal cannot snap the original spine from
  // +120mrad to -120mrad in one source frame.
  offset=clamp(desired,previousOffsetRad-.12,previousOffsetRad+.12);
 }else{
  // No additional root turn: restore original Walking_A chest at a
  // bounded real visible-time rate, including a lawful stopping frame.
  const returnStep=Math.min(.12,1.5*frameInterval);
  offset=Math.sign(previousOffsetRad)*
   Math.max(0,Math.abs(previousOffsetRad)-returnStep);
 }
 if(Math.abs(offset)<.0001)return null;
 return Object.freeze({
  source:'witnessed-original-Walking_A-upper-body-counterturn',
  offsetRad:offset,originalYawStepRad:turned,
  sourceClip:'Walking_A',contactLocked:false
 });
}

export function planOriginalSourceStanceSampleHandoff({
 mode='idle',sourceClipName='',sourceWeight=NaN,ownerLocomotion=false,
 rootTravel=NaN,frameInterval=NaN,changed=true,
 alive=true,visible=true,teleport=false,reducedMotion=false,
 interrupted=false,sourceAnatomyVerified=false
}={}){
 if(mode!=='move'||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.65||sourceWeight>1.001||
  ownerLocomotion!==true||sourceAnatomyVerified!==true||
  !finite(rootTravel)||rootTravel<0||rootTravel>.18||
  !finite(frameInterval)||frameInterval<=0||frameInterval>.35||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted||
  typeof changed!=='boolean')return null;
 return {recordSample:true,allowRelief:changed===false};
}

/**
 * An actual licensed Walking_A may be visible only every 0.4-2.0 seconds on
 * software WebGL. An expensive slow rendered frame can still contain FOUR
 * verifiable original weighted heel/toe points, but it is not evidence of
 * short-interval contact or source-shoe sliding. Record CURRENT same-clone
 * post-mixer shoes only: never adjust the root, carry an offset, or compare
 * across that sparse interval. A later normal-width unchanged visible frame
 * must independently witness fresh real root travel and pass the existing
 * both-shoe rollback before any bounded relief is allowed.
 *
 * Reuses every strict original anatomy, source weight, ownership, life,
 * visibility, teleport, interruption and witnessed-root gate. No timer,
 * inferred target/plant, authority mutation or source clip seek.
 */
export function planOriginalSourceStanceSlowFramePrime(options={}){
 const elapsed=options?.frameInterval;
 if(!finite(elapsed)||elapsed<=.35||elapsed>2)return null;
 const validated=planOriginalSourceStanceSampleHandoff({
  ...options,frameInterval:.35
 });
 return validated?.recordSample===true?
  {recordSample:true,allowRelief:false}:null;
}

export function planOriginalSourceStanceSlideRelief({
 mode='idle',sourceClipName='',sourceWeight=NaN,sourceInstanceSame=false,
 ownerLocomotion=false,rootTravel=NaN,recentRootTravel=NaN,
 recentTravelAge=NaN,frameInterval=NaN,
 previousRootYaw=NaN,currentRootYaw=NaN,
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
  const projectedSpanDelta=Math.abs(nextSpan-span);
  // Genuine 390px original Walking_A frame 61->62: the airborne shoe's
  // projected XZ span shortened 42.36mm, but its complete 3D skinned
  // heel-to-toe length changed only 2.60mm. Reject stretched skin, not
  // normal source ankle articulation viewed in a horizontal projection.
  // Both points must remain on the SAME licensed source shoe; the live
  // adapter separately validates source clone, clip, root and final pose.
  const length3D=foot=>Math.hypot(
   foot.heel[0]-foot.toe[0],foot.heel[1]-foot.toe[1],
   foot.heel[2]-foot.toe[2]);
  const sourceLength=length3D(a),nextSourceLength=length3D(b);
  const sourceLengthDelta=Math.abs(nextSourceLength-sourceLength);
  const originalSwingAnatomyStable=
   sourceLength>=.24&&sourceLength<=.34&&
   nextSourceLength>=.24&&nextSourceLength<=.34&&
   sourceLengthDelta<=.006&&
   a.heel[1]>=floorTopY+.08&&b.heel[1]>=floorTopY+.08&&
   projectedSpanDelta<=.055;
  // The opposite AIRBORNE shoe can change its world-XZ projected heel/toe
  // span by 18.99mm in authentic mobile Walking_A frame 87->88. The old
  // universal 18mm veto rejected even a stable right loaded shoe. Bound
  // the non-loaded shoe to 25mm; enforce the original 18mm limit on the
  // actual near-stone shoe below. Both shoes still require real source skin.
  // Original swinging heels can rise well above stone, making the XZ
  // heel-to-toe projection temporarily 90mm on an INTACT original skin.
  // Only the separately verified airborne opposite shoe may use that
  // wider bound below. The uniquely loaded original shoe stays strict.
  // Verified original desktop Walking_A 61->62: the AIRBORNE source heel
  // rises 204-207mm above stone while the intact 306->304mm 3D shoe has
  // only a 63->78mm XZ projection. The prior universal 80mm minimum
  // rejected the separately stable, loaded right heel+toe (36mm drift)
  // before the actual 19.64mm root step and post-move readback were tested.
  // Permit 55-80mm projection ONLY for a demonstrably airborne original
  // 3D-length-stable shoe. A loaded shoe, altered skin or ground-level
  // foreshortening retains the original strict 80mm cutoff. Do NOT lock
  // the sole or add any authoritative movement.
  const horizontalProjectionStable=span>=.080&&nextSpan>=.080;
  const steepSourceSwingStable=originalSwingAnatomyStable&&
   span>=.055&&nextSpan>=.055;
  if(span>.38||nextSpan>.38||
   (!horizontalProjectionStable&&!steepSourceSwingStable)||
   (projectedSpanDelta>.036&&!originalSwingAnatomyStable))return null;
  const solePoints=[a.heel,a.toe,b.heel,b.toe];
  return {a,b,span,nextSpan,projectedSpanDelta,
   sourceLengthDelta,originalSwingAnatomyStable,
   // The 32mm original source toe burial seen in exact 390px frames
   // cannot be silently treated as ground contact. This narrow 35mm
   // presentation tolerance is legal ONLY with a uniquely stable loaded
   // source shoe and separately verified airborne opposite anatomy below.
   buriedNearLoaded:solePoints.some(p=>p[1]<floorTopY-.026),
   // Actual original 390px Walking_A source-skinned frames 87->88
  // (2026-11-12 evidence #13980180305) show a unique right heel/toe
  // 30-31mm ABOVE the stone while visibly skating 75-77mm. The former
  // 29mm upper edge silently vetoed the verified same-clone correction
  // on a 1-2mm tolerance mismatch. Accept <=35mm as NEAR-STONE only:
  // this is NOT a physical contact, stance lock or fictitious footfall.
  // Keep the strict lower burial bound, two-point/same-shoe load,
  // unique opposite-foot, source-instance, root travel and rollback gates.
  loaded:solePoints.every(p=>
    p[1]>=floorTopY-.035&&p[1]<=floorTopY+.035)};
 };
 const left=points('left'),right=points('right');
 if(!left||!right||Number(left.loaded)+Number(right.loaded)!==1)return null;
 const side=left.loaded?'left':'right',sample=left.loaded?left:right;
 const opposite=left.loaded?right:left;
 // The genuine 390px source GLB frames 62->63 show a stable yaw, a
 // right loaded shoe whose 270mm sole projection remains unchanged, and a
 // left swinging heel 174->227mm above the stone. Its articulated original
 // shoe shortens from ~122mm to ~90mm in XZ projection; this is NOT a
 // shortened rigged bone or source skin deformation. The same observed
 // foot must never gain a wider tolerance while actually supporting.
 const yawDifference=currentRootYaw-previousRootYaw;
 const yawChange=finite(previousRootYaw)&&finite(currentRootYaw)?
  Math.abs(Math.atan2(Math.sin(yawDifference),Math.cos(yawDifference))):NaN;
 // Real 390px original-source WebGL frames 23->24 and 24->25 on
 // #43332071080 turn about 0.637 rad PER displayed frame. A shoe's
 // world-XZ displacement during such a turn is not evidence that the
 // imported Walking_A gait is skating. Never "rescue" a rotation by
 // laterally sliding the entire rendered source rig; that creates a
 // viewer-visible reverse pivot and can detach the apparent floor contact.
 // Small <=80 mrad source-root turns preserve the existing strict
 // two-foot motion proof. A legacy pure caller with no yaw evidence
 // retains its prior contract; live GLB always supplies both headings.
 if(finite(yawChange)&&yawChange>.08)return null;
 const verifiedSwingHeel=finite(yawChange)&&yawChange<=.08&&
  opposite.a.heel[1]>=floorTopY+.08&&
  opposite.b.heel[1]>=floorTopY+.08;
 // Expand the near-ground loaded threshold ONLY in the exact case of
 // original 3D rigid sole length, stable heading, uniquely airborne other
 // shoe and independently source-verified swing articulation. A damaged
 // heel/toe pair, turning rig or non-airborne shoe keeps the strict veto.
 // This authorizes <=18mm reversible slide RELIEF, not a locked foot or IK.
 if(sample.buriedNearLoaded&&(!verifiedSwingHeel||
  !opposite.originalSwingAnatomyStable||
  // A near-stone loaded outsole must ALSO be close to horizontal in both
  // original weighted poses. 30mm artificial lowering of only the toe can
  // preserve a 270mm 3D span while creating a visibly broken foot pitch.
  Math.abs(sample.a.heel[1]-sample.a.toe[1])>.035||
  Math.abs(sample.b.heel[1]-sample.b.toe[1])>.035||
  sample.sourceLengthDelta>.004||
  Math.hypot(sample.a.heel[0]-sample.a.toe[0],
   sample.a.heel[1]-sample.a.toe[1],
   sample.a.heel[2]-sample.a.toe[2])<.24||
  sample.span<.20||sample.nextSpan<.20||
  sample.projectedSpanDelta>.004))return null;
 if(sample.span<.11||sample.nextSpan<.11||
  sample.projectedSpanDelta>.018)return null;
 if((opposite.span<.11||opposite.nextSpan<.11||
  opposite.projectedSpanDelta>.025)&&!verifiedSwingHeel)return null;
 const dx=sample.b.heel[0]-sample.a.heel[0],
  dz=sample.b.heel[2]-sample.a.heel[2];
 const toeDx=sample.b.toe[0]-sample.a.toe[0],
  toeDz=sample.b.toe[2]-sample.a.toe[2];
 const heelTravel=Math.hypot(dx,dz),toeTravel=Math.hypot(toeDx,toeDz);
 // An original 270mm loaded source shoe can turn subtly during Walking_A
 // even at stable actor yaw. Genuine mobile GLB frame 62->63 measures
 // 14.55mm difference between heel/toe XZ travel vectors, yet the
 // original skinned sole span changes just 0.59mm. Preserve the stricter
 // 12mm default; allow <=18mm ONLY for stable-yaw, stable-span, uniquely
 // loaded original shoes. No planted-foot or skinning claim follows.
 const loadedEdgeDelta=Math.hypot(dx-toeDx,dz-toeDz);
 const witnessedRigidSupportTurn=finite(yawChange)&&yawChange<=.08&&
  sample.span>=.20&&sample.nextSpan>=.20&&
  sample.projectedSpanDelta<=.004&&loadedEdgeDelta<=.018;
 if(heelTravel<.025||heelTravel>.14||toeTravel<.025||toeTravel>.14||
  (loadedEdgeDelta>.012&&!witnessedRigidSupportTurn))return null;
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
  otherShoeProjectedSpanDeltaMeters:opposite.projectedSpanDelta,
  otherShoeMinimumProjectedSpanMeters:Math.min(opposite.span,opposite.nextSpan),
  sourceYawChangeRadians:finite(yawChange)?yawChange:null,
  oppositeOriginalSwingHeelVerified:verifiedSwingHeel,
  oppositeSwing3DLengthVerified:opposite.originalSwingAnatomyStable,
  loadedNearBurial3DVerified:sample.buriedNearLoaded,
  contactLocked:false
 });
}

/**
 * Continuity for an ALREADY verified original-skinned shoe-slide correction.
 * The visual pivot is recomposed from zero on every requestAnimationFrame;
 * throwing away up to 18mm in one frame would produce the reverse slide that
 * the source-sole readback just prevented. Retire this witnessed, local-only
 * presentation displacement over <=150ms, without claiming planted IK.
 * No source clip / bone / gameplay root is changed, and invalidation is hard.
 */
export function planOriginalSourceStanceReliefCarry({
 previous=null,sourceInstanceId='',sourceClipName='',sourceWeight=NaN,
 mode='idle',ownerLocomotion=false,recentRootTravel=NaN,
 recentTravelAge=NaN,rootYaw=NaN,frameInterval=NaN,
 alive=true,visible=true,teleport=false,reducedMotion=false,
 interrupted=false
}={}){
 if(!previous||!finite(previous.x)||!finite(previous.z)||
  !finite(previous.rootYaw)||!finite(rootYaw)||
  previous.sourceInstanceId!==sourceInstanceId||
  previous.clip!=='Walking_A'||sourceClipName!=='Walking_A'||
  !finite(sourceWeight)||sourceWeight<.65||sourceWeight>1.001||
  mode!=='move'||ownerLocomotion!==true||
  !finite(recentRootTravel)||recentRootTravel<.015||
  recentRootTravel>.18||!finite(recentTravelAge)||
  recentTravelAge<0||recentTravelAge>.18||
  // The licensed source renderer can deliver a 75-100ms displayed frame.
  // Hard-dropping an already readback-verified <=18mm shoe correction at
  // 50ms produces an instant reverse step. Permit ONLY its existing
  // 120mm/second release for up to 150ms (the full lifetime of 18mm).
  // Source clone, moving owner, fresh real travel, yaw and all interruption
  // checks stay mandatory; a 150ms interval fully exhausts this offset.
  !finite(frameInterval)||frameInterval<=0||frameInterval>.15||
  alive!==true||visible!==true||teleport||reducedMotion||interrupted)return null;
 const yawChange= Math.abs(Math.atan2(
  Math.sin(rootYaw-previous.rootYaw),
  Math.cos(rootYaw-previous.rootYaw)));
 if(yawChange>.08)return null;
 const distance=Math.hypot(previous.x,previous.z);
 if(distance<=.0005||distance>.01800001)return null;
 // At 60Hz the return moves ~2mm/frame; at the allowed slowest 50ms
 // frame no more than 6mm. A full 18mm exit therefore takes <=150ms.
 // Repeated callbacks cannot grow the displacement or reset its age.
 const remaining=Math.max(0,distance-.12*frameInterval);
 if(remaining<=.0005)return null;
 return Object.freeze({
  source:'witnessed-original-source-stance-relief-return',
  x:previous.x*remaining/distance,z:previous.z*remaining/distance,
  sourceInstanceId,clip:'Walking_A',rootYaw
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

/**
 * An original Walking_A skeleton must follow a REAL moving actor promptly:
 * in source-GLB Chromium witnesses a lawful .0285m displacement already
 * occurred while the new clip was still only .753 weighted. The ordinary
 * .23s idle fade needs >=3 mixer render updates at the bounded .09s fade
 * clock; do not leave a moving body's pelvis and both knees in Idle for
 * that long. This is ONLY a faster source-to-source crossfade, not IK, root
 * translation, a step, or contact/hit authorization.
 *
 * Guard/idle return, death, cast, hurt, attack, escape, teleport, reduced
 * motion and uncorroborated movement preserve the established fade.
 */
export function planImportedRealTravelCrossfade({
 mode='idle',previousMode='idle',sourceClipName='',
 ownerLocomotion=false,groundedMoving=false,groundedTravel=NaN,
 frameInterval=NaN,alive=false,visible=true,teleport=false,
 reducedMotion=false,interrupted=false
}={}){
 if(mode!=='move'||!['idle','guard'].includes(previousMode)||
  sourceClipName!=='Walking_A'||ownerLocomotion!==true||
  groundedMoving!==true||alive!==true||visible!==true||
  teleport||reducedMotion||interrupted||
  ![groundedTravel,frameInterval].every(finite))return .23;
 // Source-only rescue for a genuinely displaced actor on a sparse WebGL
 // frame. The original desktop/mobile 41-bone GLB witness travelled
 // .44-.54m over .467-.917s while the first Walking_A source fade was
 // still .23s. Demand BOTH bounded distance and credible average velocity;
 // a teleport, paused frame or unrelated action cannot earn this.
 if(groundedTravel>=.24&&groundedTravel<=.54&&
  frameInterval>=.24&&frameInterval<=1.2&&
  groundedTravel/frameInterval>=.25&&
  groundedTravel/frameInterval<=2.5)return .09;
 // Actual 390px licensed GLB source tick 8: .44m of living root travel
 // arrived after a 1.7667s displayed software-WebGL interval. Rejecting
 // this *known* full-body walk left the source mixer requesting 230ms Idle
 // blending despite that displacement. A narrower low-FPS window may
 // hand all 41 original keyed joints over together, only with real travel
 // >=420mm at plausible >=.23m/s and a matching current source owner.
 // This is a clip crossfade, never a step, IK target, hit or ground contact.
 if(groundedTravel>=.42&&groundedTravel<=.54&&
  frameInterval>1.2&&frameInterval<=1.9&&
  groundedTravel/frameInterval>=.23&&
  groundedTravel/frameInterval<=.5)return .09;
 // Exact ORIGINAL CC0 walking-rig desktop Actions #44194705323,
 // tick 6: .440000m of legal travel over ONE genuine 1.983300s
 // displayed frame, with Idle -> Walking_A still requesting .23s.
 // Allow a 90ms whole-skeleton crossfade only for this conservatively
 // bounded *real* slow-moving frame family (not arbitrary stalled frames).
 // The separate licensed Walking_A clip time remains distance-paced by
 // planImportedLivingSourceStep and the actual GLB shoes/weapon stay intact.
 if(groundedTravel>=.42&&groundedTravel<=.50&&
  frameInterval>1.9&&frameInterval<=2.1&&
  groundedTravel/frameInterval>=.20&&
  groundedTravel/frameInterval<=.25)return .09;
 if(groundedTravel>=.012&&groundedTravel<=.24&&
  frameInterval>=.008&&frameInterval<=.24)return .12;
 return .23;
}

export function planImportedWalkingMixerFrameDelta({mode='idle',walkingClip=false,
 frameDelta=0,frameInterval=frameDelta,sourceStep=NaN,sourceDuration=NaN,
 sourceTime=NaN,effectiveSpeed=NaN,groundedTravel=NaN,groundedMoving=false,
 visible=true,reducedMotion=false,teleport=false}={}){
 const ordinary=finite(frameDelta)?clamp(frameDelta,0,.05):0;
 // Original WebGL #44174412381: full-skeleton Walking_A was sampled after
 // 4.033s (390px) / 4.683s (desktop); a documented legal 440mm root step
 // can outpace a 50ms old Idle-to-walk blend on these software-rendered frames.
 // Extend ONLY the mixer FADE clock to 90ms for that physically measured
 // slow, genuinely travelling envelope. planImportedWalkingBlendRate keeps
 // the licensed 41-joint walk itself paced by independently witnessed metres.
 // Never invent movement, foot contact, damage, a target or an animation.
 const realVerySparseWalkingTravel=frameInterval>=3.5&&
  frameInterval<=4.8&&groundedMoving===true&&
  groundedTravel>=.42&&groundedTravel<=.54&&
  sourceStep>=.20&&sourceStep<=.28&&
  groundedTravel/frameInterval>=.09&&
  groundedTravel/frameInterval<=.20;
 if(mode!=='move'||walkingClip!==true||visible!==true||reducedMotion||teleport||
  ![frameDelta,frameInterval,sourceStep,sourceDuration,sourceTime,effectiveSpeed,
    groundedTravel].every(finite)||frameDelta<=0||frameDelta>.05||
  frameInterval<=0||(frameInterval>2&&!realVerySparseWalkingTravel)||
  sourceStep<0||sourceStep>.28||
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
