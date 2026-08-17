'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {parseCivilizationConfig}=require('../../dist/games/ai-civilization/src/config/schema.js');
const {generateWorld,validateWorld}=require('../../dist/games/ai-civilization/src/generation/world.js');
const {createFoundingCast}=require('../../dist/games/ai-civilization/src/characters/cast.js');
const {createInitialCivilizationState}=require('../../dist/games/ai-civilization/src/index.js');

test('config rejects worlds and time/resource bounds outside the deterministic envelope',()=>{
  assert.throws(()=>parseCivilizationConfig({width:5,height:5}),/width|height/);
  assert.throws(()=>parseCivilizationConfig({width:17,height:10}),/width/);
  assert.throws(()=>parseCivilizationConfig({storageCap:3.5}),/storageCap/);
  assert.throws(()=>parseCivilizationConfig({seasonDays:31,yearDays:120}),/yearDays/);
  assert.throws(()=>parseCivilizationConfig({collapseWindowDays:0}),/collapseWindowDays/);
});

test('defaults expose the approved bounded world and lifecycle budgets',()=>{
  const c=parseCivilizationConfig({});
  assert.equal(c.width,12); assert.equal(c.height,8);
  assert.equal(c.maxWidth,16); assert.equal(c.maxHeight,10);
  assert.equal(c.seasonDays,30); assert.equal(c.yearDays,120);
  assert.equal(c.liveEventCap,512); assert.equal(c.presentationCueCap,96);
  assert.equal(c.intermissionDays,18);
});

test('world generation is reproducible, connected, valid and bounded across 500 seeds',()=>{
  const c=parseCivilizationConfig({});
  for(let i=0;i<500;i++){
    const seed=`world-${i}`;
    const a=generateWorld(c,NamedRng.fromSeed(seed));
    const b=generateWorld(c,NamedRng.fromSeed(seed));
    assert.deepEqual(a,b);
    const report=validateWorld(a,c);
    assert.equal(report.valid,true,`${seed}: ${report.errors.join(',')}`);
    assert.ok(a.generationAttempts<=4);
    assert.ok(a.tiles.some(t=>t.index===a.capitalIndex&&t.terrain!=='water'));
    for(const feature of ['food','wood','stone','water'])assert.ok(report.features.includes(feature),`${seed}:${feature}`);
  }
});

test('founding cast and initial state are deterministic, bounded and audience-text free',()=>{
  const castA=createFoundingCast(NamedRng.fromSeed('cast'));
  const castB=createFoundingCast(NamedRng.fromSeed('cast'));
  assert.deepEqual(castA,castB);
  assert.equal(castA.councillors.length,4);
  assert.equal(castA.rivals.length,3);
  assert.ok(castA.ruler.traits.length===3);
  const state=createInitialCivilizationState(parseCivilizationConfig({}),'seed-a','run-a');
  assert.equal(state.world.tiles.length,96);
  assert.ok(state.population.total>0);
  assert.ok(state.resources.food>0);
  assert.ok(!JSON.stringify(state).includes('provider'));
});
