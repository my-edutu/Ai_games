'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const colors = import('../../public/infinite-tower-climb/visuals/original-clockwork-architecture-palette.mjs');

const source = Object.freeze({
  floor:9, theme:'void', lifecycle:'running', runToken:'earned-guardian-F8-to-F9',
  tick:551, player:{health:6}
});
const liveProof = Object.freeze({
  sourceBound:true, kind:'recorded-source-zero-hp',
  sourceTick:551, crossingTick:475, oldWeight:.72
});
const certifiedTail = Object.freeze({
  historicalOpticalTail:true, previouslySourceVerified:true,
  authenticatedSourceTick:550, authenticatedCrossingTick:475,
  runToken:source.runToken, returnedFrames:3, oldWeight:.66
});

test('actual old-world and F9 sky share ONE same-run source-certified material weight', async () => {
  const { observedCertifiedClockworkHorizon } = await colors;
  const current = observedCertifiedClockworkHorizon(source,liveProof,certifiedTail);
  assert.deepEqual(current,{
    sourceBound:true,sourceTick:551,oldWeight:.72,
    historicalOpticalTail:false,kind:'live-same-run-physical-gateway'
  },'current physical observation outranks a historical GPU-only color');
  const tail = observedCertifiedClockworkHorizon(source,null,certifiedTail);
  assert.deepEqual(tail,{
    sourceBound:true,sourceTick:551,oldWeight:.66,
    historicalOpticalTail:true,kind:'previous-certified-returned-material'
  },'the real F9 lighting must not instantly turn violet while matching bronze deck/shaft/gallery still retire over eight returned WebGL frames');
});

test('no sky material memory from invented, stale, wrong-run, future, ended or unsupported old gateway', async () => {
  const { observedCertifiedClockworkHorizon:sample } = await colors;
  for (const changed of [
    {...source,runToken:'different-run'},
    {...source,floor:10},{...source,floor:8},{...source,theme:'clockwork'},
    {...source,lifecycle:'outcome'},
    {...source,player:{health:0}},
    {...source,tick:549},{...source,tick:636},
  ]) assert.equal(sample(changed,null,certifiedTail),null);
  for (const changed of [
    {...certifiedTail,runToken:'different-run'},
    {...certifiedTail,previouslySourceVerified:false},
    {...certifiedTail,historicalOpticalTail:false},
    {...certifiedTail,returnedFrames:8},
    {...certifiedTail,authenticatedCrossingTick:552},
    {...certifiedTail,oldWeight:NaN},
  ]) assert.equal(sample(source,null,changed),null);
  assert.equal(sample(source,null,null),null);
  assert.equal(sample(source,{...liveProof,sourceTick:550},null),null,
    'source-pixel phases must not borrow a previous live receipt as if current');
  assert.equal(sample(source,{...liveProof,kind:'not-an-authentic-guardian'},null),null);
  assert.equal(sample(source,{...liveProof,crossingTick:552},null),null);
});

test('actual world renderer and scene camera/sky use the same nonwritable source-bound palette owner', () => {
  const world=fs.readFileSync('public/infinite-tower-climb/visuals/world.mjs','utf8');
  const scene=fs.readFileSync('public/infinite-tower-climb/visuals/scene.mjs','utf8');
  assert.match(world,/observedCertifiedClockworkHorizon\(snapshot,livePaletteProof,opticalTail\)/);
  assert.match(world,/certifiedPaletteHorizon\(snapshot\)/);
  assert.match(scene,/world\.certifiedPaletteHorizon\?\.\(snapshot\)/);
  assert.match(scene,/Math\.max\(thresholdLight\?\.oldWeight\s*\?\?\s*0,\s*certifiedHorizon\?\.oldWeight\s*\?\?\s*0\)/);
  assert.doesNotMatch(world,/snapshot\.floor\s*=\s*9/);
});
