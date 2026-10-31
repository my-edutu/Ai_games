import { getPhase5HazardContracts } from "../hazards";
import type {
  DifficultyProfile,
  DistrictId,
  GeneratedDistrictContent,
  GeneratedToken,
  GenerationValidation,
  HazardContract,
  MilestoneSpec,
  RouteDecision,
  RouteState,
} from "../state/types";

export const PHASE6_GENERATOR_VERSION = 1;
export const PHASE6_MAX_REPAIR_ATTEMPTS = 3;
export const PHASE6_DISTRICT_IDS: DistrictId[] = [
  "mainland-morning",
  "market-rush",
  "danfo-junction",
  "rainy-lagos",
  "island-night",
  "bridge-run",
];

interface DistrictGrammar {
  baseLength: number;
  hazardCount: number;
  tokenCount: number;
  baseDifficulty: DifficultyProfile;
}

const GRAMMARS: Record<DistrictId, DistrictGrammar> = {
  "mainland-morning": { baseLength: 104, hazardCount: 5, tokenCount: 4, baseDifficulty: { speedPressure: 0.25, routeConstraint: 0.2, verticalPrecision: 0.2, vehicleTiming: 0.35, hazardConcurrency: 0.2, informationPressure: 0.15, recoveryCost: 0.2, optionalRisk: 0.25 } },
  "market-rush": { baseLength: 112, hazardCount: 6, tokenCount: 5, baseDifficulty: { speedPressure: 0.3, routeConstraint: 0.45, verticalPrecision: 0.25, vehicleTiming: 0.3, hazardConcurrency: 0.45, informationPressure: 0.5, recoveryCost: 0.25, optionalRisk: 0.45 } },
  "danfo-junction": { baseLength: 120, hazardCount: 6, tokenCount: 5, baseDifficulty: { speedPressure: 0.45, routeConstraint: 0.35, verticalPrecision: 0.3, vehicleTiming: 0.7, hazardConcurrency: 0.5, informationPressure: 0.45, recoveryCost: 0.35, optionalRisk: 0.5 } },
  "rainy-lagos": { baseLength: 124, hazardCount: 6, tokenCount: 5, baseDifficulty: { speedPressure: 0.4, routeConstraint: 0.4, verticalPrecision: 0.45, vehicleTiming: 0.5, hazardConcurrency: 0.5, informationPressure: 0.75, recoveryCost: 0.45, optionalRisk: 0.55 } },
  "island-night": { baseLength: 132, hazardCount: 7, tokenCount: 6, baseDifficulty: { speedPressure: 0.65, routeConstraint: 0.45, verticalPrecision: 0.5, vehicleTiming: 0.6, hazardConcurrency: 0.6, informationPressure: 0.65, recoveryCost: 0.5, optionalRisk: 0.7 } },
  "bridge-run": { baseLength: 140, hazardCount: 7, tokenCount: 6, baseDifficulty: { speedPressure: 0.75, routeConstraint: 0.55, verticalPrecision: 0.55, vehicleTiming: 0.75, hazardConcurrency: 0.7, informationPressure: 0.6, recoveryCost: 0.65, optionalRisk: 0.8 } },
};

function hash32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function unit(seed: string, layer: string, slot: number): number {
  return hash32(`phase6-v${PHASE6_GENERATOR_VERSION}|${layer}|${seed}|${slot}`) / 0xffffffff;
}

function round(value: number): number { return Math.round(value * 1000) / 1000; }
function clamp01(value: number): number { return Math.max(0, Math.min(1, round(value))); }

function districtIdAt(index: number): DistrictId {
  if (!Number.isInteger(index) || index < 0 || index >= PHASE6_DISTRICT_IDS.length) throw new Error("district index must be between 0 and 5");
  return PHASE6_DISTRICT_IDS[index];
}

function difficultyFor(seedKey: string, grammar: DistrictGrammar, cycle: number): DifficultyProfile {
  const cyclePressure = Math.min(0.12, cycle * 0.015);
  const keys: Array<keyof DifficultyProfile> = ["speedPressure", "routeConstraint", "verticalPrecision", "vehicleTiming", "hazardConcurrency", "informationPressure", "recoveryCost", "optionalRisk"];
  const result = {} as DifficultyProfile;
  keys.forEach((key, index) => {
    const jitter = (unit(seedKey, "difficulty", index) - 0.5) * 0.08;
    result[key] = clamp01(grammar.baseDifficulty[key] + cyclePressure + jitter);
  });
  return result;
}

