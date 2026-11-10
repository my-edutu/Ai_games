/**
 * Read-only skeletal deformation contract for the EXISTING source GLB rig.
 * Inputs are world-space bones and explicit ancestor-linked limb segments,
 * sampled from the actual SkeletonUtils-cloned character. Nothing here poses
 * a bone, changes simulation state, allocates a Mesh or claims visual parity.
 */
const finite=Number.isFinite;
const bounded=(x,min,max)=>Math.min(max,Math.max(min,x));
const point=p=>Array.isArray(p)&&p.length===3&&p.every(finite);
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const VALID_NAME=/^(left|right)-(arm|forearm|thigh|calf)$/;
const EMPTY=Object.freeze({segments:[],validSegments:0,disconnectedSegments:0,invalidSegments:0,
 maxStretchFraction:0,maxQuaternionError:0,invalidQuaternionCount:0,invalidMatrixCount:0,
 sampledBones:0,skinnedMeshes:0});

export function measureSourceRigDeformation(sample,reference=null){
 if(!sample||!Array.isArray(sample.segments)||!Array.isArray(sample.bones))
  return EMPTY;
 const ref=new Map(Array.isArray(reference?.segments)?reference.segments
  .filter(s=>VALID_NAME.test(s?.name)&&finite(s?.meters)&&s.meters>=0)
  .map(s=>[s.name,s.meters]):[]);
 const segments=[];
 let validSegments=0,invalidSegments=0,disconnectedSegments=0,maxStretchFraction=0;
 for(const s of sample.segments.slice(0,8)){
  if(!VALID_NAME.test(s?.name)||!point(s?.from)||!point(s?.to)){
   invalidSegments++;continue;
  }
  const meters=dist(s.from,s.to);
  const connected=s.connected===true;
  const origin=ref.get(s.name);
  const stretchFraction=finite(origin)&&origin>.025?
   Math.abs(meters-origin)/origin:0;
  if(!connected)disconnectedSegments++;
  if(!finite(meters)||meters>.0+10){invalidSegments++;continue}
  if(connected&&meters>.015)validSegments++;
  maxStretchFraction=Math.max(maxStretchFraction,stretchFraction);
  segments.push({name:s.name,meters:Number(meters.toFixed(5)),
   connected,stretchFraction:Number(bounded(stretchFraction,0,999).toFixed(4))});
 }
 let maxQuaternionError=0,invalidQuaternionCount=0,invalidMatrixCount=0;
 for(const b of sample.bones.slice(0,128)){
  const q=b?.quaternion;
  if(!Array.isArray(q)||q.length!==4||!q.every(finite)){
   invalidQuaternionCount++;continue;
  }
  const size=Math.hypot(...q);
  const error=Math.abs(size-1);
  if(!finite(error)){invalidQuaternionCount++;continue;}
  maxQuaternionError=Math.max(maxQuaternionError,error);
  // MatrixWorld must remain finite during source mixer + reversible overlays.
  if(!Array.isArray(b.matrix)||b.matrix.length!==16||!b.matrix.every(finite))
   invalidMatrixCount++;
 }
 return Object.freeze({
  segments,validSegments,disconnectedSegments,invalidSegments,
  maxStretchFraction:Number(bounded(maxStretchFraction,0,999).toFixed(4)),
  maxQuaternionError:Number(bounded(maxQuaternionError,0,999).toFixed(5)),
  invalidQuaternionCount,invalidMatrixCount,
  sampledBones:Math.min(128,sample.bones.length),
  skinnedMeshes:Number.isSafeInteger(sample.skinnedMeshes)?
   bounded(sample.skinnedMeshes,0,256):0
 });
}


/** Two original source GLB joint-world observations, NOT sole mesh contact. */
export function measureSourceJointTravel(before,after){
 const unavailable=reason=>Object.freeze({comparable:false,reason});
 const point=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
 if(!before||!after||!before.sourceInstanceId||before.sourceInstanceId!==after.sourceInstanceId||
  before.id!==after.id||before.kind!==after.kind)return unavailable('different-source-actor');
 if(!point(before.rootWorld)||!point(after.rootWorld))return unavailable('missing-world-root');
 for(const side of ['left','right'])if(!point(before.footJointWorld?.[side])||
  !point(after.footJointWorld?.[side]))return unavailable('missing-original-foot-joint');
 const horizontal=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
 const relative=(foot,root)=>[foot[0]-root[0],foot[1]-root[1],foot[2]-root[2]];
 const rounded=n=>Number(n.toFixed(4));
 const footWorldDeltaMeters={},footRelativeToRootDeltaMeters={},footVerticalDeltaMeters={};
 for(const side of ['left','right']){
  const x=before.footJointWorld[side],y=after.footJointWorld[side];
  footWorldDeltaMeters[side]=rounded(horizontal(x,y));
  footRelativeToRootDeltaMeters[side]=rounded(horizontal(relative(x,before.rootWorld),relative(y,after.rootWorld)));
  footVerticalDeltaMeters[side]=rounded(Math.abs(x[1]-y[1]));
 }
 return Object.freeze({comparable:true,source:'original-world-ankle-joints-not-sole-contact',
  actorId:before.id,kind:before.kind,rootTravelMeters:rounded(horizontal(before.rootWorld,after.rootWorld)),
  footWorldDeltaMeters,footRelativeToRootDeltaMeters,footVerticalDeltaMeters,
  beforePhase:Number.isFinite(before.groundedFootPhase)?before.groundedFootPhase:null,
  afterPhase:Number.isFinite(after.groundedFootPhase)?after.groundedFootPhase:null});
}


