'use strict';
// Safety contract for PRESENT camera-responsive non-colliding clockwork scenery.
// This is not a gameplay-video judgment or LOOKS/FEELS/PLAYS Gauntlet vote.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/world.mjs'), 'utf8');

// The actual shipped Three.js world is a browser ESM module. Resolve only its
// browser import URLs to the installed Node modules; never stub the world or
// invent the geometry being inspected. The previous regression referenced an
// undefined "loaded" promise and never exercised the renderer in CI.
const ROOT = path.resolve(__dirname, '../..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'tower-clockwork-sightline-'));
const threeURL = pathToFileURL(path.join(ROOT, 'node_modules/three/build/three.module.js')).href;
const importedWorld = path.join(scratch, 'world.mjs');
const importURLs = {
  "'/tower/vendor/three.module.js'": threeURL,
  "'./coordinates.mjs'": pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/coordinates.mjs')).href,
  "'./world-surface.mjs'": pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/world-surface.mjs')).href,
  "'./scene-hierarchy.mjs'": pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/scene-hierarchy.mjs')).href,
};
let installedWorld = source;
for (const [browserImport, nativeURL] of Object.entries(importURLs)) {
  assert.ok(installedWorld.includes(browserImport),
    'shipped world import has moved: ' + browserImport);
  installedWorld = installedWorld.replace(browserImport, JSON.stringify(nativeURL));
}
fs.writeFileSync(importedWorld, installedWorld);
const loaded = Promise.all([
  import(threeURL),
  import(pathToFileURL(importedWorld).href),
]);
after(() => fs.rmSync(scratch, { recursive: true, force: true }));

// Real source-scale floor snapshots: the camera test must construct exactly
// the same 3D objects the browser constructs, not inspect author-side regex.
function sourceFrame(theme, floor) {
  const chunkBaseY = floor * 360000;
  return Object.freeze({
    runToken: 'clockwork-real-world-fixture', floor, theme,
    tick: floor * 100 + 1, lifecycle: 'running',
    worldWidth: 480000, chunkBaseY, chunkHeight: 360000,
    platforms: Object.freeze([]), hazards: Object.freeze([]),
    enemies: Object.freeze([]),
  });
}

// Exercise the actual pure world helper without constructing the WebGL engine
// (world.mjs is browser-imported through the /tower/vendor path).
function helper(name) {
  const at = source.indexOf(`export function ${name}(`);
  assert.ok(at >= 0, `missing actual world helper ${name}`);
  const end = source.indexOf('\n}', at);
  assert.ok(end > at);
  return vm.runInNewContext(
    source.slice(at, end + 2).replace('export ', '') + '; ' + name);
}
function material(name) {
  return { name, opacity:1, transparent:false, depthWrite:true,
    clone() { return material(name + ':owned'); } };
}
function shape(name, shared, nested=[]) {
  return { name, isMesh:true, material:shared, castShadow:true,
    receiveShadow:true, userData:{},
    traverse(fn) { fn(this); for(const node of nested) node.traverse(fn); } };
}
test('only original decorative clock backings yield; live gear and gameplay materials remain owned elsewhere', () => {
  const link = helper('linkClockFaceScenery');
  const copper = material('shared-copper'), dark = material('shared-dark');
  const gear = { name:'CameraResponsiveDecorativeGear', children:[],
    traverse() { throw Error('active rotating gear is not decorative backing'); } };
  const backing = shape('noncolliding-dial',dark);
  const rim = shape('noncolliding-rim',copper);
  const hand = shape('noncolliding-hand',copper);
  const face = { children:[gear,backing,rim,hand] };
  const owned = new Set(), entry = {root:gear, alloy:material('gear-alloy')};
  assert.equal(link(entry,face,owned),2);
  assert.equal(owned.size,2,'shared source materials clone once per clock face');
  assert.notEqual(backing.material,dark);
  assert.notEqual(rim.material,copper);
  assert.equal(rim.material,hand.material);
  assert.equal(dark.opacity,1);assert.equal(copper.transparent,false);
  for(const visual of [backing,rim,hand]){
    assert.equal(visual.castShadow,false);
    assert.equal(visual.receiveShadow,false);
    assert.equal(visual.userData.ambientDetail,true);
    assert.equal(visual.material.transparent,true);
    assert.equal(visual.material.depthWrite,true);
  }
  assert.equal(entry.sceneryMaterials.length,2);
  assert.equal(entry.sceneryMeshes.length,3,
    'real dial/rim/hand meshes remain registered as physical foreground occluders');
  assert.equal(entry.sceneryParent,face);
  assert.equal(entry.sceneryMeshes[0],backing);
  assert.equal(link({root:{}},face,new Set()),0,
    'only a registered rotor may own its own clock-face materials');
  assert.equal(face.children.length,4,'no hidden or deleted gameplay scene geometry');
});
test('matching gear/case opacity clears the real fight corridor and recovers all solid depth on exit', () => {
  const sync = helper('syncClockFaceSightline');
  const entry = {alloy:{opacity:.24},
    sceneryMaterials:[material('backing'),material('rim')]};
  assert.equal(sync(entry),true);
  for(const m of entry.sceneryMaterials){
    assert.equal(m.opacity,.24);
    assert.equal(m.depthWrite,false);
  }
  entry.alloy.opacity=1;
  assert.equal(sync(entry),false);
  for(const m of entry.sceneryMaterials){
    assert.equal(m.opacity,1);
    assert.equal(m.depthWrite,true);
  }
  assert.equal(sync({alloy:{opacity:.2},sceneryMaterials:[]}),false);
});
test('actual original clockwork scene links its backing to the existing authenticated actor/guardian/landing sightline', () => {
  assert.match(source,/linkClockFaceScenery\(foregroundGears\.find\(entry => entry\.root===main\),clock,floorMaterials\)/);
  assert.match(source,/linkClockFaceScenery\(foregroundGears\.find\(entry => entry\.root===g\),root,floorMaterials\)/);
  assert.match(source,/const protectedClockFace=syncClockFaceSightline\(entry\)/);
  assert.match(source,/occludedForegroundClockFaces=clockFacesSoftened/);
  assert.match(source,/entry\.alloy\.opacity\+=\(requiredOpacity-entry\.alloy\.opacity\)\*strength/);
  assert.match(source,/canopyRay\.intersectObject\(entry\.root,true\)/);
  assert.match(source,/for\(const entry of foregroundGears\)/);
  assert.doesNotMatch(source,/for\(const target of snapshot\.enemies/);
  assert.match(source,/floorMaterials\.clear\(\)/,
    'owned clock-face clones must dispose at every floor transition');
});

test('physical head/feet protection is bounded, ignores stale or invalid body geometry', () => {
  const span = helper('observedSilhouetteSpan');
  assert.equal(span(2), 1.64);
  assert.equal(span(30), 3.2);
  for (const invalid of [0, -2, NaN, Infinity, -Infinity])
    assert.equal(span(invalid), 0);
  // The real render path samples present climber and guardian bodies, not
  // predicted jumps or a billboard: these are source-sized world coordinates.
  assert.match(source,/const span=observedSilhouetteSpan\(index===0\?actorHalfHeight:/);
  assert.match(source,/index===1\?guardianHalfHeight:0\)/);
  assert.match(source,/sample===1\?-span:span/);
  assert.match(source,/canopyRay\.intersectObjects\(entry\.sceneryMeshes,false\)/);
  assert.match(source,/entry\.sceneryParent\.updateWorldMatrix\(true,true\)/);
  assert.doesNotMatch(source,/source\.player\.x\s*=/);
});

test('full 3D clockwork boss corridor is clear of giant rim AND 42-unit noncolliding drive rack',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const source=sourceFrame('clockwork',8), unchanged=JSON.stringify(source);
    world.update(source,.016,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    const expected=[
      ['clockwork-monumental-left-shoulder',8.0],
      ['clockwork-lower-left-shoulder',5.7],
      ['clockwork-upper-right-shoulder',5.4],
      ['clockwork-far-shoulder-power-rack',1.65],
    ];
    // Each actual world-owned foreground assembly has a finite width. A
    // center-angle-only check once allowed a giant rim inside the guarded arc.
    // Bound the NEAREST angular edge of the actual shoulder envelope.
    for(const [name,extent] of expected){
      const group=world.group.getObjectByName(name);
      assert.ok(group,'missing original clockwork world geometry: '+name);
      const position=new THREE.Vector3();
      group.getWorldPosition(position);
      const angle=Math.atan2(position.x,position.z);
      const radius=Math.hypot(position.x,position.z);
      assert.ok(radius>18,'retain the visible, physically staged cylindrical shoulder');
      const nearestEdge=Math.abs(angle)-Math.atan2(extent,radius);
      assert.ok(nearestEdge>1.5,name+' still overlaps the ±1.1-radian real guardian corridor: '+nearestEdge);
    }
    const gears=[];
    world.group.traverse(object=>{
      if(object.name==='CameraResponsiveDecorativeGear')gears.push(object);
    });
    assert.equal(gears.length,3,'keep three rotating original decorative machines');
    assert.ok(gears.some(g=>Math.atan2(g.getWorldPosition(new THREE.Vector3()).x,
      g.getWorldPosition(new THREE.Vector3()).z)>2),
      'the upper machine still reads on the opposite architectural flank');
    assert.equal(JSON.stringify(source),unchanged,'world art never changes source state');
    assert.ok(world.diagnostics().meshes+world.diagnostics().shadowCasterMeshes<=100,
      'scene staging must not expand low-tier draw budget');
    world.update(sourceFrame('void',9),.016,1,{quality:'low'});
    assert.equal(world.group.getObjectByName('clockwork-far-shoulder-power-rack'),undefined,
      'no stale foreground machine after real floor-nine transition');
  }finally{world.dispose();}
});

test('portrait world-envelope protects actor even if a huge clock centre is outside the image', () => {
  const envelope=helper('observedPortraitDecorativeEnvelope');
  const current={aspect:390/844, minX:-1.2,maxX:1.15,
    minY:-1.1,maxY:.98,nearestDepth:6,actorDepth:16};
  assert.equal(envelope(current),.14,
    'a foreground rim covering the live phone frame must yield regardless of its centre');
  assert.equal(envelope({...current,minX:-.2,maxX:.22,minY:-.4,maxY:.42}),.36,
    'a partial image intrusion softens without removing the architecture');
  assert.equal(envelope({...current,nearestDepth:18}),1,
    'background decoration behind the source actor remains opaque');
  assert.equal(envelope({...current,aspect:960/600}),1,
    'wide desktop staging must not inherit the portrait clearing');
  assert.equal(envelope({...current,minX:1.2,maxX:4}),1,
    'fully offscreen architecture retains its original material');
  assert.equal(envelope({...current,minX:NaN}),1);
});

test('actual floor-eight power rack owns post-batch camera-responsive materials, not hazard materials',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const frame=sourceFrame('clockwork',8),unchanged=JSON.stringify(frame);
    world.update(frame,.016,0,{quality:'low'});
    const rack=world.group.getObjectByName('clockwork-far-shoulder-power-rack');
    assert.ok(rack,'retained rack scene group must remain present after rigid batching');
    const names=new Set(),pieces=[];
    rack.traverse(object=>{
      if(!object.isMesh)return;
      pieces.push(object);
      names.add(object.material?.name);
      assert.equal(object.material.transparent,true);
      assert.equal(object.material.depthWrite,true);
    });
    assert.ok(pieces.length>=2,'solid spine and rack teeth remain visible');
    assert.ok([...names].every(name=>name==='SightlineResponsivePowerRack'),
      'decorative rack materials are private, not shared with active hazards');
    const stats=world.diagnostics();
    assert.equal(stats.decorativeSightlineRacks,1);
    assert.equal(stats.decorativeSightlineGears,3,'all rotating original gears survive');
    assert.equal(JSON.stringify(frame),unchanged,'camera art never edits authority');
    world.update(sourceFrame('void',9),.016,1,{quality:'low'});
    assert.equal(world.group.getObjectByName('clockwork-far-shoulder-power-rack'),undefined,
      'owned rack and its materials retire at real floor-nine transition');
  } finally {world.dispose();}
});


