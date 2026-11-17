'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const publicModule=()=>import(pathToFileURL(path.resolve(__dirname,
  '../../public/ai-maze-escape/map-view.mjs')).href);
const state=(override={})=>({
  runToken:'public-gate-witness',lifecycle:'running',result:null,
  width:9,height:9,tick:54,currentCell:40,visibleCells:[40,41],
  cells:[{cell:40,blocked:false,neighbors:[41]},
    {cell:41,blocked:false,neighbors:[40]}],doors:[],
  threats:[{id:'thornback-1',cell:41,lanternParried:false}],
  intent:{mode:'evading-threat'},...override
});
test('genuine current visible un-parried Warden retains immediate warning',async()=>{
  const {publicLiveGuardianWarning:warning}=await publicModule();
  const s=state();const old=JSON.stringify(s);
  assert.equal(warning(s),true);
  assert.equal(JSON.stringify(s),old,'HUD never mutates public authority');
  assert.equal(warning(state({threats:[{id:'thornback-1',cell:41,lanternParried:true},
    {id:'thornback-2',cell:41,lanternParried:false}]})),true,
    'a second active guardian keeps the warning during an earned counter');
});
test('stale evasion, hidden threats and already countered guardian cannot fake active Warden',async()=>{
  const {publicLiveGuardianWarning:warning}=await publicModule();
  assert.equal(warning(state({visibleCells:[40]})),false,'historical/hidden Warden is not immediate');
  assert.equal(warning(state({doors:[{a:40,b:41,open:false}]})),false,
    'one sealed PUBLIC door blocks immediate physical Warden danger');
  assert.equal(warning(state({cells:[{cell:40,blocked:false,neighbors:[]},
    {cell:41,blocked:false,neighbors:[]}]})),false,
    'visible but disconnected geometry cannot claim a nearby reachable attacker');
  assert.equal(warning(state({visibleCells:[40,50],
    cells:[{cell:40,blocked:false,neighbors:[50]},
      {cell:50,blocked:false,neighbors:[40]}],
    threats:[{id:'thornback-diagonal',cell:50,lanternParried:false}]})),false,
    'diagonal disclosed tiles cannot fabricate an open straight action corridor');
  assert.equal(warning(state({visibleCells:[40,41,42],
    cells:[{cell:40,blocked:false,neighbors:[41]},
      {cell:41,blocked:false,neighbors:[40,42]},
      {cell:42,blocked:false,neighbors:[41]}],
    threats:[{id:'thornback-two-steps',cell:42,lanternParried:false}]})),true,
    'a current disclosed TWO-LINK open physical guardian remains truly dangerous');
  assert.equal(warning(state({threats:[]})),false,'AI still evading cannot invent a Warden');
  assert.equal(warning(state({threats:[{id:'thornback-1',cell:41,lanternParried:true}]})),false,
    'a parried Warden is not an active attacker');
  assert.equal(warning(state({threats:[{id:'thornback-1',cell:41,lanternParried:false}],
    visibleCells:[41]})),false,'undisclosed current Pip cannot authenticate a fresh encounter');
  assert.equal(warning(state({threats:[{id:'thornback-1',cell:41,lanternParried:false}],
    lifecycle:'complete'})),false);
  assert.equal(warning(state({result:{reason:'escape'}})),false);
  assert.equal(warning(state({threats:[{id:'thornback-1',cell:41,lanternParried:false}],
    visibleCells:[40],secretVisibleThreats:[41]})),false,'secret data never authorizes a warning');
  assert.equal(warning(null),false);
});
test('live stage distinguishes real moving gate feedback from true simultaneous hazard',()=>{
  const source=fs.readFileSync(path.resolve(__dirname,
    '../../public/ai-maze-escape/app.js'),'utf8');
  assert.match(source,/const exposedDanger=!ended && publicLiveGuardianWarning\(snapshot\)\s*&& \(value\.scene==='danger'\|\|snapshot\.intent\.mode==='evading-threat'\)/,
    'a remembered AI strategy cannot override the public gate-opening stage');
  assert.match(source,/const freshGate=!ended && !urgent && !keyedSealedGate\s*&& gateMilestone\?\.runToken===snapshot\.runToken\s*&& hudVisualTime<gateMilestone\.until/,
    'real danger outranks the gate; a witnessed gate outranks only advisory pressure sighting');
  assert.match(source,/exposedDanger\\?'Immediate danger':freshGate\\?'PASSAGE OPEN':observingPressure/,
    'actual guardian danger stays first, but a real moving gate beats non-dangerous jaws inspection');
  assert.match(source,/exposedDanger\\?'Avoid warden':freshGate\\?'Gate opened':observingPressure/,
    'the same live action sentence cannot claim Watch jaws during a real gate lift');
  assert.match(source,/if\(witnessedOpenings\.length\)\s*eventCaption=exposedDanger\?'Gate opens\. Keep clear of Thornback\.':'A locked passage opened\.'/,
    'real CLOSED-to-OPEN gates remain narrated when Warden and gate genuinely coincide');
  assert.match(source,/const witnessedOpenings=observedGateOpenings\(frame\?\.snapshot,snapshot\)/,
    'no fake gate event or private-map proxy');
  assert.doesNotMatch(source,/privateMap|hiddenThreats/);
});
