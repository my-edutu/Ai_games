'use strict';
// W324 integrated Phase 1: retain the genuine fixed-step IK while orbiting
// the camera; invalidate immediately for actual moved workers and freight.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(match=>match[1].includes('function citizenRigPose('));
assert(script,'original running game script required');
new vm.Script(script[1],{filename:'tiny-kingdom-original.js'});
const first=html.indexOf('function citizenRigAuthoritativeKey(p){');
const end=html.indexOf('\nfunction getCitizenRigCacheAudit()',first);
assert(first>0&&end>first,'W324 genuine per-citizen authority key missing');
const pure=html.slice(first,end);
const p={name:'Bram',job:'farmer',activity:'Traveling with food to market',
 x:12,z:4,phase:0.4,workTimer:0.2,energy:81,hunger:21,food:2,money:4,
 path:[[8,6]],target:[8,6],delivery:{id:'Bram:2',stage:'travel',amount:3.024}};
const ctx=vm.createContext({people:[p],state:{t:31}});
vm.runInContext(pure,ctx);
const get=vm.runInContext('citizenRigAuthoritativeKey',ctx);
const stable=get(p);
// UI-only orbit, zoom, pan, selected tab: zero world change and zero new IK.
let presentationEpoch=100;
presentationEpoch++;assert.equal(get(p),stable,'camera-only movement cannot invalidate true body pose');
const move=(name,change)=>{
 const before=get(p);change();assert.notEqual(get(p),before,name+' must invalidate genuine IK');
};
move('real root translation',()=>p.x+=.1);
move('actual gait phase',()=>p.phase+=.2);
move('actual heading/route',()=>p.path[0]=[7,9]);
move('work contact clock',()=>p.workTimer+=.2);
move('real cargo stage',()=>p.delivery.stage='unloading');
move('physical cargo size',()=>p.delivery.amount=2.4);
move('profession',()=>p.job='builder');
move('actual energy',()=>p.energy-=1);
move('real world-time advancement',()=>ctx.state.t+=.2);
move('population growth',()=>ctx.people.push({name:'New genuine citizen'}));
assert.match(html,/if\(citizenRigTime!==state\.t\)\{/,
 'only authoritative time, not camera epoch, resets all citizen poses');
assert(!html.includes('citizenRigEpoch!==presentationEpoch||citizenRigTime!==state.t'),
 'orbit must not globally resculpt every citizen');
assert.match(html,/if\(hit&&hit\.identity===identity\)/,
 'genuine same-time edits need per-person identity validation');
assert.match(html,/citizenRigCache\.set\(p,\{identity,pose,cameraEpoch:presentationEpoch\}\)/,
 'bounded WeakMap must retain original full two-bone IK pose and epoch');
assert.match(html,/if\(hit\.cameraEpoch!==presentationEpoch\)/,
 'camera-only savings must be measurable in the original runtime');
assert.match(html,/if\(!replacedExistingRig\)citizenRigEntries\+\+/,
 'same-person work/route updates must never inflate the bounded citizen count');
console.log('W324 source PASS: real same-tick camera-only IK reuse; live walk/work/receipt state invalidates, no new actors/authority, no FPS claim.');
