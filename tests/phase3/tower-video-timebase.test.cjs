'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {assessVideoTimebase,distance,visuallyMatchAnchor,
  meaningfulSourceEvents,mapObservedEventTimecodes,FRAME_BYTES,
  originalFrameDecodeArgs,readVideoFrames} =
  require('../../scripts/tower-video-timebase.cjs');
const os=require('node:os');
const {execFileSync}=require('node:child_process');

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
  assert.match(result.caveat,/NOT established; no on-screen or blind-review acceptance/);
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

test('real original portrait: reject mismatched native pictures, not genuine PTS clock gaps',()=>{
 const a=[
   anchor(100000,0,{imageDifference:.3,uniquenessMargin:20}),
   anchor(103000,3,{imageDifference:.3,uniquenessMargin:20}),
   anchor(106000,6,{imageDifference:.3,uniquenessMargin:20}),
   anchor(109000,9,{imageDifference:.3,uniquenessMargin:20}),
   anchor(112000,12,{imageDifference:12.92,uniquenessMargin:4.68}),
   anchor(115000,15,{imageDifference:.46,uniquenessMargin:19}),
   anchor(118000,12.2,{imageDifference:19.63,uniquenessMargin:1.6}),
   anchor(121000,21,{imageDifference:.36,uniquenessMargin:24}),
   anchor(124000,24,{imageDifference:.38,uniquenessMargin:24}),
 ];
 const repaired=assessVideoTimebase(a);
 assert.equal(repaired.status,'CALIBRATED');
 assert.equal(repaired.anchorsAccepted,7);
 assert.deepEqual(repaired.anchorTimeline.map(x=>x.videoPtsSeconds),[0,3,6,9,15,21,24]);
 assert.equal(repaired.minVideoToWallSlope,1);
 assert.equal(repaired.maxVideoToWallSlope,1);
 // Good pixel matches that genuinely disagree with time MUST still veto.
 const trueDiscontinuity=a.map((x,i)=>i===6?{
   ...x,imageDifference:.4,uniquenessMargin:20,videoPtsSeconds:18}:x);
 const blocked=assessVideoTimebase(trueDiscontinuity);
 assert.notEqual(blocked.status,'CALIBRATED');
 assert.equal(blocked.status,'PARTIALLY_CALIBRATED');
 assert.ok(blocked.invalidIntervals.length>=1);
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


test('genuine slow-recorder wall/video drift uses bounded local film anchors, not a fabricated constant offset',()=>{
 const anchors=[
   anchor(110000,10),anchor(120000,19.4),
   anchor(130000,28.9),anchor(140000,38.5),
 ];
 const clock=assessVideoTimebase(anchors);
 assert.equal(clock.status,'CALIBRATED');
 assert.equal(clock.anchorsAccepted,4);
 assert.ok(clock.maxResidualMs>350);
 assert.equal(clock.anchorTimeline.length,4);
 assert.match(clock.method,/piecewise/);
 const source=[
   {kind:'guardian-hp-decrease',atMs:125000,sourceTick:201,
     floor:8,observedRunToken:'run-a'},
   {kind:'guardian-source-defeated',atMs:130000,sourceTick:441,
     floor:8,observedRunToken:'run-a'},
 ];
 const mapped=mapObservedEventTimecodes(source,clock,71);
 assert.equal(mapped.length,2);
 assert.ok(Math.abs(mapped[0].nativeVideoSeconds-24.15)<.001);
 assert.ok(Math.abs(mapped[1].nativeVideoSeconds-28.9)<.001);
 assert.equal(mapped[0].eventVisibleInVideo,'NOT EVALUATED');
 assert.ok(mapped[0].clockUncertaintyMs>=200);
 assert.match(mapped[0].matchingMethod,/piecewise/);
});
test('piecewise timebase refuses abrupt or reversed video matches rather than laundering a jump',()=>{
 const abrupt=assessVideoTimebase([
  anchor(110000,10),anchor(120000,20),anchor(130000,33),anchor(140000,43),
 ]);
 assert.equal(abrupt.status,'NOT EVALUATED');
 assert.match(abrupt.reason,/abrupt/);
 const reverse=assessVideoTimebase([
  anchor(110000,10),anchor(120000,9),anchor(130000,19),
 ]);
 assert.equal(reverse.status,'NOT EVALUATED');
 const outlier=assessVideoTimebase([
  anchor(110000,10),anchor(120000,19.4),
  anchor(130000,28.9,{imageDifference:80}),anchor(140000,38.5),
 ]);
 assert.equal(outlier.status,'CALIBRATED');
 assert.equal(outlier.anchorsAccepted,3);
});
test('no screenshot coverage means no source-event film timecode, even if the source event exists',()=>{
 const clock=assessVideoTimebase([
  anchor(110000,10),anchor(120000,20),anchor(130000,30),anchor(140000,40),
 ]);
 const e=t=>({kind:'source-result-phase',atMs:t,sourceTick:8,
   floor:0,observedRunToken:'run-a'});
 const mapped=mapObservedEventTimecodes([e(109999),e(115000),
   e(140001)],clock,70);
 assert.equal(mapped.length,1);
 assert.equal(mapped[0].atMs,115000);
 assert.equal(mapped[0].nativeVideoSeconds,15);
 assert.equal(mapped[0].inOriginalVideo,true);
 assert.equal(mapped[0].eventVisibleInVideo,'NOT EVALUATED');
});

test('capture and CI use the same neutral original-video calibration for both frozen and candidate',()=>{
  const capture=fs.readFileSync(path.resolve(__dirname,
    '../browser/tower-live-motion.spec.cjs'),'utf8');
  // The native original WebM must never be stalled by seconds-long software
  // WebGL canvas/full-page screenshots. Capture BOTH frozen and candidate
  // with the same passive, source-independent compositor frame witnesses.
  assert.match(capture,/const compositorAnchors=await beginTowerNativeCompositorAnchors/);
  assert.match(capture,/compositorFrameEvidence/);
  assert.match(capture,/compositorAnchors\.anchors\.map/);
  assert.doesNotMatch(capture,/\b(?:page|canvas)\.screenshot\(/);
  assert.match(capture,/native-video-clock\.json/);
  assert.match(capture,/calibrateOriginalVideo\(\{/);
  assert.match(capture,/sourceTicks:passiveSourceTicks\.ticks/);
  assert.match(capture,/sourceEvents:eventIndex\.events/);
  assert.match(capture,/const originalWebMPath = path\.join\(dir, 'live\.webm'\)/);
  assert.match(capture,/if \(video\) await video\.saveAs\(originalWebMPath\)/);
  assert.doesNotMatch(capture,/videoClockCalibration:'PASS'/);
  const workflowPath=path.resolve(__dirname,
    '../../.github/workflows/tower-transformation-visual-evidence.yml');
  // The immutable baseline checkout may not contain the newer workflow at
  // all. Validate workflow wiring only in the current candidate checkout.
  if(fs.existsSync(workflowPath)){
    const workflow=fs.readFileSync(workflowPath,'utf8');
    assert.match(workflow,/cp current-harness\/scripts\/tower-video-timebase\.cjs source\/scripts\/tower-video-timebase\.cjs/);
    assert.match(workflow,/cp current-harness\/tests\/phase3\/tower-video-timebase\.test\.cjs source\/tests\/phase3\/tower-video-timebase\.test\.cjs/);
  }
});


test('an authentic unsafe compositor-clock boundary leaves two independent outcome forensic windows but NO full-video pass',()=>{
  const originals=[
    anchor(110000,10),anchor(120000,20),anchor(130000,30),anchor(140000,40),
    anchor(145000,42.5),anchor(155000,52.5),anchor(165000,62.5),
    anchor(175000,72.5),
  ];
  const clock=assessVideoTimebase(originals);
  assert.equal(clock.status,'PARTIALLY_CALIBRATED');
  assert.equal(clock.anchorSegments.length,2);
  assert.equal(clock.invalidIntervals.length,1);
  assert.equal(clock.invalidIntervals[0].observedVideoToWallSlope,.5);
  assert.equal(clock.anchorsUsable,8);
  assert.equal(clock.anchorTimeline,undefined);
  const index=atMs=>({kind:'source-result-phase',atMs,sourceTick:405,
    floor:0,observedRunToken:'source-run-0'});
  const times=mapObservedEventTimecodes([
    index(125000),index(142500),index(150000),index(160000),
    index(179000),index(100000)
  ],clock,80);
  assert.deepEqual(times.map(e=>e.atMs),[125000,150000,160000]);
  assert.deepEqual(times.map(e=>e.nativeVideoSeconds),[25,47.5,57.5]);
  assert.ok(times.every(e=>e.originalFullFilmTimebaseCertified===false &&
    e.eventVisibleInVideo==='NOT EVALUATED' &&
    e.matchingMethod==='partial-bounded-original-WebM-forensic-search'));
  assert.match(clock.reason,/full event\/video comparison remains blocked/);
});

test('a discontinuity without a sufficiently long independently observed window yields NO forensic source cue',()=>{
 const invalid=assessVideoTimebase([
   anchor(110000,10),anchor(120000,20),anchor(130000,33),anchor(140000,43)
 ]);
 assert.equal(invalid.status,'NOT EVALUATED');
 assert.deepEqual(mapObservedEventTimecodes([
   {kind:'source-result-phase',atMs:125000,sourceTick:8,
    floor:0,observedRunToken:'a'}
 ],invalid,80),[]);
 const forged={status:'PARTIALLY_CALIBRATED',offsetMs:-100000};
 assert.deepEqual(mapObservedEventTimecodes([
   {kind:'source-result-phase',atMs:125000,sourceTick:8,
    floor:0,observedRunToken:'a'}
 ],forged,80),[]);
});


test('source-pinned 2018 FFmpeg uses native PTS-preserving legacy passthrough, never frame-rate synthesis',()=>{
 const args=originalFrameDecodeArgs('/original/unmodified.webm');
 assert.deepEqual(args,[
   '-v','error','-i','/original/unmodified.webm','-vf',
   'scale=48:30,format=gray','-vsync','0',
   '-f','rawvideo','-pix_fmt','gray','pipe:1'
 ]);
 assert.equal(args.includes('-fps_mode'),false,
   'the 2018 packaged native FFmpeg does not support -fps_mode');
 assert.equal(args.includes('-r'),false,
   'never resample a full-motion original film to manufacture timestamps');
});

function nativeToolReady(name) {
 try { execFileSync(name,['-version'],{timeout:5000,stdio:'ignore'});return true; }
 catch { return false; }
}
test('real original WebM decodes one thumbnail per native ffprobe timestamp',{
 skip:!nativeToolReady('ffmpeg')||!nativeToolReady('ffprobe'),
},()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tower-native-pts-'));
 const file=path.join(dir,'original.webm');
 try{
   execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-nostdin',
     '-f','lavfi','-i','testsrc=duration=3:size=96x60:rate=12',
     '-an','-c:v','libvpx','-b:v','300k','-y',file],
     {timeout:25000,stdio:['ignore','pipe','pipe']});
   const frames=readVideoFrames(file);
   assert.ok(frames.pts.length>=30,'fixture must decode real frames');
   assert.equal(frames.bytes.length,frames.pts.length*FRAME_BYTES,
     'no synthetic, dropped or duplicated native frames');
   assert.ok(frames.pts.every((v,i)=>i===0||v>frames.pts[i-1]),
     'native decoder timestamps must remain strictly increasing');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
