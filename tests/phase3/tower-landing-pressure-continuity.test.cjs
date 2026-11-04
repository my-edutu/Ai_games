'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const pressure = import('../../public/infinite-tower-climb/visuals/landing-pressure.mjs');
const landing = import('../../public/infinite-tower-climb/visuals/landing-approach.mjs');
const route = import('../../public/infinite-tower-climb/visuals/route-intent.mjs');

const deck = Object.freeze({ id:'f3:p3',kind:'moving',
  x:100000,y:81000,width:150000,height:4000 });
const top = deck.y + deck.height;
const hazard = Object.freeze({id:'charge',x:164000,y:top,
  width:26000,height:9000,active:false,chargeTicksRemaining:5});
function frame(overrides={}) {
  return {
    runToken:'real-run',tick:121,floor:3,lifecycle:'running',
    chunkBaseY:0,worldWidth:480000,
    player:{x:175000,y:top+34000,vy:-5000,state:'airborne',
      halfWidth:6000,halfHeight:10000,health:4,attacking:false},
    intent:{mode:'air-control',summary:'Steering for a clear landing lane',
      targetPlatformId:deck.id},
    platforms:[deck],hazards:[hazard],enemies:[],
    ...overrides,
  };
}
test('only real active hazards and late published descending charges own landing pressure',async()=>{
  const {observedLandingHazardPressure: check}=await pressure;
  const s=frame(),copy=JSON.stringify(s);
  assert.equal(check(s,hazard,top),true);
  assert.equal(check(frame({player:{...s.player,vy:3000}}),hazard,top),false);
  assert.equal(check(frame({player:{...s.player,state:'standing',vy:-5000}}),hazard,top),false);
  assert.equal(check(s,{...hazard,chargeTicksRemaining:8},top),false);
  assert.equal(check(s,{...hazard,chargeTicksRemaining:0},top),false);
  assert.equal(check(s,{...hazard,active:true,chargeTicksRemaining:0},top),true);
  assert.equal(check(s,{...hazard,y:top+40000},top),false);
  assert.equal(check(s,{...hazard,chargeTicksRemaining:NaN},top),false);
  assert.equal(check(s,{...hazard,chargeTicksRemaining:4.5},top),false);
  assert.equal(JSON.stringify(s),copy,'source snapshot remains immutable');
});
test('the live arrival architecture warns only at the real 0.3s landing-pressure window',async()=>{
  const {observedLandingApproach}=await landing;
  const s=frame(),original=JSON.stringify(s);
  const imminent=observedLandingApproach(s,deck,175000);
  assert.ok(imminent,'the real selected moving deck should stage its entry');
  assert.equal(imminent.pressured,true,'charged dock already turns amber on descent');
  assert.equal(imminent.observedOnly,true);
  const safe=frame({hazards:[{...hazard,chargeTicksRemaining:8}]});
  assert.equal(observedLandingApproach(safe,deck,175000).pressured,false);
  const rising=frame({player:{...s.player,vy:4000}});
  assert.equal(observedLandingApproach(rising,deck,175000).pressured,false);
  assert.equal(JSON.stringify(s),original,'scene guidance is read-only');
});
test('world-space route stones stage current intent, not a predicted or stale shortcut',async()=>{
  const {createTowerRouteIntent}=await route;
  const THREE=await import('three');
  const effect=createTowerRouteIntent(THREE);
  try {
    const s=frame(), unchanged=JSON.stringify(s);
    const {witnessedLandingX}=await route;
    const warned=witnessedLandingX(s,deck);
    const unwarned=witnessedLandingX(frame({hazards:[{...hazard,chargeTicksRemaining:8}]}),deck);
    assert.equal(warned.sourceAirLane,true);
    assert.equal(warned.sourceHazardClearance,true,'the live 3D route encodes the current shutter-clear choice');
    assert.equal(unwarned.sourceHazardClearance,false);
    assert.equal(warned.x,155500,'source-confirmed charging obstacle moves the selected physical arrival outside its body');
    assert.equal(unwarned.x,175000,'earlier warnings do not invent a safe lane beyond live pilot policy');
    effect.update(s,deck,{reducedMotion:true});
    const warning=effect.diagnostics();
    assert.equal(warning.sourceBound,true);
    assert.equal(warning.targetPlatformId,deck.id);
    assert.equal(warning.observedLandingX,155500);
    assert.equal(warning.sourceHazardClearance,true);
    assert.equal(effect.group.children[0].material.color.getHex(),0xffb987);
    const activeCount=warning.markers;
    assert.ok(activeCount>=5);
    const noWarning=frame({hazards:[{...hazard,chargeTicksRemaining:8}]});
    effect.update({...noWarning,tick:122},deck,{reducedMotion:true});
    assert.equal(effect.diagnostics().targetPlatformId,deck.id);
    assert.equal(effect.diagnostics().sourceHazardClearance,false);
    assert.equal(effect.diagnostics().markers,activeCount);
    effect.update({...s,tick:123,runToken:'new',lifecycle:'result'},deck);
    assert.equal(effect.diagnostics().markers,0);
    assert.equal(JSON.stringify(s),unchanged);
  } finally {effect.dispose();}
});
