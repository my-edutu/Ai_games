/**
 * Floor-specific non-playable cavern rim. Original local geometry only.
 * The square authority grid, walkability, actor sightlines and seeded runtime
 * are NEVER consulted or modified: these two instanced ridges live beyond all
 * four corners of the actual map, including the nearest rock's full footprint.
 */
const hash=(index,channel,floor)=>{
 let n=Math.imul(index+73,0x45d9f3b)^Math.imul(channel+113,0x27d4eb2d)^Math.imul(floor+17,0x165667b1);
 n=Math.imul(n^(n>>>16),0x7feb352d);
 return (n^(n>>>15))>>>0;
};
const pick=(index,channel,floor)=>hash(index,channel,floor)/4294967296;
const EMPTY=()=>({near:[],far:[]});

export function planCavernRim(floor,mapSize=19){
 if(!Number.isInteger(floor)||floor<1||floor>65535||
    !Number.isInteger(mapSize)||mapSize<5||mapSize>129||mapSize%2===0)return EMPTY();
 const corner=Math.SQRT2*((mapSize-1)/2);
 const ridge=(count,layer)=>{
  const near=layer===0,rocks=[];
  const phase=pick(0,61+layer,floor)*.55;
  for(let i=0;i<count;i++){
   const angle=(i+phase+(near?0:.43))*Math.PI*2/count;
   const radius=corner+(near?6.3:14.5)+pick(i,7+layer,floor)*(near?1.8:2.6);
   const width=(near?2.35:2.75)+pick(i,13+layer,floor)*(near?1.6:2.15);
   const depth=(near?2.15:2.65)+pick(i,23+layer,floor)*(near?1.65:2.05);
   const height=(near?5.4:8.4)+pick(i,31+layer,floor)*(near?6.2:11.1);
   // Keep each stone above the horizon floor and below 20m. No flat tall obelisks.
   rocks.push([
    Math.cos(angle)*radius,
    height/2-.18,
    Math.sin(angle)*radius,
    width,height,depth,
    pick(i,49+layer,floor)*Math.PI*2
   ]);
  }
  return rocks;
 };
 return {near:ridge(48,0),far:ridge(32,1)};
}
