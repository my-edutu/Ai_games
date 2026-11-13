'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const path=require.resolve('../../public/infinite-tower-climb/visuals/world.mjs');
const world=fs.readFileSync(path,'utf8');

// Original native 1x 43300014722: exact HP-zero crossing tick451, old gate
// retained on first Floor9 source frame, but new violet structure still
// replaced the bronze world without one visible player-through-arch shot.
// This test requires a REAL deferred structural GPU submission, not another
// source-witness fix, and forbids deferring the actual traversable platforms.
test('cold source-earned Floor9 starts with authentic grounded roof, then stages original noninteractive tower shell after an actual render return',()=>{
  assert.match(world,/const deferStructuralShell\s*=\s*deferDistant\s*&&\s*earnedSourceUploadWitness\s*&&\s*snapshot\.floor===9\s*&&\s*snapshot\.theme==='void'/);
  assert.match(world,/if\s*\(!deferStructuralShell\)\s*buildTower\(height,theme==='clockwork'\)/);
  assert.match(world,/if\s*\(arrival\.structureDeferred\)\s*\{[\s\S]*?buildTower\(arrival\.height,false\)[\s\S]*?batchRigid\(structuralRoot,/);
  assert.match(world,/arrival\.state='awaiting-structural-submission'/);
  // The real shell must complete a subsequent renderer submission before the canyon uploads;
  // its source-owned upload may be delayed by an authentic held gateway shot.
  assert.match(world,/arrival\.state==='awaiting-structural-submission'[\s\S]*?Number\.isSafeInteger\(arrival\.structureBuiltAtSubmitted\)[\s\S]*?arrival\.submittedFrames>arrival\.structureBuiltAtSubmitted[\s\S]*?!options\.stale\)[\s\S]*?appendDeferredVista\(arrival\)/);
  // A true returned frame containing the canyon must precede the far citadels.
  // The source gate can delay uploads, so fixed absolute frame counts are unsound.
  assert.match(world,/arrival\.state==='awaiting-vista-submission'[\s\S]*?Number\.isSafeInteger\(arrival\.vistaBuiltAtSubmitted\)[\s\S]*?arrival\.submittedFrames>arrival\.vistaBuiltAtSubmitted[\s\S]*?!options\.stale\)/);
  assert.match(world,/for\(const p of snapshot\.platforms\|\|\[\]\)\{/);
  assert.match(world,/for\(const h of snapshot\.hazards\|\|\[\]\)buildHazard\(/);
  assert.match(world,/noteFrameSubmitted\(snapshot, options=\{\}, renderedDt=0\)/);
  assert.doesNotMatch(world,/snapshot\.floor\s*=\s*9|snapshot\.player\.x\s*=/,
    'presentation cannot authorize a new floor or move the player');
});

test('deferred Floor9 shell must retain moving crystal parts rather than merging animated objects into a static GPU batch',()=>{
  assert.match(world,/const animatedStructuralRoots=new Set\(/);
  assert.match(world,/for\(const rotor of deferredShellRotors\)\s*batchRigid\(rotor\.o\)/);
  assert.match(world,/batchRigid\(structuralRoot,animatedStructuralRoots\)/);
  assert.match(world,/structuralRoot\.name='deferred-original-floor-nine-architecture'/);
  assert.match(world,/deferredDistantArrival\.structureDeferred/);
});

test('original shaft uses isolated fading materials and returned-frame clock rather than an unobserved RAF timer',()=>{
  assert.match(world,/material\.name='SourceEarnedIncomingFloorNineShaft'/);
  assert.match(world,/material\.opacity=0/);
  assert.match(world,/floorMaterials\.add\(material\)/);
  assert.match(world,/job\.structuralFade=options\.reducedMotion\?1:/);
  assert.match(world,/const shown = Number\.isFinite\(renderedDt\)/);
  assert.match(world,/held\.visibleSeconds=Math\.min\(3,held\.visibleSeconds\+shown\)/);
  assert.doesNotMatch(world,/held\.visibleSeconds\s*\+=\s*Math\.min\(/);
  assert.match(world,/job\.vistaFade\+shown\/\.55/);
  assert.match(world,/job\.fade\+shown\/\.55/);
  assert.match(world,/job\.structuralShadows/);
});
