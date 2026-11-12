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
  assert.match(world,/const deferStructuralShell\s*=\s*deferDistant\s*&&\s*earnedSourceUploadWitness\s*&&\s*snapshot\.floor===9\s*&&\s*theme==='void'/);
  assert.match(world,/if\s*\(!deferStructuralShell\)\s*buildTower\(height,theme==='clockwork'\)/);
  assert.match(world,/if\s*\(deferStructuralShell\)\s*\{[\s\S]*?buildTower\(arrival\.height,false\)[\s\S]*?batchRigid\(structuralRoot,/);
  assert.match(world,/arrival\.state='awaiting-structural-submission'/);
  assert.match(world,/arrival\.submittedFrames>=2[\s\S]*?buildVista\(arrival\.height\)/);
  assert.match(world,/arrival\.submittedFrames>=(arrival\.structureDeferred\?3:2)/);
  assert.match(world,/for\(const p of snapshot\.platforms\|\|\[\]\)\{/);
  assert.match(world,/for\(const h of snapshot\.hazards\|\|\[\]\)buildHazard\(/);
  assert.match(world,/noteFrameSubmitted\(snapshot, options=\{\}\)/);
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
