'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const SHA='bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
function modules(){return{...require('../../dist/games/ai-maze-escape/src/release/validation.js'),...require('../../dist/games/ai-maze-escape/src/release/score.js')}}
test('current verified software candidate scores 88/100 but is not production ready',()=>{const{createMazeValidationBundle,scoreMazeReadiness}=modules(),bundle=createMazeValidationBundle(SHA),score=scoreMazeReadiness(bundle);assert.equal(score.score,88);assert.equal(score.grade,'Production Candidate');assert.equal(score.verdict,'BLOCKED');assert.equal(score.highestTruthfulReadiness,'R4');assert.equal(score.productionReady,false);assert.equal(score.categories.productionEvidence.score,0);assert.equal(score.categories.productionEvidence.max,12);assert.match(score.scoreChecksum,/^[0-9a-f]{8}$/)});
test('integrity failure caps the score below 60 even when most engineering gates pass',()=>{const{createMazeValidationBundle,scoreMazeReadiness}=modules(),bundle=createMazeValidationBundle(SHA,{integrity:{hiddenInformationViolations:1}}),score=scoreMazeReadiness(bundle);assert.equal(score.verdict,'FAIL');assert.ok(score.score<=59,JSON.stringify(score));assert.equal(score.grade,'Integrity Blocked')});
test('score cannot exceed 89 while any external R5 gate remains blocked',()=>{const{createMazeValidationBundle,scoreMazeReadiness}=modules(),score=scoreMazeReadiness(createMazeValidationBundle(SHA));assert.ok(score.score<=89);assert.ok(score.blockers.length>0)});
