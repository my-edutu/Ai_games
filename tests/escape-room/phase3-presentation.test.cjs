const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {checksum}=require('../../dist/packages/replay/src/index.js');
const {
 DEFAULT_ESCAPE_ROOM_CONFIG,parseEscapeRoomConfig,EscapeRuntime,
 buildEscapeRenderSnapshot,computeEscapeLayout,updateEscapeCamera,
 deriveEscapeAudioCues,EscapePresentationController,classifyEscapeOutputHealth,
}=require('../../dist/games/ai-escape-room/src/index.js');
const cfg=()=>parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG,puzzleDepth:8,objectCount:36,decoyCount:5,hazardCount:2,maxTicks:1200,noProgressTicks:240});
const runtime=()=>EscapeRuntime.create({config:cfg(),seed:'phase3-proof',runId:'private-run',policy:'autonomous'});

test('render projection is immutable, bounded and private',()=>{
 const run=runtime();for(let i=0;i<7;i++)run.step();
 const hidden=run.state.room.puzzles.find(p=>!run.state.solvedPuzzleIds.includes(p.id))?.solution;
 const before=checksum(run.state),view=buildEscapeRenderSnapshot(run.state,run.presentationSignals(),run.drainEvents());
 assert.equal(checksum(run.state),before);assert.ok(Object.isFrozen(view));assert.ok(Object.isFrozen(view.objects));
 assert.ok(view.objects.length<=48);assert.ok(view.events.length<=24);assert.equal(view.runId,undefined);assert.equal(view.seed,undefined);
 const text=JSON.stringify(view);assert.doesNotMatch(text,/hiddenFact|rootSeed|roomSeed|oracle/i);if(hidden)assert.equal(text.includes(hidden),false);
 assert.throws(()=>view.objects.push({}));
});

test('public snapshot explains objective, progress, danger and concise AI intent',()=>{
 const run=runtime();for(let i=0;i<4;i++)run.step();const view=buildEscapeRenderSnapshot(run.state,run.presentationSignals(),run.drainEvents());
 assert.match(view.objective,/escape/i);assert.ok(view.progress.totalPuzzles>=2);assert.ok(view.timer.remainingTicks>=0);
 assert.ok(view.ai.intent);assert.ok(['low','medium','high'].includes(view.ai.confidenceBand));
 assert.doesNotMatch(JSON.stringify(view.ai),/consideredActionKeys|solution|chainOfThought/i);
});

test('desktop, phone landscape and clean feed remain in safe bounds',()=>{
 for(const [size,mode] of [[{width:1920,height:1080},{cleanFeed:false,phoneLandscape:false}],[{width:844,height:390},{cleanFeed:false,phoneLandscape:true}],[{width:1280,height:720},{cleanFeed:true,phoneLandscape:false}]]){
  const layout=computeEscapeLayout(size,mode);for(const rect of Object.values(layout)){assert.ok(rect.x>=0&&rect.y>=0);assert.ok(rect.x+rect.width<=size.width+.001);assert.ok(rect.y+rect.height<=size.height+.001)}
  assert.ok(layout.stage.width>0&&layout.stage.height>0);if(mode.cleanFeed)assert.equal(layout.sidebar.width,0);
 }
});

test('camera and semantic audio are deterministic and cosmetic',()=>{
 const run=runtime(),before=checksum(run.state),step=run.step(),view=buildEscapeRenderSnapshot(run.state,run.presentationSignals(),step.events);
 assert.deepEqual(updateEscapeCamera(view,null),updateEscapeCamera(view,null));
 const cues=deriveEscapeAudioCues(view.events,view,{muted:false,maxVoices:8});assert.ok(cues.length<=8);assert.deepEqual(cues,deriveEscapeAudioCues(view.events,view,{muted:false,maxVoices:8}));
 assert.deepEqual(deriveEscapeAudioCues(view.events,view,{muted:true,maxVoices:8}),[]);assert.notEqual(checksum(run.state),before);
});

test('controller rejects stale frames, bounds replay and restores latest valid frame',()=>{
 const run=runtime(),controller=new EscapePresentationController({replayCapacity:12,maxObjects:48,muted:true});let view=buildEscapeRenderSnapshot(run.state,run.presentationSignals(),run.drainEvents());
 assert.equal(controller.accept(view).accepted,true);assert.equal(controller.accept(view).accepted,false);
 for(let i=0;i<20;i++){const step=run.step();view=buildEscapeRenderSnapshot(run.state,run.presentationSignals(),step.events);controller.accept(view)}
 assert.ok(controller.replayWindow(100).length<=12);controller.failOutput('fault');assert.equal(controller.frame().scene,'recovery');assert.equal(controller.rebuildFromLatest().recovered,true);
});

test('output health distinguishes stale, black, frozen and muted output',()=>{
 const base={snapshotAgeMs:40,paintAgeMs:40,audioAgeMs:40,blackFrame:false,frozenFrame:false,muted:false};
 assert.equal(classifyEscapeOutputHealth(base).level,'healthy');assert.equal(classifyEscapeOutputHealth({...base,snapshotAgeMs:4000}).reason,'stale-snapshot');
 assert.equal(classifyEscapeOutputHealth({...base,blackFrame:true}).level,'safe-scene');assert.equal(classifyEscapeOutputHealth({...base,frozenFrame:true}).reason,'frozen-output');
 assert.equal(classifyEscapeOutputHealth({...base,audioAgeMs:9000}).reason,'silent-output');assert.equal(classifyEscapeOutputHealth({...base,audioAgeMs:9000,muted:true}).level,'healthy');
});

test('browser source is dependency-free, accessible and avoids unsafe DOM injection',()=>{
 const root=path.resolve(__dirname,'../../public/ai-escape-room'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'styles.css'),'utf8'),js=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.match(html,/data-testid="escape-canvas"/);assert.match(html,/data-testid="objective"/);assert.match(html,/data-testid="ai-intent"/);assert.match(html,/data-testid="captions"/);
 assert.match(css,/prefers-reduced-motion/);assert.match(css,/data-high-contrast/);assert.match(css,/data-clean-feed/);assert.equal(/https?:\/\//.test(html+css+js),false);
 assert.equal(js.includes('innerHTML'),false);assert.match(js,/AbortController/);assert.match(js,/MAX_TRAIL\s*=\s*240/);assert.match(js,/setAttribute\(`data-/);
});
