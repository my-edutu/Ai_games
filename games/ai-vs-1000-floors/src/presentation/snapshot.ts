import type{FloorsEvent,FloorsState,FloorArchetype,EnemyKind,HazardKind}from'../state/types';
import{hazardDefinition,sectorForFloor}from'../content/catalogue';

export interface FloorsRenderHazardState{telegraph:string;period:number;ticksUntilActive:number;activeNextStep:boolean}
export interface FloorsRenderCell{index:number;wall:boolean;exit:boolean;reward:boolean;hazard:HazardKind|null;hazardState:FloorsRenderHazardState|null}
export interface FloorsRenderEnemy{id:string;kind:EnemyKind;cell:number;healthPermille:number;telegraph:string}
export interface FloorsRenderEvent{seq:number;type:string;message:string}
export interface FloorsRenderSectorIdentity{index:number;id:string;name:string;tone:string}
export interface FloorsRenderSnapshot{
  gameId:'ai-vs-1000-floors';tick:number;lifecycle:string;floor:number;sector:number;sectorIdentity:FloorsRenderSectorIdentity;archetype:FloorArchetype;objective:string;objectiveComplete:boolean;
  width:number;height:number;player:{cell:number;health:number;maxHealth:number;energy:number;maxEnergy:number;shield:number;credits:number;modules:string[];guarding:boolean};
  ai:{goal:string;intent:string;obstacle:string|null;confidence:'low'|'medium'|'high';reason:string};
  cells:FloorsRenderCell[];enemies:FloorsRenderEnemy[];progressPermille:number;highestFloor:number;floorsCleared:number;score:number;danger:'stable'|'guarded'|'high'|'critical';events:FloorsRenderEvent[];
}

const eventCopy:Record<string,string>={
  'floor-started':'Entering a new floor','floor-cleared':'Route secured — floor cleared','player-moved':'Astra advances through the structure','player-attacked':'Astra commits to an attack','player-guarded':'Astra braces for impact','player-waited':'Astra holds position for a safer window','player-damaged':'Astra takes damage','hazard-hit':'A hazard connects with Astra','enemy-damaged':'A hostile takes damage','enemy-defeated':'Hostile neutralised','reward-collected':'Upgrade resource collected','module-installed':'Astra integrates a new module','objective-completed':'Floor objective completed','result':'Run resolved','intermission-started':'Preparing the next ascent','runtime-restarted':'New ascent started'
};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

function renderHazardState(floorTicks:number,hazard:{kind:HazardKind;period:number;phase:number}):FloorsRenderHazardState{
  const period=Math.max(1,hazard.period);
  const remainder=((floorTicks+hazard.phase)%period+period)%period;
  const ticksUntilActive=remainder===0?period:period-remainder;
  return{telegraph:hazardDefinition(hazard.kind).telegraph,period,ticksUntilActive,activeNextStep:ticksUntilActive===1};
}

export function createFloorsRenderSnapshot(state:FloorsState,recentEvents:FloorsEvent[]):FloorsRenderSnapshot{
  const wallSet=new Set(state.floor.walls),rewardSet=new Set(state.floor.rewardCells),hazards=new Map(state.floor.hazards.map(h=>[h.cell,h] as const));
  const total=state.floor.width*state.floor.height;
  const sector=sectorForFloor(state.floor.number);
  const healthRatio=state.player.health/Math.max(1,state.player.maxHealth);
  const danger:FloorsRenderSnapshot['danger']=healthRatio<=.2?'critical':healthRatio<=.4?'high':state.floor.enemies.some(e=>e.telegraph==='attack'||e.telegraph==='charge')?'guarded':'stable';
  return{
    gameId:'ai-vs-1000-floors',tick:state.tick,lifecycle:state.lifecycle,floor:state.floor.number,sector:state.floor.sector,sectorIdentity:{index:state.floor.sector,id:sector.id,name:sector.name,tone:sector.tone},archetype:state.floor.archetype,
    objective:state.floor.objective,objectiveComplete:state.floor.objectiveComplete,width:state.floor.width,height:state.floor.height,
    player:{cell:state.player.cell,health:state.player.health,maxHealth:state.player.maxHealth,energy:state.player.energy,maxEnergy:state.player.maxEnergy,shield:state.player.shield,credits:state.player.credits,modules:state.player.modules.slice(0,8),guarding:state.player.guarding},
    ai:{goal:state.ai.goal,intent:state.ai.intent,obstacle:state.ai.obstacle,confidence:state.ai.confidence,reason:state.ai.lastPlanChangeReason},
    cells:Array.from({length:total},(_,index)=>{const hazard=hazards.get(index);return{index,wall:wallSet.has(index),exit:index===state.floor.exit,reward:rewardSet.has(index),hazard:hazard?.kind??null,hazardState:hazard?renderHazardState(state.floor.ticks,hazard):null}}),
    enemies:state.floor.enemies.slice(0,24).map(enemy=>({id:enemy.id,kind:enemy.kind,cell:enemy.cell,healthPermille:Math.round(clamp(enemy.health/Math.max(1,enemy.maxHealth),0,1)*1000),telegraph:enemy.telegraph})),
    progressPermille:Math.round(clamp((state.floor.number-1)/999,0,1)*1000),highestFloor:state.highestFloor,floorsCleared:state.floorsCleared,score:state.score,danger,
    events:recentEvents.slice(-8).map(event=>({seq:event.seq,type:event.type,message:eventCopy[event.type]??'The tower state changed'}))
  };
}
