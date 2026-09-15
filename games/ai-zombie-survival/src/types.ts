export type DayPhase='dawn'|'day'|'sunset'|'night';
export type SurvivorRole='scout'|'medic'|'defender'|'scavenger'|'engineer'|'leader';
export type SurvivorAction='idle'|'move'|'scavenge'|'aim'|'attack'|'reload'|'repair'|'retreat'|'heal'|'rescue'|'injured'|'dead';
export type ZombieAction='wander'|'detect'|'pursue'|'attack'|'stagger'|'dead';
export type ZombieArchetype='shambler'|'runner'|'brute';
export type DistrictKind='residential'|'commercial'|'industrial'|'medical'|'civic'|'outskirts';
export type CivilianState='trapped'|'following'|'escorting'|'safe'|'dead';
export type Milestone='holdout'|'secured'|'scarcity'|'siege'|'veteran';
export type DramaticPattern='fortify'|'scavenge-risk'|'collapse-recovery'|'last-stand';
export interface Vec2{x:number;y:number}
export interface Survivor extends Vec2{id:string;name:string;role:SurvivorRole;action:SurvivorAction;health:number;stamina:number;infection:number;morale:number;ammo:number;carrying:number;threat:number;targetX:number;targetY:number;facing:number;cooldown:number;kills:number;rescued:number;alive:boolean;goal:string;intent:string;confidence:number;fallback:boolean;planAgeTicks:number;stuckTicks:number;lastPlanX:number;lastPlanY:number;insideBuildingId:string|null;escortCivilianId:string|null}
export interface Civilian extends Vec2{id:string;name:string;state:CivilianState;health:number;facing:number;escortId:string|null;buildingId:string|null;panic:number}
export interface Zombie extends Vec2{id:string;action:ZombieAction;health:number;maxHealth:number;speed:number;facing:number;variant:number;archetype:ZombieArchetype;targetId:string|null;distanceToSafeHouse:number;stagger:number}
export interface Barricade extends Vec2{id:string;angle:number;hp:number;maxHp:number;material:'wood'|'metal'|'vehicle'}
export interface LootNode extends Vec2{id:string;kind:keyof Resources;amount:number;searched:number;buildingId:string}
export interface Building extends Vec2{id:string;district:DistrictKind;kind:'apartment'|'shop'|'supermarket'|'hospital'|'police'|'warehouse'|'fuel'|'safehouse';w:number;h:number;floors:number;damage:number;roofVisible:boolean;interiorLit:boolean}
export interface District{id:string;kind:DistrictKind;x:number;y:number;w:number;h:number}
export type GameEventType='shot'|'hit'|'kill'|'loot'|'heal'|'barricade-hit'|'barricade-repair'|'near-death'|'rescue'|'horde'|'phase'|'milestone'|'resource-low'|'recovery'|'interaction'|'safehouse-upgrade'|'civilian-found';
export interface GameEvent{id:number;time:number;type:GameEventType;x:number;y:number;actorId?:string;targetId?:string;value?:number}
export interface AuditEntry{externalId:string;type:string;acceptedMagnitude:number;tick:number;status:'applied'|'cooldown'|'rejected';reason?:string}
export interface Resources{food:number;water:number;medicine:number;ammo:number;materials:number;fuel:number}
export interface TimeState{elapsed:number;day:number;phase:DayPhase;phaseProgress:number}
export interface WeatherState{kind:'clear'|'rain'|'fog'|'storm';intensity:number}
export interface ProgressionState{milestone:Milestone;nextMilestoneDay:number;lastMeaningfulTick:number;quietUntilTick:number;pattern:DramaticPattern}
export interface ObjectiveState{kind:'rescue'|'fortify'|'scavenge'|'survive';targetId:string|null;label:string;progress:number}
export interface GameState{version:3;seed:number;rng:number;tick:number;status:'running'|'overrun'|'evacuated';survivors:Survivor[];civilians:Civilian[];zombies:Zombie[];barricades:Barricade[];loot:LootNode[];buildings:Building[];districts:District[];resources:Resources;time:TimeState;weather:WeatherState;safeHouse:{x:number;y:number;radius:number;integrity:number;level:number;storageCapacity:number;features:string[]};events:GameEvent[];audit:AuditEntry[];eventSeq:number;hordePressure:number;progression:ProgressionState;objective:ObjectiveState;score:{kills:number;rescued:number;longestSurvival:number;hordesSurvived:number}}
export interface GameConfig{seed?:number;zombieCount?:number;survivorCount?:number}
export interface ViewerInfluence{id:string;type:'supply-drop'|'district-pressure'|'camera-focus';magnitude:number}
export interface CameraEvent{mode:'squad'|'survivor-follow'|'horde-overview'|'defense'|'scavenge'|'rescue'|'interior'|'near-death'|'failure';targetId:string|null;score:number}
