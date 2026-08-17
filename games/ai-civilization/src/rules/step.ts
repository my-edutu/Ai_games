import type{NamedRng}from'../../../../packages/seeded-rng/src/index';import{checksum}from'../../../../packages/replay/src/index';
import type{BuildingType,CivilizationAction,CivilizationEvent,CivilizationResult,CivilizationState,ResourceKey}from'../state/types';import{buildingCost,legalCivilizationActions}from'../ai/policy';
function clone<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T}
function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n))}
const tierThresholds=[['legendary-kingdom',2000],['kingdom',1200],['city',700],['town',350],['village',150],['hamlet',50],['camp',0]] as const;
function tierFor(state:CivilizationState){const scaled=state.config.legendaryRenown;const ratio=scaled/2000;for(const [tier,base]of tierThresholds)if(state.progression.renown>=Math.round(base*ratio))return tier;return'camp'}
function nextThreshold(state:CivilizationState){const order=['camp','hamlet','village','town','city','kingdom','legendary-kingdom'] as const;const i=order.indexOf(state.progression.tier);if(i>=order.length-1)return state.config.legendaryRenown;const base=[0,50,150,350,700,1200,2000][i+1];return Math.round(base*(state.config.legendaryRenown/2000))}
function addResource(state:CivilizationState,key:ResourceKey,amount:number){state.resources[key]=clamp(state.resources[key]+amount,0,state.config.storageCap)}
function buildingCount(state:CivilizationState,type?:BuildingType){return state.world.tiles.filter(t=>t.building&&(!type||t.building.type===type)).length}
function emit(events:CivilizationEvent[],state:CivilizationState,type:string,data?:Record<string,unknown>){events.push({seq:events.length,tick:state.tick,type,data})}
function terminal(state:CivilizationState,events:CivilizationEvent[],reason:CivilizationResult['reason'],kind:CivilizationResult['kind']='game'){
  if(state.result)return;state.lifecycle='result';const result:CivilizationResult={kind,reason,tick:state.tick,tier:state.progression.tier,renown:state.progression.renown,population:state.population.total};state.result=result;state.intermissionRemaining=state.config.intermissionDays;result.finalChecksum=checksum({...state,result:{...result,finalChecksum:undefined}});emit(events,state,'result',{reason,kind});
}
function resolveAction(state:CivilizationState,action:CivilizationAction,events:CivilizationEvent[]){
  if(action.type==='build'){
    const cost=buildingCost(action.building);addResource(state,'wood',-cost.wood);addResource(state,'stone',-cost.stone);addResource(state,'gold',-cost.gold);
    const tile=state.world.tiles[action.tileIndex];tile.owner='player';tile.building={id:`building-${action.building}-${state.tick}-${action.tileIndex}`,type:action.building,level:1,builtAtTick:state.tick};
    const renown={farm:6,lumberyard:5,quarry:5,house:8,granary:12}[action.building];state.progression.renown+=renown;state.progression.lastMeaningfulTick=state.tick;emit(events,state,'construction-complete',{building:action.building,tileIndex:action.tileIndex,renown});
  }else if(action.type==='enact-policy'){state.policies.rationingDays=20;state.progression.renown+=1;emit(events,state,'policy-enacted',{policy:action.policy})}
  else if(action.type==='trade'){addResource(state,'gold',-4);addResource(state,'food',28);state.progression.renown+=1;emit(events,state,'trade-complete',{resource:'food',amount:28})}
  else if(action.type==='research'){addResource(state,'gold',-2);addResource(state,'knowledge',3);state.progression.renown+=1;emit(events,state,'research-complete',{knowledge:3})}
  else if(action.type==='defend'){state.defence=clamp(state.defence+1,0,100);addResource(state,'wood',-Math.min(1,state.resources.wood));emit(events,state,'defence-readied',{defence:state.defence})}
  else if(action.type==='great-work'){state.progression.greatWorkProgress=clamp(state.progression.greatWorkProgress+1,0,100);emit(events,state,'great-work-progress',{progress:state.progression.greatWorkProgress})}
  else emit(events,state,'reserve-maintained');
}
function economy(state:CivilizationState,events:CivilizationEvent[]){
  const farms=buildingCount(state,'farm'),yards=buildingCount(state,'lumberyard'),quarries=buildingCount(state,'quarry'),granaries=buildingCount(state,'granary');
  addResource(state,'food',3+farms*6+granaries);addResource(state,'wood',1+yards*4);addResource(state,'stone',quarries*3);addResource(state,'gold',Math.floor(state.population.workers/18));
  const baseFood=Math.max(1,Math.ceil(state.population.total/6)),consumption=state.policies.rationingDays>0?Math.max(1,Math.ceil(baseFood*0.75)):baseFood;
  const eaten=Math.min(consumption,state.resources.food);addResource(state,'food',-eaten);const short=consumption-eaten;
  if(short>0){state.population.starvationDays++;state.population.health=clamp(state.population.health-2-short,0,100);state.population.morale=clamp(state.population.morale-2,0,100);state.stability=clamp(state.stability-2,0,100);if(state.population.starvationDays%5===0&&state.population.total>0){state.population.total--;emit(events,state,'population-loss',{cause:'starvation',population:state.population.total})}emit(events,state,'food-shortage',{shortfall:short})}
  else{state.population.starvationDays=0;state.population.health=clamp(state.population.health+1,0,100);if(state.resources.food>baseFood*15)state.population.morale=clamp(state.population.morale+1,0,100)}
  if(state.policies.rationingDays>0)state.policies.rationingDays--;
  if(state.tick%state.config.seasonDays===0&&state.population.total<Math.min(state.population.housing,state.config.populationCap)&&state.population.health>=70&&state.resources.food>=baseFood*8){state.population.total++;emit(events,state,'population-growth',{population:state.population.total})}
  state.population.children=Math.floor(state.population.total*0.2);state.population.elders=Math.floor(state.population.total*0.1);state.population.workers=state.population.total-state.population.children-state.population.elders;
  state.population.housing=24+buildingCount(state,'house')*12;state.stability=clamp(state.stability+(state.population.morale>=70?1:0)-(state.population.total>state.population.housing?2:0),0,100);
}
export interface StepOutput{state:CivilizationState;events:CivilizationEvent[]}
export function applyCivilizationAction(input:CivilizationState,action:CivilizationAction,_rng:NamedRng):StepOutput{const state=clone(input),events:CivilizationEvent[]=[];if(state.lifecycle!=='running')return{state,events};
  const legal=legalCivilizationActions(state);if(!legal.some(a=>a.key===action.key))throw new RangeError('illegal-action');
  state.tick++;state.day=((state.tick)%state.config.yearDays)+1;state.season=Math.floor(((state.tick)%state.config.yearDays)/state.config.seasonDays);state.year=Math.floor(state.tick/state.config.yearDays)+1;
  emit(events,state,'day-start',{day:state.day,season:state.season,year:state.year});resolveAction(state,action,events);economy(state,events);
  const previous=state.progression.tier;state.progression.tier=tierFor(state);state.progression.nextTierRenown=nextThreshold(state);if(previous!==state.progression.tier){state.progression.lastMeaningfulTick=state.tick;emit(events,state,'tier-advanced',{from:previous,to:state.progression.tier})}
  if(state.stability===0){state.progression.zeroStabilitySince??=state.tick}else state.progression.zeroStabilitySince=null;
  if(state.progression.tier==='legendary-kingdom'&&state.stability>=state.config.legendaryStability)terminal(state,events,'legendary-victory');
  else if(state.population.total<=0)terminal(state,events,'population-collapse');
  else if(state.progression.zeroStabilitySince!==null&&state.tick-state.progression.zeroStabilitySince>=state.config.collapseWindowDays)terminal(state,events,'state-collapse');
  else if(state.tick>=state.config.maxRunDays)terminal(state,events,'era-timeout');
  assertCivilizationInvariants(state);return{state,events};
}
export function assertCivilizationInvariants(state:CivilizationState){
  if(state.schemaVersion!==1)throw new Error('schemaVersion');if(!Number.isInteger(state.tick)||state.tick<0)throw new Error('tick');
  if(state.world.tiles.length!==state.config.width*state.config.height)throw new Error('world-size');const ids=new Set<string>();
  for(const tile of state.world.tiles){if(tile.index<0||tile.index>=state.world.tiles.length)throw new Error('tile-index');if(tile.building){if(ids.has(tile.building.id))throw new Error('duplicate-building');ids.add(tile.building.id)}}
  for(const [k,v]of Object.entries(state.resources))if(!Number.isInteger(v)||v<0||v>state.config.storageCap)throw new Error(`resource:${k}`);
  if(!Number.isInteger(state.population.total)||state.population.total<0||state.population.total>state.config.populationCap)throw new Error('population');
  if(state.population.children+state.population.workers+state.population.elders!==state.population.total)throw new Error('population-cohorts');
  if(state.stability<0||state.stability>100||state.defence<0||state.defence>100)throw new Error('bounded-stat');
  if(state.chronicle.highlights.length>24||state.chronicle.reigns.length>12)throw new Error('chronicle-bound');if(state.influence.queued.length>64||state.influence.appliedIds.length>256)throw new Error('influence-bound');
  if(state.lifecycle==='result'&&!state.result)throw new Error('result-missing');if(state.result&&state.lifecycle==='running')throw new Error('result-lifecycle');
}
