'use strict';
// Source-pin a real camera-to-clockwork-gear sightline; this does NOT amount
// to blind full-motion quality approval or hardware performance evidence.
const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
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
  .replace("'./crossfloor-arrival.mjs'", JSON.stringify(pathToFileURL(path.join(path.resolve(__dirname, '../..'), 'public/infinite-tower-climb/visuals/crossfloor-arrival.mjs')).href))
  .replace("'./guardian-passage.mjs'", JSON.stringify(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/guardian-passage.mjs')).href))
  .replace("'./world-surface.mjs'",JSON.stringify(surfaceURL))
  .replace("'./guardian-transmission-layout.mjs'", JSON.stringify(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs')).href))
  .replace("'./mesh-provenance.mjs'", JSON.stringify(pathToFileURL(path.join(ROOT, 'public/infinite-tower-climb/visuals/mesh-provenance.mjs')).href))
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
    assert.equal(state.total,4,
      'three real decorative rotors plus one bounded noncolliding power rack');
    assert.equal(world.diagnostics().decorativeSightlineGears,3);
    assert.equal(world.diagnostics().decorativeSightlineRacks,1);
    const rayEvidence=world.diagnostics().decorativeOcclusionEvidence;
    assert.equal(rayEvidence.length,4,'three original rotors and rack must produce diagnostics');
    for (const item of rayEvidence) {
      assert.ok(Number.isSafeInteger(item.rayBoundsRejects)&&item.rayBoundsRejects>=0);
      assert.ok(Number.isSafeInteger(item.rayNarrowphaseChecks)&&item.rayNarrowphaseChecks>=0);
      assert.equal(item.raySamples,item.rayBoundsRejects+item.rayNarrowphaseChecks,
        'compositing must preserve actual first-pass occlusion accounting');
    }
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
    const reduced=world.diagnostics();
    assert.equal(reduced.decorativeOcclusionEvidence.length,4);
    for(const entry of reduced.decorativeOcclusionEvidence){
      assert.equal(entry.renderedAlpha,entry.intendedAlpha,
        'reduced motion applies exact observed geometry opacity without temporal interpolation');
      assert.equal(entry.raySamples,entry.rayBoundsRejects+entry.rayNarrowphaseChecks);
    }
    if(reduced.decorativeOcclusionEvidence.some(e=>e.rayContactCount>0))
      assert.ok(reduced.occludedForegroundGears>=1,
        'physical ray impact must still protect sightlines under reduced motion');
    else assert.equal(reduced.occludedForegroundGears,
      reduced.decorativeOcclusionEvidence.filter(e=>e.intendedAlpha<.985).length,
      'an open mechanical aperture must not invent an exact triangle obstruction');
    world.update(sourceFrame('ruins',1),.016,1,{});
    assert.equal(world.diagnostics().decorativeSightlineGears,0,
      'new floor retires original rotor materials and sightline state');
    assert.deepEqual(world.protectRouteSightlines(camera,subject),{total:0,softened:0});
    assert.equal(world.diagnostics().occludedForegroundGears,0);
  }finally{world.dispose();}
});
test('submitted camera runs source-authenticated multi-target foreground protection after actual camera corrections',async()=>{
  const scene=fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/scene.mjs'),'utf8');
  const reveal=scene.indexOf('world.revealGuardianSightlines(camera,guardianSightPoints);');
  const protect=scene.indexOf('world.protectRouteSightlines(camera,');
  assert.ok(reveal>=0 && protect>reveal,
    'protection must follow the submitted camera and physical guardian cutaway');
  assert.match(scene,/protectLiveRoute&&sourceGuardian\?guardianRescuePoint:null/);
  assert.match(scene,/const sightlinePriorities=sourceCriticalSightlinePriorities\(/);
  assert.match(scene,/landingApproach\.diagnostics\(\)\.visible \|\| airborneDuelLanding/);
  assert.match(scene,/observedHazard:actionStage\?\.kind==='hazard'/);
  assert.match(scene,/sightlinePriorities\.hazard\?observedHazardSightline:null/);
  assert.match(scene,/protectTerminalScene\?actorOrbitTarget/);
  const policyUrl=pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/critical-sightlines.mjs')).href;
  const {sourceCriticalSightlinePriorities:prioritize}=await import(policyUrl);
  assert.deepEqual(prioritize({live:true,observedLanding:true,observedHazard:true,
    earnedGateway:true,airborneGateway:true}),
    {arrival:true,hazard:true,gate:false},
    'a present hazard cannot erase the actual selected landing or pretend the gate was crossed');
  assert.deepEqual(prioritize({live:true,observedLanding:true,
    earnedGateway:true,airborneGateway:true}),
    {arrival:true,hazard:false,gate:true},
    'earned airborne gateway and landing retain independent visibility');
  assert.deepEqual(prioritize({live:false,observedHazard:true,earnedGateway:true}),
    {arrival:false,hazard:false,gate:false},
    'stale and terminal snapshots cannot synthesize live victory visibility');
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


test('a 390x844 clockwork action frame protects the complete post-batch dial, not detached pre-batch scenery',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const snapshot=sourceFrame('clockwork',8), prior=JSON.stringify(snapshot);
    world.update(snapshot,.016,0,{quality:'low'});
    const clockMeshes=[];
    world.group.traverse(object=>{
      if(object.isMesh&&object.material?.name==='SightlineResponsiveClockFace')
        clockMeshes.push(object);
    });
    assert.ok(clockMeshes.length>=3,'the original three clock cases survived static batching');
    assert.equal(world.diagnostics().clockFaceRayMeshes,clockMeshes.length,
      'all camera raycast clock cases are the meshes actually submitted by Three.js, not stale pre-batch handles');
    assert.ok(clockMeshes.every(mesh=>mesh.parent && world.group.getObjectById(mesh.id)===mesh),
      'every raycast dial must still be attached to the rendered tower world');
    const gear=gearRoot(world);
    assert.ok(gear,'world must retain the original clockwork wheel');
    world.group.updateMatrixWorld(true,true);
    const actor=gear.localToWorld(new THREE.Vector3(0,3.4,-10));
    const camera=new THREE.PerspectiveCamera(42,390/844,.2,1200);
    camera.position.copy(gear.localToWorld(new THREE.Vector3(0,3.4,22)));
    camera.lookAt(actor);
    for(let i=0;i<12;i++)
      world.protectRouteSightlines(camera,actor,null,null,.05,{quality:'low'});
    const state=world.diagnostics();
    assert.ok(state.occludedForegroundGears>=1 && state.occludedForegroundClockFaces>=1);
    assert.ok(clockMeshes.some(mesh=>mesh.material.opacity<.2 && mesh.material.depthWrite===false),
      'wheel AND actual merged dial yield enough pixel coverage for the real hero body to read');
    assert.equal(JSON.stringify(snapshot),prior,'presentation cannot change authoritative source data');
    world.protectRouteSightlines(camera,null,null,null,.05,{stale:true});
    assert.ok(clockMeshes.every(mesh=>mesh.material.opacity===1 && mesh.material.depthWrite),
      'disconnected/stale feed must restore actual clock cases to fully opaque depth-writing metal');
  }finally{world.dispose();}
});

test('projected oversize phone wheel cannot evade the action-visibility rule; layered alpha has a bounded composite',async()=>{
  const [,{observedPortraitGearDominance,observedLayeredSceneryOpacity}]=await loaded;
  const input={aspect:390/844,
    gear:{x:0,y:0,z:.2}, radius:3.8,gearDepth:12,
    actor:{x:.12,y:.14,z:.35},actorDepth:40};
  const opacity=observedPortraitGearDominance(input);
  assert.ok(opacity<=.2,'genuinely giant near-phone rotor has not disappeared through a radius cutoff');
  assert.equal(observedPortraitGearDominance({...input,aspect:960/600}),1,
    'desktop never activates portrait dominance');
  assert.equal(observedPortraitGearDominance({...input,gearDepth:44}),1,
    'scenery behind an actor cannot be falsely removed as foreground');
  const layers=6,perLayer=observedLayeredSceneryOpacity(.42,layers);
  assert.ok(perLayer<.1 && perLayer>0);
  assert.ok(Math.abs(1-Math.pow(1-perLayer,layers)-.42)<1e-10,
    'stacked semi-transparent faces must be budgeted as one visual curtain');
  assert.equal(observedLayeredSceneryOpacity(1,6),1);
  assert.equal(observedLayeredSceneryOpacity(.42,0),1,
    'invalid layer count fails closed instead of hiding level architecture');
});


test('authentic clockwork upper-cap spectacle is flanked outside the playable guardian arc and has no wall-sized closed clock backs',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try {
    const source=sourceFrame('clockwork',8);
    world.update(source,.016,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    const centers=[];
    world.group.traverse(object=>{
      if(object.name!=='CameraResponsiveDecorativeGear')return;
      const at=new THREE.Vector3();
      object.getWorldPosition(at);
      centers.push({angle:Math.atan2(at.x,at.z),y:at.y,radial:Math.hypot(at.x,at.z)});
    });
    assert.equal(centers.length,3,'retain one major clock and two smaller source-independent rotors');
    assert.ok(centers.every(center=>Math.abs(center.angle)>1.32 && center.radial>18),
      'no giant decorative clock group may stand inside the ±1.1-radian real cap climbing corridor');
    assert.ok(centers.some(center=>center.angle>1.32) &&
      centers.some(center=>center.angle< -1.32),
      'flank real ascent from both distant tower shoulders rather than stacking the boss camera foreground');
    // Previous acceptance pinned the ornamental third rotor at y34..38:
    // exactly the LIVE cap-combat elevation obscured in original 15s
    // portrait WebM. Retain the visible third rotating mechanism, but keep
    // its actual world-space centre in the architectural space above it.
    assert.ok(centers.some(center=>center.y>=50 && center.y<=70),
      'third real high-right rotor must clear cap combat rather than reoccupy y34..38');
    const owned=[];
    world.group.traverse(object=>{
      if(object.isMesh && object.material?.name==='SightlineResponsiveClockFace')owned.push(object);
    });
    assert.ok(owned.length>=3,'opened surrounds still participate in actual post-batch occlusion recovery');
    assert.equal(world.diagnostics().decorativeSightlineGears,3);
    assert.equal(source.floor,8,'art direction cannot mutate fixed-step source truth');
  }finally{world.dispose();}
});

test('real portrait guardian action gives an oversized noncolliding CLOCKWORK backdrop one bounded composite budget even behind the hero',async()=>{
  const [,{observedPortraitActionBackdropOpacity:opacity}]=await loaded;
  const photographed={
    aspect:390/844,
    bounds:{minX:-.7,maxX:.7,minY:-.62,maxY:.65},
    actor:{x:.12,y:-.12,z:.3},
    partners:[{x:-.24,y:.3,z:.5}],
    partnerCount:1,
    coverage:.351,
  };
  assert.equal(opacity(photographed),.30,
    'source-owned boss stage must not disappear behind an opaque decorative BACKDROP merely because its bound is farther than the hero');
  assert.equal(opacity({...photographed,coverage:.25}),.46,
    'smaller photographic competition uses a restrained fade');
  assert.equal(opacity({...photographed,aspect:960/600}),1,
    'desktop architectural spectacle must remain unchanged');
  assert.equal(opacity({...photographed,coverage:.12}),1,
    'small background mechanisms must remain solid');
  assert.equal(opacity({...photographed,partnerCount:0}),1,
    'an isolated robot does not synthesize a boss/gateway story');
  assert.equal(opacity({...photographed,partners:[{x:1.7,y:0,z:.3}]}),1,
    'off-screen action partners do not justify fading architecture');
  assert.equal(opacity({...photographed,actor:{x:1.3,y:0,z:.2}}),1,
    'an off-screen actor cannot request invisible-scene compensation');
  assert.equal(opacity({...photographed,bounds:{minX:.82,maxX:.96,minY:-.2,maxY:.1}}),1,
    'a decorative edge must stay solid');
  assert.equal(opacity({...photographed,coverage:NaN}),1,
    'invalid video geometry fails closed');
  const original=fs.readFileSync(path.join(ROOT,
    'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(original,/observedPortraitActionBackdropOpacity\(\{/);
  assert.match(original,/decorativeBackdropSoftened:softByBackdrop/);
  assert.match(original,/other\.softByBackdrop/);
  assert.match(original,/!projectedActorFront &&\s*rayContactCount===0/);
});
