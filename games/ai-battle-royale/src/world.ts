/** Authority geometry: metres, X/Z plane, expanded rectangle character collision. */
export interface Point { x: number; z: number }
export interface Obstacle extends Point { id: string; w: number; d: number; h: number; kind: string }
export const BODY_RADIUS = 0.45;
export const MAP = {
  size: 120,
  buildings: [
    { id: 'relay', x: -22, z: -22, w: 12, d: 10, h: 9, kind: 'relay' },
    { id: 'habitat', x: 20, z: -22, w: 14, d: 10, h: 7, kind: 'habitat' },
    { id: 'lab', x: -23, z: 21, w: 12, d: 12, h: 7, kind: 'lab' },
    { id: 'hangar', x: 23, z: 22, w: 14, d: 10, h: 8, kind: 'hangar' },
    { id: 'uplink', x: 0, z: 0, w: 8, d: 8, h: 11, kind: 'uplink' },
    { id: 'pump', x: -44, z: 0, w: 7, d: 10, h: 5, kind: 'pump' },
    { id: 'dock', x: 45, z: 0, w: 6, d: 12, h: 5, kind: 'dock' },
  ] as Obstacle[],
  covers: [
    { id: 'c1', x: -9, z: -16, w: 5, d: 2, h: 2.8, kind: 'barricade' },
    { id: 'c2', x: 9, z: 15, w: 5, d: 2, h: 2.8, kind: 'barricade' },
    { id: 'c3', x: -13, z: 3, w: 2, d: 6, h: 3.2, kind: 'cargo' },
    { id: 'c4', x: 14, z: -4, w: 2, d: 6, h: 3.2, kind: 'cargo' },
    { id: 'c5', x: -37, z: -34, w: 5, d: 3, h: 3, kind: 'cargo' },
    { id: 'c6', x: 35, z: 35, w: 5, d: 3, h: 3, kind: 'cargo' },
    { id: 'c7', x: 0, z: -39, w: 6, d: 2, h: 2.6, kind: 'barricade' },
    { id: 'c8', x: 0, z: 39, w: 6, d: 2, h: 2.6, kind: 'barricade' },
    { id: 'c9', x: -37, z: 35, w: 4, d: 3, h: 3, kind: 'cargo' },
    { id: 'c10', x: 36, z: -35, w: 4, d: 3, h: 3, kind: 'cargo' },
  ] as Obstacle[],
};
MAP.buildings.forEach(Object.freeze); MAP.covers.forEach(Object.freeze);
Object.freeze(MAP.buildings); Object.freeze(MAP.covers); Object.freeze(MAP);
export const SOLIDS = Object.freeze([...MAP.buildings, ...MAP.covers]);
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
export const quantize = (n: number) => Math.round(n * 10000) / 10000;
export function walkable(p: Point, radius = BODY_RADIUS): boolean {
  return Math.abs(p.x) <= 59 - radius && Math.abs(p.z) <= 59 - radius &&
    !SOLIDS.some(o => Math.abs(p.x - o.x) < o.w / 2 + radius && Math.abs(p.z - o.z) < o.d / 2 + radius);
}
/** Slab segment intersection includes the complete segment, so thin walls cannot tunnel. */
export function clearSegment(a: Point, b: Point, radius = 0): boolean {
  return !SOLIDS.some(o => {
    let lo = 0, hi = 1;
    for (const axis of ['x', 'z'] as const) {
      const half = (axis === 'x' ? o.w : o.d) / 2 + radius;
      const delta = b[axis] - a[axis];
      if (Math.abs(delta) < 1e-10) {
        if (a[axis] <= o[axis] - half || a[axis] >= o[axis] + half) return false;
      } else {
        let t1 = (o[axis] - half - a[axis]) / delta;
        let t2 = (o[axis] + half - a[axis]) / delta;
        if (t1 > t2) [t1, t2] = [t2, t1];
        lo = Math.max(lo, t1); hi = Math.min(hi, t2);
        if (lo >= hi) return false;
      }
    }
    return hi > 0 && lo < 1;
  });
}
// Static visibility graph, bounded to 68 rectangle corners plus start and destination.
const corners: Point[] = SOLIDS.flatMap(o => [-1, 1].flatMap(dx => [-1, 1].map(dz => ({
  x: o.x + dx * (o.w / 2 + BODY_RADIUS + .15),
  z: o.z + dz * (o.d / 2 + BODY_RADIUS + .15),
})))).filter(p => walkable(p));
const edges = corners.map((p, i) => corners.flatMap((q, j) => j !== i && clearSegment(p, q, BODY_RADIUS) ? [{ to: j, cost: distance(p, q) }] : []));
export function route(start: Point, goal: Point): Point[] {
  if (!walkable(goal)) return [];
  if (clearSegment(start, goal, BODY_RADIUS)) return [{ ...goal }];
  const points = [...corners, start, goal], from = corners.length, to = from + 1;
  const costs = points.map(() => Infinity), parent = points.map(() => -1), closed = points.map(() => false);
  costs[from] = 0;
  for (let expansion = 0; expansion < points.length; expansion++) {
    let best = -1, score = Infinity;
    for (let i = 0; i < points.length; i++) if (!closed[i] && costs[i] + distance(points[i], goal) < score) {
      score = costs[i] + distance(points[i], goal); best = i;
    }
    if (best < 0) break;
    if (best === to) {
      const result: Point[] = [];
      for (let i = to; i !== from; i = parent[i]) result.unshift({ ...points[i] });
      return result;
    }
    closed[best] = true;
    const links = best === from ? corners.flatMap((p, i) => clearSegment(start, p, BODY_RADIUS) ? [{ to: i, cost: distance(start, p) }] : []) : [...edges[best]];
    if (clearSegment(points[best], goal, BODY_RADIUS)) links.push({ to, cost: distance(points[best], goal) });
    for (const link of links) if (costs[best] + link.cost < costs[link.to]) {
      costs[link.to] = costs[best] + link.cost; parent[link.to] = best;
    }
  }
  return [];
}
export function moveAlong(p: Point, path: Point[], speed: number): boolean {
  if (!path.length) return false;
  const goal = path[0], d = distance(p, goal);
  const next = { x: quantize(p.x + (goal.x - p.x) * Math.min(1, speed / Math.max(d, .0001))), z: quantize(p.z + (goal.z - p.z) * Math.min(1, speed / Math.max(d, .0001))) };
  if (!walkable(next) || !clearSegment(p, next, BODY_RADIUS - .001)) { path.length = 0; return false; }
  p.x = next.x; p.z = next.z;
  if (d <= speed + .01) path.shift();
  return true;
}
