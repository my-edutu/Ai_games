/** City units are metres. +Y is up, +Z is forward; traffic keeps right. */
export const ROAD_COORDS: readonly number[] = Object.freeze([-72, -24, 24, 72]);
export const WORLD_EXTENT = 108;
export const JUNCTION_RADIUS = 12;
export const LANE_OFFSET = 3.3;
export const SIDEWALK_OFFSET = 8.8;
export const MAX_ROUTE_NODES = 96;

export interface Point { readonly x: number; readonly z: number }
export interface RoadNode extends Point {
  readonly index: number;
  readonly id: string;
  readonly portal: boolean;
  readonly label: string;
}
export interface RoadLane {
  readonly id: string;
  readonly from: number;
  readonly to: number;
  readonly start: Point;
  readonly end: Point;
  readonly dx: number;
  readonly dz: number;
  readonly length: number;
  readonly axis: 'ns' | 'ew';
}
export type Turn = 'straight' | 'left' | 'right';
export interface PathSegment {
  readonly kind: 'lane' | 'junction';
  readonly points: readonly Point[];
  readonly distances: readonly number[];
  readonly length: number;
  readonly laneId: string;
  readonly incomingLaneId: string;
  readonly outgoingLaneId: string;
  readonly junction: number | null;
  readonly approach: 'ns' | 'ew';
  readonly turn: Turn;
}
export interface TripPath {
  readonly segments: readonly PathSegment[];
  readonly prefix: readonly number[];
  readonly length: number;
}

const nodes: RoadNode[] = [];
for (let row = 0; row < 4; row++) {
  for (let column = 0; column < 4; column++) {
    const index = row * 4 + column;
    nodes.push(Object.freeze({ index, id: `j${index}`, x: ROAD_COORDS[column], z: ROAD_COORDS[row],
      portal: false, label: `${['North', 'Market', 'Civic', 'Harbor'][row]} ${column + 1}` }));
  }
}
const portalJunctions: number[] = [];
for (let side = 0; side < 4; side++) {
  for (let offset = 0; offset < 4; offset++) {
    const index = 16 + side * 4 + offset;
    const x = side === 1 ? WORLD_EXTENT : side === 3 ? -WORLD_EXTENT : ROAD_COORDS[offset];
    const z = side === 0 ? -WORLD_EXTENT : side === 2 ? WORLD_EXTENT : ROAD_COORDS[offset];
    const junction = side === 0 ? offset : side === 1 ? offset * 4 + 3 : side === 2 ? 12 + offset : offset * 4;
    portalJunctions.push(junction);
    nodes.push(Object.freeze({ index, id: `p${index - 16}`, x, z, portal: true,
      label: `${['North', 'East', 'Harbor', 'West'][side]} gate ${offset + 1}` }));
  }
}

const lanes: RoadLane[] = [];
const laneMap = new Map<string, RoadLane>();
const adjacency: number[][] = nodes.map(() => []);
function addDirectedLane(from: number, to: number): void {
  const a = nodes[from], b = nodes[to];
  const distance = Math.hypot(b.x - a.x, b.z - a.z);
  const dx = (b.x - a.x) / distance, dz = (b.z - a.z) / distance;
  const start = Object.freeze({ x: a.x + dx * (a.portal ? 0 : JUNCTION_RADIUS) + dz * LANE_OFFSET,
    z: a.z + dz * (a.portal ? 0 : JUNCTION_RADIUS) - dx * LANE_OFFSET });
  const end = Object.freeze({ x: b.x - dx * (b.portal ? 0 : JUNCTION_RADIUS) + dz * LANE_OFFSET,
    z: b.z - dz * (b.portal ? 0 : JUNCTION_RADIUS) - dx * LANE_OFFSET });
  const lane = Object.freeze({ id: `${a.id}>${b.id}`, from, to, start, end, dx, dz,
    length: Math.hypot(end.x - start.x, end.z - start.z), axis: (dx === 0 ? 'ns' : 'ew') as 'ns' | 'ew' });
  lanes.push(lane);
  laneMap.set(lane.id, lane);
  adjacency[from].push(to);
}
function connect(from: number, to: number): void { addDirectedLane(from, to); addDirectedLane(to, from); }
for (let row = 0; row < 4; row++) {
  for (let column = 0; column < 4; column++) {
    if (column < 3) connect(row * 4 + column, row * 4 + column + 1);
    if (row < 3) connect(row * 4 + column, row * 4 + column + 4);
  }
}
for (let portal = 16; portal < 32; portal++) connect(portal, portalJunctions[portal - 16]);
for (const neighbors of adjacency) neighbors.sort((a, b) => a - b);

