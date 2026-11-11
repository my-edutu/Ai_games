'use strict';
// Source-authenticated Floor 8→9 GPU critical-path regression. Engineering
// checks, NOT a LOOKS/FEELS/PLAYS vote or presented-frame performance claim.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'../..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'tower-earned-remote-'));
test.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
const file=relative=>pathToFileURL(path.join(ROOT,relative)).href;
const three=file('node_modules/three/build/three.module.js');
const raw=fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
const source=raw.replace("'/tower/vendor/three.module.js'",JSON.stringify(three))
  .replace("'./coordinates.mjs'",JSON.stringify(file('public/infinite-tower-climb/visuals/coordinates.mjs')))
  .replace("'./world-surface.mjs'",JSON.stringify(file('public/infinite-tower-climb/visuals/world-surface.mjs')))
  .replace("'./guardian-transmission-layout.mjs'",JSON.stringify(file('public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs')))
  .replace("'./mesh-provenance.mjs'",JSON.stringify(file('public/infinite-tower-climb/visuals/mesh-provenance.mjs')))
  .replace("'./scene-hierarchy.mjs'",JSON.stringify(file('public/infinite-tower-climb/visuals/scene-hierarchy.mjs')));
fs.writeFileSync(path.join(tmp,'world.mjs'),source);
const loaded=import(pathToFileURL(path.join(tmp,'world.mjs')).href);
const cap={id:'f8:cap',kind:'oneway',x:115200,y:3212000,width:249600,height:12000};
const prior=()=>({runToken:'genuine-episode',tick:448,floor:8,lifecycle:'running',
  theme:'clockwork',chunkBaseY:2880000,chunkHeight:360000,worldWidth:480000,
  guardianExitX:cap.x+Math.floor(cap.width*.76),platforms:[{...cap}],
  hazards:[],enemies:[{id:'f8:guardian',floor:8,kind:'guardian',
    x:245000,y:3239000,halfWidth:14000,halfHeight:18000,
    health:0,maxHealth:8,active:false,telegraph:false}],
  player:{x:304896,y:3240000,grounded:true,groundedPlatformId:cap.id,
    health:5,halfWidth:9000,halfHeight:14000,state:'standing'}});
const arrival=()=>({runToken:'genuine-episode',tick:453,floor:9,lifecycle:'running',
  theme:'void',chunkBaseY:3240000,chunkHeight:360000,worldWidth:480000,
  platforms:[{id:'f9:ground',kind:'ground',x:0,y:3240000,
    width:480000,height:12000}],hazards:[],enemies:[],
  player:{x:324296,y:3266000,grounded:true,
    groundedPlatformId:'f9:ground',health:5,halfWidth:9000,
    halfHeight:14000,state:'standing'}});
function distant(world){
  const found=[];world.group.traverse(o=>{
    if(o.isMesh && o.material?.name==='distant-atmosphere')found.push(o);
  });
  return found;
}
test('only genuine source-earned grounded 8→9 next-floor snapshots may budget distant work',async()=>{
  const {observedEarnedFloorArrival}=await loaded;
  const a=prior(),b=arrival(),original=JSON.stringify([a,b]);
  assert.equal(observedEarnedFloorArrival(a,b),true);
  assert.equal(JSON.stringify([a,b]),original,'source state must be immutable');
  for(const p of [
    {...a,guardianExitX:undefined},
    {...a,enemies:[]},
    {...a,enemies:[{...a.enemies[0],health:1,active:true}]},
    {...a,player:{...a.player,grounded:false}},
    {...a,player:{...a.player,groundedPlatformId:'f8:p6'}},
    {...a,runToken:'old-episode'},
  ])assert.equal(observedEarnedFloorArrival(p,b),false);
  for(const n of [
    {...b,floor:10},{...b,tick:447},
    {...b,lifecycle:'result'}, {...b,runToken:'restarted'},
    {...b,player:{...b.player,grounded:false}},
    {...b,player:{...b.player,groundedPlatformId:'f9:p2'}},
  ])assert.equal(observedEarnedFloorArrival(a,n),false);
});
test('authentic next floor draws the real deck and canyon before the cold distant skyline; only a successful render allows its bounded return',async()=>{
  const {createTowerWorld}=await loaded;
  const world=createTowerWorld(),from=prior(),to=arrival();
  try{
    world.update(from,.016,0,{quality:'low'});
    assert.equal(distant(world).filter(o=>o.material.type==='MeshBasicMaterial').length,1);
    world.update(to,.016,.016,{quality:'low'});
    let diag=world.diagnostics(),deferred=diag.deferredDistantArrival;
    assert.equal(diag.floor,9);
    assert.equal(deferred?.state,'awaiting-actual-first-render');
    assert.equal(deferred?.firstRenderSubmitted,false);
    assert.equal(diag.vistaLayers,3,'the full original canyon remains on first frame');
    assert.equal(diag.platforms,1,'source-authored new-floor ground is never deferred');
    assert.ok(world.group.getObjectByName('platform:f9:ground'));
    assert.equal(distant(world).filter(o=>o.material.type==='MeshBasicMaterial').length,0);
    world.update(to,.016,.032,{quality:'low'});
    assert.equal(world.diagnostics().deferredDistantArrival?.state,
      'awaiting-actual-first-render','more HTTP snapshots cannot authorize geometry');
    assert.equal(world.noteFrameSubmitted(from),false,
      'a stale old-floor render cannot release a pending new-floor job');
    assert.equal(world.noteFrameSubmitted({...to,runToken:'other-episode'}),false);
    assert.equal(world.noteFrameSubmitted(to,{stale:true}),false);
    assert.equal(world.noteFrameSubmitted(to),true);
    world.update(to,.016,.048,{quality:'low'});
    diag=world.diagnostics();
    assert.equal(diag.deferredDistantArrival.state,'fading-remote-arrival');
    assert.ok(diag.deferredDistantArrival.deferredBuildMs>=0);
    assert.equal(distant(world).filter(o=>o.material.type==='MeshBasicMaterial').length,1);
    for(let i=0;i<40;i++)world.update(to,.016,i/60,{quality:'low'});
    diag=world.diagnostics();
    assert.equal(diag.deferredDistantArrival.state,'complete');
    assert.equal(diag.deferredDistantArrival.fade,1);
    assert.equal(diag.deferredDistantArrival.firstRenderSubmitted,true);
    const remote=distant(world).find(o=>o.material.type==='MeshBasicMaterial');
    assert.equal(remote.material.opacity,1);
    assert.equal(remote.castShadow,false);
    assert.equal(diag.vistaLayers,3);
    // A graphics-quality rebuild clears the one held task, not a memory leak.
    world.update(to,.016,2,{quality:'high'});
    assert.equal(world.diagnostics().deferredDistantArrival,null);
  } finally{
    world.dispose();
    assert.equal(world.diagnostics().meshes,0);
  }
});
test('the shipped scene releases deferred world only after returned WebGL and never on HTTP acceptance',()=>{
  const scene=fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/update\(motionDt\); renderer\.render\(scene, camera\)/);
  const rendered=scene.indexOf('renderer.render(scene, camera)');
  const acknowledged=scene.indexOf('world.noteFrameSubmitted(snapshot,options)');
  assert.ok(acknowledged>rendered);
  assert.ok(acknowledged<scene.indexOf('renderProgress.submitted(snapshot, performance.now())'));
});
