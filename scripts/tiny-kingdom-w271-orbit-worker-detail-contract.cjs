'use strict';
// W271 real-playable source contract. W216 exact 390px paused WebGL
// had already failed RED: camera yaw-only change rebuilt the full actor mesh.
// This test verifies bounded 3D rig residence and honest invalidation without
// inventing workers or touching authority. Browser tests remain the visual gate.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const first=html.indexOf('<script>'),last=html.lastIndexOf('</script>');
assert(first>=0&&last>first,'real playable inline script');
new Function(html.slice(first+8,last));
const start=html.indexOf('function canKeepOrbitDetail(previous,current){');
const stop=html.indexOf('function getCitizenOrbitDetailAudit(){',start);
assert(start>0&&stop>start,'true production visual-detail source');
const ctx=vm.createContext({});
vm.runInContext(html.slice(start,stop),ctx);
const can=(a,b)=>vm.runInContext('canKeepOrbitDetail(previous,current)',
 Object.assign(ctx,{previous:a,current:b}));
const originalPeople=Array.from({length:12},(_,i)=>({name:'Real '+i}));
const old={people:originalPeople,time:7,cityCount:12,selectedCitizen:0,
 width:390,height:844,mode:'founding-overview',zoom:75,
 focus:[0,0],yaw:.47,pitch:.71,plan:{indices:new Set([0,1,2]),
 midIndices:new Set([3,4])}};
const next={...old,paused:true,inspection:false,yaw:.55,
 prominentWorkers:[1]};
assert.equal(can(old,next),true,'real 390px shallow paused orbit holds existing worker rigs');
assert.equal(can(old,{...next,paused:false}),false,'running workers never use this frozen policy');
assert.equal(can(old,{...next,inspection:true}),false,'manual full-detail inspection wins');
assert.equal(can(old,{...next,time:7.01}),false,'genuine fixed-step authority invalidates');
assert.equal(can(old,{...next,people:originalPeople.slice()}),false,
 'loaded or replaced citizen set invalidates');
assert.equal(can(old,{...next,cityCount:13}),false,'real new house invalidates');
assert.equal(can(old,{...next,selectedCitizen:3}),false,'real selection invalidates');
assert.equal(can(old,{...next,width:1024}),false,'viewport change invalidates');
assert.equal(can(old,{...next,mode:'follow'}),false,'human close/follow never frozen');
assert.equal(can(old,{...next,yaw:.62}),false,'larger original orbit replans');
assert.equal(can(old,{...next,pitch:.77}),false,'camera elevation re-evaluates');
assert.equal(can(old,{...next,focus:[.3,0]}),false,'street focus movement re-evaluates');
assert.equal(can(old,{...next,zoom:70}),false,'meaningful zoom re-evaluates');
assert.equal(can(old,{...next,prominentWorkers:[7]}),false,
 'new prominent real farmer may not be assigned a stale compact rig');
assert.equal(can(old,{...next,prominentWorkers:[2]}),true,
 'previously detailed real contact remains fully embodied');
assert.ok(html.includes('new Set(citizenOrbitDetailHold.plan.indices)'),
 'actual 3D full-body residency honors the held detail set');
assert.ok(html.includes('new Set(citizenOrbitDetailHold.plan.midIndices)'),
 'actual articulated compact/middle-detail residency honors the same hold');
assert.ok(html.includes('getCameraDynamicCacheStats,getCitizenOrbitDetailAudit,'),
 'live game publishes honest render-only diagnostic');
console.log('W271 PASS: 390px camera-only source hysteresis and every real-authority invalidation. Browser motion and hardware FPS are separate.');
