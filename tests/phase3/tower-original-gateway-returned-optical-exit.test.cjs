const test=require('node:test'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{resolve}=require('node:path');
const {readFileSync}=require('node:fs');
const load=()=>import(pathToFileURL(resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/source-returned-original-gateway-exit.mjs')));
const s={floor:9,theme:'void',lifecycle:'running',runToken:'one',tick:516,player:{health:4}};
const h={guardianGateRetained:true,verifiedObservedFloorAdvance:true,floor:9,
  oldCapId:'f8:cap',runToken:'one',crossingTick:475,firstWorldRenderTick:477,
  submittedFrames:19,visibleSeconds:1.5,originalGatewayOpacity:.8167,
  lastReturnedOldGatewayTick:512,opticalExitSubmitted:false};
const j={floor:9,runToken:'one',proof:'recorded-source-gateway',
  structureDeferred:true,sourceTick:477,structuralVisibleReturns:10,
  structuralVisibleSeconds:.95};
test('real returned old and new room frames force one-way gateway extinction',async()=>{
 const {sourceReturnedOriginalGatewayOpacity:f}=await load();
 const next=f(s,h,j,.94,true);
 assert.ok(next<.8167 && next>.0, 'genuine combined return advances old metal');
 assert.ok(f(s,{...h,originalGatewayOpacity:next},j,.99,true)<=next,
   'new source stance may not resurrect faded original bronze steel');
 assert.equal(f(s,{...h,originalGatewayOpacity:.648},j,1,false),.648,
   'unsupported source cannot spend display-return fading');
 assert.equal(f({...s,runToken:'another'},h,j,.9,true),.8167,
   'another expedition cannot earn the old door exit');
});
test('a stalled new shaft cannot consume a still-opaque original portal',async()=>{
 const {sourceReturnedOriginalGatewayOpacity:f}=await load();
 assert.equal(f(s,h,{...j,structuralVisibleReturns:0},1,true),.8167);
 assert.equal(f(s,{...h,visibleSeconds:0,submittedFrames:0},j,1,true),.8167);
 assert.equal(f(s,h,j,-.1,true),null);
 assert.equal(f(s,{...h,originalGatewayOpacity:NaN},j,.5,true),null);
});
test('real source-verified roof/raised-flight can retain old steel only within finite budget',async()=>{
 const {sourceReturnedOriginalGatewayRetention:f}=await load();
 assert.equal(f(s,h,j,true),true);
 assert.equal(f({...s,runToken:'other'},h,j,true),false);
 assert.equal(f(s,h,j,false),false);
 assert.equal(f(s,{...h,submittedFrames:30},j,true),false);
 assert.equal(f(s,{...h,visibleSeconds:2.81},j,true),false);
 assert.equal(f(s,{...h,opticalExitSubmitted:true},j,true),false);
 assert.equal(f({...s,player:{health:0}},h,j,true),false);
 assert.equal(f(s,h,{...j,proof:'predicted-next-floor'},true),false);
});
test('world integration requires old-gateway one-way source-owned fade and bounded room lease',()=>{
 const world=readFileSync(resolve(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
 assert.match(world,/sourceReturnedOriginalGatewayOpacity\(/);
 assert.match(world,/sourceReturnedOriginalGatewayRetention\(/);
 assert.match(world,/pendingReturnedOriginalExit/);
 assert.doesNotMatch(world,/snapshot\.tick\s*=\s*held\.sourceTick/);
});
