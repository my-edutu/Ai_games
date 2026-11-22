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
test('deferred authentic F9 architecture spans THREE separate returned GPU frames before revealing the original shaft',()=>{
  assert.match(source,/function buildTower\(height,openClockworkPylons=false,includeBiomeDetails=true,section='full'\)/);
  assert.match(source,/if\(includeBiomeDetails && theme==='void'\)buildVoid\(height\)/);
  assert.match(source,/buildTower\(arrival\.height,false,false,'core'\)/,
    'first post-gateway return may construct only the original core');
  assert.match(source,/buildTower\(arrival\.height,false,false,'periphery'\)/,
    'second returned stage builds original exterior buttresses without crystals');
  assert.match(source,/arrival\.state='awaiting-void-biome-build'/);
  const start=source.indexOf("arrival.state==='awaiting-void-biome-build'");
  const finish=source.indexOf("arrival.state='awaiting-structural-release'",start);
  assert.ok(start>=0&&finish>start,'a second real-return-owned stage must finish the original biome');
  const stage=source.slice(start,finish);
  assert.match(stage,/arrival\.submittedFrames>arrival\.structureBuiltAtSubmitted/,
    'a source poll or animation frame cannot stand in for the first-stage WebGL return');
  assert.match(stage,/arrival\.submittedFrames>arrival\.peripheryBuiltAtSubmitted/,
    'animated biome cannot build in the same return as original outer buttresses');
  assert.match(stage,/buildVoid\(arrival\.height\)/,
    'original Void authored features, not a proxy or alternate scene, complete the second stage');
  assert.match(source,/batchRigid\(structuralRoot\)/,
    'original load-bearing shell is independently batched before detail construction');
  assert.match(stage,/batchRigid\(biomeRoot,animatedStructuralRoots\)/,
    'genuine rotating Void crystal geometry must not be frozen into rigid detail meshes');
  assert.match(source,/material\.name='SourceEarnedIncomingFloorNineShaft'/);
  assert.match(source,/material\.opacity=0/,
    'no built-on-CPU shaft may appear before source-authenticated opacity release');
  assert.match(stage,/arrival\.structureDetailBuildMs=/);
  assert.match(stage,/arrival\.peripheryBuiltAtSubmitted=arrival\.submittedFrames/);
  assert.match(stage,/arrival\.biomeBuiltAtSubmitted=arrival\.submittedFrames/);
  assert.match(source,/job\.biomeFade=Math\.min\(job\.structuralFade,job\.biomeFade\+shown\/\.7\)/);
  assert.match(source,/if\s*\(!deferStructuralShell\) buildTower\(height,theme==='clockwork'\)/,
    'normal/high floors and the other four biomes preserve existing full construction');
  assert.match(source,/for\(const p of snapshot\.platforms\|\|\[\]\)/);
  assert.match(source,/for\(const h of snapshot\.hazards\|\|\[\]\)buildHazard/);
  assert.match(source,/arrival\.state==='awaiting-void-biome-build'/);
  assert.match(farSide,/\['awaiting-actual-first-render','awaiting-void-biome-build'/);
  assert.match(crossfloor,/job\?\.state==='awaiting-void-biome-build'/);
  assert.doesNotMatch(source,/snapshot\.floor\s*=\s*9|snapshot\.player\.x\s*=/);
});

test('a genuine original core return stays authoritative across both deferred scenic uploads, not reset to zero twice',()=>{
  const markers=source.match(/arrival\.structureBuiltAtSubmitted=arrival\.submittedFrames/g)||[];
  assert.equal(markers.length,1,
    'only first physically rendered core can open its optical clock; later landscape and crystal stages use separate return fences');
  assert.match(source,/arrival\.peripheryBuiltAtSubmitted=arrival\.submittedFrames/);
  assert.match(source,/arrival\.biomeBuiltAtSubmitted=arrival\.submittedFrames/);
  assert.match(source,/job\.state!=='awaiting-structural-release'/);
  assert.match(source,/job\.submittedFrames>job\.structureBuiltAtSubmitted/,
    'authentic, non-stale render receipts—not source ticks—must pace the continuously visible load-bearing shaft');
});
