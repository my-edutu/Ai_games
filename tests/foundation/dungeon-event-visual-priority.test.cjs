'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const load=async()=>import('data:text/javascript;base64,'+Buffer.from(read('public/ai-dungeon/event-visual-priority-plan.js')).toString('base64'));
const source=()=>({units:[
 {id:'vanguard',kind:'vanguard',faction:'party',hp:120},
 {id:'mystic',kind:'mystic',faction:'party',hp:50},
 {id:'warden',kind:'warden',faction:'enemy',hp:90},
 {id:'cultist',kind:'cultist',faction:'enemy',hp:0}],bossWarning:{shape:'NOVA',cells:[{x:9,z:9}]}});
test('Warden and Cultist telegraphs use physical warning cells without extra arena pulses',async()=>{
 const {planEventVisualPriority:f}=await load(),s=source(),before=JSON.stringify(s);
 for(const text of ['The Warden prepares NOVA','Cultist prepares a sigil']){
  const p=f({kind:'telegraph',text,tick:12},s);assert.equal(p.pulse,null);assert.equal(p.particleCount,0);
 }
 assert.equal(JSON.stringify(s),before);
});
test('actual Warden strike and fully dodged shockwave never fake extra broad hit',async()=>{
 const {planEventVisualPriority:f}=await load();
 for(const kind of ['danger','evade'])for(const shape of ['nova','rift cross','eclipse sweep'])
  for(const hits of [0,2]){
   const p=f({kind,text:'The Warden '+shape+' shockwave struck '+hits+' heroes'},source());
   assert.equal(p.pulse,null);assert.equal(p.particleCount,0);
  }
});
test('real Warden phase and unseal remain a contained origin-anchored chapter',async()=>{
 const {planEventVisualPriority:f}=await load();
 for(const kind of ['phase','unseal']){
  const p=f({kind},source());assert.equal(p.pulse.targetId,'warden');
  assert.equal(p.pulse.kind,'chapter');assert.ok(1.24*p.pulse.to<1.5);
  assert.ok(p.particleCount<=4);
 }
});
test('special boss defeat cue requires a genuinely dead Warden',async()=>{
 const {planEventVisualPriority:f}=await load(),s=source();
 assert.equal(f({kind:'kill',text:'WARDEN DEFEATED'},s).pulse,null);
 s.units[2].hp=0;
 assert.equal(f({kind:'kill',text:'WARDEN DEFEATED'},s).pulse.targetId,'warden');
 assert.equal(f(null,s).pulse,null);assert.equal(f({kind:'kill'},null).pulse,null);
});
test('ordinary healing and results preserve bounded cue channels',async()=>{
 const {planEventVisualPriority:f}=await load(),s=source();
 assert.equal(f({kind:'healing'},s).pulse.targetId,'mystic');
 assert.equal(f({kind:'loot'},s).particleCount,4);
 assert.equal(f({kind:'kill',text:'Cultist defeated'},s).pulse.targetId,'cultist');
 assert.equal(f({kind:'danger',text:'Trap'},s).particleCount,4);
 assert.equal(f({kind:'floor'},s).particleCount,10);
});
test('integrated live runtime retains real boss warning and physical damage scars',()=>{
 const a=read('public/ai-dungeon/app.js'),r=read('scripts/serve-dungeon-stream.cjs');
 assert.match(a,/planEventVisualPriority\(event,s\)/);
 assert.match(a,/wardenImpactScars\?\.accept\(previousState,s,timeNow\(\)\)/);
 assert.match(a,/planWardenTacticalCue\(s,\{nearBoss\}\)/);
 assert.ok(r.includes("['/dungeon/event-visual-priority-plan.js','event-visual-priority-plan.js']"));
 assert.ok(a.includes('shockwave struck'));
});
