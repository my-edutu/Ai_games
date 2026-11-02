/**
 * Closed sculpted rock volume for the visible dungeon wall instancing.
 * Decorative and local to the original solid tile; no gameplay grid edits.
 */
const EMPTY=()=>({vertices:[],indices:[],uvs:[]});
function hash(x,z,f){
 let n=(Math.imul(x+73,73856093)^Math.imul(z+131,19349663)^Math.imul(f+19,83492791))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);
 n=Math.imul(n^(n>>>15),0x846ca68b);
 return(n^(n>>>16))>>>0;
}
const OUTLINE=[[-.38,-.5],[.38,-.5],[.5,-.38],[.5,.38],[.38,.5],[-.38,.5],[-.5,.38],[-.5,-.38]];
export function planFracturedWallStone(floor){
 if(!Number.isSafeInteger(floor)||floor<1||floor>10000)return EMPTY();
 const vertices=[],indices=[],uvs=[];
 for(let course=0;course<3;course++)for(let i=0;i<8;i++){
  const [baseX,baseZ]=OUTLINE[i],n=hash(i,course,floor);
  const inset=course===0?0:course===1?.017+((n>>>6)%5)*.005:.025+((n>>>8)%7)*.006;
  const x=baseX-Math.sign(baseX)*inset,z=baseZ-Math.sign(baseZ)*inset;
  const y=course===0?-.5:course===1?.015+((n>>>10)%5)*.012:.345+(hash(i,7,floor)%15)*.011;
  vertices.push(x,y,z);uvs.push(i/8,course/2);
 }
 const bottomCenter=vertices.length/3;vertices.push(0,-.5,0);uvs.push(.5,.5);
 const topCenter=vertices.length/3;vertices.push(0,.485,0);uvs.push(.5,.5);
 for(let course=0;course<2;course++)for(let i=0;i<8;i++){
  const next=(i+1)%8,a=course*8+i,b=course*8+next,c=(course+1)*8+i,d=(course+1)*8+next;
  indices.push(a,c,b,b,c,d);
 }
 for(let i=0;i<8;i++){const j=(i+1)%8;indices.push(topCenter,16+j,16+i,bottomCenter,i,j)}
 return{vertices,indices,uvs};
}
export function planWallStoneVariation(x,z,floor){
 if(!Number.isSafeInteger(x)||!Number.isSafeInteger(z)||!Number.isSafeInteger(floor)||
    floor<1||floor>10000||Math.abs(x)>64||Math.abs(z)>64)return{yaw:0,shade:1};
 const n=hash(x,z,floor);
 return{yaw:(n%4)*Math.PI/2,shade:.82+((n>>>9)%26)*.01};
}
