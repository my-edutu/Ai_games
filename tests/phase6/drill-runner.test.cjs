const test=require('node:test');
const assert=require('node:assert/strict');
const {runSyntheticDrillProgramme,MANDATORY_DRILLS,assessDrillProgramme}=require('../../dist/packages/release-validation/src/index.js');

test('synthetic drill runner executes every mandatory runbook deterministically',()=>{
  const a=runSyntheticDrillProgramme('candidate'),b=runSyntheticDrillProgramme('candidate');assert.deepEqual(a,b);assert.equal(a.records.length,MANDATORY_DRILLS.length);assert.deepEqual(a.records.map(r=>r.id),[...MANDATORY_DRILLS]);assert.ok(a.records.every(r=>r.status==='pass'));
});

test('synthetic programme proves implementation but remains blocked for production evidence',()=>{
  const report=runSyntheticDrillProgramme('candidate'),assessment=assessDrillProgramme(report.records,{expectedCandidateChecksum:'candidate'});assert.equal(assessment.implementationStatus,'pass');assert.equal(assessment.productionStatus,'blocked');assert.equal(assessment.completed,MANDATORY_DRILLS.length);
});

test('key drill observations prove real control and recovery consequences',()=>{
  const byId=Object.fromEntries(runSyntheticDrillProgramme('candidate').records.map(record=>[record.id,record]));
  assert.equal(byId['provider-outage'].observations.simulationAdvanced,true);assert.equal(byId['provider-outage'].observations.interactionsDisabled,true);
  assert.equal(byId['persistence-failure'].observations.commandRejectedBeforeAuthority,true);
  assert.equal(byId['verified-restore'].observations.checksumMatch,true);
  assert.equal(byId['older-snapshot-fallback'].observations.olderSnapshotUsed,true);
  assert.equal(byId['divergence-quarantine'].observations.quarantined,true);
  assert.equal(byId['black-output'].observations.safeScene,true);
  assert.equal(byId['emergency-halt'].observations.simulationEnabled,false);
  assert.equal(byId['alert-escalation'].observations.alertFired,true);
});