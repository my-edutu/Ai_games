'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const {parseCivilizationConfig}=require('../../dist/games/ai-civilization/src/config/schema.js');
const {createInitialCivilizationState}=require('../../dist/games/ai-civilization/src/index.js');
const {
  buildingCatalogue,buildingCost,tierForRenown,legalCivilizationActions
}=require('../../dist/games/ai-civilization/src/ai/policy.js');
const {
  applyCivilizationAction,advanceCharactersAtYearBoundary,
  resolveDiplomacyAndConflict,selectEligibleCrisis,assertCivilizationInvariants
}=require('../../dist/games/ai-civilization/src/rules/step.js');

function state(seed='phase2'){
  const config=parseCivilizationConfig({maxRunDays:5000});
  return createInitialCivilizationState(config,seed,`run-${seed}`,NamedRng.fromSeed(seed));
}
function makeAffordable(s){
  for(const k of ['food','wood','stone','gold','knowledge','influence'])s.resources[k]=Math.min(s.config.storageCap,1000);
}
function stepWith(s,action,seed='phase2-step'){
  return applyCivilizationAction(s,action,NamedRng.fromSeed(seed)).state;
}

test('building catalogue enforces tier, terrain, resource, labour and uniqueness preconditions',()=>{
  const s=state('catalogue');
  makeAffordable(s);
  assert.equal(buildingCatalogue.market.unlockTier,'village');
  assert.equal(buildingCatalogue.aqueduct.unique,true);
  assert.equal(legalCivilizationActions(s).some(a=>a.type==='build'&&a.building==='market'),false);
  s.progression.renown=160;
  s.progression.tier=tierForRenown(s.progression.renown,s.config.legendaryRenown);
  assert.equal(s.progression.tier,'village');
  assert.equal(legalCivilizationActions(s).some(a=>a.type==='build'&&a.building==='market'),true);
  s.population.workers=0;
  assert.equal(legalCivilizationActions(s).some(a=>a.type==='build'&&a.building==='market'),false);
  assert.deepEqual(buildingCost('market'),buildingCatalogue.market.cost);
});

test('daily ledger records production, consumption, upkeep and spoilage without breaking resource bounds',()=>{
  const s=state('ledger');
  makeAffordable(s);
  s.progression.renown=400;s.progression.tier='town';
  const farm=legalCivilizationActions(s).find(a=>a.type==='build'&&a.building==='farm');
  assert.ok(farm);
  let next=stepWith(s,farm);
  next.resources.food=next.config.storageCap;
  const out=applyCivilizationAction(next,{key:'reserve',type:'reserve'},NamedRng.fromSeed('ledger-2'));
  assert.ok(out.state.economy.ledger.produced.food>0);
  assert.ok(out.state.economy.ledger.consumed.food>0);
  assert.ok(out.state.economy.ledger.spoiled.food>0);
  assert.ok(out.state.economy.ledger.upkeep.wood>=0);
  assert.equal(out.state.economy.history.length<=30,true);
  for(const value of Object.values(out.state.resources))assert.ok(value>=0&&value<=out.state.config.storageCap);
});

test('population changes remain cohort-consistent, housing-capped and seasonally bounded',()=>{
  let s=state('population');
  makeAffordable(s);
  s.population.housing=s.population.total+30;
  s.population.health=95;s.population.morale=95;
  const before=s.population.total;
  for(let i=0;i<s.config.seasonDays;i++)s=stepWith(s,{key:'reserve',type:'reserve'},`population-${i}`);
  const delta=s.population.total-before;
  assert.ok(delta>=-4&&delta<=4,`delta ${delta}`);
  assert.ok(s.population.total<=s.population.housing);
  assert.equal(s.population.children+s.population.workers+s.population.elders,s.population.total);
});

