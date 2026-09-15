import type { Vec2 } from "../../state/types";
import type { CharacterAnimation, CharacterPose, LandmarkName } from "./types";

const ANIMATIONS = new Set<CharacterAnimation>([
  "idle", "anticipation", "acceleration", "run", "brake", "takeoff", "ascent", "apex", "descent", "landing", "slide", "vault", "near-miss", "hit", "recovery", "failure", "celebration",
]);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizedPhase(value: number): number {
  if (!Number.isFinite(value)) throw new Error("INVALID_ANIMATION_PHASE");
  const wrapped = ((value % 1) + 1) % 1;
  return wrapped;
}

function freezeLandmarks(landmarks: Record<LandmarkName, Vec2>): Readonly<Record<LandmarkName, Vec2>> {
  for (const point of Object.values(landmarks)) Object.freeze(point);
  return Object.freeze(landmarks);
}

export function mirrorPose(pose: CharacterPose): CharacterPose {
  const landmarks = Object.fromEntries(
    Object.entries(pose.landmarks).map(([name, point]) => [name, { x: -point.x, y: point.y }]),
  ) as Record<LandmarkName, Vec2>;
  const mirrored = {
    animation: pose.animation,
    phase: pose.phase,
    bobY: pose.bobY,
    lean: -pose.lean,
    squash: pose.squash,
    landmarks: freezeLandmarks(landmarks),
  } satisfies CharacterPose;
  return Object.freeze(mirrored);
}

