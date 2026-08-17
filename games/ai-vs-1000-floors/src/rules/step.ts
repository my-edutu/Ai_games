import type{Direction,FloorsAction,FloorsRunResult}from '../../../../packages/game-contracts/src/index';
import{checksum}from '../../../../packages/replay/src/index';
import type{NamedRng}from '../../../../packages/seeded-rng/src/index';
import{generateFloor}from '../generation/floor';
import{manhattan,orthogonalNeighbors,shortestPath}from '../ai/pathing';
import type{FloorEnemy,FloorsEvent,FloorsState}from '../state/types';

export interface FloorsStepResult{accepted:boolean;reason:'accepted'|'illegal-action'|'not-running';state:FloorsState;events:Omit<FloorsEvent,'seq'>[]}

function clone<T>(value:T):T{return structuredClone(value)}
function directionBetween(from:number,to:number,width:number):Direction|undefined{
  if(to===from-width)return'up';if(to===from+width)return'down';if(to===from-1)return'left';if(to===from+1)return'right';return undefined;
}

export function actionKey(action:FloorsAction):string{return`${action.kind}:${action.targetCell??''}:${action.direction??''}:${action.abilityId??''}`}

export function listLegalActions(state:FloorsState):FloorsAction[]{
  if(state.lifecycle!=='running')return[];
  const walls=new Set(state.floor.walls),enemies=new Map(state.floor.enemies.map(enemy=>[enemy.cell,enemy]));
  const actions:FloorsAction[]=[];
  for(const cell of orthogonalNeighbors(state.player.cell,state.floor.width,state.floor.height)){
    const direction=directionBetween(state.player.cell,cell,state.floor.width);
    if(enemies.has(cell))actions.push({kind:'attack',targetCell:cell,direction});
    else if(!walls.has(cell))actions.push({kind:'move',targetCell:cell,direction});
  }
  actions.push({kind:'guard'},{kind:'wait'});
  return actions.sort((a,b)=>actionKey(a).localeCompare(actionKey(b)));
}

function event(state:FloorsState,type:string,data?:Record<string,unknown>):Omit<FloorsEvent,'seq'>{return{tick:state.tick,type,data}}
function updateMeaningful(state:FloorsState):void{state.meaningfulEventTick=state.tick}

function authoritativeChecksum(state:FloorsState):string{
  const material=clone(state) as FloorsState;
  if(material.result){const result={...material.result} as FloorsRunResult;delete result.finalChecksum;material.result=result}
  return checksum(material);
}

function finish(state:FloorsState,reason:FloorsRunResult['reason'],events:Omit<FloorsEvent,'seq'>[]):void{
  state.lifecycle='result';
  state.result={kind:reason==='integrity-quarantine'?'technical':'game',reason,tick:state.tick,highestFloor:state.highestFloor,score:state.score};
  state.result.finalChecksum=authoritativeChecksum(state);
  updateMeaningful(state);
  events.push(event(state,'run-result',{reason,highestFloor:state.highestFloor,score:state.score,kind:state.result.kind}));
}

function applyDamage(state:FloorsState,rawDamage:number):number{
  let damage=Math.max(0,rawDamage-(state.player.guarding?1:0)-state.player.armor);
  if(state.player.shield>0&&damage>0){const absorbed=Math.min(state.player.shield,damage);state.player.shield-=absorbed;damage-=absorbed}
  state.player.health=Math.max(0,state.player.health-damage);return damage;
}

function moveEnemy(enemy:FloorEnemy,state:FloorsState,occupied:Set<number>):void{
  if(manhattan(enemy.cell,state.player.cell,state.floor.width)===1)return;
  const blocked=new Set<number>(occupied);blocked.delete(enemy.cell);
  const result=shortestPath(state.floor,enemy.cell,new Set([state.player.cell]),blocked,128);
  const next=result.path[1];
  if(next!==undefined&&next!==state.player.cell&&!occupied.has(next)){occupied.delete(enemy.cell);enemy.cell=next;occupied.add(next);enemy.telegraph='pursue'}
}