function routeFor(seedKey: string, districtId: DistrictId, grammar: DistrictGrammar): RouteState {
  const lengthJitter = Math.floor(unit(seedKey, "backbone", 0) * 13);
  const finishX = grammar.baseLength + lengthJitter;
  const maxX = finishX + 6;
  const checkpointXs = [0.25, 0.5, 0.75].map((fraction, slot) => round(finishX * fraction + (unit(seedKey, "backbone-checkpoint", slot) - 0.5) * 2));
  return {
    id: `phase6-${districtId}-${hash32(seedKey).toString(16).padStart(8, "0")}`,
    contentVersion: `phase6-grammar-${PHASE6_GENERATOR_VERSION}`,
    groundY: 0,
    startX: 0,
    minX: -2,
    maxX,
    checkpointXs,
    finishX,
    killPlaneY: -6,
    groundSegments: [{ id: `${districtId}-backbone`, minX: -2, maxX, y: 0 }],
    slopes: [],
    colliders: [],
  };
}

function cycleHazardBonus(cycle: number): number {
  return Math.min(2, Math.floor(cycle / 4));
}

function hazardsFor(seedKey: string, districtId: DistrictId, grammar: DistrictGrammar, route: RouteState, cycle: number): HazardContract[] {
  const templates = getPhase5HazardContracts(`${seedKey}|hazard-template`);
  const hazardCount = grammar.hazardCount + cycleHazardBonus(cycle);
  const usableStart = 14;
  const usableEnd = route.finishX - 10;
  const step = (usableEnd - usableStart) / Math.max(1, hazardCount - 1);
  const rotation = hash32(`${seedKey}|hazards|rotation`) % templates.length;
  const hazards: HazardContract[] = [];
  for (let index = 0; index < hazardCount; index += 1) {
    const template = templates[(rotation + index * 2) % templates.length];
    const jitter = (unit(seedKey, "hazards", index) - 0.5) * Math.min(2.4, step * 0.2);
    const baseX = round(usableStart + step * index + jitter);
    const period = template.motion?.periodTicks ?? 360;
    hazards.push({
      ...template,
      id: `phase6-${districtId}-hazard-${index}`,
      baseX,
      legalResponses: [...template.legalResponses],
      motion: template.motion ? { ...template.motion } : undefined,
      phaseOffsetTicks: hash32(`${seedKey}|hazards|phase|${index}`) % period,
    });
  }
  return hazards;
}

function tokensFor(seedKey: string, districtId: DistrictId, grammar: DistrictGrammar, route: RouteState): GeneratedToken[] {
  const tokens: GeneratedToken[] = [];
  for (let index = 0; index < grammar.tokenCount; index += 1) {
    const fraction = (index + 1) / (grammar.tokenCount + 1);
    const jitter = (unit(seedKey, "rewards", index) - 0.5) * 3;
    tokens.push({ id: `phase6-${districtId}-token-${index}-${hash32(seedKey).toString(16)}`, x: round(Math.max(4, Math.min(route.finishX - 4, route.finishX * fraction + jitter))), value: 1 });
  }
  return tokens;
}

function decisionsFor(seedKey: string, districtId: DistrictId, route: RouteState, cycle: number): RouteDecision[] {
  const risks: RouteDecision["risk"][] = ["safe", "balanced", "bold"];
  const minimumRiskIndex = cycle >= 8 ? 2 : cycle >= 4 ? 1 : 0;
  return [0.42, 0.7].map((fraction, index) => {
    const baseRiskIndex = hash32(`${seedKey}|decisions|${index}`) % 2;
    const risk = risks[Math.max(baseRiskIndex, minimumRiskIndex)];
    return {
      id: `phase6-${districtId}-decision-${index}`,
      x: round(route.finishX * fraction),
      risk,
      rewardTokens: risk === "bold" ? 2 : risk === "balanced" ? 1 : 0,
    };
  });
}

function milestonesFor(districtId: DistrictId, route: RouteState): MilestoneSpec[] {
  const bands: MilestoneSpec["band"][] = ["calm", "anticipation", "crisis", "recovery"];
  return [0.1, 0.35, 0.65, 0.9].map((fraction, index) => ({ id: `phase6-${districtId}-milestone-${bands[index]}`, x: round(route.finishX * fraction), band: bands[index] }));
}

