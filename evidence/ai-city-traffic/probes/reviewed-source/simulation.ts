import {
  ROAD_COORDS, ROAD_NETWORK, WALK_NETWORK, MAX_ROUTE_NODES, buildTrip, laneBetween, planTrip, replanTrip, planWalk,
  pointOnPath, pointOnWalk, roadLane, walkEdge,
} from './traffic-network.js';
import type { TripPath, Turn } from './traffic-network.js';

export { ROAD_COORDS, ROAD_NETWORK } from './traffic-network.js';
export const STEP_SECONDS = 1 / 30;
export const TRAFFIC_LIMITS = Object.freeze({ vehicles: 144, pending: 96, pedestrians: 48,
  events: 40, commands: 256, completionHistory: 1024, admission: 84, routeNodes: MAX_ROUTE_NODES, reroutesPerTrip: 16 });
export const TRAFFIC_VERSION = 'city-traffic-1';
export type VehicleKind = 'car' | 'taxi' | 'bus' | 'van' | 'emergency';
export type SignalPolicy = 'adaptive' | 'fixed';
export type SignalPhase = 'ns' | 'ew' | 'walk' | 'clearance';
export interface TrafficOptions { seed?: number; demand?: number; policy?: SignalPolicy }
export type TrafficCommand = { type: 'set-demand'; value: number }
  | { type: 'set-policy'; value: SignalPolicy } | { type: 'toggle-incident' } | { type: 'reset'; seed?: number };
export interface CommandReceipt { readonly tick: number; readonly sequence: number; readonly command: TrafficCommand }
export interface VehicleSnapshot {
  readonly id: number; readonly kind: VehicleKind; readonly color: number;
  readonly x: number; readonly z: number; readonly yaw: number; readonly speed: number;
  readonly waiting: boolean; readonly braking: boolean; readonly length: number; readonly width: number;
  readonly routeId: string; readonly origin: string; readonly destination: string;
  readonly laneId: string; readonly laneProgress: number; readonly junctionId: string | null;
  readonly nextJunctionId: string | null; readonly approach: 'ns' | 'ew'; readonly turn: Turn;
  readonly progress: number; readonly stopDistance: number; readonly waitSeconds: number;
  readonly reroutes: number;
  readonly status: 'driving' | 'queued' | 'turning';
}
export interface PedestrianSnapshot {
  readonly id: number; readonly x: number; readonly z: number; readonly yaw: number;
  readonly speed: number; readonly walkPhase: number; readonly color: number;
  readonly crossing: boolean; readonly junctionId: string | null; readonly waiting: boolean;
}
export interface SignalSnapshot {
  readonly id: string; readonly x: number; readonly z: number; readonly phase: SignalPhase;
  readonly remaining: number; readonly queue: number; readonly reservedVehicleId: number | null;
}
export interface TrafficMetrics {
  readonly active: number; readonly queued: number; readonly completed: number;
  /** Metres/second. */ readonly meanSpeed: number;
  /** Trips/minute over the trailing 60 simulated seconds; elapsed window during startup. */ readonly flow: number;
  /** Accumulated stopped seconds averaged over vehicles currently in the city. */ readonly meanWait: number;
  readonly waiting: number; readonly pending: number; readonly generated: number; readonly rejected: number;
  readonly meanTripTime: number; readonly pedestrianCompleted: number; readonly pedestrianCrossings: number;
  readonly turns: number; readonly maxWait: number; readonly reroutes: number;
}
export interface TrafficSnapshot {
  readonly tick: number; readonly seed: number; readonly vehicles: readonly VehicleSnapshot[];
  readonly pedestrians: readonly PedestrianSnapshot[]; readonly signals: readonly SignalSnapshot[];
  readonly metrics: TrafficMetrics; readonly demand: number; readonly policy: SignalPolicy;
  readonly incident: boolean; readonly events: readonly { readonly tick: number; readonly message: string }[];
}

const MIN_GAP = 1.6;
const WALK_TICKS = 450;
const CLEARANCE_TICKS = 45;
const FIXED_GREEN_TICKS = 360;
const MIN_GREEN_TICKS = 210;
const MAX_GREEN_TICKS = 510;
const FLOW_WINDOW = 1800;
const CORNER_GATE = 1.4;
const CITIZEN_SPACING = 0.84;
const PHASES: readonly SignalPhase[] = ['ns', 'clearance', 'ew', 'clearance', 'walk', 'clearance'];
const KINDS: readonly VehicleKind[] = ['car', 'taxi', 'bus', 'van', 'emergency'];
export const VEHICLE_SPECS = Object.freeze({
  car: Object.freeze({ length: 4.1, width: 1.8, speed: 12.5, acceleration: 2.7, brake: 4.8, turnSpeed: 6.8 }),
  taxi: Object.freeze({ length: 4.3, width: 1.85, speed: 13.5, acceleration: 2.9, brake: 4.8, turnSpeed: 7.0 }),
  bus: Object.freeze({ length: 8, width: 2.3, speed: 9.0, acceleration: 1.7, brake: 3.8, turnSpeed: 4.8 }),
  van: Object.freeze({ length: 5, width: 2.05, speed: 10.5, acceleration: 2.2, brake: 4.3, turnSpeed: 5.8 }),
  emergency: Object.freeze({ length: 4.8, width: 2.05, speed: 15.5, acceleration: 3.2, brake: 5.2, turnSpeed: 7.5 }),
});
const PALETTE = [0xf2ede5, 0x286f84, 0xcf694b, 0x80a595, 0x384b69, 0xdea947, 0x929ba1, 0x8b5e78];
const CITIZEN_PALETTE = [0xf1a36d, 0x5f8ba6, 0xd97869, 0xf2c561, 0x739585, 0xb991b9, 0xd4d1c8, 0x59647b];
const STREAM_NAMES = ['demand', 'routes', 'reroutes', 'drivers', 'citizens', 'palette'] as const;
type StreamName = typeof STREAM_NAMES[number];
interface Driver {
  id: number; kind: VehicleKind; route: number[]; segment: number; position: number; speed: number;
  desiredSpeed: number; color: number; waitTicks: number; bornTick: number; lastProgressTick: number; braking: boolean;
  reroutes: number; lastReplanTick: number;
}
interface WaitingTrip { id: number; kind: VehicleKind; route: number[]; desiredSpeed: number; color: number; requestedTick: number }
interface Citizen {
  id: number; route: number[]; edge: number; position: number; speed: number; desiredSpeed: number;
  color: number; walkPhase: number; waiting: boolean;
  cornerFrom: number | null; cornerProgress: number;
  nextRoute: number[];
}
interface JunctionSignal {
  stage: number; started: number; deadline: number; reservation: number | null;
  queueNS: number; queueEW: number; lastAdmissionTick: number;
}
interface Totals {
  completed: number; generated: number; rejected: number; completedWaitTicks: number; totalTravelTicks: number;
  pedestrianCompleted: number; pedestrianCrossings: number; turns: number; reroutes: number;
}
interface State {
  seed: number; tick: number; demand100: number; policy: SignalPolicy; incident: boolean;
  initialDemand100: number; initialPolicy: SignalPolicy;
  rng: Record<StreamName, number>; nextVehicleId: number; vehicles: Driver[]; pending: WaitingTrip[];
  pedestrians: Citizen[]; signals: JunctionSignal[]; totals: Totals;
  cornerOwners: (number | null)[];
  completions: { id: number; bornTick: number; tick: number; waitTicks: number; travelTicks: number }[];
  events: { tick: number; message: string }[]; commands: CommandReceipt[];
  nextCommandSequence: number; retiredCommandDigest: string; lastCongestionEventTick: number;
}
interface Occupant { id: number; position: number; length: number; speed: number }
type Occupancy = Map<string, Occupant[]>;
export class TrafficStateError extends Error {
  constructor(readonly code: 'INVALID_INPUT' | 'INVALID_STATE' | 'VERSION_MISMATCH' | 'CHECKSUM_MISMATCH' | 'INVARIANT_VIOLATION', message: string) {
    super(message); this.name = 'TrafficStateError';
  }
}
function q(value: number): number { return Math.round(value * 1_000_000) / 1_000_000; }
function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return (result >>> 0).toString(16).padStart(8, '0');
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
const CONFIG_HASH = hash(canonical({ version: TRAFFIC_VERSION, step: STEP_SECONDS, limits: TRAFFIC_LIMITS,
  roads: ROAD_COORDS, minGap: MIN_GAP, walk: WALK_TICKS, clearance: CLEARANCE_TICKS, fixedGreen: FIXED_GREEN_TICKS,
  minGreen: MIN_GREEN_TICKS, maxGreen: MAX_GREEN_TICKS, fleet: VEHICLE_SPECS, rng: 'xorshift32-named-v1',
  pedestrians: { model: 'reserved-corners-v1', gate: CORNER_GATE, spacing: CITIZEN_SPACING }, completionSchema: 2 }));
