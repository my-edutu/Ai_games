'use strict';

(() => {
  const canvas = document.getElementById('arena-identity-overlay');
  const shell = document.querySelector('.broadcast-shell');
  if (!canvas || !shell) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const WORLD_SCALE = 1 / 1000;
  const POLL_MS = 120;
  const PALETTE = Object.freeze({
    aurora: '#57b892', coral: '#db4f38', cyan: '#2faed1', gold: '#dba32e',
    lime: '#85b82e', magenta: '#c23d94', orchid: '#8a59b8', ruby: '#c21f29',
    sky: '#4d94d6', violet: '#6150b8', amber: '#d16e1f', mint: '#4daf84',
  });

  let snapshot = null;
  let previousSnapshot = null;
  let snapshotReceivedAt = performance.now();
  let cameraState = null;
  let cameraArenaId = null;
  let requestInFlight = false;
  let stopped = false;
  let width = 1;
  let height = 1;
  let dpr = 1;

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function lerp3(left, right, amount) {
    return [
      lerp(left[0], right[0], amount),
      lerp(left[1], right[1], amount),
      lerp(left[2], right[2], amount),
    ];
  }

  function subtract3(left, right) {
    return [left[0] - right[0], left[1] - right[1], left[2] - right[2]];
  }

  function dot3(left, right) {
    return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
  }

  function cross3(left, right) {
    return [
      left[1] * right[2] - left[2] * right[1],
      left[2] * right[0] - left[0] * right[2],
      left[0] * right[1] - left[1] * right[0],
    ];
  }

  function normalize3(vector) {
    const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
    return [vector[0] / length, vector[1] / length, vector[2] / length];
  }

  function toWorld(x, y, arena) {
    return [
      (x - arena.width / 2) * WORLD_SCALE,
      0,
      (y - arena.height / 2) * WORLD_SCALE,
    ];
  }

  function resize() {
    const reference = document.getElementById('arena-webgl');
    const rect = reference?.getBoundingClientRect();
    if (!rect || rect.width <= 1 || rect.height <= 1) return false;
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.max(1, Math.round(rect.width * nextDpr));
    const pixelHeight = Math.max(1, Math.round(rect.height * nextDpr));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    width = rect.width;
    height = rect.height;
    dpr = nextDpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  function interpolatedMarbles(now) {
    if (!snapshot) return [];
    const blend = clamp((now - snapshotReceivedAt) / 110, 0, 1);
    const previousById = new Map((previousSnapshot?.marbles || []).map((marble) => [marble.id, marble]));
    return snapshot.marbles.map((marble) => {
      const before = previousById.get(marble.id) || marble;
      return {
        ...marble,
        x: lerp(before.x, marble.x, blend),
        y: lerp(before.y, marble.y, blend),
      };
    });
  }

  function cameraFromDirective(currentSnapshot, marbles) {
    const arena = currentSnapshot.arena;
    const directive = currentSnapshot.camera.directive || { mode: 'overview', focusIds: [], zoomPermille: 1000 };
    const byId = new Map(marbles.map((marble) => [marble.id, marble]));
    const focus = (directive.focusIds || []).map((id) => byId.get(id)).filter(Boolean);
    let target = [0, 0.25, 0];
    if (focus.length) {
      const averageX = focus.reduce((sum, marble) => sum + marble.x, 0) / focus.length;
      const averageY = focus.reduce((sum, marble) => sum + marble.y, 0) / focus.length;
      const point = toWorld(averageX, averageY, arena);
      target = [point[0], 0.30, point[2]];
    }

    const zoom = clamp((directive.zoomPermille || 1000) / 1000, 0.9, 1.8);
    let eye = [0, 13.5 / zoom, 18 / zoom];
    if (directive.mode === 'danger') eye = [target[0] + 4.8 / zoom, 7.2 / zoom, target[2] + 8.5 / zoom];
    if (directive.mode === 'cut-line') eye = [target[0] + 3.2 / zoom, 8.4 / zoom, target[2] + 10.5 / zoom];
    if (directive.mode === 'finish') {
      const finish = toWorld(arena.width / 2, arena.finishY, arena);
      target = [lerp(target[0], finish[0], 0.55), 0.25, lerp(target[2], finish[2], 0.55)];
      eye = [target[0] + 5.8 / zoom, 6.4 / zoom, target[2] + 7.4 / zoom];
    }
    if (directive.mode === 'victory') eye = [target[0] + 3.4 / zoom, 4.0 / zoom, target[2] + 5.0 / zoom];
    return { eye, target, mode: directive.mode };
  }

  function smoothedCamera(currentSnapshot, marbles) {
    const next = cameraFromDirective(currentSnapshot, marbles);
    if (!cameraState || cameraArenaId !== currentSnapshot.arena.id) {
      cameraArenaId = currentSnapshot.arena.id;
      cameraState = next;
      return next;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const amount = reduced ? 1 : 0.075;
    cameraState = {
      eye: lerp3(cameraState.eye, next.eye, amount),
      target: lerp3(cameraState.target, next.target, amount),
      mode: next.mode,
    };
    return cameraState;
  }

  function projectToScreen(point, camera) {
    const forward = normalize3(subtract3(camera.target, camera.eye));
    const right = normalize3(cross3(forward, [0, 1, 0]));
    const up = normalize3(cross3(right, forward));
    const relative = subtract3(point, camera.eye);
    const depth = dot3(relative, forward);
    if (depth <= 0.08) return null;

    const fov = Math.PI * 0.245;
    const focal = 1 / Math.tan(fov / 2);
    const aspect = width / Math.max(1, height);
    const ndcX = (dot3(relative, right) * focal / aspect) / depth;
    const ndcY = (dot3(relative, up) * focal) / depth;
    if (Math.abs(ndcX) > 1.12 || Math.abs(ndcY) > 1.12) return null;
    return {
      x: (ndcX * 0.5 + 0.5) * width,
      y: (0.5 - ndcY * 0.5) * height,
      depth,
    };
  }

  function selectedMarbles(marbles) {
    if (!snapshot) return [];
    const visible = marbles.filter((marble) => marble.status !== 'eliminated');
    const selectedIds = new Set((snapshot.leaderboard || []).slice(0, snapshot.round.remaining <= 8 ? 8 : 6).map((entry) => entry.id));
    for (const id of snapshot.camera.directive?.focusIds || []) selectedIds.add(id);
    if (snapshot.camera.championId !== null) selectedIds.add(snapshot.camera.championId);
    if (snapshot.round.remaining <= 8) for (const marble of visible) selectedIds.add(marble.id);
    return visible.filter((marble) => selectedIds.has(marble.id));
  }

  function roundedRect(x, y, boxWidth, boxHeight, radius) {
    const safeRadius = Math.min(radius, boxWidth / 2, boxHeight / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + boxWidth, y, x + boxWidth, y + boxHeight, safeRadius);
    context.arcTo(x + boxWidth, y + boxHeight, x, y + boxHeight, safeRadius);
    context.arcTo(x, y + boxHeight, x, y, safeRadius);
    context.arcTo(x, y, x + boxWidth, y, safeRadius);
    context.closePath();
  }

  function drawIdentity(marble, position, focused, lateRound) {
    const champion = marble.status === 'champion';
    const threatened = marble.status === 'threatened' || marble.status === 'recovering';
    const showName = focused || champion || (lateRound && snapshot.round.remaining <= 4);
    const badgeRadius = champion ? 13 : focused ? 12 : 10;
    const base = PALETTE[marble.palette] || '#87908a';
    const labelY = position.y - (champion ? 34 : focused ? 28 : 22);

    context.save();
    context.lineCap = 'round';
    context.strokeStyle = threatened ? 'rgba(231, 104, 87, .92)' : champion ? 'rgba(243, 201, 117, .96)' : 'rgba(255,255,255,.35)';
    context.lineWidth = champion || threatened ? 2 : 1;
    context.beginPath();
    context.moveTo(position.x, position.y - 4);
    context.lineTo(position.x, labelY + badgeRadius);
    context.stroke();

    context.beginPath();
    context.arc(position.x, labelY, badgeRadius, 0, Math.PI * 2);
    context.fillStyle = base;
    context.fill();
    context.strokeStyle = champion ? '#f3c975' : threatened ? '#e76857' : 'rgba(255,255,255,.7)';
    context.lineWidth = champion ? 2.5 : 1.5;
    context.stroke();

    context.font = `900 ${champion ? 11 : 9}px Inter, system-ui, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 2.5;
    context.strokeStyle = 'rgba(0,0,0,.78)';
    context.strokeText(String(marble.number), position.x, labelY + .5);
    context.fillStyle = '#fffaf0';
    context.fillText(String(marble.number), position.x, labelY + .5);

    if (showName) {
      const name = marble.name || `#${marble.number}`;
      context.font = `800 ${champion ? 12 : 10}px Inter, system-ui, sans-serif`;
      const textWidth = Math.ceil(context.measureText(name).width);
      const boxWidth = textWidth + 18;
      const boxHeight = champion ? 24 : 20;
      const boxX = position.x + badgeRadius + 6;
      const boxY = labelY - boxHeight / 2;
      roundedRect(boxX, boxY, boxWidth, boxHeight, 6);
      context.fillStyle = 'rgba(12, 12, 11, .82)';
      context.fill();
      context.strokeStyle = champion ? 'rgba(243,201,117,.72)' : 'rgba(255,255,255,.22)';
      context.lineWidth = 1;
      context.stroke();
      context.textAlign = 'left';
      context.textBaseline = 'middle';
      context.fillStyle = '#f4f0e5';
      context.fillText(name, boxX + 9, boxY + boxHeight / 2 + .5);
    }
    context.restore();
  }

  function render(now) {
    if (!resize()) {
      requestAnimationFrame(render);
      return;
    }
    context.clearRect(0, 0, width, height);
    if (!snapshot || !shell.classList.contains('webgl-ready')) {
      requestAnimationFrame(render);
      return;
    }

    const marbles = interpolatedMarbles(now);
    const camera = smoothedCamera(snapshot, marbles);
    const selected = selectedMarbles(marbles);
    const focusIds = new Set(snapshot.camera.directive?.focusIds || []);
    const lateRound = snapshot.round.index >= 3;
    for (const marble of selected) {
      const world = toWorld(marble.x, marble.y, snapshot.arena);
      world[1] = 0.56;
      const position = projectToScreen(world, camera);
      if (!position) continue;
      drawIdentity(marble, position, focusIds.has(marble.id), lateRound);
    }
    requestAnimationFrame(render);
  }

  function acceptSnapshot(next) {
    if (!next || next.version !== 1 || !next.arena || !Array.isArray(next.marbles) || !next.camera?.directive) return;
    const discontinuity = snapshot && (next.tick < snapshot.tick || next.arena.id !== snapshot.arena.id);
    previousSnapshot = discontinuity ? null : snapshot;
    snapshot = next;
    snapshotReceivedAt = performance.now();
    if (discontinuity) {
      cameraState = null;
      cameraArenaId = null;
    }
    shell.dataset.identity = 'projected';
  }

  async function refresh() {
    if (requestInFlight || stopped || document.hidden) return;
    requestInFlight = true;
    try {
      const response = await fetch('/api/snapshot', { cache: 'no-store' });
      if (!response.ok) throw new Error(`identity snapshot ${response.status}`);
      acceptSnapshot(await response.json());
    } catch {
      // Main runtime owns connection reporting; identity overlay fails closed.
    } finally {
      requestInFlight = false;
    }
  }

  document.addEventListener('visibilitychange', () => {
    stopped = document.hidden;
    if (!stopped) refresh();
  });
  window.addEventListener('resize', resize, { passive: true });
  refresh();
  setInterval(refresh, POLL_MS);
  requestAnimationFrame(render);
})();