export function validateGeneratedDistrict(content: GeneratedDistrictContent): GenerationValidation {
  const codes: string[] = [];
  const { route } = content;
  if (content.generatorVersion !== PHASE6_GENERATOR_VERSION) codes.push("GENERATOR_VERSION");
  if (!Number.isInteger(content.districtIndex) || PHASE6_DISTRICT_IDS[content.districtIndex] !== content.districtId) codes.push("DISTRICT_PROVENANCE");
  if (!Number.isInteger(content.cycle) || content.cycle < 0 || content.cycle > 1_000_000) codes.push("CYCLE_PROVENANCE");
  if (!(route.startX >= route.minX && route.finishX > route.startX && route.finishX <= route.maxX)) codes.push("ROUTE_BOUNDS");
  if (!route.groundSegments.some(segment => segment.minX <= route.startX && segment.maxX >= route.finishX && Math.abs(segment.y - route.groundY) <= 1e-9)) codes.push("BACKBONE_DISCONNECTED");
  if (route.checkpointXs.length < 2 || route.checkpointXs.some((x, index) => x <= route.startX || x >= route.finishX || (index > 0 && x <= route.checkpointXs[index - 1]))) codes.push("CHECKPOINT_ORDER");
  if (content.hazards.some(hazard => hazard.baseX <= route.startX || hazard.baseX >= route.finishX || hazard.warningDistance <= 0 || hazard.minResponseTicks <= 0)) codes.push("HAZARD_BOUNDS");
  const sortedHazards = [...content.hazards].sort((a, b) => a.baseX - b.baseX);
  for (let index = 1; index < sortedHazards.length; index += 1) if (sortedHazards[index].baseX - sortedHazards[index - 1].baseX < 8) codes.push("HAZARD_SPACING");
  if (content.tokens.some(token => token.x <= route.startX || token.x >= route.finishX || !Number.isInteger(token.value) || token.value < 1)) codes.push("TOKEN_BOUNDS");
  if (content.decisions.some(decision => decision.x <= route.startX || decision.x >= route.finishX)) codes.push("DECISION_BOUNDS");
  if (content.milestones.length !== 4 || content.milestones.some((milestone, index) => index > 0 && milestone.x <= content.milestones[index - 1].x)) codes.push("PACING_ORDER");
  return { valid: codes.length === 0, repairCount: content.validation?.repairCount ?? 0, fallbackUsed: content.validation?.fallbackUsed ?? false, codes };
}

export function fingerprintGeneratedDistrict(content: Pick<GeneratedDistrictContent,
  "generatorVersion" | "districtIndex" | "districtId" | "cycle" | "route" | "hazards" | "tokens" | "decisions" | "milestones" | "difficulty"
>): string {
  const text = JSON.stringify({
    generatorVersion: content.generatorVersion,
    districtIndex: content.districtIndex,
    districtId: content.districtId,
    cycle: content.cycle,
    route: { id: content.route.id, finishX: content.route.finishX, checkpointXs: content.route.checkpointXs },
    hazards: content.hazards.map(hazard => [hazard.family, hazard.baseX, hazard.phaseOffsetTicks]),
    tokens: content.tokens.map(token => [token.x, token.value]),
    decisions: content.decisions.map(decision => [decision.x, decision.risk, decision.rewardTokens]),
    milestones: content.milestones.map(milestone => [milestone.x, milestone.band]),
    difficulty: content.difficulty,
  });
  return hash32(text).toString(16).padStart(8, "0");
}

function knownGoodFallback(seedKey: string, districtId: DistrictId, districtIndex: number, grammar: DistrictGrammar, cycle: number, repairCount: number): GeneratedDistrictContent {
  const route = routeFor(`${seedKey}|fallback`, districtId, grammar);
  const fallbackGrammar = { ...grammar, hazardCount: Math.min(4, grammar.hazardCount) };
  const base = {
    generatorVersion: PHASE6_GENERATOR_VERSION,
    districtIndex,
    districtId,
    cycle,
    route,
    hazards: hazardsFor(`${seedKey}|fallback`, districtId, fallbackGrammar, route, 0),
    tokens: tokensFor(`${seedKey}|fallback`, districtId, { ...grammar, tokenCount: Math.min(4, grammar.tokenCount) }, route),
    decisions: decisionsFor(`${seedKey}|fallback`, districtId, route, cycle),
    milestones: milestonesFor(districtId, route),
    difficulty: difficultyFor(`${seedKey}|fallback`, grammar, cycle),
  };
  const content: GeneratedDistrictContent = { ...base, fingerprint: fingerprintGeneratedDistrict(base), validation: { valid: true, repairCount, fallbackUsed: true, codes: [] } };
  const report = validateGeneratedDistrict(content);
  return { ...content, validation: { ...report, repairCount, fallbackUsed: true } };
}

