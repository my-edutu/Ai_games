'use strict';
(() => {
  const MIN_SHOT_DWELL_MS = 4200;
  const SHOT_DWELL_MS = MIN_SHOT_DWELL_MS;
  const SHOT_COOLDOWN_MS = 2600;
  const MAX_SHOT_QUEUE = 8;
  const MAX_ZOOM = 2.45;

  let runToken = '';
  let current = null;
  let since = 0;
  let lastChange = 0;
  let lastFrame = 0;
  let view = { x: 0, y: 0, zoom: 1 };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function cellPoint(snapshot, cell) {
    const safe = Number.isFinite(cell) ? Math.max(0, Math.floor(cell)) : snapshot.world.nestCenter;
    return { x: safe % snapshot.world.width + .5, y: Math.floor(safe / snapshot.world.width) + .5 };
  }
  function entityPoint(entity) { return { x: Number(entity?.x ?? 0) + .5, y: Number(entity?.y ?? 0) + .5 }; }
  function newestEvent(snapshot, type) {
    for (let i = snapshot.recentEvents.length - 1; i >= 0; i--) {
      const event = snapshot.recentEvents[i];
      if (!type || event.type === type) return event;
    }
    return null;
  }

  function selectDocumentaryShot(snapshot) {
    if (!snapshot) return null;
    const queen = cellPoint(snapshot, snapshot.world.nestCenter);
    if (snapshot.colony.threat >= 70 || newestEvent(snapshot, 'queen-attacked')) return { kind: 'queen-danger', priority: 100, x: queen.x, y: queen.y, zoom: 2.2 };
    const fighter = snapshot.ants.find(ant => ant.task === 'fight');
    if (fighter && snapshot.predators.length) {
      const predator = snapshot.predators.reduce((best, item) => {
        const distance = Math.abs(item.x - fighter.x) + Math.abs(item.y - fighter.y);
        return !best || distance < best.distance ? { item, distance } : best;
      }, null)?.item;
      const focus = predator ? entityPoint(predator) : entityPoint(fighter);
      return { kind: 'combat', priority: 94, x: focus.x, y: focus.y, zoom: 2.15 };
    }
    if (snapshot.predators.length) {
      const focus = entityPoint(snapshot.predators[0]);
      return { kind: 'predator', priority: 90, x: focus.x, y: focus.y, zoom: 1.95 };
    }
    const tunnel = newestEvent(snapshot, 'tunnel-dug');
    const digger = snapshot.ants.find(ant => ant.task === 'dig');
    if (tunnel || digger) {
      const rawCell = Number(tunnel?.data?.cell);
      const focus = Number.isFinite(rawCell) ? cellPoint(snapshot, rawCell) : entityPoint(digger);
      return { kind: 'excavation', priority: 78, x: focus.x, y: focus.y, zoom: 1.85 };
    }
    if (newestEvent(snapshot, 'milestone')) return { kind: 'milestone', priority: 74, x: queen.x, y: queen.y, zoom: 1.45 };
    if (newestEvent(snapshot, 'ant-born') || snapshot.colony.brood >= 10) return { kind: 'brood', priority: 60, x: queen.x, y: queen.y + 1.1, zoom: 1.7 };
    const carrier = snapshot.ants.find(ant => ant.carryingFood > 0);
    if (carrier) {
      const focus = entityPoint(carrier);
      return { kind: 'foraging', priority: 56, x: focus.x, y: focus.y, zoom: 1.62 };
    }
    return { kind: 'overview', priority: 10, x: snapshot.world.width * .5, y: snapshot.world.height * .52, zoom: 1 };
  }

  function reset(snapshot, now) {
    runToken = snapshot?.runToken || '';
    current = snapshot ? selectDocumentaryShot(snapshot) : null;
    since = now; lastChange = now; lastFrame = now;
    view = current ? { x: current.x, y: current.y, zoom: current.zoom } : { x: 0, y: 0, zoom: 1 };
  }

  function getView(snapshot, now = performance.now(), options = {}) {
    if (!snapshot) return { ...view, shot: current?.kind || 'overview' };
    if (snapshot.runToken !== runToken || !current) reset(snapshot, now);
    const candidate = selectDocumentaryShot(snapshot);
    const age = now - since;
    const cooled = now - lastChange >= SHOT_COOLDOWN_MS;
    const urgent = candidate && candidate.priority >= (current?.priority || 0) + 16;
    if (candidate && ((age >= MIN_SHOT_DWELL_MS && cooled && candidate.kind !== current.kind) || urgent)) {
      current = candidate; since = now; lastChange = now;
    }
    const reducedMotion = Boolean(options.reducedMotion);
    const dt = clamp(now - lastFrame, 0, 80); lastFrame = now;
    const target = current || selectDocumentaryShot(snapshot);
    const ease = reducedMotion ? 1 : 1 - Math.exp(-dt / 520);
    view.x += (target.x - view.x) * ease;
    view.y += (target.y - view.y) * ease;
    view.zoom += (clamp(target.zoom, 1, MAX_ZOOM) - view.zoom) * ease;
    return { x: view.x, y: view.y, zoom: reducedMotion ? Math.min(1.4, view.zoom) : view.zoom, shot: target.kind, priority: target.priority };
  }

  window.AntCameraDirector = Object.freeze({ MIN_SHOT_DWELL_MS, SHOT_DWELL_MS, SHOT_COOLDOWN_MS, MAX_SHOT_QUEUE, selectDocumentaryShot, getView });
})();