function frozen<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) frozen(child);
    Object.freeze(value);
  }
  return value;
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function inputError(message: string): never { throw new TrafficStateError('INVALID_INPUT', message); }
function validSeed(seed: unknown): number {
  if (typeof seed !== 'number' || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) inputError('Seed must be an unsigned 32-bit integer');
  return seed;
}
function validDemand(demand: unknown): number {
  if (typeof demand !== 'number' || !Number.isFinite(demand) || demand < 0.25 || demand > 2) inputError('Demand must be a number from 0.25 to 2');
  return Math.round(demand * 100);
}
function validPolicy(policy: unknown): SignalPolicy {
  if (policy !== 'fixed' && policy !== 'adaptive') inputError('Signal policy must be adaptive or fixed');
  return policy;
}
function normalizeCommand(value: unknown, seed: number): TrafficCommand {
  if (!record(value) || typeof value.type !== 'string') inputError('A command requires a recognized type');
  const allowed = value.type === 'set-demand' || value.type === 'set-policy' ? ['type', 'value']
    : value.type === 'reset' ? ['type', 'seed'] : ['type'];
  if (Object.keys(value).some(key => !allowed.includes(key))) inputError('Command contains an unknown field');
  switch (value.type) {
    case 'set-demand': return { type: value.type, value: validDemand(value.value) / 100 };
    case 'set-policy': return { type: value.type, value: validPolicy(value.value) };
    case 'toggle-incident': return { type: value.type };
    case 'reset': return { type: value.type, seed: validSeed(value.seed === undefined ? seed : value.seed) };
    default: return inputError('Unknown traffic command');
  }
}

function cornerGeometry(person: Citizen): { start: { x: number; z: number }; end: { x: number; z: number }; length: number } {
  const incoming = walkEdge(person.cornerFrom!, person.route[person.edge]);
  const outgoing = walkEdge(person.route[person.edge], person.route[person.edge + 1]);
  const start = pointOnWalk(incoming, incoming.length), end = pointOnWalk(outgoing, 0);
  return { start, end, length: Math.hypot(end.x - start.x, end.z - start.z) };
}
function citizenPose(person: Citizen): { x: number; z: number; yaw: number } {
  const edge = walkEdge(person.route[person.edge], person.route[person.edge + 1]);
  if (person.cornerFrom === null) return pointOnWalk(edge, person.position);
  const corner = cornerGeometry(person);
  if (corner.length < 0.000001) return pointOnWalk(edge, 0);
  const fraction = Math.min(1, person.cornerProgress / corner.length);
  return { x: corner.start.x + (corner.end.x - corner.start.x) * fraction,
    z: corner.start.z + (corner.end.z - corner.start.z) * fraction,
    yaw: Math.atan2(corner.end.x - corner.start.x, corner.end.z - corner.start.z) };
}
function citizenInRoad(person: Citizen): boolean {
  const edge = walkEdge(person.route[person.edge], person.route[person.edge + 1]);
  return person.cornerFrom === null && edge.crossing && person.position > CORNER_GATE + 0.000001
    && person.position < edge.length - CORNER_GATE - 0.000001;
}

/** The only authority for browser and headless traffic. No wall clock, DOM or renderer imports. */
export class TrafficSimulation {
  private state!: State;
  private readonly paths = new Map<number, TripPath>();
  private failure: string | null = null;

  constructor(options: TrafficOptions = {}) {
    if (!record(options) || Object.keys(options).some(key => !['seed', 'demand', 'policy'].includes(key))) inputError('Invalid traffic options');
    this.initialize(validSeed(options.seed ?? 2026), validDemand(options.demand ?? 1), validPolicy(options.policy ?? 'adaptive'));
  }

  private random(stream: StreamName): number {
    let value = this.state.rng[stream];
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    this.state.rng[stream] = value >>> 0;
    return (value >>> 0) / 4294967296;
  }
  private integer(stream: StreamName, size: number): number { return Math.floor(this.random(stream) * size); }
  private event(message: string): void {
    this.state.events.push({ tick: this.state.tick, message });
    if (this.state.events.length > TRAFFIC_LIMITS.events) this.state.events.shift();
  }

  private initialize(seed: number, demand100: number, policy: SignalPolicy): void {
    const rng = {} as Record<StreamName, number>;
    for (const stream of STREAM_NAMES) rng[stream] = parseInt(hash(`${TRAFFIC_VERSION}:${seed}:${stream}`), 16) || 0x9e3779b9;
    this.state = { seed, tick: 0, demand100, policy, initialDemand100: demand100, initialPolicy: policy, incident: false, rng, nextVehicleId: 1,
      vehicles: [], pending: [], pedestrians: [], signals: [], cornerOwners: new Array<number | null>(64).fill(null),
      totals: { completed: 0, generated: 0, rejected: 0, completedWaitTicks: 0, totalTravelTicks: 0,
        pedestrianCompleted: 0, pedestrianCrossings: 0, turns: 0, reroutes: 0 },
      completions: [], events: [], commands: [], nextCommandSequence: 1, retiredCommandDigest: hash(''), lastCongestionEventTick: 0 };
    this.paths.clear(); this.failure = null;
    for (let index = 0; index < 16; index++) this.state.signals.push({ stage: index % 2 ? 2 : 0,
      started: 0, deadline: 210 + index * 47 % 180, reservation: null, queueNS: 0, queueEW: 0, lastAdmissionTick: 0 });
    const congestion = new Map<string, number>();
    for (let portal = 16; portal < 32; portal++) {
      for (let slot = 0; slot < 2; slot++) {
        const trip = this.makeTrip(congestion, portal, KINDS[(portal - 16 + slot * 2) % KINDS.length]);
        this.state.totals.generated++;
        this.activateTrip(trip, slot === 0 ? 14 : 0, 3);
      }
    }
    const sidewalks = WALK_NETWORK.edges.filter(edge => !edge.crossing);
    for (let id = 1; id <= TRAFFIC_LIMITS.pedestrians; id++) {
      let edge = sidewalks[0], position = 2, placed = false;
      for (let attempt = 0; attempt < 128; attempt++) {
        edge = sidewalks[(id * 17 + this.integer('citizens', sidewalks.length)) % sidewalks.length];
        position = q(2 + this.random('citizens') * (edge.length - 4));
        const pose = pointOnWalk(edge, position);
        if (this.state.pedestrians.every(person => {
          const other = citizenPose(person);
          return (pose.x - other.x) ** 2 + (pose.z - other.z) ** 2 >= CITIZEN_SPACING ** 2;
        })) { placed = true; break; }
      }
      if (!placed) throw new TrafficStateError('INVARIANT_VIOLATION', 'Citizen spawn spacing budget exhausted');
      let goal = this.integer('citizens', 64);
      if (goal === edge.to) goal = (goal + 23) % 64;
      const route = [edge.from, ...planWalk(edge.to, goal, this.integer('citizens', 0xffffffff))];
      let nextGoal = this.integer('citizens', 63);
      if (nextGoal >= goal) nextGoal++;
      const nextRoute = planWalk(goal, nextGoal, this.integer('citizens', 0xffffffff));
      const speed = q(1.25 + this.random('citizens') * 0.4);
      this.state.pedestrians.push({ id, route, nextRoute, edge: 0, position,
        speed, desiredSpeed: speed, color: CITIZEN_PALETTE[this.integer('palette', CITIZEN_PALETTE.length)],
        walkPhase: this.random('citizens') * Math.PI * 2, waiting: false, cornerFrom: null, cornerProgress: 0 });
    }
    this.updateQueues();
    this.event('The city is awake. Drivers follow signals; citizens wait for safe crossings.');
  }

