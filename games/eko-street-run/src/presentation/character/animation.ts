import type { EkoRunRenderSnapshot, SemanticEvent } from "../../state/types";
import type { CharacterAnimation, CharacterAnimationFrame } from "./types";

const CYCLE_TICKS: Readonly<Record<CharacterAnimation, number>> = Object.freeze({
  idle: 96,
  anticipation: 20,
  acceleration: 28,
  run: 30,
  brake: 20,
  takeoff: 12,
  ascent: 24,
  apex: 18,
  descent: 24,
  landing: 10,
  slide: 24,
  vault: 16,
  "near-miss": 18,
  hit: 12,
  recovery: 18,
  failure: 48,
  celebration: 72,
});

function assertSnapshot(snapshot: Readonly<EkoRunRenderSnapshot>): void {
  if (!Number.isInteger(snapshot.tick) || snapshot.tick < 0) throw new Error("INVALID_PRESENTATION_SNAPSHOT: tick");
  const velocity = snapshot.player.velocity;
  if (!Number.isFinite(velocity.x) || !Number.isFinite(velocity.y)) throw new Error("INVALID_PRESENTATION_SNAPSHOT: velocity");
}

function hasCurrentEvent(snapshot: Readonly<EkoRunRenderSnapshot>, type: SemanticEvent["type"]): boolean {
  return snapshot.recentEvents.some(event => event.tick === snapshot.tick && event.type === type);
}

function groundedLocomotion(snapshot: Readonly<EkoRunRenderSnapshot>, previous?: Readonly<EkoRunRenderSnapshot>): CharacterAnimation {
  const speed = Math.abs(snapshot.player.velocity.x);
  if (speed < 0.15) return "idle";
  if (previous && previous.lifecycle === "running") {
    const previousSpeed = Math.abs(previous.player.velocity.x);
    if (speed - previousSpeed > 0.2) return "acceleration";
    if (previousSpeed - speed > 0.25 && speed > 0.3) return "brake";
  }
  return "run";
}

export function resolveCharacterFrame(
  snapshot: Readonly<EkoRunRenderSnapshot>,
  previous?: Readonly<EkoRunRenderSnapshot>,
): CharacterAnimationFrame {
  assertSnapshot(snapshot);
  let animation: CharacterAnimation;

  if (snapshot.lifecycle === "failed" || snapshot.player.movementState === "dead") animation = "failure";
  else if (snapshot.lifecycle === "completed") animation = "celebration";
  else if (snapshot.player.movementState === "vaulting") animation = "vault";
  else if (snapshot.player.movementState === "stumbling") animation = snapshot.player.stumbleTicksRemaining > 9 ? "hit" : "recovery";
  else if (snapshot.player.movementState === "sliding") animation = "slide";
  else if (snapshot.player.landingCompressionTicksRemaining > 0) animation = "landing";
  else if (hasCurrentEvent(snapshot, "player.jumped")) animation = "takeoff";
  else if (snapshot.player.movementState === "rising") animation = Math.abs(snapshot.player.velocity.y) < 0.75 ? "apex" : "ascent";
  else if (snapshot.player.movementState === "falling" || snapshot.player.movementState === "airborne") animation = Math.abs(snapshot.player.velocity.y) < 0.75 ? "apex" : snapshot.player.velocity.y >= 0 ? "ascent" : "descent";
  else animation = groundedLocomotion(snapshot, previous);

  const cycleTicks = CYCLE_TICKS[animation];
  const phase = (snapshot.tick % cycleTicks) / cycleTicks;
  return Object.freeze({ animation, phase, semanticTick: snapshot.tick, cycleTicks });
}
