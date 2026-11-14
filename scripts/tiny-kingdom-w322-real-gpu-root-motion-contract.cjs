'use strict';
// W322 Phase 1 RED-first: actual original 13-joint renderer must carry true
// citizen world translation and route heading, not animate at a frozen bind root.
// No simulated resource transaction, cloned actor or alternate game renderer.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(row=>row[1].includes('function workSkinFramePalette('));
assert(script,'original playable game source missing');
new vm.Script(script[1],{filename:'tiny-kingdom-original.js'});
const fragment=(begin,end)=>{
 const a=html.indexOf(begin),b=html.indexOf(end,a+begin.length);
 assert(a>=0&&b>a,'real production function missing: '+begin);
 return html.slice(a,b);
};
const source=[
 fragment('function workSkinPoint(', '// W128: EXACT full-detail'),
 fragment('function workSkinDetailedPoint(', 'function workSkinRigidMatrix('),
 fragment('function workSkinFramePalette(', 'function workSkinMatrices(')
].join('\n');
const person={name:'Bram',job:'farmer',activity:'Traveling to market',
 phase:1,x:0,z:0,path:[[0,5]],target:[0,5],workTimer:0};
const rig={
 working:false,
 legs:[-1,1].map(side=>({hip:[side*.12,.60,0],
  knee:[side*.12,.35,.08],ankle:[side*.12,.05,.10]})),
 arms:[-1,1].map(side=>({shoulder:[side*.30,1.015,0],
  elbow:[side*.30,.82,.12],wrist:[side*.33,.59,.30]}))
};
const body={spineShift:0,forwardLean:0,rise:0,headYaw:0,headPitch:0};
const height=(x,z)=>x*.12+z*.08,actual=[];
const context=vm.createContext({people:[person],state:{t:18},
 Float32Array,WORK_SKIN_PALETTE_FLOATS:208,
 workSkinSameStateFrameHits:0,workSkinSameStateFrameMisses:0,
 genuineSkinFrameKey:p=>[p.x,p.z,p.phase,p.path[0].join(',')].join('|'),
 citizenRigPose:()=>rig,citizenEmbodiedPose:()=>body,
 terrain:height,
 realForegroundFacing:p=>Math.atan2(p.path[0][0]-p.x,p.path[0][1]-p.z),
 realWorkerFacing:p=>Math.atan2(p.focus[0]-p.x,p.focus[1]-p.z),
 retainWorkerSkinPalette:(entry,segments,slot)=>{
  actual.push({slot,segments:JSON.parse(JSON.stringify(segments))});
  return new Float32Array(208);
 }});
vm.runInContext(source,context,{timeout:2000});
const compose=vm.runInContext('workSkinFramePalette',context);
const entry={x:0,z:0,ground:height(0,0),angle:0,scale:1};
const original=compose(entry,person,'detailedBonePalette',true);
assert.equal(original.length,208);
const torso=()=>actual.at(-1).segments[0][0];
assert(Math.abs(torso()[0])<1e-8&&Math.abs(torso()[2])<1e-8,
 'initial true body must originate from original authoritative coordinates');
// Same exact actor, still the exact same retained bind mesh, but WORLD movement
// and new route direction. Old code incorrectly posed this at stale (0,0).
person.x=2;person.z=3;person.path=[[5,3]];person.phase+=.5;
compose(entry,person,'detailedBonePalette',true);
assert(Math.abs(torso()[0]-2)<1e-6&&Math.abs(torso()[2]-3)<1e-6,
 'full detailed citizen 13-joint root MUST advance with real route; no freezing at bind position');
assert(Math.abs(actual.at(-1).segments[1][1][0]-
 (person.x+rig.legs[0].knee[2]))<1e-6,
 'new eastbound route heading must rotate authentic left knee, not face the old northbound path');
// Compact workers must also move toward their true current job focus.
person.focus=[1,3];person.x=3;person.z=4;person.phase+=.5;
compose(entry,person,'compactBonePalette',false);
assert(Math.abs(torso()[0]-3)<1e-6&&Math.abs(torso()[2]-4)<1e-6,
 'original compact worker must travel with authoritative world root');
assert(Math.abs(actual.at(-1).segments[1][1][0]-
 (person.x-rig.legs[0].knee[2]*Math.SQRT1_2))>.01 ||
 Math.abs(actual.at(-1).segments[1][1][2]-person.z)>.01,
 'real worker joint must show rotation, not unaltered stale coordinates');
// Exact unchanged world must reuse existing bounded palette, not resculpt it.
const before=actual.length;
compose(entry,person,'compactBonePalette',false);
assert.equal(actual.length,before,'repeat draw without world movement must reuse original 208-float palette');
// Never rewrite simulated person for an animation-only fix.
assert.equal(person.x,3);assert.equal(person.z,4);
assert.equal(person.job,'farmer');
console.log('W322 source PASS: genuine detailed and compact GPU-skinned citizens traverse and turn with real world coordinates, unchanged pose reuses bounded palette. Actual film/hardware FPS remain separate gates.');
