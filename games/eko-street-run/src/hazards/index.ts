import type { EkoRunConfig } from "../config/default-config";
import type { EkoRunState, HazardContract, HazardEncounter, HazardRuntimeState } from "../state/types";

export const PHASE5_HAZARD_SCHEMA_VERSION = 1;

interface BaseHazardContract extends Omit<HazardContract, "phaseOffsetTicks"> {}

const BASE_CONTRACTS: readonly BaseHazardContract[] = Object.freeze([
  { id: "hazard-danfo-01", family: "danfo-pull-out", baseX: 10, y: 0, width: 1.8, height: 1.7, warningDistance: 6.5, minResponseTicks: 24, legalResponses: ["slow", "wait"], consequence: "stumble", captionKey: "hazard.danfo", visualToken: "danfo-yellow", maxHazardSpeed: 1.5, motion: { minOffsetX: -1, maxOffsetX: 1, periodTicks: 180, activeTicks: 120 } },
  { id: "hazard-molue-01", family: "molue-crossing", baseX: 20, y: 0, width: 2.4, height: 2.2, warningDistance: 6.5, minResponseTicks: 30, legalResponses: ["wait"], consequence: "fail", captionKey: "hazard.molue", visualToken: "molue-large", maxHazardSpeed: 1, motion: { minOffsetX: -0.8, maxOffsetX: 0.8, periodTicks: 240, activeTicks: 150 } },
  { id: "hazard-pothole-01", family: "pothole", baseX: 30, y: 0, width: 1.1, height: 0.25, warningDistance: 6.5, minResponseTicks: 24, legalResponses: ["jump"], consequence: "stumble", captionKey: "hazard.pothole", visualToken: "road-pothole", maxHazardSpeed: 0 },
  { id: "hazard-drain-01", family: "open-drain", baseX: 40, y: 0, width: 1.35, height: 0.35, warningDistance: 6.5, minResponseTicks: 30, legalResponses: ["jump"], consequence: "fail", captionKey: "hazard.open-drain", visualToken: "open-drain", maxHazardSpeed: 0 },
  { id: "hazard-trench-01", family: "construction-trench", baseX: 50, y: 0, width: 1.45, height: 0.45, warningDistance: 6.5, minResponseTicks: 30, legalResponses: ["jump"], consequence: "fail", captionKey: "hazard.trench", visualToken: "construction-trench", maxHazardSpeed: 0 },
  { id: "hazard-flood-01", family: "flood-puddle", baseX: 60, y: 0, width: 2.4, height: 0.18, warningDistance: 6.5, minResponseTicks: 24, legalResponses: ["slow", "jump"], consequence: "slow", captionKey: "hazard.flood", visualToken: "flood-water", maxHazardSpeed: 0 },
  { id: "hazard-handcart-01", family: "handcart", baseX: 70, y: 0, width: 1.2, height: 1.15, warningDistance: 6.5, minResponseTicks: 24, legalResponses: ["slow", "wait"], consequence: "stumble", captionKey: "hazard.handcart", visualToken: "street-handcart", maxHazardSpeed: 1, motion: { minOffsetX: -0.6, maxOffsetX: 0.6, periodTicks: 180, activeTicks: 120 } },
  { id: "hazard-rolling-01", family: "rolling-object", baseX: 80, y: 0, width: 0.7, height: 0.7, warningDistance: 6.5, minResponseTicks: 24, legalResponses: ["jump", "wait"], consequence: "stumble", captionKey: "hazard.rolling", visualToken: "rolling-object", maxHazardSpeed: 2.1, motion: { minOffsetX: -1, maxOffsetX: 1, periodTicks: 120, activeTicks: 90 } },
  { id: "hazard-crowd-01", family: "crowd-compression", baseX: 90, y: 0, width: 2, height: 1.8, warningDistance: 6.5, minResponseTicks: 24, legalResponses: ["slow"], consequence: "slow", captionKey: "hazard.crowd", visualToken: "crowd-compression", maxHazardSpeed: 0.6, motion: { minOffsetX: -0.4, maxOffsetX: 0.4, periodTicks: 180, activeTicks: 150 } },
  { id: "hazard-disturbance-01", family: "street-disturbance", baseX: 100, y: 0, width: 1.8, height: 1.7, warningDistance: 6.5, minResponseTicks: 24, legalResponses: ["slow", "wait"], consequence: "slow", captionKey: "hazard.disturbance", visualToken: "street-disturbance", maxHazardSpeed: 0 },
  { id: "hazard-block-01", family: "temporary-block", baseX: 110, y: 0, width: 1.4, height: 0.85, warningDistance: 6.5, minResponseTicks: 30, legalResponses: ["wait", "vault"], consequence: "stumble", captionKey: "hazard.temporary-block", visualToken: "temporary-block", maxHazardSpeed: 0 },
]);

function hash32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

export function getPhase5HazardContracts(seed: string): HazardContract[] {
  return BASE_CONTRACTS.map(base => {
    const period = base.motion?.periodTicks ?? 360;
    return {
      ...base,
      legalResponses: [...base.legalResponses],
      motion: base.motion ? { ...base.motion } : undefined,
      phaseOffsetTicks: hash32(`${seed}|${base.id}`) % period,
    };
  });
}

