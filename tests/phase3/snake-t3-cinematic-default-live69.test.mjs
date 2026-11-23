import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selectInitialSpectatorCamera, selectCinematicShot, resolveSpectatorShot } from '../../public/snake-stream/cinematic-director.mjs';

const app = fs.readFileSync(new URL('../../public/snake-stream/app.js', import.meta.url), 'utf8');
const renderer = fs.readFileSync(new URL('../../public/snake-stream/renderer.mjs', import.meta.url), 'utf8');

test('ordinary running broadcast enters a real hero sequence, explicit overview and reduced motion remain noncinematic', () => {
  assert.equal(selectInitialSpectatorCamera(new URLSearchParams()), 'cinematic');
  for (const value of ['overview','follow','detail','cinematic']) assert.equal(selectInitialSpectatorCamera(new URLSearchParams('camera='+value)),value);
  for (const invalid of ['auto','private','not-a-camera']) assert.equal(selectInitialSpectatorCamera(new URLSearchParams('camera='+invalid)), 'overview');
  assert.equal(selectInitialSpectatorCamera(new URLSearchParams(),true),'overview');
  assert.equal(selectInitialSpectatorCamera(new URLSearchParams('camera=cinematic'),true),'overview');
  for (const value of ['overview','follow','detail']) assert.equal(selectInitialSpectatorCamera(new URLSearchParams('camera='+value),true),value,
    'reduced motion must keep an explicit stable camera choice without automatic cinematic cuts');
  assert.match(app, /cameraMode = selectInitialSpectatorCamera\(params, reducedMotion\)/);
});

test('director retains actual wide coverage and genuine head-led hero shots without private/future event invention', () => {
  const modes = {overview:0,follow:0,detail:0};
  for (let i=0;i<160;i++){
    const snapshot = Object.freeze({movementStep:i,lifecycle:'running',width:28,height:16,goal:96,length:9,dangerLevel:0,
      snake:Object.freeze([{cell:42},{cell:41}].map(v=>Object.freeze(v)))});
    const before=JSON.stringify(snapshot);
    modes[selectCinematicShot(snapshot)]++;
    assert.equal(JSON.stringify(snapshot),before);
    assert.equal(selectCinematicShot(snapshot,{reducedMotion:true}),'overview');
    assert.equal(selectCinematicShot({...snapshot,dangerLevel:2}),'overview');
  }
  assert.deepEqual(modes,{overview:64,follow:48,detail:48});
  assert.match(renderer,/function renderPresentation\(/);
  assert.match(app,/renderer\.draw\(frame, previousFrame, alpha, timestamp, \{ reducedMotion, cameraMode: activeShot \}\)/);
});


test('truthful cinematic shot resolves consistently for the actual 3D renderer and the 2D overview, including reconnects and portal discontinuities', () => {
  const s=Object.freeze({movementStep:60,lifecycle:'running',width:28,height:16,goal:96,length:18,dangerLevel:0,
    snake:Object.freeze([{cell:42},{cell:41}].map(Object.freeze))});
  assert.equal(resolveSpectatorShot('cinematic',s,false),'follow');
  assert.equal(resolveSpectatorShot('cinematic',s,true),'overview');
  assert.equal(resolveSpectatorShot('cinematic',null,false),'overview');
  assert.equal(resolveSpectatorShot('cinematic',{...s,snake:[{cell:42},{cell:200}]},false),'overview');
  for(const literal of ['overview','follow','detail']) assert.equal(resolveSpectatorShot(literal,s,false),literal);
  assert.equal(resolveSpectatorShot('untrusted',s,false),'overview');
  assert.match(app,/overview\.update\(.*resolveSpectatorShot/);
  assert.match(app,/cameraMode: activeShot/);
});
