import type { DistrictId, EkoRunLifecycle, HazardFamily, HazardResponse } from "../../state/types";
import type { PresentationQuality, SafeAreaInsets } from "../world/types";

export const PHASE7_BROADCAST_VERSION = 1 as const;
export const PHASE7_MAX_FEEDBACK_CUES = 12 as const;
export const PHASE7_MAX_AUDIO_VOICES = 8 as const;

export const PHASE7_AUDIO_BUSES = [
  "master",
  "music",
  "ambience",
  "movement-foley",
  "danger-vehicle",
  "gameplay-impacts",
  "ui",
  "audience-acknowledgement",
  "system-emergency",
] as const;

export type AudioBus = typeof PHASE7_AUDIO_BUSES[number];
export type BroadcastPriority = "critical" | "important" | "ambient";
export type BroadcastLayoutMode = "portrait" | "landscape";

export interface BroadcastViewport {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
  readonly safeArea: SafeAreaInsets;
}

export interface BroadcastAccessibilityOptions {
  readonly muted: boolean;
  readonly reducedMotion: boolean;
  readonly reducedFlash: boolean;
}

export interface BroadcastPresentationOptions {
  readonly viewport: BroadcastViewport;
  readonly quality: PresentationQuality;
  readonly accessibility: BroadcastAccessibilityOptions;
  readonly presentationHz?: 30 | 60 | 120;
}

export interface BroadcastLayout {
  readonly mode: BroadcastLayoutMode;
  readonly viewport: BroadcastViewport;
  readonly safeFrame: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly maxPersistentSecondaryCards: number;
}

export interface BroadcastHudPrimary {
  readonly districtId: DistrictId;
  readonly cycle: number;
  readonly progress: number;
  readonly totalDistance: number;
  readonly checkpointIndex: number;
  readonly checkpointCount: number;
  readonly nextCheckpointX: number | null;
  readonly pacingBand: "calm" | "anticipation" | "crisis" | "recovery";
}

export interface BroadcastHudDanger {
  readonly visible: boolean;
  readonly hazardId: string | null;
  readonly family: HazardFamily | null;
  readonly distance: number | null;
  readonly legalResponses: readonly HazardResponse[];
  readonly captionKey: string | null;
  readonly visualToken: string | null;
}

export interface BroadcastHudRecord {
  readonly maxProgress: number;
  readonly deltaToRecord: number;
  readonly status: "ahead" | "tied" | "behind";
}

export interface BroadcastHudResources {
  readonly ekoTokens: number;
  readonly earnedTokenTotal: number;
}

export interface FuturePresentationSlot {
  readonly status: "not-enabled";
  readonly label: string;
}

export interface BroadcastHud {
  readonly primary: BroadcastHudPrimary;
  readonly danger: BroadcastHudDanger;
  readonly record: BroadcastHudRecord;
  readonly resources: BroadcastHudResources;
  readonly lifecycle: EkoRunLifecycle;
  readonly future: {
    readonly aiIntent: FuturePresentationSlot;
    readonly viewerWindow: FuturePresentationSlot;
  };
}

export interface BroadcastFeedbackCue {
  readonly id: string;
  readonly semanticKey: string;
  readonly tick: number;
  readonly priority: BroadcastPriority;
  readonly captionKey: string;
  readonly visualToken: string;
  readonly audioToken: string | null;
  readonly audioBus: AudioBus | null;
  readonly cameraImpulse: number;
  readonly flashIntensity: number;
  readonly motionScale: number;
}

export interface BroadcastCaption {
  readonly id: string;
  readonly captionKey: string;
  readonly priority: BroadcastPriority;
}

export interface BroadcastAudioVoice {
  readonly id: string;
  readonly token: string;
  readonly bus: AudioBus;
  readonly priority: BroadcastPriority;
}

export interface BroadcastAudioModel {
  readonly buses: readonly AudioBus[];
  readonly voices: readonly BroadcastAudioVoice[];
}

export interface BroadcastVfxModel {
  readonly maxCameraImpulse: number;
  readonly maxFlashIntensity: number;
  readonly motionScale: number;
  readonly maxConcurrentCameraImpulses: 1;
}

export interface BroadcastComprehension {
  readonly progressVisible: boolean;
  readonly districtVisible: boolean;
  readonly immediateDangerVisibleWhenPresent: boolean;
  readonly recordVisible: boolean;
  readonly tokenStateVisible: boolean;
  readonly pass: boolean;
}

export interface BroadcastPresentation {
  readonly version: typeof PHASE7_BROADCAST_VERSION;
  readonly runId: string;
  readonly tick: number;
  readonly presentationHz: 30 | 60 | 120;
  readonly quality: PresentationQuality;
  readonly accessibility: BroadcastAccessibilityOptions;
  readonly layout: BroadcastLayout;
  readonly hud: BroadcastHud;
  readonly feedback: readonly BroadcastFeedbackCue[];
  readonly captions: readonly BroadcastCaption[];
  readonly audio: BroadcastAudioModel;
  readonly vfx: BroadcastVfxModel;
  readonly comprehension: BroadcastComprehension;
}
