'use strict';
const{createMazeValidationBundle}=require('../dist/games/ai-maze-escape/src/release/validation.js');
const{scoreMazeReadiness}=require('../dist/games/ai-maze-escape/src/release/score.js');
const sha=process.env.CANDIDATE_SOURCE_SHA||process.argv[2];
if(!sha){console.error('CANDIDATE_SOURCE_SHA is required');process.exit(2)}
const bundle=createMazeValidationBundle(sha),score=scoreMazeReadiness(bundle),report={schemaVersion:1,candidateSourceSha:sha,softwareVerdict:bundle.softwareVerdict,readiness:bundle.readiness,score,campaign:{runs:bundle.campaign.baseline.totalRuns+bundle.campaign.pressure.length,baselineEscapes:bundle.campaign.baseline.escapes,pressureEscapes:bundle.campaign.pressure.filter(item=>item.result==='escape').length,invariantFailures:bundle.campaign.totalInvariantFailures,duplicateApplications:bundle.campaign.totalDuplicateApplications,reportChecksum:bundle.campaign.reportChecksum},chaos:bundle.chaos,bundleChecksum:bundle.bundleChecksum};
process.stdout.write(`${JSON.stringify(report)}\n`);
if(bundle.softwareVerdict!=='PASS'||bundle.readiness.verdict==='FAIL')process.exitCode=1;
