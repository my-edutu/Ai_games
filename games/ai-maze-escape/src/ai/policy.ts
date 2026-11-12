import type { MazeAction, MazeIntentMode } from '../../../../packages/game-contracts/src/index';
import type { MazeObservation } from './observation';
import type { MazeBeliefState, MazeState } from '../state/types';
import { findKnownPath } from './pathing';
import { detectMazeCycle } from './stuck';

export interface MazeDecision {
  action: MazeAction;
  intent: {
    mode: MazeIntentMode;
    confidence: number;
    explanation: string;
    nodeExpansions: number;
    fallbackUsed: boolean;
  };
  plannedPath: number[];
  targetCell: number | null;
}

function doorBlocksEdge(belief: MazeBeliefState, a: number, b: number, inventory: string[]): boolean {
  const door = Object.values(belief.doors).find(
    item => (item.a === a && item.b === b) || (item.a === b && item.b === a),
  );
  return !!door && !door.open && !inventory.includes(door.requiredKeyId);
}

function gridDistance(a: number, b: number, width: number): number {
  const aRow = Math.floor(a / width);
  const aCol = a % width;
  const bRow = Math.floor(b / width);
  const bCol = b % width;
  return Math.abs(aRow - bRow) + Math.abs(aCol - bCol);
}

// The explorer should NOT flee merely because a guardian is visible through
// some other turn. A true standoff is a currently published 1-2 cell STRAIGHT
// open passage, or an adjacent open passage. That lets Pip progress to a
// genuine public encounter, but stops the next move before contact.
function observedOpenThreatPath(observation:MazeObservation,guardianCell:number,width:number):boolean{
  const hero=observation.currentCell;
  const dx=guardianCell%width-hero%width;
  const dy=Math.floor(guardianCell/width)-Math.floor(hero/width);
  const distance=Math.abs(dx)+Math.abs(dy);
  if(distance<1||distance>2||(dx!==0&&dy!==0))return false;
  const cells=new Map(observation.cells.filter(cell=>cell.visible&&!cell.blocked)
    .map(cell=>[cell.cell,cell] as const));
  const step=dx?Math.sign(dx):Math.sign(dy)*width;
  let current=hero;
  for(let i=0;i<distance;i++){
    const next=current+step,from=cells.get(current),to=cells.get(next);
    if(!from||!to||!from.neighbors.includes(next)||!to.neighbors.includes(current)
      ||observation.doors.some(door=>!door.open&&
        ((door.a===current&&door.b===next)||(door.a===next&&door.b===current))))return false;
    current=next;
  }
  return true;
}

function safeObservedNeighbors(
  currentCell: number,
  candidates: number[],
  observation: MazeObservation,
  belief: MazeBeliefState,
): number[] {
  const dangerous = new Set(observation.threats.map(threat => threat.cell));
  return candidates.filter(cell => {
    const known = belief.cells[String(cell)];
    return !dangerous.has(cell)
      && !known?.trap
      && !known?.blocked
      && !doorBlocksEdge(belief, currentCell, cell, observation.inventory);
  });
}

function chooseEvasion(
  state: MazeState,
  observation: MazeObservation,
  belief: MazeBeliefState,
): MazeDecision | null {
  // Proximity by Euclidean/grid radius alone is not immediate danger: it
  // caused endless evasive wandering and prevented real Pip/Thornback scenes.
  // Only presently OBSERVED reciprocal-open links authorize defensive control.
  const threats = observation.threats.filter(threat =>
    observedOpenThreatPath(observation,threat.cell,state.config.width));
  if (!threats.length) return null;

  const current = belief.cells[String(observation.currentCell)];
  const legal = current?.neighbors ?? [];
  const candidates = safeObservedNeighbors(observation.currentCell, legal, observation, belief);

  if (!candidates.length) {
    return {
      action: { kind: 'wait' },
      intent: {
        mode: 'evading-threat',
        confidence: 0.5,
        explanation: 'No safe observed passage; holding position for the next threat phase.',
        nodeExpansions: legal.length,
        fallbackUsed: true,
      },
      plannedPath: [observation.currentCell],
      targetCell: null,
    };
  }

  const threatDistance = (cell: number) => Math.min(
    ...threats.map(threat => gridDistance(cell, threat.cell, state.config.width)),
  );
  // The actual two-cell Pip–Thornback standoff is a CONSEQUENCE of an
  // observed, reciprocal open passage, not permission to step into the
  // guardian's adjacent contact range. The previous distance ranking would
  // choose the ONLY available neighbor even when it CLOSED the gap. Let the
  // real published patrol change before taking that suicidal "evasion".
  // No private patrol routes, future cells, RNG or speculative attacks.
  const currentDistance = threatDistance(observation.currentCell);
  const nonClosing = candidates.filter(cell => threatDistance(cell) >= currentDistance);
  if (!nonClosing.length) {
    return {
      action: { kind: 'wait' },
      intent: {
        mode: 'evading-threat',
        confidence: 0.72,
        explanation: 'A visible guardian blocks every observed retreat; holding position instead of moving closer.',
        nodeExpansions: legal.length,
        fallbackUsed: true,
      },
      plannedPath: [observation.currentCell],
      targetCell: null,
    };
  }

  const target = [...nonClosing].sort((a, b) =>
    threatDistance(b) - threatDistance(a)
    || (belief.cells[String(a)]?.visits ?? 0) - (belief.cells[String(b)]?.visits ?? 0)
    || a - b,
  )[0]!;

  return {
    action: { kind: 'move', targetCell: target },
    intent: {
      mode: 'evading-threat',
      confidence: 0.92,
      explanation: 'A visible threat is close; moving through the safest observed passage.',
      nodeExpansions: legal.length,
      fallbackUsed: false,
    },
    plannedPath: [observation.currentCell, target],
    targetCell: target,
  };
}

