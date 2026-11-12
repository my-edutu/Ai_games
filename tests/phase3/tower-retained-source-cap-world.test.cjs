'use strict';
// Real shipped Three.js Floor8->9 original cap resource ownership; the source
// validator already resides in guardian-passage.mjs, never a fake win fixture.
const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'../..');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'tower-retained-real-cap-'));
const local=path.join(scratch,'world.mjs');
const uri=file=>pathToFileURL(path.join(ROOT,'public/infinite-tower-climb/visuals',file)).href;
const source=fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/world.mjs'),'utf8')
  .replace("'/tower/vendor/three.module.js'",JSON.stringify(pathToFileURL(path.join(ROOT,'node_modules/three/build/three.module.js')).href))
  .replace("'./coordinates.mjs'",JSON.stringify(uri('coordinates.mjs')))
  .replace("'./world-surface.mjs'",JSON.stringify(uri('world-surface.mjs')))
  .replace("'./scene-hierarchy.mjs'",JSON.stringify(uri('scene-hierarchy.mjs')))
  .replace("'./guardian-transmission-layout.mjs'",JSON.stringify(uri('guardian-transmission-layout.mjs')))
  .replace("'./mesh-provenance.mjs'",JSON.stringify(uri('mesh-provenance.mjs')));
fs.writeFileSync(local,source);
after(()=>fs.rmSync(scratch,{recursive:true,force:true}));
const loaded=Promise.all([import(pathToFileURL(local).href),
  import(uri('guardian-passage.mjs'))]);
const cap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,width:249600,height:12000};
const gate=cap.x+Math.floor(cap.width*.76);
const body={health:5,grounded:true,halfWidth:9000,halfHeight:14000,
  y:3238000,x:gate+13000};
const common={runToken:'real-geometry-lifetime',lifecycle:'running',
  worldWidth:480000,chunkBaseY:2880000,chunkHeight:360000,
  hazards:[],pickups:[],projectiles:[]};
