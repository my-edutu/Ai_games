'use strict';

const MAX_PARTICLES = 240;
const POLL_MS = 125;
const policy = window.SnakeRenderPolicy;
if (!policy) throw new Error('Snake render policy unavailable');

const canvas = document.getElementById('game');
const context = canvas.getContext('2d', { alpha: false, desynchronized: true });
const broadcast = document.getElementById('broadcast');
const primary = document.getElementById('primary');
const secondary = document.getElementById('secondary');
const record = document.getElementById('record');
const intent = document.getElementById('intent');
const caption = document.getElementById('caption');
const audienceCopy = document.getElementById('audience-copy');
const integrity = document.getElementById('integrity');
const sceneTitle = document.getElementById('scene-title');
const sceneCopy = document.getElementById('scene-copy');
const riskLabel = document.getElementById('risk-label');
const objectiveLabel = document.getElementById('objective-label');
const progressFill = document.getElementById('objective-progress');
const qualityLabel = document.getElementById('quality-label');
const qualitySelect = document.getElementById('quality-select');

const query = new URLSearchParams(window.location.search);
const requestedMode = String(query.get('mode') || 'broadcast').toLowerCase();
const outputMode = ['broadcast', 'spectator', 'operator'].includes(requestedMode) ? requestedMode : 'broadcast';
let quality = policy.normalizeQuality(query.get('quality'));
let settings = policy.qualitySettings(quality, window.devicePixelRatio || 1);
let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let muted = true;
let cleanFeed = false;
let polling = true;
let frame;
let previousFrame;
let previousReceivedAt = 0;
let receivedAt = 0;
let previousSegments = new Map();
let pendingFoodBurst = null;
let lastFoodBurstKey = '';
let audioContext;
let lastScene = '';
let lastPortalRevision = -1;

const particles = [];
const particlePool = [];
const renderPoints = [];
const canvasMetrics = { cssWidth: 1, cssHeight: 1, pixelRatio: settings.pixelRatio, dirty: true };

broadcast.dataset.mode = outputMode;
broadcast.dataset.quality = quality;
if (outputMode === 'operator' || query.get('controls') === '1') broadcast.classList.add('show-controls');
if (qualitySelect) {
  qualitySelect.value = quality;
  qualitySelect.addEventListener('change', () => setQuality(qualitySelect.value));
}

function setQuality(value) {
  quality = policy.normalizeQuality(value);
  settings = policy.qualitySettings(quality, window.devicePixelRatio || 1);
  canvasMetrics.pixelRatio = settings.pixelRatio;
  canvasMetrics.dirty = true;
  broadcast.dataset.quality = quality;
  if (qualitySelect) qualitySelect.value = quality;
  if (qualityLabel) qualityLabel.textContent = quality.toUpperCase();
  while (particles.length > settings.particleLimit) recycleParticle(particles.pop());
}

function updateCanvasMetrics() {
  const bounds = canvas.getBoundingClientRect();
  canvasMetrics.cssWidth = Math.max(1, bounds.width);
  canvasMetrics.cssHeight = Math.max(1, bounds.height);
  canvasMetrics.pixelRatio = policy.qualitySettings(quality, window.devicePixelRatio || 1).pixelRatio;
  canvasMetrics.dirty = true;
}

function ensureCanvasSize() {
  if (!canvasMetrics.dirty) return;
  const width = Math.max(1, Math.round(canvasMetrics.cssWidth * canvasMetrics.pixelRatio));
  const height = Math.max(1, Math.round(canvasMetrics.cssHeight * canvasMetrics.pixelRatio));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  canvasMetrics.dirty = false;
}

const resizeObserver = typeof ResizeObserver === 'function'
  ? new ResizeObserver(updateCanvasMetrics)
  : null;
if (resizeObserver) resizeObserver.observe(canvas);
window.addEventListener('resize', updateCanvasMetrics, { passive: true });
updateCanvasMetrics();

