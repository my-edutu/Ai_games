import type{Direction,GameLifecycle,SnakeConfig,SnakeRunResult}from '../../../../packages/game-contracts/src/index';
export interface SnakeState{schemaVersion:1;runId:string;seed:string;tick:number;movementStep:number;lifecycle:GameLifecycle;config:SnakeConfig;snake:{body:number[];direction:Direction};food:number|null;score:number;occupancy:number;result?:SnakeRunResult;intermissionRemaining:number;meaningfulEventTick:number}
export interface SnakeEvent{seq:number;tick:number;type:string;data?:Record<string,unknown>}
