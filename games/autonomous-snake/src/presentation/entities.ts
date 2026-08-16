import type { RenderSnapshot } from './snapshot';

export type VisualEntityKind = 'snake' | 'objective' | 'obstacle' | 'hazard' | 'portal';

export interface VisualEntity {
  id: string;
  kind: VisualEntityKind;
  cell: number;
  previousCell: number;
  role?: string;
  active?: boolean;
  variant?: string;
  updatedAtTick: number;
}

export interface EntityDelta {
  created: VisualEntity[];
  updated: VisualEntity[];
  removed: VisualEntity[];
}

function clone(entity: VisualEntity): VisualEntity {
  return { ...entity };
}

function flatten(snapshot: RenderSnapshot): VisualEntity[] {
  const entities: VisualEntity[] = snapshot.snake.map(segment => ({
    id: segment.id,
    kind: 'snake',
    cell: segment.cell,
    previousCell: segment.cell,
    role: segment.role,
    updatedAtTick: snapshot.tick,
  }));

  if (snapshot.food) {
    entities.push({
      id: snapshot.food.id,
      kind: 'objective',
      cell: snapshot.food.cell,
      previousCell: snapshot.food.cell,
      variant: snapshot.food.kind,
      updatedAtTick: snapshot.tick,
    });
  }

  for (const cell of snapshot.obstacles) {
    entities.push({
      id: `obstacle-${cell}`,
      kind: 'obstacle',
      cell,
      previousCell: cell,
      updatedAtTick: snapshot.tick,
    });
  }

  for (const hazard of snapshot.hazards) {
    entities.push({
      id: hazard.id,
      kind: 'hazard',
      cell: hazard.cell,
      previousCell: hazard.cell,
      active: hazard.active,
      variant: `phase-${hazard.phase}`,
      updatedAtTick: snapshot.tick,
    });
  }

  for (const portal of snapshot.portals) {
    entities.push({
      id: `${portal.id}-a`,
      kind: 'portal',
      cell: portal.entry,
      previousCell: portal.entry,
      variant: 'entry',
      updatedAtTick: snapshot.tick,
    });
    entities.push({
      id: `${portal.id}-b`,
      kind: 'portal',
      cell: portal.exit,
      previousCell: portal.exit,
      variant: 'exit',
      updatedAtTick: snapshot.tick,
    });
  }

  return entities;
}

export class EntityRegistry {
  private readonly entities = new Map<string, VisualEntity>();
  private lastTick = -1;

  apply(snapshot: RenderSnapshot): EntityDelta {
    if (snapshot.tick < this.lastTick) throw new RangeError('stale entity snapshot');
    const incoming = new Map(flatten(snapshot).map(entity => [entity.id, entity]));
    const created: VisualEntity[] = [];
    const updated: VisualEntity[] = [];
    const removed: VisualEntity[] = [];

    for (const [id, next] of incoming) {
      const previous = this.entities.get(id);
      if (!previous) {
        const stored = clone(next);
        this.entities.set(id, stored);
        created.push(clone(stored));
        continue;
      }
      const stored: VisualEntity = {
        ...next,
        previousCell: previous.cell,
      };
      this.entities.set(id, stored);
      updated.push(clone(stored));
    }

    for (const [id, previous] of [...this.entities.entries()]) {
      if (incoming.has(id)) continue;
      removed.push(clone(previous));
      this.entities.delete(id);
    }

    this.lastTick = snapshot.tick;
    return { created, updated, removed };
  }

  interpolate(id: string, alpha: number, width: number): { x: number; y: number } | undefined {
    const entity = this.entities.get(id);
    if (!entity) return undefined;
    const boundedAlpha = Math.max(0, Math.min(1, alpha));
    const fromX = entity.previousCell % width;
    const fromY = Math.floor(entity.previousCell / width);
    const toX = entity.cell % width;
    const toY = Math.floor(entity.cell / width);
    return {
      x: fromX + (toX - fromX) * boundedAlpha,
      y: fromY + (toY - fromY) * boundedAlpha,
    };
  }

  size(): number {
    return this.entities.size;
  }

  values(): VisualEntity[] {
    return [...this.entities.values()].sort((a, b) => a.id.localeCompare(b.id)).map(clone);
  }

  clear(): void {
    this.entities.clear();
    this.lastTick = -1;
  }
}
