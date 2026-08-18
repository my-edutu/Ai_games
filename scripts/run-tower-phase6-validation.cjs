'use strict';
const{createTowerValidationBundle}=require('../dist/games/infinite-tower-climb/src/release/validation.js');
const{scoreTowerReadiness}=require('../dist/games/infinite-tower-climb/src/release/score.js');
const candidate=process.env.CANDIDATE_SOURCE_SHA||process.argv[2];
if(!candidate){console.error('CANDIDATE_SOURCE_SHA or an exact candidate SHA is required');process.exit(2)}
const bundle=createTowerValidationBundle(candidate),score=scoreTowerReadiness(bundle),report={candidateSourceSha:candidate,bundle,score};
process.stdout.write(`${JSON.stringify(report,null,2)}\n`);
if(bundle.softwareVerdict!=='PASS')process.exitCode=1;
