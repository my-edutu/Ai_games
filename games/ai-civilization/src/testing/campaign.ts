import{checksum}from'../../../../packages/replay/src/index';
import{validateWorld}from'../generation/world';
import{CivilizationRuntime}from'../runtime/run';
import{assertCivilizationInvariants}from'../rules/step';
export type CampaignScenario='no-audience'|'typical-pressure'|'fallback-policy'|'max-world'|'pathological-seed';
export interface CampaignOptions{seeds:number;maxDays:number;scenario:CampaignScenario}
export interface CampaignSummary{
  scenario:CampaignScenario;seeds:number;maxDays:number;invalidWorlds:number;invalidActions:number;integrityFailures:number;
  outcomeCounts:Record<string,number>;goalCounts:Record<string,number>;tierCounts:Record<string,number>;
  duration:{min:number;p50:number;p95:number;max:number};successions:number;crises:number;greatWorks:number;
  checksumUnique:number;dramaticPatterns:string[];tickP99Ms:number;maxTickMs:number;
}
function percentile(values:number[],q:number){const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*q))]??0}
function configFor(scenario:CampaignScenario,maxDays:number){
  const base={maxRunDays:maxDays,legendaryRenown:scenario==='typical-pressure'?1200:2000};
  if(scenario==='max-world')return{...base,width:16,height:10,maxBuildings:140};
  if(scenario==='fallback-policy')return{...base,initialFood:0,initialGold:0,initialWood:12,initialStone:8};
  if(scenario==='pathological-seed')return{...base,initialFood:0,initialGold:0,initialWood:0,initialStone:0,noProgressDays:360};
  return base;
}
export type CampaignClock=()=>number;
export function runCivilizationCampaign(options:CampaignOptions,now?:CampaignClock):CampaignSummary{
  if(!Number.isInteger(options.seeds)||options.seeds<=0)throw new RangeError('seeds');
  if(!Number.isInteger(options.maxDays)||options.maxDays<=0)throw new RangeError('maxDays');
  const outcomeCounts:Record<string,number>={},goalCounts:Record<string,number>={},tierCounts:Record<string,number>={};
  const durations:number[]=[],tickDurations:number[]=[],checksums=new Set<string>(),patterns=new Set<string>();
  let invalidWorlds=0,invalidActions=0,integrityFailures=0,successions=0,crises=0,greatWorks=0,maxTickMs=0;
  for(let index=0;index<options.seeds;index++){
    const seed=`civilization-${options.scenario}-${index}`;
    const runtime=CivilizationRuntime.create(configFor(options.scenario,options.maxDays),seed);
    if(options.scenario==='pathological-seed'){runtime.state.stability=0;runtime.state.progression.zeroStabilitySince=0;runtime.state.population.health=42;runtime.state.population.morale=35}
    const report=validateWorld(runtime.state.world,runtime.config);if(!report.valid)invalidWorlds++;
    let previousTier=runtime.state.progression.tier,previousPopulation=runtime.state.population.total;
    for(let day=0;day<options.maxDays&&runtime.state.lifecycle==='running';day++){
      try{
        const tickStart=now?.();runtime.step();
        if(tickStart!==undefined&&now){const elapsed=Math.max(0,now()-tickStart);tickDurations.push(elapsed);if(elapsed>maxTickMs)maxTickMs=elapsed}
        assertCivilizationInvariants(runtime.state);
        goalCounts[runtime.state.ai.goal]=(goalCounts[runtime.state.ai.goal]??0)+1;
        const events=runtime.drainEvents();
        for(const event of events){
          if(event.type==='crisis-warning'){crises++;patterns.add('crisis-warning-and-response')}
          if(event.type==='conflict-resolved')patterns.add('causal-border-conflict');
          if(event.type==='succession')patterns.add('dynastic-succession');
          if(event.type==='great-work-complete')patterns.add('great-work-completion');
          if(event.type==='tier-advanced')patterns.add('settlement-tier-advance');
          if(event.type==='food-shortage')patterns.add('starvation-pressure');
          if(event.type==='crisis-resolved')patterns.add('crisis-recovery');
        }
        if(runtime.state.progression.tier!==previousTier){patterns.add('settlement-tier-advance');previousTier=runtime.state.progression.tier}
        if(Math.abs(runtime.state.population.total-previousPopulation)>=2)patterns.add('population-swing');
        previousPopulation=runtime.state.population.total;
      }catch(error){
        if(error instanceof RangeError)invalidActions++;else integrityFailures++;
        break;
      }
    }
    const outcome=runtime.state.result?.reason??'running-cap';
    outcomeCounts[outcome]=(outcomeCounts[outcome]??0)+1;
    tierCounts[runtime.state.progression.tier]=(tierCounts[runtime.state.progression.tier]??0)+1;
    durations.push(runtime.state.tick);successions+=runtime.state.chronicle.reigns.length;
    greatWorks+=runtime.state.progression.completedGreatWorks.length;checksums.add(checksum(runtime.state));
  }
  return{
    scenario:options.scenario,seeds:options.seeds,maxDays:options.maxDays,invalidWorlds,invalidActions,integrityFailures,
    outcomeCounts,goalCounts,tierCounts,duration:{min:Math.min(...durations),p50:percentile(durations,0.5),p95:percentile(durations,0.95),max:Math.max(...durations)},
    successions,crises,greatWorks,checksumUnique:checksums.size,dramaticPatterns:[...patterns].sort(),tickP99Ms:percentile(tickDurations,0.99),maxTickMs
  };
}
