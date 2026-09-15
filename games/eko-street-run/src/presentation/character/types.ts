import type { EkoRunRenderSnapshot, Vec2 } from "../../state/types";

export const OUTFIT_IDS = [
  "yoruba-agbada-fila",
  "igbo-isi-agu-red-cap",
  "hausa-baban-riga-cap",
  "lagos-streetwear",
] as const;

export type OutfitId = (typeof OUTFIT_IDS)[number];

export type LandmarkName = "head" | "leftHand" | "rightHand" | "hips" | "leftFoot" | "rightFoot";

export type CharacterAnimation =
  | "idle"
  | "anticipation"
  | "acceleration"
  | "run"
  | "brake"
  | "takeoff"
  | "ascent"
  | "apex"
  | "descent"
  | "landing"
  | "slide"
  | "vault"
  | "near-miss"
  | "hit"
  | "recovery"
  | "failure"
  | "celebration";

export interface DecorativeEnvelope {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export interface OutfitPalette {
  readonly primary: string;
  readonly secondary: string;
  readonly accent: string;
  readonly trim: string;
  readonly skin: string;
  readonly backgroundSafeOutline: string;
}

export interface CharacterOutfitDefinition {
  readonly id: OutfitId;
  readonly displayName: string;
  readonly culturalContext: string;
  readonly silhouetteNotes: string;
  readonly patternVocabulary: string;
  readonly collisionProfile: "tayo-standard";
  readonly mechanicalModifiers: readonly never[];
  readonly landmarkVisibility: Readonly<Record<LandmarkName, true>>;
  readonly decorativeEnvelope: DecorativeEnvelope;
  readonly palette: OutfitPalette;
  readonly sourcePolicy: "original-design";
}

export interface CharacterAnimationFrame {
  readonly animation: CharacterAnimation;
  readonly phase: number;
  readonly semanticTick: number;
  readonly cycleTicks: number;
}

export interface CharacterPose {
  readonly animation: CharacterAnimation;
  readonly phase: number;
  readonly bobY: number;
  readonly lean: number;
  readonly squash: number;
  readonly landmarks: Readonly<Record<LandmarkName, Vec2>>;
}

export interface CharacterPresentationOptions {
  readonly outfitId?: OutfitId | string;
  readonly reducedMotion?: boolean;
  /** Presentation sampling rate is accepted for adapters but never enters pose truth. */
  readonly presentationHz?: number;
  readonly previousSnapshot?: Readonly<EkoRunRenderSnapshot>;
}

export interface CharacterPresentation {
  readonly outfit: CharacterOutfitDefinition;
  readonly frame: CharacterAnimationFrame;
  readonly pose: CharacterPose;
  readonly facing: -1 | 1;
  readonly reducedMotion: boolean;
}