export function createPoseForAnimation(
  animation: CharacterAnimation | string,
  phaseInput: number,
  options: { readonly reducedMotion?: boolean } = {},
): CharacterPose {
  if (!ANIMATIONS.has(animation as CharacterAnimation)) throw new Error(`UNKNOWN_ANIMATION: ${animation}`);
  const animationId = animation as CharacterAnimation;
  const phase = normalizedPhase(phaseInput);
  const wave = Math.sin(phase * Math.PI * 2);
  const stride = Math.sin(phase * Math.PI * 2);
  const reducedScale = options.reducedMotion ? 0.28 : 1;

  let bobY = 0.018 * wave * reducedScale;
  let lean = 0;
  let squash = 0;
  let hipsY = 0.92 + bobY;
  let headY = 1.72 + bobY;
  let handY = 1.03 + bobY;
  let footYLeft = 0;
  let footYRight = 0;
  let leftHandX = -0.43;
  let rightHandX = 0.43;
  let leftFootX = -0.19;
  let rightFootX = 0.19;

  switch (animationId) {
    case "anticipation":
      squash = 0.07 * reducedScale;
      hipsY -= 0.08 * reducedScale;
      headY -= 0.06 * reducedScale;
      break;
    case "acceleration":
      lean = 0.12 * reducedScale;
      leftHandX += 0.07 * stride * reducedScale;
      rightHandX -= 0.07 * stride * reducedScale;
      leftFootX += 0.1 * stride * reducedScale;
      rightFootX -= 0.1 * stride * reducedScale;
      break;
    case "run":
      lean = 0.06 * reducedScale;
      bobY = 0.035 * Math.abs(wave) * reducedScale;
      hipsY = 0.92 + bobY;
      headY = 1.72 + bobY;
      handY = 1.03 + bobY;
      leftHandX += 0.12 * stride * reducedScale;
      rightHandX -= 0.12 * stride * reducedScale;
      leftFootX += 0.16 * stride * reducedScale;
      rightFootX -= 0.16 * stride * reducedScale;
      footYLeft = Math.max(0, 0.07 * stride) * reducedScale;
      footYRight = Math.max(0, -0.07 * stride) * reducedScale;
      break;
    case "brake":
      lean = -0.1 * reducedScale;
      leftFootX -= 0.08 * reducedScale;
      rightFootX += 0.12 * reducedScale;
      break;
    case "takeoff":
      squash = 0.05 * (1 - phase) * reducedScale;
      hipsY += 0.06 * phase * reducedScale;
      headY += 0.08 * phase * reducedScale;
      break;
    case "ascent":
      lean = 0.04 * reducedScale;
      hipsY += 0.1 * reducedScale;
      headY += 0.12 * reducedScale;
      handY += 0.08 * reducedScale;
      leftFootX = -0.15;
      rightFootX = 0.11;
      footYLeft = 0.06 * reducedScale;
      break;
    case "apex":
      hipsY += 0.12 * reducedScale;
      headY += 0.14 * reducedScale;
      handY += 0.1 * reducedScale;
      leftFootX = -0.13;
      rightFootX = 0.13;
      footYLeft = 0.05 * reducedScale;
      footYRight = 0.05 * reducedScale;
      break;
    case "descent":
      lean = -0.025 * reducedScale;
      hipsY += 0.07 * reducedScale;
      headY += 0.08 * reducedScale;
      leftFootX = -0.2;
      rightFootX = 0.2;
      break;
    case "landing":
      squash = 0.09 * reducedScale;
      hipsY -= 0.1 * reducedScale;
      headY -= 0.08 * reducedScale;
      leftFootX = -0.24;
      rightFootX = 0.24;
      break;
    case "slide":
      lean = 0.18 * reducedScale;
      hipsY = 0.48;
      headY = 0.84;
      handY = 0.48;
      leftHandX = -0.1;
      rightHandX = 0.5;
      leftFootX = -0.4;
      rightFootX = 0.42;
      break;
    case "vault": {
      const arc = Math.sin(phase * Math.PI) * 0.16 * reducedScale;
      lean = 0.12 * reducedScale;
      hipsY += arc;
      headY += arc;
      handY += arc + 0.05 * reducedScale;
      leftHandX = -0.2;
      rightHandX = 0.48;
      leftFootX = -0.24;
      rightFootX = 0.29;
      footYLeft = arc * 0.7;
      footYRight = arc * 0.9;
      break;
    }
    case "near-miss":
      lean = -0.08 * reducedScale;
      leftHandX -= 0.06 * reducedScale;
      rightHandX += 0.06 * reducedScale;
      break;
    case "hit":
      lean = -0.16 * reducedScale;
      squash = 0.05 * reducedScale;
      hipsY -= 0.05 * reducedScale;
      headY -= 0.03 * reducedScale;
      break;
    case "recovery":
      lean = -0.07 * (1 - phase) * reducedScale;
      squash = 0.03 * (1 - phase) * reducedScale;
      break;
    case "failure":
      lean = -0.22 * reducedScale;
      hipsY = 0.7;
      headY = 1.3;
      handY = 0.72;
      leftFootX = -0.28;
      rightFootX = 0.25;
      break;
    case "celebration":
      bobY = 0.04 * Math.max(0, wave) * reducedScale;
      hipsY = 0.92 + bobY;
      headY = 1.72 + bobY;
      handY = 1.35 + 0.08 * Math.abs(wave) * reducedScale;
      leftHandX = -0.5;
      rightHandX = 0.5;
      break;
  }

  const landmarks: Record<LandmarkName, Vec2> = {
    head: { x: clamp(lean * 0.35, -0.12, 0.12), y: clamp(headY, 0.35, 2.12) },
    leftHand: { x: clamp(leftHandX + lean * 0.2, -0.68, 0.68), y: clamp(handY, 0.2, 2.1) },
    rightHand: { x: clamp(rightHandX + lean * 0.2, -0.68, 0.68), y: clamp(handY, 0.2, 2.1) },
    hips: { x: clamp(lean * 0.16, -0.1, 0.1), y: clamp(hipsY, 0.35, 1.5) },
    leftFoot: { x: clamp(leftFootX, -0.68, 0.68), y: clamp(footYLeft, 0, 0.35) },
    rightFoot: { x: clamp(rightFootX, -0.68, 0.68), y: clamp(footYRight, 0, 0.35) },
  };

  return Object.freeze({
    animation: animationId,
    phase,
    bobY,
    lean,
    squash,
    landmarks: freezeLandmarks(landmarks),
  });
}
