'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {publicEarnedCounterCourtWave:unused}= {}; // actual module imported below
const scene=fs.readFileSync(path.join(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
const helpers=()=>import('../../public/ai-maze-escape/public-counter-impact.mjs');
const observed=()=>({
  lifecycle:'running',result:null,currentCell:6,width:5,height:5,
  visibleCells:[6,7,8],
  cells:[{cell:6,blocked:false,neighbors:[7]},{cell:7,blocked:false,neighbors:[6,8]},{cell:8,blocked:false,neighbors:[7]}],
  threats:[{id:'thornback',cell:8,lanternParried:true}]
});
const actor=phase=>({cell:8,x:4.8,z:0,counterPhase:phase});
test('one earned original parry drives ordered, bounded two-stage grounded physical response',async()=>{
  const {publicEarnedCounterImpactStage,publicEarnedCounterCourtWave}=await helpers();
  const s=observed(),before=JSON.stringify(s);
  const at=p=>publicEarnedCounterCourtWave(publicEarnedCounterImpactStage(s,actor(p)));
  assert.deepEqual(at(0),{near:null,far:null});
  assert.ok(at(.18).near && !at(.18).far,'Pip-side pulse starts before guardian-side return');
  const both=at(.42);
  assert.ok(both.near && both.far,'real counter reaches the witnessed second open edge');
  for(const effect of [both.near,both.far]){
    assert.ok(effect.scale>.76&&effect.scale<1.40);
    assert.ok(effect.opacity>.12&&effect.opacity<=.60);
  }
  assert.equal(at(.76).near,null);
  assert.ok(at(.76).far,'guardian-side pulse persists into real recoil');
  assert.deepEqual(at(.96),{near:null,far:null});
  assert.equal(publicEarnedCounterCourtWave(null),null);
  assert.equal(publicEarnedCounterCourtWave({phase:NaN}),null);
  assert.equal(publicEarnedCounterCourtWave({phase:1}),null);
  assert.equal(publicEarnedCounterCourtWave(publicEarnedCounterImpactStage(s,actor(.42),true)),null);
  assert.equal(JSON.stringify(s),before,'physical presentation cannot mutate AI authority');
});
test('stage owns only source-public same-tier corridor, reuses a single impact geometry and disposes both mats',()=>{
  assert.match(scene,/const waveCells=earnedTwoLinkPath/);
  assert.match(scene,/s.visibleCells.includes\(s.currentCell\)/);
  assert.match(scene,/entry.cell===cell && entry.blocked===false/);
  assert.match(scene,/cellHeight\(cell,s.width,s.height\)===floor/);
  assert.match(scene,/const waveBeat=publicEarnedCounterCourtWave\(counterImpact\)/);
  assert.match(scene,/counterImpactRing.visible=connected/);
  assert.match(scene,/new THREE.Mesh\(counterImpactGeometry,material\)/);
  assert.match(scene,/for\(const wave of counterCourtWaves\)wave.visible=false/);
  assert.match(scene,/scene.remove\(counterCoreStraight,counterCoreTurn,counterImpactRing,\.\.\.counterCourtWaves\)/);
  assert.match(scene,/for\(const material of counterCourtWaveMaterials\)material.dispose\(\)/);
  assert.doesNotMatch(scene,/new THREE\.TorusGeometry[^\n]*waveBeat/);
});
