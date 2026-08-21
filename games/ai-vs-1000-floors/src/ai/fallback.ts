import type{FloorsAction}from '../../../../packages/game-contracts/src/index';
import{manhattan,shortestPath}from './pathing';
import{actionKey,listLegalActions}from '../rules/step';
import type{FloorsDecision,FloorsState}from '../state/types';

function dangerAt(state:FloorsState,cell:number):number{
  let danger=0;
  for(const enemy of state.floor.enemies){const distance=manhattan(enemy.cell,cell,state.floor.width);if(distance===1)danger+=4;else if(distance===2)danger+=1}
  for(const hazard of state.floor.hazards)if(hazard.cell===cell)danger+=3;
  return danger;
}

export function chooseFallbackAction(state:FloorsState):FloorsDecision{
  const legal=listLegalActions(state);
  if(legal.length===0)return{action:{kind:'wait'},mode:'fallback',confidence:'low',intent:'No legal tactical action.',reason:'no-legal-action',expansions:0};
  const attack=legal.find(action=>action.kind==='attack');
  if(attack)return{action:attack,mode:'fallback',confidence:'high',intent:'Removing an adjacent threat.',reason:'adjacent-threat',expansions:0};
  const blocked=new Set(state.floor.enemies.map(enemy=>enemy.cell));
  const path=shortestPath(state.floor,state.player.cell,new Set([state.floor.exit]),blocked,state.config.maxPlannerExpansions);
  if(path.reached&&path.path.length>1){const next=path.path[1],move=legal.find(action=>action.kind==='move'&&action.targetCell===next);if(move)return{action:move,mode:'fallback',confidence:'high',intent:'Following the verified exit route.',reason:'reachable-exit',expansions:path.expansions}}
  const moves=legal.filter(action=>action.kind==='move'&&action.targetCell!==undefined).sort((a,b)=>{
    const ac=a.targetCell as number,bc=b.targetCell as number;
    const scoreA=dangerAt(state,ac)*100+manhattan(ac,state.floor.exit,state.floor.width),scoreB=dangerAt(state,bc)*100+manhattan(bc,state.floor.exit,state.floor.width);
    return scoreA-scoreB||actionKey(a).localeCompare(actionKey(b));
  });
  const action:FloorsAction=moves[0]??legal.find(candidate=>candidate.kind==='guard')??legal[0];
  return{action,mode:'fallback',confidence:moves.length?'medium':'low',intent:moves.length?'Seeking a lower-risk route.':'Holding position safely.',reason:moves.length?'lowest-danger-legal-move':'guard-or-wait',expansions:path.expansions};
}
