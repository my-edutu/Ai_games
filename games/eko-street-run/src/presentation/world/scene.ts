import type { EkoRunRenderSnapshot, SemanticEvent } from "../../state/types";
import { createPresentationCues } from "./audio";
import { createCameraPlan, assertViewport } from "./camera";
import { getMainlandMorningDistrict } from "./mainland-morning";
import { getQualityProfile } from "./quality";
import type { CameraPlan, MainlandMorningPresentation, MainlandMorningPresentationOptions, WorldNode } from "./types";

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

function nextProgressMarkerX(snapshot: EkoRunRenderSnapshot, camera: CameraPlan): number {
  const nextCheckpoint = snapshot.route.checkpointXs.find(checkpointX => checkpointX > snapshot.player.position.x + 1e-6);
  const milestoneX = nextCheckpoint ?? snapshot.route.finishX;
  const margin = 0.5;
  const minimum = camera.visibleWorld.minX + margin;
  const maximum = camera.visibleWorld.maxX - margin;
  return Math.min(maximum, Math.max(minimum, milestoneX));
}

function criticalNodes(snapshot: EkoRunRenderSnapshot, camera: CameraPlan): WorldNode[] {
  const direction = snapshot.player.facing;
  const behindAllowance = 0.75;
  const viewMargin = 0.5;
  const nearEdge = snapshot.player.position.x - direction * behindAllowance;
  const farEdge = direction > 0
    ? Math.min(snapshot.route.finishX, camera.visibleWorld.maxX - viewMargin)
    : Math.max(snapshot.route.minX, camera.visibleWorld.minX + viewMargin);
  const lower = Math.min(nearEdge, farEdge);
  const upper = Math.max(nearEdge, farEdge);
  const routeWidth = Math.max(0.5, upper - lower);
  const routeCenter = lower + routeWidth * 0.5;
  const decisionX = snapshot.player.position.x + direction * Math.min(5.5, camera.lookAhead - 0.5);
  const progressX = nextProgressMarkerX(snapshot, camera);
  return [
    { id: "player-anchor", kind: "player-anchor", role: "player-anchor", x: snapshot.player.position.x, y: snapshot.player.position.y + 0.9, z: 0, width: 0.7, height: 1.8, depth: 0.7, critical: true, ambient: false, detailRank: 0, color: "#ffffff" },
    { id: "safe-route", kind: "route-ribbon", role: "safe-route", x: routeCenter, y: 0.025, z: 0, width: routeWidth, height: 0.05, depth: 1.35, critical: true, ambient: false, detailRank: 0, color: "#efe8d0" },
    { id: "decision-preview", kind: "decision-window", role: "decision-preview", x: decisionX, y: 0.06, z: 0, width: 2.2, height: 0.08, depth: 2.1, critical: true, ambient: false, detailRank: 0, color: "#f7d35b" },
    { id: "progress-marker", kind: "progress-marker", role: "progress-marker", x: progressX, y: 1.2, z: 0, width: 0.18, height: 2.4, depth: 0.18, critical: true, ambient: false, detailRank: 0, color: "#37a982" },
  ];
}

function identityScore(): number {
  const district = getMainlandMorningDistrict();
  const categories = new Set(district.identitySignals.map(signal => signal.category));
  const core = ["road-geometry", "drainage", "transport", "commerce", "architecture", "pedestrian-motion", "soundscape"];
  return core.filter(category => categories.has(category as never)).length / core.length;
}

function nodeFullyVisibleX(node: WorldNode | undefined, camera: CameraPlan): boolean {
  if (!node) return false;
  const halfWidth = node.width * 0.5;
  return node.x - halfWidth >= camera.visibleWorld.minX && node.x + halfWidth <= camera.visibleWorld.maxX;
}

export function createMainlandMorningPresentation(
  snapshot: EkoRunRenderSnapshot,
  events: readonly SemanticEvent[],
  options: MainlandMorningPresentationOptions,
): MainlandMorningPresentation {
  assertViewport(options.viewport);
  const quality = getQualityProfile(options.quality as string);
  const district = getMainlandMorningDistrict();
  const camera = createCameraPlan(snapshot, options.viewport);
  const authored = district.worldNodes.filter(node => !node.ambient || node.detailRank <= quality.maxDetailRank);
  const nodes = [...criticalNodes(snapshot, camera), ...authored];
  const ambientCount = nodes.filter(node => node.ambient).length;
  const decorativeLoad = Math.min(0.45, ambientCount / Math.max(1, nodes.length) * quality.ambientDensity);
  const direction = snapshot.player.facing;
  const commitmentX = snapshot.player.position.x + direction * camera.lookAhead;
  const decisionSpaceVisible = direction > 0 ? camera.visibleWorld.maxX >= commitmentX : camera.visibleWorld.minX <= commitmentX;
  const progressNode = nodes.find(node => node.role === "progress-marker");
  const comprehension = {
    playerVisible: camera.visibleWorld.minX <= snapshot.player.position.x && camera.visibleWorld.maxX >= snapshot.player.position.x,
    safeRouteVisible: true,
    decisionSpaceVisible,
    progressVisible: nodeFullyVisibleX(progressNode, camera),
    districtReadable: identityScore() >= 0.8,
    pass: false,
  };
  comprehension.pass = comprehension.playerVisible && comprehension.safeRouteVisible && comprehension.decisionSpaceVisible && comprehension.progressVisible && comprehension.districtReadable;
  const presentation: MainlandMorningPresentation = {
    version: 1,
    districtId: "mainland-morning",
    tick: snapshot.tick,
    quality,
    camera,
    nodes: Object.freeze(nodes.map(node => Object.freeze({ ...node }))),
    cues: createPresentationCues(events, options.muted, snapshot.tick),
    motion: Object.freeze({
      maxCameraShake: options.reducedMotion ? 0 : 0.12,
      ambientMotionScale: options.reducedMotion ? 0.2 : quality.distantAnimationScale,
      vehicleMotionScale: options.reducedMotion ? 0.35 : 1,
    }),
    visualHierarchy: Object.freeze(["player", "safe-route", "decision-preview", "progress", "world", "ambience"]),
    comprehension: Object.freeze(comprehension),
    identityScore: identityScore(),
    decorativeLoad,
  };
  return deepFreeze(presentation);
}
