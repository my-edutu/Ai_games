import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyEvidenceScenario } from '../dist/index.js';

const scenarios=['exploration','scavenging','small-encounter','large-horde','barricade-defense','interior','day','night','near-death','failure'];

test('all required runtime evidence scenarios are deterministic and valid shapes',()=>{
  const base=createGame({seed:2026,zombieCount:180});
  for(const name of scenarios){
    const a=applyEvidenceScenario(base,name);
    const b=applyEvidenceScenario(base,name);
    assert.deepEqual(a,b,name);
    assert.equal(a.evidenceScenario,name);
    assert.ok(a.survivors.length>0,name);
    assert.ok(a.buildings.length>0,name);
  }
});

test('evidence scenarios expose the prompt-required visual situations',()=>{
  const base=createGame({seed:2026,zombieCount:180});
  assert.ok(applyEvidenceScenario(base,'scavenging').survivors.some(s=>s.action==='scavenge'||s.carrying>0));
  assert.ok(applyEvidenceScenario(base,'small-encounter').zombies.filter(z=>z.health>0&&z.distanceToSafeHouse<12).length>=5);
  assert.ok(applyEvidenceScenario(base,'large-horde').zombies.filter(z=>z.health>0).length>=180);
  assert.ok(applyEvidenceScenario(base,'barricade-defense').barricades.some(b=>b.hp<b.maxHp));
  assert.ok(applyEvidenceScenario(base,'interior').survivors.some(s=>s.insideBuildingId));
  assert.equal(applyEvidenceScenario(base,'day').time.phase,'day');
  assert.equal(applyEvidenceScenario(base,'night').time.phase,'night');
  assert.ok(applyEvidenceScenario(base,'near-death').survivors.some(s=>s.alive&&s.health<15&&s.threat>.9));
  assert.equal(applyEvidenceScenario(base,'failure').status,'overrun');
});
