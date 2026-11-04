'use strict';
// Source-pin a real camera-to-clockwork-gear sightline; this does NOT amount
// to blind full-motion quality approval or hardware performance evidence.
const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const ROOT=path.resolve(__dirname,'../..');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'tower-foreground-sight-'));
const threeURL=pathToFileURL(path.join(ROOT,'node_modules/three/build/three.module.js')).href;
const coordinateURL=pathToFileURL(path.join(ROOT,'public/infinite-tower-climb/visuals/coordinates.mjs')).href;
const surfaceURL=pathToFileURL(path.join(ROOT,'public/infinite-tower-climb/visuals/world-surface.mjs')).href;
const hierarchyURL=pathToFileURL(path.join(ROOT,'public/infinite-tower-climb/visuals/scene-hierarchy.mjs')).href;
const source=fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/world.mjs'),'utf8')
  .replace("'/tower/vendor/three.module.js'",JSON.stringify(threeURL))
  .replace("'./coordinates.mjs'",JSON.stringify(coordinateURL))
  .replace("'./world-surface.mjs'",JSON.stringify(surfaceURL))
  .replace("'./scene-hierarchy.mjs'",JSON.stringify(hierarchyURL));
fs.writeFileSync(path.join(scratch,'world.mjs'),source);
const loaded=Promise.all([
  import(threeURL),import(pathToFileURL(path.join(scratch,'world.mjs')).href),
]);
after(()=>fs.rmSync(scratch,{recursive:true,force:true}));
function sourceFrame(theme,floor=0){
  const frame={runToken:'real-render-run',lifecycle:'running',floor,tick:145,
    theme,worldWidth:480000,chunkBaseY:floor*360000,chunkHeight:360000,
    platforms:[],hazards:[],enemies:[]};
  return Object.freeze(frame);
}
function gearRoot(world){
  let found=null;
  world.group.traverse(node=>{
    if(!found&&node.name==='CameraResponsiveDecorativeGear')found=node;
  });
  return found;
}
test('a real THREE ray from a smoothed exterior camera softens ONLY a blocking decorative clockwork gear',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const snapshot=sourceFrame('clockwork');
    world.update(snapshot,.016,0,{quality:'low'});
    const root=gearRoot(world);
    assert.ok(root,'clockwork foreground gear must exist in the actual world');
    world.group.updateMatrixWorld(true,true);
    const actor=root.localToWorld(new THREE.Vector3(0,3.4,-10));
    const camera=new THREE.PerspectiveCamera(42,390/844,.2,1200);
    camera.position.copy(root.localToWorld(new THREE.Vector3(0,3.4,22)));
    camera.lookAt(actor);
    let state=world.protectRouteSightlines(camera,actor,null,null,.1,{quality:'low'});
    assert.equal(state.total,3,'no unbounded foreground occluder registry');
    for(let i=0;i<12;i++)state=world.protectRouteSightlines(camera,actor,null,null,.05,{quality:'low'});
    assert.ok(state.softened>=1,'real geometry blocks this actual source-supplied subject ray');
    assert.ok(world.diagnostics().occludedForegroundGears>=1);
    const materials=[];
    root.traverse(node=>{if(node.isMesh&&node.material?.name==='SightlineResponsiveDecorativeAlloy')
      materials.push(node.material);});
    assert.ok(materials.length>=1,'at least one gear face owns the fade');
    assert.ok(materials.every(material=>material.opacity<.8&&!material.depthWrite));
    assert.equal(snapshot.floor,0,'render-only view protection cannot mutate authority');
    state=world.protectRouteSightlines(camera,null,null,null,.016,{stale:true});
    assert.equal(state.softened,0,'stale feed restores all decorative solidity immediately');
    assert.ok(materials.every(material=>material.opacity===1&&material.depthWrite));
    assert.ok(world.diagnostics().meshes+world.diagnostics().shadowCasterMeshes<=100,
      'foreground gear does not break established scene draw budget');
  }finally{world.dispose();}
});
test('ordinary biomes, reduced-motion and full restart never leave a phantom transparent rotor',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    world.update(sourceFrame('clockwork'),.016,0,{});
    const root=gearRoot(world);world.group.updateMatrixWorld(true,true);
    const subject=root.localToWorld(new THREE.Vector3(0,3.4,-10));
    const camera=new THREE.PerspectiveCamera(42,1.6,.2,1200);
    camera.position.copy(root.localToWorld(new THREE.Vector3(0,3.4,22)));
    world.protectRouteSightlines(camera,subject,null,null,.05,{reducedMotion:true});
    assert.ok(world.diagnostics().occludedForegroundGears>=1,
      'reduced motion retains steady static line-of-sight protection');
    world.update(sourceFrame('ruins',1),.016,1,{});
    assert.equal(world.diagnostics().decorativeSightlineGears,0,
      'new floor retires original rotor materials and sightline state');
    assert.deepEqual(world.protectRouteSightlines(camera,subject),{total:0,softened:0});
    assert.equal(world.diagnostics().occludedForegroundGears,0);
  }finally{world.dispose();}
});
test('the submitted follow camera stages source-observed foreground clarity after camera recovery, not before',()=>{
  const scene=fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  assert.match(scene,/world\.protectRouteSightlines\(camera,/);
  assert.ok(scene.indexOf('world.protectRouteSightlines(camera,')>
    scene.indexOf('actorRescueFraction = 0;\n    if (!overview'),
    'sightline protection uses settled actor/guardian recovery and the real last camera');
  assert.match(scene,/protectLiveRoute&&sourceGuardian\?guardianRescuePoint:null/);
  assert.match(scene,/const protectArrival=!!targetPlatform&&landingApproach\.diagnostics\(\)\.visible/);
  assert.match(scene,/const protectImmediateTrap=actionStage\?\.kind==='hazard'/);
  assert.match(scene,/protectLiveRoute&&\(protectArrival\|\|protectImmediateTrap\)\?actorOrbitTarget:null/);
  assert.ok(scene.indexOf('const protectArrival=') <
    scene.indexOf('const protectImmediateTrap='),
    'an already visible real landing keeps precedence over decorative shielding');
});

test('the actual frame protects the BETWEEN-subject corridor, including the central gear axle, without changing replay facts',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const snapshot=sourceFrame('clockwork'), before=JSON.stringify(snapshot);
  const world=createTowerWorld();
  try{
    world.update(snapshot,.016,0,{quality:'low'});
    const root=gearRoot(world);
    assert.ok(root);
    world.group.updateMatrixWorld(true,true);
    // A far exterior view frames BOTH true endpoints. Neither endpoint has
    // a ray through the central rotor: the large rotor steals their shared
    // approach corridor instead of directly hiding either actor's center.
    const left=root.localToWorld(new THREE.Vector3(-25,3.4,-10));
    const right=root.localToWorld(new THREE.Vector3(25,3.4,-10));
    const center=root.localToWorld(new THREE.Vector3(0,3.4,-10));
    const camera=new THREE.PerspectiveCamera(42,390/844,.2,1200);
    camera.position.copy(root.localToWorld(new THREE.Vector3(0,3.4,180)));
    camera.lookAt(center);
    for(let i=0;i<12;i++)
      world.protectRouteSightlines(camera,left,right,null,.05,{quality:'low'});
    const parts=[];
    root.traverse(node=>{
      if(node.isMesh&&/^SightlineResponsiveDecorative/.test(node.material?.name||''))
        parts.push(node.material);
    });
    assert.ok(parts.some(material=>material.name==='SightlineResponsiveDecorativeTrim'),
      'opaque central axle no longer defeats hero/guardian line-of-action clarity');
    assert.ok(parts.length>=2 && parts.every(material=>material.opacity<.8 && !material.depthWrite),
      'the whole non-gameplay rotor, not only its spokes, yields to the shared action');
    assert.ok(world.diagnostics().occludedForegroundCorridorGears>=1);
    assert.equal(JSON.stringify(snapshot),before,'the renderer cannot rewrite the authoritative source');
    world.protectRouteSightlines(camera,null,null,null,.01,{stale:true});
    assert.ok(parts.every(material=>material.opacity===1&&material.depthWrite),
      'stale/recovery restores all geometry with no phantom translucent hub');
  }finally{world.dispose();}
});

