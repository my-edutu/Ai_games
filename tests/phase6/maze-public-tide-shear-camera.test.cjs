'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const camera=()=>import(pathToFileURL(path.resolve(__dirname,
  '../../public/ai-maze-escape/map-view.mjs')).href);
const size=2.4;
const grid=(cells,visibleCells,overrides={})=>({
  runToken:'real-public-trap',tick:1,width:9,height:9,currentCell:40,
  cells,visibleCells,keys:[],doors:[],inventory:[],result:null,...overrides
});
const tile=(cell,trap=true)=>({cell,trap,blocked:false,neighbors:[],clue:false,checkpoint:false});

test('real public one-cell pressure trap earns a continuous shared mobile stage without moving anything',async()=>{
  const {publicObservedTrapCameraFocus:focus}=await camera();
  const actual=grid([tile(40,false),tile(41,true)],[40,41]);
  const before=JSON.stringify(actual),hero={x:0,z:0};
  const atCell=focus(actual,hero,size,390/844);
  assert.equal(atCell.cell,41);
  assert.equal(atCell.x,2.4);
  assert.equal(atCell.z,0);
  assert.ok(Math.abs(atCell.weight-.44)<1e-10);
  const edging=focus(actual,{x:-.8,z:0},size,390/844);
  assert.ok(edging.weight>0 && edging.weight<atCell.weight,
    'camera pan must fade rather than snap across approach boundary');
  assert.equal(focus(actual,{x:-1.2,z:0},size,390/844).weight,0,
    'at exactly one-and-a-half cell distance shared focus ends smoothly');
  assert.equal(focus(actual,{x:-3,z:0},size,390/844),null,
    'far-away hazard must not hijack ordinary autonomous exploration');
  assert.equal(JSON.stringify(actual),before,'never mutate authoritative public snapshot');
  assert.deepEqual(hero,{x:0,z:0},'never move or steer Pip');
});

test('only a genuinely diagonal published jaw gets extra pan, while axial departure fades',async()=>{
  const {publicObservedTrapCameraFocus:focus}=await camera();
  const actual=grid([tile(40,false),tile(50,true)],[40,50]);
  const realDiagonal=focus(actual,{x:0,z:0},size,320/740);
  assert.equal(realDiagonal.cell,50);
  assert.ok(Math.abs(realDiagonal.weight-.57)<1e-10,
    'genuine one-by-one diagonal 320px trap preserves its stronger shared camera');
  const axis=grid([tile(40,false),tile(41,true)],[40,41]);
  assert.ok(Math.abs(focus(axis,{x:0,z:0},size,320/740).weight-.44)<1e-10);
  const axialDeparture=focus(axis,{x:-.8,z:0},size,320/740);
  assert.ok(axialDeparture.weight>0&&axialDeparture.weight<.44,
    'axial departure must not masquerade as a diagonal encounter');
  const outer=focus(axis,{x:-1.2,z:0},size,320/740);
  assert.equal(outer.weight,0,'camera returns continuously to ordinary exploration');
  assert.deepEqual(focus(actual,{x:0,z:0},size,320/740),realDiagonal,
    'source-bound identical public frames remain deterministic');
});

test('private, merely remembered or invalid trap cannot take over the public camera',async()=>{
  const {publicObservedTrapCameraFocus:focus}=await camera();
  const hero={x:0,z:0},seen=grid([tile(40,false),tile(41,true)],[40,41]);
  assert.equal(focus(grid([tile(40,false),tile(41,true)],[40]),hero,size,390/844),null,
    'remembered-only disclosed hazard is NOT current public visual contact');
  assert.equal(focus(grid([tile(40,false)],[40],{privateTrapCells:[41],privateMap:{41:'trap'}}),hero,size,390/844),null,
    'private server fields cannot manufacture a presentation cue');
  assert.equal(focus(grid([tile(40,false),tile(41,false)],[40,41]),hero,size,390/844),null);
  assert.equal(focus(grid([tile(40,false),{...tile(41,true),blocked:true}],[40,41]),hero,size,390/844),null);
  assert.equal(focus(seen,hero,size,1280/900),null,'desktop stays on its prior camera');
  assert.equal(focus(seen,hero,size,844/390),null,'landscape remains unmodified');
  assert.equal(focus(seen,hero,size,320/740)?.cell,41,'real 320px is protected too');
  assert.equal(focus(grid(seen.cells,seen.visibleCells,{result:'escaped'}),hero,size,390/844),null,
    'terminal animation must not gain a new inferred pressure shot');
});

