'use strict';

(() => {
  const PARTICLE_COUNT = 40;
  const DPR_CAP = 1.5;
  const MAX_OVERLAY_OPACITY = 0.34;
  const PROFILE = 'cinematic-balanced';
  const query = new URLSearchParams(location.search);
  const reducedMotion = query.get('reducedMotion') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const highContrast = query.get('highContrast') === '1';

  let publicState = null;
  let overlay = null;
  let context = null;
  let scheduled = false;
  let renderAverageMs = 0;
  let renderSamples = 0;

  function hash32(value) {
    let x = value >>> 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d) >>> 0;
    x ^= x >>> 15;
    x = Math.imul(x, 0x846ca68b) >>> 0;
    x ^= x >>> 16;
    return x >>> 0;
  }

  function unit(index, salt) {
    return hash32(Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(salt + 11, 0x85ebca6b)) / 4294967295;
  }

  const particles = Object.freeze(Array.from({ length: PARTICLE_COUNT }, (_, index) => Object.freeze({
    x: unit(index, 1),
    y: unit(index, 2),
    radius: 0.7 + unit(index, 3) * 1.7,
    rise: 0.0012 + unit(index, 4) * 0.0028,
    sway: 5 + unit(index, 5) * 16,
    alpha: 0.07 + unit(index, 6) * 0.13,
    warm: unit(index, 7) > 0.64,
  })));

  function freezePublicSnapshot(value) {
    if (!value || typeof value !== 'object') return value;
    return Object.freeze(value);
  }

  Object.defineProperty(window, '__MAZE_PUBLIC_STATE__', {
    configurable: true,
    enumerable: false,
    get() { return publicState; },
    set(value) {
      publicState = freezePublicSnapshot(value);
      scheduleDraw();
    },
  });

  function publishStats(extra = {}) {
    window.__MAZE_POLISH_STATS__ = Object.freeze({
      profile: PROFILE,
      authorityTouched: false,
      randomSource: 'deterministic-hash',
      particleCount: PARTICLE_COUNT,
      maxOverlayOpacity: MAX_OVERLAY_OPACITY,
      devicePixelRatioCap: DPR_CAP,
      reducedMotion,
      highContrast,
      renderAverageMs: Number(renderAverageMs.toFixed(3)),
      renderSamples,
      ...extra,
    });
  }

  function ensureOverlay() {
    if (overlay && context) return true;
    const stage = document.getElementById('stage');
    if (!stage) return false;
    overlay = document.createElement('canvas');
    overlay.id = 'maze-atmosphere';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('role', 'presentation');
    stage.appendChild(overlay);
    context = overlay.getContext('2d', { alpha: true, desynchronized: true });
    return Boolean(context);
  }

  function resizeOverlay() {
    if (!ensureOverlay()) return null;
    const rect = overlay.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, DPR_CAP);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (overlay.width !== width || overlay.height !== height) {
      overlay.width = width;
      overlay.height = height;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: rect.width, height: rect.height, dpr };
  }

  function drawArchitectureSilhouette(width, height) {
    const ctx = context;
    ctx.save();
    ctx.globalAlpha = highContrast ? 0.08 : 0.16;
    ctx.fillStyle = '#020605';
    ctx.fillRect(0, 0, Math.max(18, width * 0.028), height);
    ctx.fillRect(width - Math.max(18, width * 0.028), 0, Math.max(18, width * 0.028), height);
    ctx.fillRect(0, 0, width, Math.max(13, height * 0.025));

    ctx.strokeStyle = 'rgba(74,94,84,.22)';
    ctx.lineWidth = Math.max(2, width * 0.0015);
    for (let i = 0; i < 3; i += 1) {
      const anchor = width * (0.18 + i * 0.27);
      ctx.beginPath();
      ctx.moveTo(anchor, 0);
      ctx.bezierCurveTo(anchor - 18, height * 0.12, anchor + 28, height * 0.19, anchor + 4, height * 0.34);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAtmosphere(width, height, tick, danger) {
    const ctx = context;
    ctx.clearRect(0, 0, width, height);

    const topFog = ctx.createLinearGradient(0, 0, 0, height * 0.58);
    topFog.addColorStop(0, highContrast ? 'rgba(0,0,0,.08)' : 'rgba(18,29,25,.24)');
    topFog.addColorStop(1, 'rgba(5,12,10,0)');
    ctx.fillStyle = topFog;
    ctx.fillRect(0, 0, width, height * 0.62);

    const floorHaze = ctx.createRadialGradient(width * 0.52, height * 0.78, 0, width * 0.52, height * 0.78, width * 0.62);
    floorHaze.addColorStop(0, danger ? 'rgba(91,38,33,.16)' : 'rgba(49,72,57,.13)');
    floorHaze.addColorStop(0.62, 'rgba(9,17,14,.06)');
    floorHaze.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = floorHaze;
    ctx.fillRect(0, height * 0.28, width, height * 0.72);

    drawArchitectureSilhouette(width, height);

    const phase = reducedMotion ? 0 : tick;
    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const normalizedY = (particle.y - phase * particle.rise + 4) % 1;
      const x = particle.x * width + Math.sin((phase + index * 17) * 0.024) * particle.sway;
      const y = normalizedY * height;
      const alpha = highContrast ? particle.alpha * 0.28 : particle.alpha;
      ctx.beginPath();
      ctx.fillStyle = particle.warm ? `rgba(207,166,103,${alpha})` : `rgba(132,176,159,${alpha})`;
      ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.47, Math.min(width, height) * 0.24, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, highContrast ? 'rgba(0,0,0,.10)' : 'rgba(0,0,0,.30)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  function draw() {
    scheduled = false;
    const start = performance.now();
    const size = resizeOverlay();
    if (!size || !publicState) {
      publishStats({ overlayReady: Boolean(size), publicStateReady: Boolean(publicState) });
      return;
    }
    const tick = Number(publicState.tick) || 0;
    const danger = Array.isArray(publicState.threats) && publicState.threats.length > 0;
    drawAtmosphere(size.width, size.height, tick, danger);
    const elapsed = performance.now() - start;
    renderSamples += 1;
    renderAverageMs = renderSamples === 1 ? elapsed : renderAverageMs * 0.88 + elapsed * 0.12;
    publishStats({
      overlayReady: true,
      publicStateReady: true,
      canvasWidth: overlay.width,
      canvasHeight: overlay.height,
      currentTick: tick,
      frameCostMs: Number(elapsed.toFixed(3)),
    });
  }

  function scheduleDraw() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(draw);
  }

  function initialize() {
    ensureOverlay();
    publishStats({ overlayReady: Boolean(overlay), publicStateReady: false });
    scheduleDraw();
    addEventListener('resize', scheduleDraw, { passive: true });
    if (typeof ResizeObserver === 'function') {
      const stage = document.getElementById('stage');
      if (stage) new ResizeObserver(scheduleDraw).observe(stage);
    }
  }

  initialize();
})();
