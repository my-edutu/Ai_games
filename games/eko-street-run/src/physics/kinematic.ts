import type { EkoRunConfig } from "../config/default-config";
import { FIXED_DT_SECONDS } from "../config/version";
import type {
  KinematicStepResult,
  PhysicsContact,
  PlayerControlIntent,
  PlayerState,
  RouteState,
} from "../state/types";
import { findVaultObstacle, hasStandingClearance, playerHeight, sampleSupportSurface, sweepCeiling, sweepHorizontal } from "./geometry";

function quantize(value: number, quantum: number): number {
  return Math.round(value / quantum) * quantum;
}

function approach(current: number, target: number, amount: number): number {
  if (current < target) return Math.min(target, current + amount);
  if (current > target) return Math.max(target, current - amount);
  return current;
}

function clonePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    position: { ...player.position },
    velocity: { ...player.velocity },
    vault: player.vault
      ? { ...player.vault, start: { ...player.vault.start }, end: { ...player.vault.end } }
      : null,
  };
}

function contactKind(kind: "ground" | "slope" | "step" | "moving" | "vault"): PhysicsContact["kind"] {
  return kind;
}

function startVault(player: PlayerState, route: RouteState, intent: PlayerControlIntent, tick: number, config: EkoRunConfig): boolean {
  if (!intent.vault || (player.movementState !== "grounded" && player.movementState !== "sliding")) return false;
  const obstacle = findVaultObstacle(player, route, tick, config);
  if (!obstacle) return false;
  const direction = player.facing;
  const endX = direction > 0
    ? obstacle.maxX + config.playerHalfWidth + config.collisionSkin + 0.1
    : obstacle.minX - config.playerHalfWidth - config.collisionSkin - 0.1;
  player.vault = {
    obstacleId: obstacle.id,
    ticksRemaining: config.vaultDurationTicks,
    totalTicks: config.vaultDurationTicks,
    start: { ...player.position },
    end: { x: endX, y: route.groundY },
  };
  player.movementState = "vaulting";
  player.velocity = { x: 0, y: 0 };
  player.slideTicksRemaining = 0;
  return true;
}

function advanceVault(player: PlayerState, config: EkoRunConfig): void {
  const vault = player.vault;
  if (!vault) return;
  const elapsed = vault.totalTicks - vault.ticksRemaining + 1;
  const t = Math.min(1, elapsed / vault.totalTicks);
  const x = vault.start.x + (vault.end.x - vault.start.x) * t;
  const baseY = vault.start.y + (vault.end.y - vault.start.y) * t;
  const arc = 4 * config.vaultArcHeight * t * (1 - t);
  player.position.x = quantize(x, config.quantization);
  player.position.y = quantize(baseY + arc, config.quantization);
  vault.ticksRemaining -= 1;
  if (vault.ticksRemaining <= 0) {
    player.position = { x: quantize(vault.end.x, config.quantization), y: quantize(vault.end.y, config.quantization) };
    player.vault = null;
    player.movementState = "grounded";
    player.coyoteTicksRemaining = config.coyoteTicks;
  }
}

function emptyResult(player: PlayerState): KinematicStepResult {
  return {
    player,
    contacts: [],
    landed: false,
    jumpStarted: false,
    slideStarted: false,
    vaultStarted: false,
    stumbleStarted: false,
    failed: false,
  };
}

function normalizeLegacyState(player: PlayerState): void {
  if (player.movementState === "airborne") player.movementState = player.velocity.y > 0 ? "rising" : "falling";
}

