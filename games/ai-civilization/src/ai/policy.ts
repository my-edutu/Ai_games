import type{
  BuildingType,CivilizationAction,CivilizationState,GreatWorkId,PolicyDecision,
  PublicIntent,ResourceKey,Resources,WorldTile
}from'../state/types';
import type{CivilizationTier}from'../config/schema';

type Buildable=Exclude<BuildingType,'camp'>;
export interface BuildingDefinition{
  type:Buildable;unlockTier:CivilizationTier;cost:Pick<Resources,'wood'|'stone'|'gold'>;
  workers:number;renown:number;unique:boolean;maxCount:number;
  terrains?:WorldTile['terrain'][];minimum?:Partial<Pick<WorldTile,'fertility'|'timber'|'stone'|'water'|'trade'|'defence'>>;
}
const tierOrder:CivilizationTier[]=['camp','hamlet','village','town','city','kingdom','legendary-kingdom'];
export const buildingCatalogue:Record<Buildable,BuildingDefinition>={
  farm:{type:'farm',unlockTier:'camp',cost:{wood:8,stone:0,gold:0},workers:1,renown:6,unique:false,maxCount:16,terrains:['plains','marsh','coast'],minimum:{fertility:2}},
  lumberyard:{type:'lumberyard',unlockTier:'camp',cost:{wood:5,stone:2,gold:0},workers:1,renown:5,unique:false,maxCount:12,terrains:['forest','marsh'],minimum:{timber:2}},
  quarry:{type:'quarry',unlockTier:'camp',cost:{wood:5,stone:2,gold:0},workers:1,renown:5,unique:false,maxCount:12,terrains:['hills','coast'],minimum:{stone:1}},
  house:{type:'house',unlockTier:'camp',cost:{wood:10,stone:5,gold:0},workers:1,renown:8,unique:false,maxCount:20},
  granary:{type:'granary',unlockTier:'hamlet',cost:{wood:12,stone:8,gold:2},workers:2,renown:12,unique:false,maxCount:3},
  market:{type:'market',unlockTier:'village',cost:{wood:16,stone:8,gold:8},workers:3,renown:18,unique:false,maxCount:3,minimum:{trade:1}},
  school:{type:'school',unlockTier:'village',cost:{wood:18,stone:12,gold:10},workers:3,renown:20,unique:false,maxCount:3},
  barracks:{type:'barracks',unlockTier:'town',cost:{wood:20,stone:20,gold:10},workers:4,renown:24,unique:false,maxCount:3,minimum:{defence:1}},
  temple:{type:'temple',unlockTier:'town',cost:{wood:18,stone:24,gold:14},workers:3,renown:26,unique:false,maxCount:2},
  aqueduct:{type:'aqueduct',unlockTier:'city',cost:{wood:24,stone:40,gold:20},workers:5,renown:40,unique:true,maxCount:1,minimum:{water:1}},
  workshop:{type:'workshop',unlockTier:'city',cost:{wood:35,stone:25,gold:22},workers:5,renown:38,unique:false,maxCount:2},
  monument:{type:'monument',unlockTier:'kingdom',cost:{wood:40,stone:60,gold:40},workers:6,renown:65,unique:true,maxCount:1},
};
export const greatWorkCatalogue:Record<GreatWorkId,{unlockTier:CivilizationTier;cost:Partial<Resources>;progress:number;renown:number;benefit:string}>={
  'sky-library':{unlockTier:'city',cost:{wood:18,stone:15,gold:12,knowledge:18},progress:25,renown:120,benefit:'knowledge'},
  'river-citadel':{unlockTier:'city',cost:{wood:20,stone:24,gold:10,knowledge:8},progress:25,renown:120,benefit:'defence'},
  'unity-monument':{unlockTier:'city',cost:{wood:16,stone:20,gold:18,influence:8},progress:25,renown:120,benefit:'stability'},
};
export function tierForRenown(renown:number,legendaryRenown=2000):CivilizationTier{
  const thresholds:[CivilizationTier,number][]=[
    ['legendary-kingdom',2000],['kingdom',1200],['city',700],['town',350],['village',150],['hamlet',50],['camp',0]
  ];
  const ratio=legendaryRenown/2000;
  for(const [tier,base]of thresholds)if(renown>=Math.round(base*ratio))return tier;
  return'camp';
}
export function nextTierRenown(tier:CivilizationTier,legendaryRenown=2000){
  const i=tierOrder.indexOf(tier);
  if(i<0||i===tierOrder.length-1)return legendaryRenown;
  const base=[0,50,150,350,700,1200,2000][i+1];
  return Math.round(base*(legendaryRenown/2000));
}
function tierAtLeast(actual:CivilizationTier,required:CivilizationTier){return tierOrder.indexOf(actual)>=tierOrder.indexOf(required)}
function countBuildings(state:CivilizationState,type:BuildingType){return state.world.tiles.filter(t=>t.building?.type===type).length}
function validTile(def:BuildingDefinition,tile:WorldTile){
  if(tile.building||(tile.owner!=='neutral'&&tile.owner!=='player')||tile.terrain==='lake')return false;
  if(def.terrains&&!def.terrains.includes(tile.terrain))return false;
  for(const [key,value]of Object.entries(def.minimum??{}) as [keyof WorldTile,number][])if(Number(tile[key])<value)return false;
  return true;
}
function canAfford(state:CivilizationState,cost:Partial<Resources>){
  return(Object.entries(cost)as[ResourceKey,number][]).every(([key,value])=>state.resources[key]>=value);
}
export function buildingCost(type:Buildable){return{...buildingCatalogue[type].cost}}
export function traitUtilityModifier(state:CivilizationState){
  const weights:Record<string,number>={bold:3,ambitious:3,charismatic:2,scholarly:2,inventive:2,diplomatic:2,steadfast:2,patient:1,pragmatic:1,frugal:1,cautious:-1,merciful:1};
  return Math.max(-12,Math.min(12,state.characters.ruler.traits.reduce((sum,t)=>sum+(weights[t]??0),0)));
}
export function legalCivilizationActions(state:CivilizationState):CivilizationAction[]{
  if(state.lifecycle!=='running')return[];
  const out:CivilizationAction[]=[{key:'reserve',type:'reserve'}];
  if(state.crisis){
    out.push({key:'crisis:relief',type:'crisis-response',response:'relief'});
    out.push({key:'crisis:ration',type:'crisis-response',response:'ration'});
    out.push({key:'crisis:fortify',type:'crisis-response',response:'fortify'});
  }
  if(state.policies.rationingDays<=0)out.push({key:'policy:ration',type:'enact-policy',policy:'ration'});
  if(state.resources.gold>=4)out.push({key:'trade:food',type:'trade',resource:'food'});
  if(state.resources.gold>=2)out.push({key:'research',type:'research'});
  out.push({key:'defend',type:'defend'});
  const buildingTotal=state.world.tiles.filter(t=>t.building).length;
  if(buildingTotal<state.config.maxBuildings){
    for(const def of Object.values(buildingCatalogue)){
      const count=countBuildings(state,def.type);
      if(!tierAtLeast(state.progression.tier,def.unlockTier)||count>=def.maxCount||(def.unique&&count>0))continue;
      if(state.population.workers<def.workers||!canAfford(state,def.cost))continue;
      const tile=state.world.tiles.find(t=>validTile(def,t));
      if(tile)out.push({key:`build:${def.type}:${tile.index}`,type:'build',building:def.type,tileIndex:tile.index});
    }
  }
  if(state.progression.greatWorkId){
    const work=greatWorkCatalogue[state.progression.greatWorkId];
    if(canAfford(state,work.cost))out.push({key:'great-work',type:'great-work'});
  }else if(tierAtLeast(state.progression.tier,'city')){
    for(const workId of Object.keys(greatWorkCatalogue)as GreatWorkId[]){
      if(!state.progression.completedGreatWorks.includes(workId))out.push({key:`great-work:select:${workId}`,type:'select-great-work',greatWorkId:workId});
    }
  }
  if(tierAtLeast(state.progression.tier,'town')){
    for(const relation of state.diplomacy){
      out.push({key:`diplomacy:treaty:${relation.id}`,type:'diplomacy',targetId:relation.id,mode:'treaty'});
      if(state.resources.gold>=4)out.push({key:`diplomacy:trade:${relation.id}`,type:'diplomacy',targetId:relation.id,mode:'trade'});
      if(state.resources.food>=12)out.push({key:`diplomacy:aid:${relation.id}`,type:'diplomacy',targetId:relation.id,mode:'aid'});
    }
  }
  return out.sort((a,b)=>a.key.localeCompare(b.key));
}
export const availableActions=legalCivilizationActions;
function foodRunway(state:CivilizationState){return state.resources.food/Math.max(1,Math.ceil(state.population.total/6))}
function intent(state:CivilizationState,action:CivilizationAction,pressure:string,goal:string,fallbackUsed=false):PublicIntent{
  return{
    goal,decree:action.key,pressure,confidence:pressure==='none'?'high':pressure.includes('critical')?'low':'medium',fallbackUsed,
    planChangeReason:goal===state.ai.goal?'plan-maintained':`pressure:${pressure}`
  };
}
export function decideCivilizationAction(state:CivilizationState):PolicyDecision{
  const legal=legalCivilizationActions(state);
  if(!legal.length)return{action:{key:'reserve',type:'reserve'},intent:intent(state,{key:'reserve',type:'reserve'},'critical:no-legal-action','Preserve authority',true),candidateCount:0,score:-999};
  const days=foodRunway(state);
  let preferred:CivilizationAction|undefined;
  let pressure='none',goal='Grow a balanced settlement',score=10;
  if(state.crisis){
    pressure=`critical:${state.crisis.kind}:${state.crisis.phase}`;goal='Protect the realm through the crisis';
    const desired=state.crisis.conflictGroup==='war'?'fortify':state.crisis.conflictGroup==='health'?'relief':'ration';
    preferred=legal.find(a=>a.type==='crisis-response'&&a.response===desired)??legal.find(a=>a.type==='crisis-response');score=110;
  }else if(state.resources.food===0||days<4){
    pressure=`critical:food runway ${Math.floor(days)} days`;goal='Prevent starvation';
    preferred=legal.find(a=>a.key==='policy:ration')??legal.find(a=>a.key.startsWith('build:farm:'))??legal.find(a=>a.key==='trade:food');score=100;
  }else if(state.population.housing-state.population.total<8){
    pressure='housing nearly full';goal='Create safe housing';preferred=legal.find(a=>a.key.startsWith('build:house:'));score=82;
  }else if(state.progression.greatWorkId){
    pressure='great work awaiting resources';goal=`Complete ${state.progression.greatWorkId}`;
    preferred=legal.find(a=>a.type==='great-work');score=78;
  }else if(!state.world.tiles.some(t=>t.building?.type==='farm')){
    pressure='harvest capacity low';goal='Establish food production';preferred=legal.find(a=>a.key.startsWith('build:farm:'));score=70;
  }else if(state.resources.wood<30){
    pressure='timber reserve low';goal='Secure timber';preferred=legal.find(a=>a.key.startsWith('build:lumberyard:'));score=62;
  }else if(state.resources.stone<25){
    pressure='stone reserve low';goal='Secure masonry';preferred=legal.find(a=>a.key.startsWith('build:quarry:'));score=58;
  }else if(!state.world.tiles.some(t=>t.building?.type==='granary')){
    pressure='storage exposed';goal='Protect the harvest';preferred=legal.find(a=>a.key.startsWith('build:granary:'));score=55;
  }else if(tierAtLeast(state.progression.tier,'city')&&state.progression.completedGreatWorks.length<3){
    pressure='legacy opportunity';goal='Begin a Great Work';preferred=legal.find(a=>a.type==='select-great-work');score=52;
  }else if(tierAtLeast(state.progression.tier,'town')&&state.diplomacy.some(r=>r.tension>55)){
    pressure='border tension rising';goal='Stabilize rival relations';preferred=legal.find(a=>a.type==='diplomacy'&&a.mode==='treaty');score=48;
  }else if(state.resources.gold>=2){
    pressure='none';goal='Advance civic knowledge';preferred=legal.find(a=>a.key==='research');score=40;
  }
  const action=preferred??legal.find(a=>a.key==='reserve')??legal[0];
  const modifier=traitUtilityModifier(state);
  return{action,intent:intent(state,action,pressure,goal,!preferred),candidateCount:legal.length,score:score+modifier};
}
