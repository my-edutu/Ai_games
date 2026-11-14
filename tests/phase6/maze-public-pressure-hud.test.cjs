'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const cues=async()=>await import(pathToFileURL(path.resolve(__dirname,
  '../../public/ai-maze-escape/map-view.mjs')).href);
const cue=async()=> (await cues()).publicImmediatePressureCue;
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
test('real visible diagonal pressure approach gets an honest early sighting, not a fabricated attack',async()=>{
  const {publicVisibleDiagonalPressureCue:approach}=await cues();
  const state=published({currentCell:40,cells:[cell(40),cell(50,true)],
    visibleCells:[40,50]});
  const original=JSON.stringify(state);
  assert.deepEqual(approach(state),{cell:50,steps:2,diagonal:true});
  assert.equal(JSON.stringify(state),original,'presentation cannot mutate authoritative AI');
  assert.deepEqual(approach(published({cells:[cell(30,true),cell(40),cell(50,true)],
    visibleCells:[30,40,50]})),{cell:30,steps:2,diagonal:true},
    'equal visible diagonal hazards have stable public ordering');
  assert.equal(approach(published({cells:[cell(40),cell(41,true)],visibleCells:[40,41]})),
    null,'cardinal contact is owned by the immediate danger cue');
  assert.equal(approach(published({cells:[cell(40),cell(59,true)],visibleCells:[40,59]})),
    null,'a two-row gap is not a diagonal sighting');
  assert.equal(approach(published({cells:[cell(40),cell(50,true,true)],visibleCells:[40,50]})),
    null,'blocked hazard cannot act as a device cue');
  assert.equal(approach(published({cells:[cell(40),cell(50,true)],visibleCells:[40]})),
    null,'remembered-only trap cannot warn');
  assert.equal(approach(published({cells:[cell(40)],visibleCells:[40],secretTrap:{cell:50}})),
    null,'private trap is never consulted');
  assert.equal(approach(published({currentCell:40,cells:[cell(50,true)],visibleCells:[40,50]})),
    null,'unpublished current cell cannot authenticate a visible encounter');
  assert.equal(approach(published({result:{reason:'escape'},cells:[cell(40),cell(50,true)],
    visibleCells:[40,50]})),null,'terminal scene cannot show active exploration warnings');
  assert.equal(approach(published({currentCell:999,cells:[cell(40),cell(50,true)],
    visibleCells:[40,50]})),null,'out-of-board hero cannot discover a trap');
});

test('live mission source uses the exact public cue before gate, pickup and goals, not a second panel',()=>{
  const fs=require('node:fs');
  const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/app.js'),'utf8');
  assert.match(source,/const pressureCue=!ended && !exposedDanger\s*\?\s*publicImmediatePressureCue\(snapshot\)\s*\|\|\s*publicPressureWithdrawalCue\(lastDistinctPressureSnapshot,snapshot\)\s*:\s*null/);
  assert.match(source,/const urgent=exposedDanger\|\|!!pressureCue/,'actual witnessed warning must outrank gate/landmark presentation');
  assert.match(source,/publicVisibleDiagonalPressureCue\(snapshot\)/,
    'only a genuine currently published diagonal sighting can supply early anticipation');
  assert.match(source,/const witnessedKeyCelebration=!ended && pickupMilestone\?\.runToken===snapshot\.runToken\s*&& hudVisualTime<pickupMilestone\.until/,
    'an actual public key pickup needs the same short mission beat as its 3D shards');
  assert.match(source,/const pressureApproach=!ended && !exposedDanger && !pressureCue\s*&& !witnessedKeyCelebration/,
    'advisory diagonal pressure may not hide real key collection; urgent contact remains first');
  assert.match(source,/const keyedSealedGate=!ended && !urgent && !pressureApproach/);
  assert.match(source,/const freshGate=!ended && !urgent && !pressureApproach/);
  assert.match(source,/const freshKey=!ended && !urgent && !pressureApproach/);
  assert.match(source,/pressureApproach\?'Watch jaws'/,'sighting cannot claim an active jaw strike');
  assert.match(source,/pressureApproach\?'Jaws in sight'/,
    'the physically observed relay gets truthful first-sighting copy');
  assert.match(source,/dataset.pressureApproach=String\(!!pressureApproach\)/);
  assert.match(source,/const previousPublicSnapshot=frame\?\.snapshot/,'only the public previous frame may authorize an urgent withdrawal');
  // The public immediately previous *poll* can be the very same tick;
  // exact original WebGL showed the live withdrawal warning vanish in that case.
  // Require the distinct consecutive public-tick predecessor and its common
  // source-camera helper, not merely a renamed variable.
  assert.match(source,/lastDistinctPressureSnapshot=publicDistinctPublicPredecessor\(\s*lastDistinctPressureSnapshot,previousPublicSnapshot,snapshot\)/,
    'preserve the last distinct published tick through duplicate deliveries');
  assert.doesNotMatch(source,/publicPressureWithdrawalCue\(previousPublicSnapshot,snapshot\)/,
    'a duplicate poll is not a genuine new witnessed pressure beat');
  assert.match(source,/const keyedSealedGate=!ended && !urgent/);
  assert.match(source,/const freshKey=!ended && !urgent/);
  assert.match(source,/pressureCue\?'Avoid jaws'/);
  assert.doesNotMatch(source,/pressureCue\?'Pressure jaws ahead'/,
    'the 320px native hazard call cannot be clipped before its action verb');
  assert.match(source,/pressureCue\?'Keep clear of the jaws'/);
  assert.doesNotMatch(source,/pressureCue.*privateMap/,'HUD cannot depend on secret topology');
});
