/**
 * D04 presentation-only projectile path. A resolved targetId confirms only
 * where a shot was AIMED; it does not prove contact or an HP delta.
 * Stop short of the target's body-volume center, with no arrival spark.
 * This path is a read-only rendering envelope, never gameplay ballistics.
 */
export const UNCONFIRMED_TARGET_CLEARANCE_METERS=.58;
export const UNCONFIRMED_MIN_SOURCE_SPAN_METERS=1.0;
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z);
export function planUnconfirmedFlight(start,end,progress){
 if(!valid(start)||!valid(end)||!Number.isFinite(progress)||progress<0)return null;
 const dx=end.x-start.x,dy=end.y-start.y,dz=end.z-start.z,
  horizontal=Math.hypot(dx,dz),full=Math.hypot(dx,dy,dz);
 // The shooter hand can already overlap a nearby target. Do not display a
 // target-penetrating bolt when even a shortened path cannot be distinguished.
 if(!Number.isFinite(full)||horizontal<UNCONFIRMED_MIN_SOURCE_SPAN_METERS)return null;
 const reach=(horizontal-UNCONFIRMED_TARGET_CLEARANCE_METERS)/horizontal;
 const fraction=Math.min(1,progress)*reach;
 return Object.freeze({
  position:Object.freeze({x:start.x+dx*fraction,y:start.y+dy*fraction,z:start.z+dz*fraction}),
  direction:Object.freeze({x:dx/full,y:dy/full,z:dz/full}),
  travelMeters:horizontal-UNCONFIRMED_TARGET_CLEARANCE_METERS
 });
}
