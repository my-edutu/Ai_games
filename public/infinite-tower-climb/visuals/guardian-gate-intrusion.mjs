// An authentic guardian gate must remain visibly locked, but it must not
// obscure the live hero or boss merely because the doorway itself is framed.
// This read-only camera-selection heuristic consumes already-projected REAL
// world silhouettes. It cannot retract a seal, alter hits, move actors,
// change deterministic simulation, or fake the victory.
// Each rectangle is the 4 actual corner projections [ndcX, ndcY, depth].
const finite = Number.isFinite;
function bounds(corners) {
  if (!Array.isArray(corners) || corners.length !== 4 ||
      corners.some(p => !Array.isArray(p) || p.length !== 3 ||
        !p.every(finite) || p[2] <= 0)) return null;
  return {
    left: Math.min(...corners.map(p => p[0])),
    right: Math.max(...corners.map(p => p[0])),
    bottom: Math.min(...corners.map(p => p[1])),
    top: Math.max(...corners.map(p => p[1])),
    depth: corners.reduce((sum, p) => sum + p[2], 0) / 4,
  };
}
function overlap(subject, gate) {
  const area = (subject.right - subject.left) *
    (subject.top - subject.bottom);
  if (area <= 1e-6) return 0;
  const common = Math.max(0, Math.min(subject.right, gate.right) -
    Math.max(subject.left, gate.left)) *
    Math.max(0, Math.min(subject.top, gate.top) -
    Math.max(subject.bottom, gate.bottom));
  // A background structure can still be visually distracting; its penalty is
  // intentionally weaker than an actual foreground intersection.
  return Math.min(1, common / area) *
    (gate.depth <= subject.depth + .12 ? 1 : .27);
}
export function guardianGateSilhouetteInterference(heroCorners, guardianCorners, gateCorners) {
  const hero = bounds(heroCorners), guardian = bounds(guardianCorners),
    gate = bounds(gateCorners);
  if (!hero || !guardian || !gate) return 0;
  return Math.max(overlap(hero, gate), overlap(guardian, gate));
}
