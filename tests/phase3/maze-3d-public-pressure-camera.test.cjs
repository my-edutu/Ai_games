'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
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
 assert.match(source,/priorPublicSnapshot = previous/);
 assert.match(source,/cameraGate = pressureFirst \? null : openingGateBeat \|\| nearObservedGate/);
 assert.match(source,/pressureFirst \? 4\.70/,'same optical budget as existing keyed 320/390 stage');
 assert.match(source,/\(pressureFirst \|\| !keyGateCue\)/);
 assert.match(source,/if \(!pressureFirst && !settings\.reducedMotion/);
});
