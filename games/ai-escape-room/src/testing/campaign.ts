import type { EscapeRoomConfig, EscapeTheme } from '../../../../packages/game-contracts/src/index';
import { checksum } from '../../../../packages/replay/src/index';
import { parseEscapeRoomConfig } from '../config/schema';
import { escapeRoomFeatureVector } from '../generation/validator';
import { solveEscapeRoom } from '../generation/solver';
import { validateEscapeRoom } from '../generation/validator';
import { EscapeRuntime } from '../runtime/run';

export interface EscapeCampaignOptions{
  baseConfig:EscapeRoomConfig;
  seeds:string[];
  themes:EscapeTheme[];
  difficulties:number[];
  maxRuns:number;
}

export interface EscapeCampaignSummary{
  schemaVersion:1;
  runCount:number;
  fairOutcomeCount:number;
  technicalCount:number;
  invalidContentCount:number;
  fallbackCount:number;
  rejectedActionCount:number;
  outcomes:Record<string,number>;
  maxPlannerExpansions:number;
  maxPathologyCount:number;
  p50Ticks:number;
  p95Ticks:number;
  maxTicks:number;
  uniqueFeatureSignatures:number;
  dramaticPatterns:string[];
  actionCounts:Record<string,number>;
  themeCounts:Record<string,number>;
  difficultyCounts:Record<string,number>;
  sampleRunChecksums:string[];
  summaryChecksum:string;
}

function assertOptions(options:EscapeCampaignOptions){
  if(!options.seeds.length)throw new RangeError('seeds');
  if(!options.themes.length)throw new RangeError('themes');
  if(!options.difficulties.length)throw new RangeError('difficulties');
  if(!Number.isInteger(options.maxRuns)||options.maxRuns<1||options.maxRuns>10_000)throw new RangeError('maxRuns');
  for(const seed of options.seeds)if(!seed.trim())throw new RangeError('seed');
  for(const difficulty of options.difficulties)if(!Number.isInteger(difficulty)||difficulty<1||difficulty>20)throw new RangeError('difficulty');
}

function campaignConfig(base:EscapeRoomConfig,theme:EscapeTheme,difficulty:number):EscapeRoomConfig{
  const structurallyValid=base.objectCount>=base.puzzleDepth*2+1+base.decoyCount;
  if(!structurallyValid)return parseEscapeRoomConfig({...base,theme,difficulty});
  const puzzleDepth=Math.min(12,Math.max(base.puzzleDepth,2+Math.floor((difficulty-1)/3)));
  const decoyCount=Math.min(12,Math.max(base.decoyCount,Math.floor(difficulty/4)));
  const hazardCount=Math.min(6,Math.max(base.hazardCount,Math.floor((difficulty-1)/5)));
  const objectCount=Math.min(48,Math.max(base.objectCount,puzzleDepth*2+1+decoyCount));
  const maxTicks=Math.max(base.maxTicks,160+puzzleDepth*36+hazardCount*30);
  return parseEscapeRoomConfig({...base,theme,difficulty,puzzleDepth,decoyCount,hazardCount,objectCount,maxTicks});
}

function percentile(values:number[],quantile:number):number{
  if(!values.length)return 0;
  const ordered=[...values].sort((a,b)=>a-b);
  return ordered[Math.max(0,Math.ceil(ordered.length*quantile)-1)]!;
}

function increment(record:Record<string,number>,key:string){record[key]=(record[key]??0)+1;}

