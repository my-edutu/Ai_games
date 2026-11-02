'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const plan=path.join(root,'public/ai-dungeon/combat-cue-plan.js');
const director=path.join(root,'public/ai-dungeon/combat-director.js');

async function loadPlan(){
 const src=fs.readFileSync(plan,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
}

test('authoritative attack/cast signals defer only cosmetic release to the corresponding visible animation beat',async()=>{
 const {combatCueDelay}=await loadPlan();
 for(const kind of ['vanguard','ranger','mystic','revenant','cultist','warden']){
  const attack=combatCueDelay(kind,'attack');
  const cast=combatCueDelay(kind,'cast');
  assert.ok(Number.isFinite(attack)&&attack>=.12&&attack<=.32,kind+':attack');
  assert.ok(Number.isFinite(cast)&&cast>=.22&&cast<=.4,kind+':cast');
  assert.equal(combatCueDelay(kind,'idle'),0);
  assert.equal(combatCueDelay(kind,'hurt'),0);
  assert.equal(combatCueDelay(kind,'attack',true),0,'accessibility reduction does not hide contact feedback');
 }
 assert.equal(combatCueDelay('unknown','attack'),0);
 assert.equal(combatCueDelay(null,'cast'),0);
});

test('cosmetic cue plan is bounded and deterministic without time, RNG, authority, or network',async()=>{
 const {combatCueDelay,MAX_PENDING_COMBAT_CUES}=await loadPlan();
 assert.ok(Number.isInteger(MAX_PENDING_COMBAT_CUES));
 assert.ok(MAX_PENDING_COMBAT_CUES>=8&&MAX_PENDING_COMBAT_CUES<=32);
 assert.equal(combatCueDelay('warden','cast'),combatCueDelay('warden','cast'));
 const src=fs.readFileSync(plan,'utf8');
 assert.doesNotMatch(src,/Math\.random|Date\.|performance\.|requestAnimationFrame|fetch\(|DungeonRuntime/);
});

test('actual Three.js director stages real authority actionTick cues on bounded rendered-frame age',()=>{
 const src=fs.readFileSync(director,'utf8');
 assert.match(src,/combatCueDelay\(/);
 assert.match(src,/advancePresentationActionAge\(cue\.age,dt\)/);
 assert.match(src,/pendingCues\.push\(/);
 assert.match(src,/MAX_PENDING_COMBAT_CUES/);
 assert.match(src,/pendingCues\.length=0/);
 assert.match(src,/pendingCues:pendingCues\.length/);
 assert.match(src,/releasedCues:/);
 assert.match(src,/droppedCues:/);
 assert.match(src,/source:\{x:u\.x,z:u\.z/);
 assert.doesNotMatch(src,/Math\.random|performance\.now|Date\.now/);
});

test('contact and hurt feedback are compact above-ground flashes, not duplicate boss floor rings',()=>{
 const src=fs.readFileSync(director,'utf8');
 assert.match(src,/mode:'spark'/);
 assert.match(src,/activeHitFlashes:/);
 assert.doesNotMatch(src,/case 'hurt':burstAt\(/);
 assert.doesNotMatch(src,/if\(u\.kind==='warden'&&u\.action==='cast'\)\{burstAt/);
 assert.match(src,/function flashAt\(/);
});

test('combat cue module is served with existing strict same-origin dungeon module routing',()=>{
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(host.includes("['/dungeon/combat-cue-plan.js','combat-cue-plan.js']"));
 const browser=fs.readFileSync(path.join(root,'tests/browser/dungeon-authored-motion.spec.cjs'),'utf8');
 assert.ok(browser.includes('releasedCues'));
 assert.ok(browser.includes('pendingCues'));
 assert.ok(browser.includes('dungeon-combat-clarity-round30-world-only.png'));
});
