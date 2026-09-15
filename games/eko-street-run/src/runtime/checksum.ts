import type { EkoRunState } from "../state/types";
import { CHECKSUM_VERSION } from "../config/version";

function sortedWatermarks(input: Record<string, number>): Array<[string, number]> {
  return Object.entries(input).sort(([left], [right]) => left.localeCompare(right));
}

function canonicalState(state: EkoRunState): string {
  return JSON.stringify({
    checksumVersion: CHECKSUM_VERSION,
    schemaVersion: state.schemaVersion,
    gameVersion: state.gameVersion,
    deterministicVersion: state.deterministicVersion,
    contentVersion: state.contentVersion,
    runId: state.runId,
    rootSeed: state.rootSeed,
    tick: state.tick,
    nextEventSequence: state.nextEventSequence,
    lifecycle: state.lifecycle,
    player: {
      position: { x: state.player.position.x, y: state.player.position.y },
      velocity: { x: state.player.velocity.x, y: state.player.velocity.y },
      movementState: state.player.movementState,
      checkpointIndex: state.player.checkpointIndex,
      progress: state.player.progress,
    },
    route: {
      id: state.route.id,
      contentVersion: state.route.contentVersion,
      groundY: state.route.groundY,
      startX: state.route.startX,
      minX: state.route.minX,
      maxX: state.route.maxX,
      checkpointXs: [...state.route.checkpointXs],
      finishX: state.route.finishX,
    },
    resources: { ekoTokens: state.resources.ekoTokens },
    commandWatermarks: sortedWatermarks(state.commandWatermarks),
    randomStreams: {
      route: state.randomStreams.route,
      traffic: state.randomStreams.traffic,
      ai: state.randomStreams.ai,
      reward: state.randomStreams.reward,
      audience: state.randomStreams.audience,
    },
    record: { maxProgress: state.record.maxProgress, completedTick: state.record.completedTick },
  });
}

export function checksumState(state: EkoRunState): string {
  const text = canonicalState(state);
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    hash ^= BigInt(code & 0xff);
    hash = (hash * prime) & mask;
    hash ^= BigInt((code >>> 8) & 0xff);
    hash = (hash * prime) & mask;
  }
  return hash.toString(16).padStart(16, "0");
}