/**
 * GLTFLoader sanitizes the real pinned TacticalSlash names foot.l/toes.l
 * into footl/toesl before SkeletonUtils clones them. Match only source
 * deform bones, never IK-foot, foot-roll controls or opposite leg. This is
 * ON-DEMAND evidence selection, not presentation or IK.
 */
export function isSourceSoleBoneName(name,side){
 if(typeof name!=='string'||!['left','right'].includes(side))return false;
 const match=/^(?:foot|toes)[._-]?([lr])$/i.exec(name);
 return Boolean(match&&match[1].toLowerCase()===(side==='left'?'l':'r'));
}

/**
 * Compare two GENUINE skinned source-sole vertices and the original
 * hand-relative weapon matrix on the same existing source clone.
 * Evidence only: one weighted sole vertex is NOT full sole-ground contact,
 * a joint IK solution, or a basis for synthesizing gameplay events.
 */
export function measureSourceSoleGripContinuity(before,after){
 const unavailable=reason=>Object.freeze({comparable:false,reason});
 if(!before||!after||!before.sourceInstanceId||
  before.sourceInstanceId!==after.sourceInstanceId||
  before.id!==after.id||before.kind!==after.kind)return unavailable('different-source-actor');
 if(!point(before.rootWorld)||!point(after.rootWorld))return unavailable('missing-world-root');
 for(const side of ['left','right'])if(!point(before.soleVertexWorld?.[side])||
  !point(after.soleVertexWorld?.[side]))return unavailable('missing-skinned-sole');
 const round=x=>Number(x.toFixed(4));
 const horizontal=(x,y)=>Math.hypot(x[0]-y[0],x[2]-y[2]);
 const relative=(x,r)=>[x[0]-r[0],x[1]-r[1],x[2]-r[2]];
 const soleWorldDeltaMeters={},soleRelativeToRootDeltaMeters={},
  soleVerticalDeltaMeters={},soleHeightAboveRootMeters={};
 for(const side of ['left','right']){
  const a=before.soleVertexWorld[side],b=after.soleVertexWorld[side];
  soleWorldDeltaMeters[side]=round(horizontal(a,b));
  soleRelativeToRootDeltaMeters[side]=round(horizontal(
   relative(a,before.rootWorld),relative(b,after.rootWorld)));
  soleVerticalDeltaMeters[side]=round(Math.abs(a[1]-b[1]));
  soleHeightAboveRootMeters[side]=round(b[1]-after.rootWorld[1]);
 }
 const gripA=before.sourceWeaponGrip,gripB=after.sourceWeaponGrip;
 const validGrip=x=>x?.attachedToHand===true&&
  typeof x.name==='string'&&x.name.length>0&&
  typeof x.handName==='string'&&x.handName.length>0&&
  Array.isArray(x.handRelativeMatrix)&&x.handRelativeMatrix.length===16&&
  x.handRelativeMatrix.every(finite);
 // Both source clips and the legal weapon mount may animate handslot.r
 // under hand.r. Retain hand-relative change as a diagnostic, but measure
 // actual attachment integrity in the source weapon's own authored socket.
 const handComparable=validGrip(gripA)&&validGrip(gripB)&&
  gripA.name===gripB.name&&gripA.handName===gripB.handName;
 const withSocket=x=>x?.attachedToGripSocket===true&&
  typeof x.socketName==='string'&&/^handslot[._-]?r$/i.test(x.socketName)&&
  Array.isArray(x.socketRelativeMatrix)&&x.socketRelativeMatrix.length===16&&
  x.socketRelativeMatrix.every(finite);
 const socketDeclared=x=>x&&('socketName' in x||'attachedToGripSocket' in x||
  'socketRelativeMatrix' in x);
 const socketComparable=Boolean(handComparable&&withSocket(gripA)&&withSocket(gripB)&&
  gripA.socketName===gripB.socketName);
 // Preserve compatibility with older synthetic/legacy hand-only contracts,
 // but NEVER treat a declared invalid source socket as proof of rigid grip.
 const rigidGripComparable=Boolean(handComparable&&
  (!(socketDeclared(gripA)||socketDeclared(gripB))||socketComparable));
 const a=gripA?.handRelativeMatrix,b=gripB?.handRelativeMatrix;
 const drift=handComparable?dist([a[12],a[13],a[14]],[b[12],b[13],b[14]]):null;
 const matrixDrift=handComparable?Math.max(...a.map((v,i)=>Math.abs(v-b[i]))):null;
 const socketA=gripA?.socketRelativeMatrix,socketB=gripB?.socketRelativeMatrix;
 const socketDrift=socketComparable?
  dist([socketA[12],socketA[13],socketA[14]],[socketB[12],socketB[13],socketB[14]]):null;
 const socketMatrixDrift=socketComparable?
  Math.max(...socketA.map((v,i)=>Math.abs(v-socketB[i]))):null;
 return Object.freeze({comparable:true,
  source:'original-skinned-sole-vertex-and-rigid-source-hand-weapon',
  actorId:before.id,kind:before.kind,
  rootTravelMeters:round(horizontal(before.rootWorld,after.rootWorld)),
  soleWorldDeltaMeters,soleRelativeToRootDeltaMeters,
  soleVerticalDeltaMeters,soleHeightAboveRootMeters,
  rigidGripComparable,
  weaponName:handComparable?gripA.name:null,
  sourceGripSocketName:socketComparable?gripA.socketName:null,
  weaponHandDriftMeters:drift===null?null:round(drift),
  weaponLocalMatrixMaxDelta:matrixDrift===null?null:round(matrixDrift),
  weaponSocketDriftMeters:socketDrift===null?null:round(socketDrift),
  weaponSocketMatrixMaxDelta:socketMatrixDrift===null?null:round(socketMatrixDrift)
 });
}


