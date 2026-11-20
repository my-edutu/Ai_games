'use strict';
/**
 * Read-only actual original GLB same-tick rAF toe/heel/grip witness.
 * No synthetic plant, target, source pose, geometry or authority change.
 */
const finite=Number.isFinite;
const point=p=>Array.isArray(p)&&p.length===3&&p.every(finite);
const shoe=s=>s&&point(s.heel)&&point(s.toe);
const reject=reason=>({eligible:false,reason,contactLocked:false,plantCertified:false});
function auditOriginalSourceSolePair({before=null,after=null,floorTopY=NaN,poseOnly=false}={}){
 if(!before||!after||typeof before!=='object'||typeof after!=='object')
  return reject('invalid-original-source-sample');
 if(typeof before.actorId!=='string'||!before.actorId||
  before.actorId!==after.actorId)return reject('different-source-actor');
 if(typeof before.sourceInstanceId!=='string'||!before.sourceInstanceId||
  before.sourceInstanceId!==after.sourceInstanceId)
  return reject('different-source-instance');
 if(!Number.isSafeInteger(before.authorityTick)||
  before.authorityTick!==after.authorityTick)return reject('different-authority-tick');
 if(typeof before.checksum!=='string'||!before.checksum||
  before.checksum!==after.checksum)return reject('different-authority-checksum');
 if(before.sourceClip!=='Walking_A'||after.sourceClip!=='Walking_A')
  return reject('not-original-walking-source');
 if(![before.sourceWeight,after.sourceWeight].every(v=>
  finite(v)&&v>=.92&&v<=1.001))return reject('unowned-source-walk');
 if(!Number.isSafeInteger(before.frame)||!Number.isSafeInteger(after.frame)||
  after.frame!==before.frame+1)return reject('not-consecutive-render-frame');
 if(before.sourceWeaponGrip?.socketName!=='handslotr'||
  after.sourceWeaponGrip?.socketName!=='handslotr'||
  before.sourceWeaponGrip?.attachedToGripSocket!==true||
  after.sourceWeaponGrip?.attachedToGripSocket!==true)
  return reject('source-hand-grip-not-attached');
 if(before.visible!==true||after.visible!==true)return reject('not-visible');
 const dt=after.timeMs-before.timeMs;
 if(![before.timeMs,after.timeMs,dt].every(finite)||
  dt<8||dt>350)return reject('invalid-render-interval');
 const duration=before.sourceClipDuration;
 if(![duration,after.sourceClipDuration,before.sourceClipTime,
  after.sourceClipTime].every(finite)||
  duration<=.1||duration>10||Math.abs(duration-after.sourceClipDuration)>.001||
  before.sourceClipTime<0||before.sourceClipTime>duration+.002||
  after.sourceClipTime<0||after.sourceClipTime>duration+.002)
  return reject('invalid-source-clip-time');
 const phaseStep=after.sourceClipTime>=before.sourceClipTime?
  after.sourceClipTime-before.sourceClipTime:
  before.sourceClipTime>=duration*.8&&after.sourceClipTime<=duration*.2?
   duration-before.sourceClipTime+after.sourceClipTime:NaN;
 if(!finite(phaseStep)||phaseStep<0||phaseStep>duration*.40)
  return reject('discontinuous-source-clip-phase');
 if(poseOnly&&phaseStep<.001)return reject('nonadvancing-source-clip');
 if(!point(before.rootWorld)||!point(after.rootWorld))return reject('invalid-source-root');
 const b=before.sourceSolePatchWorld,a=after.sourceSolePatchWorld;
 if(!['left','right'].every(side=>shoe(b?.[side])&&shoe(a?.[side]))||
  !finite(floorTopY)||Math.abs(floorTopY+.02)>.005)
  return reject('invalid-original-skinned-shoes');
 const dx=after.rootWorld[0]-before.rootWorld[0];
 const dz=after.rootWorld[2]-before.rootWorld[2];
 const rootTravel=Math.hypot(dx,dz);
 if(rootTravel>.24)return reject('discontinuous-source-root');
 if(rootTravel<.00025&&!poseOnly)return reject('no-witnessed-root-travel');
 const shoes={};
 for(const side of ['left','right']){
  const first=b[side],last=a[side];
  const relativeShift=part=>Math.hypot(
   last[part][0]-first[part][0]-dx,last[part][2]-first[part][2]-dz);
  shoes[side]={
   beforeToeBurialMeters:Math.max(0,floorTopY-first.toe[1]),
   afterToeBurialMeters:Math.max(0,floorTopY-last.toe[1]),
   beforeHeelAboveMeters:first.heel[1]-floorTopY,
   afterHeelAboveMeters:last.heel[1]-floorTopY,
   swingToeLiftMeters:last.toe[1]-first.toe[1],
   heelLiftMeters:last.heel[1]-first.heel[1],
   heelSlideRelativeToRootMeters:relativeShift('heel'),
   toeSlideRelativeToRootMeters:relativeShift('toe'),
   originalLoadedCandidateNearFloor:
    Math.abs(last.heel[1]-floorTopY)<=.03&&
    Math.abs(last.toe[1]-floorTopY)<=.03
  };
 }
 return {
  eligible:!poseOnly,poseEligible:true,poseOnly,
  sourceInstanceId:before.sourceInstanceId,
  actorId:before.actorId,authorityTick:before.authorityTick,
  beforeFrame:before.frame,afterFrame:after.frame,frameDelta:1,
  elapsedSeconds:dt/1000,sourceClipPhaseDeltaSeconds:phaseStep,
  rootTravelMeters:rootTravel,sourceClip:'Walking_A',
  sourceHandGripStable:true,shoes,contactLocked:false,plantCertified:false,
  source:poseOnly?'two-live-original-pose-only-rAF-soles':
   'two-live-source-skinned-soles-and-same-tick-rAF',
  warning:poseOnly?'Original keyed-source pose only; NO witnessed root locomotion, contact, plant or fluent-motion certification.':
   'This is not support-force evidence, IK, a ground-contact lock, or fluent animation certification.'
 };
}
// Keep the historical moving-root witness strict; this second bounded diagnostic
// can observe genuine same-tick keyed pose changes on a stationary root, but
// cannot be interpreted as locomotion, planted foot or a smooth FPS pass.
function auditOriginalSourceRafSolePair(options={}){
 return auditOriginalSourceSolePair({...options,poseOnly:false});
}
function auditOriginalSourcePoseOnlyPair(options={}){
 return auditOriginalSourceSolePair({...options,poseOnly:true});
}

