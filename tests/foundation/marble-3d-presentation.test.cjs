'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../games/marble-survival/public/complete-runtime');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const rendererPath = path.join(root, 'renderer3d.js');
const renderer = fs.readFileSync(rendererPath, 'utf8');
const styles = fs.readFileSync(path.join(root, 'visual-3d.css'), 'utf8');
const identityPath = path.join(root, 'identity-overlay.js');
const identity = fs.existsSync(identityPath) ? fs.readFileSync(identityPath, 'utf8') : '';

function includesAll(source, fragments) {
  for (const fragment of fragments) assert.ok(source.includes(fragment), `missing required fragment: ${fragment}`);
}

test('WebGL renderer is valid JavaScript before browser verification', () => {
  execFileSync(process.execPath, ['--check', rendererPath], { stdio: 'pipe' });
});

test('runtime owns a real WebGL arena canvas with a 2D fallback', () => {
  includesAll(index, [
    'id="arena-webgl"',
    'id="arena-canvas"',
    'visual-3d.css',
    'renderer3d.js',
  ]);
  includesAll(renderer, [
    "getContext('webgl2'",
    'createProgram',
    'createSphereMesh',
    'createBoxMesh',
    'requestAnimationFrame',
  ]);
});

test('3d renderer consumes authority snapshot geometry instead of inventing outcomes', () => {
  includesAll(renderer, [
    "fetch('/api/snapshot'",
    'snapshot.arena',
    'snapshot.marbles',
    'snapshot.camera.directive',
    'marble.velocityX',
    'marble.velocityY',
    'arena.sweepers',
    'arena.hazards',
    'arena.bumpers',
    'arena.obstacles',
  ]);
  for (const forbidden of ['Math.random(', 'winnerOverride', 'forceWinner', 'teleportMarble']) {
    assert.equal(renderer.includes(forbidden), false, `presentation must not invent authoritative gameplay: ${forbidden}`);
  }
});

test('3d marbles have volumetric lighting, rolling orientation and contact shadows', () => {
  includesAll(renderer, [
    'uNormalMatrix',
    'uLightDirection',
    'uRoughness',
    'rollingById',
    'drawContactShadow',
    'normalMatrix3',
  ]);
});

test('arena presentation includes constructed depth, moving machinery and broadcast cameras', () => {
  includesAll(renderer, [
    'drawArenaDeck',
    'drawGuardRails',
    'drawFinishGate',
    'drawSweeperMachine',
    'drawHazardPit',
    'cameraFromDirective',
    "directive.mode === 'danger'",
    "directive.mode === 'finish'",
    "directive.mode === 'victory'",
  ]);
  includesAll(styles, [
    '#arena-webgl',
    '.webgl-ready #arena-canvas',
    '[data-clean="true"]',
  ]);
});

test('overview framing stays arena-centred while event cameras may track authority focus', () => {
  for (const source of [renderer, identity]) {
    includesAll(source, [
      "const trackFocus = directive.mode === 'overview' ? [] : focus;",
      'if (trackFocus.length)',
    ]);
  }
});

test('WebGL competitor identity is projected from authoritative marble positions', () => {
  includesAll(index, [
    'id="arena-identity-overlay"',
    'identity-overlay.js',
  ]);
  includesAll(identity, [
    "fetch('/api/snapshot'",
    'cameraFromDirective',
    'projectToScreen',
    'marble.number',
    'snapshot.leaderboard',
    'snapshot.camera.directive',
    'status !== \'eliminated\'',
  ]);
  for (const forbidden of ['Math.random(', 'forceWinner', 'winnerOverride', 'teleportMarble']) {
    assert.equal(identity.includes(forbidden), false, `identity layer must remain presentation-only: ${forbidden}`);
  }
  execFileSync(process.execPath, ['--check', identityPath], { stdio: 'pipe' });
});