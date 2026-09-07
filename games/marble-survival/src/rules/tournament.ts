import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import { generateMarbleArena } from '../generation/arena';
import type { MarbleEvent, MarbleRoundResult, MarbleState, PhysicsContact } from '../state/types';

interface RuleOutput { state: MarbleState; events: Omit<MarbleEvent, 'seq'>[] }

function cloneState(state: MarbleState): MarbleState {
  return {
    ...state,
    marbles: state.marbles.map(marble => ({ ...marble, position: { ...marble.position }, velocity: { ...marble.velocity }, traits: { ...marble.traits } })),
    activeIds: [...state.activeIds],
    qualifiedIds: [...state.qualifiedIds],
    eliminatedIds: [...state.eliminatedIds],
    roundResults: state.roundResults.map(result => ({ ...result, qualifierIds: [...result.qualifierIds], eliminatedIds: [...result.eliminatedIds] })),
    records: { ...state.records },
    influence: { ...state.influence }
  };
}

function inside(position: { x: number; y: number }, zone: { x: number; y: number; width: number; height: number }): boolean {
  return position.x >= zone.x && position.x <= zone.x + zone.width && position.y >= zone.y && position.y <= zone.y + zone.height;
}

function rankActive(state: MarbleState): number[] {
  return state.activeIds.slice().sort((leftId, rightId) => {
    const left = state.marbles.find(marble => marble.id === leftId)!;
    const right = state.marbles.find(marble => marble.id === rightId)!;
    return right.progressPermille - left.progressPermille || left.position.y - right.position.y || left.id - right.id;
  });
}

function resolveRound(state: MarbleState, resolution: MarbleRoundResult['resolution']): RuleOutput {
  const next = cloneState(state);
  const ranking = [...next.qualifiedIds, ...rankActive(next).filter(id => !next.qualifiedIds.includes(id))];
  const qualifierIds = ranking.slice(0, next.currentQuota);
  const eliminatedIds = next.activeIds.filter(id => !qualifierIds.includes(id));
  for (const marble of next.marbles) {
    if (qualifierIds.includes(marble.id)) {
      marble.status = next.roundIndex === 4 ? 'champion' : 'qualified';
      marble.roundStatus = 'finished';
    } else if (next.activeIds.includes(marble.id)) {
      marble.status = 'eliminated';
      marble.roundStatus = 'out';
    }
  }
  const roundResult: MarbleRoundResult = {
    roundIndex: next.roundIndex,
    roundNumber: next.roundNumber,
    qualifierIds,
    eliminatedIds,
    resolution,
    durationTicks: next.roundTick
  };
  next.roundResults.push(roundResult);
  next.qualifiedIds = qualifierIds;
  next.eliminatedIds = [...new Set([...next.eliminatedIds, ...eliminatedIds])].sort((a, b) => a - b);
  next.meaningfulEventTick = next.tick;
  const events: Omit<MarbleEvent, 'seq'>[] = [{ tick: next.tick, type: 'round-resolved', data: { roundIndex: next.roundIndex, qualifierIds, eliminatedIds, resolution } }];
  if (next.roundIndex === 4) {
    const championId = qualifierIds[0];
    next.lifecycle = 'tournament-result';
    next.result = { kind: 'champion', championId, tournamentTicks: next.tournamentTick, recordCategory: next.records.category };
    const previousChampionId = next.records.lastChampionId;
    next.records.championStreak = previousChampionId === championId ? next.records.championStreak + 1 : 1;
    next.records.lastChampionId = championId;
    if (next.records.eligible && (next.records.fastestTournamentTicks === null || next.tournamentTick < next.records.fastestTournamentTicks)) next.records.fastestTournamentTicks = next.tournamentTick;
    events.push({ tick: next.tick, type: 'tournament-champion', data: { championId, tournamentTicks: next.tournamentTick, recordCategory: next.records.category } });
  } else {
    next.lifecycle = 'round-result';
  }
  return { state: next, events };
}

