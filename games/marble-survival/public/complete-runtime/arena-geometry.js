'use strict';

/**
 * Presentation geometry planner. Makes real deck openings aligned with
 * authoritative pit rectangles, instead of painting a fake red square on top.
 * No simulation inputs are mutated; both browser WebGL and Node tests can load it.
 */
(function installMarbleArenaGeometry(root) {
  const MAX_HAZARDS = 16;
  const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));

  function deckLayout(arena) {
    if (!arena || !Number.isFinite(arena.width) || !Number.isFinite(arena.height) ||
        arena.width <= 0 || arena.height <= 0) throw new RangeError('arena dimensions');
    const width = arena.width;
    const height = arena.height;
    const hazards = (Array.isArray(arena.hazards) ? arena.hazards : [])
      .filter(h => h && h.kind === 'pit' &&
        [h.x, h.y, h.width, h.height].every(Number.isFinite) &&
        h.width > 0 && h.height > 0)
      .slice(0, MAX_HAZARDS)
      .map(h => ({
        x0: clamp(h.x, 0, width), x1: clamp(h.x + h.width, 0, width),
        y0: clamp(h.y, 0, height), y1: clamp(h.y + h.height, 0, height),
      }))
      .filter(h => h.x1 > h.x0 && h.y1 > h.y0);
    const xs = [...new Set([0, width, ...hazards.flatMap(h => [h.x0, h.x1])])].sort((a,b) => a-b);
    const ys = [...new Set([0, height, ...hazards.flatMap(h => [h.y0, h.y1])])].sort((a,b) => a-b);
    const tiles = [];
    let openingArea = 0;
    for (let xi = 0; xi < xs.length - 1; xi++) {
      for (let yi = 0; yi < ys.length - 1; yi++) {
        const x0 = xs[xi], x1 = xs[xi+1], y0 = ys[yi], y1 = ys[yi+1];
        const cx = (x0 + x1) * 0.5, cy = (y0 + y1) * 0.5;
        const open = hazards.some(h => cx >= h.x0 && cx < h.x1 && cy >= h.y0 && cy < h.y1);
        if (open) { openingArea += (x1-x0)*(y1-y0); continue; }
        tiles.push({x:x0,y:y0,width:x1-x0,height:y1-y0});
      }
    }
    return {
      tiles, openings: hazards,
      openingArea,
      solidArea: tiles.reduce((sum,tile) => sum + tile.width*tile.height,0),
      worldArea: width*height,
    };
  }

  const api = Object.freeze({ deckLayout });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MarbleArenaGeometry = api;
})(typeof window !== 'undefined' ? window : undefined);