function targetDecision(
  observation: MazeObservation,
  belief: MazeBeliefState,
  target: number,
  mode: MazeIntentMode,
  explanation: string,
  allowUnknownGoal = false,
): MazeDecision | null {
  const path = findKnownPath(belief, observation.currentCell, target, {
    inventory: observation.inventory,
    avoidCells: Object.values(belief.cells)
      .filter(cell => cell.trap || cell.blocked)
      .map(cell => cell.cell),
    allowUnknownGoal,
  });
  if (!path || path.path.length < 2) return null;
  return {
    action: { kind: 'move', targetCell: path.path[1]! },
    intent: {
      mode,
      confidence: 0.85,
      explanation,
      nodeExpansions: path.expansions,
      fallbackUsed: false,
    },
    plannedPath: path.path,
    targetCell: target,
  };
}

// A pressure court is an actual observed hazard, not set dressing. On the
// first safe vantage Pip can briefly study the publicly visible jaws.
// A diagonal court counts ONLY via a currently visible, walkable, reciprocal
// two-edge approach, with no sealed intermediate edge. The bounded existing
// visit counter prevents indefinite waiting and forbids hidden map knowledge.
function chooseVisiblePressureInspection(
  observation: MazeObservation,
  belief: MazeBeliefState,
  width: number,
): MazeDecision | null {
  const current = observation.cells.find(cell =>
    cell.cell === observation.currentCell && cell.visible && !cell.blocked);
  if (!current) return null;
  const visits = belief.cells[String(current.cell)]?.visits;
  if (visits === undefined || visits < 1 || visits > 2) return null;
  const published = new Map(observation.cells.filter(cell => cell.visible)
    .map(cell => [cell.cell, cell] as const));
  // Inspection is earned only if Pip also has a known safe exit from this
  // vantage. No waiting at a dead end, no imaginary collision or oracle route.
  const safeRetreat = current.neighbors.some(next => {
    const cell = published.get(next);
    return !!cell && !cell.blocked && !cell.trap
      && cell.neighbors.includes(current.cell)
      && !doorBlocksEdge(belief, current.cell, next, observation.inventory);
  });
  if (!safeRetreat) return null;
  const pressure = [...published.values()].filter(cell => {
    if (!cell.trap || cell.blocked) return false;
    if (current.neighbors.includes(cell.cell) && cell.neighbors.includes(current.cell))
      return !doorBlocksEdge(belief, current.cell, cell.cell, observation.inventory);
    const dx = Math.abs(current.cell % width - cell.cell % width);
    const dy = Math.abs(Math.floor(current.cell / width) - Math.floor(cell.cell / width));
    if (dx !== 1 || dy !== 1) return false;
    // Visible diagonal sculpture is not permission to see through solid walls.
    // Both steps must be currently public, reciprocal and unsealed; no oracle.
    return current.neighbors.some(midId => {
      const mid = published.get(midId);
      return !!mid && !mid.blocked && !mid.trap
        && mid.neighbors.includes(current.cell) && mid.neighbors.includes(cell.cell)
        && cell.neighbors.includes(midId)
        && !doorBlocksEdge(belief, current.cell, midId, observation.inventory)
        && !doorBlocksEdge(belief, midId, cell.cell, observation.inventory);
    });
  }).sort((a,b) => a.cell - b.cell)[0];
  if (!pressure) return null;
  return {
    action: { kind: 'wait' },
    intent: {
      mode: 'inspecting-hazard',
      confidence: .88,
      explanation: 'A visible pressure jaw guards the approach; studying it briefly before choosing a safe passage.',
      nodeExpansions: current.neighbors.length,
      fallbackUsed: false,
    },
    plannedPath: [current.cell],
    targetCell: null,
  };
}