test('repeated construction has diminishing renown and tier thresholds are monotonic',()=>{
  let s=state('renown');
  makeAffordable(s);
  const gains=[];
  for(let n=0;n<3;n++){
    const action=legalCivilizationActions(s).find(a=>a.type==='build'&&a.building==='house');
    assert.ok(action);
    const before=s.progression.renown;
    s=stepWith(s,action,`renown-${n}`);
    makeAffordable(s);
    gains.push(s.progression.renown-before);
  }
  assert.ok(gains[0]>gains[1]&&gains[1]>=gains[2],gains.join(','));
  const tiers=[0,50,150,350,700,1200,2000].map(v=>tierForRenown(v,2000));
  assert.deepEqual(tiers,['camp','hamlet','village','town','city','kingdom','legendary-kingdom']);
});

test('all three Great Work paths can be selected, funded and completed through legal actions',()=>{
  for(const workId of ['sky-library','river-citadel','unity-monument']){
    let s=state(`great-${workId}`);
    makeAffordable(s);
    s.progression.renown=800;s.progression.tier='city';
    const select=legalCivilizationActions(s).find(a=>a.type==='select-great-work'&&a.greatWorkId===workId);
    assert.ok(select,workId);
    s=stepWith(s,select,`select-${workId}`);
    for(let i=0;i<30&&!s.progression.completedGreatWorks.includes(workId);i++){
      makeAffordable(s);
      const contribute=legalCivilizationActions(s).find(a=>a.type==='great-work');
      assert.ok(contribute,`${workId}:${i}`);
      s=stepWith(s,contribute,`work-${workId}-${i}`);
    }
    assert.ok(s.progression.completedGreatWorks.includes(workId),workId);
    assert.equal(s.progression.greatWorkId,null);
    assert.equal(s.progression.greatWorkProgress,0);
  }
});

test('year boundary succession is deterministic, bounded and compacts reign history',()=>{
  const a=state('succession');
  const b=JSON.parse(JSON.stringify(a));
  a.characters.ruler.age=70;b.characters.ruler.age=70;
  const ea=advanceCharactersAtYearBoundary(a,NamedRng.fromSeed('succession-rng'));
  const eb=advanceCharactersAtYearBoundary(b,NamedRng.fromSeed('succession-rng'));
  assert.deepEqual(a,b);
  assert.deepEqual(ea,eb);
  assert.equal(a.characters.ruler.role,'ruler');
  assert.notEqual(a.characters.ruler.id,'ruler-1');
  assert.equal(a.characters.heir.role,'heir');
  assert.equal(a.chronicle.reigns.length,1);
  const rulerIds=new Set([a.characters.ruler.id]);
  for(let i=0;i<20;i++){a.characters.ruler.age=80;advanceCharactersAtYearBoundary(a,NamedRng.fromSeed(`succ-${i}`));rulerIds.add(a.characters.ruler.id);}
  assert.ok(a.chronicle.reigns.length<=12);
  assert.equal(rulerIds.size,21);
});

test('diplomacy exposes bounded observations and conflict outcomes are causal',()=>{
  const s=state('diplomacy');
  makeAffordable(s);
  s.progression.renown=400;s.progression.tier='town';
  const treaty=legalCivilizationActions(s).find(a=>a.type==='diplomacy'&&a.mode==='treaty');
  assert.ok(treaty);
  const events=resolveDiplomacyAndConflict(s,treaty,NamedRng.fromSeed('treaty'));
  assert.ok(events.some(e=>e.type==='diplomacy-changed'));
  assert.ok(['neutral','wary','friendly','allied','hostile','war'].includes(s.diplomacy[0].status));
  assert.ok(['weaker','matched','stronger'].includes(s.diplomacy[0].observedStrengthBand));
  s.diplomacy[0].status='war';s.diplomacy[0].tension=100;s.defence=0;
  const before=s.population.total;
  const warEvents=resolveDiplomacyAndConflict(s,undefined,NamedRng.fromSeed('war'));
  const conflict=warEvents.find(e=>e.type==='conflict-resolved');
  assert.ok(conflict);
  assert.ok(conflict.data.playerPower!==undefined&&conflict.data.rivalPower!==undefined);
  assert.ok(s.population.total<=before);
});