export function hazardPositionAtTick(contract: HazardContract, tick: number): number {
  if (!contract.motion) return contract.baseX;
  const period = contract.motion.periodTicks;
  const local = positiveModulo(tick + contract.phaseOffsetTicks, period) / period;
  const triangle = local < 0.5 ? local * 2 : (1 - local) * 2;
  return contract.baseX + contract.motion.minOffsetX + (contract.motion.maxOffsetX - contract.motion.minOffsetX) * triangle;
}

export function hazardActiveAtTick(contract: HazardContract, tick: number): boolean {
  if (!contract.motion) return true;
  const local = positiveModulo(tick + contract.phaseOffsetTicks, contract.motion.periodTicks);
  return local < contract.motion.activeTicks;
}

export function createHazardRuntimeState(seed: string): HazardRuntimeState {
  const encounters: HazardEncounter[] = getPhase5HazardContracts(seed).map(contract => ({
    id: contract.id,
    family: contract.family,
    phase: "unseen",
    warningTick: null,
    resolvedTick: null,
  }));
  return { hazardSchemaVersion: PHASE5_HAZARD_SCHEMA_VERSION, encounters };
}

function inWarningZone(state: EkoRunState, contract: HazardContract, x: number): boolean {
  const delta = x - state.player.position.x;
  if (state.player.facing > 0) return delta >= -contract.width && delta <= contract.warningDistance;
  return delta <= contract.width && -delta <= contract.warningDistance;
}

function overlapsPlayer(state: EkoRunState, contract: HazardContract, x: number, config: EkoRunConfig): boolean {
  const playerMinX = state.player.position.x - config.playerHalfWidth;
  const playerMaxX = state.player.position.x + config.playerHalfWidth;
  const hazardMinX = x - contract.width * 0.5;
  const hazardMaxX = x + contract.width * 0.5;
  if (playerMaxX < hazardMinX || playerMinX > hazardMaxX) return false;
  const playerHeight = state.player.movementState === "sliding" ? config.playerSlideHeight : config.playerStandingHeight;
  const playerMinY = state.player.position.y;
  const playerMaxY = playerMinY + playerHeight;
  const hazardMinY = contract.y;
  const hazardMaxY = contract.y + contract.height;
  return playerMaxY > hazardMinY + config.collisionSkin && playerMinY < hazardMaxY - config.collisionSkin;
}

function passedHazard(state: EkoRunState, contract: HazardContract, x: number): boolean {
  const margin = contract.width + 0.5;
  return state.player.facing > 0 ? state.player.position.x > x + margin : state.player.position.x < x - margin;
}

export interface HazardSignal {
  type: "hazard.warned" | "hazard.hit" | "hazard.resolved";
  data: Record<string, unknown>;
}

export interface HazardStepResult {
  signals: HazardSignal[];
  failedReason: string | null;
}

function applyConsequence(state: EkoRunState, contract: HazardContract, config: EkoRunConfig): string | null {
  if (contract.consequence === "fail") {
    state.lifecycle = "failed";
    state.player.movementState = "dead";
    state.player.velocity = { x: 0, y: 0 };
    return `hazard:${contract.family}`;
  }
  if (contract.consequence === "stumble") {
    state.player.movementState = "stumbling";
    state.player.stumbleTicksRemaining = Math.max(state.player.stumbleTicksRemaining, config.stumbleDurationTicks);
    state.player.velocity.x *= 0.35;
    return null;
  }
  state.player.velocity.x *= 0.35;
  return null;
}

export function stepHazards(state: EkoRunState, config: EkoRunConfig): HazardStepResult {
  if (!state.hazards || state.lifecycle !== "running") return { signals: [], failedReason: null };
  const contracts = getPhase5HazardContracts(state.rootSeed);
  const byId = new Map(contracts.map(contract => [contract.id, contract]));
  const signals: HazardSignal[] = [];
  let failedReason: string | null = null;

  for (const encounter of state.hazards.encounters) {
    if (encounter.phase === "resolved" || encounter.phase === "hit") continue;
    const contract = byId.get(encounter.id);
    if (!contract) continue;
    const x = hazardPositionAtTick(contract, state.tick);

    if (encounter.phase === "unseen" && inWarningZone(state, contract, x)) {
      encounter.phase = "warned";
      encounter.warningTick = state.tick;
      signals.push({ type: "hazard.warned", data: { hazardId: contract.id, family: contract.family, minResponseTicks: contract.minResponseTicks } });
    }

    if (hazardActiveAtTick(contract, state.tick) && encounter.phase === "warned" && overlapsPlayer(state, contract, x, config)) {
      encounter.phase = "hit";
      encounter.resolvedTick = state.tick;
      signals.push({ type: "hazard.hit", data: { hazardId: contract.id, family: contract.family, consequence: contract.consequence } });
      failedReason = applyConsequence(state, contract, config);
      if (failedReason) break;
      continue;
    }

    if (passedHazard(state, contract, x)) {
      encounter.phase = "resolved";
      encounter.resolvedTick = state.tick;
      signals.push({ type: "hazard.resolved", data: { hazardId: contract.id, family: contract.family } });
    }
  }

  return { signals, failedReason };
}
