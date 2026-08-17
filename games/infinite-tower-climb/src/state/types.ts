import type{TowerConfig,TowerTheme}from'../config/schema';
export type TowerLifecycle='running'|'result'|'intermission';
export type PlatformKind='solid'|'oneway'|'moving';
export type HazardKind='spikes'|'heat'|'crusher'|'lightning'|'void-pulse';
export type EnemyKind='sentinel'|'shooter'|'guardian';
export type PickupKind='health'|'stamina'|'shard';
export type UpgradeFamily='mobility'|'survival'|'offense'|'utility'|'risk';
export interface Vec2{x:number;y:number}
export interface Rect{x:number;y:number;width:number;height:number}
export interface PlatformMotion{axis:'x'|'y';range:number;speed:number;phase:number}
export interface TowerPlatform extends Rect{id:string;kind:PlatformKind;motion?:PlatformMotion}
export interface TowerHazard extends Rect{id:string;kind:HazardKind;activeFromTick:number;activeEvery:number;activeFor:number;damage:number}
export interface TowerChunk{id:string;floor:number;theme:TowerTheme;baseY:number;height:number;spawn:Vec2;exitY:number;platforms:TowerPlatform[];hazards:TowerHazard[];checkpoint:Vec2;guardian:boolean;checksum:string}
export interface TowerAction{move:-1|0|1;jump:boolean;dash:boolean;attack:boolean;ability:boolean;upgradeChoice?:string}
export type TowerResultReason='fall'|'hazard'|'health-depleted'|'timer-expired'|'stagnation'|'integrity-quarantine'|'operator-abort';
export interface TowerResult{kind:'game'|'technical'|'operator';reason:TowerResultReason;tick:number;floor:number;height:number;checksum:string}
export interface TowerPlayer{id:string;position:Vec2;velocity:Vec2;halfWidth:number;halfHeight:number;grounded:boolean;groundedPlatformId?:string;facing:-1|1;health:number;maxHealth:number;stamina:number;maxStamina:number;dashCooldown:number;attackCooldown:number;abilityCooldown:number;invulnerableTicks:number;shieldCharges:number;checkpoint:Vec2;checkpointFloor:number;state:'standing'|'airborne'|'dashing'|'hurt'|'dead';jumpCharges:number;score:number}
export interface TowerEnemy{id:string;kind:EnemyKind;floor:number;position:Vec2;velocity:Vec2;halfWidth:number;halfHeight:number;health:number;maxHealth:number;facing:-1|1;patrolMinX:number;patrolMaxX:number;cooldown:number;telegraphUntilTick:number;active:boolean;damage:number}
export interface TowerProjectile{id:string;owner:'player'|'enemy';floor:number;position:Vec2;velocity:Vec2;halfWidth:number;halfHeight:number;damage:number;ttl:number;active:boolean;hitIds:string[]}
export interface TowerPickup{id:string;kind:PickupKind;floor:number;position:Vec2;value:number;collected:boolean}
export interface TowerBuild{upgradeIds:string[];families:UpgradeFamily[];attackDamage:number;attackReachBonus:number;airControlPermille:number;dashCost:number;dashCooldownReduction:number;scoreMultiplierPermille:number;pickupRadius:number}
export interface TowerUpgradeOffer{id:string;family:UpgradeFamily;name:string;description:string;modifiers:Partial<Omit<TowerBuild,'upgradeIds'|'families'>>;maxHealthBonus?:number;shieldCharges?:number}
export interface TowerStats{floorsCleared:number;maxHeight:number;jumps:number;dashes:number;falls:number;hazardHits:number;invalidActions:number;restarts:number;checkpoints:number;technicalOutcomes:number;enemiesDefeated:number;guardiansDefeated:number;damageDealt:number;damageTaken:number;pickupsCollected:number;upgradesApplied:number;stuckRecoveries:number;projectilesFired:number}
export interface TowerAiState{mode:string;intent:string;confidence:number;fallbackCount:number;decisions:number;recentHeights:number[];targetPlatformId?:string;lastInvalidation?:string;nodeExpansions:number}
export interface TowerState{schemaVersion:1;runId:string;seed:string;config:TowerConfig;tick:number;lifecycle:TowerLifecycle;intermissionRemaining:number;floor:number;height:number;meaningfulEventTick:number;chunks:TowerChunk[];player:TowerPlayer;enemies:TowerEnemy[];projectiles:TowerProjectile[];pickups:TowerPickup[];build:TowerBuild;pendingUpgradeOffers:TowerUpgradeOffer[];lastUpgradeId?:string;stats:TowerStats;ai:TowerAiState;result?:TowerResult}
export interface TowerEvent{seq:number;tick:number;type:string;data?:Record<string,unknown>}
export interface PhysicsContact{kind:'land'|'head'|'wall'|'hazard';entityId:string;normal:Vec2}
export interface PhysicsStepResult{state:TowerState;contacts:PhysicsContact[];integrityFailure?:string}
