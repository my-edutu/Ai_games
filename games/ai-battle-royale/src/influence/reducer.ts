import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import { appendBattleEvent } from '../rules/events';
import type {
  BattleLootKind,
  BattleState,
  BattleTheme,
  InfluenceAuditEntry,
  InfluenceEffectId,
  ScheduledInfluenceEffect,
} from '../state/types';
import type { BattleAudienceInput } from './gateway';

const EFFECTS: readonly InfluenceEffectId[] = ['supply-rain', 'zone-hold', 'medic-mist', 'radar-pulse', 'theme-shift'];
const THEMES: readonly BattleTheme[] = ['ember', 'neon', 'arctic'];
const SUPPLY_KINDS: readonly BattleLootKind[] = ['ammo', 'shield', 'medkit'];

function isEffectId(value: unknown): value is InfluenceEffectId {
  return typeof value === 'string' && EFFECTS.includes(value as InfluenceEffectId);
}

function appendAudit(state: BattleState, entry: InfluenceAuditEntry): void {
  state.influence.audit.push(entry);
  if (state.influence.audit.length > state.config.maxAuditEntries) {
    state.influence.audit.splice(0, state.influence.audit.length - state.config.maxAuditEntries);
  }
}

function rejection(state: BattleState, input: BattleAudienceInput, reason: string) {
  appendAudit(state, { inputId: input.idempotencyKey, actorHash: input.viewerToken, tick: state.tick, status: 'rejected', reason, effectId: isEffectId(input.optionId) ? input.optionId : undefined });
  appendBattleEvent(state, { type: 'vote-rejected', detail: reason, importance: 1 });
  return { status: 'rejected' as const, reason };
}

export function openBattleVoteWindow(state: BattleState) {
  if (state.lifecycle !== 'running') return { status: 'rejected' as const, reason: 'lifecycle' };
  if (!state.influence.enabled) return { status: 'rejected' as const, reason: 'disabled' };
  if (state.influence.providerStatus !== 'online') return { status: 'rejected' as const, reason: 'provider-unavailable' };
  if (state.influence.currentWindow?.status === 'open') return { status: 'rejected' as const, reason: 'already-open' };

  state.influence.windowSequence += 1;
  const id = `vote-${state.influence.windowSequence.toString().padStart(4, '0')}-${state.tick}`;
  state.influence.currentWindow = {
    id,
    startTick: state.tick,
    endTick: state.tick + state.config.voteWindowTicks,
    options: [...EFFECTS],
    ballots: {},
    status: 'open',
    winner: null,
  };
  appendBattleEvent(state, { type: 'vote-opened', detail: id, importance: 3 });
  return { status: 'opened' as const, windowId: id };
}

export function submitBattleAudienceInput(state: BattleState, input: BattleAudienceInput) {
  if (!state.influence.enabled) return rejection(state, input, 'disabled');
  if (state.influence.providerStatus !== 'online') return rejection(state, input, 'provider-unavailable');
  if (state.lifecycle !== 'running') return rejection(state, input, 'lifecycle');
  const window = state.influence.currentWindow;
  if (!window || window.status !== 'open') return rejection(state, input, 'window-closed');
  if (state.tick < window.startTick || state.tick >= window.endTick) return rejection(state, input, 'window-closed');
  if (state.influence.processedInputIds.includes(input.idempotencyKey)) return rejection(state, input, 'duplicate');
  if (state.influence.processedInputIds.length >= state.config.maxProcessedInfluence) return rejection(state, input, 'processing-capacity');
  if (!isEffectId(input.optionId) || !window.options.includes(input.optionId)) return rejection(state, input, 'effect');
  if (input.entitlementWeight !== 1 && input.entitlementWeight !== 2) return rejection(state, input, 'entitlement-weight');
  if (window.ballots[input.viewerToken]) return rejection(state, input, 'viewer-already-voted');

  state.influence.processedInputIds.push(input.idempotencyKey);
  window.ballots[input.viewerToken] = { effectId: input.optionId, weight: input.entitlementWeight, inputId: input.idempotencyKey };
  appendAudit(state, { inputId: input.idempotencyKey, actorHash: input.viewerToken, tick: state.tick, status: 'accepted', reason: 'ballot-accepted', effectId: input.optionId });
  appendBattleEvent(state, { type: 'vote-accepted', detail: input.optionId, importance: 1 });
  return { status: 'accepted' as const, reason: 'accepted' };
}

export function scheduleBattleInfluenceEffect(state: BattleState, effectId: InfluenceEffectId, sourceWindowId: string, applyAtTick: number) {
  if (!isEffectId(effectId)) return { status: 'rejected' as const, reason: 'effect' };
  if (!Number.isInteger(applyAtTick) || applyAtTick < state.tick) return { status: 'rejected' as const, reason: 'tick' };
  if (!sourceWindowId.trim()) return { status: 'rejected' as const, reason: 'source' };

  while (state.influence.scheduled.length >= state.config.maxScheduledEffects) {
    const appliedIndex = state.influence.scheduled.findIndex((effect) => effect.applied);
    if (appliedIndex < 0) return { status: 'rejected' as const, reason: 'schedule-capacity' };
    state.influence.scheduled.splice(appliedIndex, 1);
  }

  const id = `${sourceWindowId}:${effectId}:${applyAtTick}`;
  if (state.influence.scheduled.some((effect) => effect.id === id)) return { status: 'rejected' as const, reason: 'duplicate' };
  const scheduled: ScheduledInfluenceEffect = { id, effectId, applyAtTick, sourceWindowId, applied: false };
  state.influence.scheduled.push(scheduled);
  state.influence.scheduled.sort((first, second) => first.applyAtTick - second.applyAtTick || first.id.localeCompare(second.id));
  appendAudit(state, { inputId: id, actorHash: 'audience-aggregate', tick: state.tick, status: 'queued', reason: 'effect-scheduled', effectId });
  return { status: 'scheduled' as const, effectId, id };
}

