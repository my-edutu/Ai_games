export type Direction='up'|'down'|'left'|'right';
export type GameLifecycle='running'|'result'|'intermission';
export interface SnakeAction{direction:Direction}
export type BoardProfile='open'|'corridors'|'rings'|'chambers'|'portals';
export interface SnakeConfig{schemaVersion:1;width:number;height:number;targetLength:number;initialLength:number;intermissionTicks:number;profile:BoardProfile;hazardCount:number;hazardPeriod:number;hazardActiveTicks:number;specialFoodEvery:number;specialFoodLifetime:number;noProgressTicks:number}
export interface SnakeRunResult{kind:'game';reason:'wall-collision'|'obstacle-collision'|'hazard-collision'|'self-collision'|'stagnation'|'victory';tick:number;score:number;length:number;finalChecksum?:string}

export type MazeProfile='tree'|'loops'|'chambers'|'layers'|'hunter';
export type MazeIntentMode='oracle-test'|'exploring'|'returning-key'|'unlocking-route'|'searching-exit'|'evading-threat'|'revising-map'|'fallback'|'escaped';
export interface MazeConfig{schemaVersion:1;width:number;height:number;profile:MazeProfile;level:number;intermissionTicks:number;maxTicks:number;visibilityRadius:number;loopChancePermille:number;keyCount:number;trapCount:number;threatCount:number;memoryTtl:number;noProgressTicks:number;repairAttempts:number}
export interface MazeAction{kind:'move'|'wait'|'interact';direction?:Direction;targetCell?:number}
export interface MazeRunResult{kind:'game'|'technical';reason:'escape'|'trap-death'|'capture'|'timer-expired'|'stagnation'|'operator-abort'|'integrity-quarantine';tick:number;steps:number;discoveryPermille:number;routeLength:number;finalChecksum?:string}

export type EscapeTheme='cipher-vault'|'clockwork-study'|'chromatic-lab'|'archive-zero';
export type EscapeStrategy='balanced'|'curious'|'cautious';
export type EscapeAction=
  |{kind:'inspect';targetId:string}
  |{kind:'take';targetId:string}
  |{kind:'combine';targetId:string;withId:string}
  |{kind:'use';targetId:string;itemId:string}
  |{kind:'enter-code';targetId:string;code:string}
  |{kind:'activate';targetId:string;option:string}
  |{kind:'wait'}
  |{kind:'exit';targetId:string};
export interface EscapeRoomConfig{
  schemaVersion:1;
  theme:EscapeTheme;
  strategy:EscapeStrategy;
  difficulty:number;
  maxTicks:number;
  intermissionTicks:number;
  puzzleDepth:number;
  objectCount:number;
  decoyCount:number;
  hazardCount:number;
  hintBudget:number;
  generationAttempts:number;
  noProgressTicks:number;
  factHistoryLimit:number;
  commandHistoryLimit:number;
}
export interface EscapeRunResult{
  kind:'game'|'technical';
  reason:'escape'|'timer-expired'|'hazard-failure'|'stagnation'|'operator-abort'|'integrity-quarantine';
  tick:number;
  roomIndex:number;
  score:number;
  solvedPuzzles:number;
  finalChecksum?:string;
}