export function applyTournamentRules(state: MarbleState, contacts: PhysicsContact[]): RuleOutput {
  let next = cloneState(state);
  const events: Omit<MarbleEvent, 'seq'>[] = [];
  const activeMarbles = next.marbles.filter(marble => marble.status === 'active' && marble.roundStatus === 'racing').sort((a, b) => a.id - b.id);
  for (const marble of activeMarbles) {
    const oldProgress = marble.progressPermille;
    const totalDistance = next.arena.spawnY - next.arena.finishY;
    marble.progressPermille = Math.max(0, Math.min(1_000, Math.round(((next.arena.spawnY - marble.position.y) * 1_000) / totalDistance)));
    if (marble.progressPermille > oldProgress) marble.lastProgressTick = next.tick;
    while (marble.checkpointIndex < next.arena.checkpoints.length && marble.position.y <= next.arena.checkpoints[marble.checkpointIndex].y) {
      marble.checkpointIndex++;
      next.meaningfulEventTick = next.tick;
      events.push({ tick: next.tick, type: 'checkpoint-reached', data: { marbleId: marble.id, checkpointIndex: marble.checkpointIndex } });
    }
    const hazard = next.arena.hazards.find(zone => inside(marble.position, zone));
    if (hazard) {
      if (marble.shieldCharges > 0) {
        marble.shieldCharges--;
        marble.recoveryCount++;
        marble.position.y += next.config.marbleRadius * 3;
        marble.velocity.y = Math.abs(marble.velocity.y);
        events.push({ tick: next.tick, type: 'shield-recovery', data: { marbleId: marble.id, hazardId: hazard.id } });
      } else {
        marble.status = 'eliminated';
        marble.roundStatus = 'out';
        next.activeIds = next.activeIds.filter(id => id !== marble.id);
        next.eliminatedIds = [...new Set([...next.eliminatedIds, marble.id])].sort((a, b) => a - b);
        next.meaningfulEventTick = next.tick;
        events.push({ tick: next.tick, type: 'marble-eliminated', data: { marbleId: marble.id, cause: hazard.kind, hazardId: hazard.id } });
        continue;
      }
    }
    if (marble.position.y <= next.arena.finishY + next.config.marbleRadius && marble.roundStatus === 'racing') {
      marble.roundStatus = 'finished';
      marble.status = 'qualified';
      marble.finishTick = next.tick;
      marble.finishRank = next.qualifiedIds.length + 1;
      marble.progressPermille = 1_000;
      next.qualifiedIds.push(marble.id);
      next.activeIds = next.activeIds.filter(id => id !== marble.id);
      next.meaningfulEventTick = next.tick;
      events.push({ tick: next.tick, type: 'marble-qualified', data: { marbleId: marble.id, finishRank: marble.finishRank } });
    }
  }
  for (const contact of contacts) events.push({ tick: next.tick, type: 'physics-contact', data: { kind: contact.kind, marbleId: contact.marbleId, otherMarbleId: contact.otherMarbleId, colliderId: contact.colliderId, impulse: contact.impulse } });
  if (next.qualifiedIds.length >= next.currentQuota) {
    const resolved = resolveRound(next, 'quota');
    return { state: resolved.state, events: [...events, ...resolved.events] };
  }
  const remainingPotential = next.qualifiedIds.length + next.activeIds.length;
  if (remainingPotential <= next.currentQuota && remainingPotential > 0) {
    const resolved = resolveRound(next, 'last-standing');
    return { state: resolved.state, events: [...events, ...resolved.events] };
  }
  if (next.roundTick >= next.config.roundTimeoutTicks) {
    const resolved = resolveRound(next, 'timeout');
    return { state: resolved.state, events: [...events, ...resolved.events] };
  }
  return { state: next, events };
}

export function advanceMarbleRound(state: MarbleState, rng: NamedRng): RuleOutput {
  const next = cloneState(state);
  const nextRoundIndex = next.roundIndex + 1;
  const arena = generateMarbleArena(next.config, nextRoundIndex, rng);
  const activeIds = [...next.qualifiedIds].sort((a, b) => a - b);
  next.roundIndex = nextRoundIndex;
  next.roundNumber = nextRoundIndex + 1;
  next.currentQuota = next.config.roundQuotas[nextRoundIndex];
  next.roundTick = 0;
  next.roundIntroRemaining = next.config.roundIntroTicks;
  next.lifecycle = 'active';
  next.arena = arena;
  next.activeIds = activeIds;
  next.qualifiedIds = [];
  for (const marble of next.marbles) {
    if (activeIds.includes(marble.id)) {
      const position = arena.spawnPoints[activeIds.indexOf(marble.id)];
      marble.status = 'active';
      marble.roundStatus = 'racing';
      marble.position = { ...position };
      marble.velocity = { x: 0, y: 0 };
      marble.checkpointIndex = 0;
      marble.progressPermille = 0;
      marble.finishTick = null;
      marble.finishRank = null;
      marble.intent = 'holding-line';
      marble.confidence = 'medium';
      marble.lastProgressTick = next.tick;
    } else if (marble.status !== 'champion') {
      marble.status = 'eliminated';
      marble.roundStatus = 'out';
    }
  }
  next.meaningfulEventTick = next.tick;
  return { state: next, events: [{ tick: next.tick, type: 'round-started', data: { roundIndex: nextRoundIndex, activeIds, quota: next.currentQuota, arena: arena.archetype } }] };
}