/**
 * Real, consecutive rendered-frame evidence of a licensed SOURCE sole.
 * This is a qualified observation, never IK authorization or a proof that
 * the complete shoe touches the floor. Source/authority ticks and frame
 * order are mandatory; large jump samples cannot become planted-foot claims.
 * Called only by explicit source-rig capture, not in the animation frame loop.
 */
export function assessSourceSoleFrameWindow(before,after,meta={}){
 const unavailable=reason=>Object.freeze({comparable:false,reason,ikAccepted:false});
 if(meta.visible===false||meta.teleport===true)return unavailable('untrusted-presentation');
 if(!Number.isSafeInteger(meta.beforeFrame)||!Number.isSafeInteger(meta.afterFrame)||
  meta.beforeFrame<0||meta.afterFrame<=meta.beforeFrame)
  return unavailable('missing-consecutive-render-frames');
 if(!Number.isSafeInteger(meta.beforeTick)||meta.beforeTick<0||
  meta.beforeTick!==meta.afterTick)return unavailable('different-authority-tick');
 if(before?.mode!=='move'||after?.mode!=='move')
  return unavailable('not-witnessed-source-walk');
 const measured=measureSourceSoleGripContinuity(before,after);
 if(!measured.comparable)return unavailable(measured.reason);
 const root=measured.rootTravelMeters;
 if(!finite(root)||root>.35)return unavailable('skipped-or-large-root-motion');
 const sides=['left','right'];
 const candidates=root>=.025?sides.filter(side=>
  measured.soleWorldDeltaMeters[side]<=.025&&
  measured.soleVerticalDeltaMeters[side]<=.015):[];
 const soleMoving=sides.some(side=>measured.soleWorldDeltaMeters[side]>.035);
 const classification=root>=.025?
  candidates.length?'potential-plant':'no-observed-plant':
  root<=.008&&soleMoving?'stationary-source-sole-motion':'insufficient-root-travel';
 return Object.freeze({comparable:true,classification,
  source:'two-consecutive-original-WebGL-skin-frames',
  beforeFrame:meta.beforeFrame,afterFrame:meta.afterFrame,tick:meta.beforeTick,
  rootTravelMeters:root,soleWorldDeltaMeters:measured.soleWorldDeltaMeters,
  soleVerticalDeltaMeters:measured.soleVerticalDeltaMeters,
  potentialPlantSides:Object.freeze(candidates),
  // Two weighted vertices, even with stationary XZ and Y, do NOT certify
  // flat sole-to-stone contact. An IK solver must undergo separate review.
  ikAccepted:false});
}
