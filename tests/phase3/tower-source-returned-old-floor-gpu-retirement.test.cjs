'use strict';
// Actual Three.js world ownership: reaping the disconnected F8 GPU payload
// must never make the original earned doorway or walkable F9 route disappear.
const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tower-gateway-gpu-retirement-'));
const visuals=path.join(root,'public/infinite-tower-climb/visuals');
const input=fs.readFileSync(path.join(visuals,'world.mjs'),'utf8')
  .replace("'/tower/vendor/three.module.js'",
    JSON.stringify(pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href))
  .replace(/from '\.\/([^']+)'/g,(_,name)=>
    'from '+JSON.stringify(pathToFileURL(path.join(visuals,name)).href));
const local=path.join(dir,'world.mjs');
fs.writeFileSync(local,input);
after(()=>fs.rmSync(dir,{force:true,recursive:true}));
const loaded=import(pathToFileURL(local).href);
const cap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,
  width:249600,height:12000};
const gate=cap.x+Math.floor(cap.width*.76);
const player={health:5,grounded:true,state:'standing',vy:0,
  halfWidth:9000,halfHeight:14000,y:3238000,x:gate+13000};
const common={runToken:'owned-gateway-cleanup',lifecycle:'running',
  worldWidth:480000,chunkBaseY:2880000,chunkHeight:360000,
  hazards:[],pickups:[],projectiles:[]};
const old=()=>({...common,floor:8,theme:'clockwork',tick:450,
  guardianExitX:gate,platforms:[cap],
  enemies:[{id:'f8:guardian',kind:'guardian',floor:8,active:false,
    health:0,x:235000,y:3250000,halfHeight:18000}],
  player:{...player,groundedPlatformId:'f8:cap'}});
const next=()=>({...common,floor:9,theme:'void',tick:451,
  platforms:[{id:'f9:ground',kind:'solid',x:0,y:cap.y,
    width:480000,height:cap.height}],
  enemies:[],player:{...player,groundedPlatformId:'f9:ground'}});

test('genuine grounded cap passage schedules OLD unowned GPU resources only after actual F9 render return',async()=>{
  const {createTowerWorld}=await loaded;
  const world=createTowerWorld();
  const a=old(),b=next(),immutable=JSON.stringify([a,b]);
  try {
    world.update(a,.05,0,{quality:'low'});
    assert.equal(world.stageGroundedCapContinuation(a,b),true);
    world.update(b,.05,.05,{quality:'low'});
    const initial=world.diagnostics().previousFloorGpuCleanup;
    assert.equal(initial.state,'waiting-for-first-real-floor-nine-return');
    assert.ok(initial.queued>0 && initial.queued<=1024);
    assert.equal(initial.released,0);
    assert.equal(initial.remaining,initial.queued);
    assert.ok(world.group.getObjectByName('AuthoritativeGuardianGate'));
    assert.ok(world.group.getObjectByName('platform:f9:ground'));
    world.noteFrameSubmitted(b,{quality:'low',stale:true},.05);
    assert.equal(world.diagnostics().previousFloorGpuCleanup.released,0,
      'stale presentation cannot spend the reaper clock');
    world.noteFrameSubmitted(b,{quality:'low'},.05);
    const after=world.diagnostics().previousFloorGpuCleanup;
    assert.ok(after.released>0 && after.released<=24);
    assert.equal(after.remaining,initial.remaining-after.released);
    assert.equal(after.returnedFrames,1);
    assert.ok(world.group.getObjectByName('AuthoritativeGuardianGate'));
    assert.ok(world.group.getObjectByName('platform:f9:ground'));
    assert.equal(JSON.stringify([a,b]),immutable);
  }finally{world.dispose();}
});
test('old-world cleanup is forced on changed source run, even without any returned successor frame',async()=>{
  const {createTowerWorld}=await loaded;
  const world=createTowerWorld();
  try {
    const a=old(),b=next();
    world.update(a,.05,0,{quality:'low'});
    assert.equal(world.stageGroundedCapContinuation(a,b),true);
    world.update(b,.05,.05,{quality:'low'});
    assert.ok(world.diagnostics().previousFloorGpuCleanup.remaining>0);
    const reset={...a,runToken:'fresh-source-run',tick:1,
      player:{...a.player}};
    world.update(reset,.05,.1,{quality:'low'});
    const cleanup=world.diagnostics().previousFloorGpuCleanup;
    assert.equal(cleanup.remaining,0);
    assert.equal(cleanup.released,cleanup.queued);
    assert.equal(cleanup.state,'superseded-floor-rebuild');
    assert.equal(world.diagnostics().retainedSourceCap,null);
  }finally{world.dispose();}
});
