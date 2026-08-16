const test=require('node:test');
const assert=require('node:assert/strict');
const {MetricRegistry,AlertEngine}=require('../../dist/packages/observability/src/index.js');
const {OperatorControlPlane}=require('../../dist/packages/operator-control/src/index.js');

test('metric registry bounds series cardinality and rejects private labels',()=>{
  const metrics=new MetricRegistry({maxSeries:3,maxLabelLength:32});
  assert.equal(metrics.observe('tick_ms',4,{component:'simulation',version:'1'}),'recorded');
  assert.equal(metrics.observe('tick_ms',5,{component:'simulation',version:'1'}),'recorded');
  assert.equal(metrics.observe('queue_depth',2,{queue:'events'}),'recorded');
  assert.equal(metrics.observe('memory_mb',80,{component:'simulation'}),'recorded');
  assert.equal(metrics.observe('extra',1,{component:'renderer'}),'dropped-cardinality');
  assert.throws(()=>metrics.observe('bad',1,{viewerId:'secret'}),e=>e.code==='PRIVATE_LABEL');
  assert.equal(metrics.snapshot().series.length,3);
  assert.equal(metrics.snapshot().droppedSeries,1);
});

test('alert rules require sustained breach and sustained recovery',()=>{
  const alerts=new AlertEngine([{id:'tick-p99',metric:'tick_ms',operator:'gt',threshold:20,forSamples:2,recoverSamples:2,severity:'page',runbook:'runbooks/tick-latency.md'}]);
  assert.deepEqual(alerts.evaluate({tick_ms:25},1),[]);
  const fired=alerts.evaluate({tick_ms:30},2);
  assert.equal(fired[0].type,'fired');
  assert.equal(fired[0].runbook,'runbooks/tick-latency.md');
  assert.deepEqual(alerts.evaluate({tick_ms:10},3),[]);
  const resolved=alerts.evaluate({tick_ms:10},4);
  assert.equal(resolved[0].type,'resolved');
});

test('operator plane is environment-scoped, role-gated and idempotent',()=>{
  const plane=new OperatorControlPlane({environment:'production',auditCapacity:20});
  const denied=plane.execute({id:'1',actor:'viewer',role:'viewer',environment:'production',action:'safe-scene',reason:'test'},1);
  assert.equal(denied.status,'denied');
  const wrong=plane.execute({id:'2',actor:'oncall',role:'operator',environment:'staging',action:'safe-scene',reason:'test'},2);
  assert.equal(wrong.status,'denied');
  assert.equal(wrong.reason,'environment-mismatch');
  const accepted=plane.execute({id:'3',actor:'oncall',role:'operator',environment:'production',action:'safe-scene',reason:'incident'},3);
  assert.equal(accepted.status,'accepted');
  assert.equal(plane.state().safeScene,true);
  const duplicate=plane.execute({id:'3',actor:'oncall',role:'operator',environment:'production',action:'safe-scene',reason:'incident'},4);
  assert.equal(duplicate.status,'duplicate');
  assert.equal(plane.audit().filter(x=>x.commandId==='3').length,1);
});

test('independent disable switches preserve autonomous simulation truth',()=>{
  const plane=new OperatorControlPlane({environment:'production'});
  plane.execute({id:'a',actor:'oncall',role:'operator',environment:'production',action:'disable-interactions',reason:'provider'},1);
  plane.execute({id:'b',actor:'oncall',role:'operator',environment:'production',action:'disable-public-text',reason:'moderation'},2);
  const state=plane.state();
  assert.equal(state.interactionsEnabled,false);
  assert.equal(state.publicTextEnabled,false);
  assert.equal(state.simulationEnabled,true);
});

test('high-risk restore, fresh-run and halt actions require admin',()=>{
  const plane=new OperatorControlPlane({environment:'production'});
  for(const action of ['verified-restore','fresh-run','emergency-halt']){
    assert.equal(plane.execute({id:`op-${action}`,actor:'operator',role:'operator',environment:'production',action,reason:'test'},1).status,'denied');
    assert.equal(plane.execute({id:`admin-${action}`,actor:'admin',role:'admin',environment:'production',action,reason:'test'},2).status,'accepted');
  }
  assert.equal(plane.state().emergencyHalt,true);
  assert.equal(plane.state().simulationEnabled,false);
});