/**
 * M1 Warden encounter negative-space stage. Presentation only.
 *
 * A real 7x7 walkable court is a physical fighting volume, not a platform
 * for unrelated stone chips, glowing rune fragments, freestanding pillars
 * and duplicated gateways. Preserve every underlying floor/wall and all
 * authoritative Warden warning/trap meshes. The original Gothic threshold
 * may carry an open crest ONLY when the existing route planner proves its
 * two supports are genuinely impassable masonry cells.
 *
 * No gameplay, collision, random stream, trap, unit, HP or save access.
 */
const EMPTY_GATE=null;
const invalid=Object.freeze({status:'unavailable',gate:EMPTY_GATE,
 clearCourtTile:()=>false,source:'no-supported-map',authorityChanges:0});
const integer=n=>Number.isSafeInteger(n);
function validMap(map,exit){
 if(!Array.isArray(map)||map.length<7||map.length>41||
    !map.every(row=>typeof row==='string'&&row.length===map.length&&/^[.#]+$/.test(row))||
    !integer(exit?.x)||!integer(exit?.z)||map[exit.z]?.[exit.x]!=='.')return false;
 return true;
}
function groundedGate(map,threshold){
 if(!threshold||threshold.role!=='warden'||
    !integer(threshold.gridX)||!integer(threshold.gridZ)||
    map[threshold.gridZ]?.[threshold.gridX]!=='.'||
    !Array.isArray(threshold.supportCells)||threshold.supportCells.length!==2||
    !threshold.supportCells.every(([x,z])=>integer(x)&&integer(z)&&map[z]?.[x]==='#')||
    !Number.isFinite(threshold.yaw))return null;
 const [[ax,az],[bx,bz]]=threshold.supportCells;
 // The real entrance must be a one-cell open lane between opposed blocked
 // masonry, not arbitrary distant wall stones or fictional doors.
 const sameVertical=ax===bx&&Math.abs(az-bz)===2&&ax===threshold.gridX&&
  (az+bz)===2*threshold.gridZ;
 const sameHorizontal=az===bz&&Math.abs(ax-bx)===2&&az===threshold.gridZ&&
  (ax+bx)===2*threshold.gridX;
 if(!sameVertical&&!sameHorizontal)return null;
 const half=(map.length-1)/2;
 return Object.freeze({x:threshold.gridX-half,z:threshold.gridZ-half,
  yaw:threshold.yaw,supports:Object.freeze(threshold.supportCells.map(c=>Object.freeze([...c]))),
  realWalkableEntrance:true,realBlockedSupports:2});
}
export function planWardenArenaStage(map,exit,journey=null){
 if(!validMap(map,exit))return invalid;
 const supported=journey?.status==='ready'&&Array.isArray(journey.thresholds)?
  journey.thresholds.find(t=>t?.role==='warden'):null;
 const gate=groundedGate(map,supported);
 const clearCourtTile=(x,z)=>integer(x)&&integer(z)&&
  map[z]?.[x]==='.'&&Math.max(Math.abs(x-exit.x),Math.abs(z-exit.z))<=3;
 return Object.freeze({status:'court-cleared',gate,clearCourtTile,
  source:'authority-open-court-and-actual-structural-threshold',
  authorityChanges:0});
}
