import type{FloorsAction}from '../../../../packages/game-contracts/src/index';
import{actionKey,listLegalActions}from'../rules/step';
import{manhattan,shortestPath}from'./pathing';
import{chooseFallbackAction}from'./fallback';
import type{FloorsDecision,FloorsState}from'../state/types';

type TargetedMove=FloorsAction&{kind:'move';targetCell:number};
function isTargetedMove(action:FloorsAction):action is TargetedMove{return action.kind==='move'&&typeof action.targetCell==='number'}
function moduleStacks(state:FloorsState,id:string):number{return state.player.modules.filter(module=>module===id).length}
export function productionPlannerBudget(state:FloorsState):number{return Math.min(state.config.maxPlannerExpansions,256+moduleStacks(state,'route-cache')*64)}
function threat(state:FloorsState,cell:number):number{
  let score=0;
  for(const enemy of state.floor.enemies){const d=manhattan(enemy.cell,cell,state.floor.width);if(d===1)score+=6+enemy.attack;else if(d===2)score+=2}
  for(const hazard of state.floor.hazards)if(hazard.cell===cell)score+=state.player.modules.includes('hazard-lens')?6:4;
  return score;
}

function nearestTarget(state:FloorsState):number{
  if((state.floor.objective==='defeat-warden'||state.floor.objective==='defeat-architect')&&state.floor.enemies.length){
    const first=[...state.floor.enemies].sort((a,b)=>manhattan(state.player.cell,a.cell,state.floor.width)-manhattan(state.player.cell,b.cell,state.floor.width)||a.id.localeCompare(b.id))[0];
    if(first)return first.cell;
  }
  return state.floor.exit;
}

export function chooseProductionAction(state:FloorsState):FloorsDecision{
  const legal=listLegalActions(state);
  if(!legal.length)return chooseFallbackAction(state);
  const attack=legal.filter(a=>a.kind==='attack').sort((a,b)=>actionKey(a).localeCompare(actionKey(b)))[0];
  if(attack)return{action:attack,mode:'tactical',confidence:'high',intent:'Breaking the nearest blocking threat.',reason:'adjacent-hostile',expansions:0};
  if(state.player.health<=Math.ceil(state.player.maxHealth*.3)){
    const guard=legal.find(a=>a.kind==='guard');if(guard)return{action:guard,mode:'recovery',confidence:'medium',intent:'Stabilizing before the next advance.',reason:'critical-health',expansions:0};
  }
  const target=nearestTarget(state),blocked=new Set(state.floor.enemies.map(e=>e.cell));
  if(target!==state.floor.exit)blocked.delete(target);
  const route=shortestPath(state.floor,state.player.cell,new Set([target]),blocked,productionPlannerBudget(state));
  const next=route.path[1];
  if(route.reached&&next!==undefined){const move=legal.find(a=>isTargetedMove(a)&&a.targetCell===next);if(move&&threat(state,next)<=7)return{action:move,mode:'tactical',confidence:threat(state,next)<=2?'high':'medium',intent:target===state.floor.exit?'Advancing toward the verified exit.':'Closing on the sector guardian.',reason:'threat-aware-route',expansions:route.expansions}}
  const rewardMoves=legal.filter(isTargetedMove).filter(a=>state.floor.rewardCells.includes(a.targetCell)).sort((a,b)=>threat(state,a.targetCell)-threat(state,b.targetCell)||actionKey(a).localeCompare(actionKey(b)));
  const reward=rewardMoves[0];
  if(reward&&threat(state,reward.targetCell)<=3)return{action:reward,mode:'tactical',confidence:'medium',intent:'Taking a low-risk upgrade opportunity.',reason:'safe-reward',expansions:route.expansions};
  const safeMoves=legal.filter(isTargetedMove).sort((a,b)=>threat(state,a.targetCell)-threat(state,b.targetCell)||manhattan(a.targetCell,target,state.floor.width)-manhattan(b.targetCell,target,state.floor.width)||actionKey(a).localeCompare(actionKey(b)));
  const safe=safeMoves[0];
  if(safe)return{action:safe,mode:'tactical',confidence:'medium',intent:'Repositioning to reduce incoming pressure.',reason:'lowest-threat-move',expansions:route.expansions};
  const fallback=chooseFallbackAction(state);return{...fallback,reason:`production-fallback:${fallback.reason}`};
}
