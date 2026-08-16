import type { BoardProfile } from '../../../../packages/game-contracts/src/index';
import type { SnakeState } from '../state/types';
import type { EffectCandidate,SnakeEffectId } from './types';

function freeCells(state:SnakeState):number[]{
  const blocked=new Set<number>([...state.snake.body,...state.obstacles,...state.hazards]);
  if(state.food!==null) blocked.add(state.food);
  const head=state.snake.body[0],w=state.config.width,h=state.config.height,hx=head%w,hy=Math.floor(head/w);
  const nearHead=new Set<number>();
  for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const x=hx+dx,y=hy+dy;if(x>=0&&y>=0&&x<w&&y<h)nearHead.add(y*w+x)}
  const cells:number[]=[];for(let i=0;i<w*h;i++)if(!blocked.has(i)&&!nearHead.has(i))cells.push(i);return cells;
}
function cells(state:SnakeState,id:SnakeEffectId):EffectCandidate[]{return freeCells(state).slice(0,16).map(cell=>({id:`${id}:cell:${cell}`,effectId:id,cell}));}
export function generateEffectCandidates(state:SnakeState,effectId:SnakeEffectId):EffectCandidate[]{
  if(state.lifecycle!=='running')return[];
  if(effectId==='bonus-food'||effectId==='food-choice'||effectId==='obstacle-choice')return cells(state,effectId);
  if(effectId==='safe-hint')return[{id:'safe-hint:on',effectId,value:1}];
  if(effectId==='shield-token')return state.influence.shieldCharges<1?[{id:'shield-token:one',effectId,value:1}]:[];
  if(effectId==='speed-shift')return[{id:'speed-shift:slow',effectId,value:900},{id:'speed-shift:fast',effectId,value:1100}];
  if(effectId==='fog-field')return[{id:'fog-field:mild',effectId,value:1}];
  if(effectId==='portal-pulse')return Object.keys(state.portalPairs).length?[{id:'portal-pulse:on',effectId,value:1}]:[];
  if(effectId==='theme-vote')return['neon','ember','ocean'].map(value=>({id:`theme-vote:${value}`,effectId,value}));
  if(effectId==='next-challenge')return(['open','corridors','rings','chambers','portals'] as BoardProfile[]).map(value=>({id:`next-challenge:${value}`,effectId,value}));
  return[];
}
