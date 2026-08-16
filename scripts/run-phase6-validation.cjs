#!/usr/bin/env node
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createCurrentValidationBundle}=require('../dist/packages/release-validation/src/index.js');

function sha256(text){return`sha256:${crypto.createHash('sha256').update(text).digest('hex')}`}
function json(value){return JSON.stringify(value,null,2)+'\n'}
function write(directory,name,value){const text=json(value);fs.writeFileSync(path.join(directory,name),text,'utf8');return{name,digest:sha256(text),bytes:Buffer.byteLength(text)}}

const first=process.argv[2];
const second=process.argv[3];
const legacySha=/^[a-f0-9]{40}$/i.test(first||'')&&!second;
const candidateSourceSha=process.env.CANDIDATE_SHA||process.env.CANDIDATE_SOURCE_SHA||process.env.GITHUB_SHA||(legacySha?first:'');
if(!/^[a-f0-9]{40}$/i.test(candidateSourceSha||'')){
  console.error('CANDIDATE_SHA, CANDIDATE_SOURCE_SHA, GITHUB_SHA, or a full Git commit SHA argument is required.');
  process.exit(2);
}

const seed=legacySha?`phase6:${candidateSourceSha.slice(0,12)}`:(first||'phase6-candidate');
const outputDirectory=legacySha?null:(second||path.resolve('artifacts/phase6'));
const bundle=createCurrentValidationBundle(candidateSourceSha);

if(!outputDirectory){process.stdout.write(json(bundle));process.exit(0)}
fs.mkdirSync(outputDirectory,{recursive:true});

const softwarePass=bundle.traceability.status==='complete'&&bundle.campaign.totalInvariantFailures===0&&bundle.campaign.totalDuplicateApplications===0&&bundle.campaign.deterministicRerunReady&&bundle.capacity.performancePass&&bundle.drills.implementationStatus==='pass'&&bundle.readiness.failures.length===0;
const externalRequired={
  schemaVersion:1,
  candidateSourceSha,
  required:[
    'production-reference-capacity','credentialed-youtube-provider','credentialed-twitch-provider',
    'production-equivalent-safety-attestations','externally-witnessed-operational-drills',
    '72-hour-production-endurance','seven-day-production-canary','independent-review'
  ],
  satisfied:bundle.readiness.verdict==='PASS'
};
const softwareValidation={schemaVersion:1,candidateSourceSha,seed,status:softwarePass?'pass':'fail',externalEvidenceSatisfied:bundle.readiness.verdict==='PASS',releaseChecksum:bundle.manifest.checksum,campaignChecksum:bundle.campaign.reportChecksum,bundleChecksum:bundle.bundleChecksum};
const drillReport={schemaVersion:1,programme:bundle.drillProgramme,assessment:bundle.drills,status:bundle.drills.implementationStatus,productionStatus:bundle.drills.productionStatus};

const files=[];
files.push(write(outputDirectory,'release-manifest.json',bundle.manifest));
files.push(write(outputDirectory,'traceability-report.json',bundle.traceability));
files.push(write(outputDirectory,'campaign-report.json',bundle.campaign));
files.push(write(outputDirectory,'capacity-report.json',bundle.capacity));
files.push(write(outputDirectory,'endurance-report.json',bundle.endurance));
files.push(write(outputDirectory,'provider-report.json',bundle.providers));
files.push(write(outputDirectory,'safety-report.json',bundle.safety));
files.push(write(outputDirectory,'drill-report.json',drillReport));
files.push(write(outputDirectory,'canary-report.json',bundle.canary));
files.push(write(outputDirectory,'readiness-verdict.json',bundle.readiness));
files.push(write(outputDirectory,'software-validation.json',softwareValidation));
files.push(write(outputDirectory,'external-evidence-required.json',externalRequired));
const manifest={schemaVersion:1,candidateSourceSha,seed,releaseChecksum:bundle.manifest.checksum,bundleChecksum:bundle.bundleChecksum,readinessVerdict:bundle.readiness.verdict,productionReady:bundle.readiness.productionReady,files};
write(outputDirectory,'bundle-manifest.json',manifest);
process.stdout.write(json({outputDirectory,candidateSourceSha,seed,verdict:bundle.readiness.verdict,highestTruthfulReadiness:bundle.readiness.highestTruthfulReadiness,productionReady:bundle.readiness.productionReady}));
