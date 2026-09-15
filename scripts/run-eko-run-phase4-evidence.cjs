const { performance } = require('node:perf_hooks');
const eko = require('../dist/games/eko-street-run/src/index.js');

const viewports = {
  desktop: { width: 1366, height: 768, dpr: 1, safeArea: { top: 0, right: 0, bottom: 0, left: 0 } },
  mobile: { width: 390, height: 844, dpr: 3, safeArea: { top: 47, right: 0, bottom: 34, left: 0 } },
};

function baseSnapshot(seed = 'phase4-evidence') {
  const config = eko.createDefaultConfig({ seed });
  const state = eko.createInitialState(config);
  return { state, snapshot: eko.createRenderSnapshot(state, []) };
}

function publicFrame(base, tick, x, speed, movementState = 'grounded') {
  return {
    ...base,
    tick,
    player: {
      ...base.player,
      position: { x, y: movementState === 'rising' ? 0.7 : movementState === 'falling' ? 1.1 : 0 },
      velocity: { x: speed, y: movementState === 'rising' ? 6 : movementState === 'falling' ? -5 : 0 },
      movementState,
    },
  };
}

const { state, snapshot } = baseSnapshot();
const checksumBefore = eko.checksumState(state);
const durations = [];
const modes = [
  { id: 'desktop-high', viewport: viewports.desktop, quality: 'high', muted: false, reducedMotion: false },
  { id: 'desktop-medium', viewport: viewports.desktop, quality: 'medium', muted: false, reducedMotion: false },
  { id: 'mobile-low-accessible', viewport: viewports.mobile, quality: 'low', muted: true, reducedMotion: true },
];
const stateCycle = ['grounded', 'rising', 'falling', 'grounded', 'sliding', 'grounded'];
let allComprehension = true;
let allCriticalRoles = true;
let maxDecorativeLoad = 0;
let modelCount = 0;
let sceneChildCount = 0;

for (let tick = 0; tick < 1800; tick += 2) {
  const x = Math.min(19, (tick / 1800) * 19);
  const movementState = stateCycle[Math.floor(tick / 60) % stateCycle.length];
  const frame = publicFrame(snapshot, tick, x, 4 + ((tick / 30) % 3), movementState);
  for (const mode of modes) {
    const start = performance.now();
    const model = eko.createMainlandMorningPresentation(frame, [], mode);
    durations.push(performance.now() - start);
    modelCount += 1;
    allComprehension = allComprehension && model.comprehension.pass;
    for (const role of ['player-anchor', 'safe-route', 'progress-marker', 'decision-preview']) {
      allCriticalRoles = allCriticalRoles && model.nodes.some((node) => node.role === role);
    }
    maxDecorativeLoad = Math.max(maxDecorativeLoad, model.decorativeLoad);
    if (tick === 600 && mode.id === 'desktop-high') {
      const three = eko.createThreeMainlandMorningScene(model);
      sceneChildCount = three.scene.children.length;
      if (!three.scene.isScene || !three.camera.isPerspectiveCamera || three.scene.userData.presentationOnly !== true) process.exitCode = 1;
    }
  }
}

const checksumAfter = eko.checksumState(state);
const sorted = [...durations].sort((a, b) => a - b);
const percentile = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
const timing = {
  samples: durations.length,
  p50Ms: percentile(0.50),
  p95Ms: percentile(0.95),
  p99Ms: percentile(0.99),
  worstMs: sorted[sorted.length - 1],
};
const result = {
  phase: 4,
  district: 'mainland-morning',
  seed: 'phase4-evidence',
  representativeSeconds: 30,
  modelCount,
  modes: modes.map((mode) => mode.id),
  authorityChecksumBefore: checksumBefore,
  authorityChecksumAfter: checksumAfter,
  authorityIsolationPass: checksumBefore === checksumAfter,
  comprehensionPass: allComprehension,
  criticalHierarchyPass: allCriticalRoles,
  maxDecorativeLoad,
  threeSceneChildCount: sceneChildCount,
  identitySignals: eko.getMainlandMorningDistrict().identitySignals.length,
  timing,
  budgets: { p99Ms: 4, worstMs: 16.67, p99Pass: timing.p99Ms < 4, worstPass: timing.worstMs < 16.67 },
};

if (!result.authorityIsolationPass || !result.comprehensionPass || !result.criticalHierarchyPass || !result.budgets.p99Pass || !result.budgets.worstPass || sceneChildCount < 5) process.exitCode = 1;
console.log(JSON.stringify(result));
