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
  const threats = observation.threats;
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
  const target = [...candidates].sort((a, b) =>
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
