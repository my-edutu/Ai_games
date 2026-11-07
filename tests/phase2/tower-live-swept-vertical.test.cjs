'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');
const {sweptVerticalContact}=require('../../dist/games/infinite-tower-climb/src/physics/swept-vertical-contact.js');
const still={move:0,jump:false,dash:false,attack:false,ability:false};
function makeState(platform,player,live=true){
 const s=structuredClone(TowerRuntime.create({
   maxTicks:3500,noProgressTicks:1800,
   guardianArenaHazards:live,guardianSecondWind:live,
 },'real-deck-contact').state);
 s.chunks[0].platforms=[platform];s.chunks[0].hazards=[];
 s.enemies=[];s.projectiles=[];s.pickups=[];
 s.player.grounded=false;s.player.groundedPlatformId=undefined;
 s.player.state='dashing';s.player.dashCooldown=19;
 s.player.velocity={x:17000,y:-19000};
 Object.assign(s.player,player);
 return s;
}
const deck=(x,width=30000,kind='oneway',y=195000)=>({
 id:'f0:deck',kind,x,y,width,height:10000,
});
test('late diagonal arrival does not invent a one-way roof landing',()=>{
 const s=makeState(deck(253000),{position:{x:230000,y:224000},facing:1});
 const initial=structuredClone(s);
 const out=stepTowerPhysics(s,{...still,move:1});
 assert.deepEqual(s,initial);
 assert.equal(out.integrityFailure,undefined);
 assert.equal(out.state.player.grounded,false);
 assert.equal(out.state.player.groundedPlatformId,undefined);
 assert.equal(out.state.player.position.y,203800);
 assert.equal(out.contacts.some(c=>c.kind==='land'),false);
});
test('early entry followed by an actual roof crossing earns a landing',()=>{
 const s=makeState(deck(240000),{position:{x:230000,y:224000},facing:1});
 const out=stepTowerPhysics(s,{...still,move:1});
 assert.equal(out.state.player.groundedPlatformId,'f0:deck');
 assert.equal(out.state.player.position.y,205000+s.player.halfHeight);
 assert.equal(out.contacts.filter(c=>c.kind==='land').length,1);
});
test('dashing off a short ledge before tick end never leaves phantom support',()=>{
 const s=makeState(deck(239000,7000),{position:{x:240000,y:224000},facing:1});
 const out=stepTowerPhysics(s,{...still,move:1});
 assert.equal(out.state.player.grounded,false);
 assert.equal(out.contacts.some(c=>c.kind==='land'),false);
});
test('late entry cannot manufacture a ceiling hit',()=>{
 const s=makeState(deck(253000,30000,'solid',200000),{
   position:{x:230000,y:183000},velocity:{x:17000,y:15000},facing:1});
 const out=stepTowerPhysics(s,{...still,move:1});
 assert.equal(out.state.player.position.y,196800);
 assert.equal(out.contacts.some(c=>c.kind==='head'),false);
});
test('early entry really contacts a solid underside',()=>{
 const s=makeState(deck(240000,30000,'solid',200000),{
   position:{x:230000,y:183000},velocity:{x:17000,y:15000},facing:1});
 const out=stepTowerPhysics(s,{...still,move:1});
 assert.equal(out.state.player.position.y,200000-s.player.halfHeight);
 assert.deepEqual(out.contacts.filter(c=>c.kind==='head').map(c=>c.entityId),['f0:deck']);
});
test('moving deck uses common-source-time X positions at roof contact',()=>{
 const a=sweptVerticalContact({
   fromX:230000,toX:247000,fromY:224000,toY:203800,
   halfWidth:9000,halfHeight:14000,
   platformStartX:240000,platformEndX:256000,
   platformStartY:195000,platformEndY:195000,
   platformWidth:9000,platformHeight:10000,oneway:false,
 });
 assert.equal(a,undefined);
 const b=sweptVerticalContact({
   fromX:230000,toX:247000,fromY:224000,toY:203800,
   halfWidth:9000,halfHeight:14000,
   platformStartX:240000,platformEndX:242500,
   platformStartY:195000,platformEndY:195000,
   platformWidth:15000,platformHeight:10000,oneway:false,
 });
 assert.equal(b?.kind,'land');
});
test('frozen unflagged endpoint solver remains byte-for-byte in use',()=>{
 const s=makeState(deck(253000),{position:{x:230000,y:224000},facing:1},false);
 const out=stepTowerPhysics(s,still);
 assert.equal(out.state.player.groundedPlatformId,'f0:deck');
});
