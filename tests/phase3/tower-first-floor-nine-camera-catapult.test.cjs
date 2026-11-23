'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const visuals=path.resolve(__dirname,'../../public/infinite-tower-climb/visuals');
const fn=import(pathToFileURL(path.join(visuals,'first-floor-nine-camera-departure.mjs')).href)
 .then(m=>m.sourceFirstFloorNineCameraDeparture);
const source={floor:9,theme:'void',lifecycle:'running',runToken:'original',tick:510,player:{health:4}};
const lastRendered={floor:9,runToken:'original',tick:509};
const b={source,lastRendered,firstReturnedF9Tick:475,
 previousCamera:[20.585,4.535,46.905],previousFocus:[9.618,-.26,22.664],
 previousHero:[9,0,23],desiredCamera:[37.08,10.341,69.362],
 desiredFocus:[9,-.23,23],hero:[9,0,23],dt:.016,cameraMode:'follow',stale:false,reducedMotion:false};
test('actual first Floor9 portrait camera catapult receives bounded same-run dolly',async()=>{
 const x=(await fn)(b);
 assert.ok(x); assert.ok(x.requestedMovement>20);
 assert.ok(x.boundedMovement<=1);
 assert.ok(Math.hypot(...x.camera.map((v,i)=>v-b.previousCamera[i]))<=1.0001);
});
test('moving real hero earns proportional camera recovery without a cut',async()=>{
 const x=(await fn)({...b,hero:[10,0,23],dt:.05});
 assert.ok(x && x.boundedMovement<3.5);
});
test('normal motion, real floor progress, stale/restart/manual never constrained',async()=>{
 const guard=await fn;
 for(const changed of [
  {desiredCamera:[20.7,4.6,47]}, {desiredCamera:[8,4,26]},
  {hero:[65,0,23]}, {source:{...source,floor:10}},
  {source:{...source,tick:700}}, {source:{...source,player:{health:0}}},
  {lastRendered:{...lastRendered,runToken:'restart'}},
  {lastRendered:{...lastRendered,tick:511}},
  {cameraMode:'orbit'},{stale:true},{reducedMotion:true},
  {firstReturnedF9Tick:null},{dt:Infinity}
 ]) assert.equal(guard({...b,...changed}),null);
});
test('exact 7ef8f9b first-episode portrait shoulder cut is angular, NOT outward',async()=>{
 const guard=await fn;
 const crossing={...b,source:{...source,tick:527},
   lastRendered:{floor:9,runToken:'original',tick:517},firstReturnedF9Tick:478,
   previousCamera:[2.5,16.9,56.5],previousFocus:[7.9,2.3,23.2],
   previousHero:[11.4,7,22.3],desiredCamera:[38,17.7,33.9],
   desiredFocus:[10.5,9.7,23.7],hero:[12.8,10.5,23.7],dt:.05};
 const x=guard(crossing);
 assert.ok(x, 'real inward shoulder cut must be bounded even without outward dolly');
 assert.equal(x.reason,'first-original-floor-nine-camera-shoulder-cut');
 assert.ok(x.requestedMovement>40);
 assert.ok(Math.abs(x.requestedTurnRadians)>.7);
 assert.ok(Math.abs(x.boundedTurnRadians)<=.04001);
 assert.ok(x.boundedMovement<3);
 assert.ok(x.focus[1]>crossing.previousFocus[1]+5,
   'actual airborne hero displacement permits gaze to recover vertically');
 for(const overrides of [
   {cameraMode:'orbit'},{stale:true},{reducedMotion:true},
   {hero:[65,20,23]},{source:{...crossing.source,floor:10}},
   {source:{...crossing.source,tick:720}},
   {lastRendered:{floor:9,runToken:'restart',tick:517}},
   {firstReturnedF9Tick:1}
 ]) assert.equal(guard({...crossing,...overrides}),null);
 assert.equal(guard({...crossing,desiredCamera:[8,4,26]}),null,
   'ordinary inward recovery is not an angular catapult');
});
// The actual 597ed2fe source-pinned portrait WebM at 25-32 seconds
// has TWO distinct unearned physical camera jumps that earlier guards miss:
// (1) a large near-constant-radius side shift at tick 534->536, while the
// authoritative climber is stationary; (2) another shoulder swing at 589->591
// after the arbitrary 110-tick doorway lease, while still genuinely on F9.
test('real first-F9 pure lateral orbit is bounded even with stable radius and camera height',async()=>{
 const guard=await fn;
 const episode={...b,source:{...source,tick:536},
  lastRendered:{floor:9,runToken:'original',tick:534},
  previousCamera:[34.722,17.091,29.299],
  desiredCamera:[25.776,17.696,35.747],
  previousFocus:[12,10,23],desiredFocus:[12,10,23],
  previousHero:[12,10,23],hero:[12,10,23],dt:.05};
 const x=guard(episode);
 assert.ok(x,'11m camera orbit around nearly static live hero must not slip through angular/radius heuristics');
 assert.equal(x.reason,'first-original-floor-nine-camera-lateral-orbit');
 assert.ok(x.requestedMovement>10);
 assert.ok(x.boundedMovement<3);
});
test('first genuine F9 route remains camera-coherent past the old 110-tick doorway lease',async()=>{
 const guard=await fn;
 const episode={...b,source:{...source,tick:591},
  lastRendered:{floor:9,runToken:'original',tick:589},
  previousCamera:[-4.113,22.790,47.593],
  desiredCamera:[-17.442,24.377,43.037],
  previousHero:[5,17,23],hero:[6,18.5,23],
  previousFocus:[5,17,23],desiredFocus:[6,18.5,23],dt:.05};
 const x=guard(episode);
 assert.ok(x,'first Floor9 physical route must not catapult camera just after 110 ticks');
 assert.ok(x.requestedMovement>14 && x.boundedMovement<3);
 assert.equal(x.reason,'first-original-floor-nine-camera-shoulder-cut');
 assert.equal(guard({...episode,source:{...episode.source,tick:686}}),null,
  'bounded first-route coverage must NOT become unbounded or leak into later scenes');
 assert.equal(guard({...episode,source:{...episode.source,floor:10}}),null);
 assert.equal(guard({...episode,reducedMotion:true}),null);
 assert.equal(guard({...episode,lastRendered:{...episode.lastRendered,runToken:'restart'}}),null);
});
test('camera source commits MUST start native capture, not just quality CI',()=>{
 const workflow=fs.readFileSync(path.resolve(visuals,
   '../../../.github/workflows/tower-transformation-visual-evidence.yml'),'utf8');
 assert.match(workflow,/^\s+- public\/infinite-tower-climb\/visuals\/first-floor-nine-camera-departure\.mjs$/m);
});
test('post-director source guard acts only before genuine WebGL return',()=>{
 const scene=fs.readFileSync(path.join(visuals,'scene.mjs'),'utf8');
 const i=scene.indexOf('const firstF9DepartureBound=sourceFirstFloorNineCameraDeparture(');
 assert.ok(i>scene.indexOf('const earnedOrbit=sourceEarnedFloorNineOrbitGuard('));
 assert.ok(i<scene.indexOf('renderer.render(scene, camera);',i));
 assert.match(scene,/lastReturnedFloorNineHero\.copy\(climber\.group\.position\)/);
 assert.match(scene,/firstFloorNineCameraEntry\.tick=snapshot\.tick/);
 assert.match(scene,/towerCoreSightlineClear\(camera\.position,releaseHero,23\.5\)/);
});