function old(){
  return {...common,floor:8,theme:'clockwork',tick:450,
    guardianExitX:gate,platforms:[cap],
    enemies:[{id:'f8:guardian',kind:'guardian',floor:8,active:false,
      health:0,x:235000,y:3250000,halfHeight:18000}],
    player:{...body,groundedPlatformId:'f8:cap'}};
}
function next(){
  return {...common,floor:9,theme:'void',tick:451,
    platforms:[{id:'f9:ground',kind:'solid',x:0,y:cap.y,
      width:480000,height:cap.height}],
    enemies:[],player:{...body,groundedPlatformId:'f9:ground'}};
}
test('same earned doorway retains the ORIGINAL old cap real geometry over the Floor9 render rebuild then disposes it',async()=>{
  const [{createTowerWorld},{observedGroundedGuardianHandoff}]=await loaded;
  const first=old(),second=next();
  assert.equal(observedGroundedGuardianHandoff(first,second),true);
  const original=JSON.stringify([first,second]);
  const world=createTowerWorld();
  try{
    world.update(first,.05,0,{quality:'low'});
    const genuine=world.group.getObjectByName('platform:f8:cap');
    assert.ok(genuine && genuine.isGroup,'original rendered source cap is present');
    const originalGate=world.group.getObjectByName('AuthoritativeGuardianGate');
    const originalDoor=world.group.getObjectByName('GuardianGateInset');
    assert.ok(originalGate?.isGroup && originalDoor?.isGroup,
      'genuine clockwork guardian gate is its own separate rendered world subtree');
    assert.equal(originalDoor.parent,originalGate,
      'walkable cap alone does NOT include the old physical guardian gateway');
    assert.equal(world.stageGroundedCapContinuation(first,second),true);
    world.update(second,.05,.05,{quality:'low'});
    assert.equal(world.group.getObjectByName('platform:f8:cap'),genuine,
      'the already-rendered original meshes must survive, not synthetic replacement');
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),originalGate,
      'the ORIGINAL opened guardian doorway must survive the Floor9 rebuild alongside the old deck');
    assert.equal(world.group.getObjectByName('GuardianGateInset'),originalDoor,
      'must retain the real HP-driven bronze grille and not substitute decorative inlays');
    assert.equal(originalGate.parent?.name,'ObservedGroundedCapGatewayContinuity',
      'old rendered cap and gate share one bounded historical transform');
    const retention=world.diagnostics().retainedSourceCap;
    assert.equal(retention.floor,9);
    assert.equal(retention.guardianGateRetained,true,
      'diagnostics expose actual old guardian doorway retention, not just a cosmetic deck');
    assert.equal(retention.submittedFrames,0);
    assert.ok(retention.geometryCount>0&&retention.materialCount>0);
    assert.ok(world.group.getObjectByName('platform:f9:ground'),
      'the REAL new source ground must render immediately');
    for(let i=0;i<15;i++)world.update(second,.1,.1+i*.1,{quality:'low'});
    assert.ok(world.group.getObjectByName('platform:f8:cap'),
      'unsubmitted GPU frames cannot consume old world continuity');
    world.noteFrameSubmitted(second,{});
    for(let i=0;i<5;i++)world.update(second,.1,2+i*.1,{quality:'low'});
    assert.ok(world.group.getObjectByName('platform:f8:cap'),
      'real cap survives the first successful new-floor renderer submission');
    world.noteFrameSubmitted(second,{});
    for(let i=0;i<17;i++)world.update(second,.1,3+i*.1,{quality:'low'});
    assert.equal(world.group.getObjectByName('platform:f8:cap'),undefined,
      'the bounded old floor must retire on submitted-frame display time');
    assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),undefined,
      'old unlocked gate and its GPU resources must retire with old cap');
    assert.equal(world.diagnostics().retainedSourceCap,null);
    assert.equal(JSON.stringify([first,second]),original,
      'the old/new authoritative source must be immutable');
  }finally{world.dispose();}
});
test('unearned, stale, wrong-run or geometry-mismatched cap never attaches old world',async()=>{
  const [{createTowerWorld}]=await loaded;
  for(const mutate of [
    ([a,b])=>{b.runToken='different';},
    ([a,b])=>{b.floor=10;},
    ([a,b])=>{b.player.grounded=false;},
    ([a,b])=>{b.platforms[0].y+=1000;},
    ([a,b])=>{a.platforms[0].width-=1000;},
  ]){
    const world=createTowerWorld();
    try{
      const previous=old(),after=next();world.update(previous,.05,0,{quality:'low'});
      const proof=structuredClone(previous);mutate([proof,after]);
      assert.equal(world.stageGroundedCapContinuation(proof,after),false);
      world.update(after,.05,.05,{quality:'low'});
      assert.equal(world.diagnostics().retainedSourceCap,null);
      assert.equal(world.group.getObjectByName('AuthoritativeGuardianGate'),undefined,
        'no fake unlocked old door may attach on wrong-run or unearned transitions');
    }finally{world.dispose();}
  }
});
test('original cap is bounded to source run, grounded continuation and real restart',async()=>{
  const [{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    world.update(old(),.05,0,{quality:'low'});
    assert.equal(world.stageGroundedCapContinuation(old(),next()),true);
    world.update(next(),.05,0,{quality:'low'});
    assert.ok(world.diagnostics().retainedSourceCap);
    const airborne={...next(),tick:452,
      player:{...next().player,x:gate+20000,y:body.y+8000,
        grounded:false,groundedPlatformId:null,state:'airborne',vy:12000}};
    world.noteFrameSubmitted(next());
    world.update(airborne,.05,.05,{quality:'low'});
    assert.equal(world.diagnostics().retainedSourceCap?.guardianGateRetained,true,
      'the first legitimate nearby Floor9 jump retains the real open gateway');
    const far={...airborne,tick:460,
      player:{...airborne.player,x:gate+150000}};
    world.update(far,.05,.1,{quality:'low'});
    assert.equal(world.diagnostics().retainedSourceCap,null,
      'the old GPU world retires when the actor truly leaves the gate vicinity');
  }finally{world.dispose();}
});
