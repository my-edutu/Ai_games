'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const visuals = path.resolve(__dirname,'../../public/infinite-tower-climb/visuals');
const load = () => import(pathToFileURL(path.join(visuals,'rendered-guardian-center.mjs')).href);

test('camera honors same-run drawn 3D guardian instead of divergent fixed-step point', async () => {
  const {observedDrawnGuardianCameraAnchor: select} = await load();
  const guardian={id:'f8:guardian',kind:'guardian',active:true,health:3,maxHealth:8};
  const snapshot={runToken:'run-13',floor:8,tick:321,lifecycle:'running',player:{health:4}};
  const drawn={x:8.2,y:32.4,z:24.7};
  const observed={id:guardian.id,runToken:snapshot.runToken,floor:8,sourceTick:320};
  assert.equal(select(guardian,drawn,observed,snapshot),drawn,
    'camera reads original drawn 3D rig without creating a new position');
  assert.equal(select(guardian,drawn,{...observed,sourceTick:321},snapshot),drawn);
  assert.deepEqual(snapshot,{runToken:'run-13',floor:8,tick:321,lifecycle:'running',player:{health:4}},
    'composing a shot does not mutate source authority');
});

test('no stale previous boss/future pose can hijack landing, result or restart', async () => {
  const {observedDrawnGuardianCameraAnchor: select} = await load();
  const guardian={id:'f8:guardian',kind:'guardian',active:true,health:3,maxHealth:8};
  const snapshot={runToken:'run-13',floor:8,tick:321,lifecycle:'running',player:{health:4}};
  const drawn={x:8.2,y:32.4,z:24.7};
  const witnessed={id:guardian.id,runToken:snapshot.runToken,floor:8,sourceTick:320};
  const no=(g=guardian,p=drawn,w=witnessed,s=snapshot)=>assert.equal(select(g,p,w,s),null);
  no(guardian,drawn,{...witnessed,id:'other-guardian'});
  no(guardian,drawn,{...witnessed,runToken:'old-expedition'});
  no(guardian,drawn,{...witnessed,floor:7});
  no(guardian,drawn,{...witnessed,sourceTick:319});
  no(guardian,drawn,{...witnessed,sourceTick:322});
  no({...guardian,active:false});
  no({...guardian,health:0});
  no({...guardian,kind:'shooter'});
  no(guardian,{x:NaN,y:2,z:27});
  no(guardian,drawn,witnessed,{...snapshot,lifecycle:'result'});
  no(guardian,drawn,witnessed,{...snapshot,player:{health:0}});
  no(guardian,drawn,witnessed,{...snapshot,runToken:'restart'});
  no(guardian,drawn,witnessed,{...snapshot,floor:9});
});

test('real scene camera uses rendered rig only after source-first boss eligibility', () => {
  const src=fs.readFileSync(path.join(visuals,'scene.mjs'),'utf8');
  const select=src.indexOf('observedDrawnGuardianCameraAnchor(sourceGuardian');
  const eligibility=src.indexOf('const activeContact = (player.state');
  const rig=src.indexOf('const observedRig = drawnGuardian && drawnGuardianId === enemy.id;');
  const sourceGate=src.indexOf('if (!activeContact || dx >');
  assert.ok(eligibility>=0 && sourceGate>eligibility && rig>sourceGate,
    'drawn position cannot authorize an unwitnessed guardian or change source proximity');
  assert.ok(select>=0 && src.includes('guardianPlannerAnchor: contactGuardian'),
    'physical rig anchor must actually reach source-authenticated camera and diagnostics');
  assert.ok(src.includes('guardianDrawnObservation.runToken = snapshot.runToken;') &&
    src.includes('guardianDrawnObservation.floor = snapshot.floor;'));
});

test('original source browser diagnosis consumes a retained same-run 3D camera witness, not update-local scope', () => {
  const src=fs.readFileSync(path.join(visuals,'scene.mjs'),'utf8');
  const updateStart=src.indexOf('  function update(dt) {');
  const diagnosticsStart=src.indexOf('  function diagnostics() {',updateStart);
  const disposeStart=src.indexOf('  function dispose() {',diagnosticsStart);
  assert.ok(updateStart>=0 && diagnosticsStart>updateStart && disposeStart>diagnosticsStart);
  const update=src.slice(updateStart, diagnosticsStart);
  const diagnostics=src.slice(diagnosticsStart,disposeStart);
  assert.match(src.slice(0,updateStart),
    /const guardianPlannerWitness = \\{[\\s\\S]*?runToken:null, floor:null, tick:-1, guardianId:null, anchor:null/);
  assert.match(update,/guardianPlannerWitness\\.runToken = snapshot\\.runToken/);
  assert.match(update,/guardianPlannerWitness\\.floor = snapshot\\.floor/);
  assert.match(update,/guardianPlannerWitness\\.tick = snapshot\\.tick/);
  assert.match(update,/guardianPlannerWitness\\.guardianId = sourceGuardian\\?\\.id/);
  assert.match(update,/guardianPlannerWitness\\.anchor = !options\\.stale/);
  assert.doesNotMatch(diagnostics,/followComposition/,
    'the real browser polls diagnostics outside update; never capture a block-local camera');
  for (const guard of [
    'guardianPlannerWitness.runToken === snapshot.runToken',
    'guardianPlannerWitness.floor === snapshot.floor',
    'guardianPlannerWitness.tick === snapshot.tick',
    'guardianPlannerWitness.guardianId === liveGuardian.id',
    "snapshot?.lifecycle === 'running'",
    '!options.stale',
  ]) assert.ok(diagnostics.includes(guard),'diagnostics must veto stale or cross-episode camera evidence: '+guard);
});
