export type Direction='up'|'down'|'left'|'right';
export type GameLifecycle='running'|'result'|'intermission';
export interface SnakeAction{direction:Direction}
export type BoardProfile='open'|'corridors'|'rings'|'chambers'|'portals';
export interface SnakeConfig{schemaVersion:1;width:number;height:number;targetLength:number;initialLength:number;intermissionTicks:number;profile:BoardProfile;hazardCount:number;hazardPeriod:number;hazardActiveTicks:number;specialFoodEvery:number;specialFoodLifetime:number;noProgressTicks:number}
export interface SnakeRunResult{kind:'game';reason:'wall-collision'|'obstacle-collision'|'hazard-collision'|'self-collision'|'stagnation'|'victory';tick:number;score:number;length:number;finalChecksum?:string}
