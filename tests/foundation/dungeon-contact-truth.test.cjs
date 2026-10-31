'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=async file=>{
 const js=fs.readFileSync(path.join(root,'public/ai-dungeon',file),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
};
const unit=(id,kind,faction,x,z,action='attack',hp=30)=>({id,kind,faction,x,z,action,hp,actionTick:12});
const map=()=>Array.from({length:7},()=>'.'.repeat(7));

test('a real same-tick ranger trap disarm is a utility cast, not an invented hostile strike',async()=>{
 const {isDisarmCast}=await load('combat-intent-plan.js');
 const ranger=Object.freeze(unit('ranger','ranger','party',2,2,'cast'));
 const snapshot=Object.freeze({tick:12,events:[Object.freeze({tick:12,kind:'disarm',text:'localized independently'})]});
 assert.equal(isDisarmCast(ranger,snapshot),true);
 assert.equal(isDisarmCast(ranger,{...snapshot,tick:13}),false);
 assert.equal(isDisarmCast(ranger,{tick:12,events:[{tick:11,kind:'disarm'}]}),false);
 assert.equal(isDisarmCast({...ranger,action:'attack'},snapshot),false);
 assert.equal(isDisarmCast({...ranger,kind:'mystic'},snapshot),false);
 assert.equal(isDisarmCast({...ranger,faction:'enemy'},snapshot),false);
 for(const invalid of [null,{},'invalid',{tick:12,events:null}])
  assert.equal(isDisarmCast(ranger,invalid),false);
 assert.equal(isDisarmCast(null,snapshot),false);
});

test('presentation contact locks attack VFX to the actual reachable grid opponent, even on a same-tick killing strike',async()=>{
 const {planVisualContact}=await load('facing-plan.js');
 const hero=Object.freeze(unit('hero','vanguard','party',2,2));
 const killed=Object.freeze(unit('fallen','revenant','enemy',3,2,'hurt',0));
 const snapshot=Object.freeze({tick:12,map:map(),units:Object.freeze([hero,killed])});
 const prior=JSON.stringify(snapshot);
 const result=planVisualContact(hero,snapshot);
 assert.equal(result.targetId,'fallen');
 assert.equal(result.distance,1);
 assert.ok(Math.abs(result.yaw+Math.PI/2)<1e-9);
 assert.equal(JSON.stringify(snapshot),prior,'render planning must never mutate the authority snapshot');
 assert.deepEqual(planVisualContact(hero,snapshot),result);
});

test('ranged spell contact is visual-only, axis-aligned, obstacle-aware, range-bounded and semantic',async()=>{
 const {planVisualContact}=await load('facing-plan.js');
 const mystic=unit('mage','mystic','party',1,1,'cast');
 const foe=unit('foe','cultist','enemy',1,3);
 const ordinary={tick:12,map:map(),units:[mystic,foe],events:[]};
 assert.equal(planVisualContact(mystic,ordinary).targetId,'foe','only a hostile mystic cast may aim');
 assert.equal(planVisualContact(mystic,{...ordinary,events:[{tick:12,kind:'healing'}]}),null,'heals have no enemy victim');
 assert.equal(planVisualContact(mystic,{...ordinary,events:[{tick:11,kind:'healing'}]}).targetId,'foe','stale heal cannot suppress a new real shot');
 const blocked=map();blocked[2]='.#.....';
 assert.equal(planVisualContact(mystic,{...ordinary,map:blocked}),null);
 const diagonal=unit('diagonal','cultist','enemy',3,2);
 assert.equal(planVisualContact(mystic,{...ordinary,units:[mystic,diagonal]}),null);
 const tooFar=unit('far','cultist','enemy',1,5);
 assert.equal(planVisualContact(mystic,{...ordinary,units:[mystic,tooFar]}),null);
 const disarming=unit('ranger','ranger','party',2,2,'cast');
 assert.equal(planVisualContact(disarming,{...ordinary,units:[disarming,foe],events:[{tick:12,kind:'disarm'}]}),null);
 const radial=unit('warden','warden','enemy',3,3,'cast');
 assert.equal(planVisualContact(radial,{...ordinary,units:[radial,mystic]}),null);
 assert.equal(planVisualContact(null,ordinary),null);
 assert.equal(planVisualContact(mystic,null),null);
});

test('real WebGL director shares bounded grid contact selection and gives disarm an honest utility cue',()=>{
 const director=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-director.js'),'utf8');
 assert.match(director,/planVisualContact\(u,s\)/);
 assert.match(director,/isDisarmCast\(u,s\)/);
 assert.doesNotMatch(director,/const target=closest\(s\.units,u,/,'nearest living foe is not necessarily the actual struck target');
 assert.match(director,/disarmCues:/);
 assert.match(director,/contactLockedCues:/);
 assert.match(director,/suppressedUnmatchedCues:/);
 assert.match(director,/mesh\.rotation\.set\(0,/,'melee weapon contact should be a 3D upright arc, not a flat floor circle');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(host.includes("['/dungeon/facing-plan.js','facing-plan.js']"));
 assert.ok(host.includes("['/dungeon/combat-intent-plan.js','combat-intent-plan.js']"));
});
