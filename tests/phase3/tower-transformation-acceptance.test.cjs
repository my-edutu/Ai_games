'use strict';
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
let evaluateTransformation;
before(async () => ({evaluateTransformation} = await import(pathToFileURL(path.resolve(__dirname, '../../public/infinite-tower-climb/gauntlet/transformation-gate.mjs')).href)));

const baseline = 'a'.repeat(40), candidate = 'b'.repeat(40);
const scenes = ['ascent', 'danger', 'outcome'];
function fixture() {
  return {
    schemaVersion: 1,
    baseline: { sha: baseline, title: 'frozen before' },
    candidate: { sha: candidate, title: 'transformed game' },
    scenarios: scenes.map(id => ({id, label:id, seed:'seed-'+id, quality:'high', viewport:'960x600',
      baseline: {sourceSha:baseline, url:`/tower/gauntlet/evidence/${id}-before.webm`, seconds:65, seed:'seed-'+id, viewport:'960x600', quality:'high', realGameplay:true, captureVerified:true},
      candidate: {sourceSha:candidate, url:`/tower/gauntlet/evidence/${id}-after.webm`, seconds:65, seed:'seed-'+id, viewport:'960x600', quality:'high', realGameplay:true, captureVerified:true}
    })),
    reviews: Object.fromEntries(['looks','feels','plays'].map(pillar => [pillar,
      [1,2,3,4,5].map(n => ({criticId:`r${n}`, independent:true, blind:true, randomized:true,
        winner:n<5?'candidate':'baseline', evidence:`Compared ${pillar} in actual ascent, danger and outcome footage and found meaningful change.`,
        scenarios:[...scenes] }))])),
    guardrails: {ci:'pass', replay:'pass', accessibility:'pass', performance:'pass', stability:'pass'},
    unresolvedCriticalIssues: 0,
  };
}
test('passing CI without paired gameplay and independent votes cannot verify transformation', () => {
  const a=fixture(); a.candidate.sha=null; a.scenarios=[];a.reviews={looks:[],feels:[],plays:[]};
  assert.notEqual(evaluateTransformation(a).status,'TRANSFORMATION_VERIFIED');
  assert.equal(evaluateTransformation(a).status,'NOT_EVALUATED');
});
test('verified major upgrade needs five blind critics, 4/5 new-game preference on each dimension', () => {
  const result=evaluateTransformation(fixture());
  assert.equal(result.status,'TRANSFORMATION_VERIFIED');
  for (const id of ['looks','feels','plays']) {
    assert.equal(result.pillars[id].candidateVotes,4);
    assert.equal(result.pillars[id].status,'SUBSTANTIALLY_BETTER');
  }
});
test('screenshot or one scene cannot stand in for three continuous gameplay comparisons', () => {
  const a=fixture();a.scenarios[1].candidate.url='/tower/gauntlet/evidence/fancy-screenshot.png';
  assert.notEqual(evaluateTransformation(a).status,'TRANSFORMATION_VERIFIED');
  assert.ok(evaluateTransformation(a).missing.some(x=>x.includes('danger')));
});
test('an unblinded review or a duplicated critic cannot vote a transformation through', () => {
  const a=fixture();
  a.reviews.looks[3].blind=false;
  a.reviews.looks[4].criticId='r2';
  assert.notEqual(evaluateTransformation(a).status,'TRANSFORMATION_VERIFIED');
});
test('passing looks and feels is not acceptance when actual play loses', () => {
  const a=fixture();a.reviews.plays.forEach(v=>v.winner='baseline');
  const result=evaluateTransformation(a);
  assert.equal(result.status,'NOT_SUBSTANTIALLY_BETTER');
  assert.equal(result.pillars.plays.status,'NO_PREFERENCE_WIN');
});
test('major gameplay improvement cannot conceal performance or determinism regressions', () => {
  const a=fixture();a.guardrails.replay='fail';
  assert.equal(evaluateTransformation(a).status,'BLOCKED_BY_REGRESSION');
  const b=fixture();b.unresolvedCriticalIssues=1;
  assert.equal(evaluateTransformation(b).status,'BLOCKED_BY_REGRESSION');
});
test('missing reviewer explanations and missing authentic source provenance do not count', () => {
  const a=fixture();a.reviews.feels[0].evidence='nice';
  assert.notEqual(evaluateTransformation(a).status,'TRANSFORMATION_VERIFIED');
  const b=fixture();b.scenarios[0].baseline.sourceSha=candidate;
  assert.notEqual(evaluateTransformation(b).status,'TRANSFORMATION_VERIFIED');
});