  private makeTrip(congestion: ReadonlyMap<string, number>, origin = 16 + this.integer('routes', 16), kind?: VehicleKind): WaitingTrip {
    let destination = 16 + this.integer('routes', 15);
    if (destination >= origin) destination++;
    if (!kind) {
      const choice = this.random('drivers');
      kind = choice < 0.49 ? 'car' : choice < 0.69 ? 'taxi' : choice < 0.79 ? 'bus' : choice < 0.96 ? 'van' : 'emergency';
    }
    const route = planTrip(origin, destination, this.integer('routes', 0xffffffff), congestion, this.state.incident);
    const color = kind === 'taxi' ? 0xf3ba35 : kind === 'bus' ? 0x388e9c : kind === 'emergency' ? 0xe9eae6
      : PALETTE[this.integer('palette', PALETTE.length)];
    return { id: this.state.nextVehicleId++, kind, route, desiredSpeed: q(VEHICLE_SPECS[kind].speed * (0.92 + this.random('drivers') * 0.14)),
      color, requestedTick: this.state.tick };
  }
  private activateTrip(trip: WaitingTrip, position = 0, speed = 0): void {
    this.paths.set(trip.id, buildTrip(trip.route));
    this.state.vehicles.push({ id: trip.id, kind: trip.kind, route: trip.route, segment: 0, position, speed,
      desiredSpeed: trip.desiredSpeed, color: trip.color, waitTicks: 0, bornTick: this.state.tick,
      lastProgressTick: this.state.tick, braking: false, reroutes: 0, lastReplanTick: this.state.tick });
  }
  private path(driver: Driver): TripPath {
    const path = this.paths.get(driver.id);
    if (!path) throw new TrafficStateError('INVARIANT_VIOLATION', 'Active trip has no authoritative route');
    return path;
  }

  command(value: TrafficCommand | unknown): CommandReceipt {
    const command = normalizeCommand(value, this.state.seed);
    if (this.failure && command.type !== 'reset') throw new TrafficStateError('INVARIANT_VIOLATION', this.failure);
    if (this.state.commands.filter(entry => entry.tick === this.state.tick).length >= 16) inputError('At most 16 local commands are accepted per tick');
    switch (command.type) {
      case 'set-demand':
        this.state.demand100 = Math.round(command.value * 100);
        this.event(`Arrival demand is now ${command.value.toFixed(2)}×. New trips join available entry lanes.`); break;
      case 'set-policy':
        this.state.policy = command.value;
        this.event(command.value === 'adaptive' ? 'Signals now adjust green time to observed queues.' : 'Signals now use fixed green times. Crossing clearance stays protected.'); break;
      case 'toggle-incident':
        this.state.incident = !this.state.incident;
        this.event(this.state.incident ? 'Roadworks slow the eastbound Market link. New drivers consider alternate routes.' : 'The Market link has reopened at its normal speed.'); break;
      case 'reset':
        this.initialize(command.seed!, this.state.demand100, this.state.policy);
        this.event('A fresh city run has begun. Traffic and signal timing start together.'); break;
    }
    const receipt = frozen({ tick: this.state.tick, sequence: this.state.nextCommandSequence++, command });
    this.state.commands.push(receipt);
    if (this.state.commands.length > TRAFFIC_LIMITS.commands) {
      const retired = this.state.commands.shift()!;
      this.state.retiredCommandDigest = hash(this.state.retiredCommandDigest + canonical(retired));
    }
    return receipt;
  }

  step(ticks = 1): void {
    if (!Number.isSafeInteger(ticks) || ticks < 0 || ticks > 108000) inputError('Step count must be an integer from 0 to 108000');
    if (this.failure) throw new TrafficStateError('INVARIANT_VIOLATION', this.failure);
    try { for (let index = 0; index < ticks; index++) this.tick(); }
    catch (error) { this.failure = error instanceof Error ? error.message : 'Traffic authority failed'; throw error; }
  }
  private tick(): void {
    this.state.tick++;
    this.updateSignals();
    const occupancy = this.occupancy();
    this.arrivals(occupancy);
    if (this.state.tick % 30 === 0) this.replanBlockedDrivers(occupancy);
    this.reserveJunctions(occupancy);
    this.moveDrivers(occupancy);
    this.releaseJunctions();
    this.moveCitizens();
    this.updateQueues();
    while (this.state.completions[0]?.tick <= this.state.tick - FLOW_WINDOW) this.state.completions.shift();
    if (this.state.tick % 300 === 0) this.assertRuntime();
    if (this.state.tick - this.state.lastCongestionEventTick >= 900
      && this.state.vehicles.some(driver => this.state.tick - driver.lastProgressTick > 1800)) {
      this.state.lastCongestionEventTick = this.state.tick;
      this.event('A queue is waiting for downstream space. Junctions stay clear while traffic works through it.');
    }
  }

  private occupancy(): Occupancy {
    const occupancy: Occupancy = new Map();
    const put = (lane: string, driver: Driver, position: number): void => {
      let entries = occupancy.get(lane);
      if (!entries) { entries = []; occupancy.set(lane, entries); }
      entries.push({ id: driver.id, position, length: VEHICLE_SPECS[driver.kind].length, speed: driver.speed });
    };
    for (const driver of this.state.vehicles) {
      const part = this.path(driver).segments[driver.segment];
      if (part.kind === 'lane') put(part.laneId, driver, driver.position);
      else {
        // Ghost occupancy protects the tail on the incoming lane and the nose on the receiving lane.
        put(part.incomingLaneId, driver, roadLane(part.incomingLaneId).length + driver.position);
        put(part.outgoingLaneId, driver, driver.position - part.length);
      }
    }
    for (const entries of occupancy.values()) entries.sort((a, b) => a.position - b.position || a.id - b.id);
    return occupancy;
  }

  private arrivals(occupancy: Occupancy): void {
    if (this.random('demand') < 0.7 * this.state.demand100 / 100 * STEP_SECONDS) {
      this.state.totals.generated++;
      if (this.state.pending.length >= TRAFFIC_LIMITS.pending) {
        this.state.totals.rejected++;
        if (this.state.totals.rejected % 100 === 1) this.event('Entry queues are full. Excess arrival requests are counted as deferred outside the district.');
      } else {
        const congestion = new Map<string, number>();
        for (const [lane, entries] of occupancy) congestion.set(lane, entries.length);
        this.state.pending.push(this.makeTrip(congestion));
      }
    }
    const remaining: WaitingTrip[] = [];
    for (const trip of this.state.pending) {
      const lane = laneBetween(trip.route[0], trip.route[1]);
      const entries = occupancy.get(lane.id) ?? [];
      const halfLength = VEHICLE_SPECS[trip.kind].length / 2;
      const free = entries.every(entry => entry.position - entry.length / 2 >= halfLength + MIN_GAP);
      // Meter entries before every internal road is occupied; excess demand remains visible outside.
      if (this.state.vehicles.length < TRAFFIC_LIMITS.admission && free) {
        this.activateTrip(trip);
        entries.unshift({ id: trip.id, position: 0, length: halfLength * 2, speed: 0 });
        occupancy.set(lane.id, entries);
      } else remaining.push(trip);
    }
    this.state.pending = remaining;
    this.state.vehicles.sort((a, b) => a.id - b.id);
  }

