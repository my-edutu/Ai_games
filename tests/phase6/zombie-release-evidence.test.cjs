'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
function release(){return require('../../dist/games/ai-zombie-survival/src/release/validation.js')}
const SHA_A='cccccccccccccccccccccccccccccccccccccccc',SHA_B='dddddddddddddddddddddddddddddddddddddddd';
test('Zombie release manifest artifacts are exact-candidate-bound software evidence',()=>{const{createZombieReleaseManifest}=release(),a=createZombieReleaseManifest(SHA_A),b=createZombieReleaseManifest(SHA_B);assert.equal(a.candidateSourceSha,SHA_A);assert.equal(a.versions.deterministic,'zombie-v4');assert.equal(a.rollback.sourceSha,'f3ee747272dc95e3f90e9caa625ab9d6a3f709bf');assert.notDeepEqual(a.artifacts.map(x=>x.digest),b.artifacts.map(x=>x.digest));assert.ok(a.artifacts.every(x=>x.kind==='software-evidence'));for(const artifact of a.artifacts)assert.match(artifact.digest,/^checksum:[a-f0-9]{8}$/)});
test('Zombie production drill catalogue is backed by the operations runbook',()=>{const{MANDATORY_DRILLS}=release(),runbook=fs.readFileSync(path.resolve(__dirname,'../../docs/operations/ai-zombie-survival-runbook.md'),'utf8');for(const id of MANDATORY_DRILLS)assert.ok(runbook.includes(`\`${id}\``),id);assert.match(runbook,/safe scene/i);assert.match(runbook,/verified restore/i);assert.match(runbook,/rollback/i);assert.match(runbook,/independent witness/i);assert.match(runbook,/72 real elapsed/i);assert.match(runbook,/seven-real-day canary/i)});
