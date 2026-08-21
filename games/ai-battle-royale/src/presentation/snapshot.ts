import type {
  BattleArchetype,
  BattleIntent,
  BattleLifecycle,
  BattleLootKind,
  BattleSemanticEvent,
  BattleState,
  BattleTheme,
  BattleWeapon,
  InfluenceEffectId,
} from '../state/types';
import { fnv1aHex, stableStringify } from '../rules/checksum';

export type BattlePublicScene = 'battle' | 'final-circle' | 'vote' | 'result' | 'intermission' | 'recovery';

export interface BattlePublicEvent {
  sequence: number;
  tick: number;
  type: string;
  actorId?: string;
  targetId?: string;
  cell?: number;
  amount?: number;
  detail?: string;
  importance: 1 | 2 | 3 | 4 | 5;
}

export interface BattleRenderLoot {
  id: string;
  kind: BattleLootKind;
  cell: number;
  weapon?: BattleWeapon;
  amount: number;
}

export interface BattleRenderCombatant {
  id: string;
  name: string;
  archetype: BattleArchetype;
  cell: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  alive: boolean;
  weapon: BattleWeapon;
  ammo: number;
  medkits: number;
  eliminations: number;
  damageDealt: number;
  intent: BattleIntent;
  goal: string;
  confidence: number;
}

export interface BattleVoteSummary {
  id: string;
  startTick: number;
  endTick: number;
  ticksRemaining: number;
  status: 'open' | 'closed' | 'applied' | 'expired';
  options: Array<{ effectId: InfluenceEffectId; weight: number }>;
  winner: InfluenceEffectId | null;
}

export interface BattleRenderSnapshot {
  schemaVersion: 1;
  presentationVersion: 'battle-presentation-v1';
  revision: number;
  runToken: string;
  tick: number;
  lifecycle: BattleLifecycle;
  scene: BattlePublicScene;
  headline: string;
  goal: {
    label: string;
    survivors: number;
    totalContenders: number;
    eliminated: number;
    progress: number;
  };
  zone: {
    centerCell: number;
    radius: number;
    phase: number;
    damage: number;
    nextShrinkTick: number;
    ticksUntilShrink: number;
  };
  arena: {
    width: number;
    height: number;
    obstacles: number[];
    cover: number[];
    loot: BattleRenderLoot[];
    theme: BattleTheme;
  };
  combatants: BattleRenderCombatant[];
  focus: BattleRenderCombatant | null;
  leaderboard: Array<Pick<BattleRenderCombatant, 'id' | 'name' | 'archetype' | 'alive' | 'eliminations' | 'damageDealt' | 'health' | 'shield'>>;
  audience: {
    enabled: boolean;
    providerStatus: 'online' | 'degraded' | 'disabled';
    pendingEffects: number;
    radarActive: boolean;
    currentVote: BattleVoteSummary | null;
  };
  recentEvents: BattlePublicEvent[];
  captions: string[];
  result?: {
    kind: 'game' | 'technical';
    reason: 'last-standing' | 'time-limit' | 'draw' | 'integrity-quarantine';
    tick: number;
    winnerId: string | null;
    survivorIds: string[];
  };
  intermissionRemaining: number;
}

const SAFE_DETAIL_TYPES = new Set([
  'match-created',
  'action-rejected',
  'miss',
  'pickup',
  'supply-drop',
  'zone-warning',
  'zone-shrink',
  'zone-damage',
  'stagnation-escalation',
  'elimination',
  'match-result',
  'vote-opened',
  'vote-rejected',
  'vote-closed',
  'influence-applied',
]);

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}

function boundedText(value: unknown, maximum = 96): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function lifecycleRevision(state: BattleState): number {
  if (state.lifecycle === 'running') return 1;
  if (state.lifecycle === 'result') return 2;
  if (state.lifecycle === 'intermission') return 100 + Math.max(0, state.config.intermissionTicks - state.intermissionRemaining);
  return 9_000;
}

function sceneFor(state: BattleState, survivorCount: number): BattlePublicScene {
  if (state.lifecycle === 'quarantined') return 'recovery';
  if (state.lifecycle === 'result') return 'result';
  if (state.lifecycle === 'intermission') return 'intermission';
  if (survivorCount <= 4 || state.zone.radius <= 3) return 'final-circle';
  if (state.influence.currentWindow?.status === 'open') return 'vote';
  return 'battle';
}