/**
 * Adjacent real original GLB source-pose+skinned-sole+weapon witness.
 * Reports rotations; does not modify a source clip, grant an IK plant
 * or assert that a native authored animation obeys overlay slew rates.
 */
function auditOriginalSourceJointFramePair(options={}){
 const base=auditOriginalSourcePoseOnlyPair(options);
 const failed=jointReason=>({...base,jointPoseEligible:false,jointReason,
  contactLocked:false,plantCertified:false});
 if(!base.poseEligible)return failed(base.reason);
 const {before,after}=options;
 const prefix={upper:'upperleg',lower:'lowerleg',foot:'foot',toes:'toes'};
 const radians=(a,b)=>{
  const na=Math.hypot(...a),nb=Math.hypot(...b);
  if(!finite(na)||!finite(nb)||Math.abs(na-1)>.02||Math.abs(nb-1)>.02)
   return NaN;
  const dot=(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3])/(na*nb);
  return 2*Math.acos(Math.min(1,Math.max(0,Math.abs(dot))));
 };
 const legs={};
 for(const side of ['left','right']){
  legs[side]={};
  for(const part of Object.keys(prefix)){
   const a=before.sourceLegBonePose?.[side]?.[part],
    b=after.sourceLegBonePose?.[side]?.[part],
    name=prefix[part]+(side==='left'?'.l':'.r');
   if(a?.name!==name||b?.name!==name)
    return failed('missing-or-replaced-original-source-bone');
   for(const x of [a,b])
    if(!Array.isArray(x.localQuaternion)||x.localQuaternion.length!==4||
     !x.localQuaternion.every(finite)||
     !Array.isArray(x.worldQuaternion)||x.worldQuaternion.length!==4||
     !x.worldQuaternion.every(finite)||!point(x.worldPosition))
     return failed('invalid-original-source-joint-pose');
   const local=radians(a.localQuaternion,b.localQuaternion),
    world=radians(a.worldQuaternion,b.worldQuaternion);
   if(!finite(local)||!finite(world))
    return failed('invalid-original-source-joint-quaternion');
   legs[side][part]={boneName:name,localAngularChangeRad:local,
    worldAngularChangeRad:world,
    localAngularRateRadPerSecond:local/base.elapsedSeconds,
    beforeWorldPosition:a.worldPosition,afterWorldPosition:b.worldPosition};
  }
 }
 const matrix=a=>Array.isArray(a)&&a.length===16&&a.every(finite);
 const gripBefore=before.sourceWeaponGrip?.socketRelativeMatrix,
  gripAfter=after.sourceWeaponGrip?.socketRelativeMatrix;
 if(!matrix(gripBefore)||!matrix(gripAfter))
  return failed('missing-original-weapon-socket-matrix');
 const maxDifference=Math.max(...gripBefore.map((n,i)=>Math.abs(n-gripAfter[i])));
 return {...base,jointPoseEligible:true,jointReason:null,
  sourceLegs:legs,sourceSocketRelativeMatrixMaxDifference:maxDifference,
  originalWeaponSocketRigid:maxDifference<=.002,
  contactLocked:false,plantCertified:false,
  warning:'Real original joint/source-shoe measurements, not certified contact, IK or fluent FPS.'};
}

module.exports={auditOriginalSourceRafSolePair,auditOriginalSourcePoseOnlyPair,auditOriginalSourceJointFramePair};
