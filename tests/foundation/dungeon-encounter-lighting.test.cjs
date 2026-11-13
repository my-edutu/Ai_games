'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=async()=>import('data:text/javascript;base64,'+Buffer.from(
 fs.readFileSync(path.join(root,'public/ai-dungeon/encounter-lighting-plan.js'),'utf8')).toString('base64'));
const map=Array.from({length:19},()=>'.'.repeat(19));
const scene=()=>({map,tick:5,phase:'exploring',units:[
 {id:'vanguard',kind:'vanguard',faction:'party',hp:110,x:9,z:9},
 {id:'ranger',kind:'ranger',faction:'party',hp:75,x:9,z:10},
 {id:'revenant',kind:'revenant',faction:'enemy',hp:40,x:11,z:9}
]});
test('living actual duel gets separated original key and opposing fill without changing replay state',async()=>{
 const {planEncounterLighting:plan}=await load(),s=scene(),before=JSON.stringify(s);
 const v=plan(s,{mode:'contact',subjects:['vanguard','revenant']});
 assert.equal(v.mode,'duel');assert.equal(v.enemyId,'revenant');
 assert.ok(v.heroKey.z>v.opponentFill.z&&v.heroKey.intensity>v.opponentFill.intensity);
 assert.ok(v.heroKey.distance<=8&&v.opponentFill.distance<=8);
 assert.equal(JSON.stringify(s),before);assert.ok(Object.isFrozen(v)&&Object.isFrozen(v.heroKey));
});
test('journey does not light a remote or dead enemy as a staged attacker',async()=>{
 const {planEncounterLighting:plan}=await load(),s=scene();
 const v=plan(s,{mode:'journey',subjects:['vanguard']});
 assert.equal(v.mode,'travel');assert.equal(v.enemyId,null);assert.equal(v.bossLight,null);
 s.units[2].hp=0;assert.equal(plan(s,{mode:'contact',subjects:['vanguard','revenant']}).mode,'travel');
});
test('public Warden warning and true incoming injury control an accessible bounded portrait',async()=>{
 const {planEncounterLighting:plan}=await load(),s=scene();
 s.units.push({id:'warden',kind:'warden',faction:'enemy',hp:400,x:12,z:9});
 s.bossWarning={attackTick:6,cells:[{x:9,z:9}]};
 const shot={mode:'warden-warning',subjects:['warden','vanguard']};
 const hit={id:'vanguard',damage:20,maxHp:110};
 const v=plan(s,shot,{damageBeat:hit});
 assert.equal(v.warning,true);assert.ok(v.bossLight.intensity>=3&&v.injury.strength>.1);
 assert.equal(plan(s,shot,{damageBeat:hit,reducedMotion:true}).injury,null);
 s.bossWarning.attackTick=1;assert.equal(plan(s,shot).warning,false);
});
test('no valid heroes, impossible map or invalid coordinates yields no new spotlight',async()=>{
 const {planEncounterLighting:plan}=await load(),s=scene();
 s.units[0].hp=0;s.units[1].hp=0;
 assert.equal(plan(s,{mode:'contact',subjects:['revenant']}),null);
 assert.equal(plan({},{}),null);
 s.units[0].hp=50;s.units[0].x=-90;
 assert.equal(plan(s,{mode:'contact',subjects:[]}),null);
});
test('running renderer reuses existing lights, true camera subjects, rendered-frame injury clock and strict local server route',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/planEncounterLighting\(state,cinematicShot,/);
 assert.match(app,/encounterLighting\?\.mode==='duel'/);
 assert.match(app,/const lightStep=new THREE\.Vector3\(\)/);
 assert.match(app,/if\(lightInjury\)\{lightInjury\.age=advancePresentationActionAge/);
 assert.match(server,/\['\/dungeon\/encounter-lighting-plan\.js','encounter-lighting-plan\.js'\]/);
});
