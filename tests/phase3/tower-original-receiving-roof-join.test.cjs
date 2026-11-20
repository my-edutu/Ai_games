const test=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {resolve}=require('node:path');
const url=pathToFileURL(resolve(__dirname,'../../public/infinite-tower-climb/visuals/source-physical-receiving-roof.mjs')).href;
async function subject(){return import(url);}

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
