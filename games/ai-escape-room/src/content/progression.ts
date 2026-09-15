import type { EscapeRoomConfig, EscapeTheme } from '../../../../packages/game-contracts/src/index';
import { parseEscapeRoomConfig } from '../config/schema';

const THEME_ROTATION:readonly EscapeTheme[]=['cipher-vault','clockwork-study','chromatic-lab','archive-zero'];

function positiveInteger(value:number,name:string):number{
  if(!Number.isInteger(value)||value<1)throw new RangeError(name);
  return value;
}

export function escapeThemeForRoom(roomIndex:number):EscapeTheme{
  positiveInteger(roomIndex,'roomIndex');
  return THEME_ROTATION[(roomIndex-1)%THEME_ROTATION.length]!;
}

export function deriveEscapeDifficulty(roomIndex:number,streak:number):number{
  positiveInteger(roomIndex,'roomIndex');
  if(!Number.isInteger(streak)||streak<0)throw new RangeError('streak');
  return Math.min(20,1+Math.floor((roomIndex-1)/3)+Math.floor(streak/3));
}

export function deriveEscapeProgressionConfig(base:EscapeRoomConfig,roomIndex:number,streak:number):EscapeRoomConfig{
  const difficulty=Math.max(base.difficulty,deriveEscapeDifficulty(roomIndex,streak));
  const puzzleDepth=Math.min(12,Math.max(base.puzzleDepth,2+Math.floor((difficulty-1)/2)));
  const decoyCount=Math.min(12,Math.max(base.decoyCount,Math.floor(difficulty/3)));
  const hazardCount=Math.min(6,Math.max(base.hazardCount,Math.floor((difficulty-1)/4)));
  const objectCount=Math.min(48,Math.max(base.objectCount,puzzleDepth*2+1+decoyCount));
  const maxTicks=Math.max(base.maxTicks,120+puzzleDepth*30+hazardCount*24);
  return parseEscapeRoomConfig({...base,theme:escapeThemeForRoom(roomIndex),difficulty,puzzleDepth,decoyCount,hazardCount,objectCount,maxTicks});
}
