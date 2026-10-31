'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname,
  '../../games/marble-survival/public/complete-runtime/app.js'), 'utf8');
// Execute the real fallback entry point with drawing operations instrumented.
// This is a CPU-work regression, not a mock GPU performance measurement.
const start = source.indexOf('function renderArena(now) {');
const end = source.indexOf('\nfunction statusLabel(', start);
assert.ok(start >= 0 && end > start, 'actual fallback entry point must exist');
const renderSource = source.slice(start, end);
function harness() {
  const state = { ready: false, hidden: false, resize: 0, backdrop: 0 };
  const context = {
    shell: { classList: { contains: name => name === 'webgl-ready' && state.ready } },
    document: { get hidden() { return state.hidden; } },
    snapshot: null, quality: 'balanced', QUALITY_PRESETS: { balanced: {} },
    resizeCanvas() { state.resize++; }, drawBackdrop() { state.backdrop++; },
  };
  vm.createContext(context);
  vm.runInContext(renderSource, context);
  return { state, render: () => vm.runInContext('renderArena(100)', context) };
}
test('visible 2D fallback still paints before WebGL is ready', () => {
  const h = harness(); h.render();
  assert.equal(h.state.resize, 1); assert.equal(h.state.backdrop, 1);
});
test('completed WebGL takeover performs no hidden fallback resize or painting', () => {
  const h = harness(); h.state.ready = true;
  for (let i = 0; i < 120; i++) h.render();
  assert.equal(h.state.resize, 0); assert.equal(h.state.backdrop, 0);
});
test('context loss resumes fallback painting on the next frame', () => {
  const h = harness(); h.state.ready = true; h.render();
  h.state.ready = false; h.render();
  assert.equal(h.state.backdrop, 1);
});
test('background tabs do not spend CPU drawing fallback frames', () => {
  const h = harness(); h.state.hidden = true; h.render();
  assert.equal(h.state.resize, 0); assert.equal(h.state.backdrop, 0);
  h.state.hidden = false; h.render(); assert.equal(h.state.backdrop, 1);
});
