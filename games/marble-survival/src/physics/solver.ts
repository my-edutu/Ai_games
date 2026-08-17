import type {
  ArenaBlock,
  ArenaBumper,
  ArenaSweeper,
  MarbleAction,
  MarbleCompetitor,
  MarbleState,
  PhysicsContact,
  PhysicsStepResult,
  Vec2
} from '../state/types';
import { FIXED_SCALE, clampInteger, clampMagnitude, divideRound, dotPermille, integerSqrt, normalizePermille, triangleWave } from './fixed';

const POSITION_LIMIT = 10_000_000;
const VELOCITY_PREFILTER_MULTIPLIER = 8;

interface Rectangle { id: string; x: number; y: number; width: number; height: number; kind: 'obstacle' | 'sweeper'; restitutionPermille: number }

function cloneState(state: MarbleState): MarbleState {
  return {
    ...state,
    marbles: state.marbles.map(marble => ({
      ...marble,
      position: { ...marble.position },
      velocity: { ...marble.velocity },
      traits: { ...marble.traits }
    })),
    activeIds: [...state.activeIds],
    qualifiedIds: [...state.qualifiedIds],
    eliminatedIds: [...state.eliminatedIds],
    roundResults: state.roundResults.map(result => ({ ...result, qualifierIds: [...result.qualifierIds], eliminatedIds: [...result.eliminatedIds] })),
    records: { ...state.records },
    influence: { ...state.influence },
    arena: state.arena
  };
}

function insideRectangle(position: Vec2, rectangle: { x: number; y: number; width: number; height: number }): boolean {
  return position.x >= rectangle.x && position.x <= rectangle.x + rectangle.width && position.y >= rectangle.y && position.y <= rectangle.y + rectangle.height;
}

function sweeperRectangle(sweeper: ArenaSweeper, tick: number): Rectangle {
  const offset = triangleWave(tick, sweeper.periodTicks, sweeper.amplitude, sweeper.phaseTicks);
  return {
    id: sweeper.id,
    x: sweeper.baseX + (sweeper.axis === 'x' ? offset : 0),
    y: sweeper.baseY + (sweeper.axis === 'y' ? offset : 0),
    width: sweeper.width,
    height: sweeper.height,
    kind: 'sweeper',
    restitutionPermille: sweeper.restitutionPermille
  };
}

function blockRectangle(block: ArenaBlock): Rectangle {
  return { id: block.id, x: block.x, y: block.y, width: block.width, height: block.height, kind: 'obstacle', restitutionPermille: 860 };
}

function reflect(velocity: Vec2, normal: Vec2, restitutionPermille: number): { velocity: Vec2; impulse: number } {
  const along = dotPermille(velocity, normal);
  if (along >= 0) return { velocity, impulse: 0 };
  const factor = FIXED_SCALE + restitutionPermille;
  return {
    velocity: {
      x: velocity.x - divideRound(factor * along * normal.x, FIXED_SCALE * FIXED_SCALE),
      y: velocity.y - divideRound(factor * along * normal.y, FIXED_SCALE * FIXED_SCALE)
    },
    impulse: Math.abs(along)
  };
}

function resolveWorld(marble: MarbleCompetitor, state: MarbleState): PhysicsContact[] {
  const contacts: PhysicsContact[] = [];
  const radius = state.config.marbleRadius;
  const bounds = [
    { axis: 'x' as const, minimum: radius, maximum: state.arena.width - radius, lowNormal: { x: FIXED_SCALE, y: 0 }, highNormal: { x: -FIXED_SCALE, y: 0 }, lowKey: 'left', highKey: 'right' },
    { axis: 'y' as const, minimum: radius, maximum: state.arena.height - radius, lowNormal: { x: 0, y: FIXED_SCALE }, highNormal: { x: 0, y: -FIXED_SCALE }, lowKey: 'top', highKey: 'bottom' }
  ];
  for (const bound of bounds) {
    const value = marble.position[bound.axis];
    if (value < bound.minimum) {
      marble.position[bound.axis] = bound.minimum;
      const reflected = reflect(marble.velocity, bound.lowNormal, state.config.worldRestitutionPermille);
      marble.velocity = reflected.velocity;
      contacts.push({ key: `world:${bound.lowKey}:${marble.id}`, kind: 'world', marbleId: marble.id, colliderId: bound.lowKey, impulse: reflected.impulse });
    } else if (value > bound.maximum) {
      marble.position[bound.axis] = bound.maximum;
      const reflected = reflect(marble.velocity, bound.highNormal, state.config.worldRestitutionPermille);
      marble.velocity = reflected.velocity;
      contacts.push({ key: `world:${bound.highKey}:${marble.id}`, kind: 'world', marbleId: marble.id, colliderId: bound.highKey, impulse: reflected.impulse });
    }
  }
  return contacts;
}

