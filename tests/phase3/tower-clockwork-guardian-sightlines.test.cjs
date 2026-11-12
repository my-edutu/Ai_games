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
  "'./mesh-provenance.mjs'": pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/mesh-provenance.mjs')).href,
  "'./guardian-transmission-layout.mjs'": pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs')).href,
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
  // Match the top-level closure, not a destructured parameter's closing brace.
  // A literal backslash-n previously swallowed the executable declaration.
  const end = source.indexOf('\n}\n', at);
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
  assert.match(source,/canopyRay\.intersectObject\(entry\.root,true,canopyHits\)/);
  assert.match(source,/canopyRay\.ray\.intersectsBox\(decoratedBounds\)/,
    'conservative bounds must guard the costly post-batch triangle queries');
  assert.match(source,/canopyHits\.length=0/,
    'ray hit arrays are retained instead of allocated on each source silhouette sample');
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
  assert.match(source,/canopyRay\.intersectObjects\(\s*entry\.sceneryMeshes,false,canopyHits\)/);
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

// This probes the real assembled Three.js groups rather than an authoring regex.
// It constrains the deliberate architectural negative space around the upper
// guardian battle; it is still NOT a substitute for matched full-motion film.
test('actual clockwork scene gives upper-cap action a physically open vertical band',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const source=sourceFrame('clockwork',8), unchanged=JSON.stringify(source);
    world.update(source,.016,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    const main=world.group.getObjectByName('clockwork-monumental-left-shoulder');
    const lower=world.group.getObjectByName('clockwork-lower-left-shoulder');
    const upper=world.group.getObjectByName('clockwork-upper-right-shoulder');
    const rack=world.group.getObjectByName('clockwork-far-shoulder-power-rack');
    for(const [name,object] of [['main',main],['lower',lower],['upper',upper],['rack',rack]])
      assert.ok(object,'missing physical original '+name+' clockwork');
    const boundsOf=object=>new THREE.Box3().setFromObject(object);
    const drive=boundsOf(main), clutch=boundsOf(lower), raised=boundsOf(upper), spine=boundsOf(rack);
    assert.ok([drive,clutch,raised,spine].every(box=>!box.isEmpty()),
      'inspect actual submitted 3D mechanism geometry, not empty proxy groups');
    // The actual original candidate portrait film at 15.2 s showed the ring
    // dominating source-live combat despite the previous <24 m drive bound.
    // Verify the entire Three.js case, turning wheel, low clutch and 42 m
    // rack physically live BELOW the first ascent action, not merely a tiny
    // rim center outside the guardian's collision band.
    for(const [name,box] of [['main',drive],['low clutch',clutch],['rack',spine]])
      assert.ok(box.max.y<8,
        name+' must clear the full upper-cap silhouette and gateway airspace: '+box.max.y);
    // The source-pinned portrait film at native 15s proved that merely
    // positioning the third rotor above y=28 still lets its steel hoop/case
    // physically occupy the guardian and grounded-gateway action band.
    // Enforce the real post-batch 3D bounds of the entire decorated rotor,
    // including its open clock case, above the cap action (approximately
    // 35-44 source world units), not just the rotor group origin.
    assert.ok(raised.min.y>45,
      'real upper clockwork assembly still spans the source guardian encounter: '+raised.min.y);
    const raisedHeight=raised.max.y-raised.min.y;
    assert.ok(raisedHeight>2 && raisedHeight<13,
      'keep a credible but bounded original third-rotor silhouette: '+raisedHeight);
    // Physical source-film ray evidence identifies solid post-batch metal
    // 'rigid-material-batch' triangles near y=37..42 during live guardian
    // combat, while the decorative registry reports little coverage. The
    // upper clock CASE is merged into rigid static meshes, so inspecting only
    // the animated rotor group would silently miss its actual opaque frame.
    // Verify production Three.js *submitted* geometry by its owned, named
    // decorative material; avoid testing a removed pre-batch authoring node.
    const renderedClockCases=[];
    world.group.traverse(object=>{
      if (!object.isMesh || object.material?.name!=='SightlineResponsiveClockFace')
        return;
      const box=new THREE.Box3().setFromObject(object);
      assert.ok(!box.isEmpty(),'actual rendered decorative clock case must have triangles');
      renderedClockCases.push(box);
      assert.ok(box.max.y<28 || box.min.y>45,
        'opaque post-batch decorative clock frame overlaps source guardian band: ['+
        box.min.y+', '+box.max.y+']');
    });
    assert.ok(renderedClockCases.length>=3,
      'rendered full clock CASES must survive static material batching');
    assert.ok(renderedClockCases.some(box=>box.min.y>45),
      'the physically rendered upper satellite backing must be above the live cap');
    const rotors=[];
    world.group.traverse(node=>{
      if(node.name==='CameraResponsiveDecorativeGear')rotors.push(node);
    });
    assert.equal(rotors.length,3,
      'all three genuinely rotating original decorative machines still exist');
    assert.equal(JSON.stringify(source),unchanged,
      'physically clearer world art cannot alter fixed-step gameplay authority');
    assert.ok(world.diagnostics().meshes+world.diagnostics().shadowCasterMeshes<=100,
      'do not trade guardian visibility for a new phone render-budget regression');
    world.update(sourceFrame('void',9),.016,1,{quality:'low'});
    assert.equal(world.group.getObjectByName('clockwork-monumental-left-shoulder'),undefined,
      'former floor-eight hardware must retire when the actual floor-nine world loads');
  }finally{world.dispose();}
});

