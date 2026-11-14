'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = () => ({runToken:'actual-gateway-episode',floor:9,
  theme:'void',lifecycle:'running',tick:486,player:{health:5}});
const original = () => ({runToken:'actual-gateway-episode',floor:9,
  firstWorldRenderTick:475,guardianGateRetained:true,
  submittedFrames:3,visibleSeconds:.34,opticalExitSubmitted:false,
  originalGatewayOpacity:.58,
  originalDeckSurface:{opacity:.91},
  originalGalleryMaterials:[{opacity:.83},{opacity:.66}]});
test('real bronze connected roof and gallery cap the existing incoming Void shaft as ONE threshold',async()=>{
  const {sourceOwnedOriginalArchitectureCoverage:coverage,
    sourceAlignedIncomingShaftOpacity:opacity}=await import(
    '../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
  const s=source(),h=original();
  const before=JSON.stringify([s,h]);
  assert.equal(coverage(s,h),.91);
  assert.ok(Math.abs(opacity(s,h,.8)-.09)<1e-9,
    'shaft cannot overpower still visible original bronze architecture');
  h.originalDeckSurface.opacity=.2;
  h.originalGalleryMaterials.forEach(m=>m.opacity=.15);
  assert.ok(Math.abs(opacity(s,h,.8)-.42)<1e-9,
    'real opened gateway still owns remaining silhouette');
  h.originalGatewayOpacity=.01;
  assert.equal(opacity(s,h,.8),.8,
    'normal reveal resumes as soon as the ORIGINAL architecture departs');
  assert.equal(JSON.parse(before)[0].runToken,s.runToken,
    'no source mutation');
});
test('stale, restarted, dead, unearned, old-floor or expired owners cannot conceal real Floor 9',async()=>{
  const {sourceOwnedOriginalArchitectureCoverage:coverage,
    sourceAlignedIncomingShaftOpacity:opacity}=await import(
    '../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
  const s=source(),h=original();
  for(const [alterS,alterH] of [
    [{...s,runToken:'restart'},h],[{...s,floor:8},h],
    [{...s,theme:'clockwork'},h],
    [{...s,lifecycle:'outcome'},h],
    [{...s,player:{health:0}},h],
    [{...s,tick:550},h],
    [s,{...h,runToken:'other-run'}],
    [s,{...h,opticalExitSubmitted:true}],
    [s,{...h,submittedFrames:30}],
    [s,{...h,visibleSeconds:2.8}],
    [s,{...h,guardianGateRetained:false}]
  ]){
    assert.equal(coverage(alterS,alterH),0);
    assert.equal(opacity(alterS,alterH,.78),.78);
  }
  assert.equal(opacity(s,h,NaN),0);
  assert.ok(Math.abs(opacity(s,h,9)-(1-coverage(s,h)))<1e-9);
});
test('camera/horizon owner receives exactly the original source-bound scalar, never mutable GPU materials',async()=>{
  const {sourceOwnedOriginalArchitectureCoverage:coverage}=await import(
    '../../public/infinite-tower-climb/visuals/source-physical-arrival-palette.mjs');
  const s=source(),h=original();
  const witnessed={
    runToken:h.runToken,floor:h.floor,firstWorldRenderTick:h.firstWorldRenderTick,
    submittedFrames:h.submittedFrames,visibleSeconds:h.visibleSeconds,
    guardianGateRetained:true,opticalExitSubmitted:false,
    originalArchitectureCoverage:coverage(s,h)
  };
  assert.equal(coverage(s,witnessed),.91);
  assert.equal(coverage({...s,runToken:'restart'},witnessed),0);
  assert.equal(coverage({...s,player:{health:0}},witnessed),0);
  assert.equal(coverage({...s,tick:550},witnessed),0);
});
test('the real world and environmental lighting use the SAME bounded old-scene ownership',()=>{
  const world=fs.readFileSync(path.resolve(
    'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  const biome=fs.readFileSync(path.resolve(
    'public/infinite-tower-climb/visuals/biome-threshold.mjs'),'utf8');
  assert.match(world,/sourceAlignedIncomingShaftOpacity\(snapshot,held,nominalShaftFade\)/);
  assert.match(world,/originalArchitectureCoverage:\s*sourceOwnedOriginalArchitectureCoverage\(snapshot,held\)/);
  assert.match(world,/firstWorldRenderTick:held\.firstWorldRenderTick/);
  assert.match(biome,/sourceOwnedOriginalArchitectureCoverage\(frame,retainedCap\)/);
  assert.match(world,/material\.opacity=originalOpacity\*job\.structuralFade/);
  assert.match(world,/arrival\.structuralFade>=\.35[\s\S]*?appendDeferredVista\(arrival\)/);
});
