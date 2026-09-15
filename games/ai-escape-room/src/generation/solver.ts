import type { EscapeAction } from '../../../../packages/game-contracts/src/index';
import type { EscapeRoomDefinition, EscapeSolution } from '../state/types';
import { actionForPuzzle } from './templates';

export function solveEscapeRoom(room:EscapeRoomDefinition):EscapeSolution|null{
  const byId=new Map(room.puzzles.map(puzzle=>[puzzle.id,puzzle]));
  const objectIds=new Set(room.objects.map(object=>object.id));
  const solved=new Set<string>();
  const actions:EscapeAction[]=[];
  let safety=room.puzzles.length*room.puzzles.length+1;
  while(solved.size<room.puzzles.length&&safety-->0){
    let progressed=false;
    for(const puzzle of [...room.puzzles].sort((a,b)=>a.stage-b.stage||a.id.localeCompare(b.id))){
      if(solved.has(puzzle.id))continue;
      if(!puzzle.prerequisitePuzzleIds.every(id=>solved.has(id)))continue;
      if(!puzzle.prerequisitePuzzleIds.every(id=>byId.has(id)))return null;
      if(!puzzle.clueIds.every(id=>objectIds.has(id))||!objectIds.has(puzzle.targetObjectId))return null;
      for(const clueId of puzzle.clueIds){
        actions.push({kind:'inspect',targetId:clueId});
        const clue=room.objects.find(object=>object.id===clueId);
        if(clue?.portable)actions.push({kind:'take',targetId:clueId});
      }
      actions.push(actionForPuzzle(puzzle.kind,puzzle.targetObjectId,puzzle.solution,puzzle.clueIds[0]!));
      solved.add(puzzle.id);
      progressed=true;
    }
    if(!progressed)break;
  }
  if(solved.size!==room.puzzles.length||!objectIds.has(room.exitObjectId))return null;
  actions.push({kind:'exit',targetId:room.exitObjectId});
  return{actions,solvedPuzzleIds:[...solved]};
}
