'use strict';
// P0: Original Floor8 gateway and the incoming Floor9 noninteractive shaft
// must be presented in a single source-owned world, not swapped after one
// arbitrary GPU submission while the old arch is still visibly opaque.
// Actual 1x film remains the mandatory acceptance, never this test alone.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const moduleURL=name=>pathToFileURL(path.join(root,
  'public/infinite-tower-climb/visuals',name)).href;
function source(){
  const cap={id:'f8:cap',x:200000,y:6000,width:140000,height:500};
  const exitX=cap.x+Math.floor(cap.width*.76);
  return {floor:9,theme:'void',runToken:'source-guardian-victory',tick:469,
    lifecycle:'running',worldWidth:480000,chunkBaseY:0,
    player:{x:355296,y:30000,halfWidth:2000,halfHeight:3500,
      health:90,grounded:false,groundedPlatformId:null,
      state:'airborne',vy:500},
    platforms:[{id:'f9:ground',x:300000,y:6000,width:140000,height:500}],
    lastGuardianCrossing:{runToken:'source-guardian-victory',
      sourceTick:451,fromFloor:8,toFloor:9,cap,
      exitX,crossingX:324296,halfWidth:2000,halfHeight:3500,
      guardian:{kind:'guardian',active:false,health:0}}};
}
function retained(s){
  return {guardianGateRetained:true,runToken:s.runToken,floor:9,
    firstWorldRenderTick:452,sourceTick:452,
    crossingTick:451,thresholdX:s.lastGuardianCrossing.exitX,
    oldRoofY:6500,oldCapX:200000,oldCapWidth:140000,
    visibleSeconds:1.5,submittedFrames:12,
    originalGatewayOpacity:.75,opticalExitSubmitted:false};
}
function upload(s){
  return {state:'awaiting-actual-first-render',structureDeferred:true,
    proof:'recorded-source-gateway',runToken:s.runToken,floor:9,
    sourceTick:452,submittedFrames:12};
}

test('an original source-still-visible bronze gateway defers opaque successor shaft beyond ten submissions even after the cosmetic handoff expired',async()=>{
  const {observedSourceGatewayDeparturePresence}=await import(
    moduleURL('source-physical-arrival-palette.mjs'));
  const {holdIncomingStructuralShell}=await import(
    moduleURL('crossfloor-arrival.mjs'));
  const s=source(),h=retained(s),job=upload(s);
  const oldGateway=observedSourceGatewayDeparturePresence(s,h);
  assert.ok(oldGateway?.sourceBound);
  assert.ok(oldGateway.opacity>.12);
  assert.equal(holdIncomingStructuralShell(s,null,h,job,oldGateway),true,
    'source-valid still-visible original door must not be occluded by newly uploaded opaque shaft');
  assert.equal(h.submittedFrames,12,'cannot consume a fake submission');
});

test('retained physical shell never borrows another run, past source age, ghost arch, failed optical epoch or endless GPU budget',async()=>{
  const {observedSourceGatewayDeparturePresence}=await import(
    moduleURL('source-physical-arrival-palette.mjs'));
  const {holdIncomingStructuralShell}=await import(
    moduleURL('crossfloor-arrival.mjs'));
  const s=source(),h=retained(s),job=upload(s);
  const witness=observedSourceGatewayDeparturePresence(s,h);
  assert.equal(holdIncomingStructuralShell({...s,runToken:'wrong'},null,h,job,witness),false);
  assert.equal(holdIncomingStructuralShell(s,null,{...h,opticalExitSubmitted:true},job,witness),false);
  assert.equal(holdIncomingStructuralShell(s,null,{...h,visibleSeconds:2.8},job,witness),false);
  assert.equal(holdIncomingStructuralShell(s,null,{...h,submittedFrames:30},job,witness),false);
  assert.equal(holdIncomingStructuralShell(s,null,h,{...job,submittedFrames:30},witness),false);
  assert.equal(holdIncomingStructuralShell(s,null,h,{...job,sourceTick:453},witness),false);
  assert.equal(holdIncomingStructuralShell(s,null,h,{...job,proof:'adjacent-browser-guardian'},witness),false);
  assert.equal(holdIncomingStructuralShell(s,null,h,job,{...witness,opacity:0.01}),false);
  assert.equal(holdIncomingStructuralShell(s,null,h,job,{...witness,sourceTick:468}),false);
  assert.equal(holdIncomingStructuralShell(s,null,h,{...job,state:'complete'},witness),false);
  const falsified={...s,lastGuardianCrossing:{
    ...s.lastGuardianCrossing,guardian:{kind:'guardian',active:true,health:20}}};
  assert.equal(observedSourceGatewayDeparturePresence(falsified,h),null,
    'original source defeat remains non-negotiable');
  assert.equal(holdIncomingStructuralShell(falsified,null,h,job,
    observedSourceGatewayDeparturePresence(falsified,h)),false);
});

test('one source-authentic gateway departure drives both the deferred world and the visible sky; the playable ground and hazards remain immediate',()=>{
  const world=fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  const biome=fs.readFileSync(path.join(root,
    'public/infinite-tower-climb/visuals/biome-threshold.mjs'),'utf8');
  assert.match(world,/holdIncomingStructuralShell\(snapshot,passageWitness,\s*retainedEarnedCap,arrival,sourceOldGateway\)/);
  assert.match(world,/const sourceOldGateway=observedSourceGatewayDeparturePresence\(snapshot,retainedEarnedCap\)/);
  assert.match(biome,/observedSourceGatewayDeparturePresence\(frame,retainedCap\)/);
  assert.match(world,/for\(const p of snapshot\.platforms\|\|\[\]\)\{/);
  assert.match(world,/for\(const h of snapshot\.hazards\|\|\[\]\)buildHazard\(/);
  assert.doesNotMatch(world,/snapshot\.floor\s*=\s*9|snapshot\.player\.x\s*=/);
});

test('at the valid old gateway opacity tail, original horizon follows the still-visible architecture instead of cutting instantly to purple',async()=>{
  const {observedSourceGatewayDeparturePresence}=await import(
    moduleURL('source-physical-arrival-palette.mjs'));
  const {observedGroundedBiomeThreshold}=await import(
    moduleURL('biome-threshold.mjs'));
  const s=source(),h=retained(s);
  s.tick=501;s.player.x=414296;s.player.y=50000;
  h.visibleSeconds=.65;h.submittedFrames=4;
  const p=observedSourceGatewayDeparturePresence(s,h);
  assert.ok(p?.sourceBound && p.opacity>0 && p.opacity<1);
  const tint=observedGroundedBiomeThreshold(s,null,{},h);
  assert.ok(tint?.oldWeight>=p.opacity-.001,
    'actual still-visible old arch must not be lit against unrelated full-void sky');
  assert.equal(observedGroundedBiomeThreshold(s,null,{stale:true},h),null);
  assert.equal(observedGroundedBiomeThreshold({...s,runToken:'other'},null,{},h),null);
});
