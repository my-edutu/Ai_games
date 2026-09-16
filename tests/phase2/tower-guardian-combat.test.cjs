'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{NamedRng}=require('../../dist/packages/seeded-rng/src/index.js');
const{TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const{stepTowerCombat,guardianPhase}=require('../../dist/games/infinite-tower-climb/src/combat/step.js');

const idle={move:0,jump:false,dash:false,attack:false,ability:false};

function guardianState(seed='guardian-phases'){
  const r=TowerRuntime.create({launchFloor:10,maxProjectiles:12},seed);
  const s=structuredClone(r.state),g=s.enemies.find(e=>e.kind==='guardian');
  assert.ok(g,'launch floor 10 must generate a guardian');
  s.player.position={x:g.position.x-90000,y:g.position.y};
  s.player.invulnerableTicks=0;
  g.cooldown=0;
  g.telegraphUntilTick=0;
  return{s,g};
}

test('guardian phase is derived deterministically from health thirds',()=>{
  const{s,g}=guardianState();
  g.health=g.maxHealth;assert.equal(guardianPhase(g),1);
  g.health=Math.floor(g.maxHealth*2/3);assert.equal(guardianPhase(g),2);
  g.health=Math.max(1,Math.floor(g.maxHealth/3));assert.equal(guardianPhase(g),3);
});

test('guardian telegraphs before firing and phase three emits a bounded trident',()=>{
  let{s,g}=guardianState('guardian-trident');
  g.health=Math.max(1,Math.floor(g.maxHealth/3));
  const first=stepTowerCombat(s,idle,NamedRng.fromSeed('guardian-trident'));
  assert.equal(first.events.some(e=>e.type==='guardian-telegraph'&&e.data?.phase===3&&e.data?.pattern==='trident'),true);
  assert.equal(first.state.projectiles.length,0);
  s=first.state;g=s.enemies.find(e=>e.kind==='guardian');
  s.tick=g.telegraphUntilTick;
  const fired=stepTowerCombat(s,idle,NamedRng.fromSeed('guardian-trident'));
  assert.equal(fired.events.some(e=>e.type==='guardian-attack'&&e.data?.phase===3&&e.data?.pattern==='trident'),true);
  const hostile=fired.state.projectiles.filter(p=>p.owner==='enemy');
  assert.equal(hostile.length,3);
  assert.ok(fired.state.projectiles.length<=fired.state.config.maxProjectiles);
  assert.deepEqual(hostile.map(p=>p.velocity.y).sort((a,b)=>a-b),[-1600,0,1600]);
});

test('guardian phase attack is byte-deterministic for identical inputs',()=>{
  const a=guardianState('guardian-determinism').s,b=structuredClone(a),ra=NamedRng.fromSeed('guardian-determinism'),rb=NamedRng.fromSeed('guardian-determinism');
  const one=stepTowerCombat(a,idle,ra),two=stepTowerCombat(b,idle,rb);
  assert.deepEqual(one,two);
});

test('guardian patterns respect projectile capacity even when the arena is already busy',()=>{
  let{s,g}=guardianState('guardian-cap');
  g.health=1;s.config={...s.config,maxProjectiles:4};
  s.projectiles=Array.from({length:3},(_,i)=>({id:`busy:${i}`,owner:'enemy',floor:s.floor,position:{x:40000+i*10000,y:s.player.position.y+80000},velocity:{x:1000,y:0},halfWidth:5000,halfHeight:3500,damage:1,ttl:80,active:true,hitIds:[]}));
  const armed=stepTowerCombat(s,idle,NamedRng.fromSeed('guardian-cap'));s=armed.state;g=s.enemies.find(e=>e.kind==='guardian');s.tick=g.telegraphUntilTick;
  const fired=stepTowerCombat(s,idle,NamedRng.fromSeed('guardian-cap'));
  assert.ok(fired.state.projectiles.length<=4,`projectiles exceeded cap: ${fired.state.projectiles.length}`);
});
