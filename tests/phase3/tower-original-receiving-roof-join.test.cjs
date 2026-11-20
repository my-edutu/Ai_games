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
