import type{NamedRng}from'../../../../packages/seeded-rng/src/index';
import{checksum}from'../../../../packages/replay/src/index';
import{
  buildingCatalogue,greatWorkCatalogue,buildingCost,legalCivilizationActions,
  nextTierRenown,tierForRenown,traitUtilityModifier
}from'../ai/policy';
import{createSuccessorHeir}from'../characters/cast';
import type{
  BuildingType,CivilizationAction,CivilizationCrisis,CivilizationEvent,CivilizationResult,
  CivilizationState,EconomyLedger,ResourceKey,Resources,RivalRelation
}from'../state/types';

function clone<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T}
function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n))}
function emptyResources():Resources{return{food:0,wood:0,stone:0,gold:0,knowledge:0,influence:0}}
function addResource(state:CivilizationState,key:ResourceKey,amount:number){
  state.resources[key]=clamp(Math.round(state.resources[key]+amount),0,state.config.storageCap);
}
function buildingCount(state:CivilizationState,type?:BuildingType){
  return state.world.tiles.filter(t=>t.building&&(!type||t.building.type===type)).length;
}
function emit(events:CivilizationEvent[],state:CivilizationState,type:string,data?:Record<string,unknown>){
  events.push({seq:events.length,tick:state.tick,type,data});
}
function terminal(state:CivilizationState,events:CivilizationEvent[],reason:CivilizationResult['reason'],kind:CivilizationResult['kind']='game'){
  if(state.result)return;
  state.lifecycle='result';
  const result:CivilizationResult={kind,reason,tick:state.tick,tier:state.progression.tier,renown:state.progression.renown,population:state.population.total};
  state.result=result;state.intermissionRemaining=state.config.intermissionDays;
  result.finalChecksum=checksum({...state,result:{...result,finalChecksum:undefined}});
  emit(events,state,'result',{reason,kind});
}
function subtractCost(state:CivilizationState,cost:Partial<Resources>,bucket?:Resources){
  for(const [key,value]of Object.entries(cost)as[ResourceKey,number][]){
    addResource(state,key,-value);
    if(bucket)bucket[key]+=value;
  }
}
function constructionRenown(state:CivilizationState,type:Exclude<BuildingType,'camp'>){
  const count=state.economy.actionRenownCounts[type]??0;
  const base=buildingCatalogue[type].renown;
  const gain=Math.max(1,Math.ceil(base/(1+count*0.5)));
  state.economy.actionRenownCounts[type]=count+1;
  return gain;
}
function resolveAction(state:CivilizationState,action:CivilizationAction,events:CivilizationEvent[],ledger:EconomyLedger){
  if(action.type==='build'){
    const def=buildingCatalogue[action.building];
    subtractCost(state,buildingCost(action.building),ledger.consumed);
    const tile=state.world.tiles[action.tileIndex];
    tile.owner='player';
    tile.building={id:`building-${action.building}-${state.tick}-${action.tileIndex}`,type:action.building,level:1,builtAtTick:state.tick};
    const renown=constructionRenown(state,action.building);
    state.progression.renown+=renown;state.progression.lastMeaningfulTick=state.tick;
    emit(events,state,'construction-complete',{building:action.building,tileIndex:action.tileIndex,renown,workers:def.workers});
  }else if(action.type==='enact-policy'){
    state.policies.rationingDays=20;state.progression.renown+=1;emit(events,state,'policy-enacted',{policy:action.policy});
  }else if(action.type==='trade'){
    addResource(state,'gold',-4);ledger.trade.gold+=4;addResource(state,'food',28);ledger.trade.food+=28;
    state.progression.renown+=1;emit(events,state,'trade-complete',{resource:'food',amount:28});
  }else if(action.type==='research'){
    addResource(state,'gold',-2);ledger.consumed.gold+=2;addResource(state,'knowledge',3);ledger.produced.knowledge+=3;
    state.progression.renown+=1;emit(events,state,'research-complete',{knowledge:3});
  }else if(action.type==='defend'){
    state.defence=clamp(state.defence+1,0,100);const cost=Math.min(1,state.resources.wood);
    addResource(state,'wood',-cost);ledger.upkeep.wood+=cost;emit(events,state,'defence-readied',{defence:state.defence});
  }else if(action.type==='select-great-work'){
    state.progression.greatWorkId=action.greatWorkId;state.progression.greatWorkProgress=0;
    state.progression.lastMeaningfulTick=state.tick;
    emit(events,state,'great-work-selected',{greatWorkId:action.greatWorkId});
  }else if(action.type==='great-work'){
    const id=state.progression.greatWorkId;
    if(!id)throw new Error('great-work-missing');
    const def=greatWorkCatalogue[id];
    subtractCost(state,def.cost,ledger.consumed);
    state.progression.greatWorkProgress=clamp(state.progression.greatWorkProgress+def.progress,0,100);
    emit(events,state,'great-work-progress',{greatWorkId:id,progress:state.progression.greatWorkProgress});
    if(state.progression.greatWorkProgress>=100){
      state.progression.completedGreatWorks.push(id);
      state.progression.renown+=def.renown;
      if(def.benefit==='defence')state.defence=clamp(state.defence+18,0,100);
      if(def.benefit==='stability')state.stability=clamp(state.stability+18,0,100);
      if(def.benefit==='knowledge')addResource(state,'knowledge',60);
      state.progression.greatWorkId=null;state.progression.greatWorkProgress=0;state.progression.lastMeaningfulTick=state.tick;
      emit(events,state,'great-work-complete',{greatWorkId:id,benefit:def.benefit,renown:def.renown});
    }
  }else if(action.type==='crisis-response'){
    if(!state.crisis)return;
    const reduction=action.response==='relief'?3:action.response==='fortify'&&state.crisis.conflictGroup==='war'?4:2;
    if(action.response==='relief'){const gold=Math.min(3,state.resources.gold);addResource(state,'gold',-gold);ledger.consumed.gold+=gold;state.population.health=clamp(state.population.health+2,0,100)}
    if(action.response==='ration')state.policies.rationingDays=Math.max(state.policies.rationingDays,12);
    if(action.response==='fortify'){const wood=Math.min(3,state.resources.wood);addResource(state,'wood',-wood);ledger.consumed.wood+=wood;state.defence=clamp(state.defence+3,0,100)}
    state.crisis.remainingDays=Math.max(0,state.crisis.remainingDays-reduction);
    state.crisis.severity=Math.max(1,state.crisis.severity-1);
    emit(events,state,'crisis-response',{crisisId:state.crisis.id,response:action.response,reduction});
  }else if(action.type==='diplomacy'){
    // The diplomacy state machine applies after the economy step so direct and runtime calls share one path.
  }else{
    emit(events,state,'reserve-maintained');
  }
}
function computeHousing(state:CivilizationState){
  return Math.min(state.config.populationCap,24+buildingCount(state,'house')*12+buildingCount(state,'aqueduct')*8);
}
function economy(state:CivilizationState,events:CivilizationEvent[],ledger:EconomyLedger){
  state.population.births=0;state.population.deaths=0;state.population.migration=0;state.population.lastDelta=0;
  const farms=buildingCount(state,'farm'),yards=buildingCount(state,'lumberyard'),quarries=buildingCount(state,'quarry');
  const granaries=buildingCount(state,'granary'),markets=buildingCount(state,'market'),schools=buildingCount(state,'school');
  const workshops=buildingCount(state,'workshop'),temples=buildingCount(state,'temple'),aqueducts=buildingCount(state,'aqueduct');
  const produced:Partial<Resources>={
    food:3+farms*6+granaries*2,
    wood:1+yards*4+workshops,
    stone:quarries*3+workshops,
    gold:Math.floor(state.population.workers/18)+markets*3,
    knowledge:schools*3+workshops,
    influence:temples
  };
  for(const [key,value]of Object.entries(produced)as[ResourceKey,number][]){addResource(state,key,value);ledger.produced[key]+=value}
  const buildingTotal=state.world.tiles.filter(t=>t.building).length;
  const woodUpkeep=Math.floor(Math.max(0,buildingTotal-1)/5),goldUpkeep=Math.max(0,markets+schools+workshops+temples+aqueducts-2);
  const actualWood=Math.min(woodUpkeep,state.resources.wood),actualGold=Math.min(goldUpkeep,state.resources.gold);
  addResource(state,'wood',-actualWood);addResource(state,'gold',-actualGold);ledger.upkeep.wood+=actualWood;ledger.upkeep.gold+=actualGold;
  const baseFood=Math.max(1,Math.ceil(state.population.total/6));
  const consumption=state.policies.rationingDays>0?Math.max(1,Math.ceil(baseFood*0.75)):baseFood;
  const eaten=Math.min(consumption,state.resources.food);addResource(state,'food',-eaten);ledger.consumed.food+=eaten;
  const short=consumption-eaten;
  if(short>0){
    state.population.starvationDays++;state.population.health=clamp(state.population.health-2-short,0,100);
    state.population.morale=clamp(state.population.morale-2,0,100);state.stability=clamp(state.stability-2,0,100);
    if(state.population.starvationDays%5===0&&state.population.total>0){
      state.population.total--;state.population.deaths++;state.population.lastDelta--;emit(events,state,'population-loss',{cause:'starvation',population:state.population.total});
    }
    emit(events,state,'food-shortage',{shortfall:short});
  }else{
    state.population.starvationDays=0;state.population.health=clamp(state.population.health+1+aqueducts,0,100);
    if(state.resources.food>baseFood*15)state.population.morale=clamp(state.population.morale+1,0,100);
  }
  if(state.policies.rationingDays>0)state.policies.rationingDays--;
  for(const key of ['food','wood']as const){
    const threshold=Math.floor(state.config.storageCap*0.85);
    if(state.resources[key]>threshold){
      const spoiled=Math.max(1,Math.floor((state.resources[key]-threshold)*0.1));
      addResource(state,key,-spoiled);ledger.spoiled[key]+=spoiled;
    }
  }
  state.population.housing=computeHousing(state);
  if(state.tick%state.config.seasonDays===0){
    const room=Math.max(0,Math.min(state.population.housing,state.config.populationCap)-state.population.total);
    const births=state.population.health>=72&&state.resources.food>=baseFood*6?Math.min(room,state.config.birthSeasonCap,2):0;
    const migration=state.population.morale>=68&&(markets+temples)>0?Math.min(Math.max(0,room-births),state.config.migrationSeasonCap,2):0;
    const deaths=state.population.health<35?Math.min(state.population.total,2):0;
    state.population.births=births;state.population.migration=migration;state.population.deaths+=deaths;
    state.population.total=clamp(state.population.total+births+migration-deaths,0,Math.min(state.population.housing,state.config.populationCap));
    state.population.lastDelta+=births+migration-deaths;
    if(state.population.lastDelta!==0)emit(events,state,'population-change',{births,migration,deaths,total:state.population.total});
  }
  state.population.children=Math.floor(state.population.total*0.2);
  state.population.elders=Math.floor(state.population.total*0.1);
  state.population.workers=state.population.total-state.population.children-state.population.elders;
  state.stability=clamp(
    state.stability+(state.population.morale>=70?1:0)+(temples>0?1:0)-(state.population.total>state.population.housing?2:0)-(goldUpkeep>actualGold?1:0),
    0,100
  );
  state.economy.ledger=ledger;
  state.economy.history.push(clone(ledger));
  if(state.economy.history.length>state.config.economyHistoryCap)state.economy.history.splice(0,state.economy.history.length-state.config.economyHistoryCap);
}
function relationBand(state:CivilizationState,relation:RivalRelation){
  const playerPower=state.defence+Math.floor(state.population.workers/2)+Math.floor(state.resources.gold/10);
  if(playerPower>relation.strength+12)return'weaker' as const;
  if(playerPower+12<relation.strength)return'stronger' as const;
  return'matched' as const;
}
export function resolveDiplomacyAndConflict(state:CivilizationState,action:CivilizationAction|undefined,rng:NamedRng){
  const events:CivilizationEvent[]=[];
  if(action?.type==='diplomacy'){
    const relation=state.diplomacy.find(r=>r.id===action.targetId);
    if(relation){
      if(action.mode==='treaty'){
        relation.reputation=clamp(relation.reputation+14,-100,100);relation.tension=clamp(relation.tension-18,0,100);
        relation.treatyUntilTick=state.tick+state.config.yearDays;relation.status=relation.reputation>=55?'allied':'friendly';
      }else if(action.mode==='trade'){
        addResource(state,'gold',-4);addResource(state,'food',12);relation.reputation=clamp(relation.reputation+7,-100,100);
        relation.tension=clamp(relation.tension-6,0,100);relation.tradeUntilTick=state.tick+state.config.seasonDays*2;
        if(relation.status==='neutral'||relation.status==='wary')relation.status='friendly';
      }else{
        addResource(state,'food',-Math.min(12,state.resources.food));relation.aidBalance=clamp(relation.aidBalance+12,-100,100);
        relation.reputation=clamp(relation.reputation+10,-100,100);relation.tension=clamp(relation.tension-8,0,100);
      }
      emit(events,state,'diplomacy-changed',{targetId:relation.id,mode:action.mode,status:relation.status,reputation:relation.reputation,tension:relation.tension});
    }
  }
  for(const relation of state.diplomacy){
    relation.observedStrengthBand=relationBand(state,relation);
    if(state.tick%state.config.seasonDays===0&&action?.type!=='diplomacy'){
      relation.tension=clamp(relation.tension+(relation.status==='hostile'?6:relation.status==='war'?3:-1),0,100);
      if(relation.tension>=80&&relation.status!=='war')relation.status='war';
      else if(relation.tension>=60&&relation.status!=='war')relation.status='hostile';
      else if(relation.tension>=35&&relation.status==='neutral')relation.status='wary';
    }
    if(relation.status==='war'&&(relation.lastConflictTick<0||state.tick-relation.lastConflictTick>=state.config.seasonDays)){
      const playerPower=state.defence+Math.floor(state.population.workers/2)+rng.nextInt(`conflict-v1:${state.tick}:${relation.id}:player`,12);
      const rivalPower=relation.strength+rng.nextInt(`conflict-v1:${state.tick}:${relation.id}:rival`,12);
      const margin=playerPower-rivalPower;
      const populationLoss=margin>=0?Math.min(state.population.total,1):Math.min(state.population.total,Math.max(1,Math.ceil(Math.abs(margin)/12)));
      const goldLoss=Math.min(state.resources.gold,margin>=0?2:6);
      state.population.total-=populationLoss;addResource(state,'gold',-goldLoss);
      state.defence=clamp(state.defence-(margin>=0?1:4),0,100);
      relation.strength=clamp(relation.strength-(margin>=0?5:1),1,100);relation.tension=clamp(relation.tension-(margin>=0?8:2),0,100);
      relation.lastConflictTick=state.tick;
      emit(events,state,'conflict-resolved',{targetId:relation.id,playerPower,rivalPower,margin,populationLoss,goldLoss});
      if(relation.tension<55)relation.status='hostile';
    }
  }
  state.population.children=Math.floor(state.population.total*0.2);
  state.population.elders=Math.floor(state.population.total*0.1);
  state.population.workers=state.population.total-state.population.children-state.population.elders;
  return events;
}
const crisisDefinitions=[
  {kind:'drought',conflictGroup:'climate',severity:3,warning:3,duration:9,recoveryCost:{food:18,wood:4}},
  {kind:'plague',conflictGroup:'health',severity:4,warning:3,duration:8,recoveryCost:{food:14,gold:6}},
  {kind:'border-raid',conflictGroup:'war',severity:4,warning:2,duration:8,recoveryCost:{wood:12,stone:8}},
  {kind:'market-panic',conflictGroup:'economy',severity:3,warning:2,duration:7,recoveryCost:{gold:8}},
  {kind:'river-flood',conflictGroup:'climate',severity:3,warning:3,duration:8,recoveryCost:{wood:10,stone:6}},
]as const;
export function selectEligibleCrisis(state:CivilizationState,rng:NamedRng):CivilizationCrisis|null{
  if(state.crisis||state.tick<state.config.seasonDays*2)return null;
  const eligible=crisisDefinitions.filter(d=>(state.crisisCooldowns[d.conflictGroup]??0)<=state.tick);
  if(!eligible.length)return null;
  const def=eligible[rng.nextInt(`crisis-select-v1:${state.tick}`,eligible.length)];
  return{
    id:`crisis-${def.kind}-${state.tick}`,kind:def.kind,conflictGroup:def.conflictGroup,severity:def.severity,
    phase:'warning',remainingDays:def.warning,warnedAtTick:state.tick,recoveryCost:{...def.recoveryCost}
  };
}
function advanceCrisis(state:CivilizationState,events:CivilizationEvent[],rng:NamedRng,ledger:EconomyLedger){
  if(!state.crisis&&state.tick%state.config.seasonDays===0){
    const selected=selectEligibleCrisis(state,rng);
    if(selected){state.crisis=selected;emit(events,state,'crisis-warning',{id:selected.id,kind:selected.kind,severity:selected.severity})}
  }
  const crisis=state.crisis;if(!crisis)return;
  crisis.remainingDays--;
  if(crisis.phase==='warning'&&crisis.remainingDays<=0){
    const def=crisisDefinitions.find(d=>d.kind===crisis.kind)!;crisis.phase='active';crisis.remainingDays=def.duration;
    emit(events,state,'crisis-active',{id:crisis.id,kind:crisis.kind,severity:crisis.severity});
    return;
  }
  if(crisis.phase==='active'){
    if(crisis.kind==='drought'){addResource(state,'food',-crisis.severity);state.population.morale=clamp(state.population.morale-1,0,100)}
    if(crisis.kind==='plague'&&state.tick%3===0){state.population.health=clamp(state.population.health-crisis.severity,0,100)}
    if(crisis.kind==='border-raid'){state.defence=clamp(state.defence-1,0,100);addResource(state,'gold',-Math.min(2,state.resources.gold))}
    if(crisis.kind==='market-panic'){addResource(state,'gold',-Math.min(crisis.severity,state.resources.gold))}
    if(crisis.kind==='river-flood'){addResource(state,'wood',-Math.min(crisis.severity,state.resources.wood))}
    if(crisis.remainingDays<=0){crisis.phase='recovery';crisis.remainingDays=2;emit(events,state,'crisis-recovery',{id:crisis.id,kind:crisis.kind,recoveryCost:crisis.recoveryCost})}
  }else if(crisis.phase==='recovery'&&crisis.remainingDays<=0){
    const recoveryPaid:Partial<Resources>={},recoveryShortfall:Partial<Resources>={};let totalShortfall=0;
    for(const [key,required]of Object.entries(crisis.recoveryCost)as[ResourceKey,number][]){
      const paid=Math.min(required,state.resources[key]);
      addResource(state,key,-paid);ledger.consumed[key]+=paid;recoveryPaid[key]=paid;
      if(paid<required){const shortfall=required-paid;recoveryShortfall[key]=shortfall;totalShortfall+=shortfall}
    }
    if(totalShortfall>0)state.stability=clamp(state.stability-Math.min(20,totalShortfall),0,100);
    state.crisisCooldowns[crisis.conflictGroup]=state.tick+state.config.crisisCooldownDays;
    state.progression.renown+=Math.max(2,crisis.severity*2);state.progression.lastMeaningfulTick=state.tick;
    emit(events,state,'crisis-resolved',{id:crisis.id,kind:crisis.kind,cooldownUntil:state.crisisCooldowns[crisis.conflictGroup],recoveryPaid,recoveryShortfall});
    state.crisis=null;
  }
}
export function advanceCharactersAtYearBoundary(state:CivilizationState,rng:NamedRng){
  const events:CivilizationEvent[]=[];
  for(const character of[
    state.characters.ruler,state.characters.heir,...state.characters.councillors,...state.characters.rivals
  ]){
    character.age++;character.health=clamp(character.health-(character.age>=65?2:character.age>=50?1:0),0,100);
  }
  const reignAge=state.tick-state.lastSuccessionTick;
  if(state.characters.ruler.age>=70||state.characters.ruler.health<=20||reignAge>=state.config.yearDays*8){
    const old=state.characters.ruler;const heir=state.characters.heir;
    state.successionCount++;
    state.chronicle.reigns.push({rulerId:old.id,startTick:state.lastSuccessionTick,endTick:state.tick,renownGained:state.progression.renown,legacy:old.aspiration});
    if(state.chronicle.reigns.length>state.config.reignHistoryCap)state.chronicle.reigns.splice(0,state.chronicle.reigns.length-state.config.reignHistoryCap);
    const ordinal=state.successionCount+1;
    state.characters.ruler={...heir,role:'ruler',id:`ruler-${ordinal}`,legitimacy:clamp(heir.legitimacy+5,0,100),expression:'focused'};
    state.characters.heir=createSuccessorHeir(rng,ordinal+1);
    state.lastSuccessionTick=state.tick;state.progression.lastMeaningfulTick=state.tick;
    emit(events,state,'succession',{from:old.id,to:state.characters.ruler.id,legitimacy:state.characters.ruler.legitimacy});
  }
  return events;
}
function updateExpressions(state:CivilizationState){
  const danger=Boolean(state.crisis)||state.population.starvationDays>0||state.stability<30;
  state.characters.ruler.expression=state.result?state.result.reason==='legendary-victory'?'triumphant':'defeated':danger?'concerned':state.ai.pressure==='none'?'calm':'focused';
  state.characters.heir.expression=danger?'concerned':'focused';
  for(const councillor of state.characters.councillors)councillor.expression=danger?'concerned':'calm';
}
export interface StepOutput{state:CivilizationState;events:CivilizationEvent[]}
export function applyCivilizationAction(input:CivilizationState,action:CivilizationAction,rng:NamedRng):StepOutput{
  const state=clone(input),events:CivilizationEvent[]=[];
  if(state.lifecycle!=='running')return{state,events};
  const legal=legalCivilizationActions(state);
  if(!legal.some(a=>a.key===action.key))throw new RangeError('illegal-action');
  state.tick++;state.day=(state.tick%state.config.yearDays)+1;
  state.season=Math.floor((state.tick%state.config.yearDays)/state.config.seasonDays);
  state.year=Math.floor(state.tick/state.config.yearDays)+1;
  state.ai.traitUtilityModifier=traitUtilityModifier(state);
  emit(events,state,'day-start',{day:state.day,season:state.season,year:state.year});
  const ledger:EconomyLedger={tick:state.tick,produced:emptyResources(),consumed:emptyResources(),spoiled:emptyResources(),upkeep:emptyResources(),trade:emptyResources()};
  resolveAction(state,action,events,ledger);
  economy(state,events,ledger);
  for(const event of resolveDiplomacyAndConflict(state,action,rng))emit(events,state,event.type,event.data);
  advanceCrisis(state,events,rng,ledger);
  if(state.tick%state.config.yearDays===0){
    for(const event of advanceCharactersAtYearBoundary(state,rng))emit(events,state,event.type,event.data);
  }
  const previous=state.progression.tier;
  state.progression.tier=tierForRenown(state.progression.renown,state.config.legendaryRenown);
  state.progression.nextTierRenown=nextTierRenown(state.progression.tier,state.config.legendaryRenown);
  if(previous!==state.progression.tier){
    state.progression.lastMeaningfulTick=state.tick;
    emit(events,state,'tier-advanced',{from:previous,to:state.progression.tier});
  }
  if(state.stability===0)state.progression.zeroStabilitySince??=state.tick;else state.progression.zeroStabilitySince=null;
  if(state.progression.tier==='legendary-kingdom'&&state.stability>=state.config.legendaryStability)terminal(state,events,'legendary-victory');
  else if(state.population.total<=0)terminal(state,events,'population-collapse');
  else if(state.progression.zeroStabilitySince!==null&&state.tick-state.progression.zeroStabilitySince>=state.config.collapseWindowDays)terminal(state,events,'state-collapse');
  else if(state.tick-state.progression.lastMeaningfulTick>=state.config.noProgressDays)terminal(state,events,'era-timeout');
  else if(state.tick>=state.config.maxRunDays)terminal(state,events,'era-timeout');
  updateExpressions(state);
  assertCivilizationInvariants(state);
  return{state,events};
}
export function assertCivilizationInvariants(state:CivilizationState){
  if(state.schemaVersion!==1)throw new Error('schemaVersion');
  if(!Number.isInteger(state.tick)||state.tick<0)throw new Error('tick');
  if(state.world.tiles.length!==state.config.width*state.config.height)throw new Error('world-size');
  const ids=new Set<string>();let buildingTotal=0;
  for(const tile of state.world.tiles){
    if(tile.index<0||tile.index>=state.world.tiles.length)throw new Error('tile-index');
    if(tile.building){buildingTotal++;if(ids.has(tile.building.id))throw new Error('duplicate-building');ids.add(tile.building.id)}
  }
  if(buildingTotal>state.config.maxBuildings)throw new Error('building-cap');
  for(const [type,def]of Object.entries(buildingCatalogue)as[Exclude<BuildingType,'camp'>,typeof buildingCatalogue[Exclude<BuildingType,'camp'>]][]){
    const count=buildingCount(state,type);if(count>def.maxCount||(def.unique&&count>1))throw new Error(`building-limit:${type}`);
  }
  for(const [k,v]of Object.entries(state.resources))if(!Number.isInteger(v)||v<0||v>state.config.storageCap)throw new Error(`resource:${k}`);
  if(!Number.isInteger(state.population.total)||state.population.total<0||state.population.total>state.config.populationCap)throw new Error('population');
  if(state.population.total>state.population.housing)throw new Error('housing');
  if(state.population.children+state.population.workers+state.population.elders!==state.population.total)throw new Error('population-cohorts');
  if(state.stability<0||state.stability>100||state.defence<0||state.defence>100)throw new Error('bounded-stat');
  if(state.economy.history.length>state.config.economyHistoryCap)throw new Error('economy-history-bound');
  for(const ledger of[state.economy.ledger,...state.economy.history])for(const bucket of[ledger.produced,ledger.consumed,ledger.spoiled,ledger.upkeep,ledger.trade])for(const value of Object.values(bucket))if(!Number.isInteger(value)||value<0)throw new Error('ledger');
  if(new Set(state.progression.completedGreatWorks).size!==state.progression.completedGreatWorks.length)throw new Error('great-work-duplicate');
  if(state.chronicle.highlights.length>24||state.chronicle.reigns.length>state.config.reignHistoryCap)throw new Error('chronicle-bound');
  if(state.influence.queued.length>state.config.influenceQueueCap||state.influence.appliedIds.length>state.config.influenceAppliedCap)throw new Error('influence-bound');
  for(const relation of state.diplomacy){
    if(!['weaker','matched','stronger'].includes(relation.observedStrengthBand))throw new Error('rival-observation');
    if(relation.reputation<-100||relation.reputation>100||relation.tension<0||relation.tension>100)throw new Error('diplomacy-bound');
  }
  if(state.crisis&&(state.crisis.remainingDays<0||state.crisis.severity<1||state.crisis.severity>5))throw new Error('crisis-bound');
  if(!Number.isInteger(state.successionCount)||state.successionCount<0)throw new Error('succession-count');
  if(state.lifecycle==='result'&&!state.result)throw new Error('result-missing');
  if(state.result&&state.lifecycle==='running')throw new Error('result-lifecycle');
}
