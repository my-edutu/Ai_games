export type PresentationQuality = "low" | "medium" | "high";

export interface SafeAreaInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface PresentationViewport {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  readonly safeArea: SafeAreaInsets;
}

export type IdentitySignalCategory =
  | "road-geometry"
  | "drainage"
  | "transport"
  | "commerce"
  | "architecture"
  | "pedestrian-motion"
  | "soundscape"
  | "street-furniture"
  | "wayfinding";

export interface MainlandIdentitySignal {
  readonly id: string;
  readonly category: IdentitySignalCategory;
  readonly description: string;
}

export type WorldNodeRole =
  | "player-anchor"
  | "safe-route"
  | "decision-preview"
  | "progress-marker"
  | "world"
  | "ambience";

export interface WorldNode {
  readonly id: string;
  readonly kind: string;
  readonly role: WorldNodeRole;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly critical: boolean;
  readonly ambient: boolean;
  readonly detailRank: number;
  readonly color: string;
}

export interface MainlandMorningDistrict {
  readonly id: "mainland-morning";
  readonly displayName: "Mainland Morning";
  readonly identitySignals: readonly MainlandIdentitySignal[];
  readonly worldNodes: readonly WorldNode[];
}

export interface QualityProfile {
  readonly tier: PresentationQuality;
  readonly ambientDensity: number;
  readonly distantAnimationScale: number;
  readonly secondaryShadowScale: number;
  readonly postProcessScale: number;
  readonly authoritativeTickRateHz: 60;
  readonly maxDetailRank: number;
}

export interface CameraPlan {
  readonly target: { readonly x: number; readonly y: number; readonly z: number };
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
  readonly lookAhead: number;
  readonly fov: number;
  readonly visibleWorld: { readonly minX: number; readonly maxX: number; readonly minY: number; readonly maxY: number };
  readonly safeFrame: SafeAreaInsets;
}

export interface PresentationCue {
  readonly id: string;
  readonly tick: number;
  readonly captionKey: string;
  readonly visualToken: string;
  readonly audioToken: string | null;
  readonly priority: "critical" | "important" | "ambient";
}

export interface MotionProfile {
  readonly maxCameraShake: number;
  readonly ambientMotionScale: number;
  readonly vehicleMotionScale: number;
}

export interface ComprehensionResult {
  readonly playerVisible: boolean;
  readonly safeRouteVisible: boolean;
  readonly decisionSpaceVisible: boolean;
  readonly progressVisible: boolean;
  readonly districtReadable: boolean;
  readonly pass: boolean;
}

export interface MainlandMorningPresentation {
  readonly version: 1;
  readonly districtId: "mainland-morning";
  readonly tick: number;
  readonly quality: QualityProfile;
  readonly camera: CameraPlan;
  readonly nodes: readonly WorldNode[];
  readonly cues: readonly PresentationCue[];
  readonly motion: MotionProfile;
  readonly visualHierarchy: readonly ["player", "safe-route", "decision-preview", "progress", "world", "ambience"];
  readonly comprehension: ComprehensionResult;
  readonly identityScore: number;
  readonly decorativeLoad: number;
}

export interface MainlandMorningPresentationOptions {
  readonly viewport: PresentationViewport;
  readonly quality: PresentationQuality;
  readonly muted: boolean;
  readonly reducedMotion: boolean;
  readonly presentationHz?: number;
}
