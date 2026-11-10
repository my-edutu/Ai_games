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


// A gate may dominate an entire portrait shot WITHOUT touching either
// fighter's rectangle. The prior overlap-only scorer gave that giant cyan
// lock a free +16 framing bonus even while it filled the middle of the duel.
// Measure its real projected viewport footprint as a *soft* composition cost.
// This is an image-space candidate heuristic, not GPU occlusion truth.
function clippedFraction(subject, clip) {
  const width = Math.max(0, Math.min(subject.right, clip.right) -
    Math.max(subject.left, clip.left));
  const height = Math.max(0, Math.min(subject.top, clip.top) -
    Math.max(subject.bottom, clip.bottom));
  const total = (clip.right - clip.left) * (clip.top - clip.bottom);
  return total > 0 ? Math.min(1, width * height / total) : 0;
}
export function guardianGateScreenDominance(heroCorners, guardianCorners, gateCorners) {
  const hero = bounds(heroCorners), guardian = bounds(guardianCorners),
    gate = bounds(gateCorners);
  if (!hero || !guardian || !gate) return 0;
  const center = clippedFraction(gate, {
    left: -.62, right: .62, bottom: -.74, top: .74,
  });
  const viewport = clippedFraction(gate, {
    left: -.94, right: .94, bottom: -.88, top: .88,
  });
  // An exterior landmark beyond both combatants may contribute atmosphere;
  // a foreground or interleaved full-height power barrier owns the shot.
  const nearest = Math.min(hero.depth, guardian.depth),
    farthest = Math.max(hero.depth, guardian.depth);
  const depthWeight = gate.depth <= nearest + .12 ? 1 :
    gate.depth <= farthest + .12 ? .78 : .32;
  return Math.min(1, (.78 * center + .22 * viewport) * depthWeight);
}

// A lens can pass whole-body and core checks yet strand BOTH fighters on
// opposite portrait edges. Preserve subject size/authority, but prefer a
// useful shared action area when selecting among already-valid orbits.
export function guardianDuelEdgePressure(heroCorners, guardianCorners) {
  const hero = bounds(heroCorners), guardian = bounds(guardianCorners);
  if (!hero || !guardian) return 0;
  const edge = subject => {
    const x = Math.abs((subject.left + subject.right) / 2);
    const y = Math.abs((subject.bottom + subject.top) / 2);
    return Math.max(0, (x - .52) / .48, (y - .38) / .62);
  };
  return Math.min(1, Math.max(edge(hero), edge(guardian)));
}


/**
 * The lock is an authentic landmark, but the living duel owns the lens.
 * Give the cap a small, source-HP-earned camera preference without paying
 * a dominant gate framing reward before a genuine guardian defeat.
 * This never changes the barrier, collision, combat or authoritative state.
 */
export function guardianLiveFightLockPriority(circuit) {
  if (!circuit || !Number.isFinite(circuit.health) ||
      !Number.isFinite(circuit.maxHealth) || circuit.maxHealth <= 0 ||
      circuit.health <= 0 || circuit.health > circuit.maxHealth) {
    return { focusBias: 0, frameBonus: 0 };
  }
  const release = Math.max(0, Math.min(1, 1 - circuit.health / circuit.maxHealth));
  const earned = release * release;
  return { focusBias: .014 + .036 * earned, frameBonus: 2 + 5 * earned };
}
