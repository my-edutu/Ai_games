'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
function release(){return require('../../dist/games/ai-battle-royale/src/release/validation.js')}
const SHA_A='cccccccccccccccccccccccccccccccccccccccc',SHA_B='dddddddddddddddddddddddddddddddddddddddd';

test('Battle Royale release-manifest artifacts are candidate-bound software contracts',()=>{const{createBattleReleaseManifest}=release();const first=createBattleReleaseManifest(SHA_A),second=createBattleReleaseManifest(SHA_B);const firstDigests=first.artifacts.map(artifact=>artifact.digest),secondDigests=second.artifacts.map(artifact=>artifact.digest);assert.notDeepEqual(firstDigests,secondDigests);assert.ok(first.artifacts.every(artifact=>artifact.kind==='software-evidence'));for(const name of['battle-phase3-broadcast-contract','battle-phase5-operations-contract','battle-phase6-validation-contract'])assert.ok(first.artifacts.some(artifact=>artifact.name===name),name);for(const digest of firstDigests)assert.match(digest,/^checksum:[a-f0-9]{8}$/)});

test('the production drill catalogue is backed by the Battle Royale operations runbook',()=>{const{MANDATORY_DRILLS}=release();const runbookPath=path.resolve(__dirname,'../../docs/operations/ai-battle-royale-runbook.md');assert.equal(fs.existsSync(runbookPath),true,runbookPath);const content=fs.readFileSync(runbookPath,'utf8');for(const drillId of MANDATORY_DRILLS)assert.ok(content.includes(`\`${drillId}\``),`missing runbook drill ${drillId}`);assert.match(content,/safe scene/i);assert.match(content,/verified restore/i);assert.match(content,/rollback/i);assert.match(content,/independent witness/i)});

test('Phase 5, Phase 6, final review and R5 evidence-intake documents exist for Game 6',()=>{const required=['../../games/ai-battle-royale/phases/PHASE-05-RELIABILITY-OPERATIONS.md','../../games/ai-battle-royale/phases/PHASE-06-PRODUCTION-LAUNCH.md','../../docs/reviews/AI_BATTLE_ROYALE_FINAL_REVIEW.md','../../docs/release/AI_BATTLE_ROYALE_R5_EVIDENCE_INTAKE.md'];for(const relative of required){const file=path.resolve(__dirname,relative);assert.equal(fs.existsSync(file),true,file);assert.ok(fs.readFileSync(file,'utf8').length>500,file)}});