function resolveRectangle(marble: MarbleCompetitor, rectangle: Rectangle, radius: number): PhysicsContact | null {
  const closestX = Math.max(rectangle.x, Math.min(marble.position.x, rectangle.x + rectangle.width));
  const closestY = Math.max(rectangle.y, Math.min(marble.position.y, rectangle.y + rectangle.height));
  let dx = marble.position.x - closestX;
  let dy = marble.position.y - closestY;
  let distanceSquared = dx * dx + dy * dy;
  if (distanceSquared >= radius * radius) return null;
  let normal: Vec2;
  let penetration: number;
  if (distanceSquared === 0) {
    const left = Math.abs(marble.position.x - rectangle.x);
    const right = Math.abs(rectangle.x + rectangle.width - marble.position.x);
    const top = Math.abs(marble.position.y - rectangle.y);
    const bottom = Math.abs(rectangle.y + rectangle.height - marble.position.y);
    const minimum = Math.min(left, right, top, bottom);
    if (minimum === left) normal = { x: -FIXED_SCALE, y: 0 };
    else if (minimum === right) normal = { x: FIXED_SCALE, y: 0 };
    else if (minimum === top) normal = { x: 0, y: -FIXED_SCALE };
    else normal = { x: 0, y: FIXED_SCALE };
    penetration = radius + minimum;
  } else {
    const distance = integerSqrt(distanceSquared);
    normal = normalizePermille({ x: dx, y: dy });
    penetration = radius - distance;
  }
  marble.position.x += divideRound(normal.x * penetration, FIXED_SCALE);
  marble.position.y += divideRound(normal.y * penetration, FIXED_SCALE);
  const reflected = reflect(marble.velocity, normal, rectangle.restitutionPermille);
  marble.velocity = reflected.velocity;
  return {
    key: `${rectangle.kind}:${rectangle.id}:${marble.id}`,
    kind: rectangle.kind,
    marbleId: marble.id,
    colliderId: rectangle.id,
    impulse: reflected.impulse
  };
}

function resolveBumper(marble: MarbleCompetitor, bumper: ArenaBumper, marbleRadius: number): PhysicsContact | null {
  const dx = marble.position.x - bumper.x;
  const dy = marble.position.y - bumper.y;
  const minimum = marbleRadius + bumper.radius;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared >= minimum * minimum) return null;
  const normal = distanceSquared === 0 ? { x: marble.id % 2 === 0 ? FIXED_SCALE : -FIXED_SCALE, y: 0 } : normalizePermille({ x: dx, y: dy });
  const distance = distanceSquared === 0 ? 0 : integerSqrt(distanceSquared);
  const penetration = minimum - distance;
  marble.position.x += divideRound(normal.x * penetration, FIXED_SCALE);
  marble.position.y += divideRound(normal.y * penetration, FIXED_SCALE);
  const reflected = reflect(marble.velocity, normal, bumper.restitutionPermille);
  marble.velocity = reflected.velocity;
  return { key: `bumper:${bumper.id}:${marble.id}`, kind: 'bumper', marbleId: marble.id, colliderId: bumper.id, impulse: reflected.impulse };
}

