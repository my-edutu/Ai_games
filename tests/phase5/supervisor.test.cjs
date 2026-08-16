const test=require('node:test');
const assert=require('node:assert/strict');
const {RunSupervisor}=require('../../dist/packages/supervisor/src/index.js');

function supervisor(){return new RunSupervisor({heartbeatTimeoutMs:1000,progressTimeoutMs:2000,crashThreshold:3,crashWindowMs:10000,breakerCooldownMs:5000,maxComponents:8});}

test('healthy required components produce no recovery action',()=>{
  const s=supervisor();
  for(const component of ['simulation','renderer','audio','gateway'])s.heartbeat({component,nowMs:1000,progressSeq:10,resourcePressure:0.2});
  const result=s.evaluate(1500);
  assert.equal(result.level,'healthy');
  assert.deepEqual(result.actions,[]);
});

test('gateway failure degrades interactions while autonomous simulation continues',()=>{
  const s=supervisor();
  s.heartbeat({component:'simulation',nowMs:1000,progressSeq:5,resourcePressure:0.1});
  s.heartbeat({component:'renderer',nowMs:1000,progressSeq:5,resourcePressure:0.1});
  s.heartbeat({component:'audio',nowMs:1000,progressSeq:5,resourcePressure:0.1});
  s.heartbeat({component:'gateway',nowMs:0,progressSeq:1,resourcePressure:0.1});
  const result=s.evaluate(1501);
  assert.equal(result.level,'degraded');
  assert.ok(result.actions.some(x=>x.type==='disable-interactions'));
  assert.ok(!result.actions.some(x=>x.type==='halt-simulation'));
});

test('stale simulation is unsafe and requires safe scene plus writer fencing',()=>{
  const s=supervisor();
  s.heartbeat({component:'simulation',nowMs:0,progressSeq:1,resourcePressure:0.1});
  s.heartbeat({component:'renderer',nowMs:1400,progressSeq:1,resourcePressure:0.1});
  const result=s.evaluate(1501);
  assert.equal(result.level,'unsafe');
  assert.ok(result.actions.some(x=>x.type==='safe-scene'));
  assert.ok(result.actions.some(x=>x.type==='fence-writer'));
});

test('no-progress simulation is distinguished from heartbeat loss',()=>{
  const s=supervisor();
  s.heartbeat({component:'simulation',nowMs:1000,progressSeq:4,resourcePressure:0.1});
  s.heartbeat({component:'simulation',nowMs:2500,progressSeq:4,resourcePressure:0.1});
  const result=s.evaluate(3101);
  assert.ok(result.reasons.includes('simulation-no-progress'));
  assert.ok(result.actions.some(x=>x.type==='verified-recovery'));
});

test('crash loop opens a bounded breaker and transitions to safe halt',()=>{
  const s=supervisor();
  s.recordCrash('simulation',100);
  s.recordCrash('simulation',200);
  s.recordCrash('simulation',300);
  const result=s.evaluate(301);
  assert.equal(s.component('simulation').breaker,'open');
  assert.ok(result.actions.some(x=>x.type==='safe-halt'));
  assert.equal(s.canRestart('simulation',1000),false);
  assert.equal(s.canRestart('simulation',5400),true);
});

test('component registry and crash history stay bounded',()=>{
  const s=supervisor();
  for(let i=0;i<30;i++)s.recordCrash('renderer',i*10);
  assert.ok(s.component('renderer').recentCrashes.length<=3);
  assert.throws(()=>s.heartbeat({component:'extra-9',nowMs:1,progressSeq:1,resourcePressure:0}),e=>e.code==='COMPONENT_CAPACITY');
});