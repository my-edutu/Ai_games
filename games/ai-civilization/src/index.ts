import{NamedRng}from'../../../packages/seeded-rng/src/index';
import type{CivilizationConfig}from'./config/schema';
import{generateWorld}from'./generation/world';
import{createFoundingCast}from'./characters/cast';
import type{CivilizationState,EconomyLedger,Resources}from'./state/types';
function emptyResources():Resources{return{food:0,wood:0,stone:0,gold:0,knowledge:0,influence:0}}
function emptyLedger():EconomyLedger{return{tick:0,produced:emptyResources(),consumed:emptyResources(),spoiled:emptyResources(),upkeep:emptyResources(),trade:emptyResources()}}
export function createInitialCivilizationState(config:CivilizationConfig,seed:string,runId:string,rng:NamedRng=NamedRng.fromSeed(seed)):CivilizationState{
  const world=generateWorld(config,rng);
  world.tiles[world.capitalIndex].building={id:'building-camp-1',type:'camp',level:1,builtAtTick:0};
  const pop=config.initialPopulation,children=Math.floor(pop*0.2),elders=Math.floor(pop*0.1),workers=pop-children-elders;
  return{
    schemaVersion:1,runId,seed,tick:0,day:1,season:0,year:1,lifecycle:'running',config,world,
    resources:{food:config.initialFood,wood:config.initialWood,stone:config.initialStone,gold:config.initialGold,knowledge:config.initialKnowledge,influence:config.initialInfluence},
    economy:{ledger:emptyLedger(),history:[],actionRenownCounts:{}},
    population:{total:pop,children,workers,elders,housing:32,health:82,morale:74,starvationDays:0,births:0,deaths:0,migration:0,lastDelta:0},
    characters:createFoundingCast(rng),policies:{rationingDays:0,civicFocus:'survival'},stability:72,defence:8,
    ai:{goal:'Secure the founding season',actionKey:'reserve',pressure:'none',confidence:'medium',fallbackUsed:false,decisions:0,planChanges:0,lastPlanChangeReason:'initial-plan',traitUtilityModifier:0},
    progression:{tier:'camp',renown:0,nextTierRenown:50,greatWorkId:null,greatWorkProgress:0,completedGreatWorks:[],lastMeaningfulTick:0,zeroStabilitySince:null},
    diplomacy:Array.from({length:config.maxRivals},(_,i)=>({
      id:(['rival-1','rival-2','rival-3']as const)[i],status:'neutral' as const,reputation:0,tension:10+i*5,strength:30+i*8,
      observedStrengthBand:'matched' as const,treatyUntilTick:0,tradeUntilTick:0,aidBalance:0,lastConflictTick:-1
    })),
    crisis:null,crisisCooldowns:{},lastSuccessionTick:0,successionCount:0,
    influence:{queued:[],appliedIds:[],cooldowns:{}},
    chronicle:{highlights:[{tick:0,kind:'founding',copyKey:'chronicle.founding',importance:3}],reigns:[]},
    intermissionRemaining:0
  };
}
export*from'./state/types';export*from'./config/schema';export*from'./manifest';
