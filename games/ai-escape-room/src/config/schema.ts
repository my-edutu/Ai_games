import type { EscapeRoomConfig, EscapeStrategy, EscapeTheme } from '../../../../packages/game-contracts/src/index';

const THEMES:readonly EscapeTheme[]=['cipher-vault','clockwork-study','chromatic-lab','archive-zero'];
const STRATEGIES:readonly EscapeStrategy[]=['balanced','curious','cautious'];

export const DEFAULT_ESCAPE_ROOM_CONFIG:EscapeRoomConfig=Object.freeze({
  schemaVersion:1,
  theme:'cipher-vault',
  strategy:'balanced',
  difficulty:6,
  maxTicks:1800,
  intermissionTicks:120,
  puzzleDepth:6,
  objectCount:20,
  decoyCount:3,
  hazardCount:1,
  hintBudget:2,
  generationAttempts:8,
  noProgressTicks:240,
  factHistoryLimit:128,
  commandHistoryLimit:512,
});

function integer(value:unknown,name:string,min:number,max:number):number{
  if(!Number.isInteger(value)||Number(value)<min||Number(value)>max)throw new RangeError(name);
  return Number(value);
}

export function parseEscapeRoomConfig(input:unknown):EscapeRoomConfig{
  if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('config');
  const value=input as Record<string,unknown>;
  if(value.schemaVersion!==1)throw new RangeError('schemaVersion');
  if(!THEMES.includes(value.theme as EscapeTheme))throw new RangeError('theme');
  if(!STRATEGIES.includes(value.strategy as EscapeStrategy))throw new RangeError('strategy');
  return{
    schemaVersion:1,
    theme:value.theme as EscapeTheme,
    strategy:value.strategy as EscapeStrategy,
    difficulty:integer(value.difficulty,'difficulty',1,20),
    maxTicks:integer(value.maxTicks,'maxTicks',50,1_000_000),
    intermissionTicks:integer(value.intermissionTicks,'intermissionTicks',0,10_000),
    puzzleDepth:integer(value.puzzleDepth,'puzzleDepth',2,12),
    objectCount:integer(value.objectCount,'objectCount',6,48),
    decoyCount:integer(value.decoyCount,'decoyCount',0,12),
    hazardCount:integer(value.hazardCount,'hazardCount',0,6),
    hintBudget:integer(value.hintBudget,'hintBudget',0,6),
    generationAttempts:integer(value.generationAttempts,'generationAttempts',1,32),
    noProgressTicks:integer(value.noProgressTicks,'noProgressTicks',20,100_000),
    factHistoryLimit:integer(value.factHistoryLimit,'factHistoryLimit',16,512),
    commandHistoryLimit:integer(value.commandHistoryLimit,'commandHistoryLimit',16,4_096),
  };
}