test('crisis eligibility honours warnings, cooldowns and conflict groups without hidden terminal effects',()=>{
  const s=state('crisis');
  s.tick=180;
  const crisis=selectEligibleCrisis(s,NamedRng.fromSeed('crisis-rng'));
  assert.ok(crisis);
  assert.equal(crisis.phase,'warning');
  assert.ok(crisis.warnedAtTick<=s.tick);
  s.crisis=crisis;
  assert.equal(selectEligibleCrisis(s,NamedRng.fromSeed('crisis-rng')),null);
  const beforeResult=s.result;
  for(let i=0;i<20&&s.crisis;i++){
    const action=legalCivilizationActions(s).find(a=>a.type==='crisis-response')??{key:'reserve',type:'reserve'};
    const out=applyCivilizationAction(s,action,NamedRng.fromSeed(`crisis-step-${i}`));
    Object.assign(s,out.state);
  }
  assert.equal(s.result,beforeResult);
  assert.ok(Object.values(s.crisisCooldowns).some(v=>v>s.tick));
  assert.doesNotThrow(()=>assertCivilizationInvariants(s));
});

test('one-time construction costs are consumption, not recurring upkeep',()=>{
  const s=state('ledger-classification');
  makeAffordable(s);
  const action=legalCivilizationActions(s).find(a=>a.type==='build'&&a.building==='farm');
  assert.ok(action);
  const out=applyCivilizationAction(s,action,NamedRng.fromSeed('ledger-classification'));
  const cost=buildingCost('farm');
  assert.equal(out.state.economy.ledger.consumed.wood>=cost.wood,true);
  assert.equal(out.state.economy.ledger.upkeep.wood,0);
});

test('starvation deaths remain visible in the population delta ledger',()=>{
  const s=state('starvation-ledger');
  s.resources.food=0;s.population.starvationDays=4;
  const before=s.population.total;
  const out=applyCivilizationAction(s,{key:'reserve',type:'reserve'},NamedRng.fromSeed('starvation-ledger'));
  assert.equal(out.state.population.total,before-1);
  assert.equal(out.state.population.deaths,1);
  assert.equal(out.state.population.lastDelta,-1);
});

test('crisis recovery consumes the declared recovery cost and records the payment',()=>{
  const s=state('crisis-recovery-cost');
  makeAffordable(s);s.tick=200;
  s.crisis={id:'crisis-test',kind:'market-panic',conflictGroup:'economy',severity:3,phase:'recovery',remainingDays:1,warnedAtTick:190,recoveryCost:{food:10,gold:5}};
  const out=applyCivilizationAction(s,{key:'reserve',type:'reserve'},NamedRng.fromSeed('crisis-recovery-cost'));
  const resolved=out.events.find(e=>e.type==='crisis-resolved');
  assert.ok(resolved);
  assert.equal(out.state.crisis,null);
  assert.ok(out.state.economy.ledger.consumed.food>=10);
  assert.ok(out.state.economy.ledger.consumed.gold>=5);
  assert.deepEqual(resolved.data.recoveryPaid,{food:10,gold:5});
});

test('traits remain bounded modifiers and public intent explains plan changes',()=>{
  const s=state('traits');
  makeAffordable(s);
  s.characters.ruler.traits=['bold','ambitious','charismatic'];
  const actions=legalCivilizationActions(s);
  assert.ok(actions.length>0);
  let out=applyCivilizationAction(s,actions[0],NamedRng.fromSeed('traits-step'));
  assert.ok(out.state.ai.traitUtilityModifier>=-12&&out.state.ai.traitUtilityModifier<=12);
  assert.ok(out.state.ai.lastPlanChangeReason.length>0);
  assert.ok(['calm','focused','concerned','triumphant','defeated'].includes(out.state.characters.ruler.expression));
});
