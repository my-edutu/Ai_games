import { CONTENT_VERSION } from "../config/version";
import type { RouteState } from "../state/types";

export const FOUNDATION_ROUTE_ID = "foundation-straight-001";
export const MOVEMENT_GRAYBOX_ROUTE_ID = "movement-graybox-001";

export function createFoundationRoute(): RouteState {
  return {
    id: FOUNDATION_ROUTE_ID,
    contentVersion: CONTENT_VERSION,
    groundY: 0,
    startX: 0,
    minX: -2,
    maxX: 24,
    checkpointXs: [10],
    finishX: 20,
    killPlaneY: -6,
    groundSegments: [{ id: "foundation-ground", minX: -2, maxX: 24, y: 0 }],
    slopes: [],
    colliders: [],
  };
}

export function createMovementGrayboxRoute(): RouteState {
  return {
    id: MOVEMENT_GRAYBOX_ROUTE_ID,
    contentVersion: CONTENT_VERSION,
    groundY: 0,
    startX: 0,
    minX: -2,
    maxX: 30,
    checkpointXs: [14, 24],
    finishX: 28,
    killPlaneY: -6,
    groundSegments: [
      { id: "gray-ground-a", minX: -2, maxX: 3, y: 0 },
      { id: "gray-ground-b", minX: 4, maxX: 30, y: 0 },
    ],
    slopes: [
      { id: "gray-slope", minX: 16.8, maxX: 19.8, startY: 0, endY: 1 },
    ],
    colliders: [
      { id: "slide-roof", minX: 5.8, maxX: 7.6, minY: 1.05, maxY: 2.05, kind: "solid" },
      { id: "low-step", minX: 8.6, maxX: 11.7, minY: 0, maxY: 0.4, kind: "solid" },
      { id: "tall-wall", minX: 12, maxX: 12.4, minY: 0, maxY: 3, kind: "solid" },
      { id: "jump-ceiling", minX: 14, maxX: 15, minY: 2.2, maxY: 2.5, kind: "solid" },
      { id: "vault-block", minX: 20.8, maxX: 21.4, minY: 0, maxY: 0.75, kind: "vault" },
      {
        id: "moving-block",
        minX: 24.55,
        maxX: 25.05,
        minY: 0,
        maxY: 0.9,
        kind: "moving",
        motion: { minOffsetX: -0.6, maxOffsetX: 0.6, periodTicks: 120 },
      },
    ],
  };
}
