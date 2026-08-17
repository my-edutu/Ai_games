import type{ZombieConfig}from'../config/schema';
export type ZombieLifecycle='preparation'|'horde'|'result'|'intermission'|'quarantine';
export type ResourceKind='materials'|'ammo'|'medicine'|'food'|'power';
export type SurvivorRole='scout'|'builder'|'medic'|'guard';
export interface ZombieGate{id:string;cell:number;side:'north'|'east'|'south'|'west'}
export interface ZombieResourceSite{id:string;kind:ResourceKind;cell:number;stock:number}
export interface ZombieWorld{schemaVersion:1;width:number;height:number;baseCells:number[];coreCell:number;gates:ZombieGate[];resourceSites:ZombieResourceSite[];blockedCells:number[]}
export interface ZombieWorldFeatures{routeLengthMin:number;routeLengthMax:number;bottlenecks:number;coverDensityPermille:number;resourceRisk:number}
export interface ZombieGenerationDiagnostics{attempts:number;repairs:number;fallbackUsed:boolean;failedReasons:string[]}
export interface GeneratedZombieWorld{world:ZombieWorld;features:ZombieWorldFeatures;diagnostics:ZombieGenerationDiagnostics}
export interface SurvivorState{id:string;role:SurvivorRole;cell:number;health:number;stamina:number;status:'active'|'down'|'dead';action:'idle';targetCell:number|null;stuckTicks:number;intent:string}
export interface ZombieEntity{id:string;kind:'walker'|'runner'|'brute';cell:number;health:number;status:'active'|'dead'}
export interface ZombieResources{materials:number;ammo:number;medicine:number;food:number;power:number}
export interface ZombieRunResult{outcome:'evacuated'|'overrun'|'quarantined';cause:string;day:number;tick:number;survivors:number;baseIntegrity:number}
export interface ZombieStats{daysCompleted:number;hordesSurvived:number;resourcesCollected:number;wallsBuilt:number;repairs:number;zombiesDefeated:number;breaches:number;fallbackActions:number}
export interface ZombieState{schemaVersion:1;runId:string;seed:string;tick:number;lifecycle:ZombieLifecycle;phaseTick:number;day:number;config:ZombieConfig;world:ZombieWorld;features:ZombieWorldFeatures;survivors:SurvivorState[];zombies:ZombieEntity[];resources:ZombieResources;baseIntegrity:number;coreIntegrity:number;meaningfulEventTick:number;stats:ZombieStats;result?:ZombieRunResult;intermissionRemaining:number;restartIndex:number}
export interface ZombieEvent{seq:number;tick:number;type:string;data?:Record<string,unknown>}
