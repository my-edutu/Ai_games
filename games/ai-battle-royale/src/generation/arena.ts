import { NamedRng } from '../../../../packages/seeded-rng/src/index';
import type { BattleArena, BattleConfig, BattleLoot, BattleLootKind, BattleWeapon } from '../state/types';
import { fnv1aHex, stableStringify } from '../rules/checksum';
import { reachableWalkableCells, toCell } from '../rules/geometry';

function perimeterRing(width: number, height: number, margin: number): number[] {
  const cells: number[] = [];
  const minX = margin;
  const maxX = width - margin - 1;
  const minY = margin;
  const maxY = height - margin - 1;
  for (let x = minX; x <= maxX; x += 1) cells.push(toCell(x, minY, width));
  for (let y = minY + 1; y <= maxY; y += 1) cells.push(toCell(maxX, y, width));
  for (let x = maxX - 1; x >= minX; x -= 1) cells.push(toCell(x, maxY, width));
  for (let y = maxY - 1; y > minY; y -= 1) cells.push(toCell(minX, y, width));
  return cells;
}

function chooseSpawnCells(config: BattleConfig, rng: NamedRng): number[] {
  const ring = perimeterRing(config.width, config.height, 2);
  if (ring.length < config.combatantCount) throw new Error('arena perimeter cannot provide unique spawn cells');
  const offset = rng.nextInt('arena:spawns', ring.length);
  const result: number[] = [];
  for (let index = 0; index < config.combatantCount; index += 1) {
    const evenlySpaced = Math.floor(index * ring.length / config.combatantCount);
    result.push(ring[(offset + evenlySpaced) % ring.length]);
  }
  return result;
}

function allWalkableConnected(width: number, height: number, obstacles: Set<number>, start: number): boolean {
  const arena = { width, height, obstacles: [...obstacles] };
  const reachable = reachableWalkableCells(arena, start);
  return reachable.size === width * height - obstacles.size;
}

function chooseUniqueWalkable(
  stream: string,
  count: number,
  width: number,
  height: number,
  rng: NamedRng,
  blocked: ReadonlySet<number>,
  excluded: ReadonlySet<number>,
): number[] {
  const chosen = new Set<number>();
  const capacity = width * height;
  const maxAttempts = Math.max(capacity * 4, count * 24);
  for (let attempt = 0; attempt < maxAttempts && chosen.size < count; attempt += 1) {
    const cell = rng.nextInt(stream, capacity);
    if (!blocked.has(cell) && !excluded.has(cell)) chosen.add(cell);
  }
  if (chosen.size < count) {
    for (let cell = 0; cell < capacity && chosen.size < count; cell += 1) {
      if (!blocked.has(cell) && !excluded.has(cell)) chosen.add(cell);
    }
  }
  return [...chosen].sort((first, second) => first - second);
}

function lootForIndex(index: number, cell: number, rng: NamedRng): BattleLoot {
  const kinds: BattleLootKind[] = ['ammo', 'shield', 'medkit', 'weapon'];
  const kind = kinds[rng.nextInt('arena:loot-kind', kinds.length)];
  const weapons: BattleWeapon[] = ['sidearm', 'scattergun', 'carbine', 'marksman'];
  const weapon = kind === 'weapon' ? weapons[rng.nextInt('arena:loot-weapon', weapons.length)] : undefined;
  const amount = kind === 'ammo' ? 8 + rng.nextInt('arena:loot-amount', 9)
    : kind === 'shield' ? 12 + rng.nextInt('arena:loot-amount', 14)
      : kind === 'medkit' ? 1
        : 1;
  return {
    id: `loot-${index.toString().padStart(3, '0')}`,
    kind,
    cell,
    weapon,
    amount,
    spawnedAtTick: 0,
  };
}

export function generateArena(config: BattleConfig, rng: NamedRng): BattleArena {
  const spawnCells = chooseSpawnCells(config, rng);
  const reserved = new Set<number>(spawnCells);
  const centerX = Math.floor(config.width / 2);
  const centerY = Math.floor(config.height / 2);
  for (let x = 1; x < config.width - 1; x += 1) reserved.add(toCell(x, centerY, config.width));
  for (let y = 1; y < config.height - 1; y += 1) reserved.add(toCell(centerX, y, config.width));

  const obstacles = new Set<number>();
  const obstacleTarget = Math.floor(config.width * config.height * config.obstaclePermille / 1_000);
  const obstacleAttemptLimit = Math.max(obstacleTarget * 32, config.width * config.height * 3);
  let obstacleAttempts = 0;
  while (obstacles.size < obstacleTarget && obstacleAttempts < obstacleAttemptLimit) {
    obstacleAttempts += 1;
    const candidate = rng.nextInt('arena:obstacles', config.width * config.height);
    const x = candidate % config.width;
    const y = Math.floor(candidate / config.width);
    if (reserved.has(candidate) || obstacles.has(candidate) || x === 0 || y === 0 || x === config.width - 1 || y === config.height - 1) continue;
    obstacles.add(candidate);
    if (!allWalkableConnected(config.width, config.height, obstacles, spawnCells[0])) obstacles.delete(candidate);
  }

  const coverTarget = Math.floor(config.width * config.height * config.coverPermille / 1_000);
  const coverExcluded = new Set<number>([...spawnCells, toCell(centerX, centerY, config.width)]);
  const cover = chooseUniqueWalkable('arena:cover', coverTarget, config.width, config.height, rng, obstacles, coverExcluded);

  const lootExcluded = new Set<number>(spawnCells);
  const lootCells = chooseUniqueWalkable('arena:loot', config.lootCount, config.width, config.height, rng, obstacles, lootExcluded);
  const loot = lootCells.map((cell, index) => lootForIndex(index, cell, rng));

  const anchorCandidates = [
    toCell(centerX, centerY, config.width),
    toCell(Math.floor(config.width / 4), Math.floor(config.height / 4), config.width),
    toCell(Math.floor(config.width * 3 / 4), Math.floor(config.height / 4), config.width),
    toCell(Math.floor(config.width / 4), Math.floor(config.height * 3 / 4), config.width),
    toCell(Math.floor(config.width * 3 / 4), Math.floor(config.height * 3 / 4), config.width),
  ];
  const supplyAnchors = anchorCandidates.filter((cell) => !obstacles.has(cell));
  const featureHash = fnv1aHex(stableStringify({ obstacles: [...obstacles].sort((a, b) => a - b), cover, spawnCells, lootCells }));

  return {
    width: config.width,
    height: config.height,
    obstacles: [...obstacles].sort((first, second) => first - second),
    cover,
    spawnCells,
    loot,
    supplyAnchors,
    generation: {
      obstacleTarget,
      obstacleCount: obstacles.size,
      obstacleAttempts,
      coverTarget,
      coverCount: cover.length,
      fallbackUsed: false,
      featureHash,
    },
  };
}
