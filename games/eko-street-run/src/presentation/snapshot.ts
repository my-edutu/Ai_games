import { RENDER_SNAPSHOT_VERSION } from "../config/version";
import type { EkoRunRenderSnapshot, EkoRunState, SemanticEvent } from "../state/types";

function cloneEvents(events: readonly SemanticEvent[]): SemanticEvent[] {
  return JSON.parse(JSON.stringify(events)) as SemanticEvent[];
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function createRenderSnapshot(state: EkoRunState, recentEvents: readonly SemanticEvent[] = []): Readonly<EkoRunRenderSnapshot> {
  const snapshot: EkoRunRenderSnapshot = {
    version: RENDER_SNAPSHOT_VERSION,
    runId: state.runId,
    tick: state.tick,
    lifecycle: state.lifecycle,
    player: {
      position: { x: state.player.position.x, y: state.player.position.y },
      velocity: { x: state.player.velocity.x, y: state.player.velocity.y },
      movementState: state.player.movementState,
      facing: state.player.facing,
      checkpointIndex: state.player.checkpointIndex,
      landingCompressionTicksRemaining: state.player.landingCompressionTicksRemaining,
      slideTicksRemaining: state.player.slideTicksRemaining,
      stumbleTicksRemaining: state.player.stumbleTicksRemaining,
    },
    route: {
      id: state.route.id,
      groundY: state.route.groundY,
      minX: state.route.minX,
      maxX: state.route.maxX,
      checkpointXs: [...state.route.checkpointXs],
      finishX: state.route.finishX,
    },
    progress: state.player.progress,
    recentEvents: cloneEvents(recentEvents),
  };
  return deepFreeze(snapshot);
}