export const ROAD_NETWORK = Object.freeze({
  nodes: Object.freeze(nodes), lanes: Object.freeze(lanes),
  portals: Object.freeze(nodes.filter(node => node.portal)),
});
export function roadLane(id: string): RoadLane {
  const lane = laneMap.get(id);
  if (!lane) throw new Error(`Unknown lane ${id}`);
  return lane;
}
export function laneBetween(from: number, to: number): RoadLane {
  return roadLane(`${nodes[from].id}>${nodes[to].id}`);
}

/** One bounded Dijkstra search (16 junctions); all costs are positive. */
export function planTrip(origin: number, destination: number, salt: number,
  congestion: ReadonlyMap<string, number>, incident: boolean): number[] {
  const start = portalJunctions[origin - 16], goal = portalJunctions[destination - 16];
  const path = junctionRoute(start, goal, salt, congestion, incident);
  if (!path) throw new Error('Connected road graph has no route');
  return [origin, ...path, destination];
}

function junctionRoute(start: number, goal: number, salt: number, congestion: ReadonlyMap<string, number>, incident: boolean,
  allowedFirst?: ReadonlySet<string>): number[] | null {
  const distance = new Array<number>(16).fill(Infinity);
  const previous = new Array<number>(16).fill(-1);
  const visited = new Array<boolean>(16).fill(false);
  distance[start] = 0;
  for (let expansion = 0; expansion < 16; expansion++) {
    let current = -1;
    for (let index = 0; index < 16; index++) {
      if (!visited[index] && (current < 0 || distance[index] < distance[current])) current = index;
    }
    if (current < 0 || !Number.isFinite(distance[current])) break;
    if (current === goal) break;
    visited[current] = true;
    for (const neighbor of adjacency[current]) {
      if (neighbor >= 16 || visited[neighbor]) continue;
      const lane = laneBetween(current, neighbor);
      if (current === start && allowedFirst && !allowedFirst.has(lane.id)) continue;
      const mixed = (Math.imul(salt ^ (current + 1), 1664525) ^ Math.imul(neighbor + 7, 1013904223)) >>> 0;
      const cost = 48 + mixed % 11 + (congestion.get(lane.id) ?? 0) * 9
        + (incident && lane.id === 'j5>j6' ? 110 : 0);
      const candidate = distance[current] + cost;
      if (candidate < distance[neighbor]) { distance[neighbor] = candidate; previous[neighbor] = current; }
    }
  }
  const path = [goal];
  while (path[0] !== start) {
    const next = previous[path[0]];
    if (next < 0 || path.length > 16) return null;
    path.unshift(next);
  }
  return path;
}

/** Keep the travelled prefix and the destination; only a legal, open first turn may change. */
export function replanTrip(route: readonly number[], junctionRouteIndex: number, salt: number,
  congestion: ReadonlyMap<string, number>, incident: boolean, allowedFirst: ReadonlySet<string>): number[] | null {
  const start = route[junctionRouteIndex], previous = route[junctionRouteIndex - 1], destination = route[route.length - 1];
  const allowed = new Set([...allowedFirst].filter(id => roadLane(id).to !== previous));
  const goal = portalJunctions[destination - 16];
  if (start === goal && !allowed.has(laneBetween(start, destination).id)) return null;
  const path = junctionRoute(start, goal, salt, congestion, incident, allowed);
  if (!path) return null;
  const result = [...route.slice(0, junctionRouteIndex), ...path, destination];
  return result.length <= MAX_ROUTE_NODES ? result : null;
}

