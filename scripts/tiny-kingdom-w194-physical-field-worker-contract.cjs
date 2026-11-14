#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const h=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const firstScript=h.indexOf('<script>')+8;
const script=h.slice(firstScript,h.indexOf('</script>',firstScript));
new vm.Script(script);
const reference=h.slice(h.indexOf('function tri('),h.indexOf('// G055:',h.indexOf('function tri(')));
const quad=h.slice(h.indexOf('// W194 original world geometry'),h.indexOf('// G076:',h.indexOf('// W194 original world geometry')));
assert.match(quad,/function quad\(/);
const c={Math};vm.createContext(c);
vm.runInContext('let data=[],currentMaterial=0;\n'+reference+quad+
 '\nfunction reset(m){data=[];currentMaterial=m}\nfunction saved(){return data.slice()}\nfunction baseline(a,b,c,d,col){tri(a,b,c,col);tri(a,c,d,col)}',c);
for(let i=0;i<120;i++){
 const a=[Math.sin(i),.1*i,Math.cos(i)],b=[a[0]+1,Math.sin(i*.31)*.1,a[2]],
  d=[a[0]-.08,Math.cos(i*.37)*.34,a[2]+1.15],
  cc=[b[0]+.12,Math.sin(i*.81)*.29,a[2]+1.10],
  tone=[i%7/7,i%11/11,i%13/13];
 c.reset(i%14);c.baseline(a,b,cc,d,tone);
 const oracle=Array.from(c.saved());
 c.reset(i%14);c.quad(a,b,cc,d,tone);
 assert.deepEqual(Array.from(c.saved()),oracle,'unmodified independent face normals '+i);
}
const farmStart=h.indexOf('function farmSoil('),farmEnd=h.indexOf('// W55 original',farmStart);
const f={Math,terrain:(x,z)=>.017*x-.009*z,
 rgb:n=>[n>>16&255,n>>8&255,n&255],MATERIAL:{ROAD:1},
 farmScene:{rows:0},materialScope:(_,cb)=>cb(),quads:[]};
f.quad=(...args)=>f.quads.push(args);vm.createContext(f);
vm.runInContext(h.slice(farmStart,farmEnd),f);f.farmSoil(1.2,4.7,-1.5,-.9,2);
const segments=Math.ceil((4.7-1.2)/.70),lift=p=>p[1]-f.terrain(p[0],p[2]);
assert.equal(f.quads.length,segments*3+Math.ceil(segments/3));
assert.ok(Math.abs(lift(f.quads[0][1])-.070)<1e-8,'raised plough crest');
assert.ok(Math.abs(lift(f.quads[0][0])-.010)<1e-8,'earth shoulder');
assert.ok(lift(f.quads[2][1])<lift(f.quads[0][1]),'irrigation below growing grain');
assert.equal(f.farmScene.rows,1);
for(const face of f.quads)for(const pt of face.slice(0,4))
 assert.ok(pt.every(Number.isFinite));
const a=h.indexOf('// W108 Phase 1: one bounded'),b=h.indexOf('// W24 Living Valley camera',a);
const d={Math};vm.createContext(d);
vm.runInContext(`let presentationEpoch=1,state={t:1},selectedCitizen=0,
 people=Array.from({length:18},(_,i)=>({i,name:'real'+i,job:i===2||i===3?'farmer':'merchant'})),
 streetWalk=false,streetEncounterName='',follow=false,liveWorkday=false,zoom=25;
 function citizenDetailCameraFrame(){return {eye:[0,1,4],forward:[0,0,-1],right:[1,0,0],up:[0,1,0],tanVertical:.5,tanHorizontal:.7,lens:{viewportWidth:390,viewportHeight:800,verticalDegrees:90,horizontalDegrees:48}}}
 function projectRealCitizenDetail(p){return {visible:p.i>0&&p.i<=5,heightFraction:({1:.25,2:.17,3:.14,4:.13,5:.07})[p.i]||0,screenX:0,screenY:0}}
 function isMarketUnloading(){return false}
 function isWorkingAtSite(p){return p.i===2||p.i===3}
 ${h.slice(a,b)}
 function plan(){const result=selectVisibleCitizenDetail();return {ids:[...result.indices],audit:result.audit}}
 function enableFollow(){follow=true;presentationEpoch++}
`,d);
const initial=d.plan();
assert.deepEqual(Array.from(initial.ids),[2,3,1],'visible genuine labor before off-screen selection');
assert.equal(initial.audit.offscreenDetailedBudgetAvoided,true);
d.enableFollow();const followed=d.plan();
assert.ok(followed.ids.includes(0),'manual follow retains real selected worker');
console.log('W194 passed exact 120 nonplanar vertex contracts, original raised farm plots and 390px real worker-detail selection. No FPS or visual comparison proven.');