test('camera forensic evidence is bounded to the actual four original decorative assemblies and source tick',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const source=sourceFrame('clockwork',8), immutable=JSON.stringify(source);
    world.update(source,.016,0,{quality:'low'});
    const camera=new THREE.PerspectiveCamera(54,390/844,.1,300);
    camera.position.set(0,21,57);
    camera.lookAt(0,18,0);
    const actor=new THREE.Vector3(0,12,25);
    const guardian=new THREE.Vector3(0,20,25);
    const landing=new THREE.Vector3(0,24,25);
    assert.equal(world.diagnostics().decorativeOcclusionEvidence.length,0,
      'no observer has yet supplied an actual view camera');
    const result=world.protectRouteSightlines(camera,actor,guardian,landing,.016,{},1,2);
    const evidence=world.diagnostics().decorativeOcclusionEvidence;
    assert.equal(result.total,4);
    assert.equal(evidence.length,4,'three original clock groups plus one power rack');
    assert.equal(evidence.filter(s=>s.kind==='decorative-rack').length,1);
    assert.equal(evidence.filter(s=>s.kind==='decorative-clock').length,3);
    for(const s of evidence){
      assert.equal(s.sourceTick,source.tick);
      assert.equal(typeof s.name,'string');
      assert.ok(s.name.startsWith('clockwork-'));
      assert.ok(s.screenCoverage>=0 && s.screenCoverage<=1);
      assert.ok(s.sourceActorDepth>0 && Number.isFinite(s.sourceActorDepth));
      assert.ok(s.intendedAlpha>=0 && s.intendedAlpha<=1);
      assert.ok(s.renderedAlpha>=0 && s.renderedAlpha<=1);
      assert.ok(Number.isSafeInteger(s.rayContactCount) && s.rayContactCount>=0);
      assert.ok(typeof s.inFrontOfActor==='boolean');
      assert.ok(typeof s.nearPlaneCrossing==='boolean');
    }
    assert.equal(JSON.stringify(source),immutable,'camera diagnostics cannot rewrite authority');
    // Repeating the same camera sampling cannot accumulate stale tick reports.
    world.protectRouteSightlines(camera,actor,guardian,landing,.016,{},1,2);
    assert.equal(world.diagnostics().decorativeOcclusionEvidence.length,4);
    world.update(sourceFrame('void',9),.016,1,{quality:'low'});
    world.protectRouteSightlines(camera,actor,guardian,landing,.016,{},1,2);
    assert.deepEqual(world.diagnostics().decorativeOcclusionEvidence,[],
      'former floor-eight camera evidence must disappear on real floor-nine rebuild');
  } finally {world.dispose();}
});

