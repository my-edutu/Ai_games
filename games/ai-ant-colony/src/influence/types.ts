import type { AntEffectId } from '../state/types';
export type AntAudienceProvider='youtube'|'twitch'|'test';
export type AntModerationStatus='pass'|'reject'|'unavailable';
export interface AntAudienceInput{schemaVersion:1;provider:AntAudienceProvider;providerEventId:string;idempotencyKey:string;viewerToken:string;authenticated:boolean;moderation:AntModerationStatus;regionAllowed:boolean;occurredTick:number;receivedTick:number;kind:'vote';optionId:AntEffectId;entitlementWeight:number}
export type AntGatewayReason='accepted'|'schema'|'provider'|'authentication'|'moderation-reject'|'moderation-unavailable'|'region'|'event-id'|'idempotency-key'|'viewer-token'|'tick'|'future'|'stale'|'kind'|'effect'|'entitlement-weight'|'duplicate'|'viewer-rate'|'global-rate';
export interface AntGatewayDecision{status:'accepted'|'rejected';reason:AntGatewayReason;input?:Readonly<AntAudienceInput>}
export interface AntGatewayOptions{maxEventAgeTicks:number;maxFutureTicks:number;perViewerWindowTicks:number;perViewerLimit:number;globalWindowTicks:number;globalLimit:number;maxSeen:number}
export interface AntVoteWindow{id:string;openTick:number;closeTick:number;options:AntEffectId[];votes:Array<{viewerToken:string;optionId:AntEffectId;weight:number;tick:number}>;maxVotes:number;resolved:boolean}
export interface AntVoteCast{viewerToken:string;optionId:AntEffectId;weight:number;tick:number}