  private replanBlockedDrivers(occupancy: Occupancy): void {
    const candidates = this.state.vehicles.filter(driver => {
      if (this.state.tick - driver.lastProgressTick < 1350 || this.state.tick - driver.lastReplanTick < 450
        || driver.reroutes >= TRAFFIC_LIMITS.reroutesPerTrip) return false;
      const part = this.path(driver).segments[driver.segment];
      if (part.kind !== 'lane' || part.junction === null || this.state.signals[part.junction].reservation !== null
        || part.length - driver.position - VEHICLE_SPECS[driver.kind].length / 2 - MIN_GAP > 1) return false;
      const receivingLane = this.path(driver).segments[driver.segment + 1].outgoingLaneId;
      const required = VEHICLE_SPECS[driver.kind].length + MIN_GAP * 2;
      if (!(occupancy.get(receivingLane) ?? []).some(entry => entry.id !== driver.id && entry.position - entry.length / 2 < required)) return false;
      return !(occupancy.get(part.laneId) ?? []).some(entry => entry.id !== driver.id && entry.position > driver.position);
    });
    candidates.sort((a, b) => a.lastProgressTick - b.lastProgressTick || a.id - b.id);
    const driver = candidates[0];
    if (!driver) return;
    driver.lastReplanTick = this.state.tick;
    const part = this.path(driver).segments[driver.segment];
    const required = VEHICLE_SPECS[driver.kind].length + MIN_GAP * 2;
    const allowed = new Set<string>();
    const congestion = new Map<string, number>();
    for (const [lane, entries] of occupancy) congestion.set(lane, entries.length);
    for (const lane of ROAD_NETWORK.lanes) {
      if (lane.from !== part.junction) continue;
      if (!(occupancy.get(lane.id) ?? []).some(entry => entry.id !== driver.id && entry.position - entry.length / 2 < required)) allowed.add(lane.id);
    }
    const route = replanTrip(driver.route, driver.segment / 2 + 1, this.integer('reroutes', 0xffffffff), congestion, this.state.incident, allowed);
    if (!route || route.join(',') === driver.route.join(',')) return;
    const replacement = buildTrip(route);
    driver.route = route; driver.reroutes++;
    this.paths.set(driver.id, replacement);
    this.state.totals.reroutes++;
    if (this.state.totals.reroutes % 5 === 1) this.event('A waiting driver finds a clear detour and keeps the original destination.');
  }

  private updateQueues(): void {
    for (const signal of this.state.signals) { signal.queueNS = 0; signal.queueEW = 0; }
    for (const driver of this.state.vehicles) {
      const part = this.path(driver).segments[driver.segment];
      if (part.kind !== 'lane' || part.junction === null || driver.speed > 2 || part.length - driver.position > 24) continue;
      const signal = this.state.signals[part.junction];
      if (part.approach === 'ns') signal.queueNS++; else signal.queueEW++;
    }
  }
  private activeCrossing(junction: number): boolean {
    return this.state.pedestrians.some(person => citizenInRoad(person)
      && walkEdge(person.route[person.edge], person.route[person.edge + 1]).junction === junction);
  }
  private updateSignals(): void {
    for (let index = 0; index < this.state.signals.length; index++) {
      const signal = this.state.signals[index];
      if (this.state.policy === 'adaptive' && (signal.stage === 0 || signal.stage === 2)
        && this.state.tick - signal.started >= MIN_GREEN_TICKS) {
        const served = signal.stage === 0 ? signal.queueNS : signal.queueEW;
        const other = signal.stage === 0 ? signal.queueEW : signal.queueNS;
        if (served === 0 && other >= 2) signal.deadline = Math.min(signal.deadline, this.state.tick);
      }
      if (this.state.tick < signal.deadline) continue;
      const next = (signal.stage + 1) % PHASES.length;
      if (PHASES[signal.stage] === 'clearance' && (signal.reservation !== null || this.activeCrossing(index))) continue;
      signal.stage = next; signal.started = this.state.tick;
      let duration = CLEARANCE_TICKS;
      if (next === 4) duration = WALK_TICKS;
      if (next === 0 || next === 2) {
        const queue = next === 0 ? signal.queueNS : signal.queueEW;
        duration = this.state.policy === 'fixed' ? FIXED_GREEN_TICKS
          : Math.max(MIN_GREEN_TICKS, Math.min(MAX_GREEN_TICKS, MIN_GREEN_TICKS + queue * 45));
      }
      signal.deadline = this.state.tick + duration;
    }
  }

  private reserveJunctions(occupancy: Occupancy): void {
    for (let index = 0; index < 16; index++) {
      const signal = this.state.signals[index], phase = PHASES[signal.stage];
      if (signal.reservation !== null || (phase !== 'ns' && phase !== 'ew') || signal.deadline - this.state.tick < 30) continue;
      const candidates = this.state.vehicles.filter(driver => {
        const part = this.path(driver).segments[driver.segment];
        if (part.kind !== 'lane' || part.junction !== index || part.approach !== phase) return false;
        if (part.length - driver.position - VEHICLE_SPECS[driver.kind].length / 2 - MIN_GAP > 5) return false;
        return !(occupancy.get(part.laneId) ?? []).some(entry => entry.id !== driver.id && entry.position > driver.position);
      });
      candidates.sort((a, b) => (b.waitTicks + (b.kind === 'emergency' ? 150 : 0))
        - (a.waitTicks + (a.kind === 'emergency' ? 150 : 0)) || a.id - b.id);
      for (const driver of candidates) {
        const crossing = this.path(driver).segments[driver.segment + 1];
        const entries = occupancy.get(crossing.outgoingLaneId) ?? [];
        const required = VEHICLE_SPECS[driver.kind].length + MIN_GAP * 2;
        if (entries.some(entry => entry.id !== driver.id && entry.position - entry.length / 2 < required)) continue;
        signal.reservation = driver.id; signal.lastAdmissionTick = this.state.tick;
        if (driver.kind === 'emergency' && driver.waitTicks > 30) this.event('An emergency unit receives safe junction priority. Pedestrian clearance stays protected.');
        break;
      }
    }
  }

