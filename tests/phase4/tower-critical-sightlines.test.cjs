const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { resolve } = require('node:path');

const subject = pathToFileURL(resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/critical-sightlines.mjs')).href;
const policy = () => import(subject).then(m => m.sourceCriticalSightlinePriorities);

test('physically selected airborne landing remains visible when approach beacon is not', async () => {
  const prioritize = await policy();
  assert.deepEqual(prioritize({live:true, observedLanding:true}),
    {arrival:true, hazard:false, gate:false});
});
test('real hazard and source landing are both protected in the same live frame', async () => {
  const prioritize = await policy();
  assert.deepEqual(prioritize({live:true, observedLanding:true, observedHazard:true,
    earnedGateway:true, airborneGateway:true}),
    {arrival:true, hazard:true, gate:false});
});
test('a source hazard without a current landing still gets protection', async () => {
  const prioritize = await policy();
  assert.deepEqual(prioritize({live:true, observedHazard:true}),
    {arrival:false, hazard:true, gate:false});
});
test('earned walking gateway remains in view with no competing danger', async () => {
  const prioritize = await policy();
  assert.deepEqual(prioritize({live:true, earnedGateway:true}),
    {arrival:false, hazard:false, gate:true});
});
test('real airborne gateway has priority over the next landing unless danger intervenes', async () => {
  const prioritize = await policy();
  assert.deepEqual(prioritize({live:true, observedLanding:true,
    earnedGateway:true, airborneGateway:true}),
    {arrival:true, hazard:false, gate:true});
});
test('no live source, no cosmetic camera relief, including terminal state', async () => {
  const prioritize = await policy();
  assert.deepEqual(prioritize({live:false, observedLanding:true,
    observedHazard:true, earnedGateway:true, airborneGateway:true}),
    {arrival:false, hazard:false, gate:false});
});
test('truth flags are boolean, not truthy UI strings', async () => {
  const prioritize = await policy();
  assert.deepEqual(prioritize({live:'yes', observedLanding:1, observedHazard:'hazard'}),
    {arrival:false, hazard:false, gate:false});
});

test('earned airborne gateway and real landing remain independent in source and 3D render', async () => {
  const fs = require('node:fs'), path = require('node:path');
  const root = path.resolve(__dirname,'../..');
  const scene = fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const world = fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  const prioritize = await policy();
  assert.deepEqual(prioritize({live:true,observedLanding:true,earnedGateway:true,airborneGateway:true}),
    {arrival:true,hazard:false,gate:true});
  assert.match(scene,/airborneGateway:sourceAirborneWalk\?\.realAirborneCap === true/);
  assert.match(scene,/observedLandingSightline\.set\(landing\.x,landing\.y,landing\.z\)/);
  assert.match(scene,/protectLiveRoute&&sightlinePriorities\.arrival\?observedLandingSightline/);
  assert.match(scene,/sightlinePriorities\.gate&&sightlinePriorities\.arrival\s*\?earnedGatewayFocus:null/);
  assert.match(world,/hazard=null, gateway=null\)/);
  assert.match(world,/const targets=enabled\?\[actor,guardian,landing,hazard,gateway\]:\[\]/);
  assert.match(world,/for\(let index=0;index<4;index\+\+\)/);
  assert.match(world,/corridorGuardians\[corridorCount\]=index===0 \|\| index===2/);
});
