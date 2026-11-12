'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=()=>import('data:text/javascript;base64,'+
 Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/native-figure-sculpt.js'),'utf8')).toString('base64'));
test('connected original Vanguard thigh and calf links produce meaningful longer adult legs',async()=>{
 const {planNativeAdultLegLink:f}=await load();
 const a=f('vanguard','upper',{x:.005,y:-.47,z:0});
 const b=f('vanguard','lower',{x:0,y:-.43,z:.015});
 assert.equal(a.axis,'y');assert.equal(b.axis,'y');
 assert.ok(a.factor>=1.2&&b.factor>=1.15&&a.extraLocal+b.extraLocal>.16);
});
test('fails closed for oblique or invalid leg links, other roles and unrelated bones',async()=>{
 const {planNativeAdultLegLink:f}=await load();
 for(const bad of [null,{x:0,y:0,z:0},{x:1,y:1,z:0},{x:NaN,y:1,z:0},{x:0,y:100,z:0}])
  assert.equal(f('vanguard','upper',bad),null);
 for(const role of ['ranger','cultist','mystic'])
  assert.equal(f(role,'upper',{x:0,y:-.45,z:0}),null);
 assert.equal(f('vanguard','head',{x:0,y:-.5,z:0}),null);
});
test('Revenant and Warden have continuous, original rigged adult thigh and calf hierarchy',async()=>{
 const {planNativeAdultLegLink:f}=await load();
 const thigh={x:.005,y:-.47,z:0},calf={x:0,y:-.43,z:.015};
 const v=[f('vanguard','upper',thigh),f('vanguard','lower',calf)];
 const r=[f('revenant','upper',thigh),f('revenant','lower',calf)];
 const w=[f('warden','upper',thigh),f('warden','lower',calf)];
 for(const [kind,pair] of [['vanguard',v],['revenant',r],['warden',w]]){
  for(const p of pair){assert.ok(p&&Object.isFrozen(p),kind);
   assert.equal(p.axis,'y');assert.ok(p.factor>1&&p.factor<=1.23&&p.extraLocal>0);}
 }
 assert.ok(v[0].factor>r[0].factor&&r[0].factor>w[0].factor);
 assert.ok(v[1].factor>r[1].factor&&r[1].factor>w[1].factor);
 assert.ok(r[0].extraLocal+r[1].extraLocal>.12);
 assert.ok(w[0].extraLocal+w[1].extraLocal>.09);
 for(const role of ['revenant','warden']){
  assert.equal(f(role,'upper',{x:.3,y:.3,z:0}),null,'not a valid thigh axis');
  assert.equal(f(role,'lower',{x:0,y:NaN,z:0}),null,'invalid rig fails closed');
 }
});
test('restores source bone scale before real mixer, applies grounded visual only after source poses',()=>{
 const s=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(s,/restoreNativeAdultLegsBeforeMixer\(actor\);[\s\S]*?actor\.mixer\.update/);
 assert.match(s,/stageNativeAdultLegsAfterMixer\(actor\);[\s\S]*?planNativeFootPlant/);
 assert.match(s,/lower\.parent!==upper\|\|ankle\.parent!==lower/);
 assert.match(s,/Math\.abs\(delta\)>\.19/);
 assert.match(s,/\['vanguard','revenant','warden'\]\.includes\(actor\.u\.kind\)/);
 assert.match(s,/nativeAdultLegActorsByKind:/);
});
