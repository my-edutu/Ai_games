import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import type {
  ArenaBlock,
  ArenaBumper,
  ArenaFeatures,
  ArenaHazard,
  ArenaSweeper,
  ArenaValidationIssue,
  ArenaValidationReport,
  ArenaWindZone,
  MarbleArena,
  MarbleConfig,
  RoundArchetype,
  Vec2
} from '../state/types';

const ARCHETYPES: RoundArchetype[] = ['seeding-sprint','gate-gauntlet','hazard-circuit','final-four','championship'];

function spawnPoints(config: MarbleConfig, width: number, spawnY: number): Vec2[] {
  const margin = config.marbleRadius + 80;
  const available = width - margin * 2;
  return Array.from({ length: config.rosterSize }, (_, index) => ({
    x: margin + Math.round((available * (index + 1)) / (config.rosterSize + 1)),
    y: spawnY - (index % 2) * (config.marbleRadius * 2 + 30)
  }));
}

function featureSummary(archetype: RoundArchetype, obstacles: ArenaBlock[], bumpers: ArenaBumper[], hazards: ArenaHazard[], windZones: ArenaWindZone[], sweepers: ArenaSweeper[]): ArenaFeatures {
  const colliderCount = obstacles.length + bumpers.length + sweepers.length;
  const hazardArea = hazards.reduce((sum, hazard) => sum + hazard.width * hazard.height, 0);
  const windIntensity = windZones.reduce((max, zone) => Math.max(max, Math.abs(zone.forceX) + Math.abs(zone.forceY)), 0);
  const base = ARCHETYPES.indexOf(archetype) + 1;
  return {
    archetype,
    colliderCount,
    expectedContactLoad: colliderCount * 3 + sweepers.length * 12 + bumpers.length * 4,
    bottlenecks: obstacles.length + sweepers.length,
    hazardDensityPermille: Math.min(1_000, Math.round(hazardArea / 384_000)),
    windIntensity,
    routeAsymmetryPermille: archetype === 'championship' ? 0 : Math.min(350, obstacles.length * 20 + hazards.length * 15),
    difficultyScore: base * 20 + sweepers.length * 8 + hazards.length * 7 + windZones.length * 4
  };
}