  private moveDrivers(occupancy: Occupancy): void {
    const completed = new Set<number>();
    for (const driver of this.state.vehicles) {
      const path = this.path(driver), part = path.segments[driver.segment], spec = VEHICLE_SPECS[driver.kind];
      let available = Infinity, leaderSpeed = Infinity;
      const constrain = (distance: number, speed: number): void => {
        if (distance < available) { available = Math.max(0, distance); leaderSpeed = speed; }
      };
      let limit = driver.desiredSpeed;
      if (part.kind === 'lane') {
        for (const entry of occupancy.get(part.laneId) ?? []) {
          if (entry.id !== driver.id && entry.position > driver.position) {
            constrain(entry.position - driver.position - (spec.length + entry.length) / 2 - MIN_GAP, entry.speed);
          }
        }
        if (part.junction !== null) {
          const signal = this.state.signals[part.junction];
          if (signal.reservation !== driver.id) constrain(part.length - driver.position - spec.length / 2 - MIN_GAP, 0);
          const crossing = path.segments[driver.segment + 1];
          if (part.length - driver.position < 18) limit = Math.min(limit, crossing.turn === 'straight' ? 9.5 : spec.turnSpeed);
          if (signal.reservation === driver.id) {
            for (const entry of occupancy.get(crossing.outgoingLaneId) ?? []) if (entry.id !== driver.id) {
              constrain(part.length - driver.position + crossing.length + entry.position - (spec.length + entry.length) / 2 - MIN_GAP, entry.speed);
            }
          }
        }
        if (this.state.incident && part.laneId === 'j5>j6') limit = Math.min(limit, 3);
      } else {
        if (this.state.signals[part.junction!].reservation !== driver.id) throw new TrafficStateError('INVARIANT_VIOLATION', 'Vehicle entered an unreserved junction');
        limit = Math.min(limit, part.turn === 'straight' ? 9.5 : spec.turnSpeed);
        for (const entry of occupancy.get(part.outgoingLaneId) ?? []) if (entry.id !== driver.id) {
          constrain(part.length - driver.position + entry.position - (spec.length + entry.length) / 2 - MIN_GAP, entry.speed);
        }
        if (this.state.incident && part.outgoingLaneId === 'j5>j6' && part.length - driver.position < 10) limit = Math.min(limit, 3);
      }
      if (Number.isFinite(available)) {
        limit = Math.min(limit, Math.sqrt(2 * spec.brake * available));
        if (Number.isFinite(leaderSpeed)) limit = Math.min(limit, leaderSpeed + Math.max(0, available - driver.speed * 0.55) / 1.1);
        if (available < 0.02) limit = 0;
      }
      const oldSpeed = driver.speed;
      const nextSpeed = Math.max(0, Math.min(oldSpeed + spec.acceleration * STEP_SECONDS,
        Math.max(oldSpeed - spec.brake * STEP_SECONDS, limit)));
      const advance = Math.max(0, Math.min(available, nextSpeed * STEP_SECONDS));
      driver.speed = q(advance / STEP_SECONDS);
      driver.braking = driver.speed < oldSpeed - 0.025;
      if (driver.speed < 0.3 && available < 1) driver.waitTicks++;
      if (advance > 0.006) driver.lastProgressTick = this.state.tick;
      driver.position = q(driver.position + advance);
      while (driver.position >= path.segments[driver.segment].length - 0.000001) {
        driver.position = Math.max(0, q(driver.position - path.segments[driver.segment].length));
        driver.segment++;
        if (driver.segment >= path.segments.length) { completed.add(driver.id); break; }
        const entered = path.segments[driver.segment];
        if (entered.kind === 'junction') {
          if (this.state.signals[entered.junction!].reservation !== driver.id) throw new TrafficStateError('INVARIANT_VIOLATION', 'Junction admission was not authorized');
          if (entered.turn !== 'straight') this.state.totals.turns++;
        }
      }
      if (completed.has(driver.id)) {
        this.state.totals.completed++;
        this.state.totals.completedWaitTicks += driver.waitTicks;
        const travelTicks = this.state.tick - driver.bornTick;
        this.state.totals.totalTravelTicks += travelTicks;
        this.state.completions.push({ id: driver.id, bornTick: driver.bornTick,
          tick: this.state.tick, waitTicks: driver.waitTicks, travelTicks });
        if (this.state.completions.length > TRAFFIC_LIMITS.completionHistory) throw new TrafficStateError('INVARIANT_VIOLATION', 'Completion history budget exceeded');
        if (this.state.totals.completed % 20 === 0) this.event(`${this.state.totals.completed} trips have reached their destinations. New arrivals keep the city moving.`);
      }
    }
    if (completed.size) {
      this.state.vehicles = this.state.vehicles.filter(driver => !completed.has(driver.id));
      for (const id of completed) this.paths.delete(id);
    }
  }

  private releaseJunctions(): void {
    const drivers = new Map(this.state.vehicles.map(driver => [driver.id, driver]));
    for (let index = 0; index < 16; index++) {
      const signal = this.state.signals[index];
      if (signal.reservation === null) continue;
      const driver = drivers.get(signal.reservation);
      if (!driver) { signal.reservation = null; continue; }
      const part = this.path(driver).segments[driver.segment];
      if (part.kind === 'lane' && roadLane(part.laneId).from === index
        && driver.position >= VEHICLE_SPECS[driver.kind].length / 2 + MIN_GAP) signal.reservation = null;
    }
  }

  private moveCitizens(): void {
    const poses = this.state.pedestrians.map(citizenPose);
    for (let index = 0; index < this.state.pedestrians.length; index++) {
      const person = this.state.pedestrians[index];
      const edge = walkEdge(person.route[person.edge], person.route[person.edge + 1]);
      if (person.cornerFrom !== null && cornerGeometry(person).length < 0.000001) {
        person.cornerFrom = null; person.cornerProgress = 0;
      }
      if (person.cornerFrom === null && person.position >= CORNER_GATE - 0.000001
        && this.state.cornerOwners[edge.from] === person.id) this.state.cornerOwners[edge.from] = null;
      let available: number;
      if (person.cornerFrom !== null) available = cornerGeometry(person).length - person.cornerProgress;
      else {
        available = edge.length - person.position;
        if (edge.crossing) {
          if (person.position < CORNER_GATE - 0.000001) {
            // This staging strip is entirely on the near-side sidewalk. Release its
            // corner before requesting the far-side landing, avoiding lock cycles.
            available = Math.min(available, CORNER_GATE - person.position);
          } else if (person.position <= CORNER_GATE + 0.000001) {
            const signal = this.state.signals[edge.junction!];
            const roadTicks = Math.ceil((edge.length - 2 * CORNER_GATE) / person.desiredSpeed / STEP_SECONDS) + 3;
            const safePhase = PHASES[signal.stage] === 'walk' && signal.reservation === null
              && signal.deadline - this.state.tick >= roadTicks;
            const landing = pointOnWalk(edge, edge.length - CORNER_GATE);
            const landingClear = poses.every((other, otherIndex) => otherIndex === index
              || (landing.x - other.x) ** 2 + (landing.z - other.z) ** 2 >= CITIZEN_SPACING ** 2);
            if (safePhase && landingClear && this.state.cornerOwners[edge.to] === null) this.state.cornerOwners[edge.to] = person.id;
            if (!safePhase && this.state.cornerOwners[edge.to] === person.id) this.state.cornerOwners[edge.to] = null;
            if (!safePhase || this.state.cornerOwners[edge.to] !== person.id) available = 0;
          } else if (person.position < edge.length - CORNER_GATE - 0.000001 && this.state.cornerOwners[edge.to] !== person.id) {
            throw new TrafficStateError('INVARIANT_VIOLATION', 'Crossing citizen has no reserved landing');
          }
          // A blocked landing is already beyond the road edge. Give up the corner
          // while waiting here so opposing staged walkers can finish their trips.
          if (person.position >= edge.length - CORNER_GATE - 0.000001
            && !this.cornerExitHasRoom(person) && this.state.cornerOwners[edge.to] === person.id)
            this.state.cornerOwners[edge.to] = null;
        }
        if (person.position + person.desiredSpeed * STEP_SECONDS > edge.length - CORNER_GATE
          && (person.position >= edge.length - CORNER_GATE - 0.000001 || !edge.crossing)
          && this.state.cornerOwners[edge.to] !== person.id) {
          if (this.state.cornerOwners[edge.to] === null && this.cornerExitHasRoom(person)) this.state.cornerOwners[edge.to] = person.id;
          else available = Math.min(available, Math.max(0, edge.length - CORNER_GATE - person.position));
        }
      }
      let advance = Math.max(0, Math.min(available, person.desiredSpeed * STEP_SECONDS));
      const proposed = person.cornerFrom === null
        ? { ...person, position: q(person.position + advance) }
        : { ...person, cornerProgress: q(person.cornerProgress + advance) };
      const pose = citizenPose(proposed);
      if (poses.some((other, otherIndex) => otherIndex !== index
        && (pose.x - other.x) ** 2 + (pose.z - other.z) ** 2 < CITIZEN_SPACING ** 2 - 0.000001)) {
        advance = 0;
      }
      person.speed = q(advance / STEP_SECONDS); person.waiting = advance < 0.001;
      person.walkPhase = (person.walkPhase + advance * 7) % (Math.PI * 2);
      if (person.cornerFrom !== null) {
        person.cornerProgress = q(person.cornerProgress + advance);
        if (person.cornerProgress >= cornerGeometry(person).length - 0.000001) {
          person.cornerFrom = null; person.cornerProgress = 0;
        }
      } else {
        person.position = q(person.position + advance);
        if (person.position >= CORNER_GATE - 0.000001 && this.state.cornerOwners[edge.from] === person.id)
          this.state.cornerOwners[edge.from] = null;
        if (person.position >= edge.length - 0.000001) {
          if (this.state.cornerOwners[edge.to] !== person.id) throw new TrafficStateError('INVARIANT_VIOLATION', 'Citizen entered an occupied corner');
          if (edge.crossing) this.state.totals.pedestrianCrossings++;
          person.edge++; person.position = 0;
          if (person.edge >= person.route.length - 1) {
            this.state.totals.pedestrianCompleted++;
            person.route = person.nextRoute; person.edge = 0;
            const start = person.route[person.route.length - 1];
            let goal = this.integer('citizens', 63);
            if (goal >= start) goal++;
            person.nextRoute = planWalk(start, goal, this.integer('citizens', 0xffffffff));
          }
          person.cornerFrom = edge.from; person.cornerProgress = 0;
        }
      }
      poses[index] = citizenPose(person);
    }
  }

