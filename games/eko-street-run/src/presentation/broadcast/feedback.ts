import type { EkoRunRenderSnapshot, SemanticEvent, SemanticEventType } from "../../state/types";
import type {
  AudioBus,
  BroadcastAccessibilityOptions,
  BroadcastAudioModel,
  BroadcastCaption,
  BroadcastFeedbackCue,
  BroadcastPriority,
  BroadcastVfxModel,
  BroadcastHudDanger,
} from "./types";
import { PHASE7_AUDIO_BUSES, PHASE7_MAX_AUDIO_VOICES, PHASE7_MAX_FEEDBACK_CUES } from "./types";
import type { PresentationQuality } from "../world/types";

const EVENT_FRESHNESS_TICKS = 12;

interface CueTemplate {
  priority: BroadcastPriority;
  captionKey: string;
  visualToken: string;
  audioToken: string | null;
  audioBus: AudioBus | null;
  cameraImpulse: number;
  flashIntensity: number;
  motionScale: number;
}

function templateFor(type: SemanticEventType): CueTemplate {
  switch (type) {
    case "integrity.failure": return { priority: "critical", captionKey: "system.integrity", visualToken: "system-integrity", audioToken: "system-integrity", audioBus: "system-emergency", cameraImpulse: 0, flashIntensity: 0.12, motionScale: 0 };
    case "run.failed": return { priority: "critical", captionKey: "run.failed", visualToken: "run-failed", audioToken: "run-failed", audioBus: "gameplay-impacts", cameraImpulse: 0.18, flashIntensity: 0.18, motionScale: 0.5 };
    case "run.completed": return { priority: "critical", captionKey: "run.completed", visualToken: "run-completed", audioToken: "run-completed", audioBus: "ui", cameraImpulse: 0.08, flashIntensity: 0.12, motionScale: 0.7 };
    case "hazard.warned": return { priority: "critical", captionKey: "hazard.warning", visualToken: "hazard-warning", audioToken: "hazard-warning", audioBus: "danger-vehicle", cameraImpulse: 0.04, flashIntensity: 0.05, motionScale: 0.5 };
    case "hazard.hit": return { priority: "critical", captionKey: "hazard.hit", visualToken: "hazard-hit", audioToken: "hazard-hit", audioBus: "gameplay-impacts", cameraImpulse: 0.22, flashIntensity: 0.18, motionScale: 0.8 };
    case "district.completed": return { priority: "important", captionKey: "district.completed", visualToken: "district-complete", audioToken: "district-complete", audioBus: "ui", cameraImpulse: 0.05, flashIntensity: 0.08, motionScale: 0.7 };
    case "district.started": return { priority: "important", captionKey: "district.started", visualToken: "district-start", audioToken: "district-start", audioBus: "music", cameraImpulse: 0, flashIntensity: 0, motionScale: 0.5 };
    case "checkpoint.reached": return { priority: "important", captionKey: "checkpoint.reached", visualToken: "checkpoint", audioToken: "checkpoint", audioBus: "ui", cameraImpulse: 0.03, flashIntensity: 0.05, motionScale: 0.5 };
    case "token.collected": return { priority: "important", captionKey: "token.collected", visualToken: "token-collect", audioToken: "token-collect", audioBus: "ui", cameraImpulse: 0, flashIntensity: 0.03, motionScale: 0.5 };
    case "reward.unlocked": return { priority: "important", captionKey: "reward.unlocked", visualToken: "reward-unlock", audioToken: "reward-unlock", audioBus: "ui", cameraImpulse: 0.02, flashIntensity: 0.06, motionScale: 0.6 };
    case "player.jumped": return { priority: "important", captionKey: "player.jumped", visualToken: "jump", audioToken: "jump", audioBus: "movement-foley", cameraImpulse: 0, flashIntensity: 0, motionScale: 0.4 };
    case "player.landed": return { priority: "important", captionKey: "player.landed", visualToken: "landing", audioToken: "landing", audioBus: "movement-foley", cameraImpulse: 0.03, flashIntensity: 0, motionScale: 0.5 };
    case "player.stumbled": return { priority: "important", captionKey: "player.stumbled", visualToken: "stumble", audioToken: "stumble", audioBus: "gameplay-impacts", cameraImpulse: 0.08, flashIntensity: 0.04, motionScale: 0.6 };
    case "player.slid": return { priority: "important", captionKey: "player.slid", visualToken: "slide", audioToken: "slide", audioBus: "movement-foley", cameraImpulse: 0, flashIntensity: 0, motionScale: 0.4 };
    case "player.vaulted": return { priority: "important", captionKey: "player.vaulted", visualToken: "vault", audioToken: "vault", audioBus: "movement-foley", cameraImpulse: 0.01, flashIntensity: 0, motionScale: 0.5 };
    case "run.restarted": return { priority: "important", captionKey: "run.restarted", visualToken: "restart", audioToken: "restart", audioBus: "ui", cameraImpulse: 0, flashIntensity: 0, motionScale: 0.3 };
    case "hazard.resolved": return { priority: "important", captionKey: "hazard.resolved", visualToken: "hazard-resolved", audioToken: "hazard-resolved", audioBus: "gameplay-impacts", cameraImpulse: 0, flashIntensity: 0, motionScale: 0.3 };
    case "pacing.changed": return { priority: "ambient", captionKey: "pacing.changed", visualToken: "pacing", audioToken: null, audioBus: null, cameraImpulse: 0, flashIntensity: 0, motionScale: 0.2 };
    case "run.started": return { priority: "important", captionKey: "run.started", visualToken: "run-start", audioToken: "run-start", audioBus: "music", cameraImpulse: 0, flashIntensity: 0, motionScale: 0.4 };
    case "command.rejected": return { priority: "ambient", captionKey: "command.rejected", visualToken: "none", audioToken: null, audioBus: null, cameraImpulse: 0, flashIntensity: 0, motionScale: 0 };
  }
}

