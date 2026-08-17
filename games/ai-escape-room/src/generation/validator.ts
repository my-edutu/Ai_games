import type { EscapeRoomConfig } from '../../../../packages/game-contracts/src/index';
import type { EscapeFeatureVector, EscapeRoomDefinition, EscapeSolution, EscapeValidation, EscapeValidationDiagnostic } from '../state/types';
import { solveEscapeRoom } from './solver';

export function escapeRoomFeatureVector(room:EscapeRoomDefinition,solution:EscapeSolution|null):EscapeFeatureVector{
  const clues=room.puzzles.flatMap(puzzle=>puzzle.clueIds).map(id=>room.objects.find(object=>object.id===id)).filter(Boolean);
  const redundant=clues.filter(clue=>Boolean(clue?.publicShape||clue?.publicSymbol||clue?.publicTextKey)).length;
  return{
    puzzleDepth:room.puzzles.length,
    solutionLength:solution?.actions.length??0,
    objectCount:room.objects.length,
    decoyCount:room.objects.filter(object=>object.kind==='decoy').length,
    hazardCount:room.hazards.length,
    clueRedundancyPermille:clues.length?Math.floor(redundant*1000/clues.length):0,
    dependencyEdges:room.puzzles.reduce((sum,puzzle)=>sum+puzzle.prerequisitePuzzleIds.length,0),
  };
}

export function validateEscapeRoom(room:EscapeRoomDefinition,config:EscapeRoomConfig):EscapeValidation{
  const diagnostics:EscapeValidationDiagnostic[]=[];
  const allIds=[...room.objects.map(object=>object.id),...room.puzzles.map(puzzle=>puzzle.id),...room.hazards.map(hazard=>hazard.id)];
  const seen=new Set<string>();
  for(const id of allIds){
    if(seen.has(id))diagnostics.push({code:'duplicate-id',ref:id,message:`duplicate id ${id}`});
    seen.add(id);
  }
  const puzzleIds=new Set(room.puzzles.map(puzzle=>puzzle.id));
  const objectIds=new Set(room.objects.map(object=>object.id));
  for(const puzzle of room.puzzles){
    for(const prerequisite of puzzle.prerequisitePuzzleIds){
      if(!puzzleIds.has(prerequisite))diagnostics.push({code:'missing-prerequisite',ref:puzzle.id,message:`missing prerequisite ${prerequisite}`});
    }
    for(const clueId of puzzle.clueIds){
      const clue=room.objects.find(object=>object.id===clueId);
      if(!clue)diagnostics.push({code:'missing-clue',ref:puzzle.id,message:`missing clue ${clueId}`});
      else if(!clue.publicShape&&!clue.publicSymbol&&!clue.publicTextKey)diagnostics.push({code:'color-only-clue',ref:clueId,message:'mandatory clue lacks non-color cue'});
    }
    if(!objectIds.has(puzzle.targetObjectId))diagnostics.push({code:'missing-target',ref:puzzle.id,message:`missing target ${puzzle.targetObjectId}`});
  }
  const visiting=new Set<string>();
  const visited=new Set<string>();
  const map=new Map(room.puzzles.map(puzzle=>[puzzle.id,puzzle]));
  const cycle=(id:string):boolean=>{
    if(visiting.has(id))return true;
    if(visited.has(id))return false;
    visiting.add(id);
    const puzzle=map.get(id);
    if(puzzle&&puzzle.prerequisitePuzzleIds.some(cycle))return true;
    visiting.delete(id);visited.add(id);return false;
  };
  for(const id of puzzleIds){if(cycle(id)){diagnostics.push({code:'dependency-cycle',ref:id,message:'dependency cycle'});break;}}
  for(const hazard of room.hazards){
    if(hazard.telegraphTicks<3||hazard.activeTicks<1||hazard.periodTicks<=hazard.telegraphTicks+hazard.activeTicks||hazard.mandatoryPath!==false){
      diagnostics.push({code:'untelegraphed-hazard',ref:hazard.id,message:'hazard response window invalid'});
    }
  }
  if(room.objects.length>config.objectCount)diagnostics.push({code:'object-budget',ref:'room',message:'object count exceeds config'});
  if(!room.metadata.fallback&&room.puzzles.length!==config.puzzleDepth)diagnostics.push({code:'puzzle-depth',ref:'room',message:'puzzle depth mismatch'});
  const finalPuzzles=room.puzzles.filter(puzzle=>puzzle.id===room.finalPuzzleId||puzzle.kind==='final-vault');
  if(finalPuzzles.length!==1)diagnostics.push({code:'ambiguous-final-code',ref:'room',message:'room must have one final vault'});
  const solution=diagnostics.some(item=>item.code==='missing-prerequisite'||item.code==='dependency-cycle'||item.code==='missing-clue'||item.code==='missing-target'||item.code==='duplicate-id')?null:solveEscapeRoom(room);
  if(!solution)diagnostics.push({code:'unsolved-room',ref:'room',message:'no legal solution'});
  if(solution&&solution.actions.length+Math.max(10,room.hazards.length*3)>room.maxTicks)diagnostics.push({code:'timer-budget',ref:'room',message:'solution exceeds timer budget'});
  return{
    valid:diagnostics.length===0,
    diagnostics,
    solutionLength:solution?.actions.length??0,
    featureVector:escapeRoomFeatureVector(room,solution),
  };
}