function addRoundContent(config: MarbleConfig, roundIndex: number, rng: NamedRng, safeLanes: number[]) {
  const obstacles: ArenaBlock[] = [];
  const bumpers: ArenaBumper[] = [];
  const hazards: ArenaHazard[] = [];
  const windZones: ArenaWindZone[] = [];
  const sweepers: ArenaSweeper[] = [];
  const width = config.worldWidth;
  const laneMargin = config.marbleRadius * 2 + 220;
  const sideBlockWidth = Math.max(900, Math.round(width * 0.13));
  const levels = [12_000, 9_500, 7_000, 4_500];

  if (roundIndex >= 0) {
    for (let index = 0; index < 4 + roundIndex; index++) {
      const lane = safeLanes[index % safeLanes.length];
      const side = index % 2 === 0 ? -1 : 1;
      const x = Math.max(config.marbleRadius, Math.min(width - sideBlockWidth - config.marbleRadius, lane + side * (laneMargin + 900) - (side < 0 ? sideBlockWidth : 0)));
      const y = levels[index % levels.length] + rng.nextInt(`arena-topology-r${roundIndex}-b${index}`, 500) - 250;
      obstacles.push({ id: `block-${roundIndex}-${index}`, kind: 'block', x, y, width: sideBlockWidth, height: 520 + (index % 2) * 180 });
    }
    for (let index = 0; index < 3 + roundIndex; index++) {
      const lane = safeLanes[index % safeLanes.length];
      const offset = index % 2 === 0 ? -1_150 : 1_150;
      bumpers.push({
        id: `bumper-${roundIndex}-${index}`,
        kind: 'bumper',
        x: lane + offset,
        y: 11_000 - index * 1_700,
        radius: 360 + (index % 2) * 80,
        restitutionPermille: 900
      });
    }
  }

  if (roundIndex >= 1) {
    sweepers.push({ id: `sweeper-${roundIndex}-0`, kind: 'sweeper', baseX: width / 2 - 1_800, baseY: 8_000, width: 3_600, height: 180, axis: 'x', amplitude: 2_200, periodTicks: 240, phaseTicks: rng.nextInt(`arena-hazards-r${roundIndex}-s0`, 240), restitutionPermille: 900 });
  }
  if (roundIndex >= 2) {
    hazards.push({ id: `pit-${roundIndex}-left`, kind: 'pit', x: config.marbleRadius, y: 5_500, width: 2_100, height: 1_000 });
    hazards.push({ id: `pit-${roundIndex}-right`, kind: 'pit', x: width - 2_100 - config.marbleRadius, y: 5_500, width: 2_100, height: 1_000 });
    windZones.push({ id: `wind-${roundIndex}`, kind: 'wind', x: width / 2 - 4_000, y: 9_000, width: 8_000, height: 2_000, forceX: rng.nextInt(`arena-hazards-r${roundIndex}-wind`, 2) === 0 ? -10 : 10, forceY: -2 });
  }
  if (roundIndex >= 3) {
    sweepers.push({ id: `sweeper-${roundIndex}-1`, kind: 'sweeper', baseX: width / 2 - 1_600, baseY: 4_800, width: 3_200, height: 180, axis: 'x', amplitude: 1_900, periodTicks: 180, phaseTicks: rng.nextInt(`arena-hazards-r${roundIndex}-s1`, 180), restitutionPermille: 930 });
  }
  if (roundIndex === 4) {
    obstacles.length = 0;
    bumpers.length = 0;
    hazards.length = 0;
    windZones.length = 0;
    sweepers.length = 0;
    const mirrorOffset = 3_800;
    for (let index = 0; index < 3; index++) {
      const y = 11_000 - index * 3_000;
      obstacles.push({ id: `final-left-${index}`, kind: 'block', x: width / 2 - mirrorOffset - 1_200, y, width: 1_200, height: 520 });
      obstacles.push({ id: `final-right-${index}`, kind: 'block', x: width / 2 + mirrorOffset, y, width: 1_200, height: 520 });
    }
    bumpers.push({ id: 'final-bumper-left', kind: 'bumper', x: width / 2 - 1_600, y: 7_600, radius: 480, restitutionPermille: 920 });
    bumpers.push({ id: 'final-bumper-right', kind: 'bumper', x: width / 2 + 1_600, y: 7_600, radius: 480, restitutionPermille: 920 });
  }
  return { obstacles, bumpers, hazards, windZones, sweepers };
}

function knownGoodFallback(config: MarbleConfig, roundIndex: number): MarbleArena {
  const width = config.worldWidth;
  const height = config.worldHeight;
  const spawnY = height - config.marbleRadius - 500;
  const finishY = config.marbleRadius + 700;
  const archetype = ARCHETYPES[roundIndex] ?? 'seeding-sprint';
  const safeLanes = [Math.round(width / 3), Math.round((width * 2) / 3)];
  const obstacles: ArenaBlock[] = [];
  const bumpers: ArenaBumper[] = [];
  const hazards: ArenaHazard[] = [];
  const windZones: ArenaWindZone[] = [];
  const sweepers: ArenaSweeper[] = [];
  return {
    schemaVersion: 1,
    generatorVersion: 'marble-arena-v1',
    id: `arena-fallback-r${roundIndex}`,
    roundIndex,
    archetype,
    width,
    height,
    spawnY,
    finishY,
    spawnPoints: spawnPoints(config, width, spawnY),
    checkpoints: [12_500, 9_500, 6_500, 3_500].map((y, index) => ({ x: safeLanes[index % 2], y })),
    safeLanes,
    obstacles,
    bumpers,
    hazards,
    windZones,
    sweepers,
    features: featureSummary(archetype, obstacles, bumpers, hazards, windZones, sweepers),
    repairCount: 2,
    fallbackUsed: true
  };
}