// Source-pinned original candidate danger film 42873903171 shows the dark
// pressure-well drum and full-height geological slabs overwhelming genuine
// guardian and crossing action at native portrait seconds 14-23. Require REAL
// post-batch Three geometry to leave a window through the visual core without
// altering snapshots, floor-nine content or the other four biome vessels.
test('clockwork central pressure well and geological shoulders are open at live guardian elevation', async () => {
  const [THREE,{createTowerWorld}]=await loaded;
  const {sourceTriangleOwner}=await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/mesh-provenance.mjs')).href);
  const world=createTowerWorld();
  try {
    const input=sourceFrame('clockwork',8),unchanged=JSON.stringify(input);
    world.update(input,.016,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    let originalWellParts=0,originalGeologyParts=0;
    world.group.traverse(node=>{
      if(!node.isMesh)return;
      for(const piece of node.geometry?.userData?.originalTriangleOwners||[]){
        if(piece.authoringPath?.includes('ClockworkOpenCentralPressureWell'))
          originalWellParts++;
        if(piece.authoringPath?.includes('ClockworkOpenGeologicalSupportTies'))
          originalGeologyParts++;
      }
    });
    assert.ok(originalWellParts>=3,
      'original central-pressure well geometry must survive rigid batching');
    const ray=new THREE.Raycaster(new THREE.Vector3(0,20,32),
      new THREE.Vector3(0,0,-1),0,70);
    const intrusions=ray.intersectObjects(world.group.children,true).filter(hit=>{
      const owner=sourceTriangleOwner(hit.object.geometry,hit.faceIndex);
      return owner?.authoringPath?.includes('ClockworkOpenCentralPressureWell') ||
        owner?.authoringPath?.includes('ClockworkPressureWellRootDrum') ||
        owner?.authoringPath?.includes('ClockworkPressureWellCrownDrum');
    });
    assert.equal(intrusions.length,0,
      'real 20m action sightline must pass the open pressure well, not a fake transparent drum');
    assert.equal(JSON.stringify(input),unchanged,
      'opening noncolliding art must not mutate authoritative gameplay');
    const metrics=world.diagnostics();
    assert.ok(metrics.meshes+metrics.shadowCasterMeshes<=100,
      'new pressure-well sculpture must respect existing low-tier draw budget');
    world.update(sourceFrame('void',9),.016,1,{quality:'low'});
    assert.equal(JSON.stringify(input),unchanged,
      'floor-nine rebuild must not alter prior source frame');
  } finally {world.dispose();}
});

// Original normal-speed portrait footage at a0146896 still shows a solid
// pylon across live guardian combat (15-17s). A rotated solid tower is not a
// solution: prove real authored triangles leave a central human-scale window
// through every clockwork structural buttress at the upper-cap action height.
// This samples the actual assembled, batched Three.js world; not a regex or
// display-only overlay. Final film quality still requires human inspection.
test('clockwork guardian pylon reconstruction keeps physically open central bays without touching authority', async () => {
  const [THREE,{createTowerWorld}]=await loaded;
  const {sourceTriangleOwner}=await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/mesh-provenance.mjs')).href);
  const world=createTowerWorld();
  try {
    const frame=sourceFrame('clockwork',8),immutable=JSON.stringify(frame);
    world.update(frame,.016,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    let authoredPylonParts=0;
    world.group.traverse(node=>{
      if(!node.isMesh)return;
      for(const part of node.geometry?.userData?.originalTriangleOwners||[])
        if(part.authoringPath?.includes('tapered-structural-pylon'))
          authoredPylonParts++;
    });
    assert.ok(authoredPylonParts>=12,
      'three full structural buttresses must remain assembled and physically authored');
    const pylons=[[-.66,16.8],[1.40,16.65],[-.18,8.6]];
    for(const [angle,radius] of pylons) {
      const outward=new THREE.Vector3(Math.sin(angle),0,Math.cos(angle));
      // A 2m sightline from in front of each real buttress must pass through
      // its former central solid shaft at the actual 20m cap-combat level.
      const origin=new THREE.Vector3(outward.x*(radius+8),20,
        outward.z*(radius+8));
      const ray=new THREE.Raycaster(origin,outward.clone().negate(),0,13);
      const hits=ray.intersectObjects(world.group.children,true);
      const solidCenter=hits.filter(hit=>{
        const owner=sourceTriangleOwner(hit.object.geometry,hit.faceIndex);
        return owner?.authoringPath?.includes('tapered-structural-pylon');
      });
      assert.equal(solidCenter.length,0,
        'physical structural obstruction persists at cap y=20 for buttress angle '+angle);
    }
    assert.equal(JSON.stringify(frame),immutable,'opening architecture cannot mutate source gameplay');
    const diagnostics=world.diagnostics();
    assert.ok(diagnostics.meshes+diagnostics.shadowCasterMeshes<=100,
      'open structural supports must remain within actual low-tier drawing budget');
    world.update(sourceFrame('void',9),.016,1,{quality:'low'});
    assert.equal(JSON.stringify(frame),immutable);
  }finally {world.dispose();}
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
      assert.ok(s.name.length>0&&!s.name.includes('undefined'),
        'real source assembly identity is retained even when its parent is batched');
      assert.ok(s.screenCoverage>=0 && s.screenCoverage<=1);
      assert.ok(s.sourceActorDepth>0 && Number.isFinite(s.sourceActorDepth));
      assert.ok(s.intendedAlpha>=0 && s.intendedAlpha<=1);
      assert.ok(s.renderedAlpha>=0 && s.renderedAlpha<=1);
      assert.ok(Number.isSafeInteger(s.rayContactCount) && s.rayContactCount>=0);
      assert.ok(Number.isSafeInteger(s.rayBoundsRejects) && s.rayBoundsRejects>=0);
      assert.ok(Number.isSafeInteger(s.rayNarrowphaseChecks) && s.rayNarrowphaseChecks>=0);
      assert.equal(s.raySamples,s.rayBoundsRejects+s.rayNarrowphaseChecks,
        'each present body ray chooses exactly one bounded geometric path');
      assert.ok(s.raySamples<=8,'four physical source targets have at most eight silhouette rays');
      assert.ok(s.rayContactCount<=s.rayNarrowphaseChecks,
        'broadphase must never claim an untested triangle contact');
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
  assert.match(capture,/const originalWebMPath = path\.join\(dir, 'live\.webm'\)/);
  assert.match(capture,/if \(video\) await video\.saveAs\(originalWebMPath\)/);
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

test('all three live clockwork rotors keep the COMPLETE centre aperture clear at every spoke angle',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const snapshot=sourceFrame('clockwork',8),original=JSON.stringify(snapshot);
    world.update(snapshot,.016,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    const rotors=[];
    world.group.traverse(object=>{
      if(object.name==='CameraResponsiveDecorativeGear')rotors.push(object);
    });
    assert.equal(rotors.length,3,'retain all three physical animated clock mechanisms');
    for(const [index,radius] of [4.8,3.6,3.1].entries()){
      const rotor=rotors[index];
      const mesh=rotor.children.find(object=>object.isMesh&&
        object.material?.name==='SightlineResponsiveDecorativeAlloy');
      assert.ok(mesh,'test the real post-batch running gear geometry');
      const rendered=rotor.children.filter(object=>object.isMesh);
      assert.ok(rendered.length>0,'the ring is still drawn in genuine 3D');
      for(let angle=0;angle<Math.PI;angle+=Math.PI/8){
        for(const fraction of [.35,.60]){
          const origin=mesh.localToWorld(new THREE.Vector3(
            Math.cos(angle)*radius*fraction,
            Math.sin(angle)*radius*fraction,2));
          const direction=new THREE.Vector3(0,0,-1)
            .transformDirection(mesh.matrixWorld);
          const hits=new THREE.Raycaster(origin,direction,0,6)
            .intersectObjects(rendered,false);
          assert.equal(hits.length,0,
            'every inner spoke angle must admit actual world daylight: '+
            index+'/'+angle+'/'+fraction);
        }
      }
    }
    assert.equal(JSON.stringify(snapshot),original,
      'decorative clockwork never changes source-owned combat/progression');
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


test('real Three.js clockwork restages the decorative monument below the guardian lane',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const world=createTowerWorld();
  try{
    const frame=sourceFrame('clockwork',8),unchanged=JSON.stringify(frame);
    world.update(frame,.016,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    const named=name=>{
      const object=world.group.getObjectByName(name);
      assert.ok(object,'real floor-eight world has '+name);
      return object;
    };
    const main=named('clockwork-monumental-left-shoulder');
    const lower=named('clockwork-lower-left-shoulder');
    const upper=named('clockwork-upper-right-shoulder');
    const rack=named('clockwork-far-shoulder-power-rack');
    // Source-pinned 390x844 film retained a vast ring at second 15 even
    // after the previous smaller height adjustment. Test real rendered Three
    // bounds, not only authored origin positions or a favorable camera ray.
    const floorY=main.parent.getWorldPosition(new THREE.Vector3()).y;
    const actualTop=object=>{
      const bounds=new THREE.Box3().setFromObject(object);
      assert.ok(!bounds.isEmpty(),'retain REAL geometry for '+object.name);
      return bounds.max.y-floorY;
    };
    assert.ok(actualTop(main)<-12 && actualTop(lower)<-24 &&
      actualTop(rack)<-12,
      'full lower/middle/rack 3D machinery must remain physically beneath the genuine guardian climb');
    assert.ok(main.scale.x<=.76&&main.scale.z<=.76,
      'the monumental frame retains the bounded original footprint');
    assert.ok(Math.abs(Math.atan2(main.position.x,main.position.z)-
      Math.atan2(rack.position.x,rack.position.z))>=.5,
      'the clock and rack must not form a single opaque angular wall');
    assert.ok(lower.position.y<main.position.y &&
      upper.position.y>main.position.y+10 && actualTop(upper)>25,
      'low/middle/high clockwork silhouette destinations remain distinct');
    let rotors=0;
    world.group.traverse(object=>{
      if(object.name==='CameraResponsiveDecorativeGear')rotors++;
    });
    assert.equal(rotors,3,'retain all three true animated 3D clock mechanisms');
    assert.equal(world.diagnostics().decorativeSightlineRacks,1,
      'the source-independent rack keeps its original visibility contract');
    assert.equal(JSON.stringify(frame),unchanged,
      'decorative geometry cannot rewrite source-owned combat/progression');
    world.update(sourceFrame('void',9),.016,1,{quality:'low'});
    assert.equal(world.group.getObjectByName('clockwork-monumental-left-shoulder'),undefined);
    assert.equal(world.group.getObjectByName('clockwork-far-shoulder-power-rack'),undefined);
  }finally{world.dispose();}
});


test('original submitted clockwork triangles retain exact bounded source ownership after static batching',async()=>{
  const [, { createTowerWorld }] = await loaded;
  const { sourceTriangleOwner } = await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/mesh-provenance.mjs')).href);
  const world=createTowerWorld();
  const input=sourceFrame('clockwork',8);
  const sourceBefore=JSON.stringify(input);
  let inspected=0, clockRimFaces=0, clockCaseFaces=0;
  try {
    world.update(input,.016,0,{quality:'low'});
    world.group.traverse(object=>{
      if(!object.isMesh||object.name!=='rigid-material-batch')return;
      const geometry=object.geometry;
      const owners=geometry?.userData?.originalTriangleOwners;
      assert.ok(Array.isArray(owners)&&owners.length>0,
        'all submitted static batches must carry bounded per-piece original provenance');
      const attribute=geometry.attributes.position;
      const submittedVertices=geometry.index?.count ?? attribute.count;
      assert.equal(submittedVertices%3,0,'submitted triangles must be complete');
      if(geometry.index){
        // Indexed rigid GPU buffers reuse source vertices. Face ownership
        // remains keyed to the emitted triangle ordinal, not vertex count.
        for(let k=0;k<geometry.index.count;k++){
          const vertex=geometry.index.getX(k);
          assert.ok(Number.isSafeInteger(vertex) && vertex>=0 && vertex<attribute.count,
            'every actual submitted GPU triangle corner must reference a real vertex');
        }
      }
      let cursor=0;
      for(const owner of owners){
        assert.equal(owner.startFace,cursor,'no gaps, overlaps or guessed face offsets');
        assert.ok(Number.isSafeInteger(owner.endFace)&&owner.endFace>cursor,
          'each authored piece owns genuine submitted triangles');
        assert.ok(Array.isArray(owner.authoringPath)&&owner.authoringPath.length,
          'preserve a real authored mesh or structural parent name');
        const first=sourceTriangleOwner(geometry,owner.startFace);
        const last=sourceTriangleOwner(geometry,owner.endFace-1);
        assert.equal(first.partFaceIndex,0,'mapped first triangle belongs to first authored face');
        assert.equal(last.partFaceIndex,owner.endFace-owner.startFace-1,
          'mapped last triangle remains in the same original source piece');
        assert.equal(first.authoringGeometry,owner.authoringGeometry);
        assert.deepEqual(first.authoringPath,owner.authoringPath);
        if(owner.authoringPath.includes('clockwork-open-rim-fragment'))
          clockRimFaces+=owner.endFace-owner.startFace;
        if(owner.authoringPath.some(name=>name.includes('clockwork-upper-right-shoulder')))
          clockCaseFaces+=owner.endFace-owner.startFace;
        cursor=owner.endFace;
      }
      assert.equal(cursor,submittedVertices/3,'cover the whole actual submitted triangle buffer');
      assert.equal(sourceTriangleOwner(geometry,cursor),null,'out-of-range face must not invent ownership');
      inspected++;
    });
    assert.ok(inspected>5,'inspect genuinely merged tower architecture, not a synthetic object');
    assert.ok(clockRimFaces>100,'physical decorative main ring must retain original triangle identity');
    assert.ok(clockCaseFaces>50,'physical upper case must retain its authored ownership');
    assert.equal(JSON.stringify(input),sourceBefore,'instrumentation never mutates game snapshots');
    world.update(sourceFrame('void',9),.016,1,{quality:'low'});
    let oldClockFace=false;
    world.group.traverse(object=>{
      if(object.geometry?.userData?.originalTriangleOwners?.some(entry=>
        entry.authoringPath.includes('clockwork-open-rim-fragment')))oldClockFace=true;
    });
    assert.equal(oldClockFace,false,'floor-nine rebuild must release prior floor mesh owners');
  }finally{world.dispose();}
});

// Source-pinned exact 7d982af1 portrait danger WebM at ~16-22s shows
// enormous foreground bronze clockwork and cage posts obscuring the real
// guardian and climber. A central straight ray alone cannot detect the TWO
// full-height near-corner posts that cut across the fighters. Inspect the
// actual post-batch source-owned triangle faces at the tangential edges.
test('living floor-eight guardian gallery has no front-column curtain at actor-height while retaining rear load paths', async () => {
  const [THREE,{createTowerWorld}]=await loaded;
  const {sourceTriangleOwner}=await import(pathToFileURL(path.join(ROOT,
    'public/infinite-tower-climb/visuals/mesh-provenance.mjs')).href);
  const world=createTowerWorld();
  try {
    const frame=sourceFrame('clockwork',8),immutable=JSON.stringify(frame);
    world.update(frame,.016,0,{quality:'low'});
    world.group.updateWorldMatrix(true,true);
    const pylons=[
      {angle:-.66,radius:16.8,halfWidth:4.9*.70},
      {angle:1.40,radius:16.65,halfWidth:5.25*.70},
      {angle:-.18,radius:8.6,halfWidth:5.5*.70},
    ];
    const front=(hit)=>{
      const owner=sourceTriangleOwner(hit.object.geometry,hit.faceIndex);
      return owner?.authoringPath?.includes('ClockworkOpenButtressFourCornerPosts');
    };
    for(const {angle,radius,halfWidth} of pylons) {
      const outward=new THREE.Vector3(Math.sin(angle),0,Math.cos(angle));
      const right=new THREE.Vector3(Math.cos(angle),0,-Math.sin(angle));
      for(const side of [-1,1]){
        const origin=outward.clone().multiplyScalar(radius+8)
          .addScaledVector(right,side*halfWidth);
        origin.y=20;
        const direction=outward.clone().negate();
        const nearHits=new THREE.Raycaster(origin,direction,0,9)
          .intersectObjects(world.group.children,true).filter(front);
        assert.equal(nearHits.length,0,
          'no front full-height buttress over genuine live duel at bearing '+angle+' side '+side);
        // Those two complete BACK posts continue to hold the physical crown.
        const allHits=new THREE.Raycaster(origin,direction,0,17)
          .intersectObjects(world.group.children,true).filter(front);
        assert.ok(allHits.length>=1,
          'rear stone load path must survive each open-air near-side bay');
      }
    }
    const groups=['clockwork-monumental-left-shoulder',
      'clockwork-lower-left-shoulder','clockwork-far-shoulder-power-rack'];
    for(const name of groups){
      const object=world.group.getObjectByName(name);
      assert.ok(object,'retain the original rotating clockwork identity: '+name);
      const box=new THREE.Box3().setFromObject(object);
      assert.ok(!box.isEmpty()&&box.max.y < -20,
        'the full non-colliding bronze gear/case must be physically below the action band: '+name+': '+box.max.y);
    }
    assert.equal(JSON.stringify(frame),immutable,'visual gallery cannot edit source fixed-step authority');
    assert.ok(world.diagnostics().meshes+world.diagnostics().shadowCasterMeshes<=100,
      'original 390x844 low-tier drawing budget remains a veto');
    world.update(sourceFrame('void',9),.016,1,{quality:'low'});
    assert.equal(world.group.getObjectByName('clockwork-monumental-left-shoulder'),undefined,
      'old floor-eight gallery retires on real floor-nine');
  } finally { world.dispose(); }
});


// Source-locked full guardian exit, not an invented static gallery fixture.
// Inspect the actual assembled THREE geometry and the full real HP-dependent
// travel of BOTH weights. The source before/after must remain immutable and
// no full-height foreground winch is allowed to re-occlude the skinned duel.
test('physical floor-eight gate keeps both HP-driven counterweights ABOVE the live fight through earned opening and Floor 9 cleanup',async()=>{
  const [THREE,{createTowerWorld}]=await loaded;
  const w=createTowerWorld();
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const guardian={id:'f8:guardian',kind:'guardian',active:true,
    x:180000,y:3240000,halfHeight:18000,health:8,maxHealth:8};
  const initial={...sourceFrame('clockwork',8),
    guardianExitX:cap.x+Math.floor(cap.width*.76),
    guardianSealHeight:140000,platforms:[cap],enemies:[guardian],
    player:{x:180000,y:3240000,halfWidth:9000,halfHeight:18000,
      state:'standing',health:4}};
  const unchanged=JSON.stringify(initial);
  try{
    w.update(initial,.016,0,{quality:'low',reducedMotion:true});
    w.group.updateWorldMatrix(true,true);
    const gate=w.group.getObjectByName('GuardianGateInset');
    assert.ok(gate,'real source-authorized guardian gate is physically constructed');
    const gateOrigin=new THREE.Vector3();
    gate.getWorldPosition(gateOrigin);
    const drums=['GuardianCounterweightLeft','GuardianCounterweightRight'];
    const getWeightBounds=()=>{
      w.group.updateWorldMatrix(true,true);
      return drums.map(name=>{
        const carriage=gate.getObjectByName(name);
        assert.ok(carriage,'real HP-operated winch is present: '+name);
        const weight=carriage.getObjectByName('GuardianSealCounterweight');
        assert.ok(weight?.isMesh,'winch is an actual submitted bronze mass');
        const box=new THREE.Box3().setFromObject(weight);
        assert.ok(!box.isEmpty(),'real geometry must have finite triangles');
        return {lower:box.min.y-gateOrigin.y,upper:box.max.y-gateOrigin.y,
          world:box};
      });
    };
    const before=getWeightBounds();
    assert.ok(before.every(item=>item.lower>5.0),
      'locked door bronze weights must live above both source actors');
    const defeated={...initial,tick:310,
      enemies:[{...guardian,health:0,active:false}]};
    w.update(defeated,.016,1,{quality:'low',reducedMotion:true});
    const after=getWeightBounds();
    // This project rigid-batches all STATIC doorway rails into the actual
    // GPU buffer, retaining the source-owned face ranges, rather than leaving
    // individually named authoring meshes in the submitted scene. Inspect
    // the REAL submitted triangles for both complete sliding guides.
    const guideBottoms=[];
    gate.parent.traverse(item=>{
      const position=item.geometry?.attributes?.position;
      for(const part of item.geometry?.userData?.originalTriangleOwners||[]){
        if(!part.authoringPath?.includes('GuardianSealCounterweightRail'))continue;
        let bottom=Infinity;
        for(let vertex=part.startFace*3;vertex<part.endFace*3;vertex++)
          bottom=Math.min(bottom,position.getY(vertex));
        guideBottoms.push(bottom);
      }
    });
    assert.equal(guideBottoms.length,2,
      'both physically rendered full-height outboard guide rails remain');
    for(let i=0;i<2;i++){
      // Frame and inset doorway share a local Y origin; batched guide
      // vertices are expressed in the frame's real submitted coordinates.
      assert.ok(after[i].lower>=guideBottoms[i]-.02,
        'authentic full-stroke counterweight must remain inside its steel track');
      assert.ok(before[i].lower-after[i].lower>2.2&&
        before[i].lower-after[i].lower<2.5,
        'actual HP0 mechanically lowers each original 3D winch by 2.35m');
      assert.ok(after[i].lower>5,
        'even full source-earned gate opening may not place winch in duel');
    }
    const tension=gate.getObjectByName('GuardianCounterweightTension');
    assert.ok(tension?.isInstancedMesh&&tension.count===2,
      'full-rise counterweight keeps the connected physical cable pairs');
    assert.equal(JSON.stringify(initial),unchanged,
      'physical gallery cannot edit source guardian HP or gateway authority');
    w.update(sourceFrame('void',9),.016,2,{quality:'low'});
    assert.equal(w.group.getObjectByName('GuardianGateInset'),undefined,
      'Floor 9 must retire the previous floor guardian winches');
  }finally{w.dispose();}
});
