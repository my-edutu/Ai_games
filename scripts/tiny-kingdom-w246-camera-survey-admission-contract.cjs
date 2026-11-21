'use strict';
// W246: isolated, deterministic test of the real camera survey admission policy.
// This verifies physical coverage, not visibility quality or a measured FPS gain.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const m=html.match(/<script>([\s\S]*?)<\/script>/);
assert(m,'the actual autonomous Tiny Kingdom script must be present');
new vm.Script(m[1],{filename:'tiny-kingdom-actual-game.js'});
const start=m[1].indexOf('function planBoundedCameraScenicSurvey(');
const end=m[1].indexOf('\nfunction planCitizenCamera(',start);
assert(start>=0&&end>start,'original camera director must have a bounded physical-first visual survey');
const select=vm.runInNewContext(m[1].slice(start,end)+'\nplanBoundedCameraScenicSurvey');
const rows=[];
for(let angle=0;angle<12;angle++)for(let shot=0;shot<24;shot++)
 rows.push({angleIndex:angle,ordinal:rows.length,coarse:shot+angle*.03,
  shot:{blockers:0,eyeCollision:{clear:true},eye:[angle,2,shot]}});
const result=select(rows,126);
assert.equal(result.length,126,'original desktop physical scout must cap expensive visual projections');
assert.equal(new Set(result.map(r=>r.ordinal)).size,result.length,'no duplicated surveyed views');
assert.equal(new Set(result.map(r=>r.angleIndex)).size,12,
 'all twelve original physical yaw bearings retain at least one legal probe');
assert(result.every(r=>rows.includes(r)),'all camera probes are original physical views, never invented imagery');
const blocked=rows.map(r=>({...r,shot:{...r.shot,blockers:1,eyeCollision:{clear:false}}}));
assert.equal(select(blocked,40).length,40,'when all original angles are blocked the director still returns bounded fallbacks');
assert.throws(()=>select(rows,0),/invalid camera survey/i);
const candidate=m[1].slice(m[1].indexOf('function planCitizenCamera('),m[1].indexOf('function isReadableClosedHomeShot('));
assert.match(candidate,/planBoundedCameraScenicSurvey\(possibilities,/,
 'real camera candidates must be cheaply screened before expensive projection');
assert.match(candidate,/const scenic=\(working\|\|journeyCamera\)\?foregroundSceneProjection/,
 'the final candidate survey must still see all real buildings, freight and posts');
assert.match(candidate,/marketCourierPostSightline\(option\.shot\.eye,target\)/,
 'the true unloading post obstruction must remain scored at full precision');
assert.match(candidate,/followRayBlockers\(eye,target,roofs\)/,
 'physical roof/body occlusion must never be removed to gain synthetic speed');
assert.match(candidate,/surveyMax=portraitLens\?78:56/,
 'the previous bounded high-quality final camera review must still run');
console.log('W246 real camera physical-first survey source contract PASS; no native-GPU, video or commercial-quality claim.');
