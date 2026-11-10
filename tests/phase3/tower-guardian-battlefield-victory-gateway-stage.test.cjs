'use strict';
// Original unedited 2702311e danger WebMs (390x844/960x600) and its
// source-linked triangle rays show a SECOND threshold's solid stone/bronze
// crossing the living guardian fight. The scene already has a real exterior
// source lock. Keep that seal active, then stage the inner physical walk lane
// only after earned zero-HP. This is a render contract, NOT a quality vote.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');
const { createTowerGuardianPassage } = require('../../public/infinite-tower-climb/visuals/guardian-passage.mjs');
const cap = { id:'f8:cap', x:115200, y:3212000, width:249600, height:12000 };
const exitX = cap.x + Math.floor(cap.width * .76);
const guardian = { id:'f8:guardian', kind:'guardian', active:true,
  health:8,maxHealth:8,x:180000,y:3240000,halfHeight:18000 };
const base = { lifecycle:'running', runToken:'real-gate-stage',
  floor:8,tick:310,worldWidth:480000,chunkBaseY:2880000,
  guardianExitX:exitX,guardianSealHeight:140000,
  player:{health:4},platforms:[cap],enemies:[guardian] };
const anchor = {x:0,y:36,z:27.78,angle:0};
test('living guardian owns uncluttered combat air while genuine seal stays visible; source defeat earns grounded gateway reveal and real handoff retires it',()=>{
  const stage=createTowerGuardianPassage(THREE);
  const assembly=stage.group.getObjectByName('EarnedWalkableInnerGateAssembly');
  const arch=stage.group.getObjectByName('WalkableSourceCapArchAndBraces');
  const bronze=stage.group.getObjectByName('WalkableSourceCapRetractingBronzeLeaves');
  const seal=stage.group.getObjectByName('SourceLockedGuardianVerticalEnergyLattice');
  assert.ok(assembly && arch && bronze && seal);
  try{
    const original=JSON.stringify(base);
    assert.equal(stage.lock(base,anchor),true);
    stage.update(.12);
    assert.equal(assembly.visible,false,
      'the second solid threshold cannot cover an active two-character fight');
    assert.equal(seal.visible,true,'the actual source lock must not appear bypassable');
    assert.ok(seal.count>=12,'source full-height electrical exclusion remains authored');
    assert.equal(JSON.stringify(base),original);
    assert.equal(stage.diagnostics().innerDoorAssemblyVisible,false);
    const falseClear={...base,tick:311,enemies:[]};
    assert.equal(stage.unlock(falseClear,anchor),false,'missing guardian is not a victory');
    assert.equal(assembly.visible,false);
    const defeated={...base,tick:312,enemies:[{...guardian,active:false,health:0}]};
    assert.equal(stage.unlock(defeated,anchor),true);
    assert.equal(seal.visible,false);
    assert.equal(assembly.visible,true,'real source defeat must physically reveal the walk lane');
    stage.update(0,{reducedMotion:false});
    assert.ok(assembly.position.y<-.8,
      'physical walk-through arch rises from the deck instead of popping over the fight');
    stage.update(.5,{reducedMotion:false});
    assert.equal(assembly.position.y,0);
    assert.equal(stage.diagnostics().innerDoorAssemblyVisible,true);
    const floorNine={...defeated,tick:313,floor:9,enemies:[]};
    assert.equal(stage.begin(defeated,floorNine,anchor),true);
    stage.update(.05);
    assert.equal(assembly.visible,false,
      'a carried old-floor arch cannot double the new-floor memory facade');
    assert.equal(stage.diagnostics().exteriorMemoryFrameVisible,true);
    stage.clear();
    assert.equal(stage.diagnostics().innerDoorAssemblyVisible,false);
    assert.equal(stage.diagnostics().active,false);
    assert.equal(stage.lock({...base,runToken:'restart-run',tick:1},anchor),true);
    assert.equal(assembly.visible,false,'restart never leaks a false cleared doorway');
    assert.equal(seal.visible,true);
  } finally {stage.dispose();}
});
test('reduced-motion earned gateway is instantly grounded, not left underground',()=>{
  const stage=createTowerGuardianPassage(THREE);
  try{
    const defeated={...base,tick:314,enemies:[{...guardian,active:false,health:0}]};
    assert.equal(stage.unlock(defeated,anchor),true);
    stage.update(0,{reducedMotion:true});
    const assembly=stage.group.getObjectByName('EarnedWalkableInnerGateAssembly');
    assert.equal(assembly.visible,true);
    assert.equal(assembly.position.y,0);
    assert.equal(stage.diagnostics().stage,'earned-open');
  }finally{stage.dispose();}
});
