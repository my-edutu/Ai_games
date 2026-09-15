import type { EscapeRoomConfig } from '../../../../packages/game-contracts/src/index';
import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import type { EscapeGenerationDiagnostics, EscapeHazardDefinition, EscapeObjectDefinition, EscapePuzzleDefinition, EscapePuzzleKind, EscapeRoomDefinition, GeneratedEscapeRoom } from '../state/types';
import { clueKindForPuzzle, ESCAPE_PUZZLE_KINDS, targetKindForPuzzle } from './templates';
import { validateEscapeRoom } from './validator';

const SHAPES=['triangle','circle','diamond','hexagon','square','spiral'] as const;
const SYMBOLS=['sun','moon','key','eye','wave','star','gear','flame'] as const;
const COLORS=['amber','cyan','violet','emerald','coral','silver'] as const;

function pick<T>(rng:NamedRng,stream:string,values:readonly T[]):T{return values[rng.nextInt(stream,values.length)]!;}
function code(rng:NamedRng,stage:number){return `${(stage+rng.nextInt('escape.generation.solution.v1',7))%10}${rng.nextInt('escape.generation.solution.v1',10)}${rng.nextInt('escape.generation.solution.v1',10)}`;}

function buildDefinition(config:EscapeRoomConfig,rng:NamedRng,attempt:number):EscapeRoomDefinition{
  const minimumObjects=config.puzzleDepth*2+1+config.decoyCount;
  if(minimumObjects>config.objectCount)throw new Error('object-budget');
  const objects:EscapeObjectDefinition[]=[];
  const puzzles:EscapePuzzleDefinition[]=[];
  for(let index=0;index<config.puzzleDepth;index++){
    const stage=index+1;
    const puzzleId=`puzzle-${String(stage).padStart(2,'0')}`;
    const kind:EscapePuzzleKind=index===config.puzzleDepth-1?'final-vault':ESCAPE_PUZZLE_KINDS[(index+rng.nextInt('escape.generation.template.v1',ESCAPE_PUZZLE_KINDS.length-1))%(ESCAPE_PUZZLE_KINDS.length-1)]!;
    const clueId=`clue-${String(stage).padStart(2,'0')}`;
    const targetId=index===config.puzzleDepth-1?'final-vault':`target-${String(stage).padStart(2,'0')}`;
    const solution=kind==='tool-dependency'?clueId:code(rng,stage);
    objects.push({
      id:clueId,
      kind:clueKindForPuzzle(kind),
      labelKey:`escape.object.clue.${stage}`,
      visibleFromStart:index===0||rng.nextInt('escape.generation.visibility.v1',100)<70,
      inspectable:true,
      portable:kind==='tool-dependency',
      publicColor:pick(rng,'escape.generation.dressing.v1',COLORS),
      publicShape:pick(rng,'escape.generation.dressing.v1',SHAPES),
      publicSymbol:pick(rng,'escape.generation.dressing.v1',SYMBOLS),
      publicTextKey:`escape.clue.${kind}.${stage}`,
      hiddenFact:{factId:`fact-${stage}`,value:solution,puzzleId},
    });
    objects.push({
      id:targetId,
      kind:targetKindForPuzzle(kind),
      labelKey:`escape.object.target.${stage}`,
      visibleFromStart:true,
      inspectable:true,
      portable:false,
      publicShape:pick(rng,'escape.generation.dressing.v1',SHAPES),
      publicSymbol:pick(rng,'escape.generation.dressing.v1',SYMBOLS),
      publicTextKey:`escape.target.${kind}`,
    });
    puzzles.push({
      id:puzzleId,
      stage,
      kind,
      prerequisitePuzzleIds:index===0?[]:[`puzzle-${String(stage-1).padStart(2,'0')}`],
      clueIds:[clueId],
      targetObjectId:targetId,
      solution,
      requiredItemIds:kind==='tool-dependency'?[clueId]:[],
      rewardFactId:`solved-${stage}`,
    });
  }
  for(let index=0;index<config.decoyCount;index++){
    objects.push({
      id:`decoy-${String(index+1).padStart(2,'0')}`,
      kind:'decoy',labelKey:`escape.object.decoy.${index+1}`,visibleFromStart:true,inspectable:true,portable:false,
      publicColor:pick(rng,'escape.generation.decoys.v1',COLORS),
      publicShape:pick(rng,'escape.generation.decoys.v1',SHAPES),
      publicSymbol:pick(rng,'escape.generation.decoys.v1',SYMBOLS),
      publicTextKey:`escape.decoy.${rng.nextInt('escape.generation.decoys.v1',12)}`,
    });
  }
  objects.push({id:'exit-door',kind:'exit',labelKey:'escape.object.exit',visibleFromStart:true,inspectable:true,portable:false,publicShape:'arch',publicSymbol:'exit',publicTextKey:'escape.exit.locked'});
  const hazards:EscapeHazardDefinition[]=[];
  for(let index=0;index<config.hazardCount;index++){
    const telegraphTicks=3+rng.nextInt('escape.generation.hazards.v1',4);
    const activeTicks=1+rng.nextInt('escape.generation.hazards.v1',3);
    hazards.push({
      id:`hazard-${String(index+1).padStart(2,'0')}`,
      kind:(['laser-sweep','steam-burst','power-surge'] as const)[rng.nextInt('escape.generation.hazards.v1',3)]!,
      periodTicks:telegraphTicks+activeTicks+5+rng.nextInt('escape.generation.hazards.v1',12),
      telegraphTicks,activeTicks,
      phaseOffset:rng.nextInt('escape.generation.hazards.v1',20),
      mandatoryPath:false,
    });
  }
  return{
    schemaVersion:1,contentVersion:'escape-content-v1',generatorVersion:'escape-generator-v1',
    theme:config.theme,difficulty:config.difficulty,maxTicks:config.maxTicks,objects,puzzles,hazards,
    finalPuzzleId:puzzles[puzzles.length-1]!.id,exitObjectId:'exit-door',metadata:{fallback:false,attempt},
  };
}

