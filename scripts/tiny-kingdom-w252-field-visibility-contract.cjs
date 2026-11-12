#!/usr/bin/env node
'use strict';
// W252 Phase 1 genuine farm-rail/IK camera geometry and physically retained
// low hurdle. Test-first RED was observed on W251 parent, then GREEN locally.
// Real 1024px/390px WebGL motion remains a separate experience requirement.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(process.env.TINY_KINGDOM_SOURCE||
 'public/tiny-kingdom/index.html','utf8');
const first=html.indexOf('function farmFenceLandmarkOcclusion('),
 last=html.indexOf('function getFarmWorkCameraAudit(){');
assert.ok(first>0&&last>first,'Must implement actual fence-screen camera ray survey');
const js=html.slice(first,last);
const ctx={Math,Number,Error,Array,
 FARMSTEAD:{fields:[[16.45,24.65,-1.62,3.64,12,17]]},
 FIELD_TO_GRANARY_GATE:[21.7,-2.45],terrain:()=>0};
vm.createContext(ctx);
vm.runInContext(js+'\nthis.score=farmFenceLandmarkOcclusion',ctx);
const farmer={job:'farmer',x:19,z:.2};
const closed=ctx.score([19,.4,-4],farmer);
assert.equal(closed.active,true);
assert.ok(closed.blockedLowerBody>=1,'Existing low hurdle must register honest physical obstruction');
assert.ok(closed.penalty>=260,'Occluded legs must affect camera ranking');
const interior=ctx.score([19,1.7,.1],farmer);
assert.equal(interior.blockedLowerBody,0,'Camera in original field must not intersect the boundary');
assert.equal(interior.penalty,0);
const gate=ctx.score([21.65,.4,-4],{...farmer,x:21.65});
assert.equal(gate.gatePassed,true,'Genuine 3-metre access gateway remains open');
assert.equal(gate.blockedLowerBody,0,'Gateway ray must not claim a nonexistent fence');
assert.equal(ctx.score([19,.4,-4],{...farmer,job:'builder'}).active,false);
assert.throws(()=>ctx.score([NaN,0,0],farmer),/invalid physical farm/);
const fence=html.slice(html.indexOf('function fenceLine('),html.indexOf('function well('));
assert.match(fence,/course<2/);
assert.match(fence,/segment<3/);
assert.match(fence,/for\(let i=0;i<=len;i\+\+\)/);
assert.match(fence,/span=3/);
assert.match(html,/shot\.farmFenceSightline=realFarmWork\?/);
assert.match(html,/\(shot\.farmFenceSightline\?\.penalty\|\|0\)/);
assert.equal((html.match(/\(!crop\|\|\(!crop\.cropFaceBlockers&&!crop\.cropWristBlockers&&/g)||[]).length,3);
assert.doesNotMatch(js,/Math\.random\(|people\.push\(|city\.push\(/);
console.log('W252 physical farmer lens contract PASS; actual WebGL appearance NOT PROVEN');
