const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const repo=path.resolve(__dirname,'../..');
const expectedFiles=['bundle-manifest.json','campaign-report.json','canary-report.json','capacity-report.json','drill-report.json','endurance-report.json','external-evidence-required.json','provider-report.json','readiness-verdict.json','release-manifest.json','safety-report.json','software-validation.json','traceability-report.json'];
function execute(output){execFileSync(process.execPath,[path.join(repo,'scripts/run-phase6-validation.cjs'),'phase6-test',output],{cwd:repo,env:{...process.env,CANDIDATE_SHA:'c'.repeat(40),SOURCE_DATE_EPOCH_MS:'1700000000000',PHASE6_RUNS:'2',PHASE6_MAX_TICKS:'80'},stdio:'pipe'});return Object.fromEntries(expectedFiles.map(name=>[name,fs.readFileSync(path.join(output,name),'utf8')]))}

test('candidate validation script emits a deterministic complete software evidence bundle',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'snake-phase6-'));
  const first=execute(dir),second=execute(dir);
  assert.deepEqual(first,second);
  assert.deepEqual(fs.readdirSync(dir).sort(),[...expectedFiles].sort());
});

test('candidate bundle captures exact source and remains truthfully blocked by external evidence',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'snake-phase6-truth-'));execute(dir);
  const release=JSON.parse(fs.readFileSync(path.join(dir,'release-manifest.json'),'utf8'));
  const readiness=JSON.parse(fs.readFileSync(path.join(dir,'readiness-verdict.json'),'utf8'));
  const software=JSON.parse(fs.readFileSync(path.join(dir,'software-validation.json'),'utf8'));
  const external=JSON.parse(fs.readFileSync(path.join(dir,'external-evidence-required.json'),'utf8'));
  assert.equal(release.candidateSourceSha,'c'.repeat(40));
  assert.equal(readiness.verdict,'BLOCKED');
  assert.equal(readiness.highestTruthfulReadiness,'R4');
  assert.equal(readiness.productionReady,false);
  assert.equal(software.status,'pass');
  assert.equal(software.externalEvidenceSatisfied,false);
  assert.ok(external.required.includes('72-hour-production-endurance'));
  assert.ok(external.required.includes('seven-day-production-canary'));
  assert.ok(readiness.blockers.includes('production-reference-capacity'));
  assert.ok(readiness.blockers.includes('independent-review'));
});

test('candidate bundle contains no fabricated live-provider, elapsed-soak or independent-review pass',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'snake-phase6-evidence-'));execute(dir);
  const providers=JSON.parse(fs.readFileSync(path.join(dir,'provider-report.json'),'utf8'));
  const endurance=JSON.parse(fs.readFileSync(path.join(dir,'endurance-report.json'),'utf8'));
  const canary=JSON.parse(fs.readFileSync(path.join(dir,'canary-report.json'),'utf8'));
  assert.equal(providers.status,'blocked');
  assert.equal(endurance.status,'blocked');
  assert.notEqual(canary.status,'eligible');
});
