import type { EscapePuzzleKind } from '../state/types';

export const ESCAPE_PUZZLE_KINDS:readonly EscapePuzzleKind[]=[
  'sequence-lock','symbol-cipher','shape-order','tool-dependency',
  'switch-network','balance-clue','direction-pattern','final-vault',
];

export function targetKindForPuzzle(kind:EscapePuzzleKind){
  if(kind==='switch-network')return 'switch' as const;
  if(kind==='balance-clue')return 'scale' as const;
  if(kind==='final-vault')return 'vault' as const;
  return 'lock' as const;
}

export function clueKindForPuzzle(kind:EscapePuzzleKind){
  return kind==='tool-dependency'?'tool' as const:'clue' as const;
}

export function actionForPuzzle(kind:EscapePuzzleKind,targetId:string,solution:string,clueId:string){
  if(kind==='tool-dependency')return {kind:'use' as const,targetId,itemId:clueId};
  if(kind==='switch-network'||kind==='balance-clue')return {kind:'activate' as const,targetId,option:solution};
  return {kind:'enter-code' as const,targetId,code:solution};
}
