'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/spectator-ui.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const hero={id:'vanguard',kind:'vanguard',faction:'party',x:9,z:8,hp:80,maxHp:100};
const boss={id:'warden',kind:'warden',faction:'enemy',x:9,z:9,hp:180,maxHp:200,action:'idle',actionTick:0};
const state=(extra={})=>({phase:'exploring',tick:8,run:1,units:[hero,boss],bossPhase:'SENTINEL',guardianWard:false,defendersRemaining:0,bossWarning:null,bossRecovery:null,cultistWarnings:[],revenantWarnings:[],...extra});

test('Warden warning and release are grounded in authoritative threat data',async()=>{
 const {describeSpectatorDanger:describe}=await load();
 assert.equal(describe(state()),null,'a living boss alone is not a strike warning');
 const warning={shape:'RIFT_CROSS',cells:[{x:9,z:8}],attackTick:10};
 const actual=state({bossWarning:warning});
 const original=JSON.stringify(actual);
 assert.deepEqual(describe(actual),{kind:'warning',title:'WARDEN WARNING',detail:'Rift cross · impact in 2 turns'});
 assert.equal(JSON.stringify(actual),original,'HUD planning cannot mutate authority');
 assert.equal(describe(state({bossWarning:{...warning,cells:[]}})),null,'no authoritative danger cells means no warning');
 assert.equal(describe(state({bossWarning:{...warning,attackTick:8}})),null,'a stale warning is not a new attack');
 assert.deepEqual(describe(state({units:[hero,{...boss,action:'cast',actionTick:8}],bossRecovery:{remaining:2}})),{
  kind:'release',title:'WARDEN STRIKE',detail:'Ritual strike released this turn'
 });
});

test('counter and shield states cannot promise fictional damage or openings',async()=>{
 const {describeSpectatorDanger:describe}=await load();
 assert.deepEqual(describe(state({bossRecovery:{remaining:2}})),{
  kind:'counter',title:'COUNTER WINDOW',detail:'Warden recovering · 2 turns'
 });
 assert.deepEqual(describe(state({bossRecovery:{remaining:2},guardianWard:true,defendersRemaining:2})),{
  kind:'guard',title:'WARDEN SHIELDED',detail:'2 living guards remain'
 });
 assert.equal(describe(state({units:[hero,{...boss,x:18,z:18}],bossRecovery:{remaining:3}})),null,'remote Warden state is not an immediate danger');
 assert.equal(describe(state({phase:'intermission',bossWarning:{shape:'NOVA',cells:[{x:9,z:9}],attackTick:10}})),null);
});

test('spell and breach markers originate in real typed warnings, not event guesswork',async()=>{
 const {describeSpectatorDanger:describe}=await load();
 const withoutBoss=[hero,{...boss,hp:0}];
 assert.deepEqual(describe(state({units:withoutBoss,cultistWarnings:[{x:8,z:9,impactTick:11}]})),{
  kind:'hex',title:'SPELL WARNING',detail:'1 marked tile · impact in 3 turns'
 });
 assert.deepEqual(describe(state({units:withoutBoss,revenantWarnings:[{x:8,z:9,impactTick:9},{x:7,z:9,impactTick:9}]})),{
  kind:'breach',title:'REVENANT BREACH',detail:'2 marked tiles · impact in 1 turn'
 });
 assert.equal(describe(state({units:withoutBoss,cultistWarnings:[{x:8,z:9,impactTick:8}]})),null);
 assert.equal(describe(state({units:withoutBoss,events:[{kind:'danger',text:'Unknown damage'}]})),null);
});

test('floor conditions use exact public state, without a misleading progress percent',async()=>{
 const {describeExpeditionProgress:describe}=await load();
 const source=state({units:[hero,boss,{id:'revenant',kind:'revenant',faction:'enemy',hp:0}],traps:[
  {id:'t1',active:true,disarmed:false},{id:'t2',active:true,disarmed:true},
  {id:'t3',active:false,disarmed:false}
 ]});
 const frozen=JSON.stringify(source);
 assert.deepEqual(describe(source),{
  hostiles:1,alive:1,total:1,traps:1,portal:'SEALED',
  objective:'Defeat remaining enemies'
 });
 assert.equal(JSON.stringify(source),frozen,'read-only UI planning must not mutate any snapshot');
 const cleared=describe({...source,units:[hero,{...boss,hp:0}]});
 assert.equal(cleared.portal,'AVAILABLE');
 assert.equal(cleared.objective,'Reach the portal to descend');
 const lost=describe({...source,phase:'intermission'});
 assert.equal(lost.portal,'NEXT RUN');
 assert.equal(lost.objective,'Party defeated · new expedition forming');
 assert.equal(describe(null),null);
});

test('recent story note is bounded, genuine and never treats stale history as live danger',async()=>{
 const {recentExpeditionOutcome:recent}=await load();
 const events=[{kind:'loot',tick:9,text:'Relic found'},{kind:'danger',tick:10,text:'Warden hit knight'},
   {kind:'phase',tick:11,text:'The boss entered the second phase'}];
 assert.deepEqual(recent({tick:12,events}),{
  kind:'PHASE',text:'The boss entered the second phase',tick:11
 });
 assert.equal(recent({tick:27,events}),null,'stale events are not new live alerts');
 assert.equal(recent({tick:10,events:[{kind:'combat',tick:10,text:'A confusing raw trace'}]}),null);
 assert.equal(recent({tick:10,events:[{kind:'loot',tick:11,text:'Future event'}]}),null);
 assert.equal(recent({tick:10,events:[{kind:'loot',tick:10,text:'x'.repeat(240)}]}).text.length<=110,true);
});

test('mobile progress and danger controls are scoped to spectator DOM without camera/simulation imports',()=>{
 const html=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/index.html'),'utf8');
 const css=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/styles.css'),'utf8');
 assert.match(html,/id="hostiles-left"/);
 assert.match(html,/id="hazards-active"/);
 assert.match(html,/id="portal-status"/);
 assert.match(html,/id="quick-outcome"/);
 assert.match(html,/id="assistive-announcement"/);
 assert.match(css,/\.depth-track\{display:none\}/,'arbitrary progress bar must not imply a percent');
 assert.match(css,/\.visually-hidden/);
 assert.doesNotMatch(source,/fetch\(|Math\.random|localStorage\.setItem\('authoritative/);
});
