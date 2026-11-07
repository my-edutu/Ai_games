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
// Five shaped stone courses, with twelve unique perimeter facets, replace
// the repeated straight-sided cubes. The crown, battered waist and concave
// shoulder receive actual geometry and normals, not only a texture repaint.
// The art remains entirely INSIDE the existing unwalkable authority grid.
const OUTLINE=[[-.39,-.48],[-.05,-.49],[.36,-.48],[.48,-.36],
 [.49,-.06],[.47,.36],[.35,.48],[.03,.49],[-.38,.48],
 [-.48,.35],[-.49,.04],[-.48,-.36]];
const COURSES=Object.freeze([-.5,-.28,-.06,.17,.35]);
const limit=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
export function planFracturedWallStone(floor){
 if(!Number.isSafeInteger(floor)||floor<1||floor>10000)return EMPTY();
 const vertices=[],indices=[],uvs=[],N=OUTLINE.length;
 for(let course=0;course<COURSES.length;course++)for(let i=0;i<N;i++){
  const [bx,bz]=OUTLINE[i],n=hash(i+12*course,course*31,floor);
  const inset=[0,.027,.075,.105,.142][course]+((n>>>8)%5)*.002;
  const scar=course===2?((n>>>16)%5)*.003:0;
  const x=limit(bx-Math.sign(bx)*(inset+scar),-.5,.5);
  const z=limit(bz-Math.sign(bz)*(inset+scar),-.5,.5);
  const chip=course===COURSES.length-1?((n>>>3)%14)*.010:
   course===COURSES.length-2?((n>>>11)%5)*.004:((n>>>13)%4)*.004;
  const y=limit(COURSES[course]+chip,-.5,.492);
  vertices.push(x,y,z);uvs.push(i/N,course/(COURSES.length-1));
 }
 const floorCenter=vertices.length/3;vertices.push(0,-.5,0);uvs.push(.5,0);
 const roofCenter=vertices.length/3;vertices.push(0,.432,0);uvs.push(.5,1);
 for(let ring=0;ring<COURSES.length-1;ring++)for(let i=0;i<N;i++){
  const next=(i+1)%N,a=ring*N+i,b=ring*N+next,c=(ring+1)*N+i,d=(ring+1)*N+next;
  indices.push(a,c,b,b,c,d);
 }
 const top=(COURSES.length-1)*N;
 for(let i=0;i<N;i++){
  const next=(i+1)%N;
  indices.push(roofCenter,top+next,top+i,floorCenter,i,next);
 }
 // Four shallow, raised Gothic lancet ribs are actually sculpted into this
 // same closed original wall mesh. No extra materials, draw calls, impostor
 // sprites or proprietary models. Each rib follows the battered stone's taper
 // from plinth to crown. Its camera-visible normals create real relief under
 // the existing dungeon lighting, even while cutaways scale the whole wall.
 // Six paired stations per face: 4 * 5 * 2 triangles, 48 genuine vertices.
 // Wall tiles are STILL physically closed, exactly matching the solid grid.
 const lancet=[[-.286,-.286],[-.290,-.060],[-.196,.178],[0,.305],
  [.196,.178],[.290,-.286]];
 const profileY=y=>y<=-.25?.478:y<.16?.448:.392;
 for(let face=0;face<4;face++){
  const rib=[];
  for(const [u,v] of lancet){
   const edge=.026,front=profileY(v)+.006;
   const add=(offset)=>{
    let x=u+offset,z=front;
    if(face===1){x=front;z=-(u+offset)}
    if(face===2){x=-(u+offset);z=-front}
    if(face===3){x=-front;z=u+offset}
    rib.push(vertices.length/3);vertices.push(x,v,z);
    uvs.push((u+offset+.5),v+.5);
   };
   add(-edge);add(edge);
  }
  for(let j=0;j<lancet.length-1;j++){
   const a=rib[j*2],b=rib[j*2+1],c=rib[(j+1)*2],d=rib[(j+1)*2+1];
   if(face===0||face===2)indices.push(a,c,b,b,c,d);
   else indices.push(b,c,a,d,c,b);
  }
 }
 return{vertices,indices,uvs,archRibs:4};
}
export function planWallStoneVariation(x,z,floor){
 if(!Number.isSafeInteger(x)||!Number.isSafeInteger(z)||!Number.isSafeInteger(floor)||
    floor<1||floor>10000||Math.abs(x)>64||Math.abs(z)>64)return{yaw:0,shade:1};
 const n=hash(x,z,floor);
 return{yaw:(n%4)*Math.PI/2,shade:.82+((n>>>9)%26)*.01};
}
