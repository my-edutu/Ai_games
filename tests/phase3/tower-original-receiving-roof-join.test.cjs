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
  assert.match(world,/sector\(27\.02,27\.22,band\.angle,\.095\),edge/);
  assert.match(world,/sector\(26\.99,27\.13,band\.angle,\.07\),beam/);
  assert.match(world,/sector\(27\.04,27\.17,band\.angle,\.05\),lamp/);
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
