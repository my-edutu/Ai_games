'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const load=()=>import('../../public/ai-maze-escape/map-view.mjs');
const CELL=2.4,ASPECT=320/740;
const snap=(cell,extras={})=>({runToken:'public-camera-test',width:7,height:7,
 currentCell:24,visibleCells:[cell],cells:[{cell,trap:true,blocked:false}],...extras});
test('real 320px diagonal published pressure jaw gets a shared physical stage without reducing hero scale',async()=>{
 const {publicObservedTrapCameraFocus:focus}=await load();
 const hero={x:0,z:0};
 const orthogonal=focus(snap(25),hero,CELL,ASPECT);
 const diagonal=focus(snap(32),hero,CELL,ASPECT);
 assert.equal(orthogonal.weight,.44,'previous in-frame one-cell pose remains unchanged');
 assert.ok(diagonal.distance>CELL*1.41&&diagonal.distance<CELL*1.42);
 assert.ok(diagonal.weight>.54&&diagonal.weight<.59,
  'a genuinely visible diagonal jaw cannot receive the prior ~.076 aim that clipped its 320px physical silhouette');
 assert.ok(diagonal.weight>orthogonal.weight);
 assert.deepEqual(focus(snap(32),hero,CELL,ASPECT),diagonal,'deterministic public camera');
});
test('diagonal trap composition never reads hidden traps, persists after results or changes landscape/other cameras',async()=>{
 const {publicObservedTrapCameraFocus:focus}=await load();
 const hero={x:0,z:0},s=snap(32),before=JSON.stringify(s);
 assert.equal(focus(snap(32,{visibleCells:[]}),hero,CELL,ASPECT),null);
 assert.equal(focus(snap(32,{cells:[{cell:32,trap:true,blocked:true}]}),hero,CELL,ASPECT),null);
 assert.equal(focus(snap(32,{result:{reason:'capture'}}),hero,CELL,ASPECT),null);
 assert.equal(focus(s,hero,CELL,844/390),null);
 assert.equal(focus(s,hero,CELL,NaN),null);
 assert.equal(focus(s,{x:NaN,z:0},CELL,ASPECT),null);
 assert.equal(focus(s,hero,0,ASPECT),null);
 assert.equal(JSON.stringify(s),before,'no source snapshot mutation');
 const closer=focus(s,{x:CELL*.24,z:CELL*.24},CELL,ASPECT);
 assert.ok(closer.weight<.57&&closer.weight>0,'continuous public approach pan');
});

test('real public pressure camera catches autonomous diagonal staging without altering other modes',async()=>{
 const {publicCameraSettleRate:rate}=await load();
 const eased=(value)=>1-Math.exp(-.18*value); // one real 180ms public update
 assert.equal(rate(false,false,false,false),4.5,'neutral exploration remains unchanged');
 assert.equal(rate(false,false,false,true),8,'witnessed opening retains its own camera speed');
 assert.equal(rate(false,true,false,false),10,'public guardian keeps its verified response');
 assert.equal(rate(false,false,true,false),10,'actual published pressure stage receives fast framing');
 assert.equal(rate(true,false,true,false),12,'witnessed pickup retains priority');
 assert.equal(rate(false,false,true,true),10,'pressure shot outranks generic gate transition');
 assert.ok(eased(rate(false,false,true,false))>.83,'camera settles over 83% within a normal public poll interval');
 assert.ok(eased(rate(false,false,false,false))<.56,'unrelated maze discovery keeps calm settling');
});


test('a REAL adjacent published pressure hazard takes the 320/390 Follow stage from an unrelated known sealed gate',async()=>{
 const {publicPressureTakesFocus:takes,publicObservedTrapCameraFocus:focus}=await load();
 const withGate=snap(25,{doors:[{a:24,b:25,open:false,requiredKeyId:'k'}],inventory:['k']});
 const original=JSON.stringify(withGate),hero={x:0,z:0};
 const pressure=focus(withGate,hero,CELL,ASPECT);
 assert.ok(pressure && pressure.weight>=.34);
 assert.equal(takes(withGate,pressure,CELL,ASPECT,'follow'),true,
   'actual published one-cell physical hazard outranks old closed-gate portrait');
 assert.equal(takes(withGate,pressure,CELL,390/844,'follow'),true);
 assert.equal(takes(withGate,pressure,CELL,844/390,'follow'),false,
   'landscape stage remains on its separately verified camera contract');
 assert.equal(takes(withGate,pressure,CELL,ASPECT,'detail'),false);
 assert.equal(takes(withGate,pressure,CELL,ASPECT,'overview'),false);
 assert.equal(takes(withGate,pressure,CELL,ASPECT,'follow',true),false,
   'guardian warning still wins');
 assert.equal(takes(withGate,pressure,CELL,ASPECT,'follow',false,true),false,
   'actual witnessed opening still wins');
 assert.equal(takes(withGate,pressure,CELL,ASPECT,'follow',false,false,true),false,
   'actual pickup still wins');
 assert.equal(JSON.stringify(withGate),original,'never change public authority');
});


