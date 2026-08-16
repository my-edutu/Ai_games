'use strict';

const MAX_PARTICLES = 240;
const POLL_MS = 125;
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
const operatorControlsEnabled = new URLSearchParams(window.location.search).get('controls') === '1';

let frame;
let previousFrame;
let receivedAt = 0;
let previousReceivedAt = 0;
let polling = true;
let reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let muted = true;
let cleanFeed = false;
let particles = [];
let audioContext;
let lastFoodCount = -1;
let lastScene = '';

if (operatorControlsEnabled) broadcast.classList.add('show-controls');

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  const width = Math.max(1, Math.round(bounds.width * ratio));
  const height = Math.max(1, Math.round(bounds.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

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
  if (audioContext) return audioContext;
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

function updateSemanticAudio(nextFrame) {
  const snapshot = nextFrame.snapshot;
  if (!snapshot) return;
  if (lastFoodCount >= 0 && snapshot.foodsCollected > lastFoodCount) tone(660, 0.13, 0.05, 'triangle');
  if (lastScene !== nextFrame.scene) {
    if (nextFrame.scene === 'danger') tone(210, 0.22, 0.045, 'sawtooth');
    if (nextFrame.scene === 'milestone') tone(740, 0.3, 0.055, 'triangle');
    if (nextFrame.scene === 'result') tone(snapshot.result?.reason === 'victory' ? 880 : 150, 0.5, 0.065, 'sine');
    if (nextFrame.scene === 'recovery') tone(330, 0.25, 0.035, 'square');
  }
  lastFoodCount = snapshot.foodsCollected;
  lastScene = nextFrame.scene;
}

function updateText(nextFrame) {
  broadcast.dataset.scene = nextFrame.scene || 'maintenance';
  const hud = nextFrame.hud;
  primary.textContent = hud?.primaryLabel || 'PREPARING RUN';
  secondary.textContent = hud?.secondaryLabel || 'VERIFIED SIMULATION';
  record.textContent = hud?.recordLabel || 'BEST —';
  intent.textContent = hud?.intent || 'Initializing deterministic strategy';
  caption.textContent = hud?.caption || nextFrame.publicStatus || 'Autonomous run in progress';
  audienceCopy.textContent = hud?.audienceLabel || 'AUDIENCE INTERACTIONS — PHASE 4';
  integrity.textContent = nextFrame.snapshot ? 'INTEGRITY: VERIFIED' : 'INTEGRITY: PREPARING';

  const resultLabel = hud?.resultLabel;
  if (nextFrame.scene === 'result') {
    sceneTitle.textContent = resultLabel || 'RUN COMPLETE';
    sceneCopy.textContent = `Length ${nextFrame.snapshot?.length ?? 0} • Score ${nextFrame.snapshot?.score ?? 0} • Verified result`;
  } else if (nextFrame.scene === 'intermission') {
    sceneTitle.textContent = 'NEXT RUN LOADING';
    sceneCopy.textContent = 'A new deterministic world starts automatically.';
  } else if (nextFrame.scene === 'recovery') {
    sceneTitle.textContent = 'RESTORING VERIFIED VIEW';
    sceneCopy.textContent = 'The autonomous simulation continues while presentation is rebuilt.';
  } else if (nextFrame.scene === 'maintenance') {
    sceneTitle.textContent = 'PREPARING AUTONOMOUS RUN';
    sceneCopy.textContent = 'A verified game view will appear automatically.';
  }
}

async function poll() {
  while (polling) {
    try {
      const response = await fetch('/snapshot', { cache: 'no-store', headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error('snapshot unavailable');
      const next = await response.json();
      previousFrame = frame;
      previousReceivedAt = receivedAt || performance.now();
      frame = next;
      receivedAt = performance.now();
      updateSemanticAudio(next);
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

function cellPosition(cell, width) {
  return { x: cell % width, y: Math.floor(cell / width) };
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

function spawnParticles(x, y, color, count) {
  const amount = reducedMotion ? Math.ceil(count * 0.25) : count;
  for (let i = 0; i < amount && particles.length < MAX_PARTICLES; i++) {
    const angle = (Math.PI * 2 * i) / Math.max(1, amount);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * (0.4 + (i % 3) * 0.15),
      vy: Math.sin(angle) * (0.4 + (i % 3) * 0.15),
      life: 1,
      color,
      size: 2 + (i % 3),
    });
  }
}

function updateParticles(ctx, delta, scaleX, scaleY, originX, originY) {
  const kept = [];
  for (const particle of particles) {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    particle.life -= delta * 0.045;
    if (particle.life <= 0) continue;
    ctx.globalAlpha = Math.max(0, particle.life);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(originX + particle.x * scaleX, originY + particle.y * scaleY, particle.size, 0, Math.PI * 2);
    ctx.fill();
    kept.push(particle);
  }
  ctx.globalAlpha = 1;
  particles = kept.slice(-MAX_PARTICLES);
}

function draw(timestamp) {
  resizeCanvas();
  const width = canvas.width;
  const height = canvas.height;
  context.fillStyle = '#030710';
  context.fillRect(0, 0, width, height);

  const snapshot = frame?.snapshot;
  if (!snapshot) {
    context.fillStyle = '#13213d';
    context.font = `700 ${Math.max(24, Math.round(height * 0.055))}px system-ui`;
    context.textAlign = 'center';
    context.fillText('AUTONOMOUS GAME INITIALIZING', width / 2, height / 2);
    requestAnimationFrame(draw);
    return;
  }

  const pad = Math.max(18, Math.round(Math.min(width, height) * 0.035));
  const availableWidth = width - pad * 2;
  const availableHeight = height - pad * 2;
  const cell = Math.min(availableWidth / snapshot.width, availableHeight / snapshot.height);
  const boardWidth = cell * snapshot.width;
  const boardHeight = cell * snapshot.height;
  const originX = (width - boardWidth) / 2;
  const originY = (height - boardHeight) / 2;

  const gradient = context.createLinearGradient(originX, originY, originX + boardWidth, originY + boardHeight);
  gradient.addColorStop(0, '#07152b');
  gradient.addColorStop(1, '#06101f');
  context.fillStyle = gradient;
  roundedRect(context, originX, originY, boardWidth, boardHeight, Math.max(12, cell * 0.32));
  context.fill();

  context.strokeStyle = 'rgba(130,170,220,.1)';
  context.lineWidth = Math.max(1, cell * 0.025);
  for (let x = 1; x < snapshot.width; x++) {
    context.beginPath();
    context.moveTo(originX + x * cell, originY);
    context.lineTo(originX + x * cell, originY + boardHeight);
    context.stroke();
  }
  for (let y = 1; y < snapshot.height; y++) {
    context.beginPath();
    context.moveTo(originX, originY + y * cell);
    context.lineTo(originX + boardWidth, originY + y * cell);
    context.stroke();
  }

  for (const obstacle of snapshot.obstacles) {
    const point = cellPosition(obstacle, snapshot.width);
    context.fillStyle = '#23324e';
    roundedRect(context, originX + point.x * cell + cell * .12, originY + point.y * cell + cell * .12, cell * .76, cell * .76, cell * .16);
    context.fill();
    context.strokeStyle = 'rgba(190,210,245,.34)';
    context.stroke();
  }

  for (const portal of snapshot.portals) {
    for (const portalCell of [portal.entry, portal.exit]) {
      const point = cellPosition(portalCell, snapshot.width);
      const cx = originX + (point.x + .5) * cell;
      const cy = originY + (point.y + .5) * cell;
      context.strokeStyle = '#9c7cff';
      context.lineWidth = Math.max(2, cell * .12);
      context.beginPath();
      context.arc(cx, cy, cell * .31, 0, Math.PI * 2);
      context.stroke();
      context.strokeStyle = 'rgba(111,255,210,.8)';
      context.lineWidth = Math.max(1, cell * .04);
      context.beginPath();
      context.arc(cx, cy, cell * .18, 0, Math.PI * 2);
      context.stroke();
    }
  }

  for (const hazard of snapshot.hazards) {
    const point = cellPosition(hazard.cell, snapshot.width);
    const cx = originX + (point.x + .5) * cell;
    const cy = originY + (point.y + .5) * cell;
    context.fillStyle = hazard.active ? '#ff5d76' : 'rgba(255, 193, 102, .42)';
    context.beginPath();
    context.moveTo(cx, cy - cell * .34);
    context.lineTo(cx + cell * .31, cy + cell * .27);
    context.lineTo(cx - cell * .31, cy + cell * .27);
    context.closePath();
    context.fill();
    context.fillStyle = '#08101f';
    context.font = `900 ${Math.max(9, cell * .33)}px system-ui`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('!', cx, cy + cell * .06);
  }

  if (snapshot.food) {
    const point = cellPosition(snapshot.food.cell, snapshot.width);
    const cx = originX + (point.x + .5) * cell;
    const cy = originY + (point.y + .5) * cell;
    const bonus = snapshot.food.kind === 'bonus';
    context.save();
    context.translate(cx, cy);
    context.rotate(Math.PI / 4);
    context.fillStyle = bonus ? '#ffd166' : '#6fffd2';
    roundedRect(context, -cell * .23, -cell * .23, cell * .46, cell * .46, cell * .09);
    context.fill();
    context.restore();
    context.strokeStyle = bonus ? 'rgba(255,209,102,.42)' : 'rgba(111,255,210,.36)';
    context.lineWidth = Math.max(1, cell * .05);
    context.beginPath();
    context.arc(cx, cy, cell * .38, 0, Math.PI * 2);
    context.stroke();
  }

  const duration = Math.max(1, receivedAt - previousReceivedAt || POLL_MS);
  const alpha = reducedMotion ? 1 : Math.max(0, Math.min(1, (timestamp - receivedAt + POLL_MS) / duration));
  const previousById = new Map((previousFrame?.snapshot?.snake || []).map(segment => [segment.id, segment]));
  for (let index = snapshot.snake.length - 1; index >= 0; index--) {
    const segment = snapshot.snake[index];
    const previous = previousById.get(segment.id) || segment;
    const from = cellPosition(previous.cell, snapshot.width);
    const to = cellPosition(segment.cell, snapshot.width);
    const x = from.x + (to.x - from.x) * alpha;
    const y = from.y + (to.y - from.y) * alpha;
    const cx = originX + (x + .5) * cell;
    const cy = originY + (y + .5) * cell;
    const isHead = segment.role === 'head';
    const radius = cell * (isHead ? .42 : .35);
    const bodyGradient = context.createRadialGradient(cx - radius * .3, cy - radius * .3, radius * .1, cx, cy, radius);
    bodyGradient.addColorStop(0, isHead ? '#efffff' : '#baffec');
    bodyGradient.addColorStop(1, isHead ? '#4ee4ff' : '#24cfa1');
    context.fillStyle = bodyGradient;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = isHead ? '#ffffff' : 'rgba(255,255,255,.35)';
    context.lineWidth = Math.max(1, cell * (isHead ? .08 : .035));
    context.stroke();
    if (isHead) {
      context.fillStyle = '#04101a';
      context.beginPath();
      context.arc(cx - radius * .28, cy - radius * .12, Math.max(1.5, radius * .09), 0, Math.PI * 2);
      context.arc(cx + radius * .28, cy - radius * .12, Math.max(1.5, radius * .09), 0, Math.PI * 2);
      context.fill();
    }
  }

  if (previousFrame?.snapshot && snapshot.foodsCollected > previousFrame.snapshot.foodsCollected && snapshot.snake[0]) {
    const head = cellPosition(snapshot.snake[0].cell, snapshot.width);
    spawnParticles(head.x + .5, head.y + .5, snapshot.food?.kind === 'bonus' ? '#ffd166' : '#6fffd2', 18);
  }
  updateParticles(context, Math.min(3, Math.max(.25, (timestamp - (draw.lastTime || timestamp)) / 16.67)), cell, cell, originX, originY);
  draw.lastTime = timestamp;

  if (frame.scene === 'danger' && !reducedMotion) {
    context.strokeStyle = 'rgba(255, 93, 118, .55)';
    context.lineWidth = Math.max(3, cell * .12);
    roundedRect(context, originX + 3, originY + 3, boardWidth - 6, boardHeight - 6, Math.max(12, cell * .3));
    context.stroke();
  }

  requestAnimationFrame(draw);
}

draw.lastTime = 0;
window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('beforeunload', () => { polling = false; });
poll();
requestAnimationFrame(draw);
