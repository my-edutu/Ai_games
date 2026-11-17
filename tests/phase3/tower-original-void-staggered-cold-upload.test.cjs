'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require.resolve(
  '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
const farSide=fs.readFileSync(require.resolve(
  '../../public/infinite-tower-climb/visuals/far-side-shaft-transition.mjs'),'utf8');
const crossfloor=fs.readFileSync(require.resolve(
  '../../public/infinite-tower-climb/visuals/crossfloor-arrival.mjs'),'utf8');

// The exact 5418fd0 native recordings show only ONE returned F9 3D doorway
// frame, followed by a 1.50/1.75s HUD-to-sustained-Void visual gap. Building,
// batching and uploading the ENTIRE noninteractive shaft on the immediately
// following frame is a systemic cold-return stall, not an animation problem.
test('deferred authentic F9 architecture spans TWO separate returned GPU frames before revealing the original shaft',()=>{
  assert.match(source,/function buildTower\(height,openClockworkPylons=false,includeBiomeDetails=true\)/);
  assert.match(source,/if\(includeBiomeDetails && theme==='void'\)buildVoid\(height\)/);
  assert.match(source,/buildTower\(arrival\.height,false,false\)/,
    'first post-gateway return may construct only load-bearing architecture');
  assert.match(source,/arrival\.state='awaiting-void-biome-build'/);
  const start=source.indexOf("arrival.state==='awaiting-void-biome-build'");
  const finish=source.indexOf("arrival.state='awaiting-structural-release'",start);
  assert.ok(start>=0&&finish>start,'a second real-return-owned stage must finish the original biome');
  const stage=source.slice(start,finish);
  assert.match(stage,/arrival\.submittedFrames>arrival\.structureBuiltAtSubmitted/,
    'a source poll or animation frame cannot stand in for the first-stage WebGL return');
  assert.match(stage,/buildVoid\(arrival\.height\)/,
    'original Void authored features, not a proxy or alternate scene, complete the second stage');
  assert.match(stage,/batchRigid\(structuralRoot,animatedStructuralRoots\)/,
    'deferred original geometry must be batched without freezing its moving crystal rotors');
  assert.match(stage,/material\.name='SourceEarnedIncomingFloorNineShaft'/);
  assert.match(stage,/material\.opacity=0/,
    'no built-on-CPU shaft may appear before source-authenticated opacity release');
  assert.match(stage,/arrival\.structureDetailBuildMs=/);
  assert.match(source,/if\s*\(!deferStructuralShell\) buildTower\(height,theme==='clockwork'\)/,
    'normal/high floors and the other four biomes preserve existing full construction');
  assert.match(source,/for\(const p of snapshot\.platforms\|\|\[\]\)/);
  assert.match(source,/for\(const h of snapshot\.hazards\|\|\[\]\)buildHazard/);
  assert.match(source,/arrival\.state==='awaiting-void-biome-build'/);
  assert.match(farSide,/\['awaiting-actual-first-render','awaiting-void-biome-build'/);
  assert.match(crossfloor,/job\?\.state==='awaiting-void-biome-build'/);
  assert.doesNotMatch(source,/snapshot\.floor\s*=\s*9|snapshot\.player\.x\s*=/);
});