function spawnAudienceSupplies(state: BattleState, rng: NamedRng): void {
  const blocked = new Set(state.arena.obstacles);
  const occupied = new Set(state.combatants.filter((candidate) => candidate.alive).map((candidate) => candidate.cell));
  const existing = new Set(state.arena.loot.map((loot) => loot.cell));
  const candidates = state.arena.supplyAnchors.filter((cell) => !blocked.has(cell) && !occupied.has(cell) && !existing.has(cell));
  const count = Math.min(candidates.length, 1 + rng.nextInt('influence:supply-count', 3));
  for (let index = 0; index < count; index += 1) {
    const candidateIndex = rng.nextInt('influence:supply-cell', candidates.length);
    const cell = candidates.splice(candidateIndex, 1)[0];
    const kind = SUPPLY_KINDS[rng.nextInt('influence:supply-kind', SUPPLY_KINDS.length)];
    const amount = kind === 'ammo' ? 10 : kind === 'shield' ? 12 : 1;
    state.arena.loot.push({ id: `audience-supply-${state.tick}-${index}`, kind, cell, amount, spawnedAtTick: state.tick });
    appendBattleEvent(state, { type: 'supply-drop', cell, amount, detail: kind, importance: 3 });
  }
}

function applyEffect(state: BattleState, effect: ScheduledInfluenceEffect, rng: NamedRng): void {
  switch (effect.effectId) {
    case 'supply-rain':
      spawnAudienceSupplies(state, rng);
      break;
    case 'zone-hold': {
      const holdTicks = Math.max(1, Math.min(40, Math.floor(state.config.zoneShrinkInterval / 3)));
      state.zone.nextShrinkTick += holdTicks;
      state.zone.holdsApplied += 1;
      break;
    }
    case 'medic-mist':
      for (const combatant of state.combatants) {
        if (combatant.alive) combatant.health = Math.min(combatant.maxHealth, combatant.health + 5);
      }
      break;
    case 'radar-pulse':
      state.influence.radarUntilTick = Math.max(state.influence.radarUntilTick, state.tick + 30);
      break;
    case 'theme-shift': {
      const alternatives = THEMES.filter((theme) => theme !== state.influence.theme);
      state.influence.theme = alternatives[rng.nextInt('influence:theme-shift', alternatives.length)];
      break;
    }
  }

  effect.applied = true;
  appendAudit(state, { inputId: effect.id, actorHash: 'audience-aggregate', tick: state.tick, status: 'applied', reason: 'effect-applied', effectId: effect.effectId });
  appendBattleEvent(state, { type: 'influence-applied', detail: effect.effectId, importance: 3 });
  if (state.influence.currentWindow?.id === effect.sourceWindowId) state.influence.currentWindow.status = 'applied';
}

function closeVoteWindow(state: BattleState, rng: NamedRng): void {
  const window = state.influence.currentWindow;
  if (!window || window.status !== 'open' || state.tick < window.endTick) return;

  const tallies = new Map<InfluenceEffectId, number>(window.options.map((effectId) => [effectId, 0]));
  for (const ballot of Object.values(window.ballots)) tallies.set(ballot.effectId, (tallies.get(ballot.effectId) ?? 0) + ballot.weight);
  const highest = Math.max(...tallies.values());
  if (highest <= 0) {
    window.status = 'expired';
    appendBattleEvent(state, { type: 'vote-closed', detail: 'no-valid-ballots', importance: 2 });
    return;
  }

  const tied = window.options.filter((effectId) => tallies.get(effectId) === highest).sort();
  const winner = tied.length === 1 ? tied[0] : tied[rng.nextInt('influence:vote-tie', tied.length)];
  window.winner = winner;
  window.status = 'closed';
  appendBattleEvent(state, { type: 'vote-closed', detail: winner, importance: 3 });
  const decision = scheduleBattleInfluenceEffect(state, winner, window.id, state.tick);
  if (decision.status !== 'scheduled') window.status = 'expired';
}

export function advanceBattleInfluence(state: BattleState, rng: NamedRng): void {
  if (!state.influence.enabled || state.influence.providerStatus !== 'online' || state.lifecycle !== 'running') return;

  closeVoteWindow(state, rng);
  for (const effect of state.influence.scheduled) {
    if (!effect.applied && effect.applyAtTick <= state.tick) applyEffect(state, effect, rng);
  }

  if (
    state.tick > 0
    && state.tick % state.config.voteWindowEvery === 0
    && state.influence.currentWindow?.status !== 'open'
  ) {
    openBattleVoteWindow(state);
  }
  state.rng = rng.snapshot();
}

export function setBattleInfluenceEnabled(state: BattleState, enabled: boolean, reason: string): void {
  state.influence.enabled = enabled;
  if (!enabled && state.influence.currentWindow?.status === 'open') state.influence.currentWindow.status = 'expired';
  appendBattleEvent(state, { type: 'system-status', detail: `influence:${enabled ? 'enabled' : 'disabled'}:${reason.slice(0, 48)}`, importance: 2 });
}

export function setBattleInfluenceProviderStatus(state: BattleState, status: BattleState['influence']['providerStatus'], reason: string): void {
  state.influence.providerStatus = status;
  if (status !== 'online' && state.influence.currentWindow?.status === 'open') state.influence.currentWindow.status = 'expired';
  appendBattleEvent(state, { type: 'system-status', detail: `provider:${status}:${reason.slice(0, 48)}`, importance: 2 });
}
