/** Deterministic decorative Warden chapter. The authoritative map stays read-only. */
export function planWardenCourt(map,exit,floor){
 const empty=Object.freeze({origin:0,tiles:[],facades:[]});
 if(!Array.isArray(map)||map.length<7||!exit||
  !Number.isInteger(exit.x)||!Number.isInteger(exit.z)||!Number.isInteger(floor)||
  floor<1||map[exit.z]?.[exit.x]!=='.')return empty;
 const n=map.length,origin=(n-1)/2,tiles=[],facades=[];
 const walk=(x,z)=>map[z]?.[x]==='.';
 for(let z=1;z<n-1;z++)for(let x=1;x<n-1;x++){
  const d=Math.abs(exit.x-x)+Math.abs(exit.z-z);
  if(d>5||d<1)continue;
  if(walk(x,z)){
   if(d>=2&&d<=4&&((x*31+z*19+floor*17)%4)!==0&&tiles.length<32)
    tiles.push({x:x-origin,z:z-origin,yaw:((x+z+floor)%4)*Math.PI/2});
  }else{
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    if(!walk(x+dx,z+dz)||facades.length>=14)continue;
    if((x*47+z*13+floor*23+dx*7+dz*11+4096)%3!==0)continue;
    facades.push({x:x-origin+dx*.502,z:z-origin+dz*.502,
     yaw:dx===1?Math.PI/2:dx===-1?-Math.PI/2:dz===1?0:Math.PI});
   }
  }
 }
 return Object.freeze({origin,tiles,facades});
}
