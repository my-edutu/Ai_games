'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {frameTimestampMs,retainAnchor,beginTowerNativeCompositorAnchors,
  MIN_SPACING_MS,MAX_ANCHORS,CDP_FRAME_STRIDE}=require('../../scripts/tower-native-compositor-anchors.cjs');
test('Chrome compositor timestamp must be epoch seconds near runner clock, not Date.now screenshot endpoint',()=>{
  const now=1794228144000;
  assert.equal(frameTimestampMs({timestamp:1794228144.125},now),1794228144125);
  for(const metadata of [null,{}, {timestamp:12},{timestamp:Infinity},
    {timestamp:1794228120},{timestamp:1794228165}])
    assert.equal(frameTimestampMs(metadata,now),null);
});
test('only bounded, temporally separated original compositor frames are eligible',()=>{
  const anchors=[{startAtMs:100000}];
  assert.equal(retainAnchor(anchors,100000+MIN_SPACING_MS-1),false);
  assert.equal(retainAnchor(anchors,100000+MIN_SPACING_MS),true);
  assert.equal(retainAnchor(Array.from({length:MAX_ANCHORS},()=>anchors[0]),200000),false);
});
test('60-second original compositor sampling leaves room for uniquely matched native frames and remains resource bounded',()=>{
  const anchors=[];
  const origin=1794234700000;
  for(let i=0;i<29;i++){
    const timestamp=origin+i*MIN_SPACING_MS;
    if(retainAnchor(anchors,timestamp))anchors.push({startAtMs:timestamp});
  }
  assert.equal(MAX_ANCHORS,24);
  // Real frozen baseline outcome desktop 44508004326 had only six
  // 1/12 compositor frames in 70s; four failed original-film uniqueness.
  // The 1/5 observer must obtain at least twelve opportunities even for
  // a 1fps compositor without relaxing the three independent native
  // picture matches, minimum span, event timing or transport integrity.
  assert.equal(CDP_FRAME_STRIDE,5);
  assert.ok(Math.floor(1*70/CDP_FRAME_STRIDE)>=12);
  // At 25fps, 1/5 stays bounded rather than requesting every browser
  // compositor frame; no synthetic frames or automatic calibration.
  assert.ok(Math.floor(25*70/CDP_FRAME_STRIDE)<400);
  assert.equal(anchors.length,24);
  assert.equal(anchors[2].startAtMs-origin,MIN_SPACING_MS*2);
  assert.ok(anchors.at(-1).startAtMs-origin >= 60000,
    'bounded passive witnesses must cover a 60-second original recording');
  assert.equal(retainAnchor(anchors,origin+29*MIN_SPACING_MS),false);
  assert.equal(retainAnchor([{startAtMs:origin}],origin+MIN_SPACING_MS-1),false);
  // Three acceptance anchors are still independently matched against native
  // WebM pixels. This is source-sampling density, NOT auto-calibration.
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
    format:'jpeg',quality:85,everyNthFrame:CDP_FRAME_STRIDE,maxWidth:390,maxHeight:844});
  const jpeg=Buffer.from([0xff,0xd8,...Array(160).fill(0),0xff,0xd9]).toString('base64');
  client.emit('Page.screencastFrame',{sessionId:1,
    metadata:{timestamp:now/1000},data:jpeg});
  assert.equal(collector.anchors.length,1);
  assert.equal(collector.anchors[0].claimedVideoMatch,false);
  assert.equal(collector.anchors[0].startAtMs,collector.anchors[0].endAtMs);
  now+=MIN_SPACING_MS-100;
  client.emit('Page.screencastFrame',{sessionId:2,
    metadata:{timestamp:now/1000},data:jpeg});
  assert.equal(collector.anchors.length,1);
  now+=4500;
  client.emit('Page.screencastFrame',{sessionId:3,
    metadata:{timestamp:now/1000},data:jpeg});
  assert.equal(collector.anchors.length,2);
  assert.equal(written.length,2);
  assert.equal(collector.samplingStats.deliveredCDPFrames,3);
  assert.equal(collector.samplingStats.storedAnchorCount,2);
  assert.equal(collector.samplingStats.storedAnchorJPEGBytes,328);
  assert.equal(collector.samplingStats.deliveredBase64Characters,jpeg.length*3);
  assert.equal(collector.samplingStats.everyNthCompositorFrame,5);
  assert.match(collector.samplingStats.meaning,/NOT video FPS/);
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
  assert.equal(collector.samplingStats.deliveredCDPFrames,0);
  assert.equal(collector.samplingStats.storedAnchorCount,0);
  assert.match(collector.errors[0],/CDP unavailable/);
  await collector.stop();
});