function segment(points: Point[], properties: Omit<PathSegment, 'points' | 'distances' | 'length'>): PathSegment {
  const distances = [0];
  for (let index = 1; index < points.length; index++) {
    distances.push(distances[index - 1] + Math.hypot(points[index].x - points[index - 1].x, points[index].z - points[index - 1].z));
  }
  return Object.freeze({ ...properties, points: Object.freeze(points.map(point => Object.freeze(point))),
    distances: Object.freeze(distances), length: distances[distances.length - 1] });
}

export function buildTrip(route: readonly number[]): TripPath {
  if (route.length < 3 || route.length > MAX_ROUTE_NODES || route[0] < 16 || route[route.length - 1] < 16
    || route[0] === route[route.length - 1] || route.some(index => !Number.isInteger(index) || index < 0 || index >= 32)
    || route.slice(1, -1).some(index => index >= 16)) throw new Error('Invalid origin/destination route');
  const segments: PathSegment[] = [];
  for (let index = 0; index < route.length - 1; index++) {
    const lane = laneBetween(route[index], route[index + 1]);
    segments.push(segment([lane.start, lane.end], { kind: 'lane', laneId: lane.id,
      incomingLaneId: lane.id, outgoingLaneId: lane.id, junction: lane.to < 16 ? lane.to : null,
      approach: lane.axis, turn: 'straight' }));
    if (index === route.length - 2) break;
    const outgoing = laneBetween(route[index + 1], route[index + 2]);
    const dot = lane.dx * outgoing.dx + lane.dz * outgoing.dz;
    if (dot < 0) throw new Error('U-turns are not legal junction movements');
    const turn: Turn = dot > 0 ? 'straight' : lane.dz * outgoing.dx - lane.dx * outgoing.dz > 0 ? 'right' : 'left';
    const points: Point[] = [];
    if (turn === 'straight') points.push(lane.end, outgoing.start);
    else {
      const radius = JUNCTION_RADIUS + (turn === 'right' ? -LANE_OFFSET : LANE_OFFSET);
      const handle = radius * 0.5522847498307936;
      const a = lane.end, d = outgoing.start;
      const b = { x: a.x + lane.dx * handle, z: a.z + lane.dz * handle };
      const c = { x: d.x - outgoing.dx * handle, z: d.z - outgoing.dz * handle };
      for (let sample = 0; sample <= 24; sample++) {
        const t = sample / 24, u = 1 - t;
        points.push({ x: u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x,
          z: u ** 3 * a.z + 3 * u * u * t * b.z + 3 * u * t * t * c.z + t ** 3 * d.z });
      }
    }
    segments.push(segment(points, { kind: 'junction', laneId: lane.id, incomingLaneId: lane.id,
      outgoingLaneId: outgoing.id, junction: lane.to, approach: lane.axis, turn }));
  }
  const prefix = [0];
  for (const part of segments) prefix.push(prefix[prefix.length - 1] + part.length);
  return Object.freeze({ segments: Object.freeze(segments), prefix: Object.freeze(prefix), length: prefix[prefix.length - 1] });
}

export function pointOnPath(part: PathSegment, distance: number): Point & { yaw: number } {
  const clamped = Math.max(0, Math.min(part.length, distance));
  let low = 0, high = part.distances.length - 1;
  while (low + 1 < high) {
    const middle = (low + high) >>> 1;
    if (part.distances[middle] <= clamped) low = middle;
    else high = middle;
  }
  const a = part.points[low], b = part.points[low + 1];
  const fraction = (clamped - part.distances[low]) / (part.distances[low + 1] - part.distances[low]);
  return { x: a.x + (b.x - a.x) * fraction, z: a.z + (b.z - a.z) * fraction,
    yaw: Math.atan2(b.x - a.x, b.z - a.z) };
}

