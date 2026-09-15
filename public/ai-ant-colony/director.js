'use strict';
(() => {
  const MIN_SHOT_DWELL_MS = 4800;
  const SHOT_DWELL_MS = MIN_SHOT_DWELL_MS;
  const SHOT_COOLDOWN_MS = 3000;
  const MAX_SHOT_QUEUE = 8;
  const MAX_ZOOM = 2.28;
  const MAX_CHAMBER_LIGHTS = 42;
  const MAX_SOIL_MOTES = 72;

  const SHOT_PROFILES = Object.freeze({
    overview: Object.freeze({ zoom: 1, dwell: 6800, subjectX: 0, subjectY: 0 }),
    'queen-danger': Object.freeze({ zoom: 2.08, dwell: 5200, subjectX: 0, subjectY: .03 }),
    combat: Object.freeze({ zoom: 2.05, dwell: 5000, subjectX: .03, subjectY: 0 }),
    predator: Object.freeze({ zoom: 1.82, dwell: 5400, subjectX: .05, subjectY: -.02 }),
    excavation: Object.freeze({ zoom: 1.72, dwell: 5600, subjectX: -.03, subjectY: .02 }),
    milestone: Object.freeze({ zoom: 1.34, dwell: 6200, subjectX: 0, subjectY: .03 }),
    brood: Object.freeze({ zoom: 1.58, dwell: 5600, subjectX: -.04, subjectY: .02 }),
    foraging: Object.freeze({ zoom: 1.48, dwell: 5600, subjectX: .06, subjectY: -.06 })
  });

  let runToken = '';
  let current = null;
  let since = 0;
  let lastChange = 0;
  let lastFrame = 0;
  let view = { x: 0, y: 0, zoom: 1 };
  let cinematicCanvas = null;
  let cinematicContext = null;
  let cinematicStopped = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function hash(value) {
    let x = (Number(value) || 0) | 0;
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    return (x ^ (x >>> 16)) >>> 0;
  }
  const hash01 = value => (hash(value) % 10000) / 10000;

  function cellPoint(snapshot, cell) {
    const safe = Number.isFinite(cell) ? Math.max(0, Math.floor(cell)) : snapshot.world.nestCenter;
    return { x: safe % snapshot.world.width + .5, y: Math.floor(safe / snapshot.world.width) + .5 };
  }
  function entityPoint(entity) {
    return { x: Number(entity?.x ?? 0) + .5, y: Number(entity?.y ?? 0) + .5 };
  }
  function midpoint(a, b) {
    return { x: (a.x + b.x) * .5, y: (a.y + b.y) * .5 };
  }
  function newestEvent(snapshot, type) {
    for (let i = snapshot.recentEvents.length - 1; i >= 0; i--) {
      const event = snapshot.recentEvents[i];
      if (!type || event.type === type) return event;
    }
    return null;
  }
  function shot(kind, priority, point, zoom) {
    const profile = SHOT_PROFILES[kind] || SHOT_PROFILES.overview;
    return { kind, priority, x: point.x, y: point.y, zoom: zoom || profile.zoom };
  }

  function selectDocumentaryShot(snapshot) {
    if (!snapshot) return null;
    const queen = cellPoint(snapshot, snapshot.world.nestCenter);
    if (snapshot.colony.threat >= 70 || newestEvent(snapshot, 'queen-attacked')) {
      return shot('queen-danger', 100, queen);
    }

    const fighter = snapshot.ants.find(ant => ant.task === 'fight');
    if (fighter && snapshot.predators.length) {
      const fighterPoint = entityPoint(fighter);
      const predator = snapshot.predators.reduce((best, item) => {
        const distance = Math.abs(item.x - fighter.x) + Math.abs(item.y - fighter.y);
        return !best || distance < best.distance ? { item, distance } : best;
      }, null)?.item;
      const focus = predator ? midpoint(fighterPoint, entityPoint(predator)) : fighterPoint;
      return shot('combat', 94, focus);
    }

    if (snapshot.predators.length) {
      const predator = entityPoint(snapshot.predators[0]);
      const entrance = cellPoint(snapshot, snapshot.world.entrance);
      return shot('predator', 90, midpoint(predator, entrance));
    }

    const tunnel = newestEvent(snapshot, 'tunnel-dug');
    const digger = snapshot.ants.find(ant => ant.task === 'dig');
    if (tunnel || digger) {
      const rawCell = Number(tunnel?.data?.cell);
      const focus = Number.isFinite(rawCell) ? cellPoint(snapshot, rawCell) : entityPoint(digger);
      return shot('excavation', 78, focus);
    }

    if (newestEvent(snapshot, 'milestone')) return shot('milestone', 74, queen);
    if (newestEvent(snapshot, 'ant-born') || snapshot.colony.brood >= 10) {
      return shot('brood', 60, { x: queen.x - .35, y: queen.y + .85 });
    }

    const carrier = snapshot.ants.find(ant => ant.carryingFood > 0);
    if (carrier) {
      const carrierPoint = entityPoint(carrier);
      const entrance = cellPoint(snapshot, snapshot.world.entrance);
      return shot('foraging', 56, midpoint(carrierPoint, entrance));
    }

    return shot('overview', 10, { x: snapshot.world.width * .5, y: snapshot.world.height * .51 });
  }

  function composeShot(snapshot, candidate) {
    if (!candidate) return null;
    const profile = SHOT_PROFILES[candidate.kind] || SHOT_PROFILES.overview;
    const zoom = clamp(Number(candidate.zoom || profile.zoom || 1), 1, MAX_ZOOM);
    const visibleWorldWidth = snapshot.world.width / zoom;
    const visibleWorldHeight = snapshot.world.height / zoom;
    const subjectOffsetX = profile.subjectX * visibleWorldWidth;
    const subjectOffsetY = profile.subjectY * visibleWorldHeight;
    const halfW = Math.min(snapshot.world.width * .5, visibleWorldWidth * .5);
    const halfH = Math.min(snapshot.world.height * .5, visibleWorldHeight * .5);
    const minX = halfW, maxX = Math.max(minX, snapshot.world.width - halfW);
    const minY = halfH, maxY = Math.max(minY, snapshot.world.height - halfH);
    return {
      ...candidate,
      zoom,
      x: clamp(candidate.x - subjectOffsetX, minX, maxX),
      y: clamp(candidate.y - subjectOffsetY, minY, maxY),
      dwell: profile.dwell
    };
  }

  function reset(snapshot, now) {
    runToken = snapshot?.runToken || '';
    current = snapshot ? composeShot(snapshot, selectDocumentaryShot(snapshot)) : null;
    since = now;
    lastChange = now;
    lastFrame = now;
    view = current ? { x: current.x, y: current.y, zoom: current.zoom } : { x: 0, y: 0, zoom: 1 };
  }

  function getView(snapshot, now = performance.now(), options = {}) {
    if (!snapshot) return { ...view, shot: current?.kind || 'overview' };
    if (snapshot.runToken !== runToken || !current) reset(snapshot, now);
    const candidate = composeShot(snapshot, selectDocumentaryShot(snapshot));
    const age = now - since;
    const cooled = now - lastChange >= SHOT_COOLDOWN_MS;
    const urgent = candidate && candidate.priority >= (current?.priority || 0) + 16;
    const dwell = current?.dwell || MIN_SHOT_DWELL_MS;
    if (candidate && ((age >= dwell && cooled && candidate.kind !== current.kind) || urgent)) {
      current = candidate;
      since = now;
      lastChange = now;
    } else if (candidate && candidate.kind === current.kind) {
      current = { ...candidate, dwell: current.dwell || candidate.dwell };
    }

    const reducedMotion = Boolean(options.reducedMotion);
    const dt = clamp(now - lastFrame, 0, 80);
    lastFrame = now;
    const target = current || candidate;
    const ease = reducedMotion ? 1 : 1 - Math.exp(-dt / 620);
    view.x += (target.x - view.x) * ease;
    view.y += (target.y - view.y) * ease;
    view.zoom += (clamp(target.zoom, 1, MAX_ZOOM) - view.zoom) * ease;

    const overviewDrift = !reducedMotion && target.kind === 'overview' ? Math.sin(now / 5200) * .055 : 0;
    return {
      x: view.x + overviewDrift,
      y: view.y,
      zoom: reducedMotion ? Math.min(1.34, view.zoom) : view.zoom,
      shot: target.kind,
      priority: target.priority
    };
  }

  function resizeCinematicCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    return { rect, dpr, width: rect.width, height: rect.height };
  }

  function screenTransform(snapshot, width, height, camera) {
    const zoom = clamp(Number(camera.zoom || 1), 1, MAX_ZOOM);
    const sx = width / snapshot.world.width * zoom;
    const sy = height / snapshot.world.height * zoom;
    const tx = width * .5 - camera.x * sx;
    const ty = height * .5 - camera.y * sy;
    return {
      sx, sy, tx, ty, cellPx: Math.min(sx, sy),
      point(x, y) { return { x: x * sx + tx, y: y * sy + ty }; }
    };
  }

  function dayLight(snapshot) {
    const p = clamp(Number(snapshot.environment.dayProgress ?? 0), 0, .999999);
    if (p < .16 || p >= .84) return { strength: .12, warmth: 0, night: true };
    if (p < .28) return { strength: .28, warmth: .9, night: false };
    if (p < .72) return { strength: .22, warmth: .28, night: false };
    return { strength: .26, warmth: .82, night: false };
  }

  function drawSurfaceVolume(ctx, snapshot, transform, width, height) {
    const surfaceY = transform.point(0, snapshot.world.surfaceRow).y;
    if (surfaceY < -120 || surfaceY > height + 120) return;
    const light = dayLight(snapshot);

    const horizon = ctx.createLinearGradient(0, surfaceY - 72, 0, surfaceY + 54);
    horizon.addColorStop(0, light.night ? 'rgba(105,139,150,.02)' : `rgba(255,224,174,${.045 + light.strength * .13})`);
    horizon.addColorStop(.48, light.night ? 'rgba(143,174,176,.055)' : `rgba(232,204,151,${.08 + light.strength * .12})`);
    horizon.addColorStop(.54, 'rgba(36,22,13,.02)');
    horizon.addColorStop(1, 'rgba(18,10,7,.16)');
    ctx.fillStyle = horizon;
    ctx.fillRect(0, Math.max(0, surfaceY - 76), width, Math.min(height, 136));

    if (!light.night) {
      const sunX = width * .82, sunY = Math.max(32, surfaceY * .23);
      const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, Math.max(90, width * .19));
      glow.addColorStop(0, `rgba(255,232,188,${.08 + light.strength * .14})`);
      glow.addColorStop(.32, `rgba(246,211,158,${.04 + light.strength * .07})`);
      glow.addColorStop(1, 'rgba(246,211,158,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, Math.max(0, surfaceY));
    }
  }

  function drawChamberVolume(ctx, snapshot, transform, width, height, camera) {
    const { tiles } = snapshot.world;
    const chamberCells = [];
    for (let cell = 0; cell < tiles.length && chamberCells.length < MAX_CHAMBER_LIGHTS; cell++) {
      if (tiles[cell] === 3) chamberCells.push(cell);
    }

    for (const cell of chamberCells) {
      const x = cell % snapshot.world.width + .5;
      const y = Math.floor(cell / snapshot.world.width) + .5;
      const p = transform.point(x, y);
      if (p.x < -80 || p.y < -80 || p.x > width + 80 || p.y > height + 80) continue;
      const queen = cell === snapshot.world.nestCenter;
      const radius = clamp(transform.cellPx * (queen ? 1.55 : 1.1), 18, queen ? 88 : 58);
      const glow = ctx.createRadialGradient(p.x, p.y - radius * .12, radius * .08, p.x, p.y, radius);
      if (queen) {
        glow.addColorStop(0, snapshot.colony.threat > 55 ? 'rgba(229,122,84,.19)' : 'rgba(231,190,117,.16)');
        glow.addColorStop(.42, 'rgba(201,144,82,.065)');
      } else {
        glow.addColorStop(0, 'rgba(222,181,119,.075)');
        glow.addColorStop(.42, 'rgba(177,121,72,.035)');
      }
      glow.addColorStop(1, 'rgba(78,39,20,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, radius * 1.08, radius * .76, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = queen ? 'rgba(246,211,151,.11)' : 'rgba(235,197,139,.055)';
      ctx.lineWidth = queen ? 1.35 : .8;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 1, radius * .76, radius * .48, 0, Math.PI * 1.06, Math.PI * 1.94);
      ctx.stroke();
    }

    const focus = transform.point(camera.x, camera.y);
    const strength = camera.shot === 'queen-danger' || camera.shot === 'combat' ? .22 :
      camera.shot === 'excavation' || camera.shot === 'brood' ? .16 :
      camera.shot === 'foraging' || camera.shot === 'predator' ? .12 : .07;
    const radius = Math.max(width, height) * (camera.shot === 'overview' ? .72 : .52);
    const vignette = ctx.createRadialGradient(focus.x, focus.y, radius * .16, focus.x, focus.y, radius);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(.62, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, `rgba(2,3,2,${strength})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  function drawSoilMotes(ctx, snapshot, transform, width, height) {
    const surfaceY = transform.point(0, snapshot.world.surfaceRow).y;
    const bottom = transform.point(0, snapshot.world.height).y;
    const minY = Math.max(0, surfaceY);
    const maxY = Math.min(height, bottom);
    if (maxY <= minY) return;

    for (let i = 0; i < MAX_SOIL_MOTES; i++) {
      const seed = hash(i * 811 + snapshot.environment.day * 19);
      const worldX = hash01(seed) * snapshot.world.width;
      const worldY = snapshot.world.surfaceRow + hash01(seed + 13) * (snapshot.world.height - snapshot.world.surfaceRow);
      const p = transform.point(worldX, worldY);
      if (p.x < 0 || p.x > width || p.y < minY || p.y > maxY) continue;
      const depth = clamp((worldY - snapshot.world.surfaceRow) / Math.max(1, snapshot.world.height - snapshot.world.surfaceRow), 0, 1);
      const radius = .45 + hash01(seed + 31) * 1.15;
      ctx.fillStyle = `rgba(224,190,145,${.018 + (1 - depth) * .025})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCinematicFrame(snapshot, now) {
    if (!cinematicCanvas || !cinematicContext || !snapshot) return;
    const { dpr, width, height } = resizeCinematicCanvas(cinematicCanvas);
    const reducedMotion = document.body.dataset.reducedMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const camera = getView(snapshot, now, { reducedMotion });
    const transform = screenTransform(snapshot, width, height, camera);
    const ctx = cinematicContext;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    drawSurfaceVolume(ctx, snapshot, transform, width, height);
    drawChamberVolume(ctx, snapshot, transform, width, height, camera);
    drawSoilMotes(ctx, snapshot, transform, width, height);
    const metrics = window.__ANT_RENDER_METRICS__;
    if (metrics) {
      metrics.cinematicLayer = true;
      metrics.cinematicShot = camera.shot;
      metrics.cinematicLights = Math.min(MAX_CHAMBER_LIGHTS, snapshot.world.tiles.filter(tile => tile === 3).length);
    }
  }

  function mountCinematicLayer() {
    const stage = document.getElementById('ecosystem-stage');
    const entityCanvas = document.getElementById('entity-canvas');
    if (!stage || !entityCanvas) return;
    cinematicCanvas = document.getElementById('cinematic-canvas');
    if (!cinematicCanvas) {
      cinematicCanvas = document.createElement('canvas');
      cinematicCanvas.id = 'cinematic-canvas';
      cinematicCanvas.setAttribute('aria-hidden', 'true');
      stage.insertBefore(cinematicCanvas, entityCanvas);
    }
    cinematicContext = cinematicCanvas.getContext('2d', { alpha: true, desynchronized: true });
    const frame = now => {
      if (cinematicStopped) return;
      drawCinematicFrame(window.__ANT_PUBLIC_STATE__, now);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    window.addEventListener('pagehide', () => {
      cinematicStopped = true;
      if (cinematicCanvas) {
        cinematicCanvas.width = 1;
        cinematicCanvas.height = 1;
      }
    }, { once: true });
  }

  window.AntCameraDirector = Object.freeze({
    MIN_SHOT_DWELL_MS,
    SHOT_DWELL_MS,
    SHOT_COOLDOWN_MS,
    MAX_SHOT_QUEUE,
    MAX_ZOOM,
    SHOT_PROFILES,
    selectDocumentaryShot,
    composeShot,
    getView
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountCinematicLayer, { once: true });
  } else {
    mountCinematicLayer();
  }
})();
