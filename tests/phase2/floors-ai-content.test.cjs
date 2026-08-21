'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {FloorsRuntime}=require('../../dist/games/ai-vs-1000-floors/src/runtime/run.js');
const {DEFAULT_FLOORS_CONFIG}=require('../../dist/games/ai-vs-1000-floors/src/config/schema.js');
const {generateFloor}=require('../../dist/games/ai-vs-1000-floors/src/generation/floor.js');
const {sectorForFloor,enemyDefinition,hazardDefinition,moduleDefinition,bossDefinition,isCheckpointFloor,isWardenFloor,FLOORS_MODULES}=require('../../dist/games/ai-vs-1000-floors/src/content/catalogue.js');
const {chooseProductionAction,productionPlannerBudget}=require('../../dist/games/ai-vs-1000-floors/src/ai/policy.js');
const {listLegalActions,actionKey,applyFloorsAction}=require('../../dist/games/ai-vs-1000-floors/src/rules/step.js');
const {runFloorsCampaign}=require('../../dist/games/ai-vs-1000-floors/src/testing/campaign.js');

const WARDEN_FLOORS=[100,200,300,400,500,600,700,800,900,950];
const clone=value=>structuredClone(value);

test('ten sectors cover the full 1,000-floor ascent with cadence truth',()=>{
  const ids=new Set();
  for(let floor=1;floor<=1000;floor++) ids.add(sectorForFloor(floor).id);
  assert.equal(ids.size,10);
  assert.equal(sectorForFloor(1).id,'intake-vaults');
  assert.equal(sectorForFloor(1000).id,'architects-spine');
  assert.equal(isCheckpointFloor(25),true);
  assert.equal(isCheckpointFloor(26),false);
  assert.equal(isWardenFloor(100),true);
  assert.equal(isWardenFloor(900),true);
  assert.equal(isWardenFloor(950),true);
  assert.equal(isWardenFloor(1000),false);
});

test('production catalogue exposes bounded enemy hazard module and all boss families',()=>{
  const enemies=['sentinel','striker','leech','warden','architect'].map(enemyDefinition);
  const hazards=['spike','heat','beam','null','storm','snare'].map(hazardDefinition);
  assert.equal(new Set(enemies.map(x=>x.id)).size,5);
  assert.equal(new Set(hazards.map(x=>x.id)).size,6);
  assert.equal(FLOORS_MODULES.length,12);
  for(const module of FLOORS_MODULES){assert.equal(moduleDefinition(module.id).id,module.id);assert.ok(module.maxStacks>=1&&module.maxStacks<=3)}
  const wardens=WARDEN_FLOORS.map(bossDefinition);
  assert.equal(wardens.length,10);
  assert.equal(new Set(wardens.map(x=>x.id)).size,10);
  assert.equal(wardens.every(x=>x.kind==='warden'),true);
  assert.equal(wardens.at(-1).name,'Spine Herald');
  assert.equal(bossDefinition(1000).id,'the-architect');
  assert.equal(bossDefinition(1000).kind,'architect');
});

test('every required Warden and Architect is placed on the protected mandatory route',()=>{
  for(const floorNumber of [...WARDEN_FLOORS,1000]){
    for(let seed=0;seed<20;seed++){
      const floor=generateFloor(DEFAULT_FLOORS_CONFIG,floorNumber,NamedRng.fromSeed(`guardian-${floorNumber}-${seed}`));
      const expectedKind=floorNumber===1000?'architect':'warden';
      const guardian=floor.enemies.find(enemy=>enemy.kind===expectedKind);
      assert.ok(guardian,`${floorNumber}:${seed}:missing-guardian`);
      assert.ok(floor.mandatoryPath.includes(guardian.cell),`${floorNumber}:${seed}:guardian-off-route`);
      assert.notEqual(guardian.cell,floor.start,`${floorNumber}:${seed}:guardian-at-start`);
      assert.notEqual(guardian.cell,floor.exit,`${floorNumber}:${seed}:guardian-at-exit`);
      assert.equal(floor.walls.includes(guardian.cell),false,`${floorNumber}:${seed}:guardian-in-wall`);
    }
  }
});

test('every five-floor upgrade slot installs a real bounded module',()=>{
  for(let index=0;index<FLOORS_MODULES.length;index++){
    const runtime=FloorsRuntime.create({},`module-install-${index}`),state=clone(runtime.state),expected=FLOORS_MODULES[index];
    state.floor.number=(index+1)*5;state.player.cell=state.floor.exit;state.floor.objective='reach-exit';state.floor.objectiveComplete=true;
    const result=applyFloorsAction(state,{kind:'wait'},NamedRng.fromSeed(`module-install-${index}`));
    assert.equal(result.accepted,true);assert.ok(result.state.player.modules.includes(expected.id),`${expected.id}:not-installed`);assert.ok(result.events.some(event=>event.type==='module-installed'&&event.data?.moduleId===expected.id),`${expected.id}:missing-event`);
  }
});