// Exact first native source-return 45073078693: the view moves 17.2m
// while the actual climber advances ~1.5m. Angle is just 0.273rad, BELOW
// the legacy 0.28 shoulder threshold; a full 3-axis break needs bounded
// rotation, height AND radius instead of relying on an outward-only clamp.
test('authentic tick510 shallow shoulder + vertical pullback is a full world-space cut',async()=>{
 const guard=await fn;
 const episode={...b,source:{...source,tick:510},
  previousCamera:[-14.4,9,46.6],previousFocus:[9,0,23],
  previousHero:[9,0,23],desiredCamera:[-1.5,16,55.5],
  desiredFocus:[9.5,0,23.5],hero:[10.5,0,23],dt:.016};
 const x=guard(episode);
 assert.ok(x,'real shallow-angle cut must be measured even if angle < .28');
 assert.equal(x.reason,'first-original-floor-nine-camera-world-space-cut');
 assert.ok(x.requestedMovement>17 && x.boundedMovement<1,
  'render-time camera travel must remain proportional to 1x motion');
 assert.ok(Math.abs(x.camera[1]-episode.previousCamera[1])<=.241,
  'vertical camera jump must be rate-bounded with the shoulder/radius');
 assert.ok(Math.abs(x.boundedTurnRadians)<.015,
  'shallow turn must still be limited, not mistaken for normal tracking');
 assert.equal(guard({...episode,cameraMode:'orbit'}),null);
 assert.equal(guard({...episode,hero:[40,14,23]}),null);
});

