import type{ZombieConfig}from'../config/schema';

export type ZombieLifecycle='preparation'|'horde'|'result'|'intermission'|'quarantine';
export type ResourceKind='materials'|'ammo'|'medicine'|'food'|'power';
export type SurvivorRole='scout'|'builder'|'medic'|'guard';
export type ZombieWeather='clear'|'rain'|'fog'|'heat';
export type ZombieStrategy='fortify'|'stockpile'|'balanced'|'rescue'|'last-stand';
export type SurvivorAction='idle'|'scavenge'|'deliver'|'build'|'repair'|'heal'|'rest'|'guard'|'attack'|'retreat'|'reposition';
export type ZombieInfluenceEffectId='supply-priority'|'fortification-sector'|'scout-route'|'spotlight'|'generator-boost'|'medicine-cache'|'ammo-cache'|'fog-bank'|'runner-surge'|'next-weather';
export type ZombieInfluenceSource='free-vote'|'support'|'operator-fixture';

export interface ZombieGate{id:string;cell:number;side:'north'|'east'|'south'|'west'}
export interface ZombieResourceSite{id:string;kind:ResourceKind;cell:number;stock:number}
export interface ZombieWorld{schemaVersion:1;width:number;height:number;baseCells:number[];coreCell:number;gates:ZombieGate[];resourceSites:ZombieResourceSite[];blockedCells:number[]}
export interface ZombieWorldFeatures{routeLengthMin:number;routeLengthMax:number;bottlenecks:number;coverDensityPermille:number;resourceRisk:number}
export interface ZombieGenerationDiagnostics{attempts:number;repairs:number;fallbackUsed:boolean;failedReasons:string[]}
export interface GeneratedZombieWorld{world:ZombieWorld;features:ZombieWorldFeatures;diagnostics:ZombieGenerationDiagnostics}
export interface CarriedResource{kind:ResourceKind;amount:number}
export interface SurvivorState{id:string;role:SurvivorRole;cell:number;health:number;stamina:number;status:'active'|'down'|'dead';action:SurvivorAction;targetCell:number|null;targetId:string|null;carrying:CarriedResource|null;cooldown:number;stuckTicks:number;decisions:number;fallbacks:number;intent:string;confidence:number}
export interface ZombieEntity{id:string;kind:'walker'|'runner'|'brute';cell:number;health:number;maxHealth:number;status:'active'|'dead';gateId:string;moveCooldown:number;attackCooldown:number}
export interface ZombieDefense{id:string;gateId:string;cell:number;integrity:number;maxIntegrity:number;level:number}
export interface ZombieResources{materials:number;ammo:number;medicine:number;food:number;power:number}
export interface ZombieHordeState{totalForNight:number;spawned:number;defeated:number;escaped:number;composition:{walker:number;runner:number;brute:number}}
export interface ZombieRunResult{outcome:'evacuated'|'overrun'|'quarantined';cause:string;day:number;tick:number;survivors:number;baseIntegrity:number}
export interface ZombieStats{daysCompleted:number;hordesSurvived:number;resourcesCollected:number;resourcesDelivered:number;wallsBuilt:number;repairs:number;healing:number;zombiesDefeated:number;breaches:number;damageTaken:number;fallbackActions:number;starvationEvents:number}
export interface ZombieInfluenceCommand{schemaVersion:1;id:string;effectId:ZombieInfluenceEffectId;candidateId:string;payload:Record<string,unknown>;issuedAtTick:number;scheduledTick:number;expiresAtTick:number;source:ZombieInfluenceSource;recordCategory:'audience-influenced'}
export interface ZombieInfluenceRecord{id:string;effectId:ZombieInfluenceEffectId|'reversal';candidateId:string;tick:number;status:'applied'|'expired'|'rejected'|'reversed'|'refused-irreversible';source:ZombieInfluenceSource|'reversal';applicationCount:number;targetCommandId?:string;reason?:string}
export interface ZombieInfluenceState{schemaVersion:1;queued:ZombieInfluenceCommand[];applied:Record<string,ZombieInfluenceRecord>;seenIds:string[];recordCategory:'baseline'|'audience-influenced';maxQueued:number;maxApplied:number;cooldownUntil:Partial<Record<ZombieInfluenceEffectId,number>>;effectCounts:Partial<Record<ZombieInfluenceEffectId,number>>;supplyPriority:ResourceKind|null;scoutRouteCell:number|null;spotlightUntilTick:number;generatorBoostUntilTick:number;fogUntilTick:number;runnerSurgePending:number;nextWeather:ZombieWeather|null}
export interface ZombieState{schemaVersion:1;runId:string;seed:string;tick:number;lifecycle:ZombieLifecycle;phaseTick:number;day:number;config:ZombieConfig;world:ZombieWorld;features:ZombieWorldFeatures;survivors:SurvivorState[];zombies:ZombieEntity[];defenses:ZombieDefense[];resources:ZombieResources;weather:ZombieWeather;strategy:ZombieStrategy;horde:ZombieHordeState;baseIntegrity:number;coreIntegrity:number;meaningfulEventTick:number;stats:ZombieStats;influence:ZombieInfluenceState;result?:ZombieRunResult;intermissionRemaining:number;restartIndex:number}
export interface ZombieEvent{seq:number;tick:number;type:string;data?:Record<string,unknown>}
