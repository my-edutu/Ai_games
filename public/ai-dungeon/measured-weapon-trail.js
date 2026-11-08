/**
 * D04: a read-only fragment of actual local animated weapon-hand travel.
 * Never synthesizes a blade arc, infers a hit, or spans skipped/stalled frames.
 * Translation of the entire actor root is removed, so walking with a fixed
 * hand is not mistaken for a sword swing. Blade-tip tracking is NOT claimed.
 */
export const MEASURED_HAND_TRAIL_MIN_METERS=.025;
export const MEASURED_HAND_TRAIL_MAX_METERS=.38;
export const MEASURED_HAND_TRAIL_MAX_FRAME_SECONDS=.06;
const finite=p=>p&&['x','y','z','rootX','rootY','rootZ'].every(k=>Number.isFinite(p[k]));
export function planMeasuredHandTrail(previous,current,frameSeconds){
 if(!finite(previous)||!finite(current)||!Number.isFinite(frameSeconds)||
  frameSeconds<=0||frameSeconds>MEASURED_HAND_TRAIL_MAX_FRAME_SECONDS)return null;
 const dx=(current.x-current.rootX)-(previous.x-previous.rootX),
  dy=(current.y-current.rootY)-(previous.y-previous.rootY),
  dz=(current.z-current.rootZ)-(previous.z-previous.rootZ);
 const length=Math.hypot(dx,dy,dz);
 if(!Number.isFinite(length)||length<MEASURED_HAND_TRAIL_MIN_METERS||
  length>MEASURED_HAND_TRAIL_MAX_METERS)return null;
 return Object.freeze({
  center:Object.freeze({x:current.x-dx*.5,y:current.y-dy*.5,z:current.z-dz*.5}),
  direction:Object.freeze({x:dx/length,y:dy/length,z:dz/length}),length
 });
}
