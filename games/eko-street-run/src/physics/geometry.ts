import type { EkoRunConfig } from "../config/default-config";
import type { PlayerState, RouteColliderRect, RouteState } from "../state/types";

export interface ResolvedCollider extends RouteColliderRect {
  minX: number;
  maxX: number;
}

export interface SupportSample {
  id: string;
  y: number;
  kind: "ground" | "slope" | "step" | "moving" | "vault";
}

function quantize(value: number, quantum: number): number {
  return Math.round(value / quantum) * quantum;
}

export function resolveCollider(collider: RouteColliderRect, tick: number, config: EkoRunConfig): ResolvedCollider {
  if (!collider.motion) return { ...collider };
  const period = collider.motion.periodTicks;
  const phase = ((tick % period) + period) % period;
  const half = period / 2;
  const unit = phase <= half ? phase / half : (period - phase) / half;
  const offset = collider.motion.minOffsetX + (collider.motion.maxOffsetX - collider.motion.minOffsetX) * unit;
  const dx = quantize(offset, config.quantization);
  return { ...collider, minX: collider.minX + dx, maxX: collider.maxX + dx };
}

export function playerHeight(player: PlayerState, config: EkoRunConfig): number {
  return player.movementState === "sliding" ? config.playerSlideHeight : config.playerStandingHeight;
}

function horizontalOverlap(centerX: number, halfWidth: number, minX: number, maxX: number): boolean {
  return centerX + halfWidth > minX && centerX - halfWidth < maxX;
}

export function sampleSupportSurface(
  route: RouteState,
  centerX: number,
  halfWidth: number,
  tick: number,
  config: EkoRunConfig,
  maxSupportY: number,
): SupportSample | null {
  const candidates: SupportSample[] = [];
  for (const segment of route.groundSegments) {
    if (centerX >= segment.minX && centerX <= segment.maxX && segment.y <= maxSupportY + config.collisionSkin) {
      candidates.push({ id: segment.id, y: segment.y, kind: "ground" });
    }
  }
  for (const slope of route.slopes) {
    if (centerX >= slope.minX && centerX <= slope.maxX) {
      const t = (centerX - slope.minX) / (slope.maxX - slope.minX);
      const y = slope.startY + (slope.endY - slope.startY) * t;
      if (y <= maxSupportY + config.collisionSkin) candidates.push({ id: slope.id, y, kind: "slope" });
    }
  }
  for (const raw of route.colliders) {
    const collider = resolveCollider(raw, tick, config);
    if (!horizontalOverlap(centerX, halfWidth, collider.minX, collider.maxX)) continue;
    if (collider.maxY > maxSupportY + config.collisionSkin) continue;
    candidates.push({
      id: collider.id,
      y: collider.maxY,
      kind: collider.kind === "moving" ? "moving" : collider.kind === "vault" ? "vault" : "step",
    });
  }
  candidates.sort((a, b) => b.y - a.y || a.id.localeCompare(b.id));
  return candidates[0] ?? null;
}

function verticalOverlap(feetY: number, height: number, collider: ResolvedCollider, skin: number): boolean {
  const top = feetY + height;
  return feetY < collider.maxY - skin && top > collider.minY + skin;
}

export interface HorizontalSweepResult {
  x: number;
  blocked: boolean;
  colliderId: string | null;
  kind: "wall" | "moving" | "vault" | null;
}

