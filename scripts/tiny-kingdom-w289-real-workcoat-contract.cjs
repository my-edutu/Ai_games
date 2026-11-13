'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const from=src.indexOf('function livedAdultGarmentProfile('),to=src.indexOf('// W63: real medieval fabric',from);
assert.ok(from>0&&to>from,'real author-owned workcoat source');
let verts=[];
const ctx={Math,medievalCitizenIdentity:()=>({name:'Bram',shoulder:.02,waist:.02,hem:.02}),
 rgb:()=>[.5,.5,.5],
 quad:(a,b,c,d)=>{for(const p of [a,b,c,d]){assert.ok(p.every(Number.isFinite));verts.push(...p)}},
 tri:(a,b,c)=>{for(const p of [a,b,c]){assert.ok(p.every(Number.isFinite));verts.push(...p)}}};
vm.runInNewContext(src.slice(from,to),ctx,{filename:'actual-foot-locked-original-workcoat.js'});
const p={name:'Bram',job:'farmer',phase:1.2};
const feet=[{ankle:[-.1,.05,.20]},{ankle:[.1,.05,-.20]}];
const render=(legs,traveling=true,working=false,lean=0)=>{
 verts=[];const rig={traveling,working,legs,acting:{lean}};
 const profile=ctx.garmentProfile(p,0,rig);
 ctx.tailoredGarment(0,0,0,1,[.4,.36,.32],[.7,.6,.4],profile);
 return {v:verts.slice(),triangles:verts.length/9,profile};
};
const front=render(feet),back=render(feet.slice().reverse());
const difference=front.v.reduce((t,x,i)=>t+Math.abs(x-back.v[i]),0);
assert.equal(front.triangles,back.triangles,'exact same original triangle count');
assert.ok(front.triangles>=70&&front.triangles<=120,'original full-fitted workcoat');
assert.ok(difference>.1,'opposite REAL IK foot stance visibly changes cloth geometry');
assert.equal(render(feet,false,false).profile.clothMotion.stride,0,
 'stopped courier does not invent walking cloth animation');
const shiftA=render(feet,false,true,.4),shiftB=render(feet,false,true,-.4);
assert.ok(shiftA.v.reduce((t,x,i)=>t+Math.abs(x-shiftB.v[i]),0)>.01,
 'real planted profession body leads cloth');
assert.match(src.slice(src.indexOf('function renderRealVillageWorkwear('),src.indexOf('// Gauntlet 041:')),/const physical=realWorkcoatMotion\(p,rig\)/);
const compact=src.slice(src.indexOf('function compactVillager(p){'),src.indexOf('function villager(p){'));
assert.match(compact,/W289 wool, skin and boots must not inherit the wooden market shader/);
assert.match(compact,/materialScope\(MATERIAL\.GENERAL,\(\)=>\{/);
for(const m of src.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){
 if(m[1].trim())new vm.Script(m[1],{filename:'production-inline-html.js'});
}
console.log('W289 original source IK-gait dress and real human material PASS: '+front.triangles+' near-body triangles; motion vertex delta '+difference.toFixed(2)+'; no browser, FPS or milestone claim');