  private cornerExitHasRoom(person: Citizen): boolean {
    const corner = person.route[person.edge + 1];
    const next = person.edge + 2 < person.route.length ? person.route[person.edge + 2] : person.nextRoute[1];
    return this.state.pedestrians.every(other => other.id === person.id || other.route[other.edge] !== corner
      || other.route[other.edge + 1] !== next || other.position >= CORNER_GATE + CITIZEN_SPACING + 0.1);
  }

  snapshot(): TrafficSnapshot {
    const vehicles = this.state.vehicles.map((driver): VehicleSnapshot => {
      const path = this.path(driver), part = path.segments[driver.segment], pose = pointOnPath(part, driver.position);
      const spec = VEHICLE_SPECS[driver.kind];
      const waiting = driver.speed < 0.3;
      const next = part.kind === 'lane' ? path.segments[driver.segment + 1] : part;
      return { id: driver.id, kind: driver.kind, color: driver.color, ...pose, speed: driver.speed,
        length: spec.length, width: spec.width, waiting, braking: driver.braking,
        routeId: driver.route.map(index => ROAD_NETWORK.nodes[index].id).join('>'),
        origin: ROAD_NETWORK.nodes[driver.route[0]].label,
        destination: ROAD_NETWORK.nodes[driver.route[driver.route.length - 1]].label,
        laneId: part.laneId, laneProgress: part.kind === 'lane' ? driver.position : roadLane(part.incomingLaneId).length + driver.position,
        junctionId: part.kind === 'junction' ? `j${part.junction}` : null,
        nextJunctionId: part.junction === null ? null : `j${part.junction}`,
        approach: part.approach, turn: next?.kind === 'junction' ? next.turn : 'straight',
        progress: Math.min(1, (path.prefix[driver.segment] + driver.position) / path.length),
        stopDistance: part.kind === 'lane' && part.junction !== null ? part.length - driver.position - spec.length / 2 - MIN_GAP : 0,
        waitSeconds: driver.waitTicks * STEP_SECONDS, reroutes: driver.reroutes,
        status: part.kind === 'junction' ? 'turning' : waiting ? 'queued' : 'driving' };
    });
    const pedestrians = this.state.pedestrians.map((person): PedestrianSnapshot => {
      const edge = walkEdge(person.route[person.edge], person.route[person.edge + 1]);
      return { id: person.id, ...citizenPose(person), speed: person.speed,
        walkPhase: person.walkPhase, color: person.color, crossing: citizenInRoad(person),
        junctionId: edge.crossing ? `j${edge.junction}` : null, waiting: person.waiting };
    });
    const signals = this.state.signals.map((signal, index): SignalSnapshot => ({ id: `j${index}`,
      x: ROAD_NETWORK.nodes[index].x, z: ROAD_NETWORK.nodes[index].z, phase: PHASES[signal.stage],
      remaining: Math.max(0, signal.deadline - this.state.tick) * STEP_SECONDS,
      queue: signal.queueNS + signal.queueEW, reservedVehicleId: signal.reservation }));
    const active = vehicles.length, waiting = vehicles.filter(vehicle => vehicle.waiting).length;
    const totals = this.state.totals;
    const metrics: TrafficMetrics = { active, waiting, pending: this.state.pending.length, queued: waiting + this.state.pending.length,
      completed: totals.completed, generated: totals.generated, rejected: totals.rejected,
      meanSpeed: active ? vehicles.reduce((sum, vehicle) => sum + vehicle.speed, 0) / active : 0,
      meanWait: active ? vehicles.reduce((sum, vehicle) => sum + vehicle.waitSeconds, 0) / active : 0,
      flow: this.state.completions.length * 60 / Math.max(1, Math.min(this.state.tick, FLOW_WINDOW) * STEP_SECONDS),
      meanTripTime: totals.completed ? totals.totalTravelTicks * STEP_SECONDS / totals.completed : 0,
      pedestrianCompleted: totals.pedestrianCompleted, pedestrianCrossings: totals.pedestrianCrossings, turns: totals.turns, reroutes: totals.reroutes,
      maxWait: vehicles.reduce((maximum, vehicle) => Math.max(maximum, vehicle.waitSeconds), 0) };
    return frozen({ tick: this.state.tick, seed: this.state.seed, vehicles, pedestrians, signals, metrics,
      demand: this.state.demand100 / 100, policy: this.state.policy, incident: this.state.incident,
      events: this.state.events.map(event => ({ ...event })) });
  }

  serialize(): string {
    if (this.failure) throw new TrafficStateError('INVARIANT_VIOLATION', this.failure);
    const envelope = { schemaVersion: 1, deterministicVersion: TRAFFIC_VERSION, configHash: CONFIG_HASH, payload: this.state };
    return canonical({ ...envelope, checksum: hash(canonical(envelope)) });
  }
  static restore(serialized: unknown): TrafficSimulation {
    const simulation = new TrafficSimulation(); simulation.restore(serialized); return simulation;
  }
  restore(serialized: unknown): void {
    let envelope: unknown;
    try {
      if (typeof serialized === 'string' && serialized.length > 2_000_000) throw new Error('Snapshot exceeds size budget');
      envelope = JSON.parse(typeof serialized === 'string' ? serialized : JSON.stringify(serialized));
    } catch { throw new TrafficStateError('INVALID_STATE', 'Invalid traffic snapshot JSON'); }
    if (!record(envelope)) throw new TrafficStateError('INVALID_STATE', 'Invalid traffic snapshot envelope');
    if (envelope.schemaVersion !== 1 || envelope.deterministicVersion !== TRAFFIC_VERSION || envelope.configHash !== CONFIG_HASH)
      throw new TrafficStateError('VERSION_MISMATCH', 'Traffic snapshot version or configuration is incompatible');
    const { checksum, ...body } = envelope;
    if (checksum !== hash(canonical(body))) throw new TrafficStateError('CHECKSUM_MISMATCH', 'Traffic snapshot checksum does not match');
    const next = envelope.payload as State;
    const nextPaths = validateState(next);
    this.state = next; this.paths.clear();
    for (const [id, path] of nextPaths) this.paths.set(id, path);
    this.failure = null;
  }
  private assertRuntime(): void {
    const state = this.state;
    if (state.vehicles.length > TRAFFIC_LIMITS.vehicles || state.pending.length > TRAFFIC_LIMITS.pending
      || state.pedestrians.length > TRAFFIC_LIMITS.pedestrians || !Number.isSafeInteger(state.tick)
      || state.totals.generated !== state.vehicles.length + state.pending.length + state.totals.completed + state.totals.rejected)
      throw new TrafficStateError('INVARIANT_VIOLATION', 'Traffic population or trip conservation invariant failed');
    for (const driver of state.vehicles) {
      const part = this.path(driver).segments[driver.segment];
      if (!Number.isFinite(driver.position + driver.speed) || driver.position < 0 || driver.position > part.length + 0.00001
        || driver.speed < 0 || driver.speed > 18) throw new TrafficStateError('INVARIANT_VIOLATION', 'Driver motion is outside its declared bounds');
    }
    for (let index = 0; index < 16; index++) {
      const signal = state.signals[index];
      if (PHASES[signal.stage] === 'walk' && signal.reservation !== null)
        throw new TrafficStateError('INVARIANT_VIOLATION', 'Walk phase has a conflicting vehicle reservation');
    }
    const overlap = physicalOverlap(state, this.paths);
    if (overlap) throw new TrafficStateError('INVARIANT_VIOLATION', overlap);
  }
}