test('recording harness preserves clean gameplay video while saving the separate camera-sidecar',()=>{
  const capture=fs.readFileSync(path.join(ROOT,'tests/browser/tower-live-motion.spec.cjs'),'utf8');
  assert.match(capture,/observedDecorativeOcclusion: Array\.isArray\(d\.world\?\.decorativeOcclusionEvidence\)/);
  assert.match(capture,/camera-occlusion-forensics\.json/);
  assert.match(capture,/originalGameplayVideoUnmodified:true/);
  assert.match(capture,/videoClockCalibration:'NOT EVALUATED'/);
  assert.match(capture,/await video\.saveAs\(path\.join\(dir, 'live\.webm'\)\)/);
});

test('overlapping real foreground clock/rack assemblies share a single bounded portrait alpha budget',()=>{
  const overlap=helper('observedScreenEnvelopeOverlap');
  const budget=helper('observedStackedDecorativeOpacity');
  const a={minX:-.6,maxX:.5,minY:-.8,maxY:.6};
  const b={minX:-.3,maxX:.8,minY:-.4,maxY:.9};
  const outside={minX:.89,maxX:1.3,minY:-.4,maxY:.2};
  assert.equal(overlap(a,b),true);
  assert.equal(overlap(a,outside),false);
  assert.equal(overlap(a,{minX:Infinity,maxX:1,minY:-1,maxY:1}),false);
  const solo=budget(.24,4,0),stacked=budget(.24,4,2);
  assert.ok(stacked<solo,'overlapping assemblies cannot each retain full alpha');
  assert.ok(Math.abs(1-Math.pow(1-stacked,12)-.24)<1e-10,
    'three overlapping four-layer scenic assemblies retain one composite budget');
  assert.equal(solo,helper('observedLayeredSceneryOpacity')(.24,4),
    'solo clock retains its original appearance');
  assert.equal(budget(.24,4,4),1,'invalid number of entries never silently softens');
  assert.match(source,/pendingDecorativeOpacity\.push/);
  assert.match(source,/observedScreenEnvelopeOverlap\(screenBounds,other\.screenBounds\)/);
  assert.match(source,/stackedForegroundCompanions:companions/);
  assert.match(source,/const protectedClockFace=syncClockFaceSightline\(entry\)/);
  assert.match(source,/entry\.alloy\.opacity\+=\(requiredOpacity-entry\.alloy\.opacity\)\*strength/);
});

