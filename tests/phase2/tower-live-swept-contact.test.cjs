'use strict';
// Source-authentic, opt-in 20Hz collision regression for a full-speed climber.
// Two real contacts in one fixed step must resolve against the FIRST physical
// surface, never whichever ID sorts last. This also protects moving-deck
// landings and a cap exit from high-speed contact-order tunnelling.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {stepTowerPhysics}=require('../../dist/games/infinite-tower-climb/src/physics/step.js');

const still={move:0,jump:false,dash:false,attack:false,ability:false};
function sourceState(platforms,player,live=true){
  const runtime=TowerRuntime.create({
    maxTicks:3500,noProgressTicks:1800,
    guardianSecondWind:live,guardianArenaHazards:live,
  },'source-swept-contact-order',{policy:'autonomous'});
  const s=structuredClone(runtime.state);
  s.chunks[0].platforms=platforms;
  s.chunks[0].hazards=[];
  s.enemies=[];s.projectiles=[];s.pickups=[];
  s.player.grounded=false;s.player.groundedPlatformId=undefined;
  s.player.state='airborne';s.player.velocity={x:0,y:0};
  Object.assign(s.player,player);
  return s;
}
test('one full-speed airborne dash stops at the FIRST actual wall, not the first wall ID',()=>{
  const walls=[
    {id:'f0:a-far',kind:'solid',x:275000,y:145000,width:10000,height:20000},
    {id:'f0:z-near',kind:'solid',x:270000,y:145000,width:10000,height:20000},
  ];
  const s=sourceState(walls,{position:{x:260000,y:150000},
    velocity:{x:17000,y:0},state:'dashing',dashCooldown:19,facing:1});
  const untouched=structuredClone(s);
  const out=stepTowerPhysics(s,{...still,move:1});
  assert.equal(out.integrityFailure,undefined);
  assert.deepEqual(s,untouched,'physics must not mutate its authoritative input');
  assert.equal(out.state.player.position.x,270000-s.player.halfWidth);
  assert.equal(out.state.player.velocity.x,0);
  assert.equal(out.contacts.filter(c=>c.kind==='wall').length,1);
  assert.equal(out.contacts.find(c=>c.kind==='wall')?.entityId,'f0:z-near');
  assert.equal(out.state.player.grounded,false,'hitting a vertical face is not a landing');
});
test('leftward full-speed dash obeys nearest physical wall instead of alphabetical order',()=>{
  const walls=[
    {id:'f0:a-far-left',kind:'solid',x:270000,y:145000,width:10000,height:20000},
    {id:'f0:z-near-left',kind:'solid',x:275000,y:145000,width:10000,height:20000},
  ];
  const s=sourceState(walls,{position:{x:300000,y:150000},
    velocity:{x:-17000,y:0},state:'dashing',dashCooldown:19,facing:-1});
  const out=stepTowerPhysics(s,{...still,move:-1});
  assert.equal(out.integrityFailure,undefined);
  assert.equal(out.state.player.position.x,285000+s.player.halfWidth);
  assert.equal(out.state.player.velocity.x,0);
  assert.deepEqual(out.contacts.filter(c=>c.kind==='wall').map(c=>c.entityId),
    ['f0:z-near-left']);
});
test('descending across stacked tops lands on the first upper support independent of IDs',()=>{
  const surfaces=[
    {id:'f0:a-upper',kind:'solid',x:240000,y:195000,width:40000,height:10000},
    {id:'f0:z-lower',kind:'solid',x:240000,y:189000,width:40000,height:10000},
  ];
  const s=sourceState(surfaces,{position:{x:260000,y:224000},
    velocity:{x:0,y:-19000}});
  const out=stepTowerPhysics(s,still);
  assert.equal(out.integrityFailure,undefined);
  assert.equal(out.state.player.position.y,205000+s.player.halfHeight);
  assert.equal(out.state.player.groundedPlatformId,'f0:a-upper');
  assert.deepEqual(out.contacts.filter(c=>c.kind==='land').map(c=>c.entityId),
    ['f0:a-upper']);
});
test('rising through two solid undersides contacts the nearest ceiling first',()=>{
  const ceilings=[
    {id:'f0:a-lower',kind:'solid',x:240000,y:200000,width:40000,height:5000},
    {id:'f0:z-upper',kind:'solid',x:240000,y:205000,width:40000,height:5000},
  ];
  const s=sourceState(ceilings,{position:{x:260000,y:183000},
    velocity:{x:0,y:15000}});
  const out=stepTowerPhysics(s,still);
  assert.equal(out.integrityFailure,undefined);
  assert.equal(out.state.player.position.y,200000-s.player.halfHeight);
  assert.equal(out.state.player.velocity.y,0);
  assert.deepEqual(out.contacts.filter(c=>c.kind==='head').map(c=>c.entityId),
    ['f0:a-lower']);
});
test('historical and unflagged physics retain their old collision algorithm',()=>{
  const s=sourceState([
    {id:'f0:a-far',kind:'solid',x:275000,y:145000,width:10000,height:20000},
    {id:'f0:z-near',kind:'solid',x:270000,y:145000,width:10000,height:20000},
  ],{position:{x:260000,y:150000},velocity:{x:17000,y:0},
    state:'airborne',dashCooldown:0,facing:1},false);
  // Frozen historical one-step velocity still resolves by old ID order.
  // This is a checksum-scope guard, NOT an endorsement of old collision.
  const out=stepTowerPhysics(s,still);
  assert.equal(out.integrityFailure,undefined);
  assert.equal(out.state.player.velocity.x,0);
  assert.equal(out.state.player.position.x,275000-s.player.halfWidth);
});

