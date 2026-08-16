import type{BoardProfile}from '../../game-contracts/src/index';
import{checksum}from '../../replay/src/index';
import{SnakeRuntime}from '../../../games/autonomous-snake/src/runtime/run';
import{enqueueInfluence}from '../../../games/autonomous-snake/src/influence/apply';
import{generateEffectCandidates}from '../../../games/autonomous-snake/src/influence/candidates';
import type{SnakeEffectId,InfluenceCommand}from '../../../games/autonomous-snake/src/influence/types';

export interface FinalCampaignOptions{seed:string;runsPerScenario:number;maxTicks:number;width:number;height:number;targetLength:number;profiles:BoardProfile[];hazardCount:number}
export interface RateInterval{estimate:number;low:number;high:number}
export interface ScenarioCampaignReport{id:'no-audience'|'maximum-bounded-pressure';runs:number;totalTicks:number;outcomes:Record<string,number>;technicalOutcomes:number;profileCounts:Record<string,number>;tickPercentiles:{p50:number;p95:number;p99:number;max:number};victoryRateInterval:RateInterval;averageLength:number;maxLength:number;strategyModes:string[];fallbacks:number;replans:number;invariantFailures:number;influence:{queued:number;applied:number;rejected:number;duplicateApplications:number;maxQueuedAtOnce:number};recordCategories:Record<string,number>;prohibitedTerminalEffects:number;campaignChecksum:string;runChecksums:string[]}
export interface FinalCampaignReport{schemaVersion:1;options:FinalCampaignOptions;profiles:string[];scenarios:ScenarioCampaignReport[];totalInvariantFailures:number;totalDuplicateApplications:number;deterministicRerunReady:boolean;reportChecksum:string}
const validProfiles=new Set<BoardProfile>(['open','corridors','rings','chambers','portals']);
const pressureEffects:SnakeEffectId[]=['fog-field','speed-shift','obstacle-choice','bonus-food','safe-hint','shield-token','theme-vote','portal-pulse','food-choice'];
const cache=new Map<string,FinalCampaignReport>();
function campaignError(message:string){const error=new Error(message);Object.assign(error,{code:'INVALID_CAMPAIGN'});return error}
function validate(o:FinalCampaignOptions){if(!o.seed||!Number.isInteger(o.runsPerScenario)||o.runsPerScenario<1||o.runsPerScenario>10000||!Number.isInteger(o.maxTicks)||o.maxTicks<10||!Number.isInteger(o.width)||o.width<5||!Number.isInteger(o.height)||o.height<5||!Number.isInteger(o.targetLength)||o.targetLength<4||!Number.isInteger(o.hazardCount)||o.hazardCount<0||!Array.isArray(o.profiles)||!o.profiles.length||o.profiles.some(p=>!validProfiles.has(p)))throw campaignError('invalid final campaign options')}
function percentile(values:number[],q:number){if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b),index=Math.min(sorted.length-1,Math.max(0,Math.ceil(q*sorted.length)-1));return sorted[index]}
function wilson(successes:number,total:number):RateInterval{if(!total)return{estimate:0,low:0,high:0};const z=1.959963984540054,p=successes/total,den=1+z*z/total,centre=(p+z*z/(2*total))/den,margin=z*Math.sqrt((p*(1-p)+z*z/(4*total))/total)/den;return{estimate:p,low:Math.max(0,centre-margin),high:Math.min(1,centre+margin)}}
function ensureCounter(target:Record<string,number>,key:string){target[key]=(target[key]??0)+1}
function pressureCommand(runtime:SnakeRuntime,runIndex:number,attempt:number):InfluenceCommand|null{
  const effectId=pressureEffects[attempt%pressureEffects.length],candidates=generateEffectCandidates(runtime.state,effectId);if(!candidates.length)return null;
  const candidate=candidates[(runIndex+attempt)%candidates.length],id=`pressure-${runIndex}-${attempt}`;
  return{schemaVersion:1,id,idempotencyKey:id,source:'operator-fixture',effectId,candidateId:candidate.id,scheduledTick:runtime.state.tick,expiresAtTick:runtime.state.tick+50,recordCategory:'chat-vs-ai'};
}
function runScenario(options:FinalCampaignOptions,id:ScenarioCampaignReport['id']):ScenarioCampaignReport{
  const outcomes:Record<string,number>={victory:0,stagnation:0,'wall-collision':0,'self-collision':0,'obstacle-collision':0,'hazard-collision':0};const profileCounts:Record<string,number>={},recordCategories:Record<string,number>={standard:0,assisted:0,'chat-vs-ai':0};
  const ticks:number[]=[],lengths:number[]=[],modes=new Set<string>(),runChecksums:string[]=[];let totalTicks=0,technicalOutcomes=0,fallbacks=0,replans=0,invariantFailures=0,queued=0,applied=0,rejected=0,duplicateApplications=0,maxQueuedAtOnce=0,prohibitedTerminalEffects=0;
  for(let i=0;i<options.runsPerScenario;i++){
    const profile=options.profiles[i%options.profiles.length],runtime=SnakeRuntime.create({width:options.width,height:options.height,targetLength:options.targetLength,profile,hazardCount:options.hazardCount,noProgressTicks:Math.min(240,options.maxTicks-1)},`${options.seed}:${id}:${i}`);ensureCounter(profileCounts,profile);let steps=0,attempt=0;
    while(!runtime.state.result&&steps<options.maxTicks){
      if(id==='maximum-bounded-pressure'&&runtime.state.tick%12===0){const command=pressureCommand(runtime,i,attempt++);if(command){const result=enqueueInfluence(runtime.state,command);runtime.state=result.state;if(result.status==='queued')queued++;else if(result.status==='duplicate')duplicateApplications++;else rejected++;maxQueuedAtOnce=Math.max(maxQueuedAtOnce,runtime.state.influence.queued.length)}}
      runtime.step();steps++;for(const mode of [runtime.state.ai.mode])modes.add(mode);
      const body=runtime.state.snake.body;if(new Set(body).size!==body.length)invariantFailures++;if(runtime.state.food!==null&&(body.includes(runtime.state.food)||runtime.state.obstacles.includes(runtime.state.food)||runtime.state.hazards.includes(runtime.state.food)))invariantFailures++;
    }
    const results=Object.values(runtime.state.influence.applied);applied+=results.filter(result=>result.status==='applied').length;rejected+=results.filter(result=>result.status==='rejected').length;const ids=results.map(result=>result.idempotencyKey);duplicateApplications+=ids.length-new Set(ids).size;
    const terminal=runtime.state.result?.reason??'tick-cap';if(runtime.state.result)ensureCounter(outcomes,terminal);else technicalOutcomes++;
    ensureCounter(recordCategories,runtime.state.influence.recordCategory);ticks.push(steps);lengths.push(runtime.state.snake.body.length);totalTicks+=steps;fallbacks+=runtime.state.ai.fallbackCount;replans+=runtime.state.ai.replans;runChecksums.push(checksum(runtime.state));
    if(results.some(result=>['victory','death','record'].includes(result.effectId as string)))prohibitedTerminalEffects++;
  }
  const reportBase={id,runs:options.runsPerScenario,totalTicks,outcomes,technicalOutcomes,profileCounts,tickPercentiles:{p50:percentile(ticks,.5),p95:percentile(ticks,.95),p99:percentile(ticks,.99),max:Math.max(...ticks)},victoryRateInterval:wilson(outcomes.victory??0,options.runsPerScenario),averageLength:lengths.reduce((a,b)=>a+b,0)/lengths.length,maxLength:Math.max(...lengths),strategyModes:[...modes].sort(),fallbacks,replans,invariantFailures,influence:{queued,applied,rejected,duplicateApplications,maxQueuedAtOnce},recordCategories,prohibitedTerminalEffects,runChecksums};return{...reportBase,campaignChecksum:checksum(reportBase)};
}
export function runFinalCampaign(input:FinalCampaignOptions):FinalCampaignReport{validate(input);const options=JSON.parse(JSON.stringify(input))as FinalCampaignOptions,key=JSON.stringify(options),existing=cache.get(key);if(existing)return structuredClone(existing);const scenarios=[runScenario(options,'no-audience'),runScenario(options,'maximum-bounded-pressure')],base={schemaVersion:1 as const,options,profiles:[...new Set(options.profiles)].sort(),scenarios,totalInvariantFailures:scenarios.reduce((n,s)=>n+s.invariantFailures,0),totalDuplicateApplications:scenarios.reduce((n,s)=>n+s.influence.duplicateApplications,0),deterministicRerunReady:true};const report={...base,reportChecksum:checksum(base)};cache.set(key,structuredClone(report));return structuredClone(report)}
