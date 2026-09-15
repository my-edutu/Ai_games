'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../games/marble-survival/public/complete-runtime');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const spectatorStyles = fs.existsSync(path.join(root, 'spectator-polish.css'))
  ? fs.readFileSync(path.join(root, 'spectator-polish.css'), 'utf8')
  : '';
const audioPath = path.join(root, 'audio-director.js');
const audioDirector = fs.existsSync(audioPath) ? fs.readFileSync(audioPath, 'utf8') : '';

function includesAll(source, fragments) {
  for (const fragment of fragments) assert.ok(source.includes(fragment), `missing required fragment: ${fragment}`);
}

test('broadcast shell prioritizes arena, qualification state, and visual quality controls', () => {
  includesAll(index, [
    'id="arena-canvas"',
    'id="remaining-value"',
    'id="qualified-value"',
    'id="qualification-value"',
    'id="quality-select"',
    '<option value="low">Low</option>',
    '<option value="balanced"',
    '<option value="high"',
    '<option value="ultra"',
    'id="influence-status"',
  ]);
  assert.equal(index.includes('id="checksum"'), false, 'spectator HUD should not spend prime space on an obsolete campaign checksum');
});

test('arena-first spectator composition uses overlays instead of a permanent dashboard sidebar', () => {
  includesAll(index, [
    'data-layout="arena-first"',
    'spectator-polish.css',
    'class="leaderboard-panel broadcast-overlay"',
    'class="lower-grid broadcast-lower-overlay"',
  ]);
  includesAll(spectatorStyles, [
    '.stage-grid',
    'position: relative',
    '.leaderboard-panel.broadcast-overlay',
    'position: absolute',
    '.broadcast-lower-overlay',
    'backdrop-filter',
    '@media (max-width: 760px)',
  ]);
});

test('semantic audio is bounded, event-driven, and presentation-only', () => {
  includesAll(index, ['audio-director.js']);
  includesAll(audioDirector, [
    'MAX_VOICES',
    'createDynamicsCompressor',
    "event.type === 'physics-contact'",
    "event.type === 'marble-qualified'",
    "event.type === 'marble-eliminated'",
    "event.type === 'shield-recovery'",
    "event.type === 'tournament-champion'",
    'stopImmediatePropagation',
    "fetch('/api/snapshot'",
  ]);
  for (const forbidden of ['forceWinner', 'winnerOverride', 'teleportMarble', '/api/operator']) {
    assert.equal(audioDirector.includes(forbidden), false, `audio must not affect authority: ${forbidden}`);
  }
  execFileSync(process.execPath, ['--check', audioPath], { stdio: 'pipe' });
});

test('renderer consumes authoritative presentation schema and never uses legacy fake-campaign fields', () => {
  includesAll(app, [
    'QUALITY_PRESETS',
    'next.round.number',
    'next.round.quota',
    'next.camera.directive',
    'marble.status',
    'marble.number',
    'marble.pattern',
    'quality-select',
    'fillText(String(marble.number)',
  ]);

  for (const legacy of [
    'snapshot.round.id',
    'next.round.name',
    'snapshot.arena.features',
    'marble.qualified',
    'entry.score',
    'campaignChecksum',
  ]) {
    assert.equal(app.includes(legacy), false, `renderer must not depend on legacy fake-campaign field: ${legacy}`);
  }
});

test('premium visual direction is ivory/charcoal miniature motorsport rather than neon arcade', () => {
  includesAll(styles, [
    '--ivory-track',
    '--charcoal',
    '--metal',
    '--danger',
    '[data-quality="low"]',
    '[data-clean="true"]',
  ]);
  for (const legacyNeon of ['#70f1d2', '#8d7dff', '#101a3b']) {
    assert.equal(styles.includes(legacyNeon), false, `legacy neon palette must be removed: ${legacyNeon}`);
  }
});

test('browser camera obeys server directive and applies presentation-only smooth viewport framing', () => {
  includesAll(app, [
    'next.camera.directive',
    'cameraViewport',
    'cameraState',
    'safeDirective.zoomPermille',
    "safeDirective.mode === 'cut-line'",
    "safeDirective.mode === 'victory'",
    'prefers-reduced-motion',
  ]);
  assert.equal(app.includes('function cameraMode(next)'), false, 'browser must not independently re-adjudicate camera priorities');
  assert.equal(app.includes('chooseMarbleCameraDirective'), false, 'browser must consume, not recalculate, the server camera directive');
});
