import type { EkoRunConfig } from "../config/default-config";
import { generateDistrict, PHASE6_DISTRICT_IDS } from "../generation";
import { createHazardRuntimeStateFromContracts } from "../hazards";
import type { EkoRunState, ProgressionState, ResourceState, SemanticEventType } from "../state/types";

export const PHASE6_TOKEN_CAP = 9_999;
export const PHASE6_LEDGER_ID_LIMIT = 64;

export interface ProgressionSignal {
  type: Extract<SemanticEventType, "token.collected" | "reward.unlocked" | "pacing.changed" | "district.completed">;
  data: Record<string, unknown>;
}

function pushUniqueBounded(values: string[], value: string, limit = PHASE6_LEDGER_ID_LIMIT): boolean {
  if (values.includes(value) || values.length >= limit) return false;
  values.push(value);
  return true;
}

export function createPhase6Resources(): ResourceState {
  return {
    ekoTokens: 0,
    earnedTokenTotal: 0,
    collectedTokenIds: [],
    awardedMilestoneIds: [],
    unlockedCosmetics: [],
    unlockedThemes: [],
    unlockedCelebrations: [],
  };
}

export function createPhase6Progression(rootSeed: string, districtIndex = 0, cycle = 0, districtCompletions = 0, totalDistance = 0): ProgressionState {
  const activeContent = generateDistrict(rootSeed, districtIndex, cycle);
  return { districtIndex, districtId: activeContent.districtId, cycle, districtCompletions, totalDistance, pacingBand: "calm", activeContent };
}

function rewardArrays(resources: ResourceState): Required<Pick<ResourceState, "collectedTokenIds" | "awardedMilestoneIds" | "unlockedCosmetics" | "unlockedThemes" | "unlockedCelebrations">> {
  resources.collectedTokenIds ??= [];
  resources.awardedMilestoneIds ??= [];
  resources.unlockedCosmetics ??= [];
  resources.unlockedThemes ??= [];
  resources.unlockedCelebrations ??= [];
  return {
    collectedTokenIds: resources.collectedTokenIds,
    awardedMilestoneIds: resources.awardedMilestoneIds,
    unlockedCosmetics: resources.unlockedCosmetics,
    unlockedThemes: resources.unlockedThemes,
    unlockedCelebrations: resources.unlockedCelebrations,
  };
}

function applyUnlocks(resources: ResourceState, signals: ProgressionSignal[]): void {
  const arrays = rewardArrays(resources);
  const rules: Array<{ threshold: number; group: "cosmetic" | "theme" | "celebration"; id: string }> = [
    { threshold: 3, group: "cosmetic", id: "checkpoint-burst" },
    { threshold: 8, group: "theme", id: "sunset-accent" },
    { threshold: 15, group: "celebration", id: "district-confetti" },
    { threshold: 25, group: "cosmetic", id: "trail-lagos-lines" },
  ];
  for (const rule of rules) {
    if (resources.ekoTokens < rule.threshold) continue;
    const target = rule.group === "cosmetic" ? arrays.unlockedCosmetics : rule.group === "theme" ? arrays.unlockedThemes : arrays.unlockedCelebrations;
    if (pushUniqueBounded(target, rule.id)) signals.push({ type: "reward.unlocked", data: { rewardType: rule.group, rewardId: rule.id, threshold: rule.threshold } });
  }
}

export function stepPhase6Progression(state: EkoRunState): ProgressionSignal[] {
  if (!state.progression || state.lifecycle !== "running") return [];
  const signals: ProgressionSignal[] = [];
  const arrays = rewardArrays(state.resources);
  const content = state.progression.activeContent;

  for (const token of content.tokens) {
    if (arrays.collectedTokenIds.includes(token.id)) continue;
    if (Math.abs(state.player.position.x - token.x) <= 0.6 && state.player.position.y <= state.route.groundY + 2.2) {
      if (!pushUniqueBounded(arrays.collectedTokenIds, token.id)) continue;
      state.resources.ekoTokens = Math.min(PHASE6_TOKEN_CAP, state.resources.ekoTokens + token.value);
      state.resources.earnedTokenTotal = Math.min(PHASE6_TOKEN_CAP, (state.resources.earnedTokenTotal ?? 0) + token.value);
      signals.push({ type: "token.collected", data: { tokenId: token.id, value: token.value, balance: state.resources.ekoTokens, earnedTokenTotal: state.resources.earnedTokenTotal } });
      applyUnlocks(state.resources, signals);
    }
  }

  for (const milestone of content.milestones) {
    if (arrays.awardedMilestoneIds.includes(milestone.id) || state.player.position.x + 1e-9 < milestone.x) continue;
    pushUniqueBounded(arrays.awardedMilestoneIds, milestone.id);
    if (state.progression.pacingBand !== milestone.band) {
      state.progression.pacingBand = milestone.band;
      signals.push({ type: "pacing.changed", data: { milestoneId: milestone.id, band: milestone.band, x: milestone.x } });
    }
  }

  if (state.player.position.x + 1e-9 >= state.route.finishX) {
    state.progression.districtCompletions += 1;
    state.progression.totalDistance += Math.max(0, state.route.finishX - state.route.startX);
    state.lifecycle = "intermission";
    state.record.completedTick = state.tick;
    signals.push({ type: "district.completed", data: { districtId: state.progression.districtId, districtIndex: state.progression.districtIndex, cycle: state.progression.cycle, districtCompletions: state.progression.districtCompletions, totalDistance: state.progression.totalDistance } });
  }

  return signals;
}

export function advancePhase6District(state: EkoRunState, config: EkoRunConfig): void {
  if (!state.progression || state.lifecycle !== "intermission") throw new Error("Phase 6 advance requires intermission progression state");
  const nextIndex = (state.progression.districtIndex + 1) % PHASE6_DISTRICT_IDS.length;
  const nextCycle = nextIndex === 0 ? state.progression.cycle + 1 : state.progression.cycle;
  const next = createPhase6Progression(state.rootSeed, nextIndex, nextCycle, state.progression.districtCompletions, state.progression.totalDistance);
  state.progression = next;
  state.route = JSON.parse(JSON.stringify(next.activeContent.route)) as EkoRunState["route"];
  state.route.killPlaneY = config.killPlaneY;
  state.hazards = createHazardRuntimeStateFromContracts(next.activeContent.hazards);
  const arrays = rewardArrays(state.resources);
  arrays.collectedTokenIds.splice(0, arrays.collectedTokenIds.length);
  arrays.awardedMilestoneIds.splice(0, arrays.awardedMilestoneIds.length);
  state.player = {
    position: { x: state.route.startX, y: state.route.groundY },
    velocity: { x: 0, y: 0 }, movementState: "grounded", facing: 1,
    coyoteTicksRemaining: config.coyoteTicks, jumpBufferTicksRemaining: 0, jumpCutConsumed: false,
    landingCompressionTicksRemaining: 0, slideTicksRemaining: 0, stumbleTicksRemaining: 0, vault: null,
    checkpointIndex: 0, progress: 0,
  };
  state.lifecycle = "running";
  state.record.completedTick = null;
}
