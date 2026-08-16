export type Direction='up'|'down'|'left'|'right';
export type GameLifecycle='running'|'result'|'intermission';
export interface SnakeAction{direction:Direction}
export interface SnakeConfig{schemaVersion:1;width:number;height:number;targetLength:number;initialLength:number;intermissionTicks:number}
export interface SnakeRunResult{kind:'game';reason:'wall-collision'|'self-collision'|'victory';tick:number;score:number;length:number;finalChecksum?:string}
