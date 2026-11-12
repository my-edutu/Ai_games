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
 for(const role of ['revenant','warden','ranger','cultist','mystic'])
  assert.equal(f(role,'upper',{x:0,y:-.45,z:0}),null);
 assert.equal(f('vanguard','head',{x:0,y:-.5,z:0}),null);
});
test('restores source bone scale before real mixer, applies grounded visual only after source poses',()=>{
 const s=fs.readFileSync(path.join(root,'public/ai-dungeon/model-assets.js'),'utf8');
 assert.match(s,/restoreNativeAdultLegsBeforeMixer\(actor\);[\s\S]*?actor\.mixer\.update/);
 assert.match(s,/stageNativeAdultLegsAfterMixer\(actor\);[\s\S]*?planNativeFootPlant/);
 assert.match(s,/lower\.parent!==upper\|\|ankle\.parent!==lower/);
 assert.match(s,/Math\.abs\(delta\)>\.19/);
});
