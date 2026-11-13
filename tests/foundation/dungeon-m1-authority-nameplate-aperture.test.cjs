'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../public/ai-dungeon');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'nameplate-composition-plan.js'),'utf8')).toString('base64'));
const candidate=(id,x,y,width=76,faction='enemy')=>({id,x,y,width,faction,danger:true});
const clash=(a,b,w)=>{const r={l:a.x-w/2-4,r:a.x+w/2+4,t:a.y-14,b:a.y+22};return r.l<b.r&&r.r>b.l&&r.t<b.b&&r.b>b.t;};
test('390px Warden danger excludes obstructing nameplates; accessible status stays in real HUD',async()=>{
 const {planReadableNameplates:plan}=await load();
 const a=[candidate('revenant',185,315),candidate('wildshadow',210,350,110,'party')];
 const danger=[{l:0,r:390,t:240,b:485}];
 const before=plan(a,{width:390,height:658,focusId:'wildshadow'});
 assert.ok(before.labels.length>0,'prior source rendered competing floating labels');
 const after=plan(a,{width:390,height:658,focusId:'wildshadow',protectedRects:danger});
 assert.equal(after.labels.length,0);
 assert.equal(after.suppressed,2);
});
test('true projected body reserves space; an alternative nameplate remains if clean',async()=>{
 const {planReadableNameplates:plan}=await load();
 const occupied=[{l:120,r:270,t:254,b:293}];
 const result=plan([candidate('cultist',195,265)],{width:390,height:658,protectedRects:occupied});
 assert.equal(result.labels.length,1);
 const p=result.labels[0];
 assert.equal(clash(p,occupied,76),false);
 assert.ok(Math.hypot(p.x-195,p.y-265)<=96);
});
test('malformed or oversized regions fail closed; existing desktop labels remain unchanged',async()=>{
 const {planReadableNameplates:plan}=await load();
 const data=[candidate('hero',190,240,110,'party')];
 const regions=[{l:0,r:Infinity,t:0,b:100},{l:0,r:9999,t:0,b:9999},
  {l:200,r:100,t:0,b:10},{l:-9,r:24,t:0,b:16}];
 const a=plan(data,{width:390,height:658,focusId:'hero',protectedRects:regions});
 assert.equal(a.labels.length,1);
 const b=plan(data,{width:1440,height:832,focusId:'hero',protectedRects:[{l:0,r:1440,t:0,b:832}]});
 assert.equal(b.labels.length,1);
});
test('real overlay consults source-mapped Warden warning, camera and skinned bodies',()=>{
 const src=fs.readFileSync(path.join(root,'combat-overlay.js'),'utf8');
 assert.match(src,/warning\.attackTick>state\.tick/);
 assert.match(src,/sample\.set\(tile\.x-origin\+dx,\.16,tile\.z-origin\+dz\)\.project\(camera\)/);
 assert.match(src,/protectedWorldRegions\(s,actors,camera\)/);
 assert.match(src,/protectedRects:reserved\.rects/);
 assert.match(src,/u\.kind==='warden'\)continue/);
});
