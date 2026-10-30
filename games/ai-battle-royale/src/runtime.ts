import { NamedRng, RngSnapshot } from '../../../packages/seeded-rng/src/index';
import { checksum } from '../../../packages/replay/src/index';
import { Point, Obstacle, MAP, SOLIDS, distance, walkable, clearSegment, route, moveAlong, quantize } from './world';
export type { Obstacle } from './world';

const VERSION = 'last-light-authority-1';
const TICK_RATE = 20, COUNTDOWN = 60, EVENT_LIMIT = 80;
export const WEAPONS = {
  'Pulse Rifle': { damage: 5, interval: 9, range: 44, optimal: 25, accuracy: .48, magazine: 24, reload: 44 },
  'Scatter Cannon': { damage: 16, interval: 23, range: 25, optimal: 12, accuracy: .63, magazine: 6, reload: 52 },
  'Longshot': { damage: 20, interval: 36, range: 66, optimal: 42, accuracy: .53, magazine: 5, reload: 60 },
  'Arc SMG': { damage: 3, interval: 4, range: 29, optimal: 17, accuracy: .47, magazine: 36, reload: 36 },
} as const;
type WeaponName = keyof typeof WEAPONS;
const ROSTER = [
  ['sol', 'SOL REYES', 'vanguard', '#ff704b'], ['nyx', 'NYX VALE', 'recon', '#ae8dff'],
  ['cove', 'COVE MARIN', 'support', '#44d8c5'], ['rivet', 'RIVET KNOX', 'heavy', '#ffc66b'],
  ['lux', 'LUX ARDEN', 'recon', '#f5f5dc'], ['kestrel', 'KESTREL VOSS', 'vanguard', '#b5ef42'],
  ['mako', 'MAKO FINCH', 'heavy', '#55b8ee'], ['ember', 'EMBER ROOK', 'support', '#f987bc'],
  ['ion', 'ION MERCER', 'recon', '#7fafff'], ['sable', 'SABLE CROSS', 'vanguard', '#dfb77f'],
  ['tala', 'TALA NOVA', 'support', '#65df9d'], ['flint', 'FLINT QUILL', 'heavy', '#ff9e68'],
];
export interface RoyaleAgent extends Point {
  id: string; name: string; archetype: string; color: string; yaw: number;
  hp: number; shield: number; kills: number; alive: boolean; weapon: string; ammo: number;
  intent: string; action: string; hitTick: number; fireTick: number; targetId: string | null;
}
interface Agent extends RoyaleAgent {
  weapon: WeaponName; cooldown: number; busyUntil: number; medkits: number;
  nextDecision: number; path: Point[]; goal: Point; lastSeen: Point | null; lastSeenTick: number;
  lastProgress: Point; stuckTicks: number; aggression: number;
}
interface Loot extends Point { id: string; kind: string; active: boolean }
interface Event extends Point { id: number; tick: number; kind: string; actor: string | null; target: string | null; text: string }
interface Zone extends Point { radius: number; nextRadius: number; stage: number; secondsToShrink: number }
export interface RoyaleSnapshot {
  schemaVersion: 1; matchId: number; tick: number; time: number;
  phase: 'countdown' | 'running' | 'intermission'; countdown: number;
  remaining: number; winner: string | null; zone: Zone;
  map: { size: number; buildings: Obstacle[]; covers: Obstacle[] };
  agents: RoyaleAgent[]; loot: Loot[]; events: Event[]; checksum: string;
}
interface Config { agentCount: number; matchTicks: number; intermissionTicks: number }
interface State {
  matchId: number; tick: number; phase: RoyaleSnapshot['phase']; phaseTicks: number;
  winner: string | null; agents: Agent[]; loot: Loot[]; events: Event[]; sequence: number; zone: Zone;
}
interface Checkpoint { schemaVersion: 1; version: string; seed: string; config: Config; configHash: string; state: State; rng: RngSnapshot; checksum: string }
function copy<T>(x: T): T { return JSON.parse(JSON.stringify(x)) as T; }
function freeze<T>(x: T): T {
  if (x && typeof x === 'object') { Object.values(x).forEach(freeze); Object.freeze(x); }
  return x;
}
/** Exact schemas reject unknown data before cloning, checksumming or publishing it. */
function exactKeys(value: unknown, keys: readonly string[], label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    throw new Error(`Invalid ${label} schema`);
  }
}
function validateCheckpointShape(input: unknown) {
  let nodes = 0;
  const boundedJson = (value: unknown, depth: number): void => {
    if (++nodes > 10000 || depth > 10) throw new Error('Checkpoint structure exceeds budget');
    if (typeof value === 'string' && value.length > 256) throw new Error('Checkpoint string exceeds budget');
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Nonfinite checkpoint number');
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value) && value.length > 80) throw new Error('Checkpoint collection exceeds budget');
      for (const [key, child] of Object.entries(value)) {
        if (key.length > 40) throw new Error('Checkpoint key exceeds budget');
        boundedJson(child, depth + 1);
      }
    } else if (value !== null && !['string', 'number', 'boolean'].includes(typeof value)) throw new Error('Invalid checkpoint value');
  };
  boundedJson(input, 0);
  exactKeys(input, ['schemaVersion','version','seed','config','configHash','state','rng','checksum'], 'checkpoint');
  exactKeys(input.config, ['agentCount','matchTicks','intermissionTicks'], 'configuration');
  exactKeys(input.rng, ['seed','streams'], 'RNG');
  exactKeys(input.state, ['matchId','tick','phase','phaseTicks','winner','agents','loot','events','sequence','zone'], 'state');
  const s = input.state;
  exactKeys(s.zone, ['x','z','radius','nextRadius','stage','secondsToShrink'], 'zone');
  const point = (p: unknown) => exactKeys(p, ['x','z'], 'point');
  if (!Array.isArray(s.agents) || s.agents.length > 12 || !Array.isArray(s.loot) || s.loot.length !== 28 || !Array.isArray(s.events) || s.events.length > EVENT_LIMIT) throw new Error('Invalid state collections');
  for (const a of s.agents) {
    exactKeys(a, ['x','z','id','name','archetype','color','yaw','hp','shield','kills','alive','weapon','ammo','intent','action','hitTick','fireTick','targetId','cooldown','busyUntil','medkits','nextDecision','path','goal','lastSeen','lastSeenTick','lastProgress','stuckTicks','aggression'], 'agent');
    if (!Array.isArray(a.path) || a.path.length > 70) throw new Error('Invalid route budget');
    a.path.forEach(point); point(a.goal); point(a.lastProgress); if (a.lastSeen !== null) point(a.lastSeen);
  }
  for (const l of s.loot) exactKeys(l, ['id','x','z','kind','active'], 'loot');
  for (const e of s.events) exactKeys(e, ['id','tick','kind','actor','target','text','x','z'], 'event');
}
function zoneAtTick(tick: number, matchTicks: number): Zone {
  if (tick < COUNTDOWN) return { x: 7, z: 7, radius: 62, nextRadius: 46, stage: 0, secondsToShrink: 30 };
  const elapsed = tick - COUNTDOWN, start = Math.min(600, matchTicks * .15);
  const progress = Math.max(0, Math.min(1, (elapsed - start) / (matchTicks - start)));
  const stage = Math.min(5, Math.floor(progress * 6));
  return { x: 7, z: 7, radius: quantize(62 * (1 - progress)),
    nextRadius: quantize(Math.max(0, 62 * (1 - (stage + 1) / 6))), stage,
    secondsToShrink: elapsed < start ? (start - elapsed) / 20 : Math.max(0, ((stage + 1) / 6 - progress) * (matchTicks - start) / 20) };
}
function integer(value: number, min: number, max: number, name: string) {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError(`Invalid ${name}: expected integer ${min}..${max}`);
  return value;
}
function config(options: Partial<Config>): Config {
  for (const key of Object.keys(options)) if (!['agentCount', 'matchTicks', 'intermissionTicks'].includes(key)) throw new Error(`Unknown configuration: ${key}`);
  return {
    agentCount: integer(options.agentCount === undefined ? 12 : options.agentCount, 2, 12, 'agentCount'),
    matchTicks: integer(options.matchTicks === undefined ? 3600 : options.matchTicks, 200, 12000, 'matchTicks'),
    intermissionTicks: integer(options.intermissionTicks === undefined ? 160 : options.intermissionTicks, 20, 1200, 'intermissionTicks'),
  };
}
/** No wall clock, network, renderer, or unseeded entropy participates in authority. */
export class BattleRoyaleRuntime {
  private rng: NamedRng;
  private state!: State;
  private readonly config: Config;
  constructor(private readonly seed: string, options: Partial<Config> = {}) {
    if (typeof seed !== 'string' || seed.length < 1 || seed.length > 256) throw new Error('Seed must contain 1..256 characters');
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('Invalid configuration');
    this.config = config(options);
    this.rng = NamedRng.fromSeed(seed);
    this.newMatch(1);
  }
  private random(stream: string) { return this.rng.nextInt(stream, 1000000) / 1000000; }
  private event(kind: string, actor: Agent | null, target: Agent | null, text: string, point: Point = actor ?? this.state.zone) {
    this.state.events.push({ id: ++this.state.sequence, tick: this.state.tick, kind, actor: actor?.id ?? null, target: target?.id ?? null, text, x: point.x, z: point.z });
    if (this.state.events.length > EVENT_LIMIT) this.state.events.shift();
  }
  private newMatch(matchId: number) {
    this.state = { matchId, tick: 0, phase: 'countdown', phaseTicks: 0, winner: null, agents: [], loot: [], events: [], sequence: 0,
      zone: zoneAtTick(0, this.config.matchTicks) };
    const offset = this.random('spawns') * Math.PI * 2;
    for (let i = 0; i < this.config.agentCount; i++) {
      const r = ROSTER[i], angle = offset + i * Math.PI * 2 / this.config.agentCount;
      let point = { x: quantize(Math.cos(angle) * 36), z: quantize(Math.sin(angle) * 36) };
      if (!walkable(point)) point = this.safePoint({ x: Math.cos(angle) * 44, z: Math.sin(angle) * 44 });
      const weapon = (Object.keys(WEAPONS) as WeaponName[])[i % 4];
      this.state.agents.push({ ...point, id: r[0], name: r[1], archetype: r[2], color: r[3], yaw: Math.atan2(-point.x, -point.z),
        hp: 100, shield: 75, kills: 0, alive: true, weapon, ammo: WEAPONS[weapon].magazine,
        intent: 'Awaiting deployment', action: 'idle', hitTick: -100, fireTick: -100, targetId: null,
        cooldown: 0, busyUntil: 0, medkits: 2, nextDecision: COUNTDOWN + i % 6,
        path: [], goal: { ...point }, lastSeen: null, lastSeenTick: -1000, lastProgress: { ...point }, stuckTicks: 0,
        aggression: .75 + this.random(`personality:${r[0]}`) * .5 });
    }
    for (let i = 0; i < 28; i++) {
      const point = this.safePoint({ x: (this.random('loot') - .5) * 98, z: (this.random('loot') - .5) * 98 });
      const kind = i % 4 === 0 ? 'medkit' : i % 4 === 1 ? 'shield' : (Object.keys(WEAPONS) as WeaponName[])[i % 4];
      this.state.loot.push({ id: `loot-${i}`, ...point, kind, active: true });
    }
    this.event('deployment', null, null, `Match ${matchId} · ${this.config.agentCount} contenders deploying`);
  }
  private safePoint(point: Point): Point {
    if (walkable(point)) return { x: quantize(point.x), z: quantize(point.z) };
    // Fixed bounded search; never teleport into a collider or retry randomness forever.
    for (let radius = 2; radius <= 120; radius += 2) for (let direction = 0; direction < 16; direction++) {
      const candidate = { x: quantize(point.x + Math.cos(direction * Math.PI / 8) * radius), z: quantize(point.z + Math.sin(direction * Math.PI / 8) * radius) };
      if (walkable(candidate)) return candidate;
    }
    throw new Error('No legal navigation point');
  }
  private updateZone() {
    const zone = zoneAtTick(this.state.tick, this.config.matchTicks);
    if (zone.stage !== this.state.zone.stage) this.event('storm', null, null, `Storm phase ${zone.stage + 1} · safe area contracting`);
    this.state.zone = zone;
  }
  private navigate(a: Agent, goal: Point, intent: string) {
    a.goal = this.safePoint(goal); a.path = route(a, a.goal); a.intent = intent;
  }
  /** Perception sees only unobstructed living actors within 66m and visible loot within 30m. */
  private observe(a: Agent) {
    return {
      enemies: this.state.agents.filter(b => b.alive && b.id !== a.id && distance(a, b) <= 66 && clearSegment(a, b)).sort((b, c) => distance(a, b) - distance(a, c) || (b.id < c.id ? -1 : b.id > c.id ? 1 : 0)),
      loot: this.state.loot.filter(l => l.active && distance(a, l) <= 30 && clearSegment(a, l)).sort((b, c) => distance(a, b) - distance(a, c) || (b.id < c.id ? -1 : b.id > c.id ? 1 : 0)),
    };
  }
  private decide(a: Agent) {
    const s = this.state, seen = this.observe(a), enemy = seen.enemies[0];
    if (enemy) { a.lastSeen = { x: enemy.x, z: enemy.z }; a.lastSeenTick = s.tick; }
    a.targetId = enemy?.id ?? null;
    if (s.tick < a.busyUntil) return;
    const w = WEAPONS[a.weapon];
    if (a.ammo === 0) {
      a.action = 'reloading'; a.busyUntil = s.tick + w.reload; a.intent = 'Reloading under cover';
      this.event('reload', a, null, `${a.name} reloads ${a.weapon}`); return;
    }
    const danger = distance(a, s.zone) > s.zone.radius - 5;
    if (danger) {
      this.navigate(a, { x: s.zone.x + (a.x - s.zone.x) * .15, z: s.zone.z + (a.z - s.zone.z) * .15 }, 'Rotating to safe zone'); return;
    }
    if (a.hp < 52 && a.medkits > 0 && (!enemy || distance(a, enemy) > 20)) {
      a.action = 'healing'; a.busyUntil = s.tick + 64; a.intent = 'Applying field medkit'; a.path = [];
      this.event('heal', a, null, `${a.name} applies a medkit`); return;
    }
    if (enemy) {
      const d = distance(a, enemy);
      if (d > w.optimal * 1.15 / a.aggression) {
        const fraction = Math.max(.15, (d - w.optimal * .8 / a.aggression) / d);
        this.navigate(a, { x: a.x + (enemy.x - a.x) * fraction, z: a.z + (enemy.z - a.z) * fraction }, `Closing on ${enemy.name}`);
      } else if (a.shield < 20 && s.tick - a.hitTick < 100) {
        // Pick a reachable cover corner which actually blocks this observed attacker.
        const candidates = SOLIDS.flatMap(o => [-1, 1].flatMap(dx => [-1, 1].map(dz => ({ x: o.x + dx * (o.w / 2 + 1.3), z: o.z + dz * (o.d / 2 + 1.3) }))));
        const cover = candidates.filter(p => walkable(p) && distance(p, a) < 14 && distance(p, s.zone) < s.zone.radius - 2 && !clearSegment(p, enemy))
          .sort((b, c) => distance(a, b) - distance(a, c))[0];
        if (cover) this.navigate(a, cover, 'Breaking line of sight');
        else { a.path = []; a.intent = `Engaging ${enemy.name}`; }
      } else {
        // Short purposeful lateral reposition, then hold an aim. No perpetual orbiting.
        if (s.tick % 80 < 10 && this.random(`tactics:${a.id}`) < .4) {
          const dx = (enemy.z - a.z) / Math.max(d, 1), dz = -(enemy.x - a.x) / Math.max(d, 1);
          this.navigate(a, { x: a.x + dx * 3, z: a.z + dz * 3 }, 'Changing firing angle');
        } else { a.path = []; a.intent = `Engaging ${enemy.name}`; }
      }
      return;
    }
    const loot = seen.loot.find(l => l.kind !== 'medkit' || a.medkits < 3);
    if (loot && (a.shield < 65 || a.medkits < 2 || a.weapon === 'Scatter Cannon')) { this.navigate(a, loot, 'Recovering supplies'); return; }
    if (a.lastSeen && s.tick - a.lastSeenTick < 120) { this.navigate(a, a.lastSeen, 'Tracking last contact'); return; }
    if (!a.path.length || a.stuckTicks > 40) {
      const angle = this.random(`patrol:${a.id}`) * Math.PI * 2;
      const radius = Math.min(s.zone.radius * .65, 32) * (.3 + this.random(`patrol:${a.id}`) * .7);
      this.navigate(a, { x: s.zone.x + Math.cos(angle) * radius, z: s.zone.z + Math.sin(angle) * radius }, 'Scanning the outpost');
      a.stuckTicks = 0;
    }
  }
  step(): void {
    const s = this.state;
    if (s.phase === 'intermission') {
      if (++s.phaseTicks >= this.config.intermissionTicks) this.newMatch(s.matchId + 1);
      return;
    }
    s.tick++;
    if (s.phase === 'countdown') {
      if (s.tick < COUNTDOWN) return;
      s.phase = 'running'; s.phaseTicks = 0;
      this.event('start', null, null, 'Deployment complete · last contender standing wins');
    }
    this.updateZone();
    // Decisions are staggered, each bounded to at most one small visibility-graph search.
    for (const a of s.agents) if (a.alive) {
      if (a.busyUntil && s.tick >= a.busyUntil) {
        if (a.action === 'reloading') a.ammo = WEAPONS[a.weapon].magazine;
        if (a.action === 'healing') { a.hp = Math.min(100, a.hp + 55); a.medkits--; }
        a.busyUntil = 0; a.action = 'idle';
      }
      if (s.tick >= a.nextDecision) { this.decide(a); a.nextDecision = s.tick + 8; }
      if (a.busyUntil > s.tick) continue;
      const before = { x: a.x, z: a.z };
      const moving = moveAlong(a, a.path, (a.archetype === 'heavy' ? 4.7 : 5.6) / TICK_RATE);
      if (moving) a.yaw = Math.atan2(a.x - before.x, a.z - before.z);
      a.action = moving ? 'running' : 'aiming';
      if (s.tick % 40 === 0) {
        a.stuckTicks = distance(a, a.lastProgress) < .6 && a.path.length > 0 ? a.stuckTicks + 40 : 0;
        a.lastProgress = { x: a.x, z: a.z };
      }
      const loot = s.loot.find(l => l.active && distance(a, l) < 1.6);
      if (loot) {
        loot.active = false;
        if (loot.kind === 'medkit') a.medkits = Math.min(3, a.medkits + 1);
        else if (loot.kind === 'shield') a.shield = Math.min(75, a.shield + 40);
        else { a.weapon = loot.kind as WeaponName; a.ammo = WEAPONS[a.weapon].magazine; }
        this.event('loot', a, null, `${a.name} recovered ${loot.kind}`);
      }
    }
    // Resolve attacks from a common live set; damage commits together, permitting truthful trades.
    const damage: { actor: Agent | null; target: Agent; amount: number }[] = [];
    for (const a of s.agents) if (a.alive) {
      if (s.tick - COUNTDOWN >= this.config.matchTicks || distance(a, s.zone) > s.zone.radius) damage.push({ actor: null, target: a, amount: s.tick - COUNTDOWN >= this.config.matchTicks ? 1000 : (2 + s.zone.stage * 2) / 20 });
      if (a.busyUntil > s.tick || s.tick < a.cooldown || a.ammo <= 0) continue;
      const target = a.targetId ? s.agents.find(b => b.id === a.targetId && b.alive) : undefined;
      const w = WEAPONS[a.weapon];
      if (!target || distance(a, target) > w.range || !clearSegment(a, target)) continue;
      a.yaw = Math.atan2(target.x - a.x, target.z - a.z); a.ammo--; a.fireTick = s.tick; a.action = 'firing'; a.cooldown = s.tick + w.interval;
      const rangePenalty = Math.max(.35, 1 - Math.max(0, distance(a, target) - w.optimal) / w.range);
      const hit = this.random(`combat:${a.id}`) < w.accuracy * rangePenalty * (a.path.length ? .78 : 1);
      this.event('shot', a, target, `${a.name} fires ${a.weapon}`);
      if (hit) damage.push({ actor: a, target, amount: w.damage });
    }
    const killers = new Map<string, Agent | null>();
    for (const d of damage) {
      const a = d.target;
      if (d.actor) {
        const absorbed = Math.min(a.shield, d.amount); a.shield = quantize(a.shield - absorbed); a.hp = quantize(Math.max(0, a.hp - (d.amount - absorbed))); a.hitTick = s.tick;
      } else a.hp = quantize(Math.max(0, a.hp - d.amount));
      if (a.hp <= 0 && !killers.has(a.id)) killers.set(a.id, d.actor);
    }
    for (const a of s.agents) if (a.alive && a.hp <= 0) {
      const killer = killers.get(a.id) ?? null;
      a.alive = false; a.action = 'eliminated'; a.intent = 'Eliminated'; a.path = []; a.targetId = null;
      if (killer) killer.kills++;
      this.event('elimination', killer, a, killer ? `${killer.name} eliminated ${a.name}` : `${a.name} lost to the storm`, a);
    }
    const survivors = s.agents.filter(a => a.alive);
    if (survivors.length <= 1) {
      s.phase = 'intermission'; s.phaseTicks = 0; s.winner = survivors[0]?.id ?? null;
      this.event('result', survivors[0] ?? null, null, survivors[0] ? `${survivors[0].name} · LAST LIGHT CHAMPION` : 'Draw · no survivors');
    }
  }
  snapshot(): RoyaleSnapshot {
    const s = this.state;
    const payload = { schemaVersion: 1 as const, matchId: s.matchId, tick: s.tick, time: s.tick / 20, phase: s.phase,
      countdown: s.phase === 'countdown' ? Math.ceil((COUNTDOWN - s.tick) / 20) : s.phase === 'intermission' ? Math.ceil((this.config.intermissionTicks - s.phaseTicks) / 20) : 0,
      remaining: s.agents.filter(a => a.alive).length, winner: s.winner, zone: { x: s.zone.x, z: s.zone.z, radius: s.zone.radius, nextRadius: s.zone.nextRadius, stage: s.zone.stage, secondsToShrink: s.zone.secondsToShrink }, map: MAP,
      agents: s.agents.map(a => ({ id: a.id, name: a.name, archetype: a.archetype, color: a.color,
        x: a.x, z: a.z, yaw: a.yaw, hp: a.hp, shield: a.shield, kills: a.kills, alive: a.alive,
        weapon: a.weapon, ammo: a.ammo, intent: a.intent, action: a.action, hitTick: a.hitTick, fireTick: a.fireTick, targetId: a.targetId })),
      loot: s.loot.map(l => ({ id: l.id, x: l.x, z: l.z, kind: l.kind, active: l.active })),
      events: s.events.map(e => ({ id: e.id, tick: e.tick, kind: e.kind, actor: e.actor, target: e.target, text: e.text, x: e.x, z: e.z })) };
    return freeze(copy({ ...payload, checksum: checksum(payload) }));
  }
  checkpoint(): Checkpoint {
    const payload = { schemaVersion: 1 as const, version: VERSION, seed: this.seed, config: this.config, configHash: checksum(this.config), state: this.state, rng: this.rng.snapshot() };
    return freeze(copy({ ...payload, checksum: checksum(payload) }));
  }
  static restore(input: unknown): BattleRoyaleRuntime {
    try {
      validateCheckpointShape(input);
      const c = copy(input) as Checkpoint;
      const { checksum: hash, ...payload } = c;
      if (c.schemaVersion !== 1 || c.version !== VERSION) throw new Error('Unsupported checkpoint version');
      if (typeof hash !== 'string' || checksum(payload) !== hash) throw new Error('Checkpoint checksum mismatch');
      const runtime = new BattleRoyaleRuntime(c.seed, c.config);
      if (checksum(c.config) !== c.configHash) throw new Error('Configuration hash mismatch');
      runtime.validateState(c.state, c.rng);
      runtime.state = c.state; runtime.rng = NamedRng.restore(c.rng);
      return runtime;
    } catch (error) { throw new Error(`Battle royale restore rejected: ${error instanceof Error ? error.message : String(error)}`); }
  }
  private validateState(s: State, rng: RngSnapshot) {
    const fail = (message: string): never => { throw new Error(message); };
    integer(s.matchId, 1, Number.MAX_SAFE_INTEGER, 'matchId');
    integer(s.tick, 0, this.config.matchTicks + COUNTDOWN, 'tick');
    integer(s.phaseTicks, 0, this.config.intermissionTicks - 1, 'phaseTicks');
    integer(s.sequence, 1, 100 + this.config.agentCount * this.config.matchTicks * 3, 'event sequence');
    if (!['countdown', 'running', 'intermission'].includes(s.phase)) fail('Invalid phase');
    if (s.phase === 'countdown' && s.tick >= COUNTDOWN || s.phase !== 'countdown' && s.tick < COUNTDOWN) fail('Phase/tick mismatch');
    if (s.phase !== 'intermission' && s.phaseTicks !== 0 || s.phase === 'running' && s.tick >= this.config.matchTicks + COUNTDOWN) fail('Invalid lifecycle timer');
    if (checksum(s.zone) !== checksum(zoneAtTick(s.tick, this.config.matchTicks))) fail('Zone/tick mismatch');
    const streams = ['spawns', 'loot', ...ROSTER.slice(0, this.config.agentCount).flatMap(r => ['personality','combat','patrol','tactics'].map(kind => `${kind}:${r[0]}`))];
    if (rng.seed !== this.seed || !rng.streams || typeof rng.streams !== 'object' || Array.isArray(rng.streams) || Object.keys(rng.streams).some(key => !streams.includes(key))) fail('Invalid RNG state');
    for (const value of Object.values(rng.streams)) integer(value, 1, 0xffffffff, 'RNG stream');
    const finite = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
    const point = (p: Point) => p && finite(p.x, -59, 59) && finite(p.z, -59, 59);
    if (!Array.isArray(s.agents) || s.agents.length !== this.config.agentCount) fail('Invalid population');
    for (let i = 0; i < s.agents.length; i++) {
      const a = s.agents[i];
      if (a.id !== ROSTER[i][0] || a.name !== ROSTER[i][1] || a.archetype !== ROSTER[i][2] || a.color !== ROSTER[i][3]) fail('Invalid roster');
      if (!point(a) || !walkable(a) || !finite(a.yaw, -Math.PI, Math.PI)) fail('Invalid actor geometry');
      if (!finite(a.hp, 0, 100) || !finite(a.shield, 0, 75) || typeof a.alive !== 'boolean' || a.alive !== (a.hp > 0)) fail('Invalid health');
      if (typeof a.weapon !== 'string' || !Object.hasOwn(WEAPONS, a.weapon)) fail('Invalid weapon');
      integer(a.ammo, 0, WEAPONS[a.weapon].magazine, 'ammo'); integer(a.kills, 0, 11, 'kills'); integer(a.medkits, 0, 3, 'medkits');
      for (const key of ['cooldown', 'busyUntil', 'nextDecision'] as const) integer(a[key], 0, this.config.matchTicks + COUNTDOWN + 200, key);
      for (const key of ['hitTick', 'fireTick', 'lastSeenTick'] as const) {
        integer(a[key], -1000, s.tick, key);
        if (a[key] !== (key === 'lastSeenTick' ? -1000 : -100) && a[key] < COUNTDOWN) fail('Invalid action history');
      }
      if (!Array.isArray(a.path) || a.path.length > 70 || !a.path.every(p => point(p) && walkable(p)) || !point(a.goal) || !point(a.lastProgress) || a.lastSeen !== null && !point(a.lastSeen)) fail('Invalid navigation');
      if (!finite(a.aggression, .75, 1.25) || !finite(a.stuckTicks, 0, 12000)) fail('Invalid behavior state');
      if (typeof a.intent !== 'string' || a.intent.length > 100 || !['idle', 'running', 'aiming', 'firing', 'reloading', 'healing', 'eliminated'].includes(a.action)) fail('Invalid action');
      if (a.alive === (a.action === 'eliminated')) fail('Life/action mismatch');
      if (!a.alive && (a.intent !== 'Eliminated' || a.path.length !== 0 || a.targetId !== null)) fail('Invalid eliminated state');
      if (s.phase === 'countdown' && (!a.alive || a.action !== 'idle' || a.intent !== 'Awaiting deployment' || a.hp !== 100 || a.shield !== 75 || a.kills !== 0 || a.ammo !== WEAPONS[a.weapon].magazine || a.medkits !== 2 || a.busyUntil !== 0 || a.cooldown !== 0 || a.fireTick !== -100 || a.hitTick !== -100 || a.targetId !== null || a.path.length !== 0 || a.lastSeen !== null || a.lastSeenTick !== -1000 || a.nextDecision !== COUNTDOWN + i % 6)) fail('Invalid deployment state');
      if (a.alive) {
        if (s.phase !== 'countdown' && a.action === 'idle') fail('Invalid idle action');
        if (a.action === 'firing' && (a.fireTick !== s.tick || a.cooldown <= s.tick || a.targetId === null)) fail('Invalid firing action');
        const busy = a.busyUntil > s.tick;
        const timedAction = a.action === 'healing' || a.action === 'reloading';
        if (busy !== timedAction || a.action === 'healing' && a.medkits < 1 || a.action === 'reloading' && a.ammo !== 0) fail('Invalid timed action');
      }
      if (a.targetId !== null && (a.targetId === a.id || !s.agents.some(b => b.id === a.targetId))) fail('Invalid target');
    }
    const alive = s.agents.filter(a => a.alive);
    if (s.phase === 'intermission' ? alive.length > 1 || s.winner !== (alive[0]?.id ?? null) : s.winner !== null || alive.length < 2) fail('Invalid result');
    if (!point(s.zone) || !finite(s.zone.radius, 0, 62) || !finite(s.zone.nextRadius, 0, 62) || !Number.isInteger(s.zone.stage) || !finite(s.zone.stage, 0, 5) || !finite(s.zone.secondsToShrink, 0, 600)) fail('Invalid zone');
    if (!Array.isArray(s.loot) || s.loot.length !== 28 || new Set(s.loot.map(l => l.id)).size !== 28) fail('Invalid loot count');
    for (const [i, l] of s.loot.entries()) if (l.id !== `loot-${i}` || !point(l) || !walkable(l) || typeof l.active !== 'boolean' || !['medkit', 'shield', ...Object.keys(WEAPONS)].includes(l.kind)) fail('Invalid loot');
    if (!Array.isArray(s.events) || s.events.length !== Math.min(s.sequence, EVENT_LIMIT)) fail('Invalid event budget');
    let previous = Math.max(0, s.sequence - s.events.length);
    for (const e of s.events) {
      if (e.id !== ++previous || !Number.isInteger(e.tick) || !finite(e.tick, 0, s.tick) || !point(e) || typeof e.text !== 'string' || e.text.length > 200 || !['deployment','storm','reload','heal','start','loot','shot','elimination','result'].includes(e.kind)) fail('Invalid event');
      if ([e.actor, e.target].some(id => id !== null && !s.agents.some(a => a.id === id))) fail('Invalid event actor');
    }
  }
}