test('true returned Floor9 camera records physically vetoed and submitted cuts with hero-focus rescue',()=>{
 const scene=fs.readFileSync(path.join(visuals,'scene.mjs'),'utf8');
 const clamp=scene.indexOf('const firstF9DepartureBound=sourceFirstFloorNineCameraDeparture(');
 const rescue=scene.indexOf('for(const actorWeight of [.35,.65,1])',clamp);
 const render=scene.indexOf('renderer.render(scene, camera);',clamp);
 const actual=scene.indexOf('const cameraTravel=camera.position.distanceTo(lastSubmittedGuardianCamera);',render);
 const previous=scene.indexOf('lastSubmittedGuardianCamera.copy(camera.position);',render);
 assert.ok(clamp>0 && rescue>clamp && rescue<render,
  'physical first-F9 hero gaze must be checked BEFORE the final returned frame');
 assert.ok(actual>render && actual<previous,
  'source-matched raw camera jumps must be counted AFTER WebGL return BEFORE overwriting last camera');
 assert.match(scene,/firstF9CameraWorldSpaceClamps/);
 assert.match(scene,/firstF9CameraHeroGazeRescues/);
 assert.match(scene,/firstF9CameraUnboundedCuts/);
 assert.match(scene,/towerCoreSightlineClear\(camera\.position,releaseHero,23\.5\)/);
});

test('real 0e2b7c2 Floor9 portrait 514-to-528 airborne source does not earn a 14m per-frame orbit',async()=>{
 const f=await fn;
 const episode={...b,source:{...source,tick:528},
  lastRendered:{floor:9,runToken:'original',tick:514},
  previousCamera:[26.307,10.603,46.72],previousFocus:[8.742,2.339,23.03],
  previousHero:[11.112,6.08,22.395],desiredCamera:[35.903,14.114,36.723],
  desiredFocus:[9.895,6.929,23.408],hero:[12.834,11.7,23.62],dt:.05};
 const x=f(episode);
 assert.ok(x,'source ticks skipped by renderer cannot authorize an unearned camera teleport');
 assert.equal(x.reason,'first-original-floor-nine-camera-airborne-orbit');
 assert.ok(x.requestedMovement>14.29 && x.boundedMovement<3);
 assert.ok(x.focus[1]>episode.previousFocus[1],'follow the authentic rising hero');
 assert.equal(f({...episode,desiredCamera:[8,4,26]}),null,
  'retain original close inward hero rescue');
 assert.equal(f({...episode,hero:[65,20,23]}),null);
 assert.equal(f({...episode,source:{...episode.source,floor:10}}),null);
 assert.equal(f({...episode,lastRendered:{...episode.lastRendered,runToken:'restart'}}),null);
});
