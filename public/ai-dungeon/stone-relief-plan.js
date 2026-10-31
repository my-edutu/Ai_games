/**
 * Pure, bounded weathered masonry over already exposed real wall facades.
 * Read-only Three.js placement recipes; neither tiles/collision nor AI changes.
 * Original sculpted stones have no external assets or random/time dependencies.
 */
const MAX_SPALLS=96,MAX_COPING=48;
const empty=()=>({spalls:[],coping:[]});
const budget=(v,max)=>v===undefined?max:Number.isInteger(v)?Math.max(0,Math.min(max,v)):0;
export function planStoneRelief(faces,floor,limits={}){
 if(!Array.isArray(faces)||!Number.isSafeInteger(floor)||floor<1||floor>100000)return empty();
 const maxSpalls=budget(limits?.maxSpalls,MAX_SPALLS);
 const maxCoping=budget(limits?.maxCoping,MAX_COPING);
 const spalls=[],coping=[];
 if(!maxSpalls&&!maxCoping)return {spalls,coping};
 for(let faceIndex=0;faceIndex<faces.length&&(spalls.length<maxSpalls||coping.length<maxCoping);faceIndex++){
  const f=faces[faceIndex];
  if(!Array.isArray(f)||f.length<9||![f[0],f[2],f[7],f[8]].every(Number.isFinite))continue;
  const dx=f[7],dz=f[8];
  if(Math.abs(dx)+Math.abs(dz)!==1||Math.abs(f[0])>10||Math.abs(f[2])>10)continue;
  // Integer coordinate mix makes the surface breakup deterministic across
  // rerenders, ticks, camera changes and browser frame rates.
  const ux=Math.round((f[0]+12)*512),uz=Math.round((f[2]+12)*512);
  const h=(Math.imul(ux+faceIndex*7,73856093)^Math.imul(uz+faceIndex*11,19349663)^Math.imul(floor,83492791))>>>0;
  const yaw=Math.atan2(dx,dz);
  const along=(((h>>>6)%11)-5)*.046;
  const front=.055+((h>>>17)%3)*.012;
  const shade=.73+((h>>>21)%17)*.029;
  if(spalls.length<maxSpalls&&h%5!==0){
   spalls.push({
    faceIndex,x:f[0]+dx*front+dz*along,
    y:.40+((h>>>9)%7)*.255,
    z:f[2]+dz*front+dx*along,
    sx:.29+((h>>>15)%7)*.038,sy:.20+((h>>>19)%5)*.052,
    sz:.125+((h>>>25)%3)*.02,yaw,shade
   });
  }
  if(coping.length<maxCoping&&h%3===0){
   coping.push({
    faceIndex,x:f[0]-dx*.018+dz*along,
    y:2.58+((h>>>10)%4)*.047,
    z:f[2]-dz*.018+dx*along,
    sx:.35+((h>>>14)%6)*.04,sy:.16+((h>>>20)%4)*.041,
    sz:.15+((h>>>23)%4)*.025,yaw,shade:.78+((h>>>18)%13)*.03
   });
  }
 }
 return {spalls,coping};
}
