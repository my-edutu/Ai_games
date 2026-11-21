'use strict';
// W515 RED: original real Day-121 captured winter source after 120-day
// accelerated history: season=3 with 4,232 near/far matching triangles.
// After saved restore in the SAME game summer season=1 with genuine
// 14,920 near / 9,576 far crop. Fixed-step authority was byte-identical.
// GREEN requires seasonal VBO sync before even one physical camera draw.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=src.indexOf('function render(now)'),
 end=src.indexOf('// Count only the correctly synchronized real planted mesh',start);
assert(start>0&&end>start,'RED: live camera crop sync missing');
const section=src.slice(start,end);
assert(section.includes('farmFieldResidentSeason!==climateAt(state.t).season'),
 'render must reject stale original winter VBO even with retained civic core');
assert(section.includes('prepareResidentFarmFields(climateAt(state.t).season)'),
 'actual two-buffer summer mesh upload needed before camera draw');
assert(section.includes('clearCivicSceneryCache()'),
 'GPU failure must schedule original CPU field fallback, not hide grain');
assert(src.includes('seasonMatchesAuthority:farmFieldResidentSeason===climateAt(state.t).season'));
assert(src.includes('renderSeasonSynchronizations:farmRenderSeasonSyncs'));
const live=[...src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(m=>m[1].includes('function render(now)'));
assert(live,'actual running game missing');new vm.Script(live[1]);
console.log('W515 real seasonal GPU crop sync source PASS, browser evidence separately required');
