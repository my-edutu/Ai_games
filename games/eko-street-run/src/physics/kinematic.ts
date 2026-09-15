import type { EkoRunConfig } from "../config/default-config";
import { FIXED_DT_SECONDS } from "../config/version";
import type { PlayerState, RouteState } from "../state/types";

function quantize(value: number, quantum: number): number {
  const result = Math.round(value / quantum) * quantum;
  return Object.is(result, -0) ? 0 : result;
}

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(target, current + maxDelta);
  if (current > target) return Math.max(target, current - maxDelta);
  return target;
}

export function integrateFoundationMovement(player: PlayerState, route: RouteState, axis: number, config: EkoRunConfig): PlayerState {
  const velocityX = approach(player.velocity.x, axis * config.maxSpeed, config.acceleration * FIXED_DT_SECONDS);
  let velocityY = player.velocity.y - config.gravity * FIXED_DT_SECONDS;
  let positionX = player.position.x + velocityX * FIXED_DT_SECONDS;
  let positionY = player.position.y + velocityY * FIXED_DT_SECONDS;

  positionX = Math.max(route.minX, Math.min(route.maxX, positionX));
  let movementState: PlayerState["movementState"] = "airborne";
  if (positionY <= route.groundY) {
    positionY = route.groundY;
    velocityY = 0;
    movementState = "grounded";
  }

  return {
    ...player,
    position: {
      x: quantize(positionX, config.quantization),
      y: quantize(positionY, config.quantization),
    },
    velocity: {
      x: quantize(velocityX, config.quantization),
      y: quantize(velocityY, config.quantization),
    },
    movementState,
  };
}
