'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const root=path.join(__dirname,'../..');
const moduleFile=path.join(root,'public/infinite-tower-climb/visuals/guardian-optical-shot.mjs');
const lens=import(pathToFileURL(moduleFile).href);
const portrait=390/844;
const central={aspect:portrait,currentFov:42,
  actor:[-.24,.04,.2,.05],partner:[.27,.08,.2,.075]};

test('original full-body guardian and climber earn ONE optical close two-actor shot, not a physical camera teleport',async()=>{
  const {observedGuardianPortraitOpticalFov:f,GUARDIAN_OPTICAL_BASE_FOV:base}=await lens;
  const shot=f(central);
  assert.equal(base,42);
  assert.ok(shot>=31&&shot<=35, 'central living dual subjects become measurably larger on phone');
  const enlargement=Math.tan(base*Math.PI/360)/Math.tan(shot*Math.PI/360);
  assert.ok(enlargement>=1.3&&enlargement<=1.39);
  assert.ok((Math.abs(central.actor[1])+central.actor[3])*enlargement<.71);
  assert.ok((Math.abs(central.partner[1])+central.partner[3])*enlargement<.75);
  // Deciding again from the ALREADY adjusted camera must not keep zooming.
  const nextScale=Math.tan(base*Math.PI/360)/Math.tan(shot*Math.PI/360);
  const moved={
    ...central,currentFov:shot,
    actor:[central.actor[0]*nextScale,central.actor[1]*nextScale,.2,central.actor[3]*nextScale],
    partner:[central.partner[0]*nextScale,central.partner[1]*nextScale,.2,central.partner[3]*nextScale],
  };
  assert.ok(Math.abs(f(moved)-shot)<1e-8,'same actual geometry must not ratchet the optical lens');
});

test('critical body, scenery, landing and manual camera safety vetoes a tighter optic',async()=>{
  const {observedGuardianPortraitOpticalFov:f}=await lens;
  assert.equal(f({...central,aspect:960/600}),42);
  assert.equal(f({...central,blocked:true}),42);
  assert.equal(f({...central,actor:[.77,.05,.2,.05]}),42);
  assert.equal(f({...central,partner:[.80,.10,.2,.10]}),42);
  assert.equal(f({...central,actor:[.1,.1,.2,.20]}),42);
  assert.equal(f({...central,partner:[.1,.10,.2,.08],actor:[.08,.11,.2,.05]}),42);
  assert.equal(f({...central,landing:[1.01,.02,.3]}),42,
    'true landing outside safe frame must never be optically lost');
  assert.equal(f({...central,landing:[0,0,3]}),42);
  assert.equal(f({...central,actor:[0,0,2,.05]}),42);
  assert.equal(f({...central,currentFov:NaN}),42);
  const landing=f({...central,landing:[.65,.35,.2]});
  assert.ok(landing>f(central)&&landing<=42,
    'the same authoritatively selected landing must shrink optional zoom');
});

test('portrait optical change is bounded by presented wall time and releases to 42 on exit',async()=>{
  const {boundedGuardianOpticalFov:step}=await lens;
  assert.equal(step(42,31,.016),41.808);
  assert.ok(Math.abs(step(41.808,42,.016)-42)<1e-9);
  assert.equal(step(42,31,.5),41.28,'large render gaps cannot cause a visual cut');
  assert.equal(step(42,31,0),42);
  assert.equal(step(42,NaN,.016),42);
  let shot=42;
  for(let i=0;i<100;i++)shot=step(shot,31,1/60);
  assert.ok(Math.abs(shot-31)<1e-7);
  for(let i=0;i<100;i++)shot=step(shot,42,1/60);
  assert.ok(Math.abs(shot-42)<1e-7);
});

test('actual renderer keeps authoritative source gates and independent camera safety',()=>{
  const scene=fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/observedGuardianPortraitOpticalFov/);
  assert.match(scene,/boundedGuardianOpticalFov/);
  assert.match(scene,/snapshot\.floor\s*===\s*8/);
  assert.match(scene,/gatewayEarned/);
  assert.match(scene,/towerCoreSightlineClear/);
  assert.match(scene,/camera\.updateProjectionMatrix\(\)/);
  assert.match(scene,/guardianPortraitOptical/);
  assert.doesNotMatch(fs.readFileSync(moduleFile,'utf8'),/Math\.random|setTimeout|tick\s*\+\s*\d|sourceGuardian\.health\s*=/);
});
