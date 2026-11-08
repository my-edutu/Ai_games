/**
 * D04: read-only, root-motion-compensated hand travel on a genuine animated rig.
 * Never makes a sweep from a static hand while the entire actor merely turns.
 * This is a hand proxy, NOT a verified GLB sword-tip measurement or a hit.
 */
export const MEASURED_HAND_TRAIL_MIN_METERS=.025;
export const MEASURED_HAND_TRAIL_MAX_METERS=.38;
export const MEASURED_HAND_TRAIL_MAX_FRAME_SECONDS=.06;
const finite=p=>p&&['x','y','z','rootX','rootY','rootZ'].every(k=>Number.isFinite(p[k]))&&
 (p.yaw===undefined||Number.isFinite(p.yaw));
export function planMeasuredHandTrail(previous,current,frameSeconds){
 if(!finite(previous)||!finite(current)||!Number.isFinite(frameSeconds)||
  frameSeconds<=0||frameSeconds>MEASURED_HAND_TRAIL_MAX_FRAME_SECONDS)return null;
 // Remove rigid-body root yaw as well as translation BEFORE deciding whether
 // the arm actually moved. Otherwise merely turning to face an enemy makes a
 // large, entirely fictitious 'sword swing' with a planted wrist.
 const pyaw=previous.yaw??0,cyaw=current.yaw??0,
  pc=Math.cos(pyaw),ps=Math.sin(pyaw),cc=Math.cos(cyaw),cs=Math.sin(cyaw),
  px=previous.x-previous.rootX,pz=previous.z-previous.rootZ,
  cx=current.x-current.rootX,cz=current.z-current.rootZ,
  dxLocal=(cx*cc-cz*cs)-(px*pc-pz*ps),
  dzLocal=(cx*cs+cz*cc)-(px*ps+pz*pc),
  dy=(current.y-current.rootY)-(previous.y-previous.rootY),
  length=Math.hypot(dxLocal,dy,dzLocal);
 if(!Number.isFinite(length)||length<MEASURED_HAND_TRAIL_MIN_METERS||
  length>MEASURED_HAND_TRAIL_MAX_METERS)return null;
 // Draw at the CURRENT world-space bone using the measured local limb motion
 // rotated through its current root, never a prerecorded/synthetic blade arc.
 const dx=dxLocal*cc+dzLocal*cs,dz=-dxLocal*cs+dzLocal*cc;
 return Object.freeze({
  center:Object.freeze({x:current.x-dx*.5,y:current.y-dy*.5,z:current.z-dz*.5}),
  direction:Object.freeze({x:dx/length,y:dy/length,z:dz/length}),length
 });
}
