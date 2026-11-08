'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {assessVideoTimebase,distance,visuallyMatchAnchor,
  meaningfulSourceEvents,mapObservedEventTimecodes,FRAME_BYTES} =
  require('../../scripts/tower-video-timebase.cjs');

function anchor(wallAtMs,videoPtsSeconds,extra={}) {
  return {wallAtMs,videoPtsSeconds,captureSpanMs:50,
    imageDifference:3.1,uniquenessMargin:5,...extra};
}

test('multiple original-frame anchors map actual browser wall time to native video PTS',()=>{
  const result=assessVideoTimebase([
    anchor(130000,30),anchor(110000,10),anchor(120000,20),
    anchor(140000,40),
  ]);
  assert.equal(result.status,'CALIBRATED');
  assert.equal(result.anchorsAccepted,4);
  assert.equal(result.offsetMs,-100000);
  assert.equal(result.maxResidualMs,0);
  assert.match(result.caveat,/not establish on-screen/);
});

test('rejects a single attractive still or duplicate screenshots as proof',()=>{
  assert.equal(assessVideoTimebase([anchor(110000,10)]).status,'NOT EVALUATED');
  const result=assessVideoTimebase([
    anchor(110000,10),anchor(110500,10.5),anchor(111000,11),anchor(111500,11.5),
  ]);
  assert.equal(result.status,'NOT EVALUATED');
  assert.equal(result.anchorsAccepted,1);
});

test('refuses ambiguous native frames, screenshot stalls, and nonmatching video time',()=>{
  assert.equal(assessVideoTimebase([
    anchor(110000,10),anchor(120000,20,{uniquenessMargin:.1}),
    anchor(130000,30),
  ]).status,'NOT EVALUATED');
  assert.equal(assessVideoTimebase([
    anchor(110000,10),anchor(120000,20,{captureSpanMs:900}),
    anchor(130000,30),
  ]).status,'NOT EVALUATED');
  const drift=assessVideoTimebase([
    anchor(110000,10),anchor(120000,20),anchor(130000,33),anchor(140000,40),
  ]);
  assert.equal(drift.status,'NOT EVALUATED');
  assert.match(drift.reason,/disagree/);
  assert.equal(assessVideoTimebase([
    anchor(110000,10),anchor(112000,12),anchor(114000,14),
  ]).status,'NOT EVALUATED');
});

test('matches true source-independent image anchors, rejects static footage',()=>{
  const frame0=Buffer.alloc(FRAME_BYTES,20);
  const frame1=Buffer.alloc(FRAME_BYTES,100);
  const frame2=Buffer.alloc(FRAME_BYTES,40);
  const frames={pts:[1,2,4],bytes:Buffer.concat([frame0,frame1,frame2])};
  const result=visuallyMatchAnchor(frames,Buffer.alloc(FRAME_BYTES,100));
  assert.equal(result.videoPtsSeconds,2);
  assert.equal(result.imageDifference,0);
  assert.equal(result.uniquenessMargin,60);
  assert.equal(distance(frame0,frame1),80);
  const staticFrames={pts:[1,2,4],bytes:Buffer.concat([
    Buffer.alloc(FRAME_BYTES,100),
    Buffer.alloc(FRAME_BYTES,100),
    Buffer.alloc(FRAME_BYTES,100),
  ])};
  assert.equal(visuallyMatchAnchor(staticFrames,frame1).uniquenessMargin,0);
  assert.throws(()=>distance(Buffer.alloc(5),frame0),/thumbnail length/);
});

test('only present observed run/source events receive timecode candidates',()=>{
  const ticks=[
    {atMs:101,runToken:'A',tick:1,floor:8,lifecycle:'running',
      guardians:[{id:'G',active:true,health:5}]},
    {atMs:151,runToken:'A',tick:2,floor:8,lifecycle:'running',
      guardians:[{id:'G',active:true,health:3}]},
    {atMs:201,runToken:'A',tick:3,floor:8,lifecycle:'running',
      guardians:[{id:'G',active:false,health:0}]},
    {atMs:251,runToken:'A',tick:4,floor:9,lifecycle:'running',guardians:[]},
    {atMs:301,runToken:'A',tick:5,floor:9,lifecycle:'intermission'},
    {atMs:351,runToken:'B',tick:0,floor:0,lifecycle:'running'},
  ];
  const actual=meaningfulSourceEvents(ticks);
  assert.deepEqual(actual.map(e=>e.kind),[
    'source-guardian-damaged','source-guardian-defeat',
    'source-floor-transition','source-lifecycle-intermission',
    'authentic-run-restart',
  ]);
  assert.equal(actual[2].tick,4);
  assert.ok(actual.every(e=>e.runToken==='A'||e.runToken==='B'));
});

test('only authentic indexed events receive calibrated original-film search windows',()=>{
 const indexed=[
   {kind:'guardian-source-defeated',atMs:120000,sourceTick:400,
     floor:8,observedRunToken:'run-0',observedEpisode:0},
   {kind:'guardian-source-physical-threshold',atMs:122000,sourceTick:440,
     floor:9,observedRunToken:'run-0',observedEpisode:0,
     fromFloor:8,toFloor:9},
   {kind:'source-run-token-change',atMs:200000,sourceTick:0,
     floor:0,observedRunToken:'run-1',observedEpisode:1},
   {kind:'fake',atMs:121000,sourceTick:'not-source',floor:8,
     observedRunToken:'run-0'},
 ];
 const cal={status:'CALIBRATED',offsetMs:-110000,maxResidualMs:30};
 const mapped=mapObservedEventTimecodes(indexed,cal,75);
 assert.equal(mapped.length,3);
 assert.equal(mapped[0].nativeVideoSeconds,10);
 assert.equal(mapped[1].nativeVideoSeconds,12);
 assert.equal(mapped[1].inOriginalVideo,true);
 assert.equal(mapped[2].inOriginalVideo,false);
 assert.equal(mapped[0].eventVisibleInVideo,'NOT EVALUATED');
 assert.equal(mapped[1].sourceToPresentedFrameLatency,'NOT EVALUATED');
 assert.equal(mapObservedEventTimecodes(indexed,{status:'NOT EVALUATED'},75).length,0);
 assert.equal(mapObservedEventTimecodes(indexed,cal,NaN).length,0);
});

test('capture and CI use the same neutral original-video calibration for both frozen and candidate',()=>{
  const capture=fs.readFileSync(path.resolve(__dirname,
    '../browser/tower-live-motion.spec.cjs'),'utf8');
  assert.match(capture,/nativeFrameAnchor = \{ file: name, startAtMs,/);
  assert.match(capture,/native-video-clock\.json/);
  assert.match(capture,/calibrateOriginalVideo\(\{/);
  assert.match(capture,/sourceTicks:passiveSourceTicks\.ticks/);
  assert.match(capture,/sourceEvents:eventIndex\.events/);
  assert.match(capture,/await video\.saveAs\(path\.join\(dir, 'live\.webm'\)\)/);
  assert.doesNotMatch(capture,/videoClockCalibration:'PASS'/);
});
