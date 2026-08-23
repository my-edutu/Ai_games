'use strict';
const{createZombieValidationBundle}=require('../dist/games/ai-zombie-survival/src/release/validation.js');
const sha=process.env.CANDIDATE_SOURCE_SHA||process.argv[2];
if(!sha){console.error('CANDIDATE_SOURCE_SHA is required');process.exit(2)}
const bundle=createZombieValidationBundle(sha),report={schemaVersion:1,candidateSourceSha:sha,softwareVerdict:bundle.softwareVerdict,readiness:bundle.readiness,campaign:{baselineRuns:bundle.campaign.baseline.runs.length,pressureRuns:bundle.campaign.pressure.length,invariantFailures:bundle.campaign.totalInvariantFailures,duplicateApplications:bundle.campaign.totalDuplicateApplications,reportChecksum:bundle.campaign.reportChecksum},chaos:bundle.chaos,bundleChecksum:bundle.bundleChecksum};
process.stdout.write(`${JSON.stringify(report)}\n`);
if(bundle.softwareVerdict!=='PASS'||bundle.readiness.verdict==='FAIL')process.exitCode=1;
