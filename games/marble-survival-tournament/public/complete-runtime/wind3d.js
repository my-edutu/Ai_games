'use strict';

const shell = document.querySelector('.broadcast-shell');
const arenaElement = document.getElementById('arena');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const SNAPSHOT_INTERVAL_MS = 180;

let overlay = null;
let currentArenaId = null;
let currentZonesSignature = '';
let animationFrame = null;
let pollTimer = null;
let arrows = [];

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

function ensureOverlay() {
  if (overlay?.isConnected) return overlay;
  overlay = document.createElement('div');
  overlay.id = 'authoritative-wind-telegraphs';
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: '2',
    mixBlendMode: 'screen',
  });
  arenaElement.appendChild(overlay);
  return overlay;
}

function zonesSignature(arena) {
  return JSON.stringify((arena.windZones || []).map((zone) => [
    zone.id,
    zone.x,
    zone.y,
    zone.width,
    zone.height,
    zone.forceX,
    zone.forceY,
  ]));
}

function zoneAngle(zone) {
  if (!zone.forceX && !zone.forceY) return -90;
  return Math.atan2(zone.forceY, zone.forceX) * (180 / Math.PI);
}

function zoneStrength(zone) {
  return clamp(Math.hypot(Number(zone.forceX) || 0, Number(zone.forceY) || 0) / 60, 0.25, 1);
}

function makeArrow(angle, strength, phase) {
  const arrow = document.createElement('span');
  arrow.dataset.windArrow = 'true';
  arrow.dataset.angle = String(angle);
  arrow.dataset.phase = String(phase);
  arrow.dataset.strength = String(strength);
  arrow.textContent = '➤';
  Object.assign(arrow.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    color: 'rgba(220, 251, 255, 0.92)',
    font: '800 clamp(11px, 1.1vw, 18px)/1 system-ui, sans-serif',
    textShadow: '0 0 8px rgba(104, 231, 255, 0.8)',
    transformOrigin: '50% 50%',
    willChange: 'transform, opacity',
  });
  arrows.push(arrow);
  return arrow;
}

function makeZone(arena, zone, zoneIndex) {
  const zoneElement = document.createElement('div');
  zoneElement.dataset.windZoneId = String(zone.id);
  const left = clamp((zone.x / Math.max(1, arena.width)) * 100, 0, 100);
  const top = clamp((zone.y / Math.max(1, arena.height)) * 100, 0, 100);
  const width = clamp((zone.width / Math.max(1, arena.width)) * 100, 0.5, 100 - left);
  const height = clamp((zone.height / Math.max(1, arena.height)) * 100, 0.5, 100 - top);
  const angle = zoneAngle(zone);
  const strength = zoneStrength(zone);

  Object.assign(zoneElement.style, {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
    minWidth: '38px',
    minHeight: '34px',
    border: `1px solid rgba(171, 243, 255, ${0.46 + strength * 0.22})`,
    borderRadius: '8px',
    background: `linear-gradient(${angle + 90}deg, rgba(83, 218, 244, ${0.035 + strength * 0.045}), rgba(170, 245, 255, ${0.12 + strength * 0.06}), rgba(83, 218, 244, ${0.035 + strength * 0.045}))`,
    boxShadow: `inset 0 0 18px rgba(89, 225, 255, ${0.08 + strength * 0.08}), 0 0 12px rgba(76, 211, 241, 0.12)`,
    overflow: 'hidden',
    transform: 'perspective(600px) rotateX(5deg)',
  });

  const rows = height > 14 ? 3 : 2;
  const columns = width > 25 ? 4 : width > 12 ? 3 : 2;
  let phase = zoneIndex * 7;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const holder = document.createElement('span');
      Object.assign(holder.style, {
        position: 'absolute',
        left: `${18 + (columns === 1 ? 0 : (64 * column) / (columns - 1))}%`,
        top: `${20 + (rows === 1 ? 0 : (60 * row) / (rows - 1))}%`,
        width: '1px',
        height: '1px',
      });
      holder.appendChild(makeArrow(angle, strength, phase++));
      zoneElement.appendChild(holder);
    }
  }

  const label = document.createElement('span');
  label.textContent = 'CROSSWIND';
  Object.assign(label.style, {
    position: 'absolute',
    left: '8px',
    bottom: '6px',
    color: 'rgba(219, 250, 255, 0.8)',
    font: '700 9px/1 system-ui, sans-serif',
    letterSpacing: '0.12em',
    textShadow: '0 0 6px rgba(64, 204, 235, 0.7)',
  });
  zoneElement.appendChild(label);
  return zoneElement;
}

function buildWindZones(arena) {
  const root = ensureOverlay();
  const zones = Array.isArray(arena.windZones) ? arena.windZones : [];
  arrows = [];
  root.replaceChildren(...zones.map((zone, index) => makeZone(arena, zone, index)));
  shell.dataset.windZones = String(zones.length);
  shell.dataset.windState = zones.length > 0 ? 'active' : 'clear';
  currentArenaId = arena.id;
  currentZonesSignature = zonesSignature(arena);
}

function animateWind(now) {
  if (!reducedMotion.matches) {
    for (const arrow of arrows) {
      const angle = Number(arrow.dataset.angle) || 0;
      const phase = Number(arrow.dataset.phase) || 0;
      const strength = Number(arrow.dataset.strength) || 0.5;
      const travel = (Math.sin(now * 0.0045 + phase * 0.73) * 0.5 + 0.5) * (5 + strength * 7);
      const opacity = 0.58 + (Math.sin(now * 0.005 + phase) * 0.5 + 0.5) * 0.36;
      arrow.style.opacity = String(opacity);
      arrow.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateX(${travel}px)`;
    }
  } else {
    for (const arrow of arrows) {
      const angle = Number(arrow.dataset.angle) || 0;
      arrow.style.opacity = '0.82';
      arrow.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
  }
  animationFrame = requestAnimationFrame(animateWind);
}

async function refreshWindSnapshot() {
  try {
    const response = await fetch('/api/snapshot', { cache: 'no-store' });
    if (!response.ok) throw new Error(`snapshot ${response.status}`);
    const next = await response.json();
    if (!next?.arena || !Array.isArray(next.arena.windZones)) throw new Error('invalid wind snapshot');
    const signature = zonesSignature(next.arena);
    if (currentArenaId !== next.arena.id || currentZonesSignature !== signature) buildWindZones(next.arena);
    shell.dataset.windSnapshotTick = String(Number.isInteger(next.tick) ? next.tick : 0);
  } catch (error) {
    shell.dataset.windState = 'snapshot-error';
    console.warn('[marble-wind] telegraph snapshot unavailable', error);
  }
}

function start() {
  ensureOverlay();
  shell.dataset.windZones = '0';
  shell.dataset.windState = 'loading';
  refreshWindSnapshot();
  pollTimer = window.setInterval(refreshWindSnapshot, SNAPSHOT_INTERVAL_MS);
  animationFrame = requestAnimationFrame(animateWind);
}

window.addEventListener('pagehide', () => {
  if (pollTimer !== null) window.clearInterval(pollTimer);
  if (animationFrame !== null) cancelAnimationFrame(animationFrame);
  overlay?.remove();
  arrows = [];
}, { once: true });

start();
