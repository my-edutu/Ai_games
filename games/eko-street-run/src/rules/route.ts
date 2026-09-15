import { CONTENT_VERSION } from "../config/version";
import type { RouteState } from "../state/types";

export const FOUNDATION_ROUTE_ID = "foundation-straight-001";

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
  };
}
