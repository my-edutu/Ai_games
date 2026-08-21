import type{GeneratedFloor}from '../state/types';
import{fromCell,toCell}from '../generation/floor';

export interface PathResult{path:number[];expansions:number;reached:boolean}

export function orthogonalNeighbors(cell:number,width:number,height:number):number[]{
  const{x,y}=fromCell(cell,width),out:number[]=[];
  if(y>0)out.push(toCell(x,y-1,width));
  if(x>0)out.push(toCell(x-1,y,width));
  if(x<width-1)out.push(toCell(x+1,y,width));
  if(y<height-1)out.push(toCell(x,y+1,width));
  return out;
}

export function shortestPath(floor:GeneratedFloor,start:number,goals:ReadonlySet<number>,blocked:ReadonlySet<number>=new Set(),maxExpansions=4096):PathResult{
  if(goals.has(start))return{path:[start],expansions:0,reached:true};
  const walls=new Set(floor.walls),queue=[start],seen=new Set<number>(queue),parent=new Map<number,number>();
  let expansions=0,found:number|undefined;
  for(let cursor=0;cursor<queue.length&&expansions<maxExpansions;cursor++){
    const cell=queue[cursor];expansions++;
    for(const next of orthogonalNeighbors(cell,floor.width,floor.height)){
      if(walls.has(next)||blocked.has(next)||seen.has(next))continue;
      seen.add(next);parent.set(next,cell);
      if(goals.has(next)){found=next;cursor=queue.length;break}
      queue.push(next);
    }
  }
  if(found===undefined)return{path:[],expansions,reached:false};
  const path=[found];let cursor=found;
  while(cursor!==start){const previous=parent.get(cursor);if(previous===undefined)return{path:[],expansions,reached:false};path.push(previous);cursor=previous}
  path.reverse();return{path,expansions,reached:true};
}

export function manhattan(a:number,b:number,width:number):number{
  const aa=fromCell(a,width),bb=fromCell(b,width);return Math.abs(aa.x-bb.x)+Math.abs(aa.y-bb.y);
}