test('passive modules change authoritative mechanics instead of remaining metadata',()=>{
  const planner=FloorsRuntime.create({},'module-planner').state;const baseBudget=productionPlannerBudget(planner);planner.player.modules.push('route-cache');assert.ok(productionPlannerBudget(planner)>baseBudget);assert.ok(productionPlannerBudget(planner)<=planner.config.maxPlannerExpansions);

  const mobility=clone(FloorsRuntime.create({},'module-mobility').state);mobility.player.modules=['pulse-step'];mobility.player.energy=0;const move=listLegalActions(mobility).find(action=>action.kind==='move');assert.ok(move);const moved=applyFloorsAction(mobility,move,NamedRng.fromSeed('module-mobility'));assert.equal(moved.state.player.energy,1);

  const hazardBase=clone(FloorsRuntime.create({},'module-hazard').state);hazardBase.floor.enemies=[];hazardBase.player.armor=0;hazardBase.player.shield=0;hazardBase.floor.hazards=[{id:'test-beam',kind:'beam',cell:hazardBase.player.cell,damage:2,period:1,phase:0}];const noLens=applyFloorsAction(hazardBase,{kind:'wait'},NamedRng.fromSeed('module-hazard-a')).state;const withLensState=clone(hazardBase);withLensState.player.modules=['hazard-lens'];const withLens=applyFloorsAction(withLensState,{kind:'wait'},NamedRng.fromSeed('module-hazard-b')).state;assert.ok(withLens.player.health>noLens.player.health);

  const finaleBase=clone(hazardBase);finaleBase.floor.number=1000;const noSigil=applyFloorsAction(finaleBase,{kind:'wait'},NamedRng.fromSeed('module-finale-a')).state;const sigilState=clone(finaleBase);sigilState.player.modules=['architect-sigil'];const withSigil=applyFloorsAction(sigilState,{kind:'wait'},NamedRng.fromSeed('module-finale-b')).state;assert.ok(withSigil.player.health>noSigil.player.health);

  const combat=clone(FloorsRuntime.create({},'module-combat').state),target=combat.floor.mandatoryPath[1];assert.notEqual(target,undefined);combat.player.cell=combat.floor.start;combat.floor.walls=combat.floor.walls.filter(cell=>cell!==target);combat.floor.hazards=[];combat.floor.enemies=[{id:'warden-test',kind:'warden',cell:target,health:10,maxHealth:10,attack:0,armor:1,telegraph:'guard',cooldown:0}];combat.floor.objective='defeat-warden';const noKey=applyFloorsAction(combat,{kind:'attack',targetCell:target,direction:'right'},NamedRng.fromSeed('module-key-a')).state;const keyState=clone(combat);keyState.player.modules=['warden-key'];const withKey=applyFloorsAction(keyState,{kind:'attack',targetCell:target,direction:'right'},NamedRng.fromSeed('module-key-b')).state;assert.ok(withKey.floor.enemies[0].health<noKey.floor.enemies[0].health);

  const salvageBase=clone(combat);salvageBase.floor.enemies[0].health=1;salvageBase.floor.enemies[0].maxHealth=1;const normalKill=applyFloorsAction(salvageBase,{kind:'attack',targetCell:target,direction:'right'},NamedRng.fromSeed('module-salvage-a')).state;const salvageState=clone(salvageBase);salvageState.player.modules=['salvage-rig'];const salvageKill=applyFloorsAction(salvageState,{kind:'attack',targetCell:target,direction:'right'},NamedRng.fromSeed('module-salvage-b')).state;assert.ok(salvageKill.player.credits>normalKill.player.credits);

  const repairBase=clone(FloorsRuntime.create({},'module-repair').state);repairBase.player.health=5;repairBase.player.cell=repairBase.floor.exit;repairBase.floor.objectiveComplete=true;const normalTransition=applyFloorsAction(repairBase,{kind:'wait'},NamedRng.fromSeed('module-repair-a')).state;const repairState=clone(repairBase);repairState.player.modules=['field-repair'];const repairedTransition=applyFloorsAction(repairState,{kind:'wait'},NamedRng.fromSeed('module-repair-b')).state;assert.ok(repairedTransition.player.health>normalTransition.player.health);
});

test('production policy only returns exact legal actions over an adversarial corpus',()=>{
  for(let i=0;i<30;i++){
    const runtime=FloorsRuntime.create({maxTicksPerFloor:900},`phase2-policy-${i}`,{policy:'production'});
    for(let step=0;step<180&&runtime.state.lifecycle==='running';step++){
      const decision=chooseProductionAction(runtime.state);
      const legal=listLegalActions(runtime.state);
      assert.ok(legal.some(action=>actionKey(action)===actionKey(decision.action)),`${i}:${step}:${decision.reason}`);
      assert.ok(decision.expansions<=runtime.state.config.maxPlannerExpansions);
      runtime.step(decision.action);
    }
  }
});

test('campaign is deterministic, bounded, and separates technical outcomes',()=>{
  const one=runFloorsCampaign({seeds:16,maxTicks:2500,seedPrefix:'phase2-campaign'});
  const two=runFloorsCampaign({seeds:16,maxTicks:2500,seedPrefix:'phase2-campaign'});
  assert.deepEqual(one,two);
  assert.equal(one.invalidActions,0);
  assert.equal(one.invalidFloors,0);
  assert.equal(one.replayDivergence,0);
  assert.ok(one.maxPlannerExpansions<=512);
  assert.equal(one.runs,16);
  assert.ok(one.sectorsSeen>=1&&one.sectorsSeen<=10);
});
