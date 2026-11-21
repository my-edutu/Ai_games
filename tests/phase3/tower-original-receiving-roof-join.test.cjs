const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {resolve}=require('node:path');
const url=pathToFileURL(resolve(__dirname,'../../public/infinite-tower-climb/visuals/source-physical-receiving-roof.mjs')).href;
async function subject(){return import(url);}

test('source-authenticated F8 cap produces exactly six real-roof-aligned structural stations',async()=>{
  const {actualGatewayReceivingLoadPathBays:load}=await subject();
  const p={id:'f9:ground',x:0,width:480000};
  const old={id:'f8:cap',x:115200,width:249600};
  const bays=load(p,480000,304896,old);
  assert.ok(bays);
  assert.deepEqual(bays.map(b=>b.kind),['approach','threshold','successor']);
  assert.equal(bays.reduce((n,b)=>n+b.anchors.length,0),6);
  for(const bay of bays){
    assert.equal(bay.sourceBound,true);
    assert.equal(bay.anchors.length,2);
    for(const {sourceX,angle} of bay.anchors){
      assert.ok(sourceX>bay.startX && sourceX<bay.endX,
        'load stations remain inside actually walkable source roof extents');
      assert.ok(Math.abs(angle-(sourceX-p.width/2)/480000*2.2)<1e-12,
        'all 3D anchors derive from actual source x, not an invented floor');
    }
    assert.ok(bay.anchors[0].sourceX<bay.anchors[1].sourceX);
  }
  assert.equal(bays[0].endX,bays[1].startX);
  assert.equal(bays[1].endX,bays[2].startX);
  for(const bad of [null,{...old,id:'f7:cap'},
    {...old,x:0,width:120000},{...old,x:115200,width:160000}])
    assert.equal(load(p,480000,304896,bad),null,
      'cannot create architectural connection without original cap overlap');
  assert.equal(load({...p,id:'f9:p2'},480000,304896,old),null);
});