test('original clockwork split rings preserve actual ray-clear structural windows',async()=>{
  const [THREE]=await loaded;
  const apertures=helper('observedClockworkRimApertures')();
  const opening=.62,step=Math.PI/2;
  assert.equal(apertures.length,4);
  const fragments=apertures.map((section,index)=>{
    assert.ok(Math.abs(section.start-(index*step+opening*.5))<1e-9);
    assert.ok(Math.abs(section.arc-(step-opening))<1e-9);
    assert.ok(section.arc<step,'monumental ring must have REAL openings');
    const geometry=new THREE.TorusGeometry(6.4,.45,7,20,section.arc);
    const segment=new THREE.Mesh(geometry,
      new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
    segment.rotation.z=section.start;
    segment.updateMatrixWorld(true);
    return segment;
  });
  const ray=new THREE.Raycaster();
  const countHits=angle=>{
    ray.set(new THREE.Vector3(Math.cos(angle)*6.4,
      Math.sin(angle)*6.4,5),new THREE.Vector3(0,0,-1));
    ray.near=0;ray.far=10;
    return ray.intersectObjects(fragments,false).length;
  };
  try{
    for(let index=0;index<4;index++){
      assert.equal(countHits(index*step),0,
        'a real ray through each gap must miss ALL remaining 3D segments');
      assert.ok(countHits(index*step+step*.5)>0,
        'interrupted rim must still contain physically present metal arcs');
    }
    assert.ok(fragments.every(mesh=>mesh.geometry.parameters.arc<Math.PI/2));
    assert.ok(source.includes('openClockRim(clock,6.4,.45,materials.copper,.9)'));
    assert.ok(source.includes('openClockRim(clock,5.8,.11,materials.edge,1)'));
    assert.ok(!source.includes('new THREE.TorusGeometry(6.4,.45,8,48)'));
    assert.ok(source.includes('foregroundRacks.push(rackEntry)'),
      'decorative drive architecture remains');
    assert.ok(source.includes('const main=gear(clock,4.8'),
      'the original animated gear remains part of the game');
  }finally{
    for(const part of fragments){part.geometry.dispose();part.material.dispose();}
  }
});


test('real original decorative rotors expose negative-space gear faces instead of broad metal discs',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const frame=sourceFrame('clockwork',8),original=JSON.stringify(frame);
    world.update(frame,.016,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    const rotors=[];
    world.group.traverse(o=>{
      if(o.name==='CameraResponsiveDecorativeGear')rotors.push(o);
    });
    assert.equal(rotors.length,3,'keep all three genuine rotating clockwork machines');
    for(const [index,radius] of [4.8,3.6,3.1].entries()){
      const rotor=rotors[index];
      // finishBatches() correctly merges the original ExtrudeGeometry and
      // alloy arms into the final real rendered, raycastable BufferGeometry.
      // Inspect that CURRENT mesh, never detached authoring geometry.
      const face=rotor.children.find(o=>o.isMesh&&
        o.material?.name==='SightlineResponsiveDecorativeAlloy');
      assert.ok(face&&face.geometry?.type==='BufferGeometry',
        'raycast the post-batch physical rotor, including its retained arms');
      const cast=(fraction)=>{
        const angle=Math.PI/8;
        const origin=face.localToWorld(new THREE.Vector3(
          Math.sin(angle)*radius*fraction,Math.cos(angle)*radius*fraction,2));
        const direction=new THREE.Vector3(0,0,-1).transformDirection(face.matrixWorld);
        return new THREE.Raycaster(origin,direction,0,6)
          .intersectObject(face,false).length;
      };
      assert.equal(cast(.60),0,
        'a ray through the between-spoke region must actually cross empty space, not a solid disc');
      assert.ok(cast(.82)>0,
        'the retained toothed load ring must remain physically present');
    }
    assert.equal(JSON.stringify(frame),original,'decorative cutaways never mutate gameplay');
  }finally{world.dispose();}
});

