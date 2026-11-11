/**
 * D04: read-only, root-motion-compensated hand travel on a genuine animated rig.
 * Never makes a sweep from a static hand while the entire actor merely turns.
 * This is a hand proxy, NOT a verified GLB sword-tip measurement or a hit.
 */
export const MEASURED_HAND_TRAIL_MIN_METERS=.025;
// A 25mm drift over 60ms is not a readable sword passage. Filter by
// measured local wrist speed as well as displacement; still only a hand proxy.
export const MEASURED_HAND_TRAIL_MIN_METERS_PER_SECOND=.9;
export const MEASURED_HAND_TRAIL_MAX_METERS=.38;
export const MEASURED_HAND_TRAIL_MAX_FRAME_SECONDS=.06;
// Render receipts must refer to the pose that was actually submitted. A stable
// GLB bone object can move or turn AFTER the trail matrix was last written.
// These are small drift tolerances, never weapon-tip or contact measurements.
export const MEASURED_HAND_RECEIPT_MAX_SPATIAL_DRIFT_METERS=.06;
export const MEASURED_HAND_RECEIPT_MAX_ROOT_YAW_RADIANS=.10;
// A wrist may pivot while its world position remains almost fixed. When
// genuine skinned rotation is observable, reject a ribbon rendered against a
// materially different joint orientation at frame acknowledgment.
export const MEASURED_HAND_RECEIPT_MAX_WRIST_ROTATION_RADIANS=.16;
// Authored Matrix4 elements mutate between VFX update and WebGL submit.
export const MEASURED_HAND_RECEIPT_MAX_BODY_BASIS_DRIFT=.015;
export const MEASURED_HAND_RECEIPT_MAX_BODY_TRANSLATION_DRIFT_METERS=.06;
const BODY_BASIS_KEYS=Object.freeze(['bodyM0','bodyM1','bodyM2',
 'bodyM4','bodyM5','bodyM6','bodyM8','bodyM9','bodyM10']);
const BODY_TRANSLATION_KEYS=Object.freeze(['bodyM12','bodyM13','bodyM14']);
const finite=p=>p&&['x','y','z','rootX','rootY','rootZ'].every(k=>Number.isFinite(p[k]))&&
 (p.yaw===undefined||Number.isFinite(p.yaw));
/**
 * Read the visual joints the character-art pipeline ALREADY bound, without
 * changing skeletons or attaching any mesh. Melee swords are represented by
 * rigMeleeBones.wrist; rigHandBone belongs to ranger/mystic grip accessories.
 * No fallback to an invented root-point or a generic unrelated hand.
 */
export function selectObservedWeaponHandBone(actor){
 if(!actor?.authored||!actor.assetRoot)return null;
 const kind=actor.u?.kind;
 if(kind==='vanguard'||kind==='revenant'||kind==='warden'){
  const matches=Array.isArray(actor.rigMeleeBones)?
   actor.rigMeleeBones.filter(entry=>entry?.part==='wrist'&&entry.bone?.isBone):[];
  return matches.length===1?matches[0].bone:null;
 }
 // The authored cultist also carries a real staff-hand joint in the
 // existing model-assets pipeline. Read it without changing any rig or mesh.
 if(kind==='ranger'||kind==='mystic'||kind==='cultist')
  return actor.rigHandBone?.isBone?actor.rigHandBone:null;
 return null;
}

/**
 * Verify that the current animated wrist still occupies the same pose that
 * authored the retained ribbon at its last VFX update. The actor may retain
 * the SAME skinned bone while a later animation update changes its position
 * or facing before WebGL submission. A stale visual cannot certify foley.
 * Read-only, bounded and independent of HP/target/contact evidence.
 */
