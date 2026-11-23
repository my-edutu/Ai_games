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
 const {sourceReturnedOriginalGatewayOpacity:f,
   sourceReturnedOriginalDepartureProgress:progress}=await load();
 // This optical-retirement fixture previously omitted player coordinates
 // entirely. A source-owned exit needs a REAL grounded roof and a source-
 // certified 75m exit, not only GPU frame accumulation. Preserve the
 // meaningful historical assertion while providing that proof explicitly.
 const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
 const oldRoofY=cap.y+cap.height,thresholdX=cap.x+Math.floor(cap.width*.76);
 const crossingX=thresholdX+16200;
 const departed={...s,player:{health:4,x:crossingX+60000,
   y:oldRoofY+104000,halfWidth:9000,halfHeight:14000,
   grounded:true,groundedPlatformId:'f9:p2',state:'standing',vy:0},
   platforms:[{id:'f9:ground',x:cap.x,y:cap.y,
     width:cap.width,height:cap.height},
     {id:'f9:p2',x:315000,y:oldRoofY+78000,width:100000,height:12000}],
   lastGuardianCrossing:{runToken:'one',fromFloor:8,toFloor:9,
     sourceTick:475,cap,exitX:thresholdX,crossingX,
     guardian:{kind:'guardian',active:false,health:0}}};
 const held={...h,oldCapX:cap.x,oldCapWidth:cap.width,oldRoofY,thresholdX,
   sourceTick:477,observedCrossingX:crossingX,observedCrossingY:oldRoofY+14000,
   observedHalfWidth:9000,observedHalfHeight:14000,
   firstRouteClearanceReturnTick:495,routeClearanceReturnedFrames:10,
   routeClearanceReturnedSeconds:.80};
 assert.equal(progress(departed,held),1,
   'source hero actually climbed away from the original guardian roof');
 const partlyPainted={...j,structuralVisibleReturns:5,structuralVisibleSeconds:.4};
 const next=f(departed,held,partlyPainted,.94,true);
 assert.ok(next<.8167 && next>0,
   'genuine partially combined returns advance bronze steel gradually');
 assert.equal(f(departed,held,partlyPainted,0,true),next,
   'a source-proposed zero cannot bypass the old/new jointly returned frames');
 assert.ok(f(departed,{...held,originalGatewayOpacity:next},partlyPainted,.99,true)<=next,
   'new source stance may not resurrect faded original bronze steel');
 assert.equal(f(departed,{...held,originalGatewayOpacity:next},j,.99,true),0,
   'only sufficient returned old AND successor frames earn final exit');
 assert.equal(f(departed,{...held,originalGatewayOpacity:.648},j,1,false),.648,
   'unsupported source cannot spend display-return fading');
 assert.equal(f({...departed,runToken:'another'},held,j,.9,true),.8167,
   'another expedition cannot earn the old door exit');
});
test('a stalled new shaft cannot consume a still-opaque original portal',async()=>{
 const {sourceReturnedOriginalGatewayOpacity:f}=await load();
 assert.equal(f(s,h,{...j,structuralVisibleReturns:0},1,true),.8167);
 assert.equal(f(s,h,{...j,structuralVisibleReturns:0},0,true),.8167,
   'a source-requested zero-alpha departure cannot erase painted old metal before successor returns');
 assert.equal(f(s,h,{...j,structuralVisibleReturns:1},.01,true),.8167,
   'a single cold first successor return is not a safe replacement shot');
 assert.equal(f(s,h,{...j,structuralVisibleReturns:3,structuralVisibleSeconds:0},0,true),.8167,
   'cold builds and zero completed successor display time cannot erase steel');
 assert.equal(f(s,h,{...j,structuralVisibleReturns:3,structuralVisibleSeconds:.05},0,true),
   f(s,h,{...j,structuralVisibleReturns:3,structuralVisibleSeconds:.05},1,true),
   'source-poll-only zero proposal must not spend optical visibility');
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


test('original continuous crossing earns gateway retirement from real roof travel and vertical ascent, never GPU returns alone',async()=>{
 const {sourceReturnedOriginalDepartureProgress:progress,
   sourceReturnedOriginalGatewayOpacity:opacity}=await load();
 const held={...h,originalGatewayOpacity:.95,sourceTick:475,
   crossingTick:475,oldCapId:'f8:cap',oldCapX:115200,
   oldCapWidth:249600,thresholdX:304896,oldRoofY:3224000,
   observedCrossingX:321096,observedCrossingY:3238000,
   observedHalfWidth:9000,observedHalfHeight:14000};
 const grounded={...s,tick:498,
   lastGuardianCrossing:{runToken:'one',sourceTick:475,
     fromFloor:8,toFloor:9,exitX:304896,crossingX:321096,
     cap:{id:'f8:cap',x:115200,y:3212000,width:249600,height:12000},
     guardian:{kind:'guardian',active:false,health:0}},
   player:{health:4,x:333296,y:3238000,halfWidth:9000,halfHeight:14000,
     grounded:true,groundedPlatformId:'f9:ground',state:'standing'},
   platforms:[{id:'f9:ground',x:310000,y:3212000,
     width:220000,height:12000}]};
 const stable={...j,structuralVisibleReturns:10,structuralVisibleSeconds:.95};
 const original=JSON.stringify({grounded,held,stable});
 const roof=progress(grounded,held);
 assert.ok(roof>.19&&roof<.22,'stationary true roof is not a finished departure');
 const still=opacity(grounded,held,stable,0,true);
 assert.ok(still>.78&&still<.81,
   'authentic first-F9 renderer returns must retain original gate while body is on the roof');
 const sameTick={...stable,structuralVisibleReturns:20,structuralVisibleSeconds:2};
 assert.equal(opacity(grounded,held,sameTick,0,true),still,
   'extra WebGL returns at unchanged source position cannot retire the gate');
 const lifted={...grounded,tick:510,
   player:{...grounded.player,x:336896,y:3286000,grounded:false,
     groundedPlatformId:null,state:'airborne'}};
 const airborne=opacity(lifted,held,stable,0,true);
 assert.ok(airborne<still&&airborne>.2,
   'actual movement on source-authored first raised route progressively spends the old room');
 const ascended={...lifted,tick:516,
   player:{...lifted.player,x:342296,y:3322000}};
 assert.ok(progress(ascended,held)>.4&&progress(ascended,held)<=.62,
   'first airborne F9 ascent retains old 3D room until a true elevated landing');
 assert.ok(opacity(ascended,held,stable,0,true)>=.38,
   'high source y alone must not extinguish the guardian doorway and supporting gallery');
 const landed={...ascended,tick:525,
   platforms:[...grounded.platforms,{id:'f9:p2',x:320000,
     y:oldRoofY+72000,width:90000,height:12000}],
   player:{...ascended.player,grounded:true,groundedPlatformId:'f9:p2',
     state:'standing',vy:0,y:oldRoofY+84000+14000}};
 const verifiedLanding={...held,firstRouteClearanceReturnTick:525,
   routeClearanceReturnedFrames:10,routeClearanceReturnedSeconds:.8};
 assert.equal(progress(landed,verifiedLanding),1,
   'verified first raised deck and genuine returned frames earn full scene retirement');
 assert.equal(opacity(landed,verifiedLanding,stable,0,true),0);
 assert.equal(opacity(grounded,{...held,originalGatewayOpacity:airborne},stable,1,true),airborne,
   'backtracking never resurrects previously retired material');
 assert.equal(JSON.stringify({grounded,held,stable}),original,
   'optical policy must never mutate authoritative source or renderer receipts');
 for(const invalid of [
   {...grounded,lastGuardianCrossing:{...grounded.lastGuardianCrossing,
      guardian:{kind:'guardian',active:true,health:1}}},
   {...grounded,runToken:'restart'},
   {...grounded,platforms:[{...grounded.platforms[0],y:3112000}]},
   {...grounded,player:{...grounded.player,y:3500000}}
 ])assert.equal(progress(invalid,held),null);
});
test('pre-publication genuine crossing receipt may defer old-door extinction but cannot manufacture a win',async()=>{
 const {sourceReturnedOriginalDepartureProgress:progress}=await load();
 const held={...h,sourceTick:475,oldCapX:115200,oldCapWidth:249600,
   thresholdX:304896,oldRoofY:3224000,observedCrossingX:321096,
   observedCrossingY:3238000,observedHalfWidth:9000,observedHalfHeight:14000};
 const early={...s,tick:489,lastGuardianCrossing:null,
   player:{health:4,x:333296,y:3238000,halfWidth:9000,halfHeight:14000},
   platforms:[{id:'f9:ground',x:310000,y:3212000,width:220000,height:12000}]};
 assert.ok(progress(early,held)>.19);
 assert.equal(progress(early,{...held,verifiedObservedFloorAdvance:false}),null);
 assert.equal(progress(early,{...held,observedCrossingX:401096}),null);
 assert.equal(progress({...early,tick:550},held),null,
   'old first-frame receipt has bounded source-tick lifespan');
});
