const test=require('node:test');
const assert=require('node:assert/strict');
const {createReleaseManifest,verifyReleaseManifest,detectMaterialChanges,assessTraceability}=require('../../dist/packages/release-governance/src/index.js');

function manifest(overrides={}){
  return createReleaseManifest({
    releaseId:'snake-r5-candidate-1',candidateSourceSha:'74e9319f74985e224f3abd909a6d19ba06ac996d',createdAtMs:1000,
    versions:{platform:'0.6.0',game:'snake-1.0.0',deterministic:'snake-r2',snapshot:'1',event:'1',providerAdapters:'2026-08-16',configHash:'cfg-a',contentHash:'content-a',assetsHash:'assets-a',deploymentArtifact:'image@sha256:abc'},
    environment:{name:'canary',region:'eu-west',hardwareRef:'ci-reference',productionReference:false},
    featureFlags:{chatVsAi:true,publicText:true,quality:'high'},
    owners:{release:'release@example.invalid',onCall:'oncall@example.invalid',security:'security@example.invalid',product:'product@example.invalid'},
    rollback:{sourceSha:'bee0d26e8746a554c96afaedbd1ad5a9842dabc6',deploymentArtifact:'image@sha256:previous',configHash:'cfg-prev',contentHash:'content-prev',freshRunBoundary:true},
    artifacts:[{name:'phase5-operations',kind:'test-evidence',digest:'sha256:1007c478bc533afa094e610545a6b6c9c7c31eaa5a4a661411227bd58810df79'}],
    ...overrides
  });
}

test('release manifest is canonical, deeply immutable and checksum-verifiable',()=>{
  const a=manifest(),b=manifest();
  assert.equal(a.checksum,b.checksum);
  assert.equal(verifyReleaseManifest(a).valid,true);
  assert.equal(Object.isFrozen(a),true);
  assert.equal(Object.isFrozen(a.versions),true);
  assert.throws(()=>{a.versions.game='changed'});
  const tampered=JSON.parse(JSON.stringify(a));tampered.versions.game='changed';
  assert.equal(verifyReleaseManifest(tampered).valid,false);
  assert.ok(verifyReleaseManifest(tampered).issues.includes('checksum-mismatch'));
});

test('manifest rejects missing rollback, owners, hashes and mutable production identity',()=>{
  assert.throws(()=>createReleaseManifest({...manifest(),checksum:undefined,owners:{release:'',onCall:'',security:'',product:''}}),e=>e.code==='INVALID_MANIFEST');
  assert.throws(()=>createReleaseManifest({...manifest(),checksum:undefined,rollback:{sourceSha:'',deploymentArtifact:'',configHash:'',contentHash:'',freshRunBoundary:false}}),e=>e.code==='INVALID_MANIFEST');
  assert.throws(()=>createReleaseManifest({...manifest(),checksum:undefined,versions:{...manifest().versions,contentHash:''}}),e=>e.code==='INVALID_MANIFEST');
});

test('material change detection identifies which validation clocks must reset',()=>{
  const frozen=manifest();
  assert.deepEqual(detectMaterialChanges(frozen,frozen),{material:false,categories:[],invalidatedGates:[]});
  const changed={...frozen,versions:{...frozen.versions,contentHash:'content-b',providerAdapters:'2026-08-17'},featureFlags:{...frozen.featureFlags,chatVsAi:false}};
  const result=detectMaterialChanges(frozen,changed);
  assert.equal(result.material,true);
  assert.deepEqual(result.categories,['content','feature-flags','provider-adapters']);
  assert.ok(result.invalidatedGates.includes('simulation-campaign'));
  assert.ok(result.invalidatedGates.includes('provider-validation'));
  assert.ok(result.invalidatedGates.includes('canary-clock'));
});

test('traceability requires one current passing evidence item for every MUST requirement',()=>{
  const release=manifest();
  const requirements=[
    {id:'FR-SNK-DET-001',phase:1,level:'MUST',owner:'simulation'},
    {id:'FR-SNK-OPS-RECOVERY',phase:5,level:'MUST',owner:'operations'},
    {id:'FR-SNK-NICE',phase:3,level:'SHOULD',owner:'presentation'}
  ];
  const evidence=[
    {requirementId:'FR-SNK-DET-001',status:'pass',sourceSha:release.candidateSourceSha,releaseChecksum:release.checksum,digest:'sha256:det',collectedAtMs:900,owner:'simulation'},
    {requirementId:'FR-SNK-OPS-RECOVERY',status:'pass',sourceSha:release.candidateSourceSha,releaseChecksum:release.checksum,digest:'sha256:ops',collectedAtMs:950,owner:'operations'}
  ];
  const result=assessTraceability(requirements,evidence,{release,nowMs:1000});
  assert.equal(result.status,'complete');
  assert.deepEqual(result.missing,[]);
});

test('traceability blocks missing, stale, duplicate, wrong-source and prohibited waiver evidence',()=>{
  const release=manifest();
  const requirements=[{id:'MUST-1',phase:6,level:'MUST',owner:'release'},{id:'MUST-2',phase:6,level:'MUST',owner:'security'}];
  const evidence=[
    {requirementId:'MUST-1',status:'pass',sourceSha:'old',releaseChecksum:release.checksum,digest:'sha256:a',collectedAtMs:1,expiresAtMs:10,owner:'release'},
    {requirementId:'MUST-1',status:'pass',sourceSha:release.candidateSourceSha,releaseChecksum:release.checksum,digest:'sha256:b',collectedAtMs:2,owner:'release'},
    {requirementId:'MUST-2',status:'waived',sourceSha:release.candidateSourceSha,releaseChecksum:release.checksum,digest:'sha256:c',collectedAtMs:3,owner:'security',findingSeverity:'P1',acceptedBy:'lead'}
  ];
  const result=assessTraceability(requirements,evidence,{release,nowMs:100});
  assert.equal(result.status,'blocked');
  assert.ok(result.duplicates.includes('MUST-1'));
  assert.ok(result.stale.includes('MUST-1'));
  assert.ok(result.wrongSource.includes('MUST-1'));
  assert.ok(result.prohibitedWaivers.includes('MUST-2'));
});

test('accepted P2 waiver is explicit but does not hide evidence metadata',()=>{
  const release=manifest();
  const result=assessTraceability([{id:'MUST-P2',phase:6,level:'MUST',owner:'release'}],[{requirementId:'MUST-P2',status:'waived',sourceSha:release.candidateSourceSha,releaseChecksum:release.checksum,digest:'sha256:p2',collectedAtMs:100,owner:'release',findingSeverity:'P2',acceptedBy:'release-owner',waiverReason:'Documented external limitation'}],{release,nowMs:101});
  assert.equal(result.status,'complete');
  assert.deepEqual(result.acceptedWaivers,['MUST-P2']);
});