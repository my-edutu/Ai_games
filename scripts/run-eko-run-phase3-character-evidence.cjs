const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const eko = require('../dist/games/eko-street-run/src/index.js');
const character = require('../dist/games/eko-street-run/src/presentation/character/index.js');

const evidenceDir = path.join(process.cwd(), 'evidence/eko-run/phase3/runtime');
fs.mkdirSync(evidenceDir, { recursive: true });

function percentile(sorted, quantile) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1);
  return sorted[index];
}

function luminance(hex) {
  const raw = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => parseInt(raw.slice(offset, offset + 2), 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function makeSnapshot(seed, tick, movementState, velocity, facing = 1, lifecycle = 'running') {
  const config = eko.createDefaultConfig({ seed });
  const state = eko.createInitialState(config);
  state.tick = tick;
  state.lifecycle = lifecycle;
  state.player.movementState = movementState;
  state.player.velocity = { ...velocity };
  state.player.facing = facing;
  if (lifecycle === 'failed') state.player.movementState = 'dead';
  return { state, snapshot: eko.createRenderSnapshot(state, []) };
}

const baseline = makeSnapshot('phase3-evidence', 137, 'grounded', { x: 5.5, y: 0 });
const authorityBefore = eko.checksumState(baseline.state);
const cadence = [30, 60, 120].map((presentationHz) => character.createCharacterPresentation(baseline.snapshot, {
  outfitId: 'lagos-streetwear',
  presentationHz,
}));
const cadencePass = JSON.stringify(cadence[0]) === JSON.stringify(cadence[1]) && JSON.stringify(cadence[1]) === JSON.stringify(cadence[2]);

const serialized = JSON.parse(JSON.stringify(baseline.snapshot));
const restartBefore = character.createCharacterPresentation(baseline.snapshot, { outfitId: 'yoruba-agbada-fila', reducedMotion: true });
const restartAfter = character.createCharacterPresentation(serialized, { outfitId: 'yoruba-agbada-fila', reducedMotion: true });
const restartPass = JSON.stringify(restartBefore) === JSON.stringify(restartAfter);

const animations = ['idle', 'run', 'takeoff', 'ascent', 'descent', 'landing', 'slide', 'vault', 'hit', 'recovery', 'failure', 'celebration'];
const previewFiles = [];
for (const outfitId of character.OUTFIT_IDS) {
  for (const animation of animations) {
    const svg = character.renderCharacterSvg({ outfitId, animation, phase: 0.42, reducedMotion: false, facing: 1 });
    const filename = `${outfitId}-${animation}.svg`;
    fs.writeFileSync(path.join(evidenceDir, filename), svg);
    previewFiles.push(filename);
  }
}

const contrastResults = character.listOutfits().map((outfit) => ({
  id: outfit.id,
  primaryOutlineRatio: Number(contrast(outfit.palette.primary, outfit.palette.backgroundSafeOutline).toFixed(4)),
  pass: contrast(outfit.palette.primary, outfit.palette.backgroundSafeOutline) >= 3,
}));

const timingSamples = [];
for (let index = 0; index < 5000; index += 1) {
  const tick = 500 + index;
  const candidate = { ...baseline.snapshot, tick };
  const start = performance.now();
  const result = character.createCharacterPresentation(candidate, {
    outfitId: character.OUTFIT_IDS[index % character.OUTFIT_IDS.length],
    reducedMotion: index % 2 === 0,
    presentationHz: [30, 60, 120][index % 3],
  });
  if (!Number.isFinite(result.frame.phase)) throw new Error('non-finite presentation phase');
  timingSamples.push(performance.now() - start);
}
timingSamples.sort((a, b) => a - b);
const p50Ms = percentile(timingSamples, 0.50);
const p95Ms = percentile(timingSamples, 0.95);
const p99Ms = percentile(timingSamples, 0.99);
const worstMs = timingSamples[timingSamples.length - 1];
const p99BudgetMs = 4;
const worstBudgetMs = 16.67;

const authorityAfter = eko.checksumState(baseline.state);
const authorityIsolationPass = authorityBefore === authorityAfter;
const contrastPass = contrastResults.every((item) => item.pass);
const timingPass = p99Ms < p99BudgetMs && worstMs < worstBudgetMs;

const summary = {
  phase: 3,
  scope: 'presentation-domain character/outfit/animation',
  seed: 'phase3-evidence',
  authorityChecksumBefore: authorityBefore,
  authorityChecksumAfter: authorityAfter,
  authorityIsolationPass,
  cadence: { ratesHz: [30, 60, 120], pass: cadencePass },
  rendererRestart: { jsonRoundTripPass: restartPass },
  outfits: contrastResults,
  previewCount: previewFiles.length,
  animations,
  timing: {
    samples: timingSamples.length,
    p50Ms: Number(p50Ms.toFixed(6)),
    p95Ms: Number(p95Ms.toFixed(6)),
    p99Ms: Number(p99Ms.toFixed(6)),
    worstMs: Number(worstMs.toFixed(6)),
    budgets: { p99Ms: p99BudgetMs, worstMs: worstBudgetMs },
    pass: timingPass,
  },
};

if (!authorityIsolationPass || !cadencePass || !restartPass || !contrastPass || !timingPass) {
  console.error(JSON.stringify(summary));
  process.exit(1);
}

console.log(JSON.stringify(summary));
