import type { EkoRunRenderSnapshot, PublicHazardSnapshot } from "../../state/types";
import { createBroadcastFeedback } from "./feedback";
import { createBroadcastHud } from "./hud";
import {
  PHASE7_BROADCAST_VERSION,
  type BroadcastLayout,
  type BroadcastPresentation,
  type BroadcastPresentationOptions,
} from "./types";

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function integerNonNegative(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function invalidPublicSnapshot(): never {
  throw new Error("PHASE7_INVALID_PUBLIC_SNAPSHOT");
}

function validHazard(hazard: PublicHazardSnapshot): boolean {
  if (!hazard || typeof hazard.id !== "string" || hazard.id.length === 0) return false;
  if (!Number.isFinite(hazard.x) || !Number.isFinite(hazard.y) || !finitePositive(hazard.width) || !finitePositive(hazard.height)) return false;
  if (!Array.isArray(hazard.legalResponses)) return false;
  const actionable = hazard.phase === "warned" || hazard.phase === "hit" || hazard.active;
  if (actionable && hazard.legalResponses.length === 0) return false;
  if (actionable && (typeof hazard.captionKey !== "string" || hazard.captionKey.length === 0 || typeof hazard.visualToken !== "string" || hazard.visualToken.length === 0)) return false;
  return true;
}

function validatePublicSnapshot(snapshot: Readonly<EkoRunRenderSnapshot>): void {
  if (!snapshot || typeof snapshot.runId !== "string" || snapshot.runId.length === 0) invalidPublicSnapshot();
  if (!integerNonNegative(snapshot.tick) || !finiteNonNegative(snapshot.progress)) invalidPublicSnapshot();
  if (!Number.isFinite(snapshot.player.position.x) || !Number.isFinite(snapshot.player.position.y) || !Number.isFinite(snapshot.player.velocity.x) || !Number.isFinite(snapshot.player.velocity.y)) invalidPublicSnapshot();
  if (!integerNonNegative(snapshot.player.checkpointIndex)) invalidPublicSnapshot();
  if (!finiteNonNegative(snapshot.route.finishX - snapshot.route.minX) || !Array.isArray(snapshot.route.checkpointXs) || snapshot.route.checkpointXs.some(value => !Number.isFinite(value))) invalidPublicSnapshot();

  const progression = snapshot.progression;
  const resources = snapshot.resources;
  const record = snapshot.record;
  if (!progression || !resources || !record) invalidPublicSnapshot();

  if (!integerNonNegative(progression.districtIndex) || !integerNonNegative(progression.cycle) || !integerNonNegative(progression.districtCompletions) || !finiteNonNegative(progression.totalDistance)) invalidPublicSnapshot();
  if (progression.nextMilestoneX !== null && !Number.isFinite(progression.nextMilestoneX)) invalidPublicSnapshot();
  if (!integerNonNegative(resources.ekoTokens) || !integerNonNegative(resources.earnedTokenTotal) || resources.earnedTokenTotal < resources.ekoTokens) invalidPublicSnapshot();
  if (!finiteNonNegative(record.maxProgress)) invalidPublicSnapshot();
  if (!Array.isArray(snapshot.hazards) || snapshot.hazards.some(hazard => !validHazard(hazard))) invalidPublicSnapshot();
  if (!Array.isArray(snapshot.recentEvents)) invalidPublicSnapshot();
}

function validateOptions(options: BroadcastPresentationOptions): void {
  const { viewport, quality, accessibility, presentationHz } = options;
  if (!finitePositive(viewport.width) || !finitePositive(viewport.height) || !finitePositive(viewport.devicePixelRatio)) {
    throw new Error("PHASE7_INVALID_VIEWPORT");
  }
  for (const value of Object.values(viewport.safeArea)) {
    if (!Number.isFinite(value) || value < 0) throw new Error("PHASE7_INVALID_SAFE_AREA");
  }
  const safeWidth = viewport.width - viewport.safeArea.left - viewport.safeArea.right;
  const safeHeight = viewport.height - viewport.safeArea.top - viewport.safeArea.bottom;
  if (safeWidth <= 0 || safeHeight <= 0 || safeWidth / viewport.width < 0.5 || safeHeight / viewport.height < 0.5) {
    throw new Error("PHASE7_INVALID_SAFE_AREA");
  }
  if (quality !== "low" && quality !== "medium" && quality !== "high") throw new Error("PHASE7_INVALID_QUALITY");
  if (typeof accessibility.muted !== "boolean" || typeof accessibility.reducedMotion !== "boolean" || typeof accessibility.reducedFlash !== "boolean") {
    throw new Error("PHASE7_INVALID_ACCESSIBILITY");
  }
  if (presentationHz !== undefined && presentationHz !== 30 && presentationHz !== 60 && presentationHz !== 120) {
    throw new Error("PHASE7_INVALID_PRESENTATION_HZ");
  }
}

function createLayout(options: BroadcastPresentationOptions): BroadcastLayout {
  const viewport = options.viewport;
  return {
    mode: viewport.height > viewport.width ? "portrait" : "landscape",
    viewport: {
      width: viewport.width,
      height: viewport.height,
      devicePixelRatio: viewport.devicePixelRatio,
      safeArea: { ...viewport.safeArea },
    },
    safeFrame: {
      x: viewport.safeArea.left,
      y: viewport.safeArea.top,
      width: viewport.width - viewport.safeArea.left - viewport.safeArea.right,
      height: viewport.height - viewport.safeArea.top - viewport.safeArea.bottom,
    },
    maxPersistentSecondaryCards: viewport.height > viewport.width ? 2 : 4,
  };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function createBroadcastPresentation(
  snapshot: Readonly<EkoRunRenderSnapshot>,
  options: BroadcastPresentationOptions,
): Readonly<BroadcastPresentation> {
  validatePublicSnapshot(snapshot);
  validateOptions(options);
  const hud = createBroadcastHud(snapshot);
  const media = createBroadcastFeedback(snapshot, hud.danger, options.quality, options.accessibility);
  const hasDanger = hud.danger.visible;
  const presentation: BroadcastPresentation = {
    version: PHASE7_BROADCAST_VERSION,
    runId: snapshot.runId,
    tick: snapshot.tick,
    presentationHz: options.presentationHz ?? 60,
    quality: options.quality,
    accessibility: { ...options.accessibility },
    layout: createLayout(options),
    hud,
    feedback: media.feedback,
    captions: media.captions,
    audio: media.audio,
    vfx: media.vfx,
    comprehension: {
      progressVisible: true,
      districtVisible: true,
      immediateDangerVisibleWhenPresent: !hasDanger || hud.danger.visible,
      recordVisible: true,
      tokenStateVisible: true,
      pass: true,
    },
  };
  return deepFreeze(presentation);
}
