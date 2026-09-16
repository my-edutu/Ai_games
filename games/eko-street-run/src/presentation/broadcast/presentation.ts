import type { EkoRunRenderSnapshot } from "../../state/types";
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