function resolveMarblePair(first: MarbleCompetitor, second: MarbleCompetitor, state: MarbleState): PhysicsContact | null {
  const radius = state.config.marbleRadius;
  const minimum = radius * 2;
  const dx = second.position.x - first.position.x;
  const dy = second.position.y - first.position.y;
  const distanceSquared = dx * dx + dy * dy;
  if (distanceSquared >= minimum * minimum) return null;
  const normal = distanceSquared === 0 ? { x: ((first.id + second.id) & 1) === 0 ? FIXED_SCALE : -FIXED_SCALE, y: 0 } : normalizePermille({ x: dx, y: dy });
  const distance = distanceSquared === 0 ? 0 : integerSqrt(distanceSquared);
  const penetration = minimum - distance;
  const totalMass = first.traits.massPermille + second.traits.massPermille;
  const firstMove = divideRound(penetration * second.traits.massPermille, totalMass);
  const secondMove = penetration - firstMove;
  first.position.x -= divideRound(normal.x * firstMove, FIXED_SCALE);
  first.position.y -= divideRound(normal.y * firstMove, FIXED_SCALE);
  second.position.x += divideRound(normal.x * secondMove, FIXED_SCALE);
  second.position.y += divideRound(normal.y * secondMove, FIXED_SCALE);

  const relative = dotPermille({ x: second.velocity.x - first.velocity.x, y: second.velocity.y - first.velocity.y }, normal);
  let impulse = 0;
  if (relative < 0) {
    const restitution = state.config.marbleRestitutionPermille;
    const numerator = -(FIXED_SCALE + restitution) * relative;
    const firstShare = divideRound(numerator * second.traits.massPermille, FIXED_SCALE * totalMass);
    const secondShare = divideRound(numerator * first.traits.massPermille, FIXED_SCALE * totalMass);
    first.velocity.x -= divideRound(normal.x * firstShare, FIXED_SCALE);
    first.velocity.y -= divideRound(normal.y * firstShare, FIXED_SCALE);
    second.velocity.x += divideRound(normal.x * secondShare, FIXED_SCALE);
    second.velocity.y += divideRound(normal.y * secondShare, FIXED_SCALE);
    impulse = Math.abs(relative);
  }
  return { key: `marble:${first.id}:${second.id}`, kind: 'marble', marbleId: first.id, otherMarbleId: second.id, impulse };
}

function addContact(store: Map<string, PhysicsContact>, contact: PhysicsContact | null, cap: number): void {
  if (!contact || store.has(contact.key) || store.size >= cap) return;
  store.set(contact.key, contact);
}

function validateState(state: MarbleState) {
  const identifiers = new Set<number>();
  for (const marble of state.marbles) {
    if (identifiers.has(marble.id)) return { code: 'duplicate-marble-id' as const, detail: `Duplicate marble ID ${marble.id}.` };
    identifiers.add(marble.id);
    for (const value of [marble.position.x, marble.position.y]) {
      if (!Number.isSafeInteger(value) || Math.abs(value) > POSITION_LIMIT) return { code: 'numeric-range' as const, detail: `Marble ${marble.id} position exceeds deterministic range.` };
    }
    for (const value of [marble.velocity.x, marble.velocity.y]) {
      if (!Number.isFinite(value)) return { code: 'numeric-range' as const, detail: `Marble ${marble.id} velocity is not finite.` };
    }
  }
  return undefined;
}

