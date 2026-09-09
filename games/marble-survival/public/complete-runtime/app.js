'use strict';

const shell = document.querySelector('.broadcast-shell');
const canvas = document.querySelector('#arena-canvas');
const context = canvas.getContext('2d', { alpha: false });
const connection = document.querySelector('#connection');
const roundName = document.querySelector('#round-name');
const roundIndex = document.querySelector('#round-index');
const survivorValue = document.querySelector('#survivor-value');
const quotaValue = document.querySelector('#quota-value');
const qualityLabel = document.querySelector('#quality-label');
const leaderboard = document.querySelector('#leaderboard');
const cutoffLabel = document.querySelector('#cutoff-label');
const cutoffDetail = document.querySelector('#cutoff-detail');
const championCard = document.querySelector('#champion-card');
const championName = document.querySelector('#champion-name');
const arenaStateLabel = document.querySelector('#arena-state-label');
const eventMessage = document.querySelector('#event-message');
const recordCategory = document.querySelector('#record-category');
const voteStatus = document.querySelector('#vote-status');
const voteButtons = [...document.querySelectorAll('[data-family="wind-vote"][data-option]')];
const soundToggle = document.querySelector('#sound-toggle');

const QUALITY_PRESETS = Object.freeze({
  low: Object.freeze({ fps: 30, dpr: 1, shadows: false, specular: false, surfaceDetail: false, replayFrames: 30 }),
  balanced: Object.freeze({ fps: 60, dpr: 1.5, shadows: true, specular: true, surfaceDetail: true, replayFrames: 54 }),
  high: Object.freeze({ fps: 60, dpr: 2, shadows: true, specular: true, surfaceDetail: true, replayFrames: 72 }),
  ultra: Object.freeze({ fps: 60, dpr: 2.5, shadows: true, specular: true, surfaceDetail: true, replayFrames: 90 }),
});

const PALETTES = Object.freeze({
  aurora: ['#d6f0d7', '#67b890', '#315f53'], coral: ['#ffd2c4', '#df7866', '#743c36'],
  cyan: ['#d4f4f0', '#68b8b8', '#2e5d65'], gold: ['#fae5a8', '#c99945', '#6d522c'],
  lime: ['#e3edba', '#a2bc62', '#566638'], magenta: ['#f0c9de', '#ba6b91', '#653b57'],
  orchid: ['#e4d1e9', '#9b78a8', '#55445e'], ruby: ['#f1c2bd', '#b6534f', '#672f32'],
  sky: ['#d7e7ef', '#7ba9be', '#405d6b'], violet: ['#ddd2e9', '#8a73a6', '#4c415f'],
  amber: ['#f4ddb0', '#c88a42', '#714d2d'], mint: ['#d5ebdf', '#79ad91', '#456352'],
});

const parameters = new URLSearchParams(location.search);
const cleanFeed = parameters.get('clean') === '1' || parameters.get('feed') === 'clean';
const requestedQuality = String(parameters.get('quality') || 'balanced').toLowerCase();
const qualityName = Object.hasOwn(QUALITY_PRESETS, requestedQuality) ? requestedQuality : 'balanced';
const quality = QUALITY_PRESETS[qualityName];
shell.dataset.clean = String(cleanFeed);
shell.dataset.quality = qualityName;
qualityLabel.textContent = qualityName[0].toUpperCase() + qualityName.slice(1);

const storedViewerId = sessionStorage.getItem('game7-viewer-id');
const viewerId = storedViewerId || (globalThis.crypto?.randomUUID?.() || `viewer-${Date.now()}`);
if (!storedViewerId) sessionStorage.setItem('game7-viewer-id', viewerId);

let snapshot = null;
let previousSnapshot = null;
let snapshotArrivedAt = performance.now();
let latestAcceptedTick = -1;
let soundEnabled = false;
let audioContext = null;
let activeVoices = 0;
let latestEvents = [];
let seenEventIds = new Set();
let replayedEventIds = new Set();
let lastCueAt = new Map();
let lastDrawAt = 0;
let replayFrames = [];
let replayStartedAt = 0;
let replayActive = false;
let voteLockedUntil = 0;
const orientationById = new Map();
const REPLAY_FRAME_MS = 55;
const VOTE_COOLDOWN_MS = 15_000;

