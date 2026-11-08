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
