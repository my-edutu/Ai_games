import type{FloorsAction,FloorsConfig,FloorsRunResult,GameLifecycle}from '../../../../packages/game-contracts/src/index';

export type CellIndex=number;
export type FloorArchetype='corridor'|'chambers'|'crossroads'|'arena'|'warden'|'architect';
export type EnemyKind='sentinel'|'striker'|'leech'|'warden'|'architect';
export type HazardKind='spike'|'heat'|'beam'|'null'|'storm'|'snare';

export interface FloorEnemy{
  id:string;
  kind:EnemyKind;
  cell:CellIndex;
  health:number;
  maxHealth:number;
  attack:number;
  armor:number;
  telegraph:'idle'|'pursue'|'guard'|'attack'|'charge';
  cooldown:number;
}

export interface FloorHazard{
  id:string;
  kind:HazardKind;
  cell:CellIndex;
  damage:number;
  period:number;
  phase:number;
}

export interface GeneratedFloor{
  number:number;
  sector:number;
  archetype:FloorArchetype;
  width:number;
  height:number;
  start:CellIndex;
  exit:CellIndex;
  mandatoryPath:CellIndex[];
  walls:CellIndex[];
  enemies:FloorEnemy[];
  hazards:FloorHazard[];
  rewardCells:CellIndex[];
  objective:'reach-exit'|'defeat-warden'|'defeat-architect';
  objectiveComplete:boolean;
  featureReport:{pathLength:number;branchCells:number;enemyBudget:number;hazardCount:number;repairCount:number;fallbackUsed:boolean};
  ticks:number;
}

export interface FloorsPlayer{
  cell:CellIndex;
  health:number;
  maxHealth:number;
  energy:number;
  maxEnergy:number;
  attack:number;
  armor:number;
  shield:number;
  credits:number;
  modules:string[];
  guarding:boolean;
}

export interface FloorsAiState{
  mode:'initializing'|'fallback'|'tactical'|'recovery'|'complete';
  goal:string;
  intent:string;
  obstacle:string|null;
  confidence:'low'|'medium'|'high';
  plan:number[];
  decisions:number;
  replans:number;
  fallbackCount:number;
  repeatedStateCount:number;
  nodeExpansions:number;
  lastPlanChangeReason:string;
}

export interface FloorsInfluenceState{
  queued:unknown[];
  applied:Record<string,number>;
  cooldowns:Record<string,number>;
  pressure:number;
  themeId:string;
}

export interface FloorsState{
  schemaVersion:1;
  runId:string;
  seed:string;
  tick:number;
  lifecycle:GameLifecycle;
  config:FloorsConfig;
  floor:GeneratedFloor;
  player:FloorsPlayer;
  ai:FloorsAiState;
  influence:FloorsInfluenceState;
  score:number;
  highestFloor:number;
  floorsCleared:number;
  floorStartedTick:number;
  meaningfulEventTick:number;
  checkpointFloor:number;
  eventSequence:number;
  intermissionRemaining:number;
  result?:FloorsRunResult;
}

export interface FloorsEvent{
  seq:number;
  tick:number;
  type:string;
  data?:Record<string,unknown>;
}

export interface FloorsDecision{
  action:FloorsAction;
  mode:string;
  confidence:'low'|'medium'|'high';
  intent:string;
  reason:string;
  expansions:number;
}
