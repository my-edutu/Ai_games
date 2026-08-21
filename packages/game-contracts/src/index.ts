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

export interface FloorsConfig{schemaVersion:1;width:number;height:number;totalFloors:1000;intermissionTicks:number;noProgressTicks:number;maxTicksPerFloor:number;baseEnemyBudget:number;maxEnemyBudget:number;maxPlannerExpansions:number;checkpointInterval:25;sectorSize:100}
export interface FloorsAction{kind:'move'|'attack'|'guard'|'interact'|'ability'|'wait';direction?:Direction;targetCell?:number;abilityId?:string}
export interface FloorsRunResult{kind:'game'|'technical';reason:'victory'|'player-defeated'|'floor-timeout'|'stagnation'|'operator-abort'|'integrity-quarantine';tick:number;highestFloor:number;score:number;finalChecksum?:string}
