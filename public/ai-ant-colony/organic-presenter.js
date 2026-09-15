'use strict';
(() => {
  const MAX_SURFACE_STEMS = 64;
  const MAX_FOREGROUND_ROOTS = 16;
  const MAX_ORGANIC_CONNECTIONS = 520;
  const MAX_ORGANIC_CHAMBERS = 72;
  const MAX_CHAMBER_CONTENTS = 12;
  const MAX_AMBIENT_STONES = 28;
  const MAX_LEAF_LITTER = 24;
  const MAX_DPR = 2;

  let canvas = null;
  let ctx = null;
  let stopped = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function hash(value) {
    let x = (Number(value) || 0) | 0;
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
    return (x ^ (x >>> 16)) >>> 0;
  }
  const hash01 = value => (hash(value) % 10000) / 10000;
  const rgba = (rgb, alpha) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  const isOpen = tile => tile === 1 || tile === 3;

  function resize(target) {
    const rect = target.getBoundingClientRect();
    const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    const pixelWidth = Math.max(1, Math.round(rect.width * dpr));
    const pixelHeight = Math.max(1, Math.round(rect.height * dpr));
    if (target.width !== pixelWidth || target.height !== pixelHeight) {
      target.width = pixelWidth;
      target.height = pixelHeight;
    }
    return { width: rect.width, height: rect.height, dpr };
  }

  function cameraView(snapshot, now) {
    const reducedMotion = document.body.dataset.reducedMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
    const director = window.AntCameraDirector;
    if (director?.getView) return director.getView(snapshot, now, { reducedMotion });
    return { x: snapshot.world.width * .5, y: snapshot.world.height * .5, zoom: 1, shot: 'overview' };
  }

  function transformFor(snapshot, width, height, view) {
    const zoom = clamp(Number(view?.zoom || 1), 1, 2.5);
    const sx = width / snapshot.world.width * zoom;
    const sy = height / snapshot.world.height * zoom;
    const cx = Number(view?.x ?? snapshot.world.width * .5);
    const cy = Number(view?.y ?? snapshot.world.height * .5);
    return {
      sx, sy,
      tx: width * .5 - cx * sx,
      ty: height * .5 - cy * sy,
      cellPx: Math.min(sx, sy),
      point(x, y) { return { x: x * sx + this.tx, y: y * sy + this.ty }; }
    };
  }

  function soilRgb(snapshot, worldY) {
    const { surfaceRow, height } = snapshot.world;
    const depth = clamp((worldY - surfaceRow) / Math.max(1, height - surfaceRow), 0, 1);
    const wet = snapshot.environment.weather === 'rain' || snapshot.environment.weather === 'storm';
    const cold = snapshot.environment.season === 'winter';
    const autumn = snapshot.environment.season === 'autumn';
    const base = cold ? [83, 72, 62] : autumn ? [105, 67, 43] : [102, 68, 44];
    return [
      clamp(Math.round(base[0] - depth * 46 - (wet ? 9 : 0)), 28, 118),
      clamp(Math.round(base[1] - depth * 35 + (wet ? 2 : 0)), 22, 86),
      clamp(Math.round(base[2] - depth * 23 + (wet ? 6 : 0)), 17, 70)
    ];
  }

  function blobPath(context, cx, cy, rx, ry, seed, wobble = .12) {
    const points = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2;
      const variation = 1 + (hash01(seed + i * 31) - .5) * wobble * 2;
      points.push({ x: cx + Math.cos(angle) * rx * variation, y: cy + Math.sin(angle) * ry * variation });
    }
    const first = points[0], last = points[count - 1];
    context.beginPath();
    context.moveTo((first.x + last.x) * .5, (first.y + last.y) * .5);
    for (let i = 0; i < count; i++) {
      const point = points[i], next = points[(i + 1) % count];
      context.quadraticCurveTo(point.x, point.y, (point.x + next.x) * .5, (point.y + next.y) * .5);
    }
    context.closePath();
  }

  function connectionPath(context, a, b, cellPx, seed) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / length, ny = dx / length;
    const bend = (hash01(seed) - .5) * cellPx * .42;
    const mx = (a.x + b.x) * .5 + nx * bend;
    const my = (a.y + b.y) * .5 + ny * bend;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.quadraticCurveTo(mx, my, b.x, b.y);
  }

  function chamberKind(snapshot, cell) {
    if (cell === snapshot.world.nestCenter) return 'queen';
    const x = cell % snapshot.world.width;
    const y = Math.floor(cell / snapshot.world.width);
    const nx = snapshot.world.nestCenter % snapshot.world.width;
    const ny = Math.floor(snapshot.world.nestCenter / snapshot.world.width);
    const dx = x - nx, dy = y - ny;
    if (snapshot.colony.brood > 0 && dx < 0 && Math.abs(dx) >= Math.abs(dy)) return 'nursery';
    if (snapshot.colony.foodStore > 0 && dx > 0 && Math.abs(dx) >= Math.abs(dy)) return 'storage';
    if (snapshot.colony.threat > 35 && dy < 0) return 'defense';
    if (snapshot.ants.some(ant => ant.task === 'dig' && Math.abs(ant.x - x) + Math.abs(ant.y - y) <= 2)) return 'expansion';
    return 'general';
  }

  function drawChamberContents(context, snapshot, kind, point, cellPx, seed) {
    if (kind === 'storage' && snapshot.colony.foodStore > 0) {
      const count = Math.min(MAX_CHAMBER_CONTENTS, 3 + Math.floor(snapshot.colony.foodStore / 20));
      for (let i = 0; i < count; i++) {
        const angle = hash01(seed + i * 17) * Math.PI * 2;
        const radius = cellPx * (.08 + hash01(seed + i * 23) * .31);
        context.fillStyle = `rgba(194,151,73,${.35 + hash01(seed + i * 29) * .2})`;
        context.beginPath();
        context.ellipse(point.x + Math.cos(angle) * radius, point.y + Math.sin(angle) * radius * .62, cellPx * .06, cellPx * .035, angle, 0, Math.PI * 2);
        context.fill();
      }
    }
    if (kind === 'nursery' && snapshot.colony.brood > 0) {
      const count = Math.min(MAX_CHAMBER_CONTENTS, 3 + Math.floor(snapshot.colony.brood / 9));
      for (let i = 0; i < count; i++) {
        const px = point.x + (hash01(seed + i * 37) - .5) * cellPx * .58;
        const py = point.y + (hash01(seed + i * 41) - .5) * cellPx * .34;
        context.fillStyle = i % 3 === 0 ? 'rgba(229,209,165,.42)' : 'rgba(239,224,192,.34)';
        context.beginPath();
        context.ellipse(px, py, cellPx * .045, cellPx * .075, (hash01(seed + i * 43) - .5) * .8, 0, Math.PI * 2);
        context.fill();
      }
    }
    if (kind === 'defense') {
      context.strokeStyle = 'rgba(184,91,67,.16)';
      context.lineWidth = Math.max(1, cellPx * .035);
      for (let i = 0; i < 3; i++) {
        const angle = -.85 + i * .85;
        context.beginPath();
        context.moveTo(point.x + Math.cos(angle) * cellPx * .22, point.y + Math.sin(angle) * cellPx * .17);
        context.lineTo(point.x + Math.cos(angle) * cellPx * .5, point.y + Math.sin(angle) * cellPx * .4);
        context.stroke();
      }
    }
  }

  function drawOrganicNetwork(context, snapshot, transform, width, height) {
    const { width: worldW, height: worldH, tiles } = snapshot.world;
    const cellPx = clamp(transform.cellPx, 6, 46);
    let connections = 0;
    let chambers = 0;

    context.save();
    context.lineCap = 'round';
    context.lineJoin = 'round';

    for (let cell = 0; cell < tiles.length && connections < MAX_ORGANIC_CONNECTIONS; cell++) {
      if (!isOpen(tiles[cell])) continue;
      const x = cell % worldW, y = Math.floor(cell / worldW);
      const from = transform.point(x + .5, y + .5);
      const candidates = [];
      if (x + 1 < worldW && isOpen(tiles[cell + 1])) candidates.push(cell + 1);
      if (y + 1 < worldH && isOpen(tiles[cell + worldW])) candidates.push(cell + worldW);
      for (const next of candidates) {
        if (connections >= MAX_ORGANIC_CONNECTIONS) break;
        const nx = next % worldW, ny = Math.floor(next / worldW);
        const to = transform.point(nx + .5, ny + .5);
        if ((from.x < -cellPx && to.x < -cellPx) || (from.y < -cellPx && to.y < -cellPx) || (from.x > width + cellPx && to.x > width + cellPx) || (from.y > height + cellPx && to.y > height + cellPx)) continue;
        const earth = soilRgb(snapshot, (y + ny) * .5 + .5);
        const seed = hash(cell * 131 + next * 17);

        connectionPath(context, from, to, cellPx, seed);
        context.strokeStyle = rgba(earth, .99);
        context.lineWidth = cellPx * 1.02;
        context.stroke();

        connectionPath(context, from, to, cellPx, seed);
        context.strokeStyle = 'rgba(17,10,7,.995)';
        context.lineWidth = cellPx * .47;
        context.stroke();

        connectionPath(context, from, to, cellPx, seed);
        context.strokeStyle = 'rgba(239,199,137,.06)';
        context.lineWidth = Math.max(.75, cellPx * .045);
        context.stroke();
        connections++;
      }
    }

    for (let cell = 0; cell < tiles.length && chambers < MAX_ORGANIC_CHAMBERS; cell++) {
      if (tiles[cell] !== 3) continue;
      const x = cell % worldW, y = Math.floor(cell / worldW);
      const point = transform.point(x + .5, y + .5);
      if (point.x < -cellPx * 2 || point.y < -cellPx * 2 || point.x > width + cellPx * 2 || point.y > height + cellPx * 2) continue;
      const kind = chamberKind(snapshot, cell);
      const queen = kind === 'queen';
      const seed = hash(cell * 911 + 7);
      const rx = cellPx * (queen ? 1.05 : .75 + hash01(seed + 2) * .18);
      const ry = cellPx * (queen ? .76 : .54 + hash01(seed + 3) * .14);
      const angle = (hash01(seed + 4) - .5) * .22;
      const earth = soilRgb(snapshot, y + .5);

      context.save();
      context.translate(point.x, point.y);
      context.rotate(angle);
      blobPath(context, 0, 0, rx * 1.2, ry * 1.22, seed + 11, .14);
      context.fillStyle = rgba(earth, .995);
      context.fill();

      const cavity = context.createRadialGradient(-rx * .22, -ry * .28, cellPx * .05, 0, 0, Math.max(rx, ry));
      const tint = kind === 'queen' ? [72, 39, 22] : kind === 'nursery' ? [59, 43, 29] : kind === 'storage' ? [57, 38, 21] : kind === 'defense' ? [58, 29, 22] : [44, 28, 20];
      cavity.addColorStop(0, rgba(tint, .99));
      cavity.addColorStop(.62, 'rgba(25,15,10,.995)');
      cavity.addColorStop(1, 'rgba(11,7,5,.995)');
      blobPath(context, 0, 0, rx, ry, seed + 29, .11);
      context.fillStyle = cavity;
      context.fill();
      context.strokeStyle = queen ? 'rgba(246,201,128,.22)' : 'rgba(225,179,115,.1)';
      context.lineWidth = queen ? Math.max(1.25, cellPx * .07) : Math.max(.8, cellPx * .038);
      context.stroke();
      context.restore();

      drawChamberContents(context, snapshot, kind, point, cellPx, seed);
      chambers++;
    }
    context.restore();
    return { connections, chambers };
  }

  function drawSurfaceLife(context, snapshot, transform, width, height, now, reducedMotion) {
    const surfaceY = transform.point(0, snapshot.world.surfaceRow).y;
    if (surfaceY < -120 || surfaceY > height + 120) return;
    const cellPx = clamp(transform.cellPx, 7, 42);
    const dry = snapshot.environment.weather === 'heat' || snapshot.environment.weather === 'drought';
    const winter = snapshot.environment.season === 'winter';
    const autumn = snapshot.environment.season === 'autumn';
    const grass = dry ? [124, 108, 58] : winter ? [78, 96, 79] : autumn ? [124, 105, 56] : [74, 126, 62];

    context.save();
    context.lineCap = 'round';
    for (let i = 0; i < MAX_SURFACE_STEMS; i++) {
      const seed = hash(711 + i * 137 + snapshot.world.width * 17);
      const x = hash01(seed) * width;
      const scale = .82 + Math.abs(x / Math.max(1, width) - .5) * .62;
      const stemHeight = cellPx * (.7 + hash01(seed + 2) * 1.75) * scale * (winter ? .68 : 1);
      const sway = reducedMotion ? 0 : Math.sin(now / 1500 + hash01(seed + 3) * 8) * cellPx * .075;
      const lean = (hash01(seed + 4) - .5) * cellPx * .66 + sway;
      context.strokeStyle = rgba(grass, .29 + hash01(seed + 6) * .34);
      context.lineWidth = clamp(cellPx * (.024 + hash01(seed + 8) * .035), .8, 2.4);
      context.beginPath();
      context.moveTo(x, surfaceY + cellPx * .08);
      context.quadraticCurveTo(x + lean * .35, surfaceY - stemHeight * .54, x + lean, surfaceY - stemHeight);
      context.stroke();
      if (i % 7 === 0 && !winter) {
        const lx = x + lean * .55, ly = surfaceY - stemHeight * .57;
        context.fillStyle = rgba(grass, .2 + hash01(seed + 10) * .16);
        context.beginPath();
        context.ellipse(lx - cellPx * .13, ly, cellPx * .3, cellPx * .085, -.5, 0, Math.PI * 2);
        context.ellipse(lx + cellPx * .12, ly - cellPx * .02, cellPx * .26, cellPx * .08, .42, 0, Math.PI * 2);
        context.fill();
      }
    }

    for (let i = 0; i < MAX_AMBIENT_STONES; i++) {
      const seed = hash(4301 + i * 1031 + snapshot.environment.day * 3);
      const x = hash01(seed) * width;
      const y = surfaceY + cellPx * (.06 + hash01(seed + 2) * .2);
      const r = cellPx * (.05 + hash01(seed + 4) * .13);
      context.fillStyle = `rgba(68,61,50,${.2 + hash01(seed + 5) * .26})`;
      context.beginPath();
      context.ellipse(x, y, r * 1.7, r, hash01(seed + 6) * Math.PI, 0, Math.PI * 2);
      context.fill();
    }

    for (let i = 0; i < MAX_LEAF_LITTER; i++) {
      const seed = hash(8117 + i * 919 + snapshot.environment.day);
      const x = hash01(seed) * width;
      const y = surfaceY - cellPx * (.01 + hash01(seed + 1) * .08);
      const r = cellPx * (.05 + hash01(seed + 2) * .08);
      const leaf = snapshot.environment.season === 'autumn' ? [146, 91, 47] : [78, 103, 52];
      context.fillStyle = rgba(leaf, .22 + hash01(seed + 4) * .2);
      context.beginPath();
      context.ellipse(x, y, r * 2.2, r, hash01(seed + 6) * Math.PI, 0, Math.PI * 2);
      context.fill();
    }

    const entranceCell = Number.isFinite(snapshot.world.entrance) ? snapshot.world.entrance : snapshot.world.nestCenter;
    const entranceX = entranceCell % snapshot.world.width + .5;
    const entrancePoint = transform.point(entranceX, snapshot.world.surfaceRow + .05);
    const moundWidth = cellPx * 1.55;
    const moundHeight = cellPx * .34;
    const mound = context.createRadialGradient(entrancePoint.x, entrancePoint.y - moundHeight * .25, cellPx * .06, entrancePoint.x, entrancePoint.y, moundWidth);
    mound.addColorStop(0, 'rgba(157,108,64,.88)');
    mound.addColorStop(.55, rgba(soilRgb(snapshot, snapshot.world.surfaceRow + .2), .91));
    mound.addColorStop(1, 'rgba(72,45,26,0)');
    context.fillStyle = mound;
    context.beginPath();
    context.ellipse(entrancePoint.x, entrancePoint.y + moundHeight * .3, moundWidth, moundHeight, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(11,7,5,.995)';
    context.beginPath();
    context.ellipse(entrancePoint.x, entrancePoint.y, cellPx * .43, cellPx * .19, -.08, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = 'rgba(234,187,118,.18)';
    context.lineWidth = Math.max(1, cellPx * .04);
    context.beginPath();
    context.ellipse(entrancePoint.x, entrancePoint.y - 1, cellPx * .49, cellPx * .23, -.08, Math.PI * 1.04, Math.PI * 1.96);
    context.stroke();
    context.restore();
  }

  function drawForegroundRoots(context, snapshot, transform, width, height) {
    const surfaceY = transform.point(0, snapshot.world.surfaceRow).y;
    if (surfaceY < -100 || surfaceY > height + 100) return;
    const cellPx = clamp(transform.cellPx, 7, 42);
    context.save();
    context.lineCap = 'round';
    for (let i = 0; i < MAX_FOREGROUND_ROOTS; i++) {
      const seed = hash(1901 + i * 977 + snapshot.world.width * 31);
      const x = hash01(seed) * width;
      const length = cellPx * (2.1 + hash01(seed + 1) * 5.6);
      const bend = (hash01(seed + 2) - .5) * cellPx * 3;
      const thickness = clamp(cellPx * (.07 + hash01(seed + 3) * .09), 1.2, 5.5);
      const gradient = context.createLinearGradient(x, surfaceY, x + bend, surfaceY + length);
      gradient.addColorStop(0, 'rgba(61,36,20,.5)');
      gradient.addColorStop(1, 'rgba(36,21,14,.1)');
      context.strokeStyle = gradient;
      context.lineWidth = thickness;
      context.beginPath();
      context.moveTo(x, surfaceY - cellPx * .05);
      context.bezierCurveTo(x - bend * .1, surfaceY + length * .25, x + bend * .62, surfaceY + length * .63, x + bend, surfaceY + length);
      context.stroke();
    }
    context.restore();
  }

  function drawDepthPass(context, snapshot, transform, width, height, view) {
    const focus = transform.point(Number(view.x || snapshot.world.width * .5), Number(view.y || snapshot.world.height * .5));
    const radius = Math.max(width, height) * (view.shot === 'overview' ? .76 : .54);
    const strength = view.shot === 'queen-danger' || view.shot === 'combat' ? .24 : view.shot === 'excavation' || view.shot === 'brood' ? .17 : .11;
    const vignette = context.createRadialGradient(focus.x, focus.y, radius * .14, focus.x, focus.y, radius);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(.62, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, `rgba(2,3,2,${strength})`);
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
  }

  function render(snapshot, now) {
    if (!canvas || !ctx || !snapshot) return;
    const { width, height, dpr } = resize(canvas);
    const view = cameraView(snapshot, now);
    const transform = transformFor(snapshot, width, height, view);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const reducedMotion = document.body.dataset.reducedMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
    drawSurfaceLife(ctx, snapshot, transform, width, height, now, reducedMotion);
    drawForegroundRoots(ctx, snapshot, transform, width, height);
    const organic = drawOrganicNetwork(ctx, snapshot, transform, width, height);
    drawDepthPass(ctx, snapshot, transform, width, height, view);

    const metrics = window.__ANT_RENDER_METRICS__ ||= {};
    metrics.organicPresentation = true;
    metrics.organicConnections = organic.connections;
    metrics.organicChambers = organic.chambers;
    metrics.surfaceStems = MAX_SURFACE_STEMS;
    metrics.foregroundRoots = MAX_FOREGROUND_ROOTS;
  }

  function mount() {
    const stage = document.getElementById('ecosystem-stage');
    const entityCanvas = document.getElementById('entity-canvas');
    if (!stage || !entityCanvas) return;
    canvas = document.getElementById('organic-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'organic-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.position = 'absolute';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '2';
      stage.insertBefore(canvas, entityCanvas);
    }
    ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    const frame = now => {
      if (stopped) return;
      render(window.__ANT_PUBLIC_STATE__, now);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    window.addEventListener('pagehide', () => {
      stopped = true;
      if (canvas) { canvas.width = 1; canvas.height = 1; }
    }, { once: true });
  }

  window.AntOrganicPresenter = Object.freeze({
    MAX_SURFACE_STEMS,
    MAX_FOREGROUND_ROOTS,
    MAX_ORGANIC_CONNECTIONS,
    MAX_ORGANIC_CHAMBERS
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
