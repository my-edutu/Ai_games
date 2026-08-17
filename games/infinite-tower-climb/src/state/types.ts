import type{TowerConfig,TowerTheme}from'../config/schema';
export type TowerLifecycle='running'|'result'|'intermission';
export type PlatformKind='solid'|'oneway'|'moving';
export type HazardKind='spikes'|'heat'|'crusher'|'lightning'|'void-pulse';
export interface Vec2{x:number;y:number}
export interface Rect{x:number;y:number;width:number;height:number}
export interface PlatformMotion{axis:'x'|'y';range:number;speed:number;phase:number}
export interface TowerPlatform extends Rect{id:string;kind:PlatformKind;motion?:PlatformMotion}
export interface TowerHazard extends Rect{id:string;kind:HazardKind;activeFromTick:number;activeEvery:number;activeFor:number;damage:number}
export interface TowerChunk{id:string;floor:number;theme:TowerTheme;baseY:number;height:number;spawn:Vec2;exitY:number;platforms:TowerPlatform[];hazards:TowerHazard[];checkpoint:Vec2;guardian:boolean;checksum:string}
export interface TowerAction{move:-1|0|1;jump:boolean;dash:boolean;attack:boolean;ability:boolean}
export type TowerResultReason='fall'|'hazard'|'health-depleted'|'timer-expired'|'stagnation'|'integrity-quarantine'|'operator-abort';
export interface TowerResult{kind:'game'|'technical'|'operator';reason:TowerResultReason;tick:number;floor:number;height:number;checksum:string}
export interface TowerPlayer{id:string;position:Vec2;velocity:Vec2;halfWidth:number;halfHeight:number;grounded:boolean;groundedPlatformId?:string;facing:-1|1;health:number;maxHealth:number;stamina:number;maxStamina:number;dashCooldown:number;invulnerableTicks:number;checkpoint:Vec2;checkpointFloor:number;state:'standing'|'airborne'|'dashing'|'hurt'|'dead';jumpCharges:number}
export interface TowerStats{floorsCleared:number;maxHeight:number;jumps:number;dashes:number;falls:number;hazardHits:number;invalidActions:number;restarts:number;checkpoints:number;technicalOutcomes:number}
export interface TowerAiState{mode:string;intent:string;confidence:number;fallbackCount:number;decisions:number;recentHeights:number[];targetPlatformId?:string}
export interface TowerState{schemaVersion:1;runId:string;seed:string;config:TowerConfig;tick:number;lifecycle:TowerLifecycle;intermissionRemaining:number;floor:number;height:number;meaningfulEventTick:number;chunks:TowerChunk[];player:TowerPlayer;stats:TowerStats;ai:TowerAiState;result?:TowerResult}
export interface TowerEvent{seq:number;tick:number;type:string;data?:Record<string,unknown>}
export interface PhysicsContact{kind:'land'|'head'|'wall'|'hazard';entityId:string;normal:Vec2}
export interface PhysicsStepResult{state:TowerState;contacts:PhysicsContact[];integrityFailure?:string}
