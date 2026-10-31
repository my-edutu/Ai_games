'use strict';

(() => {
  const canvas = document.getElementById('arena-identity-overlay');
  const shell = document.querySelector('.broadcast-shell');
  if (!canvas || !shell) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const WORLD_SCALE = 1 / 1000;
  const PALETTE = Object.freeze({
    aurora: '#2ef0bd', coral: '#ff6b54', cyan: '#21dbff', gold: '#ffc730',
    lime: '#b8f73d', magenta: '#ff3bb8', orchid: '#b06eff', ruby: '#ff3052',
    sky: '#5cb0ff', violet: '#7857ff', amber: '#ff8f21', mint: '#2bf2c4',
  });
  let width = 1;
  let height = 1;
  let dpr = 1;
  let lastFrame = null;
  let lastPaintKey = '';

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

  function selectedMarbles(marbles, activeSnapshot) {
    if (!activeSnapshot) return [];
    const visible = marbles.filter((marble) => marble.status !== 'eliminated');
    const selectedIds = new Set((activeSnapshot.leaderboard || []).slice(0, activeSnapshot.round.remaining <= 8 ? 8 : 6).map((entry) => entry.id));
    for (const id of activeSnapshot.camera.directive?.focusIds || []) selectedIds.add(id);
    if (activeSnapshot.camera.championId !== null) selectedIds.add(activeSnapshot.camera.championId);
    if (activeSnapshot.round.remaining <= 8) for (const marble of visible) selectedIds.add(marble.id);
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

  function drawIdentity(marble, position, focused, lateRound, activeSnapshot) {
    const champion = marble.status === 'champion';
    const threatened = marble.status === 'threatened' || marble.status === 'recovering';
    const showName = focused || champion || (lateRound && activeSnapshot.round.remaining <= 4);
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

  // Column-major OpenGL clip projection: the exact view-projection matrix used
  // to draw the same marble in WebGL, rather than an independently estimated camera.
  function projectWithWebglMatrix(point, matrix) {
    const x = point[0], y = point[1], z = point[2];
    const clipX = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
    const clipY = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
    const clipW = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
    if (!(clipW > 0.08)) return null;
    const nx = clipX / clipW;
    const ny = clipY / clipW;
    if (!Number.isFinite(nx) || !Number.isFinite(ny) || Math.abs(nx) > 1.12 || Math.abs(ny) > 1.12) return null;
    return { x: (nx * 0.5 + 0.5) * width, y: (0.5 - ny * 0.5) * height, depth: clipW };
  }

  function render(now) {
    requestAnimationFrame(render);
    if (document.hidden || !resize()) return;

    // The last completed WebGL frame is exactly what remains on screen when
    // a GPU is slow. Its age does not make a different camera more accurate.
    // Never combine newer polled positions with an older displayed 3D image.
    const frame = window.marbleRenderFrame;
    const valid = shell.classList.contains('webgl-ready') && frame &&
      frame.snapshot?.version === 1 &&
      frame.snapshot.arena?.id === frame.arenaId &&
      frame.snapshot.camera?.directive && frame.snapshot.round &&
      frame.viewProjection?.length === 16 &&
      Array.from(frame.viewProjection).every(Number.isFinite) &&
      Array.isArray(frame.marbles);
    if (!valid) {
      context.clearRect(0, 0, width, height);
      lastFrame = null;
      lastPaintKey = '';
      shell.dataset.identitySource = 'unavailable';
      delete shell.dataset.identityTick;
      return;
    }

    shell.dataset.identity = 'projected';
    shell.dataset.identitySource = 'webgl-frame';
    shell.dataset.identityTick = String(frame.snapshot.tick);
    shell.dataset.identityFrameAgeMs = String(Math.max(0, Math.round(now - frame.renderedAt)));
    const paintKey = `${width}:${height}:${dpr}`;
    if (frame === lastFrame && paintKey === lastPaintKey) return;
    context.clearRect(0, 0, width, height);
    const activeSnapshot = frame.snapshot;
    const selected = selectedMarbles(frame.marbles, activeSnapshot);
    const focusIds = new Set(activeSnapshot.camera.directive.focusIds || []);
    const lateRound = activeSnapshot.round.index >= 3;
    for (const marble of selected) {
      const world = toWorld(marble.x, marble.y, activeSnapshot.arena);
      world[1] = (marble.elevation || 0) * WORLD_SCALE + 0.56;
      const position = projectWithWebglMatrix(world, frame.viewProjection);
      if (position) drawIdentity(marble, position, focusIds.has(marble.id), lateRound, activeSnapshot);
    }
    lastFrame = frame;
    lastPaintKey = paintKey;
  }

  window.addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(render);
})();
