'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const gameRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(gameRoot, 'public/complete-runtime');
const files = {
  html: path.join(publicRoot, 'index.html'),
  webgl: path.join(publicRoot, 'arena3d.js'),
  webglCss: path.join(publicRoot, 'arena3d.css'),
  fallback: path.join(publicRoot, 'app.js'),
  server: path.join(gameRoot, 'scripts/serve-complete-runtime.cjs'),
};

for (const [name, file] of Object.entries(files)) assert.equal(fs.existsSync(file), true, `${name} missing: ${file}`);

const threeModule = path.resolve(gameRoot, '../../node_modules/three/build/three.module.js');
assert.equal(fs.existsSync(threeModule), true, `Three.js ESM build missing: ${threeModule}`);

const html = fs.readFileSync(files.html, 'utf8');
const webgl = fs.readFileSync(files.webgl, 'utf8');
const css = fs.readFileSync(files.webglCss, 'utf8');
const fallback = fs.readFileSync(files.fallback, 'utf8');
const server = fs.readFileSync(files.server, 'utf8');

assert.match(html, /id="arena-webgl"/);
assert.match(html, /id="arena-canvas"/);
assert.match(html, /arena3d\.css/);
assert.match(html, /type="module" src="\/arena3d\.js"/);
assert.match(webgl, /import \* as THREE from '\/vendor\/three\.module\.min\.js'/);
assert.match(webgl, /new THREE\.WebGLRenderer/);
assert.match(webgl, /new THREE\.MeshPhysicalMaterial/);
assert.match(webgl, /castShadow = true/);
assert.match(webgl, /setFromAxisAngle\(tempAxis, distance \/ MARBLE_RADIUS\)/);
assert.match(webgl, /physics-contact/);
assert.match(webgl, /marble-eliminated/);
assert.match(webgl, /tournament-champion/);
assert.match(css, /\.three-ready #arena-webgl/);
assert.match(css, /data-clean='true'/);
assert.match(fallback, /getContext\('2d'/);
assert.match(server, /dist\/games\/marble-survival-tournament\/src\/index\.js/);
assert.match(server, /node_modules\/three\/build\/three\.module\.js/);
assert.match(server, /\/vendor\/three\.module\.min\.js/);

const syntax = spawnSync(process.execPath, ['--check', files.webgl], { encoding: 'utf8' });
assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout || 'arena3d.js syntax check failed');

const evidence = {
  renderer: 'three-webgl',
  fallback: 'authoritative-canvas-2d',
  authorityPath: 'dist/games/marble-survival-tournament/src/index.js',
  threeSource: 'node_modules/three/build/three.module.js',
  threePublicAlias: '/vendor/three.module.min.js',
  webglCanvas: true,
  physicalMarbleMaterial: true,
  displacementDrivenRolling: true,
  shadows: true,
  semanticEventVfx: true,
  reducedMotion: webgl.includes('prefers-reduced-motion'),
  cleanFeed: css.includes("data-clean='true'"),
};

process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