test('tie-breaking and replay remain deterministic across public source frames',async()=>{
  const {publicObservedTrapCameraFocus:focus}=await camera();
  const a=grid([tile(40,false),tile(39,true),tile(41,true)],[40,39,41]);
  const b=grid([tile(41,true),tile(40,false),tile(39,true)],[41,40,39]);
  const pose={x:0,z:0};
  const first=focus(a,pose,size,390/844),second=focus(b,pose,size,390/844);
  assert.equal(first.cell,39,'equal real distances use stable public cell identity');
  assert.deepEqual(first,second,'public cell enumeration order cannot shift the camera');
  assert.deepEqual(focus(a,pose,size,390/844),first,'same state always gives same framing');
});

test('public keyed diagonal trap restores genuine phone-size physical action without zooming the tight pressure beat',async()=>{
  const {publicObservedTrapCameraFocus:focus,
    publicKeyedPressureStageHalfHeight:stage}=await camera();
  const original=7.119897435897436; // source-bound 390px original half-height at the public keyed gate
  const published=grid([tile(40,false),tile(50,true)],[40,50]);
  const jaw=focus(published,{x:0,z:0},size,390/844);
  const before=JSON.stringify(published);
  assert.ok(jaw && jaw.weight>=.35 && Math.abs(jaw.distance/size-Math.SQRT2)<1e-9);
  const atKeyhole=stage(390/844,original,1,jaw,size);
  assert.ok(atKeyhole<6.58 && atKeyhole>6.5,
    'only a real fully disclosed near-keyhole diagonal composition receives a modest camera close-up');
  assert.ok(.6621263750241755*original/atKeyhole>.70,
    'the ORIGINAL actual withdrawal silhouette size requires a real optical correction, not a relaxed test');
  assert.equal(stage(390/844,original,.38196601125,jaw,size),original,
    'the tighter one-cell pressure/key-look stage cannot be shrunk into a crop');
  const oneCell=focus(grid([tile(40,false),tile(41,true)],[40,41]),
    {x:0,z:0},size,390/844);
  assert.equal(stage(390/844,original,1,oneCell,size),original,
    'do not zoom the actual one-cell jaw already close to the physical right boundary');
  assert.equal(stage(844/390,original,1,jaw,size),original,
    'do not alter landscape action scale');
  assert.equal(stage(390/844,original,1,jaw,size,true),original,
    'reduced motion remains on the original stable camera');
  assert.equal(stage(390/844,original,1,null,size),original,
    'no unknown, private or undisclosed trap earns a stage');
  assert.equal(stage(390/844,original,1,jaw,size),atKeyhole,
    'replaying an identical public snapshot yields exactly the same optical size');
  assert.equal(JSON.stringify(published),before,
    'presentation does not mutate published knowledge or autonomous authority');
});

