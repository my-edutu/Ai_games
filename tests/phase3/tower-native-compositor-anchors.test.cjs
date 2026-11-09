'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {frameTimestampMs,retainAnchor,beginTowerNativeCompositorAnchors,
  MIN_SPACING_MS,MAX_ANCHORS}=require('../../scripts/tower-native-compositor-anchors.cjs');
test('Chrome compositor timestamp must be epoch seconds near runner clock, not Date.now screenshot endpoint',()=>{
  const now=1794228144000;
  assert.equal(frameTimestampMs({timestamp:1794228144.125},now),1794228144125);
  for(const metadata of [null,{}, {timestamp:12},{timestamp:Infinity},
    {timestamp:1794228120},{timestamp:1794228165}])
    assert.equal(frameTimestampMs(metadata,now),null);
});
test('only bounded, temporally separated original compositor frames are eligible',()=>{
  const anchors=[{startAtMs:100000}];
  assert.equal(retainAnchor(anchors,106999),false);
  assert.equal(retainAnchor(anchors,100000+MIN_SPACING_MS),true);
  assert.equal(retainAnchor(Array.from({length:MAX_ANCHORS},()=>anchors[0]),200000),false);
});
test('passive CDP capture preserves real browser frame metadata, throttles, acknowledges and stops',async()=>{
  let now=1794228144000;
  const client=new EventEmitter(),calls=[],written=[];
  client.send=async(method,args)=>{calls.push({method,args});return{};};
  client.detach=async()=>{calls.push({method:'detach'});};
  const page={context:()=>({newCDPSession:async()=>client})};
  const collector=await beginTowerNativeCompositorAnchors({
    page,dir:'/virtual',viewport:{width:390,height:844},clock:()=>now,
    save:(file,bytes)=>written.push({file,length:bytes.length})});
  assert.equal(collector.started,true);
  assert.deepEqual(calls.find(x=>x.method==='Page.startScreencast')?.args,{
    format:'jpeg',quality:85,everyNthFrame:15,maxWidth:390,maxHeight:844});
  const jpeg=Buffer.from([0xff,0xd8,...Array(160).fill(0),0xff,0xd9]).toString('base64');
  client.emit('Page.screencastFrame',{sessionId:1,
    metadata:{timestamp:now/1000},data:jpeg});
  assert.equal(collector.anchors.length,1);
  assert.equal(collector.anchors[0].claimedVideoMatch,false);
  assert.equal(collector.anchors[0].startAtMs,collector.anchors[0].endAtMs);
  now+=3000;
  client.emit('Page.screencastFrame',{sessionId:2,
    metadata:{timestamp:now/1000},data:jpeg});
  assert.equal(collector.anchors.length,1);
  now+=4500;
  client.emit('Page.screencastFrame',{sessionId:3,
    metadata:{timestamp:now/1000},data:jpeg});
  assert.equal(collector.anchors.length,2);
  assert.equal(written.length,2);
  assert.equal(calls.filter(x=>x.method==='Page.screencastFrameAck').length,3);
  await collector.stop();
  assert.ok(calls.some(x=>x.method==='Page.stopScreencast'));
  assert.ok(calls.some(x=>x.method==='detach'));
  client.emit('Page.screencastFrame',{sessionId:4,
    metadata:{timestamp:now/1000},data:jpeg});
  assert.equal(collector.anchors.length,2);
  await collector.stop();
  assert.equal(calls.filter(x=>x.method==='Page.stopScreencast').length,1);
});
test('no calibration can be claimed when CDP unavailable',async()=>{
  const collector=await beginTowerNativeCompositorAnchors({
    page:{context:()=>({newCDPSession:async()=>{throw Error('CDP unavailable');}})},
    dir:'/virtual',viewport:{width:960,height:600}});
  assert.equal(collector.started,false);
  assert.equal(collector.anchors.length,0);
  assert.match(collector.errors[0],/CDP unavailable/);
  await collector.stop();
});
