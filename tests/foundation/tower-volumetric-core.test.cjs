'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/infinite-tower-climb/volumetric-core.js'),'utf8');
const create=new Function(source.replace('export function','function')+';return createVolumetricCore;')();
test('real 3-axis autonomous climber traverses over 80 floors with bounded state',()=>{
  const sim=create();let minZ=Infinity,maxZ=-Infinity,platformMax=0;
  for(let i=0;i<7200;i++){
    const snapshot=sim.step(1/60);
    minZ=Math.min(minZ,snapshot.player.z);maxZ=Math.max(maxZ,snapshot.player.z);
    platformMax=Math.max(platformMax,snapshot.platforms.length);
    assert.ok(Number.isFinite(snapshot.player.x+snapshot.player.y+snapshot.player.z));
    assert.equal(snapshot.dimensionality,3);
  }
  const result=sim.snapshot();
  assert.ok(result.highestReached>=80,'AI must actually ascend in the simulated world');
  assert.ok(maxZ-minZ>8,'depth axis must be actively traversed');
  assert.ok(platformMax<=24,'streamed world geometry must stay bounded');
  assert.ok(result.player.deaths<4,'route planner should be able to land');
  assert.ok(result.guardianKills>=10,'AI must autonomously win major 3D guardian battles');
  assert.ok(result.score>1000,'completed battles, climbs and rewards must earn points');
});
test('3-axis navigation is deterministic for the same seed and fixed tick sequence',()=>{
  const a=create(719),b=create(719);
  for(let i=0;i<4200;i++){a.step(1/60);b.step(1/60);}
  assert.deepEqual(a.snapshot(),b.snapshot());
  assert.throws(()=>a.step(.5),RangeError);
  assert.throws(()=>a.step(0),RangeError);
});

test('mobile platforms move in physical X/Z and AI still clears ten guardians across different seeds',()=>{
  for(const seed of [1,2,719,248201]){
    const sim=create(seed);
    const moving=sim.platforms.find(p=>p.kind==='moving');
    assert.ok(moving,'expected actual moving platforms');
    const initial={x:moving.x,z:moving.z};
    for(let i=0;i<7200;i++)sim.step(1/60);
    const snap=sim.snapshot();
    assert.ok(Math.abs(moving.x-initial.x)+Math.abs(moving.z-initial.z)>.1,'moving platform must actually relocate');
    assert.ok(snap.highestReached>=90,'AI must still complete complex moving route');
    assert.ok(snap.guardianKills>=10,'boss system must not stall the route');
  }
});

test('new physics platforms are materially distinct and keep scene size bounded',()=>{
 const s=create(42),kinds=new Set();
 for(let i=0;i<7200;i++){
   const view=s.step(1/60);
   view.platforms.forEach(p=>kinds.add(p.kind));
   assert.ok(view.platforms.length<=24);
 }
 for(const name of ['solid','moving','crumbling','narrow','wind','spring','guardian'])
   assert.ok(kinds.has(name),'missing mechanical platform '+name);
 assert.ok(s.snapshot().highestReached>=90);
 assert.ok(s.snapshot().upgradesTaken>=9);
 assert.ok(s.snapshot().wallClimbs>=3,'real vertical handhold sections must be traversed');
 assert.equal(s.snapshot().wallClimbs,Math.floor(s.snapshot().highestReached/23),'each unique handhold wall must register only once');
 assert.ok(s.snapshot().climbing.stamina>=0&&s.snapshot().climbing.stamina<=100);
});

test('checkpoint save reconstructs identical future authoritative 3D replay',()=>{
 for(const seed of [1,42,719,248201]){
   const original=create(seed);
   for(let i=0;i<2345;i++)original.step(1/60);
   const packed=JSON.parse(JSON.stringify(original.exportSave()));
   assert.ok(JSON.stringify(packed).length<22000,'checkpoint must fit mobile localStorage');
   const resumed=create(seed,packed);
   assert.deepEqual(resumed.snapshot(),original.snapshot());
   for(let i=0;i<1200;i++){original.step(1/60);resumed.step(1/60);}
   assert.deepEqual(resumed.snapshot(),original.snapshot());
 }
});
test('malformed, non-finite and manipulated local game checkpoints are rejected',()=>{
 const source=create(42);for(let i=0;i<180;i++)source.step(1/60);
 const original=source.exportSave();
 for(const input of [
  {},null,{...original,schemaVersion:999},{...original,platforms:[]},
  {...original,seedState:-1},{...original,player:{...original.player,y:Infinity}},
  {...original,build:{...original.build,grip:999}},
  {...original,platforms:[...original.platforms].reverse()}
 ]){
   if(input===null)continue;
   assert.throws(()=>create(42,input),Error);
 }
});