export function applyFloorsAction(source:FloorsState,action:FloorsAction,rng:NamedRng):FloorsStepResult{
  if(source.lifecycle!=='running')return{accepted:false,reason:'not-running',state:source,events:[]};
  const legal=listLegalActions(source),selected=legal.find(candidate=>actionKey(candidate)===actionKey(action));
  if(!selected)return{accepted:false,reason:'illegal-action',state:source,events:[]};
  const state=clone(source),events:Omit<FloorsEvent,'seq'>[]=[];
  state.tick++;state.floor.ticks++;state.player.guarding=false;
  if(selected.kind==='move'&&selected.targetCell!==undefined){
    const from=state.player.cell;state.player.cell=selected.targetCell;state.ai.intent='Advancing along the safest known route.';
    updateMeaningful(state);events.push(event(state,'player-moved',{from,to:state.player.cell}));
  }else if(selected.kind==='attack'&&selected.targetCell!==undefined){
    const enemy=state.floor.enemies.find(candidate=>candidate.cell===selected.targetCell);
    if(enemy){const damage=Math.max(1,state.player.attack-enemy.armor);enemy.health=Math.max(0,enemy.health-damage);events.push(event(state,'player-attacked',{enemyId:enemy.id,damage}));
      if(enemy.health===0){state.floor.enemies=state.floor.enemies.filter(candidate=>candidate.id!==enemy.id);state.score+=20;state.player.credits=Math.min(99,state.player.credits+1);updateMeaningful(state);events.push(event(state,'enemy-defeated',{enemyId:enemy.id,kind:enemy.kind}))}
    }
  }else if(selected.kind==='guard'){state.player.guarding=true;state.player.energy=Math.min(state.player.maxEnergy,state.player.energy+1);events.push(event(state,'player-guarded'))}
  else if(selected.kind==='wait'){state.player.energy=Math.min(state.player.maxEnergy,state.player.energy+1);events.push(event(state,'player-waited'))}

  const rewardIndex=state.floor.rewardCells.indexOf(state.player.cell);
  if(rewardIndex>=0){state.floor.rewardCells.splice(rewardIndex,1);state.player.credits=Math.min(99,state.player.credits+2);state.player.health=Math.min(state.player.maxHealth,state.player.health+1);state.score+=10;updateMeaningful(state);events.push(event(state,'reward-collected',{cell:state.player.cell}))}

  const occupied=new Set(state.floor.enemies.map(enemy=>enemy.cell));
  for(const enemy of [...state.floor.enemies].sort((a,b)=>a.id.localeCompare(b.id))){
    if(manhattan(enemy.cell,state.player.cell,state.floor.width)===1){enemy.telegraph='attack';const damage=applyDamage(state,enemy.attack);events.push(event(state,'enemy-attacked',{enemyId:enemy.id,damage}))}
    else moveEnemy(enemy,state,occupied);
  }
  for(const hazard of state.floor.hazards){if(hazard.cell===state.player.cell&&(state.floor.ticks+hazard.phase)%hazard.period===0){const damage=applyDamage(state,hazard.damage);events.push(event(state,'hazard-hit',{hazardId:hazard.id,damage}))}}

  if(state.player.health<=0){finish(state,'player-defeated',events);return{accepted:true,reason:'accepted',state,events}}

  if(state.player.cell===state.floor.exit){
    const completed=state.floor.number;state.floor.objectiveComplete=true;state.floorsCleared++;state.highestFloor=Math.max(state.highestFloor,completed);state.score+=100+completed;updateMeaningful(state);events.push(event(state,'floor-cleared',{floor:completed,sector:state.floor.sector}));
    if(completed>=state.config.totalFloors){finish(state,'victory',events);return{accepted:true,reason:'accepted',state,events}}
    const nextFloor=generateFloor(state.config,completed+1,rng);state.floor=nextFloor;state.player.cell=nextFloor.start;state.player.health=Math.min(state.player.maxHealth,state.player.health+1);state.player.energy=state.player.maxEnergy;state.floorStartedTick=state.tick;state.highestFloor=Math.max(state.highestFloor,nextFloor.number);state.ai.plan=[];state.ai.lastPlanChangeReason='floor-transition';events.push(event(state,'floor-started',{floor:nextFloor.number,sector:nextFloor.sector,archetype:nextFloor.archetype}));
  }

  if(state.lifecycle==='running'&&state.floor.ticks>=state.config.maxTicksPerFloor)finish(state,'floor-timeout',events);
  else if(state.lifecycle==='running'&&state.tick-state.meaningfulEventTick>=state.config.noProgressTicks)finish(state,'stagnation',events);
  return{accepted:true,reason:'accepted',state,events};
}