function paletteFor(key) {
  return PALETTES[key] || ['#e8e0ce', '#9c9586', '#4c4942'];
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function resizeCanvas() {
  const deviceRatio = globalThis.devicePixelRatio || 1;
  const ratio = Math.max(1, Math.min(quality.dpr, deviceRatio));
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(360, Math.round(bounds.width * ratio));
  const height = Math.max(300, Math.round(bounds.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function arenaTransform(arena, camera) {
  const padding = Math.max(22, Math.min(canvas.width, canvas.height) * .045);
  const baseScale = Math.min((canvas.width - padding * 2) / arena.width, (canvas.height - padding * 2) / arena.height);
  const zoom = clamp(Number(camera?.zoomPermille || 1000) / 1000, 1, 1.28);
  const scale = baseScale * zoom;
  const width = arena.width * scale;
  const height = arena.height * scale;
  const focusX = Number.isFinite(camera?.focusX) ? camera.focusX : arena.width / 2;
  const focusY = Number.isFinite(camera?.focusY) ? camera.focusY : arena.height / 2;
  let left = canvas.width / 2 - focusX * scale;
  let top = canvas.height / 2 - focusY * scale;
  left = width <= canvas.width - padding * 2 ? (canvas.width - width) / 2 : clamp(left, canvas.width - padding - width, padding);
  top = height <= canvas.height - padding * 2 ? (canvas.height - height) / 2 : clamp(top, canvas.height - padding - height, padding);
  return { scale, left, top, width, height };
}

function point(x, y, transform) {
  return { x: transform.left + x * transform.scale, y: transform.top + y * transform.scale };
}

function rectGeometry(value, transform) {
  const position = point(value.x, value.y, transform);
  return { x: position.x, y: position.y, width: value.width * transform.scale, height: value.height * transform.scale };
}

function drawBackdrop() {
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#2b2924');
  gradient.addColorStop(.56, '#1e1e1a');
  gradient.addColorStop(1, '#171714');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (quality.surfaceDetail) {
    context.fillStyle = 'rgba(255,255,255,.018)';
    const step = Math.max(34, Math.round(canvas.width / 32));
    for (let y = step; y < canvas.height; y += step) context.fillRect(0, y, canvas.width, 1);
  }
}

function drawTrackFoundation(arena, transform) {
  const depth = Math.max(7, 14 * transform.scale);
  if (quality.shadows) {
    context.save();
    context.shadowColor = 'rgba(0,0,0,.45)';
    context.shadowBlur = Math.max(10, 22 * transform.scale);
    context.shadowOffsetY = depth * .7;
    context.fillStyle = '#171815';
    context.fillRect(transform.left, transform.top + depth, transform.width, transform.height);
    context.restore();
  } else {
    context.fillStyle = '#171815';
    context.fillRect(transform.left, transform.top + depth, transform.width, transform.height);
  }
  const track = context.createLinearGradient(transform.left, transform.top, transform.left + transform.width, transform.top + transform.height);
  track.addColorStop(0, '#eee5cf');
  track.addColorStop(.45, '#ded5bd');
  track.addColorStop(1, '#cfc5ad');
  context.fillStyle = track;
  context.fillRect(transform.left, transform.top, transform.width, transform.height);
  context.strokeStyle = 'rgba(64,61,52,.52)';
  context.lineWidth = Math.max(1, transform.scale * 18);
  context.strokeRect(transform.left, transform.top, transform.width, transform.height);
  if (quality.surfaceDetail) {
    context.strokeStyle = 'rgba(82,78,67,.12)';
    context.lineWidth = Math.max(1, transform.scale * 6);
    context.beginPath();
    context.moveTo(transform.left + transform.width * .5, transform.top + transform.height * .06);
    context.lineTo(transform.left + transform.width * .5, transform.top + transform.height * .94);
    context.stroke();
  }
}

function drawPerimeterRails(arena, transform) {
  const rail = Math.max(4, arena.marbleRadius * transform.scale * .42);
  const postRadius = Math.max(2, rail * .23);
  context.save();
  const steel = context.createLinearGradient(transform.left, 0, transform.left + rail, 0);
  steel.addColorStop(0, '#242622');
  steel.addColorStop(.48, '#77796f');
  steel.addColorStop(.72, '#b6b4a8');
  steel.addColorStop(1, '#393b36');
  context.fillStyle = steel;
  context.fillRect(transform.left, transform.top, rail, transform.height);
  context.fillRect(transform.left + transform.width - rail, transform.top, rail, transform.height);
  context.fillRect(transform.left, transform.top, transform.width, rail * .75);
  context.fillRect(transform.left, transform.top + transform.height - rail, transform.width, rail);
  context.strokeStyle = 'rgba(244,239,220,.28)';
  context.lineWidth = Math.max(1, rail * .12);
  context.strokeRect(transform.left + rail * .16, transform.top + rail * .16, transform.width - rail * .32, transform.height - rail * .32);
  if (quality.surfaceDetail) {
    const stepWorld = Math.max(1_600, Math.floor(arena.height / 7));
    for (let y = stepWorld; y < arena.height; y += stepWorld) {
      const p = point(0, y, transform);
      for (const x of [transform.left + rail / 2, transform.left + transform.width - rail / 2]) {
        context.fillStyle = '#c39a51';
        context.beginPath();
        context.arc(x, p.y, postRadius, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = 'rgba(39,40,36,.8)';
        context.lineWidth = Math.max(1, postRadius * .35);
        context.stroke();
      }
    }
  }
  context.restore();
}

function drawFinishLine(arena, transform) {
  const y = point(0, arena.finishY, transform).y;
  const stripHeight = Math.max(7, arena.marbleRadius * transform.scale * .48);
  const cells = 18;
  const cellWidth = transform.width / cells;
  context.fillStyle = 'rgba(101,185,150,.16)';
  context.fillRect(transform.left, y - stripHeight * 1.6, transform.width, stripHeight * 3.2);
  for (let index = 0; index < cells; index++) {
    context.fillStyle = index % 2 === 0 ? '#2c2d29' : '#f2ead6';
    context.fillRect(transform.left + cellWidth * index, y - stripHeight / 2, cellWidth + 1, stripHeight);
  }
  context.strokeStyle = 'rgba(53,55,50,.72)';
  context.lineWidth = Math.max(1, transform.scale * 8);
  context.strokeRect(transform.left, y - stripHeight / 2, transform.width, stripHeight);
}

function drawHazards(arena, transform) {
  for (const hazard of arena.hazards) {
    const rect = rectGeometry(hazard, transform);
    context.fillStyle = '#29201e';
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    const pit = context.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
    pit.addColorStop(0, '#8c443b');
    pit.addColorStop(.16, '#54312d');
    pit.addColorStop(1, '#201b1a');
    context.fillStyle = pit;
    context.fillRect(rect.x + 2, rect.y + 2, Math.max(0, rect.width - 4), Math.max(0, rect.height - 4));
    context.strokeStyle = '#d37660';
    context.lineWidth = Math.max(2, transform.scale * 22);
    context.setLineDash([Math.max(5, 140 * transform.scale), Math.max(4, 80 * transform.scale)]);
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    context.setLineDash([]);
  }
}

function drawWindZones(arena, transform) {
  if (!quality.surfaceDetail) return;
  for (const zone of arena.windZones) {
    const rect = rectGeometry(zone, transform);
    context.save();
    context.fillStyle = 'rgba(74,122,128,.055)';
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.strokeStyle = 'rgba(72,112,116,.24)';
    context.lineWidth = Math.max(1, transform.scale * 8);
    context.setLineDash([Math.max(8, transform.scale * 160), Math.max(6, transform.scale * 120)]);
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    context.restore();
  }
}

function drawObstacleHardware(rect, transform) {
  if (rect.width < 8 || rect.height < 5) return;
  const bevel = Math.max(1, Math.min(rect.height * .18, 32 * transform.scale));
  context.fillStyle = 'rgba(246,240,222,.12)';
  context.fillRect(rect.x + bevel, rect.y + bevel * .55, Math.max(0, rect.width - bevel * 2), bevel * .45);
  context.fillStyle = 'rgba(0,0,0,.28)';
  context.fillRect(rect.x + bevel, rect.y + rect.height - bevel, Math.max(0, rect.width - bevel * 2), bevel * .55);
  if (!quality.surfaceDetail) return;
  const boltRadius = Math.max(1.5, Math.min(4.5, rect.height * .12));
  const y = rect.y + rect.height / 2;
  for (const x of [rect.x + rect.width * .14, rect.x + rect.width * .86]) {
    context.fillStyle = '#c5a15c';
    context.beginPath();
    context.arc(x, y, boltRadius, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(255,247,220,.55)';
    context.beginPath();
    context.arc(x - boltRadius * .28, y - boltRadius * .28, Math.max(.7, boltRadius * .22), 0, Math.PI * 2);
    context.fill();
  }
}

function drawObstacles(arena, transform) {
  for (const obstacle of arena.obstacles) {
    const rect = rectGeometry(obstacle, transform);
    const depth = Math.max(3, 70 * transform.scale);
    if (quality.shadows) {
      context.fillStyle = 'rgba(0,0,0,.24)';
      context.fillRect(rect.x + depth, rect.y + depth, rect.width, rect.height);
    }
    const top = context.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
    top.addColorStop(0, '#55574f');
    top.addColorStop(.14, '#40423c');
    top.addColorStop(1, '#2a2b27');
    context.fillStyle = top;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.strokeStyle = 'rgba(232,225,205,.18)';
    context.lineWidth = Math.max(1, transform.scale * 10);
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    drawObstacleHardware(rect, transform);
  }
}

function drawBumpers(arena, transform) {
  for (const bumper of arena.bumpers) {
    const p = point(bumper.x, bumper.y, transform);
    const radius = bumper.radius * transform.scale;
    if (quality.shadows) {
      context.fillStyle = 'rgba(0,0,0,.26)';
      context.beginPath();
      context.ellipse(p.x + radius * .15, p.y + radius * .28, radius * 1.05, radius * .72, 0, 0, Math.PI * 2);
      context.fill();
    }
    const metal = context.createRadialGradient(p.x - radius * .3, p.y - radius * .35, radius * .08, p.x, p.y, radius);
    metal.addColorStop(0, '#e1ded4');
    metal.addColorStop(.34, '#aaa99f');
    metal.addColorStop(.72, '#64665f');
    metal.addColorStop(1, '#353732');
    context.fillStyle = metal;
    context.beginPath();
    context.arc(p.x, p.y, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#2a2c28';
    context.lineWidth = Math.max(2, radius * .16);
    context.stroke();
    context.fillStyle = '#c7a05a';
    context.beginPath();
    context.arc(p.x, p.y, Math.max(2, radius * .18), 0, Math.PI * 2);
    context.fill();
  }
}

function drawSweepers(arena, transform) {
  for (const sweeper of arena.sweepers) {
    const rect = rectGeometry(sweeper, transform);
    const depth = Math.max(2, 55 * transform.scale);
    if (quality.shadows) {
      context.fillStyle = 'rgba(0,0,0,.3)';
      context.fillRect(rect.x + depth, rect.y + depth, rect.width, rect.height);
    }
    const steel = context.createLinearGradient(rect.x, rect.y, rect.x, rect.y + Math.max(1, rect.height));
    steel.addColorStop(0, '#d2d1c8');
    steel.addColorStop(.22, '#9b9c95');
    steel.addColorStop(.58, '#62645e');
    steel.addColorStop(1, '#3b3d38');
    context.fillStyle = steel;
    context.fillRect(rect.x, rect.y, rect.width, rect.height);
    context.strokeStyle = '#272925';
    context.lineWidth = Math.max(1, transform.scale * 14);
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    const boltRadius = Math.max(2, Math.min(rect.height * .28, 90 * transform.scale));
    for (const x of [rect.x + boltRadius * 1.6, rect.x + rect.width - boltRadius * 1.6]) {
      context.fillStyle = '#d5aa58';
      context.beginPath();
      context.arc(x, rect.y + rect.height / 2, boltRadius, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function drawPattern(pattern, radius) {
  context.strokeStyle = 'rgba(25,25,22,.68)';
  context.fillStyle = 'rgba(25,25,22,.65)';
  context.lineWidth = Math.max(1.4, radius * .1);
  if (pattern === 'ring') {
    for (const factor of [.57, .26]) {
      context.beginPath();
      context.arc(0, 0, radius * factor, 0, Math.PI * 2);
      context.stroke();
    }
  } else if (pattern === 'dots') {
    for (const [x, y] of [[-.35, -.28], [.34, -.3], [0, .18], [-.42, .38], [.42, .37]]) {
      context.beginPath();
      context.arc(x * radius, y * radius, radius * .085, 0, Math.PI * 2);
      context.fill();
    }
  } else if (pattern === 'chevron') {
    for (const offset of [-.25, .18]) {
      context.beginPath();
      context.moveTo(-radius * .68, (offset - .18) * radius);
      context.lineTo(0, (offset + .34) * radius);
      context.lineTo(radius * .68, (offset - .18) * radius);
      context.stroke();
    }
  } else {
    context.fillRect(-radius, -radius * .12, radius * 2, radius * .24);
    context.beginPath();
    context.arc(0, 0, radius * .36, Math.PI, 0);
    context.fill();
  }
}

function updateOrientations(next, previous) {
  const previousById = new Map((previous?.marbles || []).map(marble => [marble.id, marble]));
  const radius = Math.max(1, next.arena.marbleRadius || 1);
  for (const marble of next.marbles) {
    const old = previousById.get(marble.id);
    if (!old) {
      if (!orientationById.has(marble.id)) orientationById.set(marble.id, 0);
      continue;
    }
    const dx = marble.x - old.x;
    const dy = marble.y - old.y;
    const distance = Math.hypot(dx, dy);
    if (distance < .001) continue;
    const direction = Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx || 1) : -Math.sign(dy || 1);
    orientationById.set(marble.id, (orientationById.get(marble.id) || 0) + direction * Math.min(Math.PI * 1.5, distance / radius));
  }
}

function replayView(now) {
  if (!replayActive || replayFrames.length === 0) return null;
  const index = Math.floor((now - replayStartedAt) / REPLAY_FRAME_MS);
  if (index >= replayFrames.length) {
    replayActive = false;
    replayFrames = [];
    if (snapshot) renderHud(snapshot);
    return null;
  }
  const frame = replayFrames[index];
  const replaySnapshot = frame?.snapshot;
  if (!replaySnapshot) return null;
  return {
    ...replaySnapshot,
    camera: Object.freeze({ ...(replaySnapshot.camera || snapshot?.camera || {}), mode: 'replay' }),
  };
}

function interpolatedMarbles(now, view, isReplay) {
  if (!view) return [];
  if (isReplay || !previousSnapshot || previousSnapshot.round.id !== view.round.id || view !== snapshot) return view.marbles;
  const elapsed = Math.min(1, Math.max(0, (now - snapshotArrivedAt) / 120));
  const previousById = new Map(previousSnapshot.marbles.map(marble => [marble.id, marble]));
  return view.marbles.map(marble => {
    const old = previousById.get(marble.id) || marble;
    return { ...marble, x: old.x + (marble.x - old.x) * elapsed, y: old.y + (marble.y - old.y) * elapsed };
  });
}

function drawMarbles(view, transform, now, isReplay) {
  const marbles = interpolatedMarbles(now, view, isReplay);
  const radius = Math.max(3, view.arena.marbleRadius * transform.scale);
  const cutoffId = view.qualificationCutoff?.id;
  for (const marble of marbles) {
    const p = point(marble.x, marble.y, transform);
    const [light, base, dark] = paletteFor(marble.palette);
    if (quality.shadows) {
      context.fillStyle = 'rgba(23,23,20,.28)';
      context.beginPath();
      context.ellipse(p.x + radius * .15, p.y + radius * .48, radius * .88, radius * .38, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.save();
    context.translate(p.x, p.y);
    context.rotate(orientationById.get(marble.id) || 0);
    const body = context.createRadialGradient(-radius * .38, -radius * .42, Math.max(1, radius * .06), 0, 0, radius);
    body.addColorStop(0, quality.specular ? light : base);
    body.addColorStop(.24, base);
    body.addColorStop(.74, base);
    body.addColorStop(1, dark);
    context.fillStyle = body;
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.fill();
    context.save();
    context.beginPath();
    context.arc(0, 0, Math.max(1, radius - 1), 0, Math.PI * 2);
    context.clip();
    drawPattern(marble.pattern, radius);
    context.restore();
    context.restore();
    context.strokeStyle = marble.qualified || marble.status === 'champion' ? '#65b996' : marble.id === cutoffId ? '#d7a64a' : 'rgba(244,240,229,.5)';
    context.lineWidth = Math.max(1, radius * (marble.qualified ? .16 : .09));
    context.beginPath();
    context.arc(p.x, p.y, radius + Math.max(1, radius * .04), 0, Math.PI * 2);
    context.stroke();
    if (radius >= 7) {
      context.fillStyle = '#171714';
      context.font = `800 ${Math.max(7, radius * .62)}px ui-sans-serif, system-ui`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(String(marble.number), p.x, p.y + radius * .02);
    }
  }
}

function draw(now) {
  const frameInterval = 1000 / quality.fps;
  if (now - lastDrawAt < frameInterval - .5) {
    requestAnimationFrame(draw);
    return;
  }
  lastDrawAt = now;
  resizeCanvas();
  drawBackdrop();
  const replay = replayView(now);
  const view = replay || snapshot;
  if (!view) {
    context.fillStyle = '#d7d0be';
    context.font = `700 ${Math.max(16, canvas.width / 48)}px ui-sans-serif, system-ui`;
    context.textAlign = 'center';
    context.fillText('Waiting for deterministic authority…', canvas.width / 2, canvas.height / 2);
  } else {
    const camera = view.camera || snapshot.camera;
    const transform = arenaTransform(view.arena, camera);
    drawTrackFoundation(view.arena, transform);
    drawWindZones(view.arena, transform);
    drawHazards(view.arena, transform);
    drawObstacles(view.arena, transform);
    drawBumpers(view.arena, transform);
    drawSweepers(view.arena, transform);
    drawFinishLine(view.arena, transform);
    drawPerimeterRails(view.arena, transform);
    drawMarbles(view, transform, now, Boolean(replay));
    if (replay) arenaStateLabel.textContent = 'Replay · confirmed tournament moment';
  }
  requestAnimationFrame(draw);
}

function tokenFor(marble) {
  const [light, base] = paletteFor(marble?.palette);
  const token = document.createElement('span');
  token.className = 'marble-token';
  token.style.background = `linear-gradient(145deg, ${light}, ${base})`;
  token.textContent = marble ? String(marble.number) : '—';
  return token;
}

function windLabel(option) {
  return option ? `${option[0].toUpperCase()}${option.slice(1)} wind active · Assisted` : 'Wind vote open';
}

function renderHud(next) {
  roundName.textContent = next.round.name;
  roundIndex.textContent = `Round ${next.round.index} / ${next.round.total}`;
  survivorValue.textContent = String(next.round.remaining);
  quotaValue.textContent = String(next.round.quota);
  recordCategory.textContent = next.recordCategory === 'assisted' ? 'Assisted' : 'Standard';
  recordCategory.dataset.assisted = String(next.recordCategory === 'assisted');
  if (next.influence?.active) voteStatus.textContent = windLabel(next.influence.option);
  else if (Date.now() >= voteLockedUntil) voteStatus.textContent = 'Wind vote open';
  const marbleById = new Map(next.marbles.map(marble => [marble.id, marble]));
  const cutoff = next.qualificationCutoff;
  const cutoffMarble = cutoff ? marbleById.get(cutoff.id) : null;
  if (cutoff && cutoffMarble) {
    cutoffLabel.textContent = `#${cutoff.rank} ${cutoffMarble.displayName}`;
    cutoffDetail.textContent = `${Math.round(cutoff.progressPermille / 10)}% progress · final qualifying position`;
  } else {
    cutoffLabel.textContent = 'Qualification line pending';
    cutoffDetail.textContent = 'The final qualifying position will appear here.';
  }
  leaderboard.replaceChildren(...next.leaderboard.map(entry => {
    const marble = marbleById.get(entry.id);
    const item = document.createElement('li');
    item.dataset.cutoff = String(Boolean(cutoff && cutoff.id === entry.id));
    item.append(tokenFor(marble));
    const copy = document.createElement('span');
    copy.className = 'contender-copy';
    const name = document.createElement('strong');
    name.textContent = marble?.displayName || `Marble ${entry.id + 1}`;
    const detail = document.createElement('span');
    detail.textContent = marble ? `${marble.archetype} · ${marble.intent.replaceAll('-', ' ')}` : entry.status;
    copy.append(name, detail);
    const progress = document.createElement('span');
    progress.className = 'progress-value';
    progress.textContent = `${Math.round(entry.progressPermille / 10)}%`;
    item.append(copy, progress);
    return item;
  }));
  championCard.hidden = !next.champion;
  championName.textContent = next.champion?.displayName || '';
  if (replayActive) arenaStateLabel.textContent = 'Replay · confirmed tournament moment';
  else if (next.run.lifecycle === 'quarantined') arenaStateLabel.textContent = 'Tournament integrity check — starting from verified truth';
  else if (next.champion) arenaStateLabel.textContent = `Champion confirmed: ${next.champion.displayName}`;
  else if (next.camera?.mode === 'finish') arenaStateLabel.textContent = 'Finish view · qualification position contested';
  else if (next.camera?.mode === 'danger') arenaStateLabel.textContent = 'Danger zone · survival under pressure';
  else if (next.round.remaining <= Math.max(next.round.quota + 2, 4)) arenaStateLabel.textContent = 'Qualification pressure — every position matters';
  else arenaStateLabel.textContent = `${next.round.remaining} marbles contesting ${next.round.quota} qualifying places`;
}

function markConnection(ok, label) {
  connection.textContent = label;
  connection.classList.toggle('connected', ok);
}

async function refreshSnapshot() {
  try {
    const response = await fetch('/api/snapshot', { cache: 'no-store' });
    if (!response.ok) throw new Error(`snapshot ${response.status}`);
    const next = await response.json();
    if (!Number.isFinite(next.tick) || !Array.isArray(next.marbles) || !next.arena || !next.camera || !Array.isArray(next.arena.obstacles) || !Array.isArray(next.arena.sweepers) || !Array.isArray(next.arena.hazards)) throw new Error('invalid snapshot');
    if (snapshot && next.round.id === snapshot.round.id && next.tick < latestAcceptedTick) return;
    const old = snapshot;
    previousSnapshot = snapshot;
    snapshot = next;
    latestAcceptedTick = next.round.id === old?.round.id ? Math.max(latestAcceptedTick, next.tick) : next.tick;
    snapshotArrivedAt = performance.now();
    updateOrientations(next, old);
    renderHud(next);
    markConnection(true, 'Authority live');
  } catch {
    markConnection(false, 'Reconnecting');
    arenaStateLabel.textContent = snapshot ? 'Reconnecting — tournament continues' : 'Waiting for tournament authority';
  }
}

function eventLabel(event) {
  const data = event.data || {};
  if (event.type === 'round-started') return 'A new elimination round is underway.';
  if (event.type === 'round-live') return 'The field is live — qualification is open.';
  if (event.type === 'checkpoint-reached') return `Marble ${Number(data.marbleId) + 1} reached checkpoint ${data.checkpointIndex}.`;
  if (event.type === 'marble-qualified') return `Marble ${Number(data.marbleId) + 1} secured qualifying place #${data.finishRank}.`;
  if (event.type === 'marble-eliminated') return `Marble ${Number(data.marbleId) + 1} was eliminated${data.cause ? ` by ${String(data.cause).replaceAll('-', ' ')}` : ''}.`;
  if (event.type === 'shield-recovery') return `Marble ${Number(data.marbleId) + 1} used a recovery shield and stayed alive.`;
  if (event.type === 'elimination-boundary-review') return 'A simultaneous elimination was resolved by the published progress tie policy.';
  if (event.type === 'influence-scheduled') return `${String(data.option || 'Wind')} wind queued for the next authoritative tick.`;
  if (event.type === 'influence-applied') return `${String(data.option || 'Wind')} wind is active for every eligible marble. Tournament record category: Assisted.`;
  if (event.type === 'round-resolved') return 'Qualification is confirmed. The bracket is advancing.';
  if (event.type === 'tournament-champion') return `Champion confirmed: Marble ${Number(data.championId) + 1}.`;
  if (event.type === 'integrity-quarantined') return 'Tournament integrity check triggered. No sporting loss was recorded.';
  if (event.type === 'intermission-started') return 'Result confirmed. The next tournament is being prepared.';
  if (event.type === 'tournament-restarted') return 'A new seeded tournament has started.';
  if (event.type === 'physics-contact' && Number(data.impulse || 0) >= 180) return 'Heavy physical contact in the pack.';
  return null;
}

async function startReplay(eventId) {
  if (replayedEventIds.has(eventId)) return;
  replayedEventIds.add(eventId);
  try {
    const response = await fetch(`/api/replay?frames=${quality.replayFrames}`, { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    const frames = Array.isArray(payload.frames) ? payload.frames.slice(-quality.replayFrames) : [];
    if (frames.length < 2) return;
    replayFrames = frames;
    replayStartedAt = performance.now();
    replayActive = true;
    arenaStateLabel.textContent = 'Replay · confirmed tournament moment';
  } catch {
    // Replay is presentation-only; live authority remains visible if unavailable.
  }
}

const CUE_COOLDOWNS = Object.freeze({
  'physics-contact': 90, 'checkpoint-reached': 180, 'marble-qualified': 180, 'marble-eliminated': 220,
  'shield-recovery': 220, 'round-resolved': 500, 'tournament-champion': 1200, 'influence-applied': 400,
});

function playCue(event) {
  if (!soundEnabled || !audioContext || activeVoices >= 6) return;
  const now = performance.now();
  const cooldown = CUE_COOLDOWNS[event.type] || 120;
  if (now - (lastCueAt.get(event.type) || -Infinity) < cooldown) return;
  const impulse = Number(event.data?.impulse || 0);
  if (event.type === 'physics-contact' && impulse < 70) return;
  lastCueAt.set(event.type, now);
  const frequencyByType = {
    'checkpoint-reached': 360, 'marble-qualified': 520, 'marble-eliminated': 180, 'shield-recovery': 430,
    'round-resolved': 460, 'tournament-champion': 680, 'integrity-quarantined': 150, 'influence-applied': 390,
    'physics-contact': Math.max(100, 250 - Math.min(130, impulse / 3)),
  };
  const frequency = frequencyByType[event.type] || 300;
  const peak = event.type === 'tournament-champion' ? .07 : event.type === 'physics-contact' ? Math.min(.045, .012 + impulse / 9000) : .04;
  const duration = event.type === 'tournament-champion' ? .42 : .18;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(.001, peak), audioContext.currentTime + .012);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  activeVoices++;
  oscillator.onended = () => { activeVoices = Math.max(0, activeVoices - 1); };
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration + .02);
}

async function refreshEvents() {
  try {
    const response = await fetch('/api/events', { cache: 'no-store' });
    if (!response.ok) return;
    const payload = await response.json();
    latestEvents = Array.isArray(payload.events) ? payload.events.slice(-24) : [];
    let latestLabel = null;
    for (const event of latestEvents) {
      const label = eventLabel(event);
      if (label) latestLabel = label;
      if (!seenEventIds.has(event.id)) {
        seenEventIds.add(event.id);
        playCue(event);
        if (event.type === 'round-resolved' || event.type === 'tournament-champion') startReplay(event.id);
      }
    }
    if (latestLabel) eventMessage.textContent = latestLabel;
    if (seenEventIds.size > 256) seenEventIds = new Set(latestEvents.map(event => event.id));
    if (replayedEventIds.size > 128) replayedEventIds = new Set(latestEvents.map(event => event.id));
  } catch {
    // Event presentation is optional; snapshot authority remains visible.
  }
}

function setVoteButtonsDisabled(disabled) {
  for (const button of voteButtons) button.disabled = disabled;
}

async function submitVote(button) {
  if (!button || Date.now() < voteLockedUntil) return;
  const at = Date.now();
  const id = globalThis.crypto?.randomUUID?.() || `${viewerId}:${at}`;
  setVoteButtonsDisabled(true);
  voteStatus.textContent = 'Submitting bounded wind vote…';
  try {
    const response = await fetch('/api/influence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id,
        userId: viewerId,
        family: 'wind-vote',
        option: String(button.dataset.option || ''),
        at,
      }),
    });
    const result = await response.json();
    if (response.status === 202 && result.accepted) {
      voteLockedUntil = at + VOTE_COOLDOWN_MS;
      const label = String(result.option || button.dataset.option || 'wind');
      voteStatus.textContent = `${label[0].toUpperCase()}${label.slice(1)} wind queued`;
      setTimeout(() => {
        if (Date.now() >= voteLockedUntil) {
          setVoteButtonsDisabled(false);
          if (!snapshot?.influence?.active) voteStatus.textContent = 'Wind vote open';
        }
      }, VOTE_COOLDOWN_MS + 100);
      return;
    }
    const copy = {
      cooldown: 'Vote cooldown active',
      duplicate: 'Vote already received',
      'temporarily-unavailable': 'Wind voting temporarily unavailable',
      'state-ineligible': 'Voting opens during live race action',
      'queue-full': 'Wind queue full — try the next window',
    };
    voteStatus.textContent = copy[result.reason] || 'Wind vote not accepted';
  } catch {
    voteStatus.textContent = 'Wind voting reconnecting';
  } finally {
    if (Date.now() >= voteLockedUntil) setVoteButtonsDisabled(false);
  }
}

async function refreshHealth() {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    if (!response.ok) return;
    const health = await response.json();
    if (health.audienceInfluence === 'degraded') {
      voteStatus.textContent = 'Temporarily unavailable';
      setVoteButtonsDisabled(true);
    } else if (Date.now() >= voteLockedUntil) {
      setVoteButtonsDisabled(false);
      if (!snapshot?.influence?.active) voteStatus.textContent = 'Wind vote open';
    }
    if (health.status === 'degraded') markConnection(true, 'Authority live · presentation catching up');
    if (health.status === 'unhealthy') markConnection(false, 'Integrity recovery');
  } catch {
    // Snapshot polling owns public connection status.
  }
}

for (const button of voteButtons) button.addEventListener('click', () => submitVote(button));

soundToggle.addEventListener('click', async () => {
  if (!audioContext) audioContext = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
  if (audioContext.state === 'suspended') await audioContext.resume();
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  soundToggle.textContent = soundEnabled ? 'Sound on' : 'Sound off';
});

requestAnimationFrame(draw);
refreshSnapshot();
refreshEvents();
refreshHealth();
setInterval(refreshSnapshot, 100);
setInterval(refreshEvents, 400);
setInterval(refreshHealth, 2000);