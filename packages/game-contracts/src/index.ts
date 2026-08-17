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

export type TrafficCityProfile='grid'|'arterial'|'ring'|'mixed';
export interface TrafficConfig{schemaVersion:1;width:number;height:number;profile:TrafficCityProfile;laneLength:number;tickRate:number;maxVehicles:number;spawnEveryTicks:number;pendingDemandCap:number;runTicks:number;intermissionTicks:number;maxGridlockTicks:number;signalMinGreenTicks:number;signalMaxGreenTicks:number;decisionIntervalTicks:number;rerouteWaitTicks:number;incidentEveryTicks:number;incidentDurationTicks:number;difficulty:number}
export interface TrafficRunResult{kind:'game'|'technical';reason:'cycle-complete'|'gridlock'|'operator-abort'|'integrity-quarantine';tick:number;mobilityScore:number;completedTrips:number;averageDelayTicks:number;finalChecksum?:string}