export function validateMarbleArena(arena: MarbleArena, config: MarbleConfig): ArenaValidationReport {
  const issues: ArenaValidationIssue[] = [];
  if (arena.width !== config.worldWidth || arena.height !== config.worldHeight) issues.push({ code: 'world-bounds', detail: 'Arena dimensions do not match configuration.' });
  if (arena.spawnPoints.length !== config.rosterSize) issues.push({ code: 'spawn-count', detail: 'Spawn count must equal roster size.' });
  if (!(arena.finishY > config.marbleRadius && arena.finishY < arena.spawnY)) issues.push({ code: 'finish-order', detail: 'Finish line must be above spawn and inside the world.' });
  for (let index = 0; index < arena.spawnPoints.length; index++) {
    const spawn = arena.spawnPoints[index];
    if (spawn.x < config.marbleRadius || spawn.x > arena.width - config.marbleRadius || spawn.y < config.marbleRadius || spawn.y > arena.height - config.marbleRadius) {
      issues.push({ code: 'spawn-out-of-bounds', entityId: `spawn-${index}`, detail: 'Spawn point exceeds marble-safe world bounds.' });
    }
    for (let other = index + 1; other < arena.spawnPoints.length; other++) {
      const dx = spawn.x - arena.spawnPoints[other].x;
      const dy = spawn.y - arena.spawnPoints[other].y;
      const minimum = config.marbleRadius * 2;
      if (dx * dx + dy * dy < minimum * minimum) issues.push({ code: 'spawn-overlap', entityId: `spawn-${index}:${other}`, detail: 'Spawn circles overlap.' });
    }
  }
  const colliderCount = arena.obstacles.length + arena.bumpers.length + arena.sweepers.length;
  if (colliderCount > config.maxColliders) issues.push({ code: 'collider-budget', detail: `Collider count ${colliderCount} exceeds ${config.maxColliders}.` });
  if (arena.features.expectedContactLoad > config.maxContactsPerTick) issues.push({ code: 'contact-budget', detail: 'Expected contact load exceeds per-tick budget.' });
  const rectangles = [...arena.obstacles.map(value => ({ id: value.id, x: value.x, y: value.y, width: value.width, height: value.height })), ...arena.hazards];
  for (const rectangle of rectangles) {
    if (rectangle.x < 0 || rectangle.y < 0 || rectangle.x + rectangle.width > arena.width || rectangle.y + rectangle.height > arena.height) {
      issues.push({ code: 'geometry-out-of-bounds', entityId: rectangle.id, detail: 'Rectangle exceeds world bounds.' });
    }
  }
  const laneClearance = config.marbleRadius * 2 + 100;
  for (const lane of arena.safeLanes) {
    const blocked = arena.obstacles.some(obstacle => lane + laneClearance > obstacle.x && lane - laneClearance < obstacle.x + obstacle.width);
    if (blocked) issues.push({ code: 'safe-lane-blocked', entityId: `lane-${lane}`, detail: 'Mandatory lane lacks declared clearance.' });
  }
  return { valid: issues.length === 0, issues, features: arena.features };
}

export function generateMarbleArena(config: MarbleConfig, roundIndex: number, rng: NamedRng): MarbleArena {
  if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex > 4) throw new RangeError('roundIndex');
  const width = config.worldWidth;
  const height = config.worldHeight;
  const spawnY = height - config.marbleRadius - 500;
  const finishY = config.marbleRadius + 700;
  const archetype = ARCHETYPES[roundIndex];
  const safeLanes = [Math.round(width / 3), Math.round((width * 2) / 3)];
  const content = addRoundContent(config, roundIndex, rng, safeLanes);
  const arena: MarbleArena = {
    schemaVersion: 1,
    generatorVersion: 'marble-arena-v1',
    id: `arena-${roundIndex}-${rng.nextInt(`arena-topology-id-${roundIndex}`, 1_000_000)}`,
    roundIndex,
    archetype,
    width,
    height,
    spawnY,
    finishY,
    spawnPoints: spawnPoints(config, width, spawnY),
    checkpoints: [12_500, 9_500, 6_500, 3_500].map((y, index) => ({ x: safeLanes[index % 2], y })),
    safeLanes,
    ...content,
    features: featureSummary(archetype, content.obstacles, content.bumpers, content.hazards, content.windZones, content.sweepers),
    repairCount: 0,
    fallbackUsed: false
  };
  const report = validateMarbleArena(arena, config);
  return report.valid ? arena : knownGoodFallback(config, roundIndex);
}
