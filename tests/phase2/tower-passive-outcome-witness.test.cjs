'use strict';
// Integrity-only checks: genuine DOM-visible result witnesses can fill gaps
// between the native browser screenshot diagnostics, but may never replace video.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {assessTowerMotion}=require('../../scripts/tower-motion-evidence.cjs');
function primary(){
  return [
    {atMs:0,tick:0,runToken:'run-one',scene:'running',checksum:'a',frames:1,
      canvasHash:'a',renderErrors:0,contextLost:false,frameMs:{samples:30}},
    {atMs:12000,tick:180,runToken:'run-one',scene:'running',checksum:'b',frames:20,
      canvasHash:'b',renderErrors:0,contextLost:false,frameMs:{samples:30}},
    {atMs:24000,tick:90,runToken:'run-two',scene:'running',checksum:'c',frames:50,
      canvasHash:'c',renderErrors:0,contextLost:false,frameMs:{samples:30}}
  ];
}
function witness(atMs,override={}){
  return {atMs,runToken:'run-one',scene:'intermission',
    sourceResult:{kind:'game',reason:'health-depleted'},
    observedResultCard:{visible:true,runToken:'run-one',title:'Expedition ended',
      height:'Height 1000'},...override};
}
test('passive source-backed painted-result witnesses require two 500ms-separated observations before a genuine new run',()=>{
  const opts={minDurationMs:20000,requireOutcomeRestart:true,
    outcomeWitness:[witness(12200),witness(12850)]};
  const a=assessTowerMotion(primary(),opts);
  assert.equal(a.scopedPass,true);
  assert.equal(a.observedOutcomeRestart,true);
  assert.equal(a.passiveOutcomeWitnessSamples,2);
  assert.match(a.outcomeVideoGate,/OPEN:/,'integrity must not self-certify real video');
});
test('a single, too-short, hidden, off-video or forged-run witness never certifies an outcome',()=>{
  const samples=primary();
  for(const witnesses of [
    [witness(12200)], [witness(12200),witness(12300)],
    [witness(12200),witness(12850,{runToken:'run-three'})],
    [witness(12200),witness(12850,{observedResultCard:{visible:false}})],
    [witness(12200),witness(30000)]
  ]){
    const a=assessTowerMotion(samples,{minDurationMs:20000,
      requireOutcomeRestart:true,outcomeWitness:witnesses});
    assert.equal(a.scopedPass,false,JSON.stringify(witnesses));
    assert.ok(a.blockers.includes('complete-terminal-intermission-restart-not-observed'));
  }
});
