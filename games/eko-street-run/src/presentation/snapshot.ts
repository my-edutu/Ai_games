import { RENDER_SNAPSHOT_VERSION } from "../config/version";
import { getHazardContractsForState, hazardActiveAtTick, hazardPositionAtTick } from "../hazards";
import type { EkoRunRenderSnapshot, EkoRunState, PublicHazardSnapshot, SemanticEvent } from "../state/types";

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

function publicHazards(state: EkoRunState): PublicHazardSnapshot[] {
  if (!state.hazards) return [];
  const byId = new Map(state.hazards.encounters.map(encounter => [encounter.id, encounter]));
  return getHazardContractsForState(state).map(contract => ({
    id: contract.id,
    family: contract.family,
    x: hazardPositionAtTick(contract, state.tick),
    y: contract.y,
    width: contract.width,
    height: contract.height,
    active: hazardActiveAtTick(contract, state.tick),
    phase: byId.get(contract.id)?.phase ?? "unseen",
    legalResponses: [...contract.legalResponses],
    captionKey: contract.captionKey,
    visualToken: contract.visualToken,
  }));
}

export function createRenderSnapshot(state: EkoRunState, recentEvents: readonly SemanticEvent[] = []): Readonly<EkoRunRenderSnapshot> {
  const progression = state.progression;
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
    hazards: publicHazards(state),
    progress: state.player.progress,
    recentEvents: cloneEvents(recentEvents),
    ...(progression ? {
      progression: {
        districtIndex: progression.districtIndex,
        districtId: progression.districtId,
        cycle: progression.cycle,
        districtCompletions: progression.districtCompletions,
        totalDistance: progression.totalDistance,
        pacingBand: progression.pacingBand,
        difficulty: { ...progression.activeContent.difficulty },
        nextMilestoneX: progression.activeContent.milestones.find(milestone => milestone.x > state.player.position.x)?.x ?? null,
      },
      resources: {
        ekoTokens: state.resources.ekoTokens,
        unlockedCosmetics: [...(state.resources.unlockedCosmetics ?? [])],
        unlockedThemes: [...(state.resources.unlockedThemes ?? [])],
        unlockedCelebrations: [...(state.resources.unlockedCelebrations ?? [])],
      },
    } : {}),
  };
  return deepFreeze(snapshot);
}
