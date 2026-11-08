/**
 * D04 read-only wall-clearance envelope for unconfirmed arrows and spells.
 * Uses only the public Dungeon snapshot map. An aim target is not hit proof.
 * No damage, collision event, bounce, impact VFX or authority mutation.
 *
 * Inputs are world-space origin and the already target-cleared terminal point;
 * returns the fraction of THAT path safe to render. This is not ballistics.
 */
export const D04_PROJECTILE_WALL_CLEARANCE_METERS = .31;
export const D04_MIN_VISIBLE_FLIGHT_METERS = .20;
const finite = p => p && [p.x, p.y, p.z].every(Number.isFinite);
function tile(map, x, z){
 return z >= 0 && z < map.length && x >= 0 && x < map.length &&
  map[z][x] === '.';
}
function validMap(map){
 const n = map?.length;
 return Array.isArray(map) && Number.isInteger(n) && n >= 3 && n <= 63 &&
  n % 2 === 1 && map.every(row => typeof row === 'string' &&
   row.length === n && /^[.#]+$/.test(row));
}
/** DDA examines each crossed wall tile, including BOTH side cells at corners.
 * The 0.31m clearance covers the half-length of the existing 0.43m arrow
 * mesh plus extra visual space; no false stone impact is created.
 */
export function planMapFlightClearance(start, terminal, map){
 if(!finite(start) || !finite(terminal) || !validMap(map)) return null;
 const dx=terminal.x-start.x, dz=terminal.z-start.z,
  distance=Math.hypot(dx,dz);
 if(!Number.isFinite(distance)||distance<D04_MIN_VISIBLE_FLIGHT_METERS)return null;
 const offset=(map.length-1)/2;
 const sx=start.x+offset+.5, sz=start.z+offset+.5;
 let cx=Math.floor(sx),cz=Math.floor(sz);
 if(!tile(map,cx,cz))return null;
 const ix=dx>0?1:dx<0?-1:0, iz=dz>0?1:dz<0?-1:0;
 let tx=ix?( (ix>0?cx+1:cx)-sx)/dx :Infinity;
 let tz=iz?( (iz>0?cz+1:cz)-sz)/dz :Infinity;
 const stepx=ix?1/Math.abs(dx):Infinity,
  stepz=iz?1/Math.abs(dz):Infinity;
 for(let traversed=0;traversed<map.length*2+2;traversed++){
  const hit=Math.min(tx,tz);
  if(hit>1+1e-10)break;
  const crossX=tx<=tz+1e-10, crossZ=tz<=tx+1e-10;
  const blocked=(crossX&&!tile(map,cx+ix,cz)) ||
   (crossZ&&!tile(map,cx,cz+iz)) ||
   (crossX&&crossZ&&!tile(map,cx+ix,cz+iz));
  if(blocked){
   const reachable=Math.min(distance,Math.max(0,hit*distance-D04_PROJECTILE_WALL_CLEARANCE_METERS));
   if(reachable<D04_MIN_VISIBLE_FLIGHT_METERS)return null;
   return Object.freeze({fraction:reachable/distance,travelMeters:reachable,clipped:true});
  }
  if(crossX){cx+=ix;tx+=stepx}
  if(crossZ){cz+=iz;tz+=stepz}
 }
 return Object.freeze({fraction:1,travelMeters:distance,clipped:false});
}
