/**
 * Original low, wall-supported perimeter lantern placements for Dungeon M1.
 * Old four unsupported 2m corner columns could fill the mobile foreground.
 * A marker exists only where the real immutable map has a solid exterior wall
 * with a legal walkable inner neighbour, safely clear of living characters.
 * Presentation-only: does not change map, units, pathfinding, or simulation.
 */
export function planPerimeterWallLanterns(map,units=[],limit=4){
 const n=Array.isArray(map)?map.length:0;
 if(n<9||n>81||map.some(row=>typeof row!=='string'||row.length!==n)||
   !Array.isArray(units)||units.length>256||!Number.isSafeInteger(limit)||limit<0||limit>4)return [];
 const offset=(n-1)/2;
 const sides=[
  {side:'north',fraction:.28,yaw:0,dx:0,dz:1,at:i=>[i,0]},
  {side:'east',fraction:.72,yaw:-Math.PI/2,dx:-1,dz:0,at:i=>[n-1,i]},
  {side:'south',fraction:.72,yaw:Math.PI,dx:0,dz:-1,at:i=>[i,n-1]},
  {side:'west',fraction:.28,yaw:Math.PI/2,dx:1,dz:0,at:i=>[0,i]}
 ];
 const sites=[];
 for(const s of sides){
  if(sites.length>=limit)break;
  const preferred=Math.max(1,Math.min(n-2,Math.round((n-1)*s.fraction)));
  const candidates=Array.from({length:n-2},(_,i)=>i+1).sort((a,b)=>Math.abs(a-preferred)-Math.abs(b-preferred)||a-b);
  for(const i of candidates){
   const [x,z]=s.at(i),wx=x+s.dx,wz=z+s.dz;
   if(map[z][x]!=='#'||map[wz]?.[wx]!=='.')continue;
   // Preserve a clear view of the original visible cast at the entry.
   if(units.some(u=>u&&u.hp>0&&Number.isFinite(u.x)&&Number.isFinite(u.z)&&
     Math.hypot(u.x-wx,u.z-wz)<2.7))continue;
   sites.push(Object.freeze({side:s.side,wallX:x,wallZ:z,
    approachX:wx,approachZ:wz,x:x-offset+s.dx*.45,z:z-offset+s.dz*.45,yaw:s.yaw}));
   break;
  }
 }
 return sites;
}