export function isCurrentMeasuredHandReceipt(previous,current){
 if(!finite(previous)||!finite(current)||!previous.sourceBone||
  previous.sourceBone!==current.sourceBone)return false;
 const handDrift=Math.hypot(current.x-previous.x,current.y-previous.y,current.z-previous.z);
 const rootDrift=Math.hypot(current.rootX-previous.rootX,
  current.rootY-previous.rootY,current.rootZ-previous.rootZ);
 const yawDrift=Math.abs(Math.atan2(Math.sin((current.yaw??0)-(previous.yaw??0)),
  Math.cos((current.yaw??0)-(previous.yaw??0))));
 // Capture read-only authored parent transform across the submission
 // boundary. A bone may keep its world position and quaternion while the
 // surrounding model scales, pitches, shears or shifts its pivot. The mutable
 // poseFrameMatrix reference cannot prove the originally rendered frame.
 // Older adapters without this GLB-body witness retain their previous path.
 if(previous.sourceBodyRoot!==undefined||current.sourceBodyRoot!==undefined){
  if(!previous.sourceBodyRoot||
   previous.sourceBodyRoot!==current.sourceBodyRoot||
   ![previous.localX,previous.localY,previous.localZ,
     current.localX,current.localY,current.localZ].every(Number.isFinite))
   return false;
  for(const name of BODY_BASIS_KEYS){
   const a=previous[name],b=current[name];
   if(!Number.isFinite(a)||!Number.isFinite(b)||
    Math.abs(a-b)>MEASURED_HAND_RECEIPT_MAX_BODY_BASIS_DRIFT)return false;
  }
  for(const name of BODY_TRANSLATION_KEYS){
   const a=previous[name],b=current[name];
   if(!Number.isFinite(a)||!Number.isFinite(b)||
    Math.abs(a-b)>MEASURED_HAND_RECEIPT_MAX_BODY_TRANSLATION_DRIFT_METERS)
    return false;
  }
 }
 // Only compare when the *rendered* passage had a real world-orientation
 // witness. Older minimal rigs without getWorldQuaternion retain their
 // existing translation/yaw contract; never synthesize a missing rotation.
 // The actual stage stores four scalar coordinates in its existing wrist
 // point to avoid an extra per-frame object. Named nested poses are supported
 // for test/integration adapters, but are never manufactured by this module.
 if(previous.wristQw!==undefined||previous.wristQuaternion!==undefined){
  const a=previous.wristQuaternion,b=current.wristQuaternion;
  const ax=a?.x??previous.wristQx,ay=a?.y??previous.wristQy;
  const az=a?.z??previous.wristQz,aw=a?.w??previous.wristQw;
  const bx=b?.x??current.wristQx,by=b?.y??current.wristQy;
  const bz=b?.z??current.wristQz,bw=b?.w??current.wristQw;
  if(![ax,ay,az,aw,bx,by,bz,bw].every(Number.isFinite))return false;
  const aa=ax*ax+ay*ay+az*az+aw*aw;
  const bb=bx*bx+by*by+bz*bz+bw*bw;
  if(!Number.isFinite(aa)||!Number.isFinite(bb)||
    aa<.96||aa>1.04||bb<.96||bb>1.04)return false;
  // q and -q describe the same orientation; normalize their dot.
  const dot=Math.abs(ax*bx+ay*by+az*bz+aw*bw)/Math.sqrt(aa*bb);
  const angularDrift=2*Math.acos(Math.max(0,Math.min(1,dot)));
  if(!Number.isFinite(angularDrift)||
    angularDrift>MEASURED_HAND_RECEIPT_MAX_WRIST_ROTATION_RADIANS)return false;
 }
 return Number.isFinite(handDrift)&&Number.isFinite(rootDrift)&&
  handDrift<=MEASURED_HAND_RECEIPT_MAX_SPATIAL_DRIFT_METERS&&
  rootDrift<=MEASURED_HAND_RECEIPT_MAX_SPATIAL_DRIFT_METERS&&
  yawDrift<=MEASURED_HAND_RECEIPT_MAX_ROOT_YAW_RADIANS;
}

