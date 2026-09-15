'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../games/marble-survival/public/complete-runtime');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'renderer3d.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'visual-3d.css'), 'utf8');

function includesAll(source, fragments) {
  for (const fragment of fragments) assert.ok(source.includes(fragment), `missing required fragment: ${fragment}`);
}

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
