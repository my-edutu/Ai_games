'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=async name=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon',name),'utf8')).toString('base64'));
test('real bodies have a 360-degree physical acting pocket without losing distant masonry',async()=>{
 const {planPartyWallReveal:r}=await load('party-visibility-plan.js');
 const c={x:6,z:0},hero={x:0,z:0,silhouetteRecess:true},ordinary={x:0,z:0};
 assert.equal(r(-1.3,-1,[hero],c),'sightline');
 assert.equal(r(-1.3,-1,[ordinary],c),'nearby');
 assert.equal(r(-2.8,-.4,[hero],c),'none');
 assert.equal(r(-2.9,1.8,[hero],c),'none');
});
test('real contact has more room than travel; unmarked or remote space is retained',async()=>{
 const {planPartyWallReveal:r}=await load('party-visibility-plan.js');
 const c={x:6,z:0},hero={x:0,z:0,silhouetteRecess:true};
 assert.equal(r(-2.3,1.2,[{...hero,combatRecess:true}],c),'sightline');
 assert.equal(r(-1.8,1.3,[{...hero,combatRecess:true}],c),'sightline');
 assert.equal(r(-2.3,1.2,[hero],c),'nearby');
 assert.equal(r(-1.8,1.3,[hero],c),'sightline',
  'real actor boots remain readable even beside close masonry');
 assert.equal(r(-2.9,1.8,[{...hero,combatRecess:true}],c),'none');
 assert.equal(r(0,5,[{...hero,combatRecess:true}],c),'none');
 assert.equal(r(-1.8,1.3,[{x:0,z:0,combatRecess:false}],c),'nearby');
});
test('hero-scale journey and contact keep Warden warning tactically wide',async()=>{
 const {planReadableExpeditionLens:plan}=await load('cinematic-chapter-plan.js');
 const shot=m=>({mode:m,offsets:[5,8.2,5.65],subjects:['vanguard']});
 const j=plan(shot('journey')),c=plan(shot('contact')),w=plan(shot('warden-warning'));
 assert.ok(Math.hypot(j.offsets[0],j.offsets[2])<=5.6&&j.offsets[1]<=4.75);
 assert.ok(Math.hypot(c.offsets[0],c.offsets[2])<=5.1&&c.offsets[1]<=4.8);
 assert.ok(w.offsets[1]>c.offsets[1]+4);
 assert.ok(Math.hypot(w.offsets[0],w.offsets[2])>Math.hypot(c.offsets[0],c.offsets[2])+3);
});