function fallbackDefinition(config:EscapeRoomConfig):EscapeRoomDefinition{
  const objects:EscapeObjectDefinition[]=[
    {id:'fallback-clue-1',kind:'clue',labelKey:'escape.fallback.clue1',visibleFromStart:true,inspectable:true,portable:false,publicShape:'triangle',publicSymbol:'sun',publicTextKey:'escape.fallback.one',hiddenFact:{factId:'fallback-fact-1',value:'314',puzzleId:'fallback-puzzle-1'}},
    {id:'fallback-lock-1',kind:'lock',labelKey:'escape.fallback.lock1',visibleFromStart:true,inspectable:true,portable:false,publicShape:'square',publicSymbol:'key',publicTextKey:'escape.fallback.lock'},
    {id:'fallback-clue-2',kind:'clue',labelKey:'escape.fallback.clue2',visibleFromStart:true,inspectable:true,portable:false,publicShape:'circle',publicSymbol:'moon',publicTextKey:'escape.fallback.two',hiddenFact:{factId:'fallback-fact-2',value:'271',puzzleId:'fallback-puzzle-2'}},
    {id:'fallback-vault',kind:'vault',labelKey:'escape.fallback.vault',visibleFromStart:true,inspectable:true,portable:false,publicShape:'hexagon',publicSymbol:'eye',publicTextKey:'escape.fallback.final'},
    {id:'exit-door',kind:'exit',labelKey:'escape.object.exit',visibleFromStart:true,inspectable:true,portable:false,publicShape:'arch',publicSymbol:'exit',publicTextKey:'escape.exit.locked'},
  ];
  const puzzles:EscapePuzzleDefinition[]=[
    {id:'fallback-puzzle-1',stage:1,kind:'sequence-lock',prerequisitePuzzleIds:[],clueIds:['fallback-clue-1'],targetObjectId:'fallback-lock-1',solution:'314',requiredItemIds:[],rewardFactId:'fallback-solved-1'},
    {id:'fallback-puzzle-2',stage:2,kind:'final-vault',prerequisitePuzzleIds:['fallback-puzzle-1'],clueIds:['fallback-clue-2'],targetObjectId:'fallback-vault',solution:'271',requiredItemIds:[],rewardFactId:'fallback-solved-2'},
  ];
  return{schemaVersion:1,contentVersion:'escape-content-v1',generatorVersion:'escape-generator-v1',theme:config.theme,difficulty:config.difficulty,maxTicks:config.maxTicks,objects,puzzles,hazards:[],finalPuzzleId:'fallback-puzzle-2',exitObjectId:'exit-door',metadata:{fallback:true,attempt:config.generationAttempts}};
}

export function generateEscapeRoom(config:EscapeRoomConfig,rng:NamedRng):GeneratedEscapeRoom{
  const failures:EscapeGenerationDiagnostics['failures']=[];
  for(let attempt=1;attempt<=config.generationAttempts;attempt++){
    try{
      const definition=buildDefinition(config,rng,attempt);
      const validation=validateEscapeRoom(definition,config);
      if(validation.valid)return{seed:rng.seed,definition,diagnostics:{attempts:attempt,usedFallback:false,fallbackVersion:null,failures},config};
      failures.push({attempt,codes:validation.diagnostics.map(item=>item.code)});
    }catch(error){
      failures.push({attempt,codes:[String(error).includes('object-budget')?'object-budget':'unsolved-room']});
    }
  }
  const definition=fallbackDefinition(config);
  return{seed:rng.seed,definition,diagnostics:{attempts:config.generationAttempts,usedFallback:true,fallbackVersion:'escape-fallback-v1',failures},config};
}
