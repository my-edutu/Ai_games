'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const semantics=path.join(root,'public/ai-dungeon/combat-intent-plan.js');
async function plan(){
 const source=fs.readFileSync(semantics,'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
test('only an authoritative same-tick healer cast counts as healing, never a hostile shot',async()=>{
 const {isHealingCast}=await plan();
 const healer=Object.freeze({kind:'mystic',faction:'party',action:'cast'});
 const realTick=Object.freeze({tick:36,events:[{tick:35,kind:'danger'},{tick:36,kind:'healing',text:'Starweaver healed vanguard'}]});
 assert.equal(isHealingCast(healer,realTick),true);
 assert.equal(isHealingCast(healer,{...realTick,tick:37}),false,'stale events cannot turn later offensive spells into heals');
 assert.equal(isHealingCast({...healer,action:'attack'},realTick),false);
 assert.equal(isHealingCast({...healer,kind:'cultist',faction:'enemy'},realTick),false);
 assert.equal(isHealingCast({...healer,faction:'enemy'},realTick),false);
 assert.equal(isHealingCast(healer,{tick:36,events:[{tick:36,kind:'combat'}]}),false);
 assert.equal(isHealingCast(healer,{tick:36,events:[]}),false);
 for(const invalid of [null,undefined,{},'healing',{tick:36,events:null}])assert.equal(isHealingCast(healer,invalid),false);
 assert.equal(isHealingCast(null,realTick),false);
});
test('healing interpretation uses semantic event metadata, not mutable text or time or random',async()=>{
 const {isHealingCast}=await plan();
 const healer={kind:'mystic',faction:'party',action:'cast'};
 const s={tick:6,events:[{kind:'healing',tick:6,text:'any localization'}]};
 assert.equal(isHealingCast(healer,s),true);
 assert.equal(isHealingCast(healer,s),true);
 assert.deepEqual(s.events,[{kind:'healing',tick:6,text:'any localization'}]);
 const source=fs.readFileSync(semantics,'utf8');
 assert.doesNotMatch(source,/Math\.random|Date\.|performance\.|fetch\(|DungeonRuntime|requestAnimationFrame/);
});
test('renderer routes healer casts to a compact friendly flare, never the offensive projectile',()=>{
 const director=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-director.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(director,/from '\/dungeon\/combat-intent-plan\.js'/);
 assert.match(director,/if\(isHealingCast\(u,s\)\)\{/);
 assert.match(director,/healingCues:/);
 assert.match(director,/flashAt\(u,'#8fe6ad'\)/);
 assert.ok(server.includes("['/dungeon/combat-intent-plan.js','combat-intent-plan.js']"));
});
test('authentic deterministic game can emit a heal event and a mystic cast at the same tick',async()=>{
 const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
 const {isHealingCast}=await plan();
 let witness=null;
 for(const seed of ['visual-room-art-18','dungeon-ui-round17','ashen-dungeon','healing-clarity-31']){
  const game=DungeonRuntime.create(seed);
  for(let i=0;i<1100;i++){
   const snapshot=game.step();
   const mystic=snapshot.units.find(u=>u.kind==='mystic'&&u.hp>0&&u.action==='cast');
   if(mystic&&snapshot.events.some(e=>e.kind==='healing'&&e.tick===snapshot.tick)){
    witness={seed,tick:snapshot.tick,snapshot,mystic};break;
   }
  }
  if(witness)break;
 }
 assert.ok(witness,'no genuine healer cast witnessed across declared deterministic seeds');
 assert.equal(isHealingCast(witness.mystic,witness.snapshot),true);
 assert.equal(isHealingCast(witness.mystic,{...witness.snapshot,tick:witness.tick+1}),false);
});