function headlineFor(state: BattleState, scene: BattlePublicScene, survivorCount: number): string {
  if (scene === 'recovery') return 'Restoring a Verified Battle State';
  if (scene === 'intermission') return 'The Next Arena Deploys Soon';
  if (scene === 'result') {
    if (state.result?.reason === 'draw') return 'The Arena Ends in a Draw';
    const winner = state.combatants.find((candidate) => candidate.id === state.result?.winnerId);
    return winner ? `${winner.name} Is the Last Contender Standing` : 'Battle Cycle Complete';
  }
  if (scene === 'final-circle') return `${survivorCount} Contenders Enter the Final Circle`;
  if (scene === 'vote') return 'The Arena Awaits the Audience Decision';
  return 'Survive the Shrinking Arena';
}

function renderCombatant(combatant: BattleState['combatants'][number]): BattleRenderCombatant {
  return {
    id: combatant.id,
    name: boundedText(combatant.name, 32),
    archetype: combatant.archetype,
    cell: combatant.cell,
    health: clamp(combatant.health, 0, combatant.maxHealth),
    maxHealth: combatant.maxHealth,
    shield: clamp(combatant.shield, 0, combatant.maxShield),
    maxShield: combatant.maxShield,
    alive: combatant.alive,
    weapon: combatant.weapon,
    ammo: Math.max(0, combatant.ammo),
    medkits: Math.max(0, combatant.medkits),
    eliminations: Math.max(0, combatant.eliminations),
    damageDealt: Math.max(0, combatant.damageDealt),
    intent: combatant.intent,
    goal: boundedText(combatant.goal, 112),
    confidence: clamp(Math.round(combatant.confidencePermille / 10), 0, 100),
  };
}

function rankCombatants(combatants: readonly BattleRenderCombatant[]): BattleRenderCombatant[] {
  return [...combatants].sort((first, second) =>
    Number(second.alive) - Number(first.alive)
    || second.eliminations - first.eliminations
    || second.damageDealt - first.damageDealt
    || (second.health + second.shield) - (first.health + first.shield)
    || first.id.localeCompare(second.id));
}

function sanitizeEvent(event: BattleSemanticEvent): BattlePublicEvent {
  const sanitized: BattlePublicEvent = {
    sequence: event.sequence,
    tick: event.tick,
    type: boundedText(event.type, 48),
    importance: event.importance,
  };
  if (event.actorId) sanitized.actorId = boundedText(event.actorId, 48);
  if (event.targetId) sanitized.targetId = boundedText(event.targetId, 48);
  if (Number.isInteger(event.cell)) sanitized.cell = event.cell;
  if (typeof event.amount === 'number' && Number.isFinite(event.amount)) sanitized.amount = event.amount;
  if (event.detail && SAFE_DETAIL_TYPES.has(event.type)) sanitized.detail = boundedText(event.detail, 80);
  return sanitized;
}

function captionForEvent(event: BattlePublicEvent, names: ReadonlyMap<string, string>): string | null {
  const actor = event.actorId ? names.get(event.actorId) ?? 'A contender' : 'A contender';
  const target = event.targetId ? names.get(event.targetId) ?? 'a contender' : 'a contender';
  switch (event.type) {
    case 'elimination': return `${target} has been eliminated${event.actorId ? ` by ${actor}` : ' by the arena'}.`;
    case 'zone-warning': return 'The safe zone will contract soon.';
    case 'zone-shrink': return 'The safe zone is contracting.';
    case 'zone-damage': return `${target} is taking zone damage.`;
    case 'shield-broken': return `${target}'s shield has broken.`;
    case 'pickup': return `${actor} secured ${boundedText(event.detail, 32) || 'a resource'}.`;
    case 'supply-drop': return 'A supply drop has entered the arena.';
    case 'vote-opened': return 'Audience voting is now open.';
    case 'vote-closed': return `Audience voting closed${event.detail ? `: ${event.detail}` : ''}.`;
    case 'influence-applied': return `Audience influence applied: ${event.detail ?? 'bounded arena effect'}.`;
    case 'match-result': return event.detail === 'draw' ? 'The match ended in a draw.' : 'The arena has a champion.';
    case 'system-status': return 'Gameplay is paused while a verified state is restored.';
    default: return null;
  }
}