export function repairGeneratedDistrict(input: GeneratedDistrictContent): GeneratedDistrictContent {
  let content: GeneratedDistrictContent = JSON.parse(JSON.stringify(input)) as GeneratedDistrictContent;
  for (let attempt = 1; attempt <= PHASE6_MAX_REPAIR_ATTEMPTS; attempt += 1) {
    const route = content.route;
    route.checkpointXs = route.checkpointXs.filter(x => x > route.startX && x < route.finishX).sort((a, b) => a - b);
    if (route.checkpointXs.length < 2) route.checkpointXs = [round(route.finishX * 0.33), round(route.finishX * 0.66)];
    if (!route.groundSegments.some(segment => segment.minX <= route.startX && segment.maxX >= route.finishX)) route.groundSegments = [{ id: `${content.districtId}-repaired-backbone`, minX: route.minX, maxX: route.maxX, y: route.groundY }];
    content.hazards = content.hazards.filter(hazard => hazard.baseX > route.startX + 4 && hazard.baseX < route.finishX - 4).sort((a, b) => a.baseX - b.baseX);
    const spaced: HazardContract[] = [];
    for (const hazard of content.hazards) if (!spaced.length || hazard.baseX - spaced[spaced.length - 1].baseX >= 8) spaced.push(hazard);
    content.hazards = spaced;
    content.tokens = content.tokens.filter(token => token.x > route.startX && token.x < route.finishX);
    content.decisions = content.decisions.filter(decision => decision.x > route.startX && decision.x < route.finishX);
    content.milestones = milestonesFor(content.districtId, route);
    content.validation = { valid: false, repairCount: attempt, fallbackUsed: false, codes: [] };
    content.fingerprint = fingerprintGeneratedDistrict(content);
    const report = validateGeneratedDistrict(content);
    if (report.valid) return { ...content, validation: { ...report, repairCount: attempt, fallbackUsed: false } };
  }
  const districtIndex = PHASE6_DISTRICT_IDS.indexOf(content.districtId);
  return knownGoodFallback(`repair-${content.fingerprint}-${districtIndex}`, content.districtId, districtIndex, GRAMMARS[content.districtId], content.cycle, PHASE6_MAX_REPAIR_ATTEMPTS);
}

export function generateDistrict(rootSeed: string, districtIndex: number, cycle: number): GeneratedDistrictContent {
  if (typeof rootSeed !== "string" || rootSeed.length < 1 || rootSeed.length > 128) throw new Error("root seed must contain between 1 and 128 characters");
  if (!Number.isInteger(cycle) || cycle < 0 || cycle > 1_000_000) throw new Error("cycle must be a bounded non-negative integer");
  const districtId = districtIdAt(districtIndex);
  const grammar = GRAMMARS[districtId];
  const seedKey = `${rootSeed}|${districtId}|cycle:${cycle}`;
  const route = routeFor(seedKey, districtId, grammar);
  const base = {
    generatorVersion: PHASE6_GENERATOR_VERSION,
    districtIndex,
    districtId,
    cycle,
    route,
    hazards: hazardsFor(seedKey, districtId, grammar, route, cycle),
    tokens: tokensFor(seedKey, districtId, grammar, route),
    decisions: decisionsFor(seedKey, districtId, route, cycle),
    milestones: milestonesFor(districtId, route),
    difficulty: difficultyFor(seedKey, grammar, cycle),
  };
  const content: GeneratedDistrictContent = { ...base, fingerprint: fingerprintGeneratedDistrict(base), validation: { valid: false, repairCount: 0, fallbackUsed: false, codes: [] } };
  const report = validateGeneratedDistrict(content);
  if (report.valid) return { ...content, validation: report };
  return repairGeneratedDistrict({ ...content, validation: report });
}
