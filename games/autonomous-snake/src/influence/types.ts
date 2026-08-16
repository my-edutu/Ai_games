import type { BoardProfile } from '../../../../packages/game-contracts/src/index';
import type { ChatVsAiState } from '../../../../packages/interaction-core/src/index';

export type SnakeEffectId =
  | 'bonus-food' | 'safe-hint' | 'shield-token' | 'speed-shift'
  | 'fog-field' | 'obstacle-choice' | 'portal-pulse' | 'food-choice'
  | 'theme-vote' | 'next-challenge';
export type RecordCategory='standard'|'assisted'|'chat-vs-ai';
export interface EffectCandidate { id:string; effectId:SnakeEffectId; cell?:number; value?:string|number; }
export interface InfluenceCommand {
  schemaVersion:1; id:string; idempotencyKey:string; source:'vote'|'support'|'operator-fixture';
  effectId:SnakeEffectId; candidateId:string; scheduledTick:number; expiresAtTick:number; recordCategory:RecordCategory;
}
export interface InfluenceResult { commandId:string; idempotencyKey:string; effectId:SnakeEffectId; status:'applied'|'rejected'; reason:string; appliedTick:number; }
export interface InfluenceRuntimeState {
  queued:InfluenceCommand[]; applied:Record<string,InfluenceResult>; cooldowns:Record<string,number>;
  shieldCharges:number; shieldExpiresAtTick:number; safeHintUntilTick:number;
  speedPermille:number; speedUntilTick:number; fogUntilTick:number; portalPulseUntilTick:number;
  themeId:string; nextChallengeProfile:BoardProfile|null; recordCategory:RecordCategory; chatVsAi:ChatVsAiState;
}
export interface InfluenceDecision { status:'queued'|'rejected'|'duplicate'; reason:string; state:any; }
