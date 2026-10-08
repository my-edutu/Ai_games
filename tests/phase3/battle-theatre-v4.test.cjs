'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');

test('theatre mode expands 3D world, provides reversible panel layout and keeps clean feed accessible',()=>{
  const html=read('public/ai-battle-royale/index.html');
  const css=read('public/ai-battle-royale/ux-v4.css');
  const app=read('public/ai-battle-royale/app.js');
  const server=read('scripts/serve-battle-royale-stream.cjs');
  assert.match(html,/class="theatre-mode"/);
  assert.match(html,/\/battle\/ux-v4\.css/);
  assert.match(server,/\/battle\/ux-v4\.css/);
  assert.match(app,/params\.get\('layout'\)!=='panels'/);
  assert.match(css,/theatre-mode \.arena-shell/);
  assert.match(css,/theatre-mode \.hud/);
  assert.match(css,/theatre-mode\.clean-feed/);
  assert.match(css,/max-width:950px/);
  assert.doesNotMatch(html,/innerHTML/);
});

test('cinematic action cards only show semantic combat events and automatically expire',()=>{
  const html=read('public/ai-battle-royale/index.html');
  const app=read('public/ai-battle-royale/app.js');
  const css=read('public/ai-battle-royale/ux-v4.css');
  assert.match(html,/id="battle-highlight"/);
  assert.match(html,/aria-live="polite"/);
  assert.match(app,/function updateBattleHighlight\(/);
  assert.match(app,/entry\.type==='elimination'\|\|entry\.type==='shield-broken'/);
  assert.match(app,/Number\.isSafeInteger\(entry\.sequence\)/);
  assert.match(app,/highlightTimer=setTimeout\(/);
  assert.match(app,/battleHighlight\.hidden=true/);
  assert.match(app,/highlightTitle\.textContent=/);
  assert.match(css,/\.battle-highlight\[hidden\]/);
  assert.match(css,/clean-feed \.battle-highlight/);
  assert.doesNotMatch(app,/highlightTitle\.innerHTML/);
});
