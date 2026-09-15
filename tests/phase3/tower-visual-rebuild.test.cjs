'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),publicRoot=path.join(root,'public','infinite-tower-climb');
const read=name=>fs.readFileSync(path.join(publicRoot,name),'utf8');

test('tower broadcast shell gives the game world the full frame instead of a dashboard column',()=>{
  const html=read('index.html'),css=read('styles.css');
  assert.match(html,/data-testid="game-hud"/);
  assert.doesNotMatch(html,/data-testid="side-panel"/);
  assert.match(css,/\.world-stage\s*\{[^}]*position:absolute[^}]*inset:0/s);
});

test('tower world uses a native WebGL2 renderer with explicit depth layers',()=>{
  const app=read('app.js');
  assert.match(app,/getContext\(['"]webgl2['"]/);
  for(const file of ['tower-renderer.js','art-direction.js'])assert.equal(fs.existsSync(path.join(publicRoot,file)),true,`${file} missing`);
  const renderer=read('tower-renderer.js');
  for(const layer of ['BACKGROUND','MIDGROUND','GAMEPLAY','FOREGROUND'])assert.match(renderer,new RegExp(layer));
  assert.match(renderer,/renderClimber/);
  assert.match(renderer,/renderGuardian/);
  assert.match(renderer,/fog/i);
  assert.match(renderer,/shadow/i);
});

test('tower presentation exposes real animation vfx audio and distinct environment kits',()=>{
  for(const file of ['animation-system.js','vfx-system.js','audio-engine.js'])assert.equal(fs.existsSync(path.join(publicRoot,file)),true,`${file} missing`);
  const animation=read('animation-system.js'),vfx=read('vfx-system.js'),audio=read('audio-engine.js'),art=read('art-direction.js');
  for(const state of ['idle','run','sprint','jump-anticipation','jump','fall','land','hard-land','climb','ledge-grab','pull-up','dash','dodge','attack','hit','shield','death','victory','exhausted','recovery'])assert.match(animation,new RegExp(`['\"]${state}['\"]`),state);
  assert.match(vfx,/MAX_PARTICLES\s*=\s*96/);
  for(const effect of ['dust','sparks','smoke','steam','debris','shield','electricity','fire','checkpoint','guardian'])assert.match(vfx,new RegExp(effect,'i'),effect);
  assert.match(audio,/AudioContext|webkitAudioContext/);
  for(const theme of ['foundry','ruins','storm','clockwork','void'])assert.match(art,new RegExp(theme),theme);
});

test('tower camera source defines spectator framing modes beyond simple follow',()=>{
  const source=fs.readFileSync(path.join(root,'games','infinite-tower-climb','src','presentation','camera.ts'),'utf8');
  for(const mode of ['ascent','danger','guardian','fall','recovery','milestone','result'])assert.match(source,new RegExp(`['\"]${mode}['\"]`),mode);
  assert.match(source,/focusX/);
  assert.match(source,/focusY/);
});