function applyForces(marble: MarbleCompetitor, state: MarbleState, action: MarbleAction | undefined): void {
  if (action) {
    const steerX = clampInteger(action.steerX, -FIXED_SCALE, FIXED_SCALE);
    const steerY = clampInteger(action.steerY, -FIXED_SCALE, FIXED_SCALE);
    const boost = clampInteger(action.boostPermille, 800, 1_200);
    marble.velocity.x += divideRound(steerX * marble.traits.acceleration * boost, FIXED_SCALE * FIXED_SCALE);
    marble.velocity.y += divideRound(steerY * marble.traits.acceleration * boost, FIXED_SCALE * FIXED_SCALE);
    marble.intent = action.intent;
    marble.confidence = action.confidence;
  }
  for (const zone of state.arena.windZones) {
    if (insideRectangle(marble.position, zone)) {
      marble.velocity.x += zone.forceX;
      marble.velocity.y += zone.forceY;
    }
  }
  if (state.influence.effectUntilTick >= state.tick) {
    marble.velocity.x += state.influence.globalWindX;
    marble.velocity.y += state.influence.globalWindY;
  }
  marble.velocity.x = divideRound(marble.velocity.x * state.config.frictionPermille, FIXED_SCALE);
  marble.velocity.y = divideRound(marble.velocity.y * state.config.frictionPermille, FIXED_SCALE);
  const prefilter = state.config.maxSpeed * VELOCITY_PREFILTER_MULTIPLIER;
  marble.velocity.x = clampInteger(marble.velocity.x, -prefilter, prefilter);
  marble.velocity.y = clampInteger(marble.velocity.y, -prefilter, prefilter);
  const limit = Math.min(state.config.maxSpeed, marble.traits.topSpeed);
  marble.velocity = clampMagnitude(marble.velocity, limit);
}

export function stepMarblePhysics(state: MarbleState, actions: MarbleAction[]): PhysicsStepResult {
  const initialIssue = validateState(state);
  if (initialIssue) return { state, contacts: [], integrityIssue: initialIssue };
  const next = cloneState(state);
  const actionById = new Map(actions.map(action => [action.marbleId, action]));
  const active = next.marbles.filter(marble => marble.status === 'active' && marble.roundStatus === 'racing').sort((a, b) => a.id - b.id);
  for (const marble of active) applyForces(marble, next, actionById.get(marble.id));
  const maximumVelocity = active.reduce((maximum, marble) => Math.max(maximum, Math.abs(marble.velocity.x), Math.abs(marble.velocity.y)), 0);
  const substeps = Math.max(1, Math.min(next.config.maxSubsteps, Math.ceil(maximumVelocity / Math.max(1, next.config.marbleRadius))));
  const contacts = new Map<string, PhysicsContact>();
  const rectangles = next.arena.obstacles.map(blockRectangle);
  const sweepers = next.arena.sweepers.map(sweeper => sweeperRectangle(sweeper, next.tick));

  for (let substep = 0; substep < substeps; substep++) {
    for (const marble of active) {
      marble.position.x += divideRound(marble.velocity.x, substeps);
      marble.position.y += divideRound(marble.velocity.y, substeps);
      for (const contact of resolveWorld(marble, next)) addContact(contacts, contact, next.config.maxContactsPerTick);
      for (const rectangle of rectangles) addContact(contacts, resolveRectangle(marble, rectangle, next.config.marbleRadius), next.config.maxContactsPerTick);
      for (const sweeper of sweepers) addContact(contacts, resolveRectangle(marble, sweeper, next.config.marbleRadius), next.config.maxContactsPerTick);
      for (const bumper of next.arena.bumpers) addContact(contacts, resolveBumper(marble, bumper, next.config.marbleRadius), next.config.maxContactsPerTick);
    }
    for (let iteration = 0; iteration < next.config.collisionIterations; iteration++) {
      for (let firstIndex = 0; firstIndex < active.length; firstIndex++) {
        for (let secondIndex = firstIndex + 1; secondIndex < active.length; secondIndex++) {
          addContact(contacts, resolveMarblePair(active[firstIndex], active[secondIndex], next), next.config.maxContactsPerTick);
        }
      }
    }
  }

  const contacted = new Set<number>();
  for (const contact of contacts.values()) {
    contacted.add(contact.marbleId);
    if (contact.otherMarbleId !== undefined) contacted.add(contact.otherMarbleId);
  }
  for (const id of contacted) {
    const marble = next.marbles.find(candidate => candidate.id === id);
    if (marble) marble.impactCount++;
  }
  const finalIssue = validateState(next);
  if (finalIssue) return { state: next, contacts: [...contacts.values()], integrityIssue: finalIssue };
  return { state: next, contacts: [...contacts.values()] };
}
