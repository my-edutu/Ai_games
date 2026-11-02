'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const load = () => import('../../public/snake-stream/cinematic-director.mjs');
const body = Object.freeze([{cell:38},{cell:37},{cell:36},{cell:35}].map(p => Object.freeze(p)));
const live = Object.freeze({ lifecycle:'running', movementStep:0, width:28, height:16,
  runToken:'one', dangerLevel:0, snake:body, length:4, goal:96,
  food:Object.freeze({cell:250}), portals:Object.freeze([]), foodsCollected:1 });

test('RED→GREEN: truthful long-form director uses genuine public-step establishing, tracking and intimate shots without fabricating actions',async()=>{
  const { selectCinematicShot } = await load();
  const expected = [[0,'detail'],[23,'detail'],[24,'overview'],[31,'overview'],
    [55,'overview'],[56,'follow'],[79,'follow'],[80,'follow'],
    [103,'follow'],[104,'detail'],[127,'detail'],[128,'overview'],
    [159,'overview'],[160,'detail'],[192,'overview'],[240,'follow']];
  for(const [movementStep,shot] of expected){
    const frozen=Object.freeze({...live,movementStep});
    const before=JSON.stringify(frozen);
    assert.equal(selectCinematicShot(frozen),shot, 'real public step '+movementStep);
    assert.equal(JSON.stringify(frozen),before,'public snapshot remains immutable');
  }
});

test('force a legible full-board view for danger, run transitions, portal head fragments, result, and reduced motion',async()=>{
  const {selectCinematicShot}=await load();
  const base={...live,movementStep:88};
  const variants=[
    {...base,dangerLevel:2},
    {...base,lifecycle:'intermission'},
    {...base,lifecycle:'result'},
    {...base,snake:[]},
    {...base,snake:[{cell:38},{cell:8},{cell:7}]},
    {...base,movementStep:NaN},
    {...base,goal:4,length:4},
  ];
  for(const frame of variants)assert.equal(selectCinematicShot(frame),'overview');
  assert.equal(selectCinematicShot(base,{reducedMotion:true}),'overview');
  assert.equal(selectCinematicShot(null),'overview');
  assert.equal(selectCinematicShot(base), 'follow');
});

test('manual camera modes, original strict real-render 1s gate, and live renderer source remain unchanged',()=>{
  const app=fs.readFileSync(path.join(root,'public/snake-stream/app.js'),'utf8');
  const strict=fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
  assert.match(app, /cinematic-director\.mjs/);
  assert.match(app, /cameraMode === 'cinematic'/);
  assert.match(app, /renderer\.draw\(frame, previousFrame, alpha, timestamp, \{ reducedMotion, cameraMode: activeShot \}\)/);
  assert.match(strict,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
  const source=fs.readFileSync(path.join(root,'public/snake-stream/cinematic-director.mjs'),'utf8');
  assert.doesNotMatch(source,/Math\.random\(|setTimeout\(|requestAnimationFrame\(|fetch\(/);
});

test('P0 regression: the real cinematic ES module is included in both strict host route and self-test asset manifest',()=>{
  const app=fs.readFileSync(path.join(root,'public/snake-stream/app.js'),'utf8');
  const server=fs.readFileSync(path.join(root,'scripts/serve-snake-stream.cjs'),'utf8');
  const director=fs.readFileSync(path.join(root,'public/snake-stream/cinematic-director.mjs'),'utf8');
  assert.match(app,/^import \{ selectCinematicShot \} from '\.\/cinematic-director\.mjs';/m);
  assert.match(director,/export function selectCinematicShot\(/);
  const manifest=server.slice(server.indexOf('function assetPaths()'),server.indexOf('function isSnapshotPrivacySafe('));
  assert.match(manifest,/'cinematic-director\.mjs'/,'host self-test must reject an incomplete static ES-module graph');
  assert.match(server,/'\/cinematic-director\.mjs':\s*'cinematic-director\.mjs'/,
    'otherwise the entire native ES-module app fails to evaluate and never requests /snapshot');
  assert.match(server,/if \(!fileName\) \{/,'retain explicit route deny-by-default');
  assert.match(server,/'content-security-policy':/,'retain original strict same-origin CSP');
});
