'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {assessFloorsRelease,buildFloorsReleaseManifest}=require('../../dist/games/ai-vs-1000-floors/src/release/readiness.js');

const softwareEvidence=(overrides={})=>({sourceClass:'ci',exactCandidate:true,independentReview:false,softwareTests:true,browserVerification:true,chaosCampaign:true,rollbackDrill:true,providerCredentialed:false,endurance72h:false,canary7d:false,witnessedRecovery:false,...overrides});

test('complete CI evidence is capped at R4 and cannot claim production readiness',()=>{const result=assessFloorsRelease(softwareEvidence());assert.equal(result.verdict,'BLOCKED');assert.equal(result.highestTruthfulReadiness,'R4');assert.equal(result.productionReady,false);assert.ok(result.blockers.includes('real-72-hour-endurance'));assert.ok(result.blockers.includes('real-seven-day-canary'));assert.ok(result.blockers.includes('credentialed-provider'))});

test('missing software gate lowers readiness below R4',()=>{const result=assessFloorsRelease(softwareEvidence({browserVerification:false}));assert.equal(result.highestTruthfulReadiness,'R3');assert.ok(result.blockers.includes('browser-verification'))});

test('R5 requires exact production-reference evidence and independent review',()=>{const result=assessFloorsRelease(softwareEvidence({sourceClass:'production-reference',independentReview:true,providerCredentialed:true,endurance72h:true,canary7d:true,witnessedRecovery:true}));assert.equal(result.verdict,'PASS');assert.equal(result.highestTruthfulReadiness,'R5');assert.equal(result.productionReady,true);assert.deepEqual(result.blockers,[])});

test('release manifest freezes exact candidate and version identities',()=>{const manifest=buildFloorsReleaseManifest({candidateSha:'a'.repeat(40),createdAt:'2026-08-21T00:00:00Z',commands:['npm test','npm run test:browser'],artifactDigests:{tests:'deadbeef'}});assert.equal(manifest.candidateSha,'a'.repeat(40));assert.equal(manifest.deterministicVersion,'floors-r1-v1');assert.equal(manifest.contentVersion,'floors-content-v1');assert.equal(manifest.influenceVersion,'floors-influence-v1');assert.match(manifest.manifestDigest,/^[0-9a-f]{8}$/);assert.throws(()=>buildFloorsReleaseManifest({...manifest,candidateSha:'short'}),/candidateSha/)});