function priorityRank(priority: BroadcastPriority): number {
  return priority === "critical" ? 0 : priority === "important" ? 1 : 2;
}

function eventCandidates(snapshot: Readonly<EkoRunRenderSnapshot>): BroadcastFeedbackCue[] {
  const unique = new Map<string, SemanticEvent>();
  for (const event of snapshot.recentEvents) {
    if (event.tick > snapshot.tick || snapshot.tick - event.tick > EVENT_FRESHNESS_TICKS) continue;
    const key = `${event.sequence}:${event.type}`;
    if (!unique.has(key)) unique.set(key, event);
  }
  return [...unique.values()].map(event => {
    const template = templateFor(event.type);
    return { id: `event:${event.sequence}:${event.type}`, semanticKey: event.type, tick: event.tick, ...template };
  });
}

function dangerCue(snapshot: Readonly<EkoRunRenderSnapshot>, danger: BroadcastHudDanger): BroadcastFeedbackCue | null {
  if (!danger.visible || !danger.hazardId || !danger.captionKey || !danger.visualToken) return null;
  return {
    id: `danger:${danger.hazardId}`,
    semanticKey: `danger:${danger.family ?? "hazard"}`,
    tick: snapshot.tick,
    priority: "critical",
    captionKey: danger.captionKey,
    visualToken: danger.visualToken,
    audioToken: "danger-immediate",
    audioBus: "danger-vehicle",
    cameraImpulse: 0.03,
    flashIntensity: 0.04,
    motionScale: 0.4,
  };
}

function ambientCue(snapshot: Readonly<EkoRunRenderSnapshot>, quality: PresentationQuality): BroadcastFeedbackCue | null {
  if (quality === "low" || !snapshot.progression) return null;
  return {
    id: `ambient:${snapshot.progression.districtId}`,
    semanticKey: `ambience:${snapshot.progression.districtId}`,
    tick: snapshot.tick,
    priority: "ambient",
    captionKey: "",
    visualToken: "district-ambience",
    audioToken: `ambience-${snapshot.progression.districtId}`,
    audioBus: "ambience",
    cameraImpulse: 0,
    flashIntensity: 0,
    motionScale: quality === "high" ? 1 : 0.6,
  };
}

function applyAccessibility(cue: BroadcastFeedbackCue, accessibility: BroadcastAccessibilityOptions): BroadcastFeedbackCue {
  return {
    ...cue,
    audioToken: accessibility.muted ? null : cue.audioToken,
    audioBus: accessibility.muted ? null : cue.audioBus,
    cameraImpulse: accessibility.reducedMotion ? Math.min(cue.cameraImpulse, 0.04) : cue.cameraImpulse,
    flashIntensity: accessibility.reducedFlash ? Math.min(cue.flashIntensity, 0.02) : cue.flashIntensity,
    motionScale: accessibility.reducedMotion ? Math.min(cue.motionScale, 0.25) : cue.motionScale,
  };
}

export function createBroadcastFeedback(
  snapshot: Readonly<EkoRunRenderSnapshot>,
  danger: BroadcastHudDanger,
  quality: PresentationQuality,
  accessibility: BroadcastAccessibilityOptions,
): { feedback: BroadcastFeedbackCue[]; captions: BroadcastCaption[]; audio: BroadcastAudioModel; vfx: BroadcastVfxModel } {
  const candidates = eventCandidates(snapshot);
  const immediate = dangerCue(snapshot, danger);
  const ambient = ambientCue(snapshot, quality);
  if (immediate) candidates.push(immediate);
  if (ambient) candidates.push(ambient);

  candidates.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || b.tick - a.tick || a.id.localeCompare(b.id));
  const feedback = candidates.slice(0, PHASE7_MAX_FEEDBACK_CUES).map(cue => applyAccessibility(cue, accessibility));
  const captions = feedback
    .filter(cue => cue.captionKey.length > 0 && cue.priority !== "ambient")
    .map(cue => ({ id: `caption:${cue.id}`, captionKey: cue.captionKey, priority: cue.priority }));
  const voices = accessibility.muted ? [] : feedback
    .filter(cue => cue.audioToken !== null && cue.audioBus !== null)
    .slice(0, PHASE7_MAX_AUDIO_VOICES)
    .map(cue => ({ id: `voice:${cue.id}`, token: cue.audioToken as string, bus: cue.audioBus as AudioBus, priority: cue.priority }));

  return {
    feedback,
    captions,
    audio: { buses: [...PHASE7_AUDIO_BUSES], voices },
    vfx: {
      maxCameraImpulse: feedback.reduce((value, cue) => Math.max(value, cue.cameraImpulse), 0),
      maxFlashIntensity: feedback.reduce((value, cue) => Math.max(value, cue.flashIntensity), 0),
      motionScale: feedback.reduce((value, cue) => Math.max(value, cue.motionScale), 0),
      maxConcurrentCameraImpulses: 1,
    },
  };
}
