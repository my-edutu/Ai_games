'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = name => fs.readFileSync(path.join(root, 'public/snake-stream', name), 'utf8');

test('T3 public length-to-goal meter is bounded, truthful and independent of authoritative simulation', async () => {
  const {goalProgress} = await import('../../public/snake-stream/view-copy.mjs');
  assert.equal(goalProgress(null), 0);
  assert.equal(goalProgress({length: 3, goal: 4}), 75);
  assert.equal(goalProgress({length: 1, goal: 7}), 14);
  assert.equal(goalProgress({length: 30, goal: 20}), 100);
  assert.equal(goalProgress({length: -5, goal: 20}), 0);
  assert.equal(goalProgress({length: 4, goal: 0}), 0);
  assert.equal(goalProgress({length: Infinity, goal: 20}), 0);
  assert.equal(goalProgress({length: 10, goal: NaN}), 0);
});
test('T3 game is viewport-first with legible 1080p, tall phone and short landscape layouts, without WebGL effects', () => {
  const css = file('ux-v2.css');
  const html = file('index.html');
  assert.match(css, /#broadcast\s*\{[\s\S]*?grid-template-rows:\s*minmax\(0,\s*1fr\)/);
  assert.match(css, /#broadcast\s*>\s*\.hud\s*\{[\s\S]*?position:\s*absolute/);
  assert.match(css, /#broadcast\s*>\s*\.captions\s*\{[\s\S]*?position:\s*absolute/);
  assert.match(css, /@media\s*\(max-width:\s*680px\)\s*and\s*\(min-height:\s*520px\)/);
  assert.match(css, /@media\s*\(max-height:\s*519px\)/);
  assert.doesNotMatch(css, /backdrop-filter|filter:\s*blur|transform:\s*scale\(/);
  assert.match(html, /id="run-progress"[^>]*role="progressbar"/);
  assert.match(html, /data-control="settings"[^>]*aria-expanded="false"[^>]*aria-controls="display-options"/);
});
test('T3 accessible controls and clean feed stay discoverable, poll-diffed, and recoverable on touch without gameplay mutation', () => {
  const app = file('app.js'), html = file('index.html'), css = file('ux-v2.css');
  assert.match(app, /control === 'settings'/);
  assert.match(app, /case 'settings':\s*broadcast\.classList\.toggle\('show-controls'\)/);
  assert.match(app, /document\.querySelector\('\.stage'\)\.addEventListener\('click'/);
  assert.match(app, /if \(!cleanFeed\) return/);
  assert.match(app, /meter\.getAttribute\('aria-valuenow'\) !== percent/);
  assert.match(app, /meter\.getAttribute\('aria-valuetext'\) !== valueText/);
  assert.match(app, /if \(element\.textContent !== value\) element\.textContent = value/);
  assert.match(app, /renderer\.draw\(frame, previousFrame, alpha, timestamp/);
  assert.match(html, /<nav id="display-options" class="controls"/);
  assert.match(css, /#broadcast\.clean-feed\s+:is\(/);
  assert.match(css, /#broadcast\.clean-feed\s*\.stage::after\s*\{\s*display:\s*none/);
});
