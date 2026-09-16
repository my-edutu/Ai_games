'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const eko = require('../dist/games/eko-street-run/src/index.js');

const OUTPUT = path.join(process.cwd(), 'evidence', 'eko-run', 'phase7', 'phase7-evidence.json');
const P99_BUDGET_MS = 1.0;
const WORST_BUDGET_MS = 4.0;
const SAMPLE_COUNT = 2400;

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * fraction) - 1))];
}

function timingSummary(values) {
  return {
    samples: values.length,
    p50Ms: percentile(values, 0.50),
    p95Ms: percentile(values, 0.95),
    p99Ms: percentile(values, 0.99),
    worstMs: Math.max(...values),
  };
}

function optionsFor(index) {
  const portrait = index % 2 === 0;
  const mode = index % 8;
  return {
    viewport: portrait
      ? { width: 390, height: 844, devicePixelRatio: 2, safeArea: { top: 28, right: 16, bottom: 28, left: 16 } }
      : { width: 1366, height: 768, devicePixelRatio: 1, safeArea: { top: 24, right: 32, bottom: 24, left: 32 } },
    quality: mode < 2 ? 'low' : mode < 5 ? 'medium' : 'high',
    accessibility: {
      muted: mode === 1 || mode === 5,
      reducedMotion: mode === 2 || mode === 6,
      reducedFlash: mode === 3 || mode === 7,
    },
    presentationHz: [30, 60, 120][index % 3],
  };
}

function createEventStorm(state) {
  const events = [{ schemaVersion: state.schemaVersion, sequence: 1, tick: state.tick, type: 'integrity.failure', data: { code: 'EVIDENCE_INTEGRITY' } }];
  for (let index = 0; index < 80; index += 1) {
    events.push({ schemaVersion: state.schemaVersion, sequence: index + 2, tick: state.tick, type: 'player.landed', data: {} });
  }
  return events;
}

const state = eko.createPhase6State(eko.createDefaultConfig({ seed: 'phase7-evidence' }));
state.tick = 20;
const authoritativeChecksumBefore = eko.checksumState(state);
const authoritativeJsonBefore = JSON.stringify(state);
const storm = createEventStorm(state);
const snapshot = eko.createRenderSnapshot(state, storm);

for (let index = 0; index < 200; index += 1) {
  eko.createBroadcastPresentation(snapshot, optionsFor(index));
}

const timings = [];
let maxFeedback = 0;
let maxVoices = 0;
let maxCaptions = 0;
let deterministicPass = true;
let boundedPass = true;
let accessibilityPass = true;
let privacyPass = true;

for (let index = 0; index < SAMPLE_COUNT; index += 1) {
  const options = optionsFor(index);
  const started = performance.now();
  const model = eko.createBroadcastPresentation(snapshot, options);
  timings.push(performance.now() - started);

  maxFeedback = Math.max(maxFeedback, model.feedback.length);
  maxVoices = Math.max(maxVoices, model.audio.voices.length);
  maxCaptions = Math.max(maxCaptions, model.captions.length);
  boundedPass = boundedPass
    && model.feedback.length <= eko.PHASE7_MAX_FEEDBACK_CUES
    && model.audio.voices.length <= eko.PHASE7_MAX_AUDIO_VOICES
    && model.vfx.maxConcurrentCameraImpulses === 1;

  if (options.accessibility.muted) {
    accessibilityPass = accessibilityPass && model.audio.voices.length === 0
      && model.feedback.filter(cue => cue.priority !== 'ambient' && cue.captionKey).every(cue => model.captions.some(caption => caption.captionKey === cue.captionKey));
  }
  if (options.accessibility.reducedMotion) accessibilityPass = accessibilityPass && model.vfx.maxCameraImpulse <= 0.04 && model.vfx.motionScale <= 0.25;
  if (options.accessibility.reducedFlash) accessibilityPass = accessibilityPass && model.vfx.maxFlashIntensity <= 0.02;

  const serialized = JSON.stringify(model);
  for (const forbidden of ['rootSeed', 'randomStreams', 'commandWatermarks', 'sourceSequence']) privacyPass = privacyPass && !serialized.includes(forbidden);

  if (index < 60) {
    const repeat = eko.createBroadcastPresentation(snapshot, options);
    deterministicPass = deterministicPass && JSON.stringify(repeat) === serialized;
  }
}

const sampleOptions = { ...optionsFor(11), presentationHz: 30 };
const samples = [30, 60, 120].map(presentationHz => eko.createBroadcastPresentation(snapshot, { ...sampleOptions, presentationHz }));
const semanticProjection = value => JSON.stringify({ hud: value.hud, feedback: value.feedback, captions: value.captions, audio: value.audio, vfx: value.vfx });
const presentationRatePass = samples.every(value => semanticProjection(value) === semanticProjection(samples[0]));

const html = eko.renderBroadcastOverlayHtml(samples[0]);
const htmlDeterminismPass = html === eko.renderBroadcastOverlayHtml(samples[0]);
const htmlPrivacyPass = ['rootSeed', 'randomStreams', 'commandWatermarks', 'sourceSequence'].every(value => !html.includes(value));
const authorityNeutralityPass = eko.checksumState(state) === authoritativeChecksumBefore && JSON.stringify(state) === authoritativeJsonBefore;

const timing = timingSummary(timings);
const performancePass = timing.p99Ms <= P99_BUDGET_MS && timing.worstMs <= WORST_BUDGET_MS;
const pass = deterministicPass && boundedPass && accessibilityPass && privacyPass && presentationRatePass
  && htmlDeterminismPass && htmlPrivacyPass && authorityNeutralityPass && performancePass;

const evidence = {
  phase: 7,
  runtime: process.version,
  sampleCount: SAMPLE_COUNT,
  authoritativeChecksumBefore,
  authoritativeChecksumAfter: eko.checksumState(state),
  timing,
  budgets: {
    p99Ms: P99_BUDGET_MS,
    worstMs: WORST_BUDGET_MS,
    p99Pass: timing.p99Ms <= P99_BUDGET_MS,
    worstPass: timing.worstMs <= WORST_BUDGET_MS,
  },
  eventStorm: { inputEvents: storm.length, maxFeedback, maxVoices, maxCaptions, boundedPass },
  accessibility: { pass: accessibilityPass },
  reconstruction: { deterministicPass, presentationRatePass, htmlDeterminismPass, authorityNeutralityPass },
  privacy: { modelPass: privacyPass, htmlPass: htmlPrivacyPass },
  pass,
};

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(evidence, null, 2));
if (!pass) throw new Error(`Phase 7 evidence failed: ${JSON.stringify(evidence)}`);