export function runEscapeCampaign(options:EscapeCampaignOptions):EscapeCampaignSummary{
  assertOptions(options);
  const outcomes:Record<string,number>={};const actionCounts:Record<string,number>={};const themeCounts:Record<string,number>={};const difficultyCounts:Record<string,number>={};
  const tickSamples:number[]=[];const featureSignatures=new Set<string>();const dramaticPatterns=new Set<string>();const sampleRunChecksums:string[]=[];
  let runCount=0;let fairOutcomeCount=0;let technicalCount=0;let invalidContentCount=0;let fallbackCount=0;let rejectedActionCount=0;let maxPlannerExpansions=0;let maxPathologyCount=0;

  outer:for(const seed of options.seeds){
    for(const theme of options.themes){
      for(const difficulty of options.difficulties){
        if(runCount>=options.maxRuns)break outer;
        const config=campaignConfig(options.baseConfig,theme,difficulty);
        const runSeed=`${seed}:${theme}:d${difficulty}`;
        const runtime=EscapeRuntime.create({config,seed:runSeed,runId:`campaign-${runCount}-${checksum(runSeed)}`,policy:'autonomous'});
        const roomValidation=validateEscapeRoom(runtime.state.room,config);
        if(!roomValidation.valid){invalidContentCount+=1;technicalCount+=1;runCount+=1;continue;}
        if(runtime.state.room.metadata.fallback)fallbackCount+=1;
        const solution=solveEscapeRoom(runtime.state.room);
        const feature=escapeRoomFeatureVector(runtime.state.room,solution);
        featureSignatures.add(checksum({theme,difficulty,kinds:runtime.state.room.puzzles.map(puzzle=>puzzle.kind),feature,fallback:runtime.state.room.metadata.fallback}));
        increment(themeCounts,theme);increment(difficultyCounts,String(difficulty));
        let inspectedDecoy=false;let activeWait=false;let usedMechanism=false;let usedTool=false;
        const stepLimit=config.maxTicks+2;
        while(!runtime.state.result&&runtime.state.tick<stepLimit){
          const result=runtime.step();
          if(!result.accepted)rejectedActionCount+=1;
          if(result.action){
            const action=result.action;
            increment(actionCounts,action.kind);
            if(action.kind==='inspect'){
              dramaticPatterns.add('opening-discovery');
              if(runtime.state.room.objects.find(object=>object.id===action.targetId)?.kind==='decoy')inspectedDecoy=true;
            }
            if(action.kind==='wait'&&Object.values(runtime.state.hazardStates).some(item=>item.phase==='active'))activeWait=true;
            if(action.kind==='enter-code'||action.kind==='activate')usedMechanism=true;
            if(action.kind==='use'||action.kind==='take'||action.kind==='combine')usedTool=true;
          }
          const signals=runtime.signals();maxPlannerExpansions=Math.max(maxPlannerExpansions,signals.lastDecisionExpansions);maxPathologyCount=Math.max(maxPathologyCount,signals.pathologyCount);
        }
        const result=runtime.state.result;
        if(!result){technicalCount+=1;increment(outcomes,'bounded-run-exceeded');}
        else{
          increment(outcomes,result.reason);
          if(result.kind==='technical')technicalCount+=1;else fairOutcomeCount+=1;
          tickSamples.push(result.tick);
          if(result.reason==='escape')dramaticPatterns.add('final-vault-escape');
        }
        if(runtime.state.room.puzzles.length>=6)dramaticPatterns.add('multi-stage-chain');
        if(inspectedDecoy)dramaticPatterns.add('decoy-investigation');
        if(activeWait)dramaticPatterns.add('hazard-hold');
        if(usedMechanism)dramaticPatterns.add('mechanism-breakthrough');
        if(usedTool)dramaticPatterns.add('tool-breakthrough');
        if(sampleRunChecksums.length<64)sampleRunChecksums.push(checksum(runtime.snapshotMaterial()));
        runCount+=1;
      }
    }
  }

  const partial:Omit<EscapeCampaignSummary,'summaryChecksum'>={
    schemaVersion:1,runCount,fairOutcomeCount,technicalCount,invalidContentCount,fallbackCount,rejectedActionCount,
    outcomes:Object.fromEntries(Object.entries(outcomes).sort()),maxPlannerExpansions,maxPathologyCount,
    p50Ticks:percentile(tickSamples,0.5),p95Ticks:percentile(tickSamples,0.95),maxTicks:tickSamples.length?Math.max(...tickSamples):0,
    uniqueFeatureSignatures:featureSignatures.size,dramaticPatterns:[...dramaticPatterns].sort(),
    actionCounts:Object.fromEntries(Object.entries(actionCounts).sort()),themeCounts:Object.fromEntries(Object.entries(themeCounts).sort()),difficultyCounts:Object.fromEntries(Object.entries(difficultyCounts).sort()),sampleRunChecksums,
  };
  const summary={...partial,summaryChecksum:''} as EscapeCampaignSummary;
  summary.summaryChecksum=checksum({...summary,summaryChecksum:undefined});
  return summary;
}
