'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const cue=async()=> (await import(pathToFileURL(path.resolve(__dirname,
  '../../public/ai-maze-escape/map-view.mjs')).href)).publicImmediatePressureCue;
const cell=(id,trap=false,blocked=false)=>({cell:id,trap,blocked,neighbors:[]});
const published=(overrides={})=>({
  runToken:'public-pressure',tick:6,width:9,height:9,currentCell:40,
  cells:[cell(40),cell(41,true),cell(39,true)],visibleCells:[40,39,41],
  inventory:[],doors:[],keys:[],result:null,lifecycle:'running',...overrides
});
test('one-step genuinely visible physical pressure court outranks the known gate, without AI inference',async()=>{
  const pressure=await cue(),state=published({inventory:['copper'],doors:[{a:40,b:49,open:false}]});
  const before=JSON.stringify(state);
  assert.deepEqual(pressure(state),{cell:39,steps:1},'equal-distance visible jaw selection is stable');
  assert.equal(JSON.stringify(state),before,'HUD must not mutate source authority or plan');
  assert.deepEqual(pressure(published({cells:[cell(41,true),cell(39,true),cell(40)],
    visibleCells:[41,40,39]})),{cell:39,steps:1},'cell order is not a hidden tie-breaker');
  assert.deepEqual(pressure(published({cells:[cell(40,true),cell(41,true)]})),
    {cell:40,steps:0},'actual visible pressure under Pip is most immediate');
});
test('diagonal, distant, remembered-only, private and blocked hazards cannot falsely warn',async()=>{
  const pressure=await cue();
  const diagonal=published({cells:[cell(40),cell(50,true)],visibleCells:[40,50]});
  assert.equal(pressure(diagonal),null,'diagonal approach remains ordinary exploration');
  assert.equal(pressure(published({visibleCells:[40]})),null,'remembered hazard cannot flash');
  assert.equal(pressure(published({cells:[cell(40)],visibleCells:[40],
    privateTrapCells:[41],secretTrap:{cell:41}})),null,'private data cannot create HUD warnings');
  assert.equal(pressure(published({cells:[cell(40),cell(41,true,true)]})),null,
    'physically blocked tiles are not playable pressure encounters');
  assert.equal(pressure(published({currentCell:42})),null,'two-cell gap is not imminent');
  assert.equal(pressure(published({result:{reason:'trap-death'}})),null,'terminal state has priority');
  assert.equal(pressure(published({currentCell:-1})),null,'invalid public actor cell rejected');
  assert.equal(pressure(published({visibleCells:[39,41]})),null,
    'an undisclosed current actor tile cannot authorize extra HUD information');
});
test('live mission source uses the exact public cue before gate, pickup and goals, not a second panel',()=>{
  const fs=require('node:fs');
  const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/app.js'),'utf8');
  assert.match(source,/const pressureCue=!ended && !exposedDanger\s*\?\s*publicImmediatePressureCue\(snapshot\)\s*\|\|\s*publicPressureWithdrawalCue\(lastDistinctPressureSnapshot,snapshot\)\s*:\s*null/);
  assert.match(source,/const urgent=exposedDanger\|\|!!pressureCue/,'actual witnessed warning must outrank gate/landmark presentation');
  assert.match(source,/const previousPublicSnapshot=frame\?\.snapshot/,'only the public previous frame may authorize an urgent withdrawal');
  // The public immediately previous *poll* can be the very same tick;
  // exact original WebGL showed the live withdrawal warning vanish in that case.
  // Require the distinct consecutive public-tick predecessor and its common
  // source-camera helper, not merely a renamed variable.
  assert.match(source,/lastDistinctPressureSnapshot=publicDistinctPublicPredecessor\\(\\s*lastDistinctPressureSnapshot,previousPublicSnapshot,snapshot\\)/,
    'preserve the last distinct published tick through duplicate deliveries');
  assert.doesNotMatch(source,/publicPressureWithdrawalCue\\(previousPublicSnapshot,snapshot\\)/,
    'a duplicate poll is not a genuine new witnessed pressure beat');
  assert.match(source,/const keyedSealedGate=!ended && !urgent/);
  assert.match(source,/const freshKey=!ended && !urgent/);
  assert.match(source,/pressureCue\?'Avoid jaws'/);
  assert.doesNotMatch(source,/pressureCue\?'Pressure jaws ahead'/,
    'the 320px native hazard call cannot be clipped before its action verb');
  assert.match(source,/pressureCue\?'Keep clear of the jaws'/);
  assert.doesNotMatch(source,/pressureCue.*privateMap/,'HUD cannot depend on secret topology');
});
