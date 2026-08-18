'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {runCivilizationCampaign}=require('../../dist/games/ai-civilization/src/testing/campaign.js');

test('campaign aggregate is deterministic and reports bounded integrity, diversity and drama evidence',()=>{
  const options={seeds:12,maxDays:1200,scenario:'typical-pressure'};
  const clock=()=>{let t=0;return()=>{t+=0.125;return t}};
  const a=runCivilizationCampaign(options,clock());
  const b=runCivilizationCampaign(options,clock());
  assert.deepEqual(a,b);
  assert.equal(a.invalidWorlds,0);
  assert.equal(a.invalidActions,0);
  assert.equal(a.integrityFailures,0);
  assert.ok(a.duration.p95<=options.maxDays);
  assert.ok(Object.keys(a.goalCounts).length>=3);
  assert.ok(a.checksumUnique>=Math.floor(options.seeds*0.75));
  assert.ok(a.dramaticPatterns.length>=3);
  assert.ok(a.tickP99Ms>0&&a.tickP99Ms<8);
  assert.ok(a.maxTickMs>=a.tickP99Ms&&a.maxTickMs<20);
});

test('declared scenario corpus yields multiple terminal reasons, strategies and at least one succession',()=>{
  const scenarios=['no-audience','typical-pressure','fallback-policy','max-world','pathological-seed'];
  const summaries=scenarios.map(s=>runCivilizationCampaign({seeds:8,maxDays:1200,scenario:s}));
  const reasons=new Set(summaries.flatMap(s=>Object.keys(s.outcomeCounts)));
  const goals=new Set(summaries.flatMap(s=>Object.keys(s.goalCounts)));
  assert.ok(reasons.size>=2,[...reasons].join(','));
  assert.ok(goals.size>=4,[...goals].join(','));
  assert.ok(summaries.some(s=>s.successions>0));
  assert.ok(summaries.every(s=>s.invalidActions===0&&s.integrityFailures===0));
});
