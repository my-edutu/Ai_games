'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {checksum}=require('../../dist/packages/replay/src/index.js');
const {DEFAULT_ESCAPE_ROOM_CONFIG,parseEscapeRoomConfig,EscapeRuntime,buildEscapeRenderSnapshot,EscapePresentationController}=require('../../dist/games/ai-escape-room/src/index.js');
const themes=['cipher-vault','clockwork-study','chromatic-lab','archive-zero'];
function config(theme){return parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG,theme,difficulty:8,puzzleDepth:12,objectCount:48,decoyCount:5,hazardCount:2,maxTicks:2400,noProgressTicks:360,intermissionTicks:3});}
function strings(value,result=[]){if(typeof value==='string')result.push(value);else if(value&&typeof value==='object')for(const child of Object.values(value))strings(child,result);return result;}

for(const theme of themes)test(`full ${theme} runs preserve public privacy and complete mechanism counts at the maximum depth`,()=>{
  for(const index of [0,1,2]){
    const seed=`gauntlet-private-${theme}-${index}`,runtime=EscapeRuntime.create({config:config(theme),seed,runId:`private-run-${index}`,policy:'autonomous'});
    let seenPreExit=false,frame;
    while(runtime.state.lifecycle==='running'){
      const step=runtime.step(),before=checksum(runtime.state);
      frame=buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),step.events);
      assert.equal(checksum(runtime.state),before,'projection cannot mutate authority');
      assert.ok(Object.isFrozen(frame)&&Object.isFrozen(frame.objects)&&Object.isFrozen(frame.ai));
      assert.doesNotMatch(JSON.stringify(frame),/hiddenFact|"solution"|"seed"|"rootSeed"|"roomSeed"|"runId"|consideredActionKeys|chainOfThought/);
      const publicStrings=new Set(strings(frame));assert.equal(publicStrings.has(seed),false);assert.equal(publicStrings.has(`private-run-${index}`),false);
      // Portable tool identifiers are intentionally public; derived combination/code values are private.
      for(const puzzle of runtime.state.room.puzzles.filter(puzzle=>puzzle.kind!=='tool-dependency'))assert.equal(publicStrings.has(puzzle.solution),false,`private code became a public scalar: ${puzzle.id}`);
      assert.equal(frame.progress.solvedPuzzles,runtime.state.solvedPuzzleIds.length);
      assert.equal(frame.progress.totalPuzzles,runtime.state.room.puzzles.length);
      if(frame.progress.permille===1000&&frame.scene!=='result'){seenPreExit=true;assert.notEqual(frame.avatar.mode,'celebrating');}
    }
    assert.equal(runtime.state.result.reason,'escape',`${theme}/${index}`);assert.ok(seenPreExit,'unlocking all mechanisms must precede the exit action');
    assert.equal(frame.scene,'result');assert.equal(frame.avatar.mode,'celebrating');
    const mechanisms=frame.objects.filter(object=>object.mechanismKind);
    assert.equal(mechanisms.length,12);assert.ok(mechanisms.every(object=>object.solved));assert.equal(new Set(mechanisms.map(object=>object.id)).size,12);
    assert.deepEqual(new Set(mechanisms.map(object=>object.id)),new Set(runtime.state.room.puzzles.map(puzzle=>puzzle.targetObjectId)));
  }
});

test('arbitrary presentation reads, accessibility layouts and output recovery do not change autonomous replay',()=>{
  const cfg=config('cipher-vault');
  const options={config:cfg,seed:'gauntlet-presentation-isolation',runId:'gauntlet-isolation',policy:'autonomous'};
  const baseline=EscapeRuntime.create(options),observed=EscapeRuntime.create(options);
  const controller=new EscapePresentationController({replayCapacity:12,maxObjects:48,muted:true});
  for(let index=0;index<150;index++){
    const expected=baseline.step(),actual=observed.step();
    controller.accept(buildEscapeRenderSnapshot(observed.state,observed.presentationSignals(),actual.events));
    controller.frame(390,844,{cleanFeed:index%2===0});controller.frame(1920,1080,{phoneLandscape:false});
    if(index%7===0){controller.failOutput('synthetic bounded renderer failure');assert.equal(controller.frame().scene,'recovery');assert.equal(controller.rebuildFromLatest().recovered,true);}
    assert.equal(checksum(observed.state),checksum(baseline.state),`authority diverged at step ${index}`);
    assert.deepEqual(actual.events,expected.events);assert.ok(controller.replayWindow(100).length<=12);
  }
  assert.ok(observed.state.roomIndex>1,'include automatic new-room transitions');
});

test('revealing a hidden object cannot move already placed clues and mechanisms',()=>{
  const cfg=parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG,theme:'cipher-vault',difficulty:8,puzzleDepth:8,objectCount:36,decoyCount:5,hazardCount:2,maxTicks:2400,noProgressTicks:360});
  const runtime=EscapeRuntime.create({config:cfg,seed:'gauntlet-vault-reference-v1',runId:'gauntlet-stable-room',policy:'autonomous'});
  const placed=new Map();let revealCount=0;
  const inspect=frame=>{
    for(const object of frame.objects){
      if(placed.has(object.id))assert.deepEqual(object.placement,placed.get(object.id),`stationary object ${object.id} moved at tick ${frame.tick}; events ${frame.events.map(event=>event.type).join(', ')}`);
      placed.set(object.id,object.placement);
    }
  };
  inspect(buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),runtime.drainEvents()));
  while(runtime.state.lifecycle==='running'){
    const step=runtime.step();revealCount+=step.events.filter(event=>event.type==='object-revealed').length;
    inspect(buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),step.events));
  }
  assert.ok(revealCount>0,'the fixture must exercise real hidden-object reveals');
});