function setPressed(button, value) {
  button.setAttribute('aria-pressed', String(value));
}

for (const button of document.querySelectorAll('[data-control]')) {
  const control = button.getAttribute('data-control');
  if (control === 'reduced-motion') setPressed(button, reducedMotion);
  if (control === 'muted') setPressed(button, muted);
  if (control === 'clean-feed') setPressed(button, cleanFeed);
  button.addEventListener('click', () => {
    if (control === 'reduced-motion') reducedMotion = !reducedMotion;
    if (control === 'muted') {
      muted = !muted;
      if (!muted) ensureAudio();
    }
    if (control === 'clean-feed') {
      cleanFeed = !cleanFeed;
      broadcast.classList.toggle('clean-feed', cleanFeed);
    }
    setPressed(button, control === 'reduced-motion' ? reducedMotion : control === 'muted' ? muted : cleanFeed);
  });
}

function ensureAudio() {
  if (audioContext) {
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return audioContext;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return undefined;
  audioContext = new AudioContext();
  return audioContext;
}

function tone(frequency, duration, gainValue, type = 'sine') {
  if (muted) return;
  const audio = ensureAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function headTeleported(previousSnapshot, nextSnapshot) {
  const previousHead = previousSnapshot?.snake?.[0]?.cell;
  const nextHead = nextSnapshot?.snake?.[0]?.cell;
  if (!Number.isInteger(previousHead) || !Number.isInteger(nextHead)) return false;
  return policy.interpolationPoint(previousHead, nextHead, nextSnapshot.width, 0.5).teleported;
}

function updateSemanticAudio(nextFrame, previous) {
  const snapshot = nextFrame.snapshot;
  if (!snapshot) return;
  if (previous?.snapshot && snapshot.foodsCollected > previous.snapshot.foodsCollected) {
    tone(snapshot.food?.kind === 'bonus' ? 760 : 660, 0.13, 0.045, 'triangle');
  }
  if (previous?.snapshot && headTeleported(previous.snapshot, snapshot) && snapshot.revision !== lastPortalRevision) {
    lastPortalRevision = snapshot.revision;
    tone(520, 0.18, 0.038, 'sine');
  }
  if (lastScene !== nextFrame.scene) {
    if (nextFrame.scene === 'danger') tone(210, 0.22, 0.04, 'sawtooth');
    if (nextFrame.scene === 'milestone') tone(740, 0.3, 0.05, 'triangle');
    if (nextFrame.scene === 'result') tone(snapshot.result?.reason === 'victory' ? 880 : 150, 0.5, 0.06, 'sine');
    if (nextFrame.scene === 'recovery') tone(330, 0.25, 0.03, 'square');
  }
  lastScene = nextFrame.scene;
}

function updateText(nextFrame) {
  broadcast.dataset.scene = nextFrame.scene || 'maintenance';
  const hud = nextFrame.hud;
  const snapshot = nextFrame.snapshot;
  primary.textContent = hud?.primaryLabel || 'PREPARING RUN';
  secondary.textContent = hud?.secondaryLabel || 'VERIFIED SIMULATION';
  record.textContent = hud?.recordLabel || 'BEST —';
  intent.textContent = snapshot
    ? policy.decisionSummary(snapshot.ai, snapshot.occupancy)
    : 'Initializing deterministic strategy';
  caption.textContent = hud?.caption || nextFrame.publicStatus || 'Autonomous run in progress';
  audienceCopy.textContent = hud?.audienceLabel || 'AUDIENCE INTERACTIONS — BOUNDED';
  integrity.textContent = snapshot ? 'INTEGRITY: VERIFIED' : 'INTEGRITY: PREPARING';

  if (snapshot) {
    const risk = snapshot.dangerLevel >= 2 ? 'CRITICAL' : snapshot.dangerLevel === 1 ? 'ELEVATED' : 'STABLE';
    riskLabel.textContent = `RISK ${risk}`;
    riskLabel.dataset.level = String(snapshot.dangerLevel);
    objectiveLabel.textContent = `LENGTH ${snapshot.length} / ${snapshot.goal}`;
    progressFill.style.transform = `scaleX(${Math.max(0, Math.min(1, snapshot.progress))})`;
    qualityLabel.textContent = quality.toUpperCase();
  }

  const resultLabel = hud?.resultLabel;
  if (nextFrame.scene === 'result') {
    sceneTitle.textContent = resultLabel || 'RUN COMPLETE';
    sceneCopy.textContent = `Length ${snapshot?.length ?? 0} · Score ${snapshot?.score ?? 0} · ${humanizeResult(snapshot?.result?.reason)}`;
  } else if (nextFrame.scene === 'intermission') {
    sceneTitle.textContent = 'NEXT RUN LOADING';
    sceneCopy.textContent = 'A new deterministic world starts automatically.';
  } else if (nextFrame.scene === 'recovery') {
    sceneTitle.textContent = 'RESTORING VERIFIED VIEW';
    sceneCopy.textContent = 'Simulation authority remains separate while presentation reconnects.';
  } else if (nextFrame.scene === 'maintenance') {
    sceneTitle.textContent = 'PREPARING AUTONOMOUS RUN';
    sceneCopy.textContent = 'A verified game view will appear automatically.';
  }
}

function humanizeResult(reason) {
  const labels = {
    victory: 'Objective conquered',
    'wall-collision': 'Wall collision',
    'self-collision': 'Self collision',
    hazard: 'Hazard collision',
    trapped: 'No safe route remained',
    timeout: 'Run timed out',
    'arena-collapse': 'Arena collapse',
  };
  return labels[reason] || String(reason || 'Verified result').replaceAll('-', ' ');
}

async function poll() {
  while (polling) {
    try {
      const response = await fetch('/snapshot', { cache: 'no-store', headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error('snapshot unavailable');
      const next = await response.json();
      const previous = frame;
      previousFrame = previous;
      previousReceivedAt = receivedAt || performance.now();
      frame = next;
      receivedAt = performance.now();
      previousSegments = new Map((previous?.snapshot?.snake || []).map(segment => [segment.id, segment]));

      const burstKey = policy.foodBurstKey(previous?.snapshot, next.snapshot);
      if (burstKey && burstKey !== lastFoodBurstKey) {
        lastFoodBurstKey = burstKey;
        pendingFoodBurst = { key: burstKey, snapshot: next.snapshot, kind: previous?.snapshot?.food?.kind || 'standard' };
      }

      updateSemanticAudio(next, previous);
      updateText(next);
    } catch {
      broadcast.dataset.scene = 'recovery';
      sceneTitle.textContent = 'RECONNECTING VIEW';
      sceneCopy.textContent = 'The autonomous simulation remains protected.';
      caption.textContent = 'Stream view reconnecting';
    }
    await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function acquireParticle() {
  return particlePool.pop() || { x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '#fff', size: 1 };
}

function recycleParticle(particle) {
  if (particle && particlePool.length < MAX_PARTICLES) particlePool.push(particle);
}

function spawnParticles(x, y, color) {
  const amount = reducedMotion ? Math.max(2, Math.ceil(settings.particleBurst * 0.25)) : settings.particleBurst;
  for (let i = 0; i < amount && particles.length < settings.particleLimit && particles.length < MAX_PARTICLES; i++) {
    const particle = acquireParticle();
    const angle = (Math.PI * 2 * i) / Math.max(1, amount);
    const speed = 0.34 + (i % 4) * 0.1;
    particle.x = x;
    particle.y = y;
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    particle.life = 1;
    particle.color = color;
    particle.size = 1.5 + (i % 3);
    particles.push(particle);
  }
}

function updateParticles(ctx, delta, cell, originX, originY) {
  let write = 0;
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta * 0.045;
    if (particle.life <= 0) {
      recycleParticle(particle);
      continue;
    }
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(originX + particle.x * cell, originY + particle.y * cell, particle.size * canvasMetrics.pixelRatio, 0, Math.PI * 2);
    ctx.fill();
    particles[write++] = particle;
  }
  particles.length = write;
  ctx.globalAlpha = 1;
}

function drawArena(ctx, snapshot, originX, originY, boardWidth, boardHeight, cell, timestamp) {
  const floor = ctx.createLinearGradient(originX, originY, originX + boardWidth, originY + boardHeight);
  floor.addColorStop(0, '#071b17');
  floor.addColorStop(0.5, '#07130f');
  floor.addColorStop(1, '#050d0b');
  ctx.fillStyle = floor;
  if (settings.shadows) {
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = cell * 0.65;
    ctx.shadowOffsetY = cell * 0.16;
  }
  roundedRect(ctx, originX, originY, boardWidth, boardHeight, Math.max(12, cell * 0.32));
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const profileAccent = {
    open: 'rgba(87,247,165,.1)',
    walls: 'rgba(164,197,255,.1)',
    corridors: 'rgba(255,209,102,.09)',
    portals: 'rgba(159,122,255,.1)',
    hazards: 'rgba(255,95,114,.08)',
  }[snapshot.boardProfile] || 'rgba(87,247,165,.08)';
  ctx.fillStyle = profileAccent;
  roundedRect(ctx, originX + cell * 0.18, originY + cell * 0.18, boardWidth - cell * 0.36, boardHeight - cell * 0.36, Math.max(9, cell * 0.24));
  ctx.fill();

  ctx.strokeStyle = 'rgba(108,220,170,.075)';
  ctx.lineWidth = Math.max(1, cell * 0.02);
  const stride = Math.max(1, settings.gridStride);
  for (let x = stride; x < snapshot.width; x += stride) {
    ctx.beginPath();
    ctx.moveTo(originX + x * cell, originY);
    ctx.lineTo(originX + x * cell, originY + boardHeight);
    ctx.stroke();
  }
  for (let y = stride; y < snapshot.height; y += stride) {
    ctx.beginPath();
    ctx.moveTo(originX, originY + y * cell);
    ctx.lineTo(originX + boardWidth, originY + y * cell);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(126,255,198,.18)';
  ctx.lineWidth = Math.max(1, cell * 0.04);
  roundedRect(ctx, originX + 1, originY + 1, boardWidth - 2, boardHeight - 2, Math.max(12, cell * 0.32));
  ctx.stroke();

  if (settings.detail >= 0.7) {
    const pulse = reducedMotion ? 0.18 : 0.14 + Math.sin(timestamp * 0.0012) * 0.035;
    ctx.strokeStyle = `rgba(87,247,165,${Math.max(0.08, pulse)})`;
    ctx.lineWidth = Math.max(1, cell * 0.02);
    roundedRect(ctx, originX + cell * 0.34, originY + cell * 0.34, boardWidth - cell * 0.68, boardHeight - cell * 0.68, Math.max(8, cell * 0.2));
    ctx.stroke();
  }
}

function drawObstacles(ctx, snapshot, originX, originY, cell) {
  for (const obstacle of snapshot.obstacles) {
    const point = policy.cellPosition(obstacle, snapshot.width);
    const x = originX + point.x * cell + cell * 0.1;
    const y = originY + point.y * cell + cell * 0.1;
    const size = cell * 0.8;
    const face = ctx.createLinearGradient(x, y, x, y + size);
    face.addColorStop(0, '#30453f');
    face.addColorStop(1, '#17231f');
    ctx.fillStyle = face;
    roundedRect(ctx, x, y, size, size, cell * 0.14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(191,230,215,.28)';
    ctx.lineWidth = Math.max(1, cell * 0.035);
    ctx.stroke();
    if (settings.detail >= 0.7) {
      ctx.strokeStyle = 'rgba(255,255,255,.1)';
      ctx.beginPath();
      ctx.moveTo(x + cell * 0.16, y + cell * 0.22);
      ctx.lineTo(x + size - cell * 0.16, y + cell * 0.22);
      ctx.stroke();
    }
  }
}

function drawPortals(ctx, snapshot, originX, originY, cell, timestamp) {
  const spin = reducedMotion ? 0 : timestamp * 0.0022;
  for (const portal of snapshot.portals) {
    for (const [portalCell, inverse] of [[portal.entry, false], [portal.exit, true]]) {
      const point = policy.cellPosition(portalCell, snapshot.width);
      const cx = originX + (point.x + 0.5) * cell;
      const cy = originY + (point.y + 0.5) * cell;
      for (let ring = 0; ring < settings.portalRings; ring++) {
        const radius = cell * (0.18 + ring * 0.065);
        ctx.strokeStyle = ring % 2 === 0 ? 'rgba(164,126,255,.88)' : 'rgba(87,247,165,.7)';
        ctx.lineWidth = Math.max(1, cell * (0.055 - ring * 0.006));
        ctx.beginPath();
        ctx.arc(cx, cy, radius, spin * (inverse ? -1 : 1) + ring, spin * (inverse ? -1 : 1) + ring + Math.PI * 1.35);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(139,105,255,.11)';
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.33, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawHazards(ctx, snapshot, originX, originY, cell, timestamp) {
  const pulse = reducedMotion ? 1 : 0.88 + Math.sin(timestamp * 0.008) * 0.12;
  for (const hazard of snapshot.hazards) {
    const point = policy.cellPosition(hazard.cell, snapshot.width);
    const cx = originX + (point.x + 0.5) * cell;
    const cy = originY + (point.y + 0.5) * cell;
    const scale = hazard.active ? pulse : 0.82;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = hazard.active ? '#ff5f72' : 'rgba(255,209,102,.46)';
    ctx.beginPath();
    ctx.moveTo(0, -cell * 0.34);
    ctx.lineTo(cell * 0.32, cell * 0.27);
    ctx.lineTo(-cell * 0.32, cell * 0.27);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hazard.active ? 'rgba(255,230,233,.74)' : 'rgba(255,235,190,.42)';
    ctx.lineWidth = Math.max(1, cell * 0.045);
    ctx.stroke();
    ctx.fillStyle = '#09120f';
    ctx.font = `900 ${Math.max(9, cell * 0.31)}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, cell * 0.05);
    ctx.restore();
  }
}

function drawFood(ctx, snapshot, originX, originY, cell, timestamp) {
  if (!snapshot.food) return;
  const point = policy.cellPosition(snapshot.food.cell, snapshot.width);
  const cx = originX + (point.x + 0.5) * cell;
  const cy = originY + (point.y + 0.5) * cell;
  const bonus = snapshot.food.kind === 'bonus';
  const pulse = reducedMotion ? 1 : 0.94 + Math.sin(timestamp * 0.006) * 0.06;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);
  if (settings.shadows) {
    ctx.shadowColor = bonus ? 'rgba(255,209,102,.42)' : 'rgba(87,247,165,.36)';
    ctx.shadowBlur = cell * 0.5;
  }
  ctx.rotate(Math.PI / 4);
  const fill = ctx.createLinearGradient(-cell * 0.2, -cell * 0.2, cell * 0.2, cell * 0.2);
  fill.addColorStop(0, bonus ? '#fff1a8' : '#d8fff0');
  fill.addColorStop(1, bonus ? '#e4a52c' : '#38dda2');
  ctx.fillStyle = fill;
  roundedRect(ctx, -cell * 0.22, -cell * 0.22, cell * 0.44, cell * 0.44, cell * 0.08);
  ctx.fill();
  ctx.restore();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = bonus ? 'rgba(255,209,102,.58)' : 'rgba(87,247,165,.45)';
  ctx.lineWidth = Math.max(1, cell * 0.045);
  ctx.beginPath();
  ctx.arc(cx, cy, cell * 0.37, 0, Math.PI * 2);
  ctx.stroke();
}

function populateRenderPoints(snapshot, alpha) {
  renderPoints.length = snapshot.snake.length;
  for (let index = 0; index < snapshot.snake.length; index++) {
    const segment = snapshot.snake[index];
    const previous = previousSegments.get(segment.id) || segment;
    const interpolated = policy.interpolationPoint(previous.cell, segment.cell, snapshot.width, reducedMotion ? 1 : alpha);
    let point = renderPoints[index];
    if (!point) point = renderPoints[index] = {};
    point.x = interpolated.x;
    point.y = interpolated.y;
    point.teleported = interpolated.teleported;
    point.role = segment.role;
  }
}

function drawSnake(ctx, snapshot, originX, originY, cell, alpha) {
  populateRenderPoints(snapshot, alpha);
  if (!renderPoints.length) return;

  const toPixel = point => ({
    x: originX + (point.x + 0.5) * cell,
    y: originY + (point.y + 0.5) * cell,
  });

  const drawSpine = (lineWidth, strokeStyle) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.beginPath();
    let started = false;
    let previousPixel = null;
    for (let index = renderPoints.length - 1; index >= 0; index--) {
      const pixel = toPixel(renderPoints[index]);
      const connected = previousPixel
        ? Math.hypot(pixel.x - previousPixel.x, pixel.y - previousPixel.y) <= cell * 1.6
        : false;
      if (!started || !connected) {
        ctx.moveTo(pixel.x, pixel.y);
        started = true;
      } else {
        ctx.lineTo(pixel.x, pixel.y);
      }
      previousPixel = pixel;
    }
    ctx.stroke();
  };

  if (settings.shadows) drawSpine(cell * 0.68, 'rgba(0,0,0,.34)');
  drawSpine(cell * 0.61, '#0d5f4a');
  const bodyGradient = ctx.createLinearGradient(originX, originY, originX + cell * snapshot.width, originY + cell * snapshot.height);
  bodyGradient.addColorStop(0, '#87ffd3');
  bodyGradient.addColorStop(0.5, '#2be0a5');
  bodyGradient.addColorStop(1, '#159271');
  drawSpine(cell * 0.52, bodyGradient);

  if (settings.detail >= 0.7) {
    ctx.fillStyle = 'rgba(225,255,243,.2)';
    for (let index = 2; index < renderPoints.length - 1; index += 2) {
      const pixel = toPixel(renderPoints[index]);
      ctx.beginPath();
      ctx.arc(pixel.x, pixel.y, cell * 0.105, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const headPoint = toPixel(renderPoints[0]);
  const heading = policy.inferHeadDirection(snapshot, previousFrame?.snapshot);
  const angle = Math.atan2(heading.y, heading.x);
  ctx.save();
  ctx.translate(headPoint.x, headPoint.y);
  ctx.rotate(angle);
  if (settings.shadows) {
    ctx.shadowColor = 'rgba(61,255,194,.25)';
    ctx.shadowBlur = cell * 0.42;
  }
  const headGradient = ctx.createLinearGradient(-cell * 0.42, -cell * 0.35, cell * 0.45, cell * 0.35);
  headGradient.addColorStop(0, '#35d6a1');
  headGradient.addColorStop(0.62, '#83ffe0');
  headGradient.addColorStop(1, '#d9fff6');
  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, cell * 0.47, cell * 0.39, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(239,255,250,.72)';
  ctx.lineWidth = Math.max(1, cell * 0.045);
  ctx.stroke();

  ctx.fillStyle = '#06261f';
  const eyeX = cell * 0.24;
  const eyeY = cell * 0.145;
  for (const y of [-eyeY, eyeY]) {
    ctx.beginPath();
    ctx.ellipse(eyeX, y, cell * 0.065, cell * 0.085, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b8fff0';
    ctx.beginPath();
    ctx.arc(eyeX + cell * 0.018, y - cell * 0.018, cell * 0.018, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#06261f';
  }
  ctx.restore();

  if (renderPoints.length > 1) {
    const tail = toPixel(renderPoints[renderPoints.length - 1]);
    ctx.fillStyle = '#168466';
    ctx.beginPath();
    ctx.arc(tail.x, tail.y, cell * 0.23, 0, Math.PI * 2);
    ctx.fill();
  }
}

function consumeFoodBurst(snapshot) {
  if (!pendingFoodBurst || pendingFoodBurst.snapshot !== snapshot || !snapshot.snake[0]) return;
  const head = policy.cellPosition(snapshot.snake[0].cell, snapshot.width);
  spawnParticles(head.x + 0.5, head.y + 0.5, pendingFoodBurst.kind === 'bonus' ? '#ffd166' : '#57f7a5');
  pendingFoodBurst = null;
}

function drawDangerFrame(ctx, originX, originY, boardWidth, boardHeight, cell) {
  if (frame?.scene !== 'danger') return;
  ctx.strokeStyle = 'rgba(255,95,114,.62)';
  ctx.lineWidth = Math.max(3, cell * 0.1);
  roundedRect(ctx, originX + 3, originY + 3, boardWidth - 6, boardHeight - 6, Math.max(12, cell * 0.3));
  ctx.stroke();
}

function draw(timestamp) {
  ensureCanvasSize();
  const width = canvas.width;
  const height = canvas.height;
  context.fillStyle = '#030806';
  context.fillRect(0, 0, width, height);

  const snapshot = frame?.snapshot;
  if (!snapshot) {
    context.fillStyle = '#173128';
    context.font = `700 ${Math.max(24, Math.round(height * 0.052))}px system-ui`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('AUTONOMOUS ARENA INITIALIZING', width / 2, height / 2);
    requestAnimationFrame(draw);
    return;
  }

  const pad = Math.max(14 * canvasMetrics.pixelRatio, Math.round(Math.min(width, height) * 0.026));
  const availableWidth = width - pad * 2;
  const availableHeight = height - pad * 2;
  const cell = Math.min(availableWidth / snapshot.width, availableHeight / snapshot.height);
  const boardWidth = cell * snapshot.width;
  const boardHeight = cell * snapshot.height;
  const originX = (width - boardWidth) / 2;
  const originY = (height - boardHeight) / 2;

  drawArena(context, snapshot, originX, originY, boardWidth, boardHeight, cell, timestamp);
  drawObstacles(context, snapshot, originX, originY, cell);
  drawPortals(context, snapshot, originX, originY, cell, timestamp);
  drawHazards(context, snapshot, originX, originY, cell, timestamp);
  drawFood(context, snapshot, originX, originY, cell, timestamp);

  const duration = Math.max(1, receivedAt - previousReceivedAt || POLL_MS);
  const alpha = reducedMotion ? 1 : Math.max(0, Math.min(1, (timestamp - receivedAt + POLL_MS) / duration));
  drawSnake(context, snapshot, originX, originY, cell, alpha);

  consumeFoodBurst(snapshot);
  const delta = Math.min(3, Math.max(0.25, (timestamp - (draw.lastTime || timestamp)) / 16.67));
  updateParticles(context, delta, cell, originX, originY);
  draw.lastTime = timestamp;

  drawDangerFrame(context, originX, originY, boardWidth, boardHeight, cell);
  requestAnimationFrame(draw);
}

draw.lastTime = 0;
setQuality(quality);
window.addEventListener('beforeunload', () => {
  polling = false;
  if (resizeObserver) resizeObserver.disconnect();
});
poll();
requestAnimationFrame(draw);
