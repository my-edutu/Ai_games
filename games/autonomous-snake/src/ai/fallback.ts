import type {Direction, SnakeAction} from '../../../../packages/game-contracts/src/index';
import {DIRECTIONS, isLegalAction} from '../rules/step';
import type {SnakeState} from '../state/types';

function nextIndex(s: SnakeState, d: Direction): number {
  const head=s.snake.body[0],w=s.config.width,x=head%w,y=Math.floor(head/w);
  if(d==='up')return(y-1)*w+x;
  if(d==='down')return(y+1)*w+x;
  if(d==='left')return y*w+x-1;
  return y*w+x+1;
}

/**
 * Exact historic open-space fallback scoring using a decision-local bounded
 * FIFO and epoch visitation. No shift() per explored tile; no Set or nested
 * adjacency arrays per tile; each move sees the same blocked body (excluding
 * today's tail) and unchanged up/right/down/left neighbor order.
 *
 * Deliberately preserve historic scoring's lack of obstacle/hazard treatment:
 * altering that policy under a 'performance' change would change seeded games.
 * The actual authoritative isLegalAction is still checked first and controls
 * hazard, portal, collision, reversal and food legality.
 */
function reachable(s: SnakeState,start:number,blocked:Uint8Array,
  seen:Uint16Array,queue:Int32Array,epoch:number):number {
  const w=s.config.width,h=s.config.height;
  let read=0,written=1;
  queue[0]=start;seen[start]=epoch;
  while(read<written){
    const at=queue[read++],x=at%w,y=Math.floor(at/w);
    for(let direction=0;direction<4;direction++){
      const n=direction===0?(y>0?at-w:-1)
        :direction===1?(x+1<w?at+1:-1)
        :direction===2?(y+1<h?at+w:-1)
        :(x>0?at-1:-1);
      if(n<0||blocked[n]||seen[n]===epoch)continue;
      seen[n]=epoch;queue[written++]=n;
    }
  }
  return written;
}

export function chooseFallbackAction(s:SnakeState):SnakeAction|null{
  const legal=DIRECTIONS.filter(d=>isLegalAction(s,{direction:d}));
  if(!legal.length)return null;
  const cells=s.config.width*s.config.height;
  const blocked=new Uint8Array(cells),seen=new Uint16Array(cells),queue=new Int32Array(cells);
  for(let i=0;i<s.snake.body.length-1;i++)blocked[s.snake.body[i]]=1;
  let best=legal[0],bestScore=-1e9,epoch=0;
  for(const d of legal){
    const n=nextIndex(s,d);
    const food=n===s.food?100000:0;
    const space=reachable(s,n,blocked,seen,queue,++epoch);
    const score=food+space;
    if(score>bestScore){bestScore=score;best=d;}
  }
  return {direction:best};
}
