'use strict';
// Safety contract for PRESENT camera-responsive non-colliding clockwork scenery.
// This is not a gameplay-video judgment or LOOKS/FEELS/PLAYS Gauntlet vote.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/world.mjs'), 'utf8');

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
  assert.match(source,/linkClockFaceScenery\(main,clock,floorMaterials\)/);
  assert.match(source,/linkClockFaceScenery\(g,root,floorMaterials\)/);
  assert.match(source,/const protectedClockFace=syncClockFaceSightline\(entry\)/);
  assert.match(source,/occludedForegroundClockFaces=clockFacesSoftened/);
  assert.match(source,/entry\.alloy\.opacity\+=\(requiredOpacity-entry\.alloy\.opacity\)\*strength/);
  assert.match(source,/canopyRay\.intersectObject\(entry\.root,true\)/);
  assert.match(source,/for\(const entry of foregroundGears\)/);
  assert.doesNotMatch(source,/for\(const target of snapshot\.enemies/);
  assert.match(source,/floorMaterials\.clear\(\)/,
    'owned clock-face clones must dispose at every floor transition');
});
