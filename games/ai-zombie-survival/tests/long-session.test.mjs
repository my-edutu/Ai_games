import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,stepGame,healthSnapshot,validateWorld} from '../dist/index.js';

test('accelerated multi-day autonomous session stays finite and bounded',()=>{
  let game=createGame({seed:3030,zombieCount:140,survivorCount:6});
  for(let i=0;i<7200&&game.status==='running';i++)game=stepGame(game,1/30);
  for(const s of game.survivors){assert.ok(Number.isFinite(s.x)&&Number.isFinite(s.y));assert.ok(Number.isFinite(s.health)&&Number.isFinite(s.infection));}
  for(const z of game.zombies){assert.ok(Number.isFinite(z.x)&&Number.isFinite(z.y)&&Number.isFinite(z.health));}
  assert.ok(game.events.length<=160);
  assert.ok(game.audit.length<=128);
  assert.equal(validateWorld(game).filter(x=>x.severity==='error').length,0);
  assert.notEqual(healthSnapshot(game).status,'quarantine');
  assert.ok(game.time.elapsed>30,'session should materially advance before any terminal outcome');
});
