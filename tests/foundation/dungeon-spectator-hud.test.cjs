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
