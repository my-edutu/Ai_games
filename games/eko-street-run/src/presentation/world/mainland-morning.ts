import type { MainlandMorningDistrict, MainlandIdentitySignal, WorldNode } from "./types";

const IDENTITY_SIGNALS: readonly MainlandIdentitySignal[] = Object.freeze([
  { id: "mainland-road-camber", category: "road-geometry", description: "Layered asphalt edges, painted lane fragments and compressed roadside shoulders shape the traversal corridor." },
  { id: "open-concrete-drain", category: "drainage", description: "Concrete roadside drainage channels and covered crossing slabs define route edges and local vertical rhythm." },
  { id: "yellow-transit-form", category: "transport", description: "Yellow commercial minibus forms queue, merge and pull away in the street presentation without owning collision truth in Phase 4." },
  { id: "morning-trade", category: "commerce", description: "Kiosks, fruit tables, phone-accessory stands and opening shutters communicate active morning commerce." },
  { id: "mixed-frontage", category: "architecture", description: "Low-rise residential walls, shops, newer concrete facades and utility compounds create a layered mainland streetscape." },
  { id: "pedestrian-flow", category: "pedestrian-motion", description: "Commuter crossings, waiting clusters and purposeful walking directions imply a living morning movement pattern." },
  { id: "morning-sound-bed", category: "soundscape", description: "Distant horns, bus-conductor rhythm, footsteps, shutters and street ambience form a bounded contextual sound bed." },
  { id: "utility-verge", category: "street-furniture", description: "Utility poles, bollards, drainage covers and roadside barriers provide recognizable spatial scale without obscuring the route." },
  { id: "local-wayfinding", category: "wayfinding", description: "Bus-stop and street-direction forms support place recognition but are never required for Lagos identity or gameplay comprehension." },
]);

const WORLD_NODES: readonly WorldNode[] = Object.freeze([
  { id: "road-bed", kind: "asphalt-road", role: "world", x: 13, y: -0.08, z: 0, width: 32, height: 0.16, depth: 7, critical: false, ambient: false, detailRank: 0, color: "#4c5054" },
  { id: "drain-left", kind: "open-drain-preview", role: "world", x: 13, y: -0.2, z: -3.25, width: 30, height: 0.35, depth: 0.45, critical: false, ambient: false, detailRank: 1, color: "#69716f" },
  { id: "walkway-right", kind: "walkway", role: "world", x: 13, y: 0.04, z: 3.45, width: 30, height: 0.12, depth: 1.1, critical: false, ambient: false, detailRank: 1, color: "#b19c7f" },
  { id: "danfo-a", kind: "danfo-preview", role: "world", x: 10.8, y: 0.65, z: -1.75, width: 2.8, height: 2.1, depth: 1.55, critical: false, ambient: false, detailRank: 1, color: "#f2c230" },
  { id: "danfo-b", kind: "danfo-preview", role: "world", x: 22.5, y: 0.65, z: 1.75, width: 2.8, height: 2.1, depth: 1.55, critical: false, ambient: true, detailRank: 3, color: "#e8b923" },
  { id: "roadwork-stack", kind: "roadwork-preview", role: "world", x: 16.4, y: 0.35, z: 2.25, width: 1.8, height: 0.7, depth: 0.8, critical: false, ambient: false, detailRank: 1, color: "#e8842e" },
  { id: "shop-row-a", kind: "shopfront-row", role: "world", x: 7, y: 2.2, z: 5.1, width: 8, height: 4.4, depth: 2.2, critical: false, ambient: false, detailRank: 2, color: "#c58b62" },
  { id: "shop-row-b", kind: "shopfront-row", role: "world", x: 20, y: 2.6, z: 5.4, width: 9, height: 5.2, depth: 2.5, critical: false, ambient: true, detailRank: 3, color: "#a66f55" },
  { id: "compound-wall", kind: "residential-wall", role: "world", x: 14, y: 1.1, z: -5.1, width: 10, height: 2.2, depth: 0.3, critical: false, ambient: false, detailRank: 2, color: "#d7c8ad" },
  { id: "kiosk-a", kind: "street-kiosk", role: "world", x: 5.5, y: 1.2, z: 3.9, width: 1.7, height: 2.4, depth: 1.4, critical: false, ambient: false, detailRank: 2, color: "#4a7e75" },
  { id: "fruit-table", kind: "market-table", role: "ambience", x: 8.1, y: 0.55, z: 3.7, width: 1.5, height: 1.1, depth: 0.9, critical: false, ambient: true, detailRank: 3, color: "#d07b42" },
  { id: "commuter-cluster-a", kind: "pedestrian-cluster", role: "ambience", x: 12.2, y: 0.9, z: 3.5, width: 2, height: 1.8, depth: 0.8, critical: false, ambient: true, detailRank: 4, color: "#735d67" },
  { id: "commuter-cluster-b", kind: "pedestrian-cluster", role: "ambience", x: 24.2, y: 0.9, z: -3.4, width: 1.8, height: 1.8, depth: 0.8, critical: false, ambient: true, detailRank: 4, color: "#557178" },
  { id: "utility-poles", kind: "utility-pole-line", role: "ambience", x: 15, y: 3.2, z: -5.4, width: 25, height: 6.4, depth: 0.2, critical: false, ambient: true, detailRank: 4, color: "#504a43" },
]);

const DISTRICT: MainlandMorningDistrict = Object.freeze({
  id: "mainland-morning",
  displayName: "Mainland Morning",
  identitySignals: IDENTITY_SIGNALS,
  worldNodes: WORLD_NODES,
});

export function getMainlandMorningDistrict(): MainlandMorningDistrict {
  return DISTRICT;
}
