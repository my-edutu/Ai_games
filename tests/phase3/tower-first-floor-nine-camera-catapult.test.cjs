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
test('post-director source guard acts only before genuine WebGL return',()=>{
 const scene=fs.readFileSync(path.join(visuals,'scene.mjs'),'utf8');
 const i=scene.indexOf('const firstF9DepartureBound=sourceFirstFloorNineCameraDeparture(');
 assert.ok(i>scene.indexOf('const earnedOrbit=sourceEarnedFloorNineOrbitGuard('));
 assert.ok(i<scene.indexOf('renderer.render(scene, camera);',i));
 assert.match(scene,/lastReturnedFloorNineHero\.copy\(climber\.group\.position\)/);
 assert.match(scene,/firstFloorNineCameraEntry\.tick=snapshot\.tick/);
 assert.match(scene,/towerCoreSightlineClear\(camera\.position,releaseHero,23\.5\)/);
});