test('Pass239 actual 390 pressure silhouette earns a physical closer shot without shrinking or cropping either model',async()=>{
  const {publicPressureActionHalfHeight:stage}=await camera();
  // Original source-bound exact HEAD f6970f7e, real unedited tick5
  // 390x844 image/diagnostic, not a guessed sculpture radius.
  const originalHeight=7.119897427746005;
  const heroOriginalWidth=.46978883742533656;
  const jawOriginalLeft=-.8462757949441911;
  const jawOriginalRight=.32323155536050174;
  const width320Withdrawal=.8988851364300865-(-.796562483001803);
  const tighter=stage(390/844,originalHeight,true,false);
  const physicalGain=originalHeight/tighter;
  assert.ok(physicalGain>1.06 && physicalGain<1.065);
  assert.ok(heroOriginalWidth*physicalGain>.49,
    'original real Pip needs a physically closer lens, not a weaker browser test');
  assert.ok(jawOriginalLeft*physicalGain>-.95 && jawOriginalRight*physicalGain<.95,
    'original full real pressure jaw must still fit without clipping');
  assert.ok(width320Withdrawal*physicalGain<1.90,
    'even 320px retreat pair must remain jointly reframeable under strict ±.95 NDC');
  for (const aspect of [320/740,390/844])
    assert.ok(stage(aspect,originalHeight,true,false)<originalHeight);
  for(const [aspect,pressure,reduced] of [
    [844/390,true,false],[1280/900,true,false],[390/844,false,false],
    [390/844,true,true],[NaN,true,false],[.2,true,false],
  ])assert.equal(stage(aspect,originalHeight,pressure,reduced),originalHeight,
    'no unknown, reduced-motion or unrelated shot earns the closer pressure lens');
  assert.equal(stage(390/844,originalHeight,true,false),tighter,
    'replaying the same public pressure stage is deterministic and allocation free');
  assert.equal(stage(390/844,NaN,true,false),NaN,
    'malformed heights cannot manufacture a camera value');
  const source=require('node:fs').readFileSync(
    path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(source,/targetHeight = publicPressureActionHalfHeight\(\s*aspect,targetHeight,pressureFirst,settings\.reducedMotion\)/,
    'the source renderer must actually use the public-only close-up, not a dead helper');
});

test('the true 320px withdrawal camera must fit complete connected-world Pip bounds, not the narrower per-mesh approximation',async()=>{
  const {publicPhysicalPressureHorizontalReframe:reframe}=await camera();
  // Original native 320x740 tick6 (exact source 58443146), not synthetic enemy position:
  // WORLD-aligned Pip right +.956261 is cropped despite a full visible jaw.
  const hero={left:.3491636823113262,right:.9562610034498623};
  const jaw={left:-.8474080595368364,right:-.09366677480777973};
  const halfHeight=6.7,aspect=320/740;
  const worldShift=reframe(hero,jaw,halfHeight,aspect);
  const ndcShift=worldShift/(halfHeight*aspect);
  assert.ok(worldShift>0&&Number.isFinite(worldShift),
    'source-authentic crop must earn an actual optical pan');
  assert.ok(hero.right-ndcShift<=.9500000001&&jaw.left-ndcShift>=-.9500000001,
    'both full physical silhouettes must fit original unchanged ±.95 NDC');
  assert.equal(reframe({left:.35,right:.942},jaw,halfHeight,aspect),0,
    'the smaller per-piece estimate falsely declares the cropped hero safe');
  const source=require('node:fs').readFileSync(
    path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(source,/pressureReframeEnvelope\.union\([\s\S]*?applyMatrix4\(mesh\.matrixWorld\)/,
    'actual renderer must fit the SAME conservative world mesh union as browser no-crop diagnostics');
  assert.match(source,/pressureReframeEnvelope\.makeEmpty\(\)/,
    'reused AABB must clear before each separately disclosed actor and hazard');
});

test('the actual source-bound tick6 floating-point crop receives interior optical margin without loosening ±0.95 acceptance',async()=>{
  const {publicPhysicalPressureHorizontalReframe:fit}=await camera();
  // Genuine source b2d376f native 320px tick6 AFTER whole-mesh correction:
  // explorer.right === .9500000000000002, failing the original inclusive limit.
  const hero={left:.3428891977996888,right:.9500000000000002};
  const jaw={left:-.8536764669830323,right:-.09993518225397562};
  const height=7.151637499999999,aspect=320/740;
  const displacement=fit(hero,jaw,height,aspect)/(height*aspect);
  assert.ok(displacement>=.0049,
    'real-source full-model stage must aim INSIDE strict edge, not land on float-equal +.95');
  assert.ok(hero.right-displacement<=.9450000001,
    'actual camera target must leave interior slack for the original ±.95 acceptance');
  assert.ok(jaw.left-displacement>=-.95&&jaw.right-displacement<=.95,
    'real public jaw remains fully within the UNCHANGED physical no-crop boundary');
  const safe={left:-.5,right:.5};
  assert.equal(fit(safe,{left:-.7,right:-.1},height,aspect),0,
    'existing genuinely safe public scenes retain their current composition');
  const source=require('node:fs').readFileSync(
    path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs'),'utf8');
  assert.match(source,/const safe=\.945;/,
    'production target must preserve 0.005 optical margin within existing ±.95');
});