export function planMeasuredHandTrail(previous,current,frameSeconds){
 // A GLB can finish loading or be replaced during one authoritative attack.
 // Never stitch samples from two different physical skinned wrists into one
 // apparently continuous blade stroke. Older pure numeric callers are valid.
 if(previous?.sourceBone!==undefined||current?.sourceBone!==undefined){
  if(!previous?.sourceBone||previous.sourceBone!==current?.sourceBone)return null;
 }
 if(!finite(previous)||!finite(current)||!Number.isFinite(frameSeconds)||
  frameSeconds<=0||frameSeconds>MEASURED_HAND_TRAIL_MAX_FRAME_SECONDS)return null;
 // Genuine GLB bodies can roll, pitch, scale, recoil or lean through
 // visualPivot / impactPivot while the sword wrist remains planted RELATIVE
 // to the animated figure. Root X/Z/yaw subtraction alone mistakes that
 // parent-only movement for a physical sword passage.
 //
 // Where the real asset root exposes a local hand witness, measure only the
 // articulated change in its local coordinates and project that delta with
 // the CURRENT authored asset world matrix. This accounts for all current
 // ancestor transforms and non-uniform rig scale without inventing any blade
 // tip, skinning data or geometry. A lost/malformed witness fails closed.
 // Numeric/mock adapters without a body-root API retain the old yaw contract.
 let dx,dy,dz;
 const hasBodyWitness=previous.sourceBodyRoot!==undefined||
  current.sourceBodyRoot!==undefined;
 if(hasBodyWitness){
  if(!previous.sourceBodyRoot||
   previous.sourceBodyRoot!==current.sourceBodyRoot||
   ![previous.localX,previous.localY,previous.localZ,
     current.localX,current.localY,current.localZ].every(Number.isFinite))
   return null;
  // The authored stage captures the affine basis at the SAME instant as
  // this local skinned joint. Matrix4.elements is a live mutable array; a
  // later animator/pivot change must not rewrite the already sampled stroke.
  // Use the immutable scalar witness when available. The frame receipt will
  // separately check those same scalars against the actual submitted pose.
  // Older injected adapters without captured coefficients retain the former
  // validated live-matrix path for backwards compatibility.
  const hasCapturedBasis=BODY_BASIS_KEYS.some(k=>current[k]!==undefined)||
   BODY_TRANSLATION_KEYS.some(k=>current[k]!==undefined);
  const m=current.poseFrameMatrix;
  if(hasCapturedBasis){
   for(const k of BODY_BASIS_KEYS)if(!Number.isFinite(current[k]))return null;
   for(const k of BODY_TRANSLATION_KEYS)if(!Number.isFinite(current[k]))return null;
  }else if(!m||m.length!==16||
   ![m[0],m[1],m[2],m[3],m[4],m[5],m[6],m[7],
     m[8],m[9],m[10],m[11],m[15]].every(Number.isFinite)||
   Math.abs(m[3])>1e-6||Math.abs(m[7])>1e-6||
   Math.abs(m[11])>1e-6||Math.abs(m[15]-1)>1e-6)return null;
  const lx=current.localX-previous.localX;
  const ly=current.localY-previous.localY;
  const lz=current.localZ-previous.localZ;
  dx=(hasCapturedBasis?current.bodyM0:m[0])*lx+
   (hasCapturedBasis?current.bodyM4:m[4])*ly+
   (hasCapturedBasis?current.bodyM8:m[8])*lz;
  dy=(hasCapturedBasis?current.bodyM1:m[1])*lx+
   (hasCapturedBasis?current.bodyM5:m[5])*ly+
   (hasCapturedBasis?current.bodyM9:m[9])*lz;
  dz=(hasCapturedBasis?current.bodyM2:m[2])*lx+
   (hasCapturedBasis?current.bodyM6:m[6])*ly+
   (hasCapturedBasis?current.bodyM10:m[10])*lz;
 }else{
  // Legacy test/adapter fallback: remove rigid translation and yaw. The
  // actual authored path above is stronger because it also rejects recoil,
  // pitch, roll and ancestor transforms not represented by root yaw.
  const pyaw=previous.yaw??0,cyaw=current.yaw??0,
   pc=Math.cos(pyaw),ps=Math.sin(pyaw),cc=Math.cos(cyaw),cs=Math.sin(cyaw),
   px=previous.x-previous.rootX,pz=previous.z-previous.rootZ,
   cx=current.x-current.rootX,cz=current.z-current.rootZ,
   dxLocal=(cx*cc-cz*cs)-(px*pc-pz*ps),
   dzLocal=(cx*cs+cz*cc)-(px*ps+pz*pc);
  dy=(current.y-current.rootY)-(previous.y-previous.rootY);
  dx=dxLocal*cc+dzLocal*cs;
  dz=-dxLocal*cs+dzLocal*cc;
 }
 const length=Math.hypot(dx,dy,dz);
 if(!Number.isFinite(length)||length<MEASURED_HAND_TRAIL_MIN_METERS||
  length>MEASURED_HAND_TRAIL_MAX_METERS||
  length/frameSeconds<MEASURED_HAND_TRAIL_MIN_METERS_PER_SECOND)return null;
 // Place one short retained stroke at the CURRENT skinned wrist. This is
 // observed relative hand travel, never an inferred sword-tip or contact.
 return Object.freeze({
  center:Object.freeze({x:current.x-dx*.5,y:current.y-dy*.5,z:current.z-dz*.5}),
  direction:Object.freeze({x:dx/length,y:dy/length,z:dz/length}),length
 });
}