export function sweepHorizontal(
  oldX: number,
  desiredX: number,
  feetY: number,
  height: number,
  route: RouteState,
  tick: number,
  config: EkoRunConfig,
): HorizontalSweepResult {
  if (desiredX === oldX) return { x: oldX, blocked: false, colliderId: null, kind: null };
  const movingRight = desiredX > oldX;
  const delta = desiredX - oldX;
  const hits: Array<{ toi: number; x: number; collider: ResolvedCollider }> = [];
  for (const raw of route.colliders) {
    const collider = resolveCollider(raw, tick, config);
    if (!verticalOverlap(feetY, height, collider, config.collisionSkin)) continue;
    const rise = collider.maxY - feetY;
    if (rise > config.collisionSkin && rise <= config.maxStepHeight + config.collisionSkin && collider.minY <= feetY + config.collisionSkin) {
      continue;
    }
    if (movingRight) {
      const oldEdge = oldX + config.playerHalfWidth;
      const newEdge = desiredX + config.playerHalfWidth;
      if (oldEdge <= collider.minX + config.collisionSkin && newEdge > collider.minX) {
        const x = collider.minX - config.playerHalfWidth - config.collisionSkin;
        hits.push({ toi: Math.max(0, Math.min(1, (x - oldX) / delta)), x, collider });
      }
    } else {
      const oldEdge = oldX - config.playerHalfWidth;
      const newEdge = desiredX - config.playerHalfWidth;
      if (oldEdge >= collider.maxX - config.collisionSkin && newEdge < collider.maxX) {
        const x = collider.maxX + config.playerHalfWidth + config.collisionSkin;
        hits.push({ toi: Math.max(0, Math.min(1, (x - oldX) / delta)), x, collider });
      }
    }
  }
  hits.sort((a, b) => a.toi - b.toi || a.collider.id.localeCompare(b.collider.id));
  const first = hits[0];
  if (!first) return { x: desiredX, blocked: false, colliderId: null, kind: null };
  return {
    x: first.x,
    blocked: true,
    colliderId: first.collider.id,
    kind: first.collider.kind === "moving" ? "moving" : first.collider.kind === "vault" ? "vault" : "wall",
  };
}

export interface CeilingSweepResult {
  y: number;
  blocked: boolean;
  colliderId: string | null;
}

export function sweepCeiling(
  oldY: number,
  desiredY: number,
  centerX: number,
  height: number,
  route: RouteState,
  tick: number,
  config: EkoRunConfig,
): CeilingSweepResult {
  if (desiredY <= oldY) return { y: desiredY, blocked: false, colliderId: null };
  const oldTop = oldY + height;
  const desiredTop = desiredY + height;
  const hits: Array<{ y: number; collider: ResolvedCollider }> = [];
  for (const raw of route.colliders) {
    const collider = resolveCollider(raw, tick, config);
    if (!horizontalOverlap(centerX, config.playerHalfWidth, collider.minX, collider.maxX)) continue;
    if (oldTop <= collider.minY + config.collisionSkin && desiredTop > collider.minY) {
      hits.push({ y: collider.minY - height - config.collisionSkin, collider });
    }
  }
  hits.sort((a, b) => a.y - b.y || a.collider.id.localeCompare(b.collider.id));
  const first = hits[0];
  return first ? { y: first.y, blocked: true, colliderId: first.collider.id } : { y: desiredY, blocked: false, colliderId: null };
}

export function hasStandingClearance(player: PlayerState, route: RouteState, tick: number, config: EkoRunConfig): boolean {
  for (const raw of route.colliders) {
    const collider = resolveCollider(raw, tick, config);
    if (!horizontalOverlap(player.position.x, config.playerHalfWidth, collider.minX, collider.maxX)) continue;
    if (verticalOverlap(player.position.y, config.playerStandingHeight, collider, config.collisionSkin)) return false;
  }
  return true;
}

export function findVaultObstacle(player: PlayerState, route: RouteState, tick: number, config: EkoRunConfig): ResolvedCollider | null {
  const direction = player.facing;
  const edge = player.position.x + direction * config.playerHalfWidth;
  const candidates: Array<{ distance: number; collider: ResolvedCollider }> = [];
  for (const raw of route.colliders) {
    if (raw.kind !== "vault") continue;
    const collider = resolveCollider(raw, tick, config);
    const height = collider.maxY - collider.minY;
    if (height > config.maxVaultHeight + config.collisionSkin) continue;
    const distance = direction > 0 ? collider.minX - edge : edge - collider.maxX;
    if (distance < -config.collisionSkin || distance > config.vaultReach) continue;
    candidates.push({ distance, collider });
  }
  candidates.sort((a, b) => a.distance - b.distance || a.collider.id.localeCompare(b.collider.id));
  return candidates[0]?.collider ?? null;
}
