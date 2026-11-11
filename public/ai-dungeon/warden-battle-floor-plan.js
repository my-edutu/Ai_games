/**
 * Original physical Warden fighting floor from the real public map.
 * No collision, attack, AI, health, rig, RNG or save authority.
 */
const EMPTY=Object.freeze({status:'UNAVAILABLE',stones:Object.freeze([]),collisionChanges:0});
const valid=n=>Number.isSafeInteger(n);
export function planWardenBattleFloor(map,exit,floor){
 const n=map?.length;
 if(!Array.isArray(map)||!valid(n)||n<9||n>41||n%2===0||
  !map.every(row=>typeof row==='string'&&row.length===n&&/^[.#]+$/.test(row))||
  !valid(exit?.x)||!valid(exit?.z)||map[exit.z]?.[exit.x]!=='.'||
  !valid(floor)||floor<1||floor>100000)return EMPTY;
 const half=(n-1)/2,stones=[];
 for(let z=Math.max(1,exit.z-3);z<=Math.min(n-2,exit.z+3);z++)
  for(let x=Math.max(1,exit.x-3);x<=Math.min(n-2,exit.x+3);x++){
   if(map[z][x]!=='.')continue;
   const hash=(Math.imul(x+17,73856093)^Math.imul(z+13,19349663)^
    Math.imul(floor+7,83492791))>>>0;
   stones.push(Object.freeze({gridX:x,gridZ:z,x:x-half,z:z-half,
    yaw:(hash%4)*Math.PI/2,width:.94+((hash>>>3)%4)*.008,
    depth:.94+((hash>>>7)%4)*.008}));
  }
 return Object.freeze({status:'READY',stones:Object.freeze(stones),
  collisionChanges:0,source:'actual-walkable-warden-court',
  maxStoneTopMeters:.035});
}