test('full physical gateway roof geometry remains below the actual walkable F9 platform, with no extra collider',()=>{
  const world=require('node:fs').readFileSync(resolve(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/const gatewayLoadPath=joinedRoofSpans && sharedPhysicalRoof/);
  assert.match(world,/root\.add\(loadPath\)/);
  assert.match(world,/SourceEarnedFloorNineGatewayLoadPath/);
  assert.match(world,/lower=\[Math\.sin\(theta\)\*24\.1,h-4\.7/);
  assert.match(world,/upper=\[Math\.sin\(theta\)\*26\.4,h-\.9/);
  assert.match(world,/nonColliding:true/);
  assert.doesNotMatch(world,/platforms\.set\(['\"]SourceEarnedFloorNineGatewayLoadPath/);
});

test('actual original guardian exit subdivides only a real F9 ground top, exactly',async()=>{
  const {actualGatewayReceivingRoofSpans}=await subject();
  const deck={id:'f9:ground',x:0,width:480000};
  const bands=actualGatewayReceivingRoofSpans(deck,480000,304896);
  assert.deepEqual(bands.map(b=>b.kind),['approach','threshold','successor']);
  assert.equal(bands[0].startX,0);assert.equal(bands[0].endX,304896);
  assert.equal(bands[2].endX,480000);
  assert.equal(bands[1].startX,304896);
  assert.equal(bands[1].endX,bands[2].startX);
  assert.ok(bands.every(b=>b.endX>b.startX&&b.angle>0));
  const total=bands.reduce((sum,b)=>sum+b.angle,0);
  assert.ok(Math.abs(total-2.2)<1e-9);
  for(const b of bands){
    const midpoint=(b.startX+b.endX)/2;
    assert.ok(Math.abs(b.offset-((midpoint-240000)/480000*2.2))<1e-12);
  }
});

test('never author a receiving roof for invalid source, mismatched deck, or out-of-range gateway',async()=>{
  const {actualGatewayReceivingRoofSpans}=await subject();
  const valid={id:'f9:ground',x:0,width:480000};
  assert.equal(actualGatewayReceivingRoofSpans({...valid,id:'f9:p2'},480000,304896),null);
  assert.equal(actualGatewayReceivingRoofSpans(valid,480000,0),null);
  assert.equal(actualGatewayReceivingRoofSpans(valid,480000,470000),null);
  assert.equal(actualGatewayReceivingRoofSpans(valid,480000,NaN),null);
  assert.equal(actualGatewayReceivingRoofSpans(valid,480000,304896,4),null);
  assert.equal(actualGatewayReceivingRoofSpans({...valid,width:510000},480000,304896),null);
  assert.equal(actualGatewayReceivingRoofSpans({...valid,width:119999},480000,60000),null);
});

test('all three original roof surface materials converge on actual canonical destination without a second clock',async()=>{
  const {syncGatewayReceivingRoofColours}=await subject();
  class Color{constructor(r,g,b){this.v=[r,g,b]}copy(c){this.v=c.v.slice();return this}
    lerp(c,a){this.v=this.v.map((n,i)=>n+(c.v[i]-n)*a);return this}}
  const bronze=new Color(.8,.4,.1),violet=new Color(.2,.1,.8);
  const p={top:{color:bronze},topVoid:violet,
    roofJoin:{middle:{color:new Color(0,0,0)},successor:{color:new Color(0,0,0)}}};
  assert.equal(syncGatewayReceivingRoofColours(p),true);
  assert.ok(p.roofJoin.middle.color.v[0]>violet.v[0]);
  assert.ok(p.roofJoin.successor.color.v[0]<p.roofJoin.middle.color.v[0]);
  p.top.color.copy(violet);
  assert.equal(syncGatewayReceivingRoofColours(p),true);
  assert.deepEqual(p.roofJoin.middle.color.v,violet.v);
  assert.deepEqual(p.roofJoin.successor.color.v,violet.v);
  assert.equal(syncGatewayReceivingRoofColours(null),false);
});

test('original F9 roof structural rim, beam and luminous gasket share the same source-grounded spatial top cuts',async()=>{
  const world=require('node:fs').readFileSync(resolve(__dirname,'../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/const joinedRoofSpans=sharedPhysicalRoof/);
  assert.match(world,/beamMiddle:body\.clone\(\),beamSuccessor:body\.clone\(\)/);
  assert.match(world,/edgeMiddle:rim\.clone\(\),edgeSuccessor:rim\.clone\(\)/);
  assert.match(world,/lampMiddle:glow\.clone\(\),lampSuccessor:glow\.clone\(\)/);
  assert.match(world,/sector\(27\.02,27\.22,band\.angle,\.095\),sourceRoofWing\(edge,band\)/);
  assert.match(world,/for\(const band of joinedRoofPanels\)/);
  assert.match(world,/sector\(26\.99,27\.13,band\.angle,\.07\),sourceRoofWing\(beam,band\)/);
  assert.match(world,/sector\(27\.04,27\.17,band\.angle,\.05\),sourceRoofWing\(lamp,band\)/);
  assert.match(world,/resetGatewayReceivingRoofColours\(arrivalRoutePalette\)/);
});
test('no purple full-width lip at the real bronze gateway; retiring old gate resets all original roof material channels',async()=>{
  const {syncGatewayReceivingRoofColours:sync,resetGatewayReceivingRoofColours:reset}=await subject();
  class Color{constructor(v){this.v=v}copy(c){this.v=c.v;return this}lerp(c,a){this.v+=(c.v-this.v)*a;return this}}
  const mat=(v,e=null)=>({color:new Color(v),...(e===null?{}:{emissive:new Color(e)})});
  const p={top:mat(100),topVoid:new Color(10),
    body:mat(100),bodyVoid:new Color(20),
    rim:mat(100),rimVoid:new Color(30),
    glow:mat(120,121),glowVoid:new Color(40),glowEmissiveVoid:new Color(41),
    crystal:mat(110,111),crystalVoid:new Color(50),crystalEmissiveVoid:new Color(51)};
  p.roofJoin={middle:mat(0),successor:mat(0),
    beamMiddle:mat(0),beamSuccessor:mat(0),
    edgeMiddle:mat(0),edgeSuccessor:mat(0),
    lampMiddle:mat(0,0),lampSuccessor:mat(0,0)};
  assert.equal(sync(p),true);
  for(const [name,low,high] of [['beam',20,100],['edge',30,100],['lamp',40,120]]){
    const m=p.roofJoin[name+'Middle'].color.v,s=p.roofJoin[name+'Successor'].color.v;
    assert.ok(low<s&&s<m&&m<high,name+' physical transition');
  }
  assert.ok(p.roofJoin.lampMiddle.emissive.v>p.roofJoin.lampSuccessor.emissive.v);
  assert.equal(reset(p),true);
  for(const [name,expected] of [['top',10],['body',20],['rim',30],['glow',40],['crystal',50]])
    assert.equal(p[name].color.v,expected,name+' reset');
  assert.equal(p.glow.emissive.v,41);assert.equal(p.crystal.emissive.v,51);
  for(const [name,expected] of [['middle',10],['successor',10],
    ['beamMiddle',20],['beamSuccessor',20],
    ['edgeMiddle',30],['edgeSuccessor',30],
    ['lampMiddle',40],['lampSuccessor',40]])
    assert.equal(p.roofJoin[name].color.v,expected,name+' band reset');
  assert.equal(p.roofJoin.lampMiddle.emissive.v,41);
  assert.equal(sync(null),false);assert.equal(reset(null),false);
});

test('the TRUE f8 guardian roof predicts the exact later canopy stations but NO future game platform',async()=>{
  const {prebuildOriginalGuardianCanopyPlan:prebuild,
    actualGatewayReceivingGalleryCanopy:plan}=await subject();
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const previous=prebuild(cap,480000,304896);
  assert.ok(previous);
  assert.deepEqual(previous.stations,plan({id:'f9:ground',x:0,width:480000},
    480000,304896,cap).stations);
  assert.equal(previous.anticipatedRoofY,3224000);
  assert.equal(previous.structuralPreviewOnly,true);
  assert.equal(previous.authoritativeGameplay,false);
  for(const bad of [
    {...cap,id:'f9:cap'},{...cap,x:120000},{...cap,width:248000},
    {...cap,height:10000},{...cap,y:NaN}
  ])assert.equal(prebuild(bad,480000,304896),null);
  assert.equal(prebuild(cap,480000,304897),null);
});

test('prepainted canopy is one retained owner, not an extra F9 door or collider',()=>{
  const world=require('node:fs').readFileSync(resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(world,/guardianCap&&theme==='clockwork'&&p.id==='f8:cap'/);
  assert.match(world,/SourcePrepaintedOriginalGuardianReceivingCanopy/);
  assert.match(world,/if\(p.originalCapCanopy\)batchRigid\(p.originalCapCanopy\)/);
  assert.match(world,/p.originalCapSkirtOwner,p.originalCapCanopy/);
  assert.match(world,/originalCapCanopy:sourceEntry.originalCapCanopy\?\?null/);
  assert.match(world,/const inheritedCanopy=sharedPhysicalRoof/);
  assert.match(world,/!inheritedCanopy\s*\?actualGatewayReceivingGalleryCanopy/);
  assert.match(world,/nonColliding:true/);
  assert.doesNotMatch(world,/platforms.set\(['"]SourcePrepaintedOriginalGuardianReceivingCanopy/);
});


test('a returned bronze gateway does not reveal violet roof trim before the same source-certified roof departure',async()=>{
  const {syncGatewayReceivingRoofColours:sync}=await subject();
  class Color {
    constructor(v){this.v=v;}
    copy(other){this.v=other.v;return this;}
    lerp(other,t){this.v+=(other.v-this.v)*t;return this;}
  }
  const mat=(v,e)=>({color:new Color(v),emissive:new Color(e)});
  const make=()=>{
    const p={top:mat(100,100),topVoid:new Color(0),
      body:mat(120,120),bodyVoid:new Color(0),
      rim:mat(140,140),rimVoid:new Color(0),
      glow:mat(160,160),glowVoid:new Color(0),
      glowEmissiveVoid:new Color(0)};
    p.roofJoin={middle:mat(0,0),successor:mat(0,0),
      beamMiddle:mat(0,0),beamSuccessor:mat(0,0),
      edgeMiddle:mat(0,0),edgeSuccessor:mat(0,0),
      lampMiddle:mat(0,0),lampSuccessor:mat(0,0)};
    return p;
  };
  const original=make();
  assert.equal(sync(original,0),true,'source-certified full old room is accepted');
  for(const name of ['middle','successor'])
    assert.equal(original.roofJoin[name].color.v,100,
      'one original walkable roof cannot contain a mostly violet sector before the real doorway departs');
  for(const [kind,base] of [['beam',120],['edge',140],['lamp',160]]){
    for(const suffix of ['Middle','Successor'])
      assert.equal(original.roofJoin[kind+suffix].color.v,base,
        'full bronze state includes the physical source-owned steel and luminous underlip');
  }
  assert.equal(original.roofJoin.lampSuccessor.emissive.v,160);
  const halfway=make();
  assert.equal(sync(halfway,.5),true);
  for(const name of ['middle','successor']) {
    assert.ok(halfway.roofJoin[name].color.v<100);
    assert.ok(halfway.roofJoin[name].color.v>0);
    assert.ok(halfway.roofJoin[name].color.v<original.roofJoin[name].color.v);
  }
  assert.ok(halfway.roofJoin.successor.color.v<halfway.roofJoin.middle.color.v,
    'the genuine successor roof still reads farther ahead in the material gradient');
  const completed=make();
  assert.equal(sync(completed,1),true);
  assert.ok(completed.roofJoin.successor.color.v<halfway.roofJoin.successor.color.v,
    'actual completed successor material must be cooler than the halfway source-owned roof');
  assert.equal(sync(make(),Number.NaN),false,'invalid evidence cannot repaint the scene');
});

test('source-original gateway canopy clears its real centre passage before F9, retaining four outer piers and all upper ties',async()=>{
  const {prebuildOriginalGuardianCanopyPlan:prebuild,
    actualGatewayReceivingGalleryCanopy:receiving,
    sourceOpenGuardianRoofLoadPath:opening}=await subject();
  const cap={id:'f8:cap',x:115200,y:3212000,width:249600,height:12000};
  const old=prebuild(cap,480000,304896);
  const future=receiving({id:'f9:ground',x:0,width:480000},
    480000,304896,cap);
  assert.deepEqual(opening(old),opening(future),
    'no new architecture or source-less layout after the actual floor transition');
  const gap=opening(old);
  assert.equal(gap.sourceBound,true);
  assert.equal(gap.thresholdX,304896);
  assert.equal(gap.supportStations.length,2);
  assert.equal(gap.overheadTies.length,5);
  assert.equal(gap.compressionBraces.length,4);
  assert.equal(gap.omittedLegSourceXs.length,4);
  assert.ok(gap.omittedLegSourceXs.some(x=>x<304896) &&
    gap.omittedLegSourceXs.some(x=>x>304896+48000),
    'original forecourt must clear the entire first real far-side roof, not merely the gate');
  assert.deepEqual(gap.supportStations.map(s=>s.sourceX),
    [old.stations[0],old.stations[5]].map(s=>s.sourceX));
  assert.deepEqual(gap.clearForecourtSourceSpan,
    [old.stations[0].sourceX,old.stations[5].sourceX]);
  assert.ok(gap.compressionBraces.every(b=>b.toAngle>b.fromAngle ||
    b.toAngle<b.fromAngle),
    'every upper compression strut must span genuine source stations');
  assert.equal(opening({...old,oldCapId:'f7:cap'}),null);
  assert.equal(opening({...old,thresholdX:old.stations[0].sourceX}),null);
  assert.equal(opening({...old,stations:old.stations.slice(0,5)}),null);
  assert.equal(opening({...old,ties:[]}),null);
});
test('the original overhead load-path clearance uses the SAME retained physical canopy, not duplicate new collision scenery',()=>{
  const source=require('node:fs').readFileSync(resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(source,/const sourceOpening=sourceOpenGuardianRoofLoadPath\(plan\)/);
  assert.match(source,/sourceOpening\?\.omittedLegSourceXs\.includes\(s\.sourceX\)/);
  assert.match(source,/for\(const tie of plan\.ties\)/,
    'continuous upper bearing must remain visible and connected');
  assert.match(source,/for\(const brace of sourceOpening\?\.compressionBraces/,
    'open original far-side roof needs an upper-only real structural load path');
  assert.match(source,/const inheritedCanopy=sharedPhysicalRoof/);
  assert.match(source,/!inheritedCanopy\s*\?actualGatewayReceivingGalleryCanopy/);
  assert.doesNotMatch(source,/platforms\.set\(['"]SourcePrepaintedOriginalGuardianReceivingCanopy/);
});