interface Body { x: number; z: number; yaw: number; length: number; width: number }
function bodiesOverlap(a: Body, b: Body): boolean {
  const dx = b.x - a.x, dz = b.z - a.z;
  if (Math.abs(dx) > 10 || Math.abs(dz) > 10) return false;
  const ax = Math.sin(a.yaw), az = Math.cos(a.yaw), bx = Math.sin(b.yaw), bz = Math.cos(b.yaw);
  for (const [x, z] of [[ax, az], [az, -ax], [bx, bz], [bz, -bx]]) {
    const radiusA = a.length / 2 * Math.abs(ax * x + az * z) + a.width / 2 * Math.abs(az * x - ax * z);
    const radiusB = b.length / 2 * Math.abs(bx * x + bz * z) + b.width / 2 * Math.abs(bz * x - bx * z);
    if (Math.abs(dx * x + dz * z) >= radiusA + radiusB - 0.015) return false;
  }
  return true;
}
function physicalOverlap(state: State, paths: ReadonlyMap<number, TripPath>): string | null {
  const vehicles = state.vehicles.map(driver => ({ id: driver.id,
    ...pointOnPath(paths.get(driver.id)!.segments[driver.segment], driver.position), ...VEHICLE_SPECS[driver.kind] }));
  const citizens = state.pedestrians.map(person => ({ id: person.id,
    ...citizenPose(person), length: 0.55, width: 0.55 }));
  for (let index = 0; index < vehicles.length; index++) {
    for (let other = index + 1; other < vehicles.length; other++) {
      if (bodiesOverlap(vehicles[index], vehicles[other])) return `Vehicle overlap between ${vehicles[index].id} and ${vehicles[other].id}`;
    }
    for (const person of citizens) {
      if (bodiesOverlap(vehicles[index], person)) return `Vehicle/citizen overlap between ${vehicles[index].id} and ${person.id}`;
    }
  }
  for (let index = 0; index < citizens.length; index++) for (let other = index + 1; other < citizens.length; other++) {
    if (bodiesOverlap(citizens[index], citizens[other])) return `Citizen overlap between ${citizens[index].id} and ${citizens[other].id}`;
  }
  return null;
}