test('exact native tick-5 contact to tick-6 diagonal withdrawal keeps original physical pressure partner',async()=>{
 const {publicPressureWithdrawalTakesFocus:retain,publicObservedTrapCameraFocus:focus,
   publicPressureTakesFocus:ordinary}=await load();
 const before=snap(32,{tick:5,currentCell:25});
 const after=snap(32,{tick:6,currentCell:24,
   doors:[{a:24,b:25,open:false,requiredKeyId:'k'}],inventory:['k']});
 const state=JSON.stringify(after),jaw=focus(after,{x:0,z:0},CELL,ASPECT);
 assert.ok(jaw.weight>.54,'original diagonal jaw pan remains in place');
 assert.equal(ordinary(after,jaw,CELL,ASPECT),false,'ordinary diagonal gate camera is unchanged');
 assert.equal(retain(before,after,jaw,CELL,ASPECT),true,
   'one PUBLIC adjacent encounter earns an uninterrupted withdrawal camera');
 assert.equal(retain(before,after,jaw,CELL,390/844),true);
 assert.equal(JSON.stringify(after),state,'camera may not mutate public authority');
});
test('withdrawal shot rejects invented, hidden, stale, disconnected and priority-conflicting evidence',async()=>{
 const {publicPressureWithdrawalTakesFocus:retain,publicObservedTrapCameraFocus:focus}=await load();
 const prior=snap(32,{tick:5,currentCell:25}),current=snap(32,{tick:6,currentCell:24});
 const jaw=focus(current,{x:0,z:0},CELL,ASPECT);
 const check=(a=prior,b=current,t=jaw,aspect=ASPECT,mode='follow',guardian=false,opening=false,pickup=false)=>
   retain(a,b,t,CELL,aspect,mode,guardian,opening,pickup);
 assert.equal(check(),true);
 for(const [a,b] of [
  [prior,{...current,visibleCells:[]}],[{...prior,visibleCells:[]},current],
  [prior,{...current,cells:[{cell:32,trap:false,blocked:false}]}],
  [prior,{...current,cells:[{cell:32,trap:true,blocked:true}]}],
  [prior,{...current,runToken:'another-run'}],
  [prior,{...current,tick:5}],
  [{...prior,currentCell:24},current],
  [{...prior,currentCell:17},current],
  [prior,{...current,currentCell:25}],
  [prior,{...current,currentCell:16}],
  [prior,{...current,result:{reason:'capture'}}],
 ])assert.equal(check(a,b),false,'real current public sequence required');
 assert.equal(check(prior,current,{...jaw,cell:31}),false);
 assert.equal(check(prior,current,{...jaw,weight:0}),false);
 assert.equal(check(prior,current,{...jaw,distance:Infinity}),false);
 assert.equal(check(prior,current,jaw,844/390),false);
 assert.equal(check(prior,current,jaw,ASPECT,'detail'),false);
 assert.equal(check(prior,current,jaw,ASPECT,'overview'),false);
 assert.equal(check(prior,current,jaw,ASPECT,'follow',true),false);
 assert.equal(check(prior,current,jaw,ASPECT,'follow',false,true),false);
 assert.equal(check(prior,current,jaw,ASPECT,'follow',false,false,true),false);
});
test('pressure-first camera rejects hidden, remembered, blocked, terminal, diagonal and forged candidates',async()=>{
 const {publicPressureTakesFocus:takes,publicObservedTrapCameraFocus:focus}=await load();
 const visible=snap(25),pressure=focus(visible,{x:0,z:0},CELL,ASPECT);
 assert.equal(takes(snap(25,{visibleCells:[]}),pressure,CELL,ASPECT),false);
 assert.equal(takes(snap(25,{cells:[{cell:25,trap:true,blocked:true}]}),pressure,CELL,ASPECT),false);
 assert.equal(takes(snap(25,{result:{win:true}}),pressure,CELL,ASPECT),false);
 assert.equal(takes(snap(25,{cells:[{cell:25,trap:false,blocked:false}]}),pressure,CELL,ASPECT),false);
 assert.equal(takes(snap(25,{currentCell:16}),pressure,CELL,ASPECT),false);
 assert.equal(takes(visible,{...pressure,cell:100},CELL,ASPECT),false);
 assert.equal(takes(visible,{...pressure,distance:Infinity},CELL,ASPECT),false);
 assert.equal(takes(visible,{...pressure,weight:.01},CELL,ASPECT),false);
 assert.equal(takes(visible,pressure,0,ASPECT),false);
 assert.equal(takes(visible,pressure,CELL,NaN),false);
 const diagonal=focus(snap(32),{x:0,z:0},CELL,ASPECT);
 assert.equal(takes(snap(32),diagonal,CELL,ASPECT),false,
   'one-cell pressure priority cannot swallow verified diagonal gate framing');
});

