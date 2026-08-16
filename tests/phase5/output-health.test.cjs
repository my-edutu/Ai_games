const test=require('node:test');
const assert=require('node:assert/strict');
const {OperationalOutputHealth,OutputRecoveryWorkflow}=require('../../dist/packages/output-health/src/index.js');

function monitor(){return new OperationalOutputHealth({staleAfterMs:1000,frozenAfterMs:1500,silenceAfterMs:1200,blackLumaThreshold:0.01,queueWarnRatio:0.8,memorySlopeWarnMbPerHour:20});}
function healthy(overrides={}){return{nowMs:2000,lastSnapshotMs:1900,lastFrameChangeMs:1950,luma:0.3,expectedScene:'normal',actualScene:'normal',lastAudioMs:1950,intendedSilence:false,queueUtilization:0.2,memorySlopeMbPerHour:1,...overrides};}

test('black plus frozen output is unsafe and requires an intentional safe scene',()=>{
  const result=monitor().check(healthy({luma:0,lastFrameChangeMs:0}));
  assert.equal(result.status,'unsafe');
  assert.ok(result.reasons.includes('black'));
  assert.ok(result.reasons.includes('frozen'));
  assert.equal(result.action,'safe-slate');
});

test('intended silence is not classified as an audio outage',()=>{
  const result=monitor().check(healthy({lastAudioMs:0,intendedSilence:true}));
  assert.equal(result.reasons.includes('silent'),false);
  assert.equal(result.status,'healthy');
});

test('single stale snapshot degrades and rebuilds without inventing a game loss',()=>{
  const result=monitor().check(healthy({lastSnapshotMs:0}));
  assert.equal(result.status,'degraded');
  assert.equal(result.action,'rebuild');
  assert.equal(result.publicCopy,'Restoring live game view');
});

test('queue and memory pressure trigger quality reduction while preserving critical truth',()=>{
  const result=monitor().check(healthy({queueUtilization:0.95,memorySlopeMbPerHour:30}));
  assert.equal(result.status,'degraded');
  assert.ok(result.reasons.includes('queue-pressure'));
  assert.ok(result.reasons.includes('memory-slope'));
  assert.ok(result.operations.includes('reduce-quality'));
});

test('unsafe recovery cannot resume before snapshot and output verification',()=>{
  const flow=new OutputRecoveryWorkflow({maxAttempts:2});
  assert.equal(flow.begin({status:'unsafe',reasons:['black','frozen'],action:'safe-slate'}).state,'safe-scene');
  assert.equal(flow.advance({componentRestarted:true}).state,'rebuilding');
  assert.equal(flow.advance({snapshotVerified:false,outputHealthy:true}).state,'verifying');
  assert.equal(flow.advance({snapshotVerified:true,outputHealthy:true}).state,'resumed');
});

test('repeated failed verification halts safely instead of looping forever',()=>{
  const flow=new OutputRecoveryWorkflow({maxAttempts:2});
  flow.begin({status:'unsafe',reasons:['stale','black'],action:'safe-slate'});
  flow.advance({componentRestarted:true});
  flow.advance({snapshotVerified:false,outputHealthy:false});
  assert.equal(flow.advance({snapshotVerified:false,outputHealthy:false}).state,'halted');
});