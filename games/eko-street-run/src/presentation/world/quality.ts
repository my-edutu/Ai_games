import type { PresentationQuality, QualityProfile } from "./types";

const PROFILES: Readonly<Record<PresentationQuality, QualityProfile>> = Object.freeze({
  low: Object.freeze({ tier: "low", ambientDensity: 0.28, distantAnimationScale: 0.15, secondaryShadowScale: 0, postProcessScale: 0, authoritativeTickRateHz: 60, maxDetailRank: 2 }),
  medium: Object.freeze({ tier: "medium", ambientDensity: 0.62, distantAnimationScale: 0.55, secondaryShadowScale: 0.45, postProcessScale: 0.35, authoritativeTickRateHz: 60, maxDetailRank: 3 }),
  high: Object.freeze({ tier: "high", ambientDensity: 1, distantAnimationScale: 1, secondaryShadowScale: 1, postProcessScale: 1, authoritativeTickRateHz: 60, maxDetailRank: 4 }),
});

export function getQualityProfile(quality: PresentationQuality | string): QualityProfile {
  if (quality !== "low" && quality !== "medium" && quality !== "high") throw new Error("INVALID_QUALITY");
  return PROFILES[quality];
}