test('pure screen-stage policy fades only visible foreground machinery BETWEEN actual action endpoints',async()=>{
  const [,{observedStageCorridorOpacity}]=await loaded;
  const scene={
    aspect:390/844,gear:{x:0,y:.05,z:.2},radius:.12,gearDepth:25,
    from:{x:-.76,y:.05,z:.35},to:{x:.76,y:.05,z:.35},
    fromDepth:48,toDepth:49,guardian:true,
  };
  assert.equal(observedStageCorridorOpacity(scene),.42);
  assert.equal(observedStageCorridorOpacity({...scene,guardian:false}),.58);
  assert.equal(observedStageCorridorOpacity({...scene,gear:{x:0,y:.65,z:.2}}),1,
    'decorative scenery outside actual action lane remains opaque');
  assert.equal(observedStageCorridorOpacity({...scene,gearDepth:55}),1,
    'scenery behind the actors cannot hide their source-present action');
  assert.equal(observedStageCorridorOpacity({...scene,to:{x:1.8,y:.05,z:.35}}),1,
    'an already offscreen destination does not trigger fake scene clearing');
  assert.equal(observedStageCorridorOpacity({...scene,from:null}),1);
  assert.equal(observedStageCorridorOpacity({...scene,radius:Infinity}),1);
  assert.equal(observedStageCorridorOpacity({...scene,to:scene.from}),1,
    'a single center point is not an observed two-subject story');
});