test('production Follow camera wires pressure-first priority without changing the strict public jaw bounds',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
 assert.match(source,/const pressureFirst = publicPressureTakesFocus\(/);
 assert.match(source,/\|\| publicPressureWithdrawalTakesFocus\(/);
 assert.match(source,/priorPublicSnapshot\s*=\s*publicDistinctPublicPredecessor\(\s*priorPublicSnapshot,\s*previous,\s*snapshot\s*\)/,
   'only the last DISTINCT consecutive public tick can retain a witnessed jaw');
 assert.doesNotMatch(source,/priorPublicSnapshot\s*=\s*previous\s*;/,
   'a repeated same-tick poll must not erase the previously witnessed physical encounter');
 assert.match(source,/cameraGate = pressureFirst \? null : openingGateBeat \|\| nearObservedGate/);
 assert.match(source,/pressureFirst \? 4\.70/,'same optical budget as existing keyed 320/390 stage');
 assert.match(source,/\(pressureFirst \|\| !keyGateCue\)/);
 assert.match(source,/if \(!pressureFirst && !settings\.reducedMotion/);
});


test('published pressure warning stays actionable for exactly one REAL connected diagonal withdrawal',async()=>{
 const {publicImmediatePressureCue,publicPressureWithdrawalCue:carry}=await load();
 const cells=[
  {cell:24,neighbors:[25],blocked:false},
  {cell:25,neighbors:[24,32],blocked:false},
  {cell:32,neighbors:[25],trap:true,blocked:false}
 ];
 const before={runToken:'physical-pressure',tick:5,width:7,height:7,
  currentCell:25,cells,visibleCells:[24,25,32],doors:[],result:null};
 const after={...before,tick:6,currentCell:24};
 const original=JSON.stringify({before,after});
 assert.deepEqual(publicImmediatePressureCue(before),{cell:32,steps:1});
 assert.equal(publicImmediatePressureCue(after),null);
 assert.deepEqual(carry(before,after),{cell:32,steps:2,withdrawal:true});
 assert.equal(carry(after,{...after,tick:7,currentCell:24}),null,
  'once Pip is diagonal, no indefinite pressure HUD warning');
 assert.equal(JSON.stringify({before,after}),original,'never mutate publicly streamed game authority');
});
test('pressure withdrawal never invents a warning across closed, unknown, one-way or stale events',async()=>{
 const {publicPressureWithdrawalCue:carry}=await load();
 const cells=[
  {cell:24,neighbors:[25],blocked:false},
  {cell:25,neighbors:[24,32],blocked:false},
  {cell:32,neighbors:[25],trap:true,blocked:false}
 ];
 const before={runToken:'pressure-test',tick:5,width:7,height:7,currentCell:25,
  cells,visibleCells:[24,25,32],doors:[],result:null};
 const after={...before,tick:6,currentCell:24};
 const variants=[
  [{...before,runToken:'old'},after],
  [before,{...after,tick:7}],
  [before,{...after,currentCell:23}],
  [before,{...after,result:{reason:'capture'}}],
  [before,{...after,visibleCells:[24,25]}],
  [{...before,visibleCells:[24,25]},after],
  [before,{...after,cells:cells.slice(0,2)}],
  [before,{...after,cells:cells.map(c=>c.cell===32?{...c,trap:false}:c)}],
  [before,{...after,cells:cells.map(c=>c.cell===24?{...c,blocked:true}:c)}],
  [before,{...after,cells:cells.map(c=>c.cell===24?{...c,neighbors:[]}:c)}],
  [before,{...after,doors:[{a:24,b:25,open:false}]}],
  [{...before,doors:[{a:24,b:25,open:false}]},after]
 ];
 for(const [a,b] of variants) assert.equal(carry(a,b),null,
  'cannot prolong a danger warning from missing or fabricated public movement');
});
test('the actual game-first overlay consumes ONLY the public pressure retreat',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/app.js'),'utf8');
 assert.match(source,/publicImmediatePressureCue\(snapshot\)\s*\|\| publicPressureWithdrawalCue\(lastDistinctPressureSnapshot,snapshot\)/,
    'game-first HUD must retain the exact distinct public pressure witness across repeated polls');
  assert.match(source,/lastDistinctPressureSnapshot=publicDistinctPublicPredecessor\(/,
    'only the same consecutive public ticks may carry a visible withdrawal warning');
  assert.doesNotMatch(source,/publicPressureWithdrawalCue\(previousPublicSnapshot,snapshot\)/,
    'immediate previous network poll is not necessarily the preceding authoritative tick');
 assert.match(source,/const urgent=exposedDanger\|\|!!pressureCue/);
 assert.match(source,/pressureCue\?'Avoid jaws'/);
 assert.match(source,/pressureCue\?'Keep clear of the jaws'/);
});

test('native tick6 uses the genuinely witnessed pressure partner after a legal public retreat, not a stale sealed gate',async()=>{
 const {publicVerifiedPressureRetreatPartner:retain}=await load();
 const cells=[
  {cell:24,neighbors:[25],blocked:false},
  {cell:25,neighbors:[24,32],blocked:false},
  {cell:32,neighbors:[25],trap:true,blocked:false}
 ];
 const before={runToken:'source-tick6',tick:5,width:7,height:7,
  currentCell:25,cells,visibleCells:[25,32],doors:[],result:null};
 const after={...before,tick:6,currentCell:24,
  // Only the newly occupied cell is visible now; the earlier witnessed
  // physical mechanism remains in the public known maze and still renders.
  visibleCells:[24],doors:[{a:24,b:17,open:false}]};
 const untouched=JSON.stringify({before,after});
 assert.deepEqual(retain(before,after,CELL,ASPECT),{
  cell:32,x:CELL,z:CELL,distance:CELL*Math.SQRT2,weight:.57,verifiedRetreat:true
 });
 assert.equal(JSON.stringify({before,after}),untouched);
 assert.equal(retain(before,after,CELL,390/844)?.cell,32);
 assert.equal(retain(before,after,CELL,844/390),null);
});
test('public retreat shot never promotes previously secret, forged, blocked or disconnected geometry',async()=>{
 const {publicVerifiedPressureRetreatPartner:retain}=await load();
 const cells=[
  {cell:24,neighbors:[25],blocked:false},
  {cell:25,neighbors:[24,32],blocked:false},
  {cell:32,neighbors:[25],trap:true,blocked:false}
 ];
 const before={runToken:'sealed-source',tick:5,width:7,height:7,
  currentCell:25,cells,visibleCells:[25,32],doors:[],result:null};
 const after={...before,tick:6,currentCell:24,visibleCells:[24]};
 const pick=(a=before,b=after,mode='follow',guardian=false,opening=false,pickup=false)=>
  retain(a,b,CELL,ASPECT,mode,guardian,opening,pickup);
 assert.equal(pick()?.cell,32);
 for(const [a,b] of [
  [{...before,visibleCells:[25]},after],
  [before,{...after,cells:cells.slice(0,2)}],
  [before,{...after,cells:cells.map(c=>c.cell===32?{...c,trap:false}:c)}],
  [before,{...after,cells:cells.map(c=>c.cell===32?{...c,blocked:true}:c)}],
  [before,{...after,cells:cells.map(c=>c.cell===24?{...c,neighbors:[]}:c)}],
  [before,{...after,cells:cells.map(c=>c.cell===25?{...c,neighbors:[32]}:c)}],
  [before,{...after,doors:[{a:24,b:25,open:false}]}],
  [{...before,doors:[{a:24,b:25,open:false}]},after],
  [{...before,cells:cells.map(c=>c.cell===25?{...c,blocked:true}:c)},after],
  [before,{...after,currentCell:17}],
  [before,{...after,currentCell:25}],
  [before,{...after,runToken:'another'}],
  [before,{...after,tick:7}],
  [before,{...after,visibleCells:[]}],
  [before,{...after,result:{reason:'capture'}}]
 ])assert.equal(pick(a,b),null);
 assert.equal(pick(before,after,'overview'),null);
 assert.equal(pick(before,after,'detail'),null);
 assert.equal(pick(before,after,'follow',true),null);
 assert.equal(pick(before,after,'follow',false,true),null);
 assert.equal(pick(before,after,'follow',false,false,true),null);
 assert.equal(pick(before,after,'follow')?.verifiedRetreat,true);
});
test('a real previously VISIBLE pressure jaw stays in the retreat camera even across a non-walkable wall',async()=>{
 const {publicVerifiedPressureRetreatPartner:retain}=await load();
 // A rendered pressure mechanism may be seen through an opening or over
 // low masonry without being traversable. Camera staging does not certify
 // a walking edge to the hazard. Pip's *actual* retreat edge must be open.
 const cells=[
   {cell:24,neighbors:[25],blocked:false},
   {cell:25,neighbors:[24],blocked:false},
   {cell:32,neighbors:[],trap:true,blocked:false}
 ];
 const before={runToken:'wall-side-pressure',tick:5,width:7,height:7,
   currentCell:25,cells,visibleCells:[25,32],doors:[],result:null};
 const after={...before,tick:6,currentCell:24,visibleCells:[24]};
 const unchanged=JSON.stringify([before,after]);
 const witnessed=retain(before,after,CELL,ASPECT);
 assert.equal(witnessed?.cell,32,
   'cannot abandon a physically witnessed jaw simply because Pip cannot walk into its tile');
 assert.equal(witnessed?.verifiedRetreat,true);
 assert.equal(witnessed?.weight,.57);
 assert.equal(JSON.stringify([before,after]),unchanged,'camera must not mutate public state');
 assert.equal(retain({...before,visibleCells:[25]},after,CELL,ASPECT),null,
   'an undisclosed pressure mechanism can never become a camera subject');
 assert.equal(retain(before,{...after,cells:cells.map(c=>c.cell===32?{...c,trap:false}:c)},CELL,ASPECT),null);
 assert.equal(retain(before,{...after,doors:[{a:24,b:25,open:false}]},CELL,ASPECT),null,
   'an actually closed retreat edge cannot validate movement');
 assert.equal(retain(before,{...after,cells:cells.map(c=>c.cell===25?{...c,neighbors:[]}:c)},CELL,ASPECT),null,
   'a one-way hero retreat is not legitimate');
 assert.equal(retain(before,after,CELL,844/390),null);
});

test('real production camera keeps the previous witnessed pressure shape without altering its strict silhouette gate',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
 assert.match(source,/const verifiedRetreatTrap = publicVerifiedPressureRetreatPartner\(/);
 assert.match(source,/\|\| !!verifiedRetreatTrap/);
 assert.match(source,/const publicPressureTrap = verifiedRetreatTrap/);
 assert.match(source,/cameraGate = pressureFirst \? null : openingGateBeat \|\| nearObservedGate/);
 assert.match(source,/pressureCameraBeat = true/);
 assert.match(source,/pressureCameraPartner: pressureCameraBeat && publicPressureTrap/);
 assert.match(source,/verifiedRetreat:!!verifiedRetreatTrap/);
});


test('real consecutive public pressure witness survives repeated SAME-tick stream polls until its legitimate withdrawal is fully rendered',async()=>{
 const {publicDistinctPublicPredecessor:hold,publicVerifiedPressureRetreatPartner:retain}=await load();
 const cells=[
  {cell:24,neighbors:[25],blocked:false},
  {cell:25,neighbors:[24],blocked:false},
  {cell:32,neighbors:[],trap:true,blocked:false}
 ];
 const tick5={runToken:'real-pressure-run',tick:5,width:7,height:7,
  currentCell:25,cells,visibleCells:[25,32],doors:[],result:null};
 const tick6={...tick5,tick:6,currentCell:24,visibleCells:[24]};
 const original=JSON.stringify([tick5,tick6]);
 let prior=hold(null,tick5,tick6);
 assert.equal(prior,tick5,'one genuine previous public tick is the only witness');
 for(let poll=0;poll<12;poll++){
  prior=hold(prior,tick6,{...tick6});
  assert.equal(prior,tick5,'repeated unchanged tick6 network samples cannot erase real tick5 contact');
  assert.equal(retain(prior,tick6,CELL,ASPECT)?.verifiedRetreat,true,
   'the authentic known wall-side jaw remains the camera subject through the real withdrawal');
 }
 assert.equal(hold(prior,tick6,{...tick6,runToken:'different-run'}),null);
 assert.equal(hold(prior,tick6,{...tick6,tick:8}),null,
  'do not keep camera history across skipped public movement');
 assert.equal(hold(prior,tick6,{...tick6,tick:5}),null,
  'never reuse a witnessed jaw when the source moves backward');
 assert.equal(hold({...tick5,tick:4},tick6,{...tick6}),null,
  'stale earlier history may not earn an ongoing pressure stage');
 assert.equal(hold(prior,tick6,{...tick6,tick:7}),tick6,
  'the actual next public tick replaces the old witness');
 assert.equal(hold(prior,tick6,{...tick6,tick:NaN}),null);
 assert.equal(JSON.stringify([tick5,tick6]),original,'no private map mutation or synthetic AI action');
});

test('native 3D renderer consumes the retained distinct public tick rather than resetting it on each repeat poll',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
 assert.match(source,/publicDistinctPublicPredecessor\(\s*priorPublicSnapshot,previous,snapshot\)/);
 assert.doesNotMatch(source,/priorPublicSnapshot\s*=\s*previous\s*;/);
 assert.match(source,/const verifiedRetreatTrap = publicVerifiedPressureRetreatPartner\(/);
});

test('actual full-mesh pressure portrait fits a cropped jaw and Pip without zooming either physical model',async()=>{
 const {publicPhysicalPressureHorizontalReframe:fit}=await load();
 const aspect=320/740, height=4.70;
 // Original exact-source mobile tick6, physical jaw left -1.28288 and
 // Pip right +.36043; the total real stage width is under strict 1.90 NDC.
 const hero={left:-.2049,right:.36043},jaw={left:-1.28288,right:-.6017};
 const original=JSON.stringify([hero,jaw]);
 const shift=fit(hero,jaw,height,aspect);
 assert.ok(shift<0,'camera moves left so both real objects move right');
 const ndc=shift/(height*aspect);
 assert.ok(Math.min(hero.left,jaw.left)-ndc>=-.95000001);
 assert.ok(Math.max(hero.right,jaw.right)-ndc<=.95000001);
 assert.equal(fit({left:-.3,right:.25},{left:-.8,right:-.5},height,aspect),0,
   'already safe physical shot must keep its established cinematic lens');
 assert.equal(JSON.stringify([hero,jaw]),original,'no actor or jaw manipulation');
});
test('physical pressure reframe fails closed for impossible, unsupported or forged models',async()=>{
 const {publicPhysicalPressureHorizontalReframe:fit}=await load();
 const hero={left:-.2,right:.36},jaw={left:-1.29,right:-.6};
 assert.equal(fit(hero,jaw,4.7,844/390),0,'landscape remains unchanged');
 assert.equal(fit(hero,jaw,4.7,NaN),0);
 assert.equal(fit(hero,jaw,-1,320/740),0);
 assert.equal(fit(null,jaw,4.7,320/740),0);
 assert.equal(fit(hero,{left:NaN,right:1},4.7,320/740),0);
 assert.equal(fit(hero,{left:-3,right:-.6},4.7,320/740),0,
   'do not falsely approve a physical pair wider than ±0.95 can contain');
});
test('the genuine pressure lens uses conservative world mesh union, not centers or hidden map',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
 assert.match(source,/if \(pressureCameraBeat && publicPressureTrap && aspect>=\.35/);
 assert.match(source,/world\.group\.getObjectByName\(/);
 assert.match(source,/root\.traverseVisible\(mesh =>/);
 // Original 320px tick6 Pip WORLD envelope (+.956261) exceeded per-mesh
 // projections. Verify the renderer fits the same union as the native gate.
 assert.match(source,/pressureReframeEnvelope\.makeEmpty\(\)/);
 assert.match(source,/pressureReframeEnvelope\.union\([\s\S]*?applyMatrix4\(mesh\.matrixWorld\)/);
 assert.match(source,/pressureReframePoint\.set\(x,y,z\)\.project\(camera\)/);
 assert.match(source,/publicPhysicalPressureHorizontalReframe\(/);
 assert.match(source,/cameraTarget\.addScaledVector\(pressureReframeRight,horizontalShift\)/);
 assert.doesNotMatch(source,/camera\.zoom\s*=\s*.*horizontalShift/);
});

test('real pressure retreat HUD survives repeated tick-6 polling without invented stale dangers',async()=>{
  const {publicDistinctPublicPredecessor:retain,
    publicImmediatePressureCue:immediate,
    publicPressureWithdrawalCue:withdraw}=await load();
  const cells=[
    {cell:24,neighbors:[25],blocked:false},
    {cell:25,neighbors:[24,32],blocked:false},
    {cell:32,neighbors:[25],trap:true,blocked:false}
  ];
  const observed={runToken:'retreat-press',tick:5,width:7,height:7,
    currentCell:25,cells,visibleCells:[24,25,32],doors:[
      {a:17,b:18,open:false,requiredKeyId:'real-key'}
    ],inventory:['real-key'],result:null};
  const depart={...observed,tick:6,currentCell:24};
  let prior=null, current=null;
  const publicHudCue=next=>{
    prior=retain(prior,current,next);
    current=next;
    return immediate(next)||withdraw(prior,next);
  };
  const original=JSON.stringify({observed,depart});
  assert.deepEqual(publicHudCue(observed),{cell:32,steps:1});
  assert.deepEqual(publicHudCue(depart),{cell:32,steps:2,withdrawal:true});
  assert.deepEqual(publicHudCue({...depart}),{cell:32,steps:2,withdrawal:true},
    'a second poll of tick6 must not hand the urgent mission to the known gate');
  assert.equal(publicHudCue({...depart,tick:7}),null,
    'the next distinct public tick ends the single authorized withdrawal');
  assert.equal(publicHudCue({...observed,runToken:'new-run',tick:1,currentCell:24}),null,
    'a new run cannot inherit old danger');
  assert.equal(publicHudCue({...observed,runToken:'new-run',tick:4,currentCell:24}),null,
    'skipped public ticks cannot inherit old danger');
  assert.equal(JSON.stringify({observed,depart}),original,
    'HUD state must not modify any authoritative public snapshot');
  const fs=require('node:fs'),path=require('node:path');
  const source=fs.readFileSync(path.resolve(__dirname,
    '../../public/ai-maze-escape/app.js'),'utf8');
  assert.match(source,/lastDistinctPressureSnapshot=publicDistinctPublicPredecessor\(\s*lastDistinctPressureSnapshot,previousPublicSnapshot,snapshot\)/);
  assert.match(source,/publicPressureWithdrawalCue\(lastDistinctPressureSnapshot,snapshot\)/);
  assert.doesNotMatch(source,/publicPressureWithdrawalCue\(previousPublicSnapshot,snapshot\)/,
    'production must use distinct public ticks, not an arbitrary repeated poll');
});

test('Pass258 exact 320px connected pressure arch keeps real Pip and jaw within unchanged ±0.95 on withdrawal',async()=>{
  const {publicPhysicalPressureRetreatHalfHeight:retreat,
    publicPhysicalPressureHorizontalReframe:reframe}=await load();
  // ORIGINAL unmodified 320x740 new-HEAD WebGL diagnostic:
  // b2d28476 public-tide-shear-withdrawal-320.json, tick8.
  const hero={left:.3491505262381818,right:.9562135074612816};
  const jaw={left:-.9382301821841119,right:-.05969995446148939};
  const height=7.151637499999999, aspect=320/740;
  const original=JSON.stringify({hero,jaw});
  const fitted=retreat(hero,jaw,height,aspect,true);
  assert.ok(fitted>height && fitted<height*1.025,
    'only the authentic 1.89444-wide physical pair earns a bounded optical correction');
  const zoom=height/fitted;
  const correctedHero={left:hero.left*zoom,right:hero.right*zoom};
  const correctedJaw={left:jaw.left*zoom,right:jaw.right*zoom};
  const translation=reframe(correctedHero,correctedJaw,fitted,aspect);
  const ndcShift=translation/(fitted*aspect);
  const finalLeft=Math.min(correctedHero.left,correctedJaw.left)-ndcShift;
  const finalRight=Math.max(correctedHero.right,correctedJaw.right)-ndcShift;
  assert.ok(finalLeft>-.95 && finalRight<.95,
    'BOTH actual full 3D connected bodies must fit unchanged native ±.95 NDC');
  assert.ok((correctedJaw.right-correctedJaw.left)>.70,
    'full withdrawal mechanism retains original >=.70 NDC readable silhouette');
  assert.equal(JSON.stringify({hero,jaw}),original,'no distortion, source position or geometry rewrite');
  assert.equal(retreat(hero,jaw,height,aspect,false),height,'no unverified retreat');
  assert.equal(retreat(hero,jaw,height,844/390,true),height,'no landscape optical drift');
  assert.equal(retreat(hero,{left:-1.10,right:-.90},height,aspect,true),height,
    'never zoom a tiny hazard below the strict minimum action scale');
  assert.equal(retreat({left:-1.5,right:.96},jaw,height,aspect,true),height,
    'do not disguise physically impossible pair framing');
  const scene=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(scene,/retreatHeight=publicPhysicalPressureRetreatHalfHeight\(/);
  assert.match(scene,/heroSpan=physicalSpan\(explorer\.group\);\s*jawSpan=physicalSpan\(hazard\);\s*}\s*const horizontalShift=/);
});

test('Pass317 original 390px tick467 pressure approach restores FULL physical Pip readability without cropping the jaw',async()=>{
  const {publicPhysicalPressureHeroReadabilityHalfHeight:fit}=await load();
  // Original unmodified Pass316 WebGL artifact 13999198500,
  // public-tide-shear-approach-390.json at 2026-11-13T01:06 UTC:
  // 390x844, seed maze-visual-reference-3, authoritative tick 467.
  // All full-resolution image SHA sidecars and gate manifest checked.
  const hero={left:-.7242787862420919,right:-.29612611640849695,
    bottom:-.1850155141572028,top:.11709701680511303};
  const jaw={left:-.08468488826602291,right:.6753151117339771,
    bottom:.082689280405134,top:.5845253564687509};
  const halfHeight=6.915350898647892,aspect=390/844;
  const before=JSON.stringify({hero,jaw}), fitted=fit(hero,jaw,halfHeight,aspect,true,false);
  const zoom=halfHeight/fitted;
  assert.ok(zoom>1.20 && zoom<1.24,
    'the original real hero is only 0.00284x beyond the prior nominal cap');
  assert.ok((hero.right-hero.left)*zoom>.49,
    'the same original physical Pip must now clear strict real 390px readability');
  assert.ok((jaw.right-jaw.left)*zoom>.70,
    'the complete original Tide-Shear must remain useful action scale');
  const pairLeft=Math.min(hero.left,jaw.left)*zoom;
  const pairRight=Math.max(hero.right,jaw.right)*zoom;
  const fullY=Math.max(...[hero.bottom,hero.top,jaw.bottom,jaw.top].map(Math.abs))*zoom;
  assert.ok(pairLeft>-.95 && pairRight<.95 && fullY<.88,
    'BOTH complete physical actor/mechanism silhouettes stay within the unchanged native no-crop gate');
  assert.equal(JSON.stringify({hero,jaw}),before,
    'no fake actor, pressure movement or source authority mutation');
  assert.equal(fit(hero,jaw,halfHeight,aspect,false,false),halfHeight,
    'no optical change without a public-authorized stage');
  assert.equal(fit(hero,jaw,halfHeight,320/740,true,false),halfHeight,
    '320px retains its separately verified pressure framing');
  assert.equal(fit(hero,jaw,halfHeight,844/390,true,false),halfHeight,
    'landscape cannot silently inherit a narrow portrait zoom');
  const impossibleJaw={left:-.93,right:.84,bottom:-.25,top:.55};
  assert.equal(fit(hero,impossibleJaw,halfHeight,aspect,true,false),halfHeight,
    'even the new 390 lens may NOT disguise a physically impossible full-body pair');
  const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(source,/readablePairHeight=publicPhysicalPressureHeroReadabilityHalfHeight\(/,
    'the tested physically conservative lens must drive the actual production camera');
});
