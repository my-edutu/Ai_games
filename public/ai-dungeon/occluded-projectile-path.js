/**
 * D04 read-only wall-clearance envelope for unconfirmed arrows and spells.
 * The already target-cleared ray is checked against a conservative swept
 * cross-section of the existing public floor map, not just its centreline.
 * No authoritative collision, damage, debris, impact, or attacker is inferred.
 */
export const D04_PROJECTILE_WALL_CLEARANCE_METERS=.31;
export const D04_MIN_VISIBLE_FLIGHT_METERS=.20;
// The existing projectile cylinder has a .024m maximum radius. Leave a small
// .011m tolerance for visual scale and grazing edges; do not create geometry.
export const D04_PROJECTILE_HALF_WIDTH_METERS=.035;
const finite=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
function validMap(map){
 const n=map?.length;
 return Array.isArray(map)&&Number.isInteger(n)&&n>=3&&n<=63&&n%2===1&&
  map.every(row=>typeof row==='string'&&row.length===n&&/^[.#]+$/.test(row));
}
/** First entry of a finite ray segment into an axis-aligned wall rectangle.
 * Inflating by half-width approximates the projectile's swept cross-section
 * conservatively; this may suppress some grazing visuals, never add hits.
 */
function entryFraction(start,dx,dz,left,right,near,far){
 let enter=0,leave=1;
 for(const [position,delta,min,max] of [
  [start.x,dx,left,right],[start.z,dz,near,far]
 ]){
  if(delta===0){if(position<min||position>max)return null;continue}
  let lo=(min-position)/delta,hi=(max-position)/delta;
  if(lo>hi){const t=lo;lo=hi;hi=t}
  enter=Math.max(enter,lo);leave=Math.min(leave,hi);
  if(enter>leave)return null;
 }
 return enter;
}
export function planMapFlightClearance(start,terminal,map){
 if(!finite(start)||!finite(terminal)||!validMap(map))return null;
 const dx=terminal.x-start.x,dz=terminal.z-start.z,
  distance=Math.hypot(dx,dz),n=map.length,offset=(n-1)/2,
  width=D04_PROJECTILE_HALF_WIDTH_METERS;
 if(!Number.isFinite(distance)||distance<D04_MIN_VISIBLE_FLIGHT_METERS)return null;
 // A tracked hand outside the current floor cannot certify a masonry path.
 const inner=-offset-.5+width,outer=offset+.5-width;
 if(start.x<inner||start.x>outer||start.z<inner||start.z>outer)return null;
 const sx=Math.floor(start.x+offset+.5),sz=Math.floor(start.z+offset+.5);
 if(map[sz]?.[sx]!=='.')return null;
 let earliest=1,blocked=false;
 // The map boundary is solid even when a malformed public layout omitted
 // its perimeter walls. An off-floor bolt may only fade before the edge.
 if(dx>0&&terminal.x>=outer){blocked=true;earliest=Math.min(earliest,(outer-start.x)/dx)}
 if(dx<0&&terminal.x<=inner){blocked=true;earliest=Math.min(earliest,(inner-start.x)/dx)}
 if(dz>0&&terminal.z>=outer){blocked=true;earliest=Math.min(earliest,(outer-start.z)/dz)}
 if(dz<0&&terminal.z<=inner){blocked=true;earliest=Math.min(earliest,(inner-start.z)/dz)}
 // Examine only cells inside the segment's padded AABB. For the public 19x19
 // floor this is at most 361 simple wall tests, once per shot, never per frame.
 const xmin=Math.max(0,Math.floor(Math.min(start.x,terminal.x)+offset+.5-width)),
  xmax=Math.min(n-1,Math.floor(Math.max(start.x,terminal.x)+offset+.5+width)),
  zmin=Math.max(0,Math.floor(Math.min(start.z,terminal.z)+offset+.5-width)),
  zmax=Math.min(n-1,Math.floor(Math.max(start.z,terminal.z)+offset+.5+width));
 for(let z=zmin;z<=zmax;z++)for(let x=xmin;x<=xmax;x++){
  if(map[z][x]!== '#')continue;
  const cx=x-offset,cz=z-offset;
  const enter=entryFraction(start,dx,dz,cx-.5-width,cx+.5+width,
   cz-.5-width,cz+.5+width);
  if(enter!==null){blocked=true;earliest=Math.min(earliest,enter)}
 }
 if(!blocked)return Object.freeze({fraction:1,travelMeters:distance,clipped:false});
 const reachable=Math.max(0,earliest*distance-D04_PROJECTILE_WALL_CLEARANCE_METERS);
 if(reachable<D04_MIN_VISIBLE_FLIGHT_METERS)return null;
 return Object.freeze({fraction:reachable/distance,travelMeters:reachable,clipped:true});
}
