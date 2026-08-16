const test=require('node:test');
const assert=require('node:assert/strict');
const {runFinalCampaign}=require('../../dist/packages/release-validation/src/index.js');

const options={seed:'phase6-final',runsPerScenario:25,maxTicks:500,width:18,height:16,targetLength:45,profiles:['open','corridors','rings','chambers','portals'],hazardCount:2};

test('final campaign is byte-deterministic across baseline and maximum bounded pressure',()=>{
  const a=runFinalCampaign(options),b=runFinalCampaign(options);
  assert.deepEqual(a,b);
  assert.equal(a.deterministicRerunReady,true);
  assert.equal(a.scenarios.length,2);
  assert.notEqual(a.scenarios[0].campaignChecksum,a.scenarios[1].campaignChecksum);
});

test('campaign covers every profile with zero invariants or duplicate effect application',()=>{
  const report=runFinalCampaign(options);
  assert.deepEqual(report.profiles,['chambers','corridors','open','portals','rings']);
  assert.equal(report.totalInvariantFailures,0);
  assert.equal(report.totalDuplicateApplications,0);
  for(const scenario of report.scenarios){
    assert.equal(scenario.runs,options.runsPerScenario);
    assert.deepEqual(Object.keys(scenario.profileCounts).sort(),report.profiles);
    assert.equal(scenario.invariantFailures,0);
    assert.equal(scenario.technicalOutcomes,0);
    assert.ok(scenario.tickPercentiles.p50<=scenario.tickPercentiles.p95);
    assert.ok(scenario.tickPercentiles.p95<=scenario.tickPercentiles.p99);
    assert.ok(scenario.victoryRateInterval.low>=0&&scenario.victoryRateInterval.high<=1);
  }
});

test('maximum pressure is bounded, consequential and remains a distinct record category',()=>{
  const report=runFinalCampaign(options);
  const pressure=report.scenarios.find(s=>s.id==='maximum-bounded-pressure');
  assert.ok(pressure.influence.queued>0);
  assert.ok(pressure.influence.applied>0);
  assert.equal(pressure.influence.duplicateApplications,0);
  assert.equal(pressure.recordCategories['chat-vs-ai'],options.runsPerScenario);
  assert.ok(pressure.influence.maxQueuedAtOnce<=32);
  assert.equal(pressure.prohibitedTerminalEffects,0);
});

test('baseline requires no provider or audience availability',()=>{
  const report=runFinalCampaign(options),baseline=report.scenarios.find(s=>s.id==='no-audience');
  assert.equal(baseline.influence.queued,0);
  assert.equal(baseline.influence.applied,0);
  assert.equal(baseline.recordCategories.standard,options.runsPerScenario);
  assert.ok(baseline.outcomes.victory+baseline.outcomes.stagnation+baseline.outcomes['wall-collision']+baseline.outcomes['self-collision']+baseline.outcomes['obstacle-collision']+baseline.outcomes['hazard-collision']===options.runsPerScenario);
});

test('invalid campaign sizes and unsupported profiles fail before execution',()=>{
  assert.throws(()=>runFinalCampaign({...options,runsPerScenario:0}),e=>e.code==='INVALID_CAMPAIGN');
  assert.throws(()=>runFinalCampaign({...options,profiles:['unknown']}),e=>e.code==='INVALID_CAMPAIGN');
});