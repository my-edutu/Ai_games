'use strict';

const shell = document.querySelector('.broadcast-shell');
const canvas = document.getElementById('arena-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const connection = document.getElementById('connection');
const soundToggle = document.getElementById('sound-toggle');
const qualitySelect = document.getElementById('quality-select');
const roundName = document.getElementById('round-name');
const roundIndex = document.getElementById('round-index');
const remainingValue = document.getElementById('remaining-value');
const qualifiedValue = document.getElementById('qualified-value');
const qualificationValue = document.getElementById('qualification-value');
const tickValue = document.getElementById('tick-value');
const cameraValue = document.getElementById('camera-value');
const feedValue = document.getElementById('feed-value');
const leaderboard = document.getElementById('leaderboard');
const eventList = document.getElementById('event-list');
const influenceStatus = document.getElementById('influence-status');
const championCard = document.getElementById('champion-card');
const championName = document.getElementById('champion-name');
const systemHealth = document.getElementById('system-health');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const QUALITY_PRESETS = Object.freeze({
  low: Object.freeze({ maxDpr: 1, shadows: false, texture: 0, highlights: false, metalDetail: false }),
  balanced: Object.freeze({ maxDpr: 1.35, shadows: true, texture: 1, highlights: true, metalDetail: false }),
  high: Object.freeze({ maxDpr: 1.8, shadows: true, texture: 2, highlights: true, metalDetail: true }),
  ultra: Object.freeze({ maxDpr: 2.4, shadows: true, texture: 3, highlights: true, metalDetail: true }),
});

const PALETTE = Object.freeze({
  aurora: '#78a58f', coral: '#bd725e', cyan: '#5f8f98', gold: '#b7924f',
  lime: '#8ea45c', magenta: '#a46686', orchid: '#8d74a0', ruby: '#9d4e4e',
  sky: '#6d91ad', violet: '#756c9e', amber: '#b47642', mint: '#6f9c87',
});

const ROUND_LABELS = Object.freeze({
  'seeding-sprint': 'Seeding Sprint',
  'gate-gauntlet': 'Gate Gauntlet',
  'hazard-circuit': 'Hazard Circuit',
  'final-four': 'Final Four',
  championship: 'Championship',
});

const CAMERA_LABELS = Object.freeze({
  overview: 'Overview',
  'cut-line': 'Cut-line battle',
  danger: 'Danger watch',
  finish: 'Finish camera',
  victory: 'Champion camera',
});

const IMPORTANT_EVENTS = new Set([
  'round-started', 'round-live', 'shield-recovery', 'marble-eliminated',
  'marble-qualified', 'round-resolved', 'tournament-champion', 'intermission-started',
]);

let snapshot = null;
let previousSnapshot = null;
let snapshotReceivedAt = performance.now();
let quality = qualitySelect.value in QUALITY_PRESETS ? qualitySelect.value : 'balanced';
let soundEnabled = false;
let audioContext = null;
let lastAudioEventSeq = -1;
let renderWidth = 1;
let renderHeight = 1;
let renderDpr = 1;
let focusIds = new Set();
let cameraState = null;
let cameraArenaId = null;
const rotationById = new Map();

const cleanRequested = new URLSearchParams(location.search).get('clean') === '1';
shell.dataset.clean = cleanRequested ? 'true' : 'false';
shell.dataset.quality = quality;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function triangleWave(tick, periodTicks, amplitude, phaseTicks) {
  const period = Math.max(2, periodTicks);
  const half = Math.floor(period / 2);
  const phase = ((tick + phaseTicks) % period + period) % period;
  const distance = phase <= half ? phase : period - phase;
  return Math.round(-amplitude + (distance * amplitude * 2) / Math.max(1, half));
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  const preset = QUALITY_PRESETS[quality];
  const dpr = Math.min(window.devicePixelRatio || 1, preset.maxDpr);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (width !== canvas.width || height !== canvas.height) {
    canvas.width = width;
    canvas.height = height;
  }
  renderWidth = rect.width;
  renderHeight = rect.height;
  renderDpr = dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function cameraViewport(arena, directive, marbles) {
  const safeDirective = directive || { mode: 'overview', focusIds: [], zoomPermille: 1000 };
  let centerX = arena.width / 2;
  let centerY = arena.height / 2;
  let zoom = clamp((safeDirective.zoomPermille || 1000) / 1000, 1, 1.78);
  const byId = new Map(marbles.map((marble) => [marble.id, marble]));
  const focused = (safeDirective.focusIds || []).map((id) => byId.get(id)).filter(Boolean);

  if (focused.length > 0 && safeDirective.mode !== 'overview') {
    const minX = Math.min(...focused.map((marble) => marble.x));
    const maxX = Math.max(...focused.map((marble) => marble.x));
    const minY = Math.min(...focused.map((marble) => marble.y));
    const maxY = Math.max(...focused.map((marble) => marble.y));
    centerX = (minX + maxX) / 2;
    centerY = (minY + maxY) / 2;

    if (safeDirective.mode === 'cut-line') {
      const groupWidth = Math.max(arena.width * .12, maxX - minX + arena.width * .18);
      const groupHeight = Math.max(arena.height * .18, maxY - minY + arena.height * .16);
      const contextCap = Math.min(arena.width / groupWidth, arena.height / groupHeight, 1.42);
      zoom = Math.min(zoom, Math.max(1.08, contextCap));
    }

    if (safeDirective.mode === 'finish') {
      centerY = (centerY * 2 + arena.finishY) / 3;
      zoom = Math.min(zoom, 1.54);
    }

    if (safeDirective.mode === 'victory') {
      centerY = (centerY + arena.finishY) / 2;
      zoom = Math.min(zoom, 1.68);
    }
  } else {
    zoom = 1;
  }

  const halfWorldWidth = arena.width / (2 * zoom);
  const halfWorldHeight = arena.height / (2 * zoom);
  centerX = clamp(centerX, halfWorldWidth, arena.width - halfWorldWidth);
  centerY = clamp(centerY, halfWorldHeight, arena.height - halfWorldHeight);
  return { centerX, centerY, zoom, mode: safeDirective.mode };
}

function updateCameraState(arena, directive, marbles) {
  const target = cameraViewport(arena, directive, marbles);
  if (!cameraState || cameraArenaId !== arena.id) {
    cameraArenaId = arena.id;
    cameraState = { ...target };
    return cameraState;
  }
  const amount = reducedMotionQuery.matches ? 1 : .12;
  cameraState = {
    centerX: lerp(cameraState.centerX, target.centerX, amount),
    centerY: lerp(cameraState.centerY, target.centerY, amount),
    zoom: lerp(cameraState.zoom, target.zoom, amount),
    mode: target.mode,
  };
  return cameraState;
}

function arenaTransform(arena, viewport) {
  const sideMargin = clamp(renderWidth * .055, 32, 92);
  const verticalMargin = clamp(renderHeight * .055, 34, 78);
  const baseScale = Math.min(
    (renderWidth - sideMargin * 2) / arena.width,
    (renderHeight - verticalMargin * 2) / arena.height,
  );
  const scale = baseScale * viewport.zoom;
  const width = arena.width * scale;
  const height = arena.height * scale;
  return {
    scale,
    x: renderWidth / 2 - viewport.centerX * scale,
    y: renderHeight / 2 - viewport.centerY * scale,
    width,
    height,
  };
}

function worldPoint(transform, x, y) {
  return { x: transform.x + x * transform.scale, y: transform.y + y * transform.scale };
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawBackdrop(preset) {
  const gradient = ctx.createLinearGradient(0, 0, 0, renderHeight);
  gradient.addColorStop(0, '#211f1a');
  gradient.addColorStop(1, '#12120f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, renderWidth, renderHeight);

  if (preset.texture > 0) {
    ctx.save();
    ctx.globalAlpha = preset.texture === 1 ? .06 : .09;
    ctx.fillStyle = '#f3ead3';
    const spacing = preset.texture >= 3 ? 26 : 40;
    for (let y = spacing / 2; y < renderHeight; y += spacing) {
      for (let x = spacing / 2; x < renderWidth; x += spacing) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.restore();
  }
}

function drawTrackBase(arena, transform, preset) {
  ctx.save();
  if (preset.shadows) {
    ctx.shadowColor = 'rgba(0, 0, 0, .55)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 18;
  }
  roundRect(ctx, transform.x - 14, transform.y - 14, transform.width + 28, transform.height + 28, 18);
  ctx.fillStyle = '#292824';
  ctx.fill();
  ctx.shadowColor = 'transparent';

  const slab = ctx.createLinearGradient(transform.x, transform.y, transform.x + transform.width, transform.y + transform.height);
  slab.addColorStop(0, '#f2ecdc');
  slab.addColorStop(.5, '#e4dcc7');
  slab.addColorStop(1, '#d8cfb7');
  roundRect(ctx, transform.x, transform.y, transform.width, transform.height, 12);
  ctx.fillStyle = slab;
  ctx.fill();
  ctx.strokeStyle = 'rgba(40, 38, 32, .38)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(78, 73, 62, .14)';
  ctx.lineWidth = 1;
  const laneXs = [arena.width / 3, arena.width * 2 / 3];
  for (const laneX of laneXs) {
    const start = worldPoint(transform, laneX, 0);
    const end = worldPoint(transform, laneX, arena.height);
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawFinishLine(arena, transform) {
  const y = worldPoint(transform, 0, arena.finishY).y;
  const cell = clamp(transform.width / 32, 9, 22);
  const bandHeight = clamp(cell * .9, 8, 18);
  const count = Math.ceil(transform.width / cell);
  for (let index = 0; index < count; index += 1) {
    ctx.fillStyle = index % 2 === 0 ? '#22211d' : '#f6efe0';
    ctx.fillRect(transform.x + index * cell, y - bandHeight / 2, cell + .5, bandHeight);
  }
  ctx.strokeStyle = 'rgba(34, 33, 29, .55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(transform.x, y - bandHeight / 2, transform.width, bandHeight);
}

function drawHazards(arena, transform, preset) {
  for (const hazard of arena.hazards) {
    const origin = worldPoint(transform, hazard.x, hazard.y);
    const width = hazard.width * transform.scale;
    const height = hazard.height * transform.scale;
    if (preset.shadows) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.6)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#17120f';
      roundRect(ctx, origin.x, origin.y, width, height, 6);
      ctx.fill();
      ctx.restore();
    }
    const pit = ctx.createLinearGradient(origin.x, origin.y, origin.x, origin.y + height);
    pit.addColorStop(0, '#5b2c26');
    pit.addColorStop(.25, '#38201d');
    pit.addColorStop(1, '#11100e');
    roundRect(ctx, origin.x, origin.y, width, height, 5);
    ctx.fillStyle = pit;
    ctx.fill();
    ctx.strokeStyle = '#b85d51';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawObstacles(arena, transform, preset) {
  for (const obstacle of arena.obstacles) {
    const origin = worldPoint(transform, obstacle.x, obstacle.y);
    const width = obstacle.width * transform.scale;
    const height = obstacle.height * transform.scale;
    ctx.save();
    if (preset.shadows) {
      ctx.shadowColor = 'rgba(0,0,0,.32)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
    }
    const face = ctx.createLinearGradient(origin.x, origin.y, origin.x, origin.y + height);
    face.addColorStop(0, '#fff8e9');
    face.addColorStop(1, '#cfc5ae');
    roundRect(ctx, origin.x, origin.y, width, height, 5);
    ctx.fillStyle = face;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(58, 54, 46, .45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    if (preset.metalDetail) {
      ctx.fillStyle = 'rgba(45, 42, 36, .35)';
      ctx.fillRect(origin.x + 4, origin.y + height - 3, Math.max(0, width - 8), 2);
    }
    ctx.restore();
  }
}

function drawBumpers(arena, transform, preset) {
  for (const bumper of arena.bumpers) {
    const point = worldPoint(transform, bumper.x, bumper.y);
    const radius = Math.max(5, bumper.radius * transform.scale);
    const metal = ctx.createRadialGradient(point.x - radius * .35, point.y - radius * .4, radius * .1, point.x, point.y, radius);
    metal.addColorStop(0, '#f3efe5');
    metal.addColorStop(.35, '#b9b5ab');
    metal.addColorStop(.72, '#5d5b55');
    metal.addColorStop(1, '#292824');
    ctx.save();
    if (preset.shadows) {
      ctx.shadowColor = 'rgba(0,0,0,.35)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
    }
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = metal;
    ctx.fill();
    ctx.strokeStyle = '#d5d1c5';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

function drawSweepers(arena, transform, preset, tick) {
  for (const sweeper of arena.sweepers) {
    const offset = triangleWave(tick, sweeper.periodTicks, sweeper.amplitude, sweeper.phaseTicks);
    const x = sweeper.baseX + (sweeper.axis === 'x' ? offset : 0);
    const y = sweeper.baseY + (sweeper.axis === 'y' ? offset : 0);
    const origin = worldPoint(transform, x, y);
    const width = sweeper.width * transform.scale;
    const height = sweeper.height * transform.scale;
    const metal = ctx.createLinearGradient(origin.x, origin.y, origin.x, origin.y + Math.max(height, 8));
    metal.addColorStop(0, '#d8d4ca');
    metal.addColorStop(.42, '#8c8a84');
    metal.addColorStop(.55, '#54534f');
    metal.addColorStop(1, '#bebbb1');
    ctx.save();
    if (preset.shadows) {
      ctx.shadowColor = 'rgba(0,0,0,.38)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
    }
    roundRect(ctx, origin.x, origin.y, width, Math.max(height, 6), 3);
    ctx.fillStyle = metal;
    ctx.fill();
    ctx.strokeStyle = '#302f2c';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

function interpolatedMarbles(now) {
  if (!snapshot) return [];
  const blend = clamp((now - snapshotReceivedAt) / 115, 0, 1);
  const previousById = new Map((previousSnapshot?.marbles || []).map((marble) => [marble.id, marble]));
  return snapshot.marbles.map((marble) => {
    const previous = previousById.get(marble.id) || marble;
    return {
      ...marble,
      x: lerp(previous.x, marble.x, blend),
      y: lerp(previous.y, marble.y, blend),
    };
  });
}

function drawPattern(marble, radius, angle) {
  ctx.save();
  ctx.rotate(angle);
  ctx.strokeStyle = 'rgba(20, 20, 18, .72)';
  ctx.fillStyle = 'rgba(20, 20, 18, .72)';
  ctx.lineWidth = Math.max(1, radius * .12);
  if (marble.pattern === 'ring') {
    ctx.beginPath();
    ctx.arc(0, 0, radius * .58, 0, Math.PI * 2);
    ctx.stroke();
  } else if (marble.pattern === 'dots') {
    for (const [x, y] of [[-.35, -.22], [.26, -.28], [-.05, .33]]) {
      ctx.beginPath();
      ctx.arc(radius * x, radius * y, radius * .11, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (marble.pattern === 'chevron') {
    ctx.beginPath();
    ctx.moveTo(-radius * .55, -radius * .12);
    ctx.lineTo(0, radius * .35);
    ctx.lineTo(radius * .55, -radius * .12);
    ctx.stroke();
  } else if (marble.pattern === 'split') {
    ctx.fillRect(-radius, -radius * .12, radius * 2, radius * .24);
  }
  ctx.restore();
}

function drawMarble(marble, transform, preset) {
  const point = worldPoint(transform, marble.x, marble.y);
  const radius = clamp(transform.scale * 285, 8, 17);
  const base = PALETTE[marble.palette] || '#87908a';
  const angle = rotationById.get(marble.id) || 0;

  ctx.save();
  ctx.translate(point.x, point.y);
  if (preset.shadows) {
    ctx.save();
    ctx.translate(radius * .28, radius * .44);
    ctx.scale(1.15, .55);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.fill();
    ctx.restore();
  }

  if (focusIds.has(marble.id) || marble.status === 'threatened' || marble.status === 'recovering') {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.48, 0, Math.PI * 2);
    ctx.strokeStyle = marble.status === 'threatened' ? 'rgba(184,93,81,.9)' : marble.status === 'recovering' ? 'rgba(201,167,101,.9)' : 'rgba(240,234,215,.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  const sphere = ctx.createRadialGradient(-radius * .35, -radius * .42, radius * .12, 0, 0, radius);
  sphere.addColorStop(0, preset.highlights ? '#fffdf5' : base);
  sphere.addColorStop(.18, base);
  sphere.addColorStop(.68, base);
  sphere.addColorStop(1, '#262521');
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = sphere;
  ctx.fill();
  ctx.strokeStyle = marble.status === 'qualified' || marble.status === 'champion' ? '#d8c38f' : 'rgba(20,20,18,.62)';
  ctx.lineWidth = marble.status === 'qualified' || marble.status === 'champion' ? 2.2 : 1.25;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius * .94, 0, Math.PI * 2);
  ctx.clip();
  drawPattern(marble, radius, angle);
  ctx.restore();

  ctx.font = `900 ${Math.max(8, radius * .72)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, radius * .18);
  ctx.strokeStyle = 'rgba(0,0,0,.78)';
  ctx.strokeText(String(marble.number), 0, .5);
  ctx.fillStyle = '#fffaf0';
  ctx.fillText(String(marble.number), 0, .5);
  ctx.restore();
}

function updateRotation(next, previous) {
  const previousById = new Map((previous?.marbles || []).map((marble) => [marble.id, marble]));
  for (const marble of next.marbles) {
    const old = previousById.get(marble.id);
    if (!old) continue;
    const distance = Math.hypot(marble.x - old.x, marble.y - old.y);
    const direction = Math.sign(marble.velocityX || 1);
    const current = rotationById.get(marble.id) || 0;
    rotationById.set(marble.id, current + direction * distance / 280);
  }
}

function renderArena(now) {
  resizeCanvas();
  const preset = QUALITY_PRESETS[quality];
  drawBackdrop(preset);
  if (!snapshot) return;

  const marbles = interpolatedMarbles(now);
  const directive = snapshot.camera.directive || { mode: 'overview', focusIds: [], zoomPermille: 1000 };
  const viewport = updateCameraState(snapshot.arena, directive, marbles);
  const transform = arenaTransform(snapshot.arena, viewport);
  drawTrackBase(snapshot.arena, transform, preset);
  drawHazards(snapshot.arena, transform, preset);
  drawObstacles(snapshot.arena, transform, preset);
  drawBumpers(snapshot.arena, transform, preset);
  drawSweepers(snapshot.arena, transform, preset, snapshot.tick);
  drawFinishLine(snapshot.arena, transform);
  for (const marble of marbles) drawMarble(marble, transform, preset);
}

function statusLabel(status) {
  const labels = {
    racing: 'Racing',
    'near-finish': 'Near finish',
    threatened: 'Threat',
    recovering: 'Recovering',
    qualified: 'Qualified',
    eliminated: 'Out',
    champion: 'Champion',
  };
  return labels[status] || status;
}

function renderHud(next) {
  const directive = next.camera.directive || { mode: 'overview', focusIds: [], zoomPermille: 1000 };
  focusIds = new Set(directive.focusIds || []);
  roundName.textContent = ROUND_LABELS[next.arena.archetype] || next.arena.archetype;
  roundIndex.textContent = `Round ${next.round.number} · ${next.round.index + 1}/5`;
  remainingValue.textContent = String(next.round.remaining);
  qualifiedValue.textContent = String(next.round.qualified);
  qualificationValue.textContent = `${next.round.qualified}/${next.round.quota} locked · ${Math.max(0, next.round.quota - next.round.qualified)} spots open`;
  tickValue.textContent = String(next.tick);
  cameraValue.textContent = CAMERA_LABELS[directive.mode] || directive.mode;
  feedValue.textContent = next.lifecycle === 'quarantined' ? 'AUTHORITY STOPPED' : 'AUTHORITY LIVE';

  leaderboard.replaceChildren(...next.leaderboard.map((entry, index) => {
    const item = document.createElement('li');
    item.dataset.status = entry.status;
    const rank = document.createElement('span');
    rank.className = 'rank';
    rank.textContent = String(index + 1).padStart(2, '0');
    const number = document.createElement('span');
    number.className = 'number';
    number.textContent = String(entry.number);
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = entry.name;
    const status = document.createElement('span');
    status.className = 'status';
    status.textContent = statusLabel(entry.status);
    item.append(rank, number, name, status);
    return item;
  }));

  const official = next.events.filter((event) => IMPORTANT_EVENTS.has(event.type)).slice(-6).reverse();
  eventList.replaceChildren(...official.map((event) => {
    const item = document.createElement('li');
    item.textContent = describeEvent(event, next);
    return item;
  }));
  if (official.length === 0) {
    const item = document.createElement('li');
    item.textContent = 'Authority running · awaiting next official race event.';
    eventList.replaceChildren(item);
  }

  const championId = next.camera.championId;
  if (championId !== null) {
    const champion = next.marbles.find((marble) => marble.id === championId);
    championName.textContent = champion ? `#${champion.number} ${champion.name}` : `Marble #${championId + 1}`;
    championCard.hidden = false;
  } else {
    championCard.hidden = true;
  }
}

function describeEvent(event, next) {
  const data = event.data || {};
  const marble = Number.isInteger(data.marbleId) ? next.marbles.find((candidate) => candidate.id === data.marbleId) : null;
  const identity = marble ? `#${marble.number} ${marble.name}` : 'Marble';
  if (event.type === 'marble-qualified') return `${identity} officially qualified in P${data.finishRank}.`;
  if (event.type === 'marble-eliminated') return `${identity} eliminated · ${String(data.cause || 'hazard')}.`;
  if (event.type === 'shield-recovery') return `${identity} survived a hazard with shield recovery.`;
  if (event.type === 'round-started') return `Round ${Number(data.roundIndex || 0) + 1} is live.`;
  if (event.type === 'round-resolved') return `Round result locked by authority · ${String(data.resolution || 'resolved')}.`;
  if (event.type === 'tournament-champion') return `Champion result locked: marble #${Number(data.championId) + 1}.`;
  if (event.type === 'intermission-started') return 'Official result complete · intermission.';
  return event.type.replaceAll('-', ' ');
}

function ensureAudio() {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume();
}

function tone(frequency, duration, gain = .025, offset = 0) {
  if (!soundEnabled || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const volume = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  volume.gain.setValueAtTime(gain, audioContext.currentTime + offset);
  volume.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + offset + duration);
  oscillator.connect(volume).connect(audioContext.destination);
  oscillator.start(audioContext.currentTime + offset);
  oscillator.stop(audioContext.currentTime + offset + duration);
}

function playNewAudio(events) {
  if (!soundEnabled) return;
  for (const event of events) {
    if (event.seq <= lastAudioEventSeq) continue;
    lastAudioEventSeq = Math.max(lastAudioEventSeq, event.seq);
    if (event.type === 'marble-qualified') tone(660, .16, .025);
    else if (event.type === 'marble-eliminated') tone(180, .22, .028);
    else if (event.type === 'shield-recovery') { tone(360, .12, .02); tone(520, .16, .02, .08); }
    else if (event.type === 'tournament-champion') { tone(520, .18, .028); tone(660, .2, .025, .12); tone(820, .3, .024, .24); }
  }
}

function acceptSnapshot(next) {
  if (!next || next.version !== 1 || !next.round || !next.arena || !Array.isArray(next.marbles) || !next.camera?.directive) throw new Error('invalid presentation snapshot');
  if (snapshot && next.tick < snapshot.tick && next.lifecycle !== 'active') return;
  const discontinuity = snapshot && (next.tick < snapshot.tick || next.arena.id !== snapshot.arena.id);
  if (discontinuity) {
    previousSnapshot = null;
    cameraState = null;
    cameraArenaId = null;
    rotationById.clear();
  }
  updateRotation(next, discontinuity ? null : snapshot);
  previousSnapshot = discontinuity ? null : snapshot;
  snapshot = next;
  snapshotReceivedAt = performance.now();
  renderHud(next);
  playNewAudio(next.events || []);
}

async function refreshSnapshot() {
  try {
    const response = await fetch('/api/snapshot', { cache: 'no-store' });
    if (!response.ok) throw new Error(`snapshot ${response.status}`);
    const next = await response.json();
    acceptSnapshot(next);
    connection.textContent = 'Authority connected';
    connection.className = 'status-pill connected';
  } catch {
    connection.textContent = 'Connection lost';
    connection.className = 'status-pill error';
  }
}

async function refreshHealth() {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    if (!response.ok) throw new Error('health');
    const health = await response.json();
    systemHealth.textContent = `${String(health.status).toUpperCase()} · Run ${health.runIndex + 1} · Round ${health.roundNumber}`;
  } catch {
    systemHealth.textContent = 'Health unavailable';
  }
}

async function refreshInfluenceStatus() {
  try {
    const response = await fetch('/api/catalogue', { cache: 'no-store' });
    const result = await response.json();
    influenceStatus.textContent = result.authorityInfluenceEnabled
      ? 'Viewer voting is routed through deterministic tournament authority.'
      : 'Voting is temporarily disabled. The server will not fake viewer effects until influence is processed inside deterministic authority.';
  } catch {
    influenceStatus.textContent = 'Influence status unavailable.';
  }
}

qualitySelect.addEventListener('change', () => {
  quality = qualitySelect.value in QUALITY_PRESETS ? qualitySelect.value : 'balanced';
  shell.dataset.quality = quality;
  resizeCanvas();
});

soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  soundToggle.textContent = soundEnabled ? 'Sound on' : 'Sound off';
  if (soundEnabled) ensureAudio();
});

function render(now) {
  renderArena(now);
  requestAnimationFrame(render);
}

window.addEventListener('resize', resizeCanvas, { passive: true });
refreshSnapshot();
refreshHealth();
refreshInfluenceStatus();
setInterval(refreshSnapshot, 100);
setInterval(refreshHealth, 2000);
setInterval(refreshInfluenceStatus, 15000);
requestAnimationFrame(render);
