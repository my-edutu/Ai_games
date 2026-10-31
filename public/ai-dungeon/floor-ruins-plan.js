/**
 * Deterministic decorative floor wear. It never changes the gameplay grid,
 * collision, enemies, navigation, loot or the authority's seeded random streams.
 * All elevations are kept below the ankle, with hard instance budgets.
 */
const THEMES=['crypt','ember','obsidian','hollow'];
const empty=()=>({pavers:[],puddles:[]});
const hash=(x,z,f,t=0)=>{
 let n=(Math.imul(x+271,0x45d9f3b)^Math.imul(z+157,0x27d4eb2d)^Math.imul(f+91,0x165667b1)^Math.imul(t+13,0x7feb352d))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return(n^(n>>>16))>>>0;
};
const cap=(value,max)=>Number.isFinite(value)?Math.max(0,Math.min(max,Math.floor(value))):max;
export function planFloorRuins(map,floor,exit,{maxPavers=144,maxPuddles=22}={}){
 if(!Array.isArray(map)||map.length<7||map.length>64||!map.every(row=>typeof row==='string'&&row.length===map.length))return empty();
 if(!Number.isSafeInteger(floor)||floor<1)return empty();
 if(!map.some(row=>row.includes('#')))return empty();
 const np=cap(maxPavers,144),nw=cap(maxPuddles,22);
 if(!np&&!nw)return empty();
 const n=map.length,center=(n-1)/2,theme=THEMES[(floor-1)%THEMES.length],pavers=[],puddles=[],safe=[];
 const hasExit=Number.isFinite(exit?.x)&&Number.isFinite(exit?.z);
 for(let z=1;z<n-1;z++)for(let x=1;x<n-1;x++){
  if(map[z][x]!=='.')continue;
  if(Math.abs(x-1)+Math.abs(z-1)<=3)continue;
  if(hasExit&&Math.abs(x-exit.x)+Math.abs(z-exit.z)<=2)continue;
  const h=hash(x,z,floor);
  const offsetX=(((h>>>5)%13)-6)*.036,offsetZ=(((h>>>12)%13)-6)*.036;
  const base={gridX:x,gridZ:z,x:x-center+offsetX,z:z-center+offsetZ,theme};
  safe.push({...base,score:hash(x,z,floor,71)});
  if(h%5<=2){
   pavers.push({...base,y:.035,thickness:.025+((h>>>17)%4)*.006,
    sx:.44+((h>>>20)%5)*.057,sz:.28+((h>>>24)%5)*.065,
    yaw:((h>>>28)%16)*Math.PI/8,shade:.72+((h>>>8)%9)*.038,score:hash(x,z,floor,97)});
  }
  if(h%13===2){
   puddles.push({...base,y:.023,sx:.32+((h>>>13)%5)*.053,sz:.28+((h>>>18)%5)*.051,
    yaw:((h>>>23)%12)*Math.PI/6,shade:.72+((h>>>7)%8)*.025,score:hash(x,z,floor,109)});
  }
 }
 // Sparse layout fallback for very small connected rooms: only valid floor cells.
 if(!pavers.length&&safe.length){const a=safe[0];pavers.push({...a,y:.035,thickness:.03,sx:.51,sz:.40,yaw:0,shade:.9});}
 if(!puddles.length&&safe.length){const a=safe[safe.length-1];puddles.push({...a,y:.023,sx:.36,sz:.33,yaw:0,shade:.8});}
 pavers.sort((a,b)=>a.score-b.score||a.gridZ-b.gridZ||a.gridX-b.gridX);
 puddles.sort((a,b)=>a.score-b.score||a.gridZ-b.gridZ||a.gridX-b.gridX);
 const stripScore=({score,...p})=>p;
 return {pavers:pavers.slice(0,np).map(stripScore),puddles:puddles.slice(0,nw).map(stripScore)};
}