export interface WalkNode extends Point { readonly index: number; readonly junction: number }
export interface WalkEdge {
  readonly from: number; readonly to: number; readonly length: number;
  readonly dx: number; readonly dz: number; readonly crossing: boolean; readonly junction: number | null;
}
const walkNodes: WalkNode[] = [];
for (let junction = 0; junction < 16; junction++) {
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    walkNodes.push(Object.freeze({ index: walkNodes.length, junction,
      x: nodes[junction].x + sx * SIDEWALK_OFFSET, z: nodes[junction].z + sz * SIDEWALK_OFFSET }));
  }
}
const walkEdges: WalkEdge[] = [];
const walkAdjacency: WalkEdge[][] = walkNodes.map(() => []);
function connectWalk(from: number, to: number, crossing: boolean): void {
  for (const [a, b] of [[from, to], [to, from]]) {
    const dx = walkNodes[b].x - walkNodes[a].x, dz = walkNodes[b].z - walkNodes[a].z;
    const length = Math.hypot(dx, dz);
    const edge = Object.freeze({ from: a, to: b, dx: dx / length, dz: dz / length, length,
      crossing, junction: crossing ? walkNodes[a].junction : null });
    walkEdges.push(edge); walkAdjacency[a].push(edge);
  }
}
for (let junction = 0; junction < 16; junction++) {
  for (let corner = 0; corner < 4; corner++) connectWalk(junction * 4 + corner, junction * 4 + (corner + 1) % 4, true);
  if (junction % 4 < 3) {
    connectWalk(junction * 4 + 1, (junction + 1) * 4, false);
    connectWalk(junction * 4 + 2, (junction + 1) * 4 + 3, false);
  }
  if (junction < 12) {
    connectWalk(junction * 4 + 3, (junction + 4) * 4, false);
    connectWalk(junction * 4 + 2, (junction + 4) * 4 + 1, false);
  }
}
for (const edges of walkAdjacency) edges.sort((a, b) => a.to - b.to);
export const WALK_NETWORK = Object.freeze({ nodes: Object.freeze(walkNodes), edges: Object.freeze(walkEdges) });
export function walkEdge(from: number, to: number): WalkEdge {
  const edge = walkAdjacency[from]?.find(candidate => candidate.to === to);
  if (!edge) throw new Error('Invalid sidewalk route');
  return edge;
}
export function planWalk(start: number, goal: number, salt: number): number[] {
  const distance = new Array<number>(64).fill(Infinity), previous = new Array<number>(64).fill(-1);
  const visited = new Array<boolean>(64).fill(false);
  distance[start] = 0;
  for (let expansion = 0; expansion < 64; expansion++) {
    let current = -1;
    for (let index = 0; index < 64; index++) if (!visited[index] && (current < 0 || distance[index] < distance[current])) current = index;
    if (current < 0 || current === goal) break;
    visited[current] = true;
    for (const edge of walkAdjacency[current]) {
      const candidate = distance[current] + edge.length + (edge.crossing ? 9 : 0)
        + ((Math.imul(salt ^ current, 1664525) ^ edge.to) >>> 0) % 5;
      if (candidate < distance[edge.to]) { distance[edge.to] = candidate; previous[edge.to] = current; }
    }
  }
  const route = [goal];
  while (route[0] !== start) {
    const next = previous[route[0]];
    if (next < 0 || route.length > 64) throw new Error('Connected sidewalks have no route');
    route.unshift(next);
  }
  return route;
}
export function pointOnWalk(edge: WalkEdge, position: number): Point & { yaw: number } {
  const start = walkNodes[edge.from];
  // Keep opposite directions separated all the way to each corner. Corner connectors
  // join these offset endpoints under an exclusive pedestrian corner reservation.
  const side = 0.45;
  return { x: start.x + edge.dx * position + edge.dz * side,
    z: start.z + edge.dz * position - edge.dx * side, yaw: Math.atan2(edge.dx, edge.dz) };
}