function summarizeVote(state: BattleState): BattleVoteSummary | null {
  const window = state.influence.currentWindow;
  if (!window) return null;
  const tallies = new Map<InfluenceEffectId, number>();
  for (const effectId of window.options) tallies.set(effectId, 0);
  for (const ballot of Object.values(window.ballots)) tallies.set(ballot.effectId, (tallies.get(ballot.effectId) ?? 0) + ballot.weight);
  return {
    id: boundedText(window.id, 48),
    startTick: window.startTick,
    endTick: window.endTick,
    ticksRemaining: Math.max(0, window.endTick - state.tick),
    status: window.status,
    options: window.options.map((effectId) => ({ effectId, weight: tallies.get(effectId) ?? 0 })),
    winner: window.winner,
  };
}

export function createBattleRenderSnapshot(
  state: BattleState,
  events: ReadonlyArray<BattleSemanticEvent> = [],
): Readonly<BattleRenderSnapshot> {
  const combatants = state.combatants.map(renderCombatant);
  const ranked = rankCombatants(combatants);
  const survivors = combatants.filter((combatant) => combatant.alive).length;
  const scene = sceneFor(state, survivors);
  const names = new Map(combatants.map((combatant) => [combatant.id, combatant.name] as const));
  const recentEvents = events.slice(-16).map(sanitizeEvent);
  const captions = recentEvents
    .filter((event) => event.importance >= 3)
    .map((event) => captionForEvent(event, names))
    .filter((caption): caption is string => Boolean(caption))
    .slice(-4);
  if (captions.length === 0) {
    if (scene === 'recovery') captions.push('Gameplay is paused while a verified state is restored.');
    else if (scene === 'result') captions.push(headlineFor(state, scene, survivors));
    else if (scene === 'intermission') captions.push('A new deterministic arena is being prepared.');
    else captions.push(`Safe zone phase ${state.zone.phase}; ${survivors} contenders remain.`);
  }
  const snapshot: BattleRenderSnapshot = {
    schemaVersion: 1,
    presentationVersion: 'battle-presentation-v1',
    revision: state.tick * 10_000 + state.eventSequence * 10 + lifecycleRevision(state),
    runToken: fnv1aHex(stableStringify({ game: 'ai-battle-royale', run: state.runId, seed: state.seed })),
    tick: state.tick,
    lifecycle: state.lifecycle,
    scene,
    headline: headlineFor(state, scene, survivors),
    goal: {
      label: 'Be the last contender standing',
      survivors,
      totalContenders: state.combatants.length,
      eliminated: state.combatants.length - survivors,
      progress: clamp((state.combatants.length - survivors) / Math.max(1, state.combatants.length - 1), 0, 1),
    },
    zone: {
      centerCell: state.zone.centerCell,
      radius: state.zone.radius,
      phase: state.zone.phase,
      damage: state.zone.damage,
      nextShrinkTick: state.zone.nextShrinkTick,
      ticksUntilShrink: Math.max(0, state.zone.nextShrinkTick - state.tick),
    },
    arena: {
      width: state.arena.width,
      height: state.arena.height,
      obstacles: [...state.arena.obstacles],
      cover: [...state.arena.cover],
      loot: state.arena.loot.map((loot) => ({ id: boundedText(loot.id, 48), kind: loot.kind, cell: loot.cell, weapon: loot.weapon, amount: loot.amount })),
      theme: state.influence.theme,
    },
    combatants,
    focus: ranked.find((combatant) => combatant.alive) ?? ranked[0] ?? null,
    leaderboard: ranked.slice(0, 6).map((combatant) => ({
      id: combatant.id,
      name: combatant.name,
      archetype: combatant.archetype,
      alive: combatant.alive,
      eliminations: combatant.eliminations,
      damageDealt: combatant.damageDealt,
      health: combatant.health,
      shield: combatant.shield,
    })),
    audience: {
      enabled: state.influence.enabled && state.influence.providerStatus !== 'disabled',
      providerStatus: state.influence.providerStatus,
      pendingEffects: state.influence.scheduled.filter((effect) => !effect.applied).length,
      radarActive: state.influence.radarUntilTick > state.tick,
      currentVote: summarizeVote(state),
    },
    recentEvents,
    captions,
    result: state.result ? {
      kind: state.result.kind,
      reason: state.result.reason,
      tick: state.result.tick,
      winnerId: state.result.winnerId,
      survivorIds: [...state.result.survivorIds],
    } : undefined,
    intermissionRemaining: state.intermissionRemaining,
  };
  return deepFreeze(snapshot);
}