test('diagonal descent contacts the REAL vertical side rather than phantom-landing through its corner',()=>{
  const wall={id:'f0:corner',kind:'solid',x:248000,y:195000,width:12000,height:10000};
  const s=sourceState([wall],{position:{x:230000,y:224000},
    velocity:{x:17000,y:-19000},state:'dashing',dashCooldown:19,facing:1});
  const out=stepTowerPhysics(s,still);
  assert.equal(out.integrityFailure,undefined);
  assert.equal(out.state.player.position.x,wall.x-s.player.halfWidth);
  assert.equal(out.state.player.position.y,203800,'a side impact must not invent a top landing');
  assert.equal(out.state.player.grounded,false);
  assert.deepEqual(out.contacts.filter(c=>c.kind==='wall').map(c=>c.entityId),[wall.id]);
  assert.equal(out.contacts.some(c=>c.kind==='land'),false);
});
test('reaching the side BEFORE descending to the top permits an earned physical landing',()=>{
  const deck={id:'f0:early-lane',kind:'solid',x:242000,y:195000,width:20000,height:10000};
  const s=sourceState([deck],{position:{x:230000,y:224000},
    velocity:{x:17000,y:-19000},state:'dashing',dashCooldown:19,facing:1});
  const out=stepTowerPhysics(s,still);
  assert.equal(out.integrityFailure,undefined);
  assert.equal(out.state.player.groundedPlatformId,deck.id);
  assert.equal(out.state.player.position.y,205000+s.player.halfHeight);
  assert.equal(out.contacts.some(c=>c.kind==='wall'),false);
});
test('diagonal upward crossing hits the side if the ceiling was crossed first',()=>{
  const roof={id:'f0:late-ceiling',kind:'solid',x:254000,y:200000,width:12000,height:10000};
  const s=sourceState([roof],{position:{x:230000,y:174000},
    velocity:{x:17000,y:15000},state:'dashing',dashCooldown:19,facing:1});
  const out=stepTowerPhysics(s,still);
  assert.equal(out.integrityFailure,undefined);
  assert.equal(out.state.player.position.x,roof.x-s.player.halfWidth);
  assert.equal(out.state.player.position.y,187800);
  assert.equal(out.contacts.some(c=>c.kind==='head'),false);
  assert.equal(out.contacts.filter(c=>c.kind==='wall').length,1);
});
test('entering the ceiling lane BEFORE reaching its underside yields a real head contact',()=>{
  const roof={id:'f0:early-ceiling',kind:'solid',x:245000,y:200000,width:12000,height:10000};
  const s=sourceState([roof],{position:{x:230000,y:174000},
    velocity:{x:17000,y:15000},state:'dashing',dashCooldown:19,facing:1});
  const out=stepTowerPhysics(s,still);
  assert.equal(out.integrityFailure,undefined);
  assert.equal(out.state.player.position.y,roof.y-s.player.halfHeight);
  assert.deepEqual(out.contacts.filter(c=>c.kind==='head').map(c=>c.entityId),[roof.id]);
  assert.equal(out.contacts.some(c=>c.kind==='wall'),false);
});
test('real moving solid deck face pushes an exposed stationary body without a future prediction',()=>{
  const wall={id:'f0:moving-wall',kind:'moving',x:220000,y:195000,
    width:12000,height:10000,
    motion:{axis:'x',range:35000,speed:2500,phase:15}};
  const s=sourceState([wall],{position:{x:242000,y:200000},
    velocity:{x:0,y:0},state:'airborne',dashCooldown:0,facing:1});
  const out=stepTowerPhysics(s,still);
  assert.equal(out.integrityFailure,undefined);
  assert.equal(out.state.player.position.x,241000);
  assert.deepEqual(out.contacts.filter(c=>c.kind==='wall').map(c=>c.entityId),[wall.id]);
  assert.equal(out.contacts.some(c=>c.kind==='land'),false);
});

test('diagonal moving-face contact never writes a fractional position into authoritative replay',()=>{
  const {sweptWallContact}=require('../../dist/games/infinite-tower-climb/src/physics/swept-wall-contact.js');
  const right=sweptWallContact({
    fromX:230000,toX:247000,fromY:224000,toY:203800,
    halfWidth:9000,halfHeight:14000,
    wallStartX:248000,wallEndX:250500,
    wallStartY:195000,wallEndY:195000,
    wallWidth:12000,wallHeight:10000,direction:1,
  });
  assert.ok(right);
  assert.ok(Number.isSafeInteger(right.contactX));
  const atTouch=248000+(250500-248000)*right.time;
  assert.ok(right.contactX+9000<=atTouch);
  const left=sweptWallContact({
    fromX:300000,toX:283000,fromY:224000,toY:203800,
    halfWidth:9000,halfHeight:14000,
    wallStartX:255000,wallEndX:252500,
    wallStartY:195000,wallEndY:195000,
    wallWidth:12000,wallHeight:10000,direction:-1,
  });
  assert.ok(left);
  assert.ok(Number.isSafeInteger(left.contactX));
  const atTouchLeft=255000+(252500-255000)*left.time+12000;
  assert.ok(left.contactX-9000>=atTouchLeft);
});