function validateState(state: State): Map<number, TripPath> {
  const fail = (message: string): never => { throw new TrafficStateError('INVALID_STATE', `Invalid traffic state: ${message}`); };
  const number = (value: unknown, min: number, max: number, integer = false): void => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || integer && !Number.isSafeInteger(value)) fail('numeric range');
  };
  const array = (value: unknown, maximum: number): void => { if (!Array.isArray(value) || value.length > maximum) fail('collection budget'); };
  if (!record(state)) fail('payload');
  number(state.seed, 0, 0xffffffff, true); number(state.tick, 0, Number.MAX_SAFE_INTEGER, true);
  number(state.demand100, 25, 200, true); validPolicy(state.policy);
  number(state.initialDemand100, 25, 200, true); validPolicy(state.initialPolicy);
  if (typeof state.incident !== 'boolean') fail('incident');
  if (!record(state.rng) || Object.keys(state.rng).sort().join(',') !== [...STREAM_NAMES].sort().join(',')) fail('random streams');
  for (const stream of STREAM_NAMES) number(state.rng[stream], 1, 0xffffffff, true);
  number(state.nextVehicleId, 1, Number.MAX_SAFE_INTEGER, true);
  array(state.vehicles, TRAFFIC_LIMITS.vehicles); array(state.pending, TRAFFIC_LIMITS.pending);
  array(state.pedestrians, TRAFFIC_LIMITS.pedestrians); array(state.signals, 16);
  array(state.cornerOwners, 64);
  if (state.cornerOwners.length !== 64) fail('pedestrian corner reservation count');
  if (state.signals.length !== 16 || state.pedestrians.length !== TRAFFIC_LIMITS.pedestrians) fail('city population');
  const ids = new Set<number>(), paths = new Map<number, TripPath>();
  const checkTrip = (trip: WaitingTrip | Driver): TripPath => {
    if (!record(trip) || !KINDS.includes(trip.kind)) fail('vehicle kind');
    number(trip.id, 1, state.nextVehicleId - 1, true);
    if (ids.has(trip.id)) fail('duplicate trip id'); ids.add(trip.id);
    number(trip.desiredSpeed, 6, 18); number(trip.color, 0, 0xffffff, true);
    array(trip.route, MAX_ROUTE_NODES);
    try { return buildTrip(trip.route); } catch { return fail('route topology'); }
  };
  for (const driver of state.vehicles) {
    const path = checkTrip(driver); paths.set(driver.id, path);
    number(driver.segment, 0, path.segments.length - 1, true);
    number(driver.position, 0, path.segments[driver.segment].length + 0.00001);
    number(driver.speed, 0, 18); number(driver.waitTicks, 0, state.tick, true);
    number(driver.bornTick, 0, state.tick, true); number(driver.lastProgressTick, driver.bornTick, state.tick, true);
    number(driver.reroutes, 0, TRAFFIC_LIMITS.reroutesPerTrip, true); number(driver.lastReplanTick, driver.bornTick, state.tick, true);
    if (typeof driver.braking !== 'boolean') fail('braking state');
  }
  for (const trip of state.pending) { checkTrip(trip); number(trip.requestedTick, 0, state.tick, true); }
  const citizenIds = new Set<number>();
  for (const person of state.pedestrians) {
    if (!record(person)) fail('citizen');
    number(person.id, 1, TRAFFIC_LIMITS.pedestrians, true);
    if (citizenIds.has(person.id)) fail('duplicate citizen'); citizenIds.add(person.id);
    array(person.route, 66); number(person.edge, 0, person.route.length - 2, true);
    for (let index = 1; index < person.route.length; index++) {
      number(person.route[index - 1], 0, 63, true); number(person.route[index], 0, 63, true);
      try { walkEdge(person.route[index - 1], person.route[index]); } catch { fail('sidewalk route topology'); }
    }
    array(person.nextRoute, 64);
    if (person.nextRoute.length < 2 || person.nextRoute[0] !== person.route[person.route.length - 1]) fail('citizen continuation route');
    for (let index = 1; index < person.nextRoute.length; index++) {
      number(person.nextRoute[index - 1], 0, 63, true); number(person.nextRoute[index], 0, 63, true);
      try { walkEdge(person.nextRoute[index - 1], person.nextRoute[index]); } catch { fail('citizen continuation topology'); }
    }
    number(person.position, 0, walkEdge(person.route[person.edge], person.route[person.edge + 1]).length + 0.00001);
    number(person.speed, 0, 2); number(person.desiredSpeed, 1.25, 1.65);
    number(person.color, 0, 0xffffff, true); number(person.walkPhase, 0, Math.PI * 2);
    if (typeof person.waiting !== 'boolean') fail('citizen waiting state');
    if (person.cornerFrom === null) {
      if (person.cornerProgress !== 0) fail('citizen corner progress outside a connector');
    } else {
      number(person.cornerFrom, 0, 63, true);
      try { walkEdge(person.cornerFrom, person.route[person.edge]); } catch { fail('citizen corner connector'); }
      number(person.cornerProgress, 0, cornerGeometry(person).length + 0.000001);
      if (person.position !== 0) fail('citizen occupies an edge and corner simultaneously');
    }
  }
  const cornerHolders = new Set<number>();
  for (let corner = 0; corner < state.cornerOwners.length; corner++) {
    const owner = state.cornerOwners[corner];
    if (owner === null) continue;
    number(owner, 1, TRAFFIC_LIMITS.pedestrians, true);
    const person = state.pedestrians.find(candidate => candidate.id === owner);
    if (!person || cornerHolders.has(owner)) fail('pedestrian corner reservation owner');
    cornerHolders.add(owner);
    const citizen = person!;
    const edge = walkEdge(citizen.route[citizen.edge], citizen.route[citizen.edge + 1]);
    const valid = citizen.cornerFrom !== null ? edge.from === corner
      : edge.from === corner && citizen.position < CORNER_GATE + 0.000001
        || edge.to === corner && citizen.position >= (edge.crossing ? CORNER_GATE : edge.length - CORNER_GATE - 0.06) - 0.000001;
    if (!valid) fail('pedestrian reservation is unrelated to its route position');
  }
  const reserved = new Set<number>();
  for (let index = 0; index < 16; index++) {
    const signal = state.signals[index];
    if (!record(signal)) fail('signal');
    number(signal.stage, 0, 5, true); number(signal.started, 0, state.tick, true);
    number(signal.deadline, signal.started, state.tick + MAX_GREEN_TICKS, true);
    number(signal.queueNS, 0, TRAFFIC_LIMITS.vehicles, true); number(signal.queueEW, 0, TRAFFIC_LIMITS.vehicles, true);
    number(signal.lastAdmissionTick, 0, state.tick, true);
    if (signal.reservation !== null) {
      number(signal.reservation, 1, state.nextVehicleId - 1, true);
      const driver = state.vehicles.find(candidate => candidate.id === signal.reservation);
      if (!driver) throw new TrafficStateError('INVALID_STATE', 'Invalid traffic state: missing reservation owner');
      if (reserved.has(driver.id) || PHASES[signal.stage] === 'walk') fail('reservation owner');
      reserved.add(driver.id);
      const part = paths.get(driver.id)!.segments[driver.segment];
      if (part.kind === 'junction' ? part.junction !== index
        : roadLane(part.laneId).to !== index && roadLane(part.laneId).from !== index) fail('reservation route');
      const entering = part.kind === 'lane' && roadLane(part.laneId).from === index
        ? paths.get(driver.id)!.segments[driver.segment - 1] : part;
      const allowedAxis = signal.stage <= 1 ? 'ns' : signal.stage <= 3 ? 'ew' : null;
      if (!entering || entering.approach !== allowedAxis) fail('reservation conflicts with signal phase');
    }
  }
  for (const driver of state.vehicles) {
    const part = paths.get(driver.id)!.segments[driver.segment];
    if (part.kind === 'junction' && state.signals[part.junction!].reservation !== driver.id) fail('unreserved crossing');
    if (part.kind === 'lane' && part.junction !== null && state.signals[part.junction].reservation !== driver.id
      && driver.position + VEHICLE_SPECS[driver.kind].length / 2 + MIN_GAP > part.length + 0.00001) fail('stop-line penetration');
  }
  for (const person of state.pedestrians) {
    const edge = walkEdge(person.route[person.edge], person.route[person.edge + 1]);
    if (person.cornerFrom !== null && state.cornerOwners[edge.from] !== person.id) fail('unreserved pedestrian corner');
    if (citizenInRoad(person)) {
      const signal = state.signals[edge.junction!];
      if (signal.reservation !== null || !['walk', 'clearance'].includes(PHASES[signal.stage])) fail('unsafe pedestrian crossing');
      if (state.cornerOwners[edge.to] !== person.id) fail('crossing citizen has no reserved landing');
    }
  }
  if (!record(state.totals)) fail('totals');
  for (const key of ['completed', 'generated', 'rejected', 'completedWaitTicks', 'totalTravelTicks', 'pedestrianCompleted', 'pedestrianCrossings', 'turns', 'reroutes'] as const)
    number(state.totals[key], 0, Number.MAX_SAFE_INTEGER, true);
  if (state.totals.generated !== state.vehicles.length + state.pending.length + state.totals.completed + state.totals.rejected) fail('trip conservation');
  array(state.completions, TRAFFIC_LIMITS.completionHistory);
  if (state.completions.length > state.totals.completed) fail('completion window exceeds lifetime completed trips');
  let previousTick = 0;
  let windowWaitTicks = 0, windowTravelTicks = 0;
  const completedIds = new Set<number>();
  for (const completion of state.completions) {
    if (!record(completion)) fail('completion');
    number(completion.id, 1, state.nextVehicleId - 1, true);
    if (ids.has(completion.id) || completedIds.has(completion.id)) fail('completion duplicates a live or completed trip');
    completedIds.add(completion.id);
    number(completion.tick, Math.max(previousTick, state.tick - FLOW_WINDOW + 1), state.tick, true); previousTick = completion.tick;
    number(completion.bornTick, 0, completion.tick - 1, true);
    number(completion.travelTicks, 1, state.tick, true); number(completion.waitTicks, 0, completion.travelTicks, true);
    if (completion.travelTicks !== completion.tick - completion.bornTick) fail('completion duration disagrees with trip lifetime');
    windowWaitTicks += completion.waitTicks; windowTravelTicks += completion.travelTicks;
  }
  if (windowWaitTicks > state.totals.completedWaitTicks || windowTravelTicks > state.totals.totalTravelTicks)
    fail('completion window contradicts cumulative travel or waiting time');
  if (state.tick < FLOW_WINDOW && (state.completions.length !== state.totals.completed
    || windowWaitTicks !== state.totals.completedWaitTicks || windowTravelTicks !== state.totals.totalTravelTicks))
    fail('completion history must fully account for the initial window');
  array(state.events, TRAFFIC_LIMITS.events); previousTick = 0;
  for (const event of state.events) {
    if (!record(event)) fail('event');
    number(event.tick, previousTick, state.tick, true); previousTick = event.tick;
    if (typeof event.message !== 'string' || event.message.length < 1 || event.message.length > 160) fail('event message');
  }
  array(state.commands, TRAFFIC_LIMITS.commands); number(state.nextCommandSequence, 1, Number.MAX_SAFE_INTEGER, true);
  if (typeof state.retiredCommandDigest !== 'string' || !/^[0-9a-f]{8}$/.test(state.retiredCommandDigest)) fail('retired command digest');
  previousTick = 0;
  let sequence = state.commands.length ? state.commands[0].sequence : state.nextCommandSequence;
  for (const entry of state.commands) {
    if (!record(entry)) fail('command');
    number(entry.tick, previousTick, state.tick, true); previousTick = entry.tick;
    number(entry.sequence, 1, Number.MAX_SAFE_INTEGER, true);
    if (entry.sequence !== sequence++) fail('command sequence');
    if (canonical(entry.command) !== canonical(normalizeCommand(entry.command, state.seed))) fail('command normalization');
  }
  if (sequence !== state.nextCommandSequence) fail('command continuation');
  number(state.lastCongestionEventTick, 0, state.tick, true);
  const overlap = physicalOverlap(state, paths);
  if (overlap) fail(overlap);
  return paths;
}

export function createTrafficSimulation(options: TrafficOptions = {}): TrafficSimulation { return new TrafficSimulation(options); }
