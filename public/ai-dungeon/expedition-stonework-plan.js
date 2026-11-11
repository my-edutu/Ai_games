/**
 * Organic, route-directed flagstone floor for the actual autonomous dungeon.
 * All decisions derive only from the public, authoritative walkability map,
 * exit and floor. No RNG, fake navigation, invisible hazard or actor movement.
 * Slabs span 1–3 adjacent legal grid cells, replacing the visually dominant
 * checkerboard of tiny independent cubes with a continuous Gothic floor.
 */
const DIRS=Object.freeze([[1,0],[0,1],[-1,0],[0,-1]]);
const SIZES=Object.freeze([[3,2],[2,2],[3,1],[1,3],[2,1],[1,2],[1,1]]);
const hash=(x,z,f,s=0)=>{
 let n=(Math.imul(x+109,0x45d9f3b)^Math.imul(z+227,0x27d4eb2d)^Math.imul(f+13,0x165667b1)^Math.imul(s+61,0x7feb352d))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);
 return(n^(n>>>16))>>>0;
};
const index=(x,z,n)=>z*n+x;
const validMap=map=>Array.isArray(map)&&map.length>=7&&map.length<=64&&
 map.every(row=>typeof row==='string'&&row.length===map.length&&/^[.#]+$/.test(row));
function routeToExit(map,exit){
 const n=map.length,origin={x:1,z:1};
 if(map[1]?.[1]!=='.'||map[exit.z]?.[exit.x]!=='.')return [];
 const seen=new Set([index(1,1,n)]),queue=[origin],parent=new Map();
 for(let i=0;i<queue.length;i++){
  const cell=queue[i];if(cell.x===exit.x&&cell.z===exit.z)break;
  for(const [dx,dz] of DIRS){const x=cell.x+dx,z=cell.z+dz,k=index(x,z,n);
   if(map[z]?.[x]!=='.'||seen.has(k))continue;
   seen.add(k);parent.set(k,index(cell.x,cell.z,n));queue.push({x,z});
  }
 }
 const end=index(exit.x,exit.z,n);if(!seen.has(end))return [];
 const route=[];let cursor=end;
 while(true){route.push({x:cursor%n,z:Math.floor(cursor/n)});if(cursor===index(1,1,n))break;
  cursor=parent.get(cursor);if(cursor===undefined)return [];
 }
 return route.reverse();
}
const finiteExit=(exit,n)=>Number.isInteger(exit?.x)&&Number.isInteger(exit?.z)&&
 exit.x>0&&exit.z>0&&exit.x<n-1&&exit.z<n-1;
export function planExpeditionStonework(map,floor,exit,{reservedCells=null}={}){
 const empty={stones:[],routeLength:0,walkableCells:0,coveredCells:0,chapters:0,largestSpan:0};
 if(!validMap(map)||!Number.isSafeInteger(floor)||floor<1||!finiteExit(exit,map.length))return empty;
 const route=routeToExit(map,exit);if(!route.length)return empty;
 const n=map.length,center=(n-1)/2,occupied=new Uint8Array(n*n),onRoute=new Set(route.map(p=>index(p.x,p.z,n)));
 // The real map-validated Warden Court matte plates own these source cells;
 // never overlay a second independently tessellated relief beneath hazards.
 const excluded=reservedCells instanceof Set&&reservedCells.size<=49?reservedCells:null;
 const isReserved=(x,z)=>excluded?.has(x+','+z)===true;
 const walkable=[];
 for(let z=0;z<n;z++)for(let x=0;x<n;x++)if(map[z][x]==='.'&&!isReserved(x,z))walkable.push({x,z});
 const visit=route.filter(p=>!isReserved(p.x,p.z)).concat(walkable.filter(p=>!onRoute.has(index(p.x,p.z,n)))
  .sort((a,b)=>hash(a.x,a.z,floor,4)-hash(b.x,b.z,floor,4)||a.z-b.z||a.x-b.x));
 const stones=[];
 const canFit=(x,z,w,d)=>{
  if(x<0||z<0||x+w>n||z+d>n)return false;
  for(let dz=0;dz<d;dz++)for(let dx=0;dx<w;dx++){
   if(map[z+dz][x+dx]!=='.'||isReserved(x+dx,z+dz)||occupied[index(x+dx,z+dz,n)])return false;
  }
  return true;
 };
 for(const cell of visit){
  if(occupied[index(cell.x,cell.z,n)])continue;
  let selected=null;
  // Large irregular blocks across genuine connected chambers; thin stretchers
  // along passages. Every candidate contains this real walkable floor cell.
  for(const [width,depth] of SIZES){
   for(let oz=0;oz<depth;oz++)for(let ox=0;ox<width;ox++){
    const x=cell.x-ox,z=cell.z-oz;if(!canFit(x,z,width,depth))continue;
    let routeCells=0;
    for(let dz=0;dz<depth;dz++)for(let dx=0;dx<width;dx++)
     routeCells+=Number(onRoute.has(index(x+dx,z+dz,n)));
    const court=Math.abs(x+(width-1)/2-exit.x)+Math.abs(z+(depth-1)/2-exit.z)<=4;
    // Avoid uniform rows of rectangles; allow narrow corridor stretchers to
    // compete with two-by-two courts, using only coordinate-hashed tie breaks.
    const area=width*depth;
    const score=area*100+(court&&width>1&&depth>1?15:0)+routeCells*5+
      (hash(x,z,floor,width*7+depth)%17)-Math.abs(width-depth)*3;
    if(!selected||score>selected.score||score===selected.score&&(z<selected.z||z===selected.z&&x<selected.x))
     selected={x,z,width,depth,score,routeCells};
   }
  }
  if(!selected)continue; // Only possible on malformed map: never draw on a wall.
  const {x,z,width,depth,routeCells}=selected;
  for(let dz=0;dz<depth;dz++)for(let dx=0;dx<width;dx++)occupied[index(x+dx,z+dz,n)]=1;
  const centerX=x+(width-1)/2,centerZ=z+(depth-1)/2;
  const distanceToExit=Math.abs(centerX-exit.x)+Math.abs(centerZ-exit.z);
  let nearest=route.length-1,bestDistance=Infinity;
  for(let i=0;i<route.length;i++){
   const distance=Math.abs(route[i].x-centerX)+Math.abs(route[i].z-centerZ);
   if(distance<bestDistance){bestDistance=distance;nearest=i}
  }
  const chapter=Math.min(3,Math.floor(4*nearest/Math.max(1,route.length)));
  const finish=distanceToExit<=3.5?2:routeCells>0?0:1;
  const weather=hash(x,z,floor,23),stone={
   x:centerX-center,z:centerZ-center,gridX:x,gridZ:z,width,depth,finish,chapter,
   yaw:((weather>>>9)%9-4)*.0035,
   shade:.85+(weather%11)*.022,
   raise:((weather>>>5)%4)*.002,
   worn:(weather>>>15)%4,routeCells
  };
  stones.push(stone);
 }
 const coveredCells=occupied.reduce((sum,v)=>sum+v,0);
 return {stones,routeLength:route.length,walkableCells:walkable.length,coveredCells,
  reservedCourtCells:excluded?excluded.size:0,
  chapters:new Set(stones.map(s=>s.chapter)).size,
  largestSpan:Math.max(0,...stones.map(s=>s.width*s.depth))};
}
