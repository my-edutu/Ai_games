'use strict';

(function exposeRenderPolicy(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SnakeRenderPolicy = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const QUALITIES = Object.freeze(['low', 'balanced', 'high', 'ultra']);
  const DIRECTIONS = Object.freeze({
    up: Object.freeze({ x: 0, y: -1 }),
    right: Object.freeze({ x: 1, y: 0 }),
    down: Object.freeze({ x: 0, y: 1 }),
    left: Object.freeze({ x: -1, y: 0 }),
  });

  function normalizeQuality(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return QUALITIES.includes(normalized) ? normalized : 'balanced';
  }

  function qualitySettings(value, devicePixelRatio = 1) {
    const quality = normalizeQuality(value);
    const dpr = Number.isFinite(devicePixelRatio) ? Math.max(1, devicePixelRatio) : 1;
    const profiles = {
      low: { pixelRatio: Math.min(1, dpr), particleLimit: 48, particleBurst: 6, gridStride: 2, shadows: false, portalRings: 1, detail: 0.45 },
      balanced: { pixelRatio: Math.min(1.25, dpr), particleLimit: 96, particleBurst: 10, gridStride: 1, shadows: true, portalRings: 2, detail: 0.7 },
      high: { pixelRatio: Math.min(1.5, dpr), particleLimit: 160, particleBurst: 14, gridStride: 1, shadows: true, portalRings: 3, detail: 0.88 },
      ultra: { pixelRatio: Math.min(2, dpr), particleLimit: 240, particleBurst: 18, gridStride: 1, shadows: true, portalRings: 4, detail: 1 },
    };
    return Object.freeze({ quality, ...profiles[quality], simulationRate: 1 });
  }

  function cellPosition(cell, width) {
    return { x: cell % width, y: Math.floor(cell / width) };
  }

  function distanceBetweenCells(a, b, width) {
    const from = cellPosition(a, width);
    const to = cellPosition(b, width);
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  }

  function interpolationPoint(fromCell, toCell, width, alpha) {
    const from = cellPosition(fromCell, width);
    const to = cellPosition(toCell, width);
    const amount = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
    const teleported = distanceBetweenCells(fromCell, toCell, width) > 1;
    if (teleported) return amount < 0.5 ? { ...from, teleported: true } : { ...to, teleported: true };
    return {
      x: from.x + (to.x - from.x) * amount,
      y: from.y + (to.y - from.y) * amount,
      teleported: false,
    };
  }

  function foodBurstKey(previousSnapshot, nextSnapshot) {
    if (!previousSnapshot || !nextSnapshot) return null;
    if (previousSnapshot.runToken !== nextSnapshot.runToken) return null;
    if (nextSnapshot.foodsCollected <= previousSnapshot.foodsCollected) return null;
    return `${nextSnapshot.runToken}:${nextSnapshot.foodsCollected}`;
  }

  function clampConfidence(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  }

  function decisionSummary(ai, occupancy = 0) {
    const mode = String(ai?.mode || 'replan');
    const confidence = clampConfidence(ai?.confidence);
    const occupied = Math.max(0, Math.min(100, Math.round((Number(occupancy) || 0) * 100)));
    if (mode === 'seek-food') return `Safe food route selected · ${confidence}% confidence`;
    if (mode === 'follow-tail') return `Following tail to reopen safe territory · ${confidence}% confidence`;
    if (mode === 'preserve-space') return `Preserving escape space · arena ${occupied}% occupied`;
    if (mode === 'cycle-fill') return `High occupancy · maintaining long-horizon board coverage`;
    if (mode === 'escape-hazard') return `Hazard escape route prioritized · ${confidence}% confidence`;
    if (mode === 'fallback-survival') return 'No planned route passed safety checks · deterministic fallback';
    if (mode === 'replan') return `Repeated state detected · selecting alternate safe route`;
    return `Survival route active · ${confidence}% confidence`;
  }

  function vectorBetween(a, b, width) {
    const from = cellPosition(a, width);
    const to = cellPosition(b, width);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
    return { x: Math.sign(dx), y: Math.sign(dy) };
  }

  function inferHeadDirection(snapshot, previousSnapshot) {
    const width = Number(snapshot?.width) || 1;
    const head = snapshot?.snake?.[0]?.cell;
    const neck = snapshot?.snake?.[1]?.cell;
    if (Number.isInteger(head) && Number.isInteger(neck)) {
      const fromNeck = vectorBetween(neck, head, width);
      if (fromNeck) return fromNeck;
    }

    const previousHead = previousSnapshot?.snake?.[0]?.cell;
    if (Number.isInteger(previousHead) && Number.isInteger(head)) {
      const direct = vectorBetween(previousHead, head, width);
      if (direct) return direct;
      for (const portal of snapshot?.portals || []) {
        if (portal.exit === head) {
          const intoEntry = vectorBetween(previousHead, portal.entry, width);
          if (intoEntry) return intoEntry;
        }
        if (portal.entry === head) {
          const intoExit = vectorBetween(previousHead, portal.exit, width);
          if (intoExit) return intoExit;
        }
      }
    }

    return DIRECTIONS.right;
  }

  return Object.freeze({
    QUALITIES,
    normalizeQuality,
    qualitySettings,
    cellPosition,
    interpolationPoint,
    foodBurstKey,
    decisionSummary,
    inferHeadDirection,
  });
});
