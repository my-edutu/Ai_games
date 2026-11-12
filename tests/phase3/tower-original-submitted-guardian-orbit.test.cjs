'use strict';
// Regression for source-bound NORMAL-SPEED portrait guardian camera continuity.
// The real original 390x844 candidate film from workflow 42950958038 shows
// abrupt exterior shoulder changes; this is an engineering guardrail, NEVER
// a substitute for full-motion event-aligned or blinded visual acceptance.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '../..');
const helper = import(pathToFileURL(path.join(ROOT,
  'public/infinite-tower-climb/visuals/guardian-camera-safety.mjs')).href);
const view = (a, radius = 55) => ({
  x:Math.sin(a)*radius,y:30,z:Math.cos(a)*radius,
});
const arc = (a,b) => Math.abs(Math.atan2(
  Math.sin(Math.atan2(b.x,b.z)-Math.atan2(a.x,a.z)),
  Math.cos(Math.atan2(b.x,b.z)-Math.atan2(a.x,a.z))));

test('real large original-source guardian shoulder swing is limited per submitted portrait frame',async()=>{
  const { boundedObservedGuardianOrbit: bound } = await helper;
  const previous=view(-.86,58);
  const target=view(.90,68);
  const original={...target};
  const out=bound(previous,target,1/60,390/844);
  assert.ok(out,'large safe exterior turn needs a considered continuity plan');
  assert.ok(arc(previous,out)<=1.05/60+1e-8);
  assert.ok(arc(previous,target)>1.7,
    'reproduces an almost 100 degree original observation rather than a tiny orbit');
  assert.ok(Math.abs(Math.hypot(out.x,out.z)-68)<1e-8,
    'guardian standoff radius remains physical, it is not shortened into the boss');
  assert.equal(out.y,30,'landing height stays unchanged');
  assert.deepEqual(target,original,'camera planner must not mutate source data');
});

test('annular yaw at -pi/pi follows the short exterior way around and never the solid tower',async()=>{
  const { boundedObservedGuardianOrbit: bound } = await helper;
  const previous=view(Math.PI-.055,52),target=view(-Math.PI+.055,52);
  const out=bound(previous,target,1/60,390/844);
  assert.ok(out && arc(previous,out)<.018);
  assert.ok(out.z<-51 && Math.abs(out.x)<5,'short exterior seam arc');
  const gaze=bound(view(-.8,25),view(.8,25),1/60,390/844,1.05,23.5);
  assert.ok(gaze && Math.hypot(gaze.x,gaze.z)>24,
    'the same source-anchored angular cap can protect the real annular gaze');
});

test('safe normal view, desktop, stale geometry and invalid time never manufacture a new camera',async()=>{
  const { boundedObservedGuardianOrbit: bound } = await helper;
  const previous=view(.2,52), close=view(.205,52);
  assert.equal(bound(previous,close,1/60,390/844),null);
  assert.equal(bound(previous,view(1.6,52),1/60,960/600),null);
  assert.equal(bound(previous,view(1.6,52),0,390/844),null);
  assert.equal(bound(previous,view(1.6,52),NaN,390/844),null);
  assert.equal(bound(previous,view(1.6,22),1/60,390/844),null);
  assert.equal(bound(previous,view(1.6,52),1/60,390/844,1.05,23),null);
  assert.equal(bound({...previous,x:Infinity},view(1.6,52),1/60,390/844),null);
});

test('production path vets both live bodies/real landing and remembers camera ONLY after successful WebGL submission',()=>{
  const src=fs.readFileSync(path.join(ROOT,
    'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const sessionGuard=src.indexOf('const previousGuardianSubmitted = protectLivingGuardian');
  const applied=src.indexOf('const boundedSubmittedView = previousGuardianSubmitted');
  const updated=src.indexOf('update(motionDt);');
  const render=src.indexOf('renderer.render(scene, camera);',updated);
  assert.ok(updated>applied && render>updated,
    'actual scene preparation must precede a real render return');
  const remember=src.indexOf('lastSubmittedGuardianCamera.copy(camera.position);',render);
  assert.ok(sessionGuard>0 && applied>sessionGuard && render>applied && remember>render,
    'unsubmitted ideal camera destinations must not advance continuity history');
  const safe=src.slice(sessionGuard,render);
  for(const guard of [
    'lastSubmittedGuardian.runToken === snapshot.runToken',
    'lastSubmittedGuardian.floor === snapshot.floor',
    'Math.abs(h[0])+h[3]*.14 < .78',
    'Math.abs(g[0])+g[3]*.14 < .84',
    'towerCoreSightlineClear(camera.position,actorFramePoint,23.5)',
    'towerCoreSightlineClear(camera.position,currentGuardianDrawPoint,23.5)',
    'if (safe && airborneDuelLanding)',
    'towerCoreSightlineClear(camera.position,portraitAimLanding,23.5)',
    'camera.position.copy(guardianOrbitPreviousCamera)',
  ]) assert.ok(safe.includes(guard),'safety veto missing: '+guard);
  assert.ok(src.includes('world.revealGuardianSightlines(camera,guardianSightPoints);'));
  assert.ok(src.includes('guardianSubmittedOrbitContinuity: {'));
  assert.doesNotMatch(safe,/snapshot\.player\.(?:x|y)\s*=/,
    'continuity may not modify authoritative player pose');
});