test('real clockwork power rack has a source-independent transparent structural middle',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const frame=sourceFrame('clockwork',8),original=JSON.stringify(frame);
    world.update(frame,.016,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    const rack=world.group.getObjectByName('clockwork-far-shoulder-power-rack');
    assert.ok(rack,'the actual tall decorative mechanism is still present');
    // This rack also runs through batchRigid(). The original side-rail
    // instances are intentionally retired, leaving two material-owned
    // BUFFER meshes submitted by the real world scene.
    const rendered=[];
    rack.traverse(o=>{if(o.isMesh)rendered.push(o);});
    assert.equal(rendered.length,2,
      'retain exactly two bounded real draws: structural rails and rack teeth');
    assert.ok(rendered.every(o=>o.geometry?.type==='BufferGeometry'&&
      o.material?.name==='SightlineResponsivePowerRack'),
      'test the actual rigid-batched geometry and owned materials');
    const cast=(y)=>{
      const origin=rack.localToWorld(new THREE.Vector3(0,y,4));
      const direction=new THREE.Vector3(0,0,-1).transformDirection(rack.matrixWorld);
      return new THREE.Raycaster(origin,direction,0,9)
        .intersectObject(rack,true).length;
    };
    assert.equal(cast(0),0,
      'the actual rendered 42-unit structure must have daylight between rack teeth');
    assert.ok(cast(.4)>0,'physical rack teeth remain at their real source-designed pitch');
    assert.equal(JSON.stringify(frame),original);
    world.update(sourceFrame('void',9),.016,1,{quality:'low'});
    assert.equal(world.group.getObjectByName('clockwork-far-shoulder-power-rack'),undefined,
      'decorative rack retires cleanly after authentic progression');
  }finally{world.dispose();}
});
