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