export function stepPlayerKinematic(
  source: PlayerState,
  route: RouteState,
  intent: PlayerControlIntent,
  config: EkoRunConfig,
  tick: number,
): KinematicStepResult {
  const player = clonePlayer(source);
  normalizeLegacyState(player);
  const result = emptyResult(player);
  const contacts = result.contacts;

  if (player.movementState === "dead") return result;

  if (player.landingCompressionTicksRemaining > 0) player.landingCompressionTicksRemaining -= 1;

  if (player.vault && player.movementState === "vaulting") {
    advanceVault(player, config);
    result.failed = player.position.y <= route.killPlaneY;
    return result;
  }

  if (intent.axis > 0) player.facing = 1;
  else if (intent.axis < 0) player.facing = -1;

  if (intent.jumpPressed) player.jumpBufferTicksRemaining = config.jumpBufferTicks;

  if (intent.jumpReleased && player.velocity.y > 0 && !player.jumpCutConsumed) {
    player.velocity.y = quantize(player.velocity.y * config.jumpReleaseVelocityFactor, config.quantization);
    player.jumpCutConsumed = true;
  }

  if (startVault(player, route, intent, tick, config)) {
    result.vaultStarted = true;
    advanceVault(player, config);
    return result;
  }

  const wasStumbling = player.movementState === "stumbling";
  if (wasStumbling) {
    if (player.stumbleTicksRemaining > 0) player.stumbleTicksRemaining -= 1;
    if (player.stumbleTicksRemaining <= 0) player.movementState = "grounded";
  }

  if (intent.slide && player.movementState === "grounded") {
    player.slideTicksRemaining = config.slideDurationTicks;
    player.movementState = "sliding";
    result.slideStarted = true;
  }

  const canJump = player.movementState === "grounded" || player.movementState === "sliding" || player.coyoteTicksRemaining > 0;
  if (!wasStumbling && player.jumpBufferTicksRemaining > 0 && canJump) {
    player.velocity.y = config.jumpSpeed;
    player.movementState = "rising";
    player.coyoteTicksRemaining = 0;
    player.jumpBufferTicksRemaining = 0;
    player.jumpCutConsumed = false;
    player.slideTicksRemaining = 0;
    result.jumpStarted = true;
  }

  const groundLike = player.movementState === "grounded" || player.movementState === "sliding" || player.movementState === "stumbling";
  const targetSpeed = intent.axis * config.maxSpeed;
  const acceleration = groundLike
    ? (intent.axis === 0 ? config.groundDeceleration : config.groundAcceleration)
    : config.airAcceleration;
  player.velocity.x = quantize(approach(player.velocity.x, targetSpeed, acceleration * FIXED_DT_SECONDS), config.quantization);

  const currentHeight = playerHeight(player, config);
  const desiredX = quantize(player.position.x + player.velocity.x * FIXED_DT_SECONDS, config.quantization);
  const horizontal = sweepHorizontal(player.position.x, desiredX, player.position.y, currentHeight, route, tick, config);
  player.position.x = quantize(Math.max(route.minX, Math.min(route.maxX, horizontal.x)), config.quantization);
  if (horizontal.blocked) {
    player.velocity.x = 0;
    if (horizontal.colliderId && horizontal.kind) contacts.push({ colliderId: horizontal.colliderId, kind: horizontal.kind });
  }

  if (groundLike && player.movementState !== "rising") {
    const support = sampleSupportSurface(
      route,
      player.position.x,
      config.playerHalfWidth,
      tick,
      config,
      player.position.y + config.maxStepHeight,
    );
    if (support && Math.abs(support.y - player.position.y) <= config.maxStepHeight + config.collisionSkin) {
      const steppedUp = support.y > player.position.y + config.collisionSkin;
      player.position.y = quantize(support.y, config.quantization);
      player.velocity.y = 0;
      if (player.movementState !== "sliding" && player.movementState !== "stumbling") player.movementState = "grounded";
      player.coyoteTicksRemaining = config.coyoteTicks;
      contacts.push({ colliderId: support.id, kind: steppedUp ? "step" : contactKind(support.kind) });
    } else {
      player.movementState = "falling";
      player.coyoteTicksRemaining = Math.max(player.coyoteTicksRemaining, config.coyoteTicks);
    }
  }

  if (player.movementState !== "grounded" && player.movementState !== "sliding" && player.movementState !== "stumbling") {
    player.velocity.y = quantize(Math.max(-config.maxFallSpeed, player.velocity.y - config.gravity * FIXED_DT_SECONDS), config.quantization);
    const oldY = player.position.y;
    let desiredY = quantize(oldY + player.velocity.y * FIXED_DT_SECONDS, config.quantization);
    if (player.velocity.y > 0) {
      const ceiling = sweepCeiling(oldY, desiredY, player.position.x, currentHeight, route, tick, config);
      if (ceiling.blocked) {
        desiredY = ceiling.y;
        player.velocity.y = 0;
        player.movementState = "falling";
        if (ceiling.colliderId) contacts.push({ colliderId: ceiling.colliderId, kind: "ceiling" });
      }
    }

    if (player.velocity.y <= 0) {
      const support = sampleSupportSurface(route, player.position.x, config.playerHalfWidth, tick, config, oldY + config.collisionSkin);
      if (support && desiredY <= support.y + config.collisionSkin && oldY >= support.y - config.collisionSkin) {
        const impactSpeed = Math.abs(player.velocity.y);
        player.position.y = quantize(support.y, config.quantization);
        player.velocity.y = 0;
        result.landed = true;
        player.landingCompressionTicksRemaining = config.landingCompressionTicks;
        contacts.push({ colliderId: support.id, kind: contactKind(support.kind) });
        if (impactSpeed >= config.stumbleFallSpeed) {
          player.movementState = "stumbling";
          player.stumbleTicksRemaining = config.stumbleDurationTicks;
          result.stumbleStarted = true;
        } else if (player.jumpBufferTicksRemaining > 0) {
          player.velocity.y = config.jumpSpeed;
          player.movementState = "rising";
          player.jumpBufferTicksRemaining = 0;
          player.coyoteTicksRemaining = 0;
          player.jumpCutConsumed = false;
          result.jumpStarted = true;
        } else {
          player.movementState = "grounded";
          player.coyoteTicksRemaining = config.coyoteTicks;
        }
      } else {
        player.position.y = desiredY;
        player.movementState = player.velocity.y > 0 ? "rising" : "falling";
      }
    } else {
      player.position.y = desiredY;
      player.movementState = "rising";
    }
  }

  if (player.movementState === "sliding") {
    if (player.slideTicksRemaining > 0) player.slideTicksRemaining -= 1;
    if (player.slideTicksRemaining <= 0 && hasStandingClearance(player, route, tick, config)) player.movementState = "grounded";
  }

  if (player.movementState === "grounded") player.coyoteTicksRemaining = config.coyoteTicks;
  else if (player.coyoteTicksRemaining > 0 && !result.jumpStarted) player.coyoteTicksRemaining -= 1;

  if (player.jumpBufferTicksRemaining > 0 && !intent.jumpPressed) player.jumpBufferTicksRemaining -= 1;
  else if (player.jumpBufferTicksRemaining > 0 && intent.jumpPressed && !result.jumpStarted) player.jumpBufferTicksRemaining -= 1;

  player.position.x = quantize(player.position.x, config.quantization);
  player.position.y = quantize(player.position.y, config.quantization);
  player.velocity.x = quantize(player.velocity.x, config.quantization);
  player.velocity.y = quantize(player.velocity.y, config.quantization);

  if (player.position.y <= route.killPlaneY) {
    player.position.y = route.killPlaneY;
    player.velocity = { x: 0, y: 0 };
    player.movementState = "dead";
    player.vault = null;
    result.failed = true;
  }

  return result;
}

export function integrateFoundationMovement(
  source: PlayerState,
  route: RouteState,
  axis: number,
  config: EkoRunConfig,
): PlayerState {
  return stepPlayerKinematic(
    source,
    route,
    { axis, jumpPressed: false, jumpReleased: false, slide: false, vault: false },
    config,
    0,
  ).player;
}