export function chooseMazeAction(
  state: MazeState,
  observation: MazeObservation,
  belief: MazeBeliefState,
): MazeDecision {
  const evasion = chooseEvasion(state, observation, belief);
  if (evasion) return evasion;

  const visibleKey = observation.keys
    .filter(key => !key.collected && !observation.inventory.includes(key.id))
    .sort((a, b) => a.cell - b.cell)[0];
  if (visibleKey) {
    const decision = targetDecision(
      observation,
      belief,
      visibleKey.cell,
      'returning-key',
      'A required key is known; navigating to collect it.',
    );
    if (decision) return decision;
  }

  if (observation.exitCell !== null) {
    const decision = targetDecision(
      observation,
      belief,
      observation.exitCell,
      'searching-exit',
      'The exit is visible in the belief map; following a legal known route.',
    );
    if (decision) return decision;
  }

  const pressureInspection = chooseVisiblePressureInspection(observation, belief, state.config.width);
  if (pressureInspection) return pressureInspection;

  const cyclic = detectMazeCycle(state.ai.recentCells);
  const frontierCandidates = belief.frontiers
    .map(frontier => ({
      frontier,
      path: findKnownPath(belief, observation.currentCell, frontier, {
        inventory: observation.inventory,
        avoidCells: Object.values(belief.cells)
          .filter(cell => cell.trap || cell.blocked)
          .map(cell => cell.cell),
        allowUnknownGoal: true,
      }),
    }))
    .filter(item => item.path && item.path.path.length >= 2)
    .sort((a, b) =>
      (a.path?.path.length ?? Number.POSITIVE_INFINITY)
      - (b.path?.path.length ?? Number.POSITIVE_INFINITY)
      || a.frontier - b.frontier,
    );

  if (frontierCandidates.length) {
    const selected = cyclic && frontierCandidates.length > 1
      ? frontierCandidates[1]!
      : frontierCandidates[0]!;
    const path = selected.path!;
    return {
      action: { kind: 'move', targetCell: path.path[1]! },
      intent: {
        mode: cyclic ? 'revising-map' : 'exploring',
        confidence: cyclic ? 0.72 : 0.8,
        explanation: cyclic
          ? 'The recent route repeated; switching to a different observed frontier.'
          : 'Expanding the nearest reachable frontier using only discovered passages.',
        nodeExpansions: path.expansions,
        fallbackUsed: false,
      },
      plannedPath: path.path,
      targetCell: selected.frontier,
    };
  }

  const knownExit = Object.values(belief.cells).find(cell => cell.exit);
  if (knownExit) {
    const decision = targetDecision(
      observation,
      belief,
      knownExit.cell,
      'searching-exit',
      'All reachable frontiers are exhausted; returning to the remembered exit.',
    );
    if (decision) return decision;
  }

  const current = belief.cells[String(observation.currentCell)];
  const previous = state.ai.recentCells.at(-2);
  const fallback = safeObservedNeighbors(
    observation.currentCell,
    current?.neighbors ?? [],
    observation,
    belief,
  ).sort((a, b) =>
    (belief.cells[String(a)]?.visits ?? 0) - (belief.cells[String(b)]?.visits ?? 0)
    || Number(a === previous) - Number(b === previous)
    || a - b,
  )[0];

  if (fallback !== undefined) {
    return {
      action: { kind: 'move', targetCell: fallback },
      intent: {
        mode: 'fallback',
        confidence: 0.45,
        explanation: 'No reachable frontier or objective route remains; taking the least-visited safe observed passage.',
        nodeExpansions: current?.neighbors.length ?? 0,
        fallbackUsed: true,
      },
      plannedPath: [observation.currentCell, fallback],
      targetCell: fallback,
    };
  }

  return {
    action: { kind: 'wait' },
    intent: {
      mode: 'fallback',
      confidence: 0.2,
      explanation: 'No legal observed move is available; waiting without using hidden information.',
      nodeExpansions: 0,
      fallbackUsed: true,
    },
    plannedPath: [observation.currentCell],
    targetCell: null,
  };
}
