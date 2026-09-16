import type { EkoRunRenderSnapshot, PublicHazardSnapshot } from "../../state/types";
import type { BroadcastHud, BroadcastHudDanger } from "./types";

function hazardRank(hazard: PublicHazardSnapshot): number {
  if (hazard.phase === "hit") return 0;
  if (hazard.phase === "warned") return 1;
  if (hazard.active) return 2;
  return 3;
}

function selectImmediateDanger(snapshot: Readonly<EkoRunRenderSnapshot>): BroadcastHudDanger {
  const candidates = snapshot.hazards
    .filter(hazard => hazard.phase === "warned" || hazard.phase === "hit" || hazard.active)
    .map(hazard => ({ hazard, distance: Math.abs(hazard.x - snapshot.player.position.x) }))
    .sort((a, b) => hazardRank(a.hazard) - hazardRank(b.hazard) || a.distance - b.distance || a.hazard.id.localeCompare(b.hazard.id));
  const selected = candidates[0];
  if (!selected) {
    return {
      visible: false,
      hazardId: null,
      family: null,
      distance: null,
      legalResponses: [],
      captionKey: null,
      visualToken: null,
    };
  }
  return {
    visible: true,
    hazardId: selected.hazard.id,
    family: selected.hazard.family,
    distance: selected.distance,
    legalResponses: [...selected.hazard.legalResponses],
    captionKey: selected.hazard.captionKey,
    visualToken: selected.hazard.visualToken,
  };
}

export function createBroadcastHud(snapshot: Readonly<EkoRunRenderSnapshot>): BroadcastHud {
  if (!snapshot.progression || !snapshot.resources || !snapshot.record) throw new Error("PHASE7_PUBLIC_SNAPSHOT_REQUIRED");
  const nextCheckpointX = snapshot.route.checkpointXs.find(x => x > snapshot.player.position.x) ?? null;
  const delta = snapshot.progress - snapshot.record.maxProgress;
  return {
    primary: {
      districtId: snapshot.progression.districtId,
      cycle: snapshot.progression.cycle,
      progress: snapshot.progress,
      totalDistance: snapshot.progression.totalDistance,
      checkpointIndex: snapshot.player.checkpointIndex,
      checkpointCount: snapshot.route.checkpointXs.length,
      nextCheckpointX,
      pacingBand: snapshot.progression.pacingBand,
    },
    danger: selectImmediateDanger(snapshot),
    record: {
      maxProgress: snapshot.record.maxProgress,
      deltaToRecord: delta,
      status: delta > 1e-9 ? "ahead" : delta < -1e-9 ? "behind" : "tied",
    },
    resources: {
      ekoTokens: snapshot.resources.ekoTokens,
      earnedTokenTotal: snapshot.resources.earnedTokenTotal,
    },
    lifecycle: snapshot.lifecycle,
    future: {
      aiIntent: { status: "not-enabled", label: "AI intent available in Phase 8" },
      viewerWindow: { status: "not-enabled", label: "Viewer influence available in Phase 9" },
    },
  };
}
