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
  assert.match(source,/const freshGate=!ended && !urgent && !pressureApproach/,
    'an actually dangerous encounter still takes the live primary HUD chip');
  assert.match(source,/if\(witnessedOpenings\.length\)\s*eventCaption=exposedDanger\?'Gate opens\. Keep clear of Thornback\.':'A locked passage opened\.'/,
    'real CLOSED-to-OPEN gates remain narrated when Warden and gate genuinely coincide');
  assert.match(source,/const witnessedOpenings=observedGateOpenings\(frame\?\.snapshot,snapshot\)/,
    'no fake gate event or private-map proxy');
  assert.doesNotMatch(source,/privateMap|hiddenThreats/);
});
