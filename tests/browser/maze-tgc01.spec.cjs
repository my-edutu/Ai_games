'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {MazeRuntime}=require('../../dist/games/ai-maze-escape/src/runtime/run.js');
const {buildMazeRenderSnapshot}=require('../../dist/games/ai-maze-escape/src/presentation/snapshot.js');
const {MazePresentationController}=require('../../dist/games/ai-maze-escape/src/presentation/controller.js');
const {GUARDIAN_COURT_CONFIG,GUARDIAN_COURT_SEED,guardianCourtChapter}=
  require('../../scripts/maze-flagship-chapter.cjs');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'artifacts/maze-phase3/tgc01');
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function sourceIdentity(){
  return {
    sourceSha:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
    workingTreeClean:!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),
    sourceSha256:Object.fromEntries(['index.html','app.js','scene.js','world.js','characters.js','gameplay-hud.css','public-lantern-encounter.mjs','public-counter-impact.mjs']
      .map(name=>[name,sha(path.join(root,'public/ai-maze-escape',name))]))
  };
}

// Produce every tick through the real public-observation policy. Browser
// playback only slows this immutable public stream for inspection; it never
// changes an action, actor, cell, result, or published discovery.
function naturalRun(seed=GUARDIAN_COURT_SEED){
  const runtime=MazeRuntime.create(GUARDIAN_COURT_CONFIG,seed,{policy:'partial-observation'});
  const chapter=guardianCourtChapter(runtime.state.world);
  expect(chapter).toBeTruthy();
  const controller=new MazePresentationController({replayCapacity:360,maxEntities:2048});
  const frames=[],beats=new Map();let cursor=0,counter=null;
  const remember=(name,tick)=>{if(![...beats.values()].flat().includes(name))
    beats.set(tick,[...(beats.get(tick)||[]),name]);};
  for(let i=0;i<=200;i++){
    const snapshot=buildMazeRenderSnapshot(runtime.state);
    controller.accept(snapshot,runtime.events.slice(cursor));cursor=runtime.events.length;
    frames.push({...controller.frame(1280,900),stepDurationMs:360});
    if(i===0)remember('arrival',i);
    if(snapshot.cells.some(c=>c.trap&&c.visible))remember('pressure',i);
    const guardian=snapshot.threats.find(t=>t.id===chapter.guardianId);
    if(guardian&&!guardian.lanternParried)remember('guardian-warning',i);
    if(guardian?.lanternParried&&counter===null){counter=i;remember('counter',i);}
    if(snapshot.doors.some(d=>d.id===chapter.guardianSealId))remember('gallery-discovered',i);
    if(snapshot.inventory.includes(chapter.keyId))remember('key',i);
    if(snapshot.inventory.includes(chapter.keyId)&&snapshot.currentCell===chapter.entryCell)
      remember('return',i);
    if(snapshot.doors.some(d=>d.id===chapter.gateId&&d.open))remember('gate',i);
    if(snapshot.result){remember('escape',i);break;}
    runtime.step();
  }
  expect(runtime.state.result?.reason).toBe('escape');
  expect(runtime.events.some(event=>event.type==='action-rejected')).toBe(false);
  expect(counter).not.toBeNull();
  const parry=runtime.events.find(event=>event.type==='guardian-lantern-parry');
  const release=runtime.events.find(event=>event.type==='guardian-gate-opened');
  expect(release?.tick).toBe(parry.tick);
  return {frames,beats,chapter,events:runtime.events};
}

for(const [width,height] of [[320,740],[390,844],[844,390],[1280,900]]){
  test(`TGC-01 real autonomous court full-frame ${width}x${height}`,async({page})=>{
    test.setTimeout(150000);
    fs.mkdirSync(dir,{recursive:true});
    const run=naturalRun(),errors=[];let active=run.frames[0];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/maze/state*',route=>route.fulfill({json:active}));
    // Park only the next named game animation callback AFTER a real frame
    // has rendered. PNG and diagnostic then describe the very same pixels.
    // Native browser/Playwright rAFs keep running; no pose or clock is forged.
    await page.addInitScript(()=>{
      const nativeRaf=window.requestAnimationFrame.bind(window);
      let held=false,parked=null,requested=null;
      window.requestAnimationFrame=callback=>callback?.name!=='animate'?nativeRaf(callback)
        :nativeRaf(time=>{
          if(held){parked=callback;return;}
          const before=window.__MAZE_3D__?.frames;
          callback(time);
          if(requested&&window.__MAZE_3D__?.frames!==before){
            held=true;const resolve=requested;requested=null;resolve();
          }
        });
      window.__TGC_CAPTURE_FRAME__={hold(){return new Promise(resolve=>{requested=resolve;});},resume(){held=false;
        if(parked){const callback=parked;parked=null;nativeRaf(callback);}}};
    });
    await page.setViewportSize({width,height});
    await page.goto('http://127.0.0.1:4174/maze?camera=follow',{waitUntil:'domcontentloaded'});
    const identity=sourceIdentity();
    const samples=[];
    for(const frame of run.frames){
      const before=await page.evaluate(()=>window.__MAZE_3D__?.frames??0);
      active=frame;
      await page.waitForFunction(({tick,token,before,result})=>{
        const d=window.__MAZE_3D__;
        return d?.renderer==='webgl'&&d.tick===tick&&d.runToken===token&&d.frames>before+3
          &&(result||document.getElementById('scene-card')?.hidden===true);
      },{tick:frame.snapshot.tick,token:frame.snapshot.runToken,before,result:!!frame.snapshot.result},{timeout:45000});
      if(!run.beats.has(frame.snapshot.tick))continue;
      // Let the real transition settle; preserve the finite earned counter
      // inside its existing two-second visual beat. No fake animation clock.
      if(run.beats.get(frame.snapshot.tick).includes('counter')){
        await page.waitForFunction(()=>{
          const p=window.__MAZE_3D__?.authoredCounterPresentation;
          return p?.connected&&p.coreVisible&&p.impactVisible&&p.phase>=.18&&p.phase<.69;
        },null,{timeout:6000});
      }else await page.waitForTimeout(frame.snapshot.result?1750:300);
      await page.evaluate(()=>window.__TGC_CAPTURE_FRAME__.hold());
      const diagnostic=await page.evaluate(()=>{
        const d=window.__MAZE_3D__,s=window.__MAZE_PUBLIC_STATE__;
        const controls=[...document.querySelectorAll('.presentation-controls > button, .presentation-controls summary')]
          .map(el=>({id:el.id||el.parentElement.id,...el.getBoundingClientRect().toJSON()}));
        const occupiedHud=[...document.querySelectorAll('.masthead, #hud .mission-block, #hud .metric-grid, #hud .inventory-card, #hud .intent-card, #map-panel, #captions')]
          .filter(el=>{const css=getComputedStyle(el);return css.display!=='none'&&css.visibility!=='hidden'&&Number(css.opacity)>0;})
          .map(el=>({id:el.id||el.className,...el.getBoundingClientRect().toJSON()}));
        return {render:d,publicSnapshot:s,duelSightline:window.__MAZE_PUBLIC_DUEL_SIGHTLINE__?.()??null,
          terminalSightline:window.__MAZE_PUBLIC_TERMINAL_SIGHTLINE__?.()??null,
          controls,occupiedHud,scrollWidth:document.documentElement.scrollWidth,
          scrollHeight:document.documentElement.scrollHeight,
          stage:document.getElementById('maze').getBoundingClientRect().toJSON(),
          caption:document.getElementById('caption')?.textContent};
      });
      const names=run.beats.get(frame.snapshot.tick),label=names.join('-');
      const file=path.join(dir,`court-${label}-${width}.png`);
      await page.screenshot({path:file,fullPage:true});
      await page.evaluate(()=>window.__TGC_CAPTURE_FRAME__.resume());
      const evidence={capturedAt:new Date().toISOString(),...identity,
        imageSha256:sha(file),viewport:{width,height},seed:GUARDIAN_COURT_SEED,
        source:'Unaltered native Playwright WebGL; consecutive immutable public frames of one actual autonomous run, slowed only for observation',
        beats:names,tick:frame.snapshot.tick,runToken:frame.snapshot.runToken,diagnostic};
      fs.writeFileSync(file.replace(/\.png$/,'.json'),JSON.stringify(evidence,null,2)+'\n');
      samples.push({file:path.basename(file),tick:frame.snapshot.tick,beats:names});
      expect.soft(diagnostic.scrollWidth,'native full width, no crop').toBe(width);
      expect.soft(diagnostic.scrollHeight,'native full height, no crop').toBe(height);
      expect.soft(diagnostic.stage.width).toBe(width);
      expect.soft(diagnostic.stage.height).toBe(height);
      expect.soft(diagnostic.render.explorerModelFullyInFrame,`${label}: full physical Pip`).toBe(true);
      expect.soft(diagnostic.render.guardianModelsFullyInFrame,`${label}: full physical Thornback`)
        .toBe(diagnostic.render.wardensInFrame);
      for(const bounds of [diagnostic.render.explorerPhysicalBounds,...diagnostic.render.guardianPhysicalBounds]){
        expect.soft(bounds.left,`${label}: left physical margin`).toBeGreaterThanOrEqual(-.95);
        expect.soft(bounds.right,`${label}: right physical margin`).toBeLessThanOrEqual(.95);
        expect.soft(bounds.bottom,`${label}: bottom physical margin`).toBeGreaterThanOrEqual(-.95);
        expect.soft(bounds.top,`${label}: top physical margin`).toBeLessThanOrEqual(.95);
      }
      expect.soft(diagnostic.render.geometries,'unchanged strict scene budget').toBeLessThan(100);
      expect.soft(diagnostic.render.world.renderedCells,'only actually published terrain')
        .toEqual(frame.snapshot.cells.map(c=>c.cell));
      for(const control of diagnostic.controls){
        expect.soft(control.width,control.id+' hit width').toBeGreaterThanOrEqual(44);
        expect.soft(control.height,control.id+' hit height').toBeGreaterThanOrEqual(44);
        expect.soft(control.left).toBeGreaterThanOrEqual(0);
        expect.soft(control.right).toBeLessThanOrEqual(width);
      }
      if(names.includes('counter')){
        const contact=diagnostic.render.authoredCounterPresentation;
        expect.soft(contact?.connected,'actual reciprocal open corridor').toBe(true);
        expect.soft(contact?.coreVisible,'actual rendered lantern core').toBe(true);
        expect.soft(contact?.impactVisible,'guardian contact ring').toBe(true);
        expect.soft(contact?.links).toBeGreaterThanOrEqual(1);
        expect.soft(contact?.links).toBeLessThanOrEqual(3);
        expect.soft(contact?.lanternOrigin).toHaveLength(3);
        expect.soft(contact?.guardianContact).toHaveLength(3);
        if(contact?.midCell!==null)expect.soft(contact?.secondSegmentVisible).toBe(true);
        const sightline=diagnostic.duelSightline;
        expect.soft(sightline?.eligible,'real earned recoil exposes actual mesh rays').toBe(true);
        const bodies=sightline?.samples.filter(p=>['head','torso','boots'].includes(p.part))??[];
        expect.soft(bodies).toHaveLength(6);
        for(const anchor of bodies){
          expect.soft(anchor.inFrame,anchor.actor+' '+anchor.part).toBe(true);
          expect.soft(anchor.inconclusive,anchor.actor+' '+anchor.part).toBe(false);
          expect.soft(anchor.verifiedClear,anchor.actor+' '+anchor.part+' occlusion').toBe(true);
          const x=(anchor.screenX+1)*width/2,y=(1-anchor.screenY)*height/2;
          expect.soft(diagnostic.occupiedHud.some(r=>x>r.left&&x<r.right&&y>r.top&&y<r.bottom),
            anchor.actor+' '+anchor.part+' must remain visible beside occupied HUD').toBe(false);
        }
      }
      if(names.includes('escape')){
        expect.soft(diagnostic.render.publicVictoryScene).toBe(true);
        expect.soft(diagnostic.render.terminalPortalBounds?.fullyInFrame,'complete exit mechanism').toBe(true);
      }
    }
    fs.writeFileSync(path.join(dir,`court-playthrough-${width}.json`),JSON.stringify({
      capturedAt:new Date().toISOString(),...identity,seed:GUARDIAN_COURT_SEED,
      chapter:run.chapter,samples,events:run.events,
      ticks:run.frames.map(f=>({tick:f.snapshot.tick,cell:f.snapshot.currentCell,
        publicChecksum:f.snapshot.publicChecksum,runToken:f.snapshot.runToken})),errors
    },null,2)+'\n');
    expect(errors).toEqual([]);
  });
}

test('TGC-01 six actual authored resets keep the original resource budget',async({page})=>{
  test.setTimeout(90000);
  const frames=[];
  for(let run=0;run<6;run++){
    const sequence=naturalRun(`tideglass-guardian-court-reset-${run}`).frames;
    frames.push(sequence[0],sequence[9],sequence.at(-1));
  }
  let active=frames[0];const samples=[],errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:640,height:480});
  await page.route('**/maze/state*',route=>route.fulfill({json:active}));
  await page.goto('http://127.0.0.1:4174/maze?reducedMotion=1');
  for(const frame of frames){
    active=frame;
    await page.waitForFunction(({tick,token})=>window.__MAZE_3D__?.tick===tick
      &&window.__MAZE_3D__?.runToken===token,{tick:frame.snapshot.tick,token:frame.snapshot.runToken});
    const sample=await page.evaluate(()=>window.__MAZE_3D__);samples.push(sample);
    expect(sample.geometries).toBeLessThan(100);
    expect(sample.textures).toBeLessThanOrEqual(4);
    expect(sample.world.renderedCells).toEqual(frame.snapshot.cells.map(cell=>cell.cell));
  }
  const starts=samples.filter((_,index)=>index%3===0);
  const spread=Math.max(...starts.map(s=>s.geometries))-Math.min(...starts.map(s=>s.geometries));
  expect(spread).toBeLessThanOrEqual(8);
  expect(new Set(samples.map(s=>s.publicGuideGeometryId)).size).toBe(1);
  expect(errors).toEqual([]);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'court-six-resets.json'),JSON.stringify({
    capturedAt:new Date().toISOString(),...sourceIdentity(),
    spread,samples:samples.map(s=>({tick:s.tick,runToken:s.runToken,geometries:s.geometries,
      textures:s.textures,publicGuideGeometryId:s.publicGuideGeometryId})),errors
  },null,2)+'\n');
});

test('TGC-01 unmodified live host records one complete autonomous chapter',async({browser})=>{
  test.setTimeout(65000);
  fs.mkdirSync(dir,{recursive:true});
  const context=await browser.newContext({viewport:{width:390,height:844},
    recordVideo:{dir:path.join(dir,'raw-video'),size:{width:390,height:844}}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const video=page.video();
  try{
    // No route interception, injected clock, held animation or forced reset.
    // Wait for the host's ordinary next run, then watch its real public feed.
    await page.goto('http://127.0.0.1:4174/maze?camera=follow',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__MAZE_3D__?.frames>2
      &&window.__MAZE_PUBLIC_STATE__?.layoutId==='guardian-court-v1');
    const initial=await page.evaluate(()=>window.__MAZE_PUBLIC_STATE__.runToken);
    await page.waitForFunction(token=>window.__MAZE_PUBLIC_STATE__?.runToken!==token,initial,
      {timeout:25000});
    const token=await page.evaluate(()=>window.__MAZE_PUBLIC_STATE__.runToken);
    // Observe real renderer diagnostics from the ordinary browser rAF. Do
    // not intercept source frames, mutate the camera, hold the game clock,
    // force a reset or issue an AI action. A live missed hit fails the gate.
    await page.evaluate(runToken=>{
      window.__TGC_LIVE_CONTACT__=null;
      function observeContact(){
        const d=window.__MAZE_3D__,p=d?.authoredCounterPresentation;
        if(d?.runToken===runToken&&p?.connected&&p.coreVisible&&p.impactVisible){
          window.__TGC_LIVE_CONTACT__={runToken,tick:d.tick,frame:d.frames,
            viewport:{width:innerWidth,height:innerHeight},...p};
          return;
        }
        const snapshot=window.__MAZE_PUBLIC_STATE__;
        if(snapshot?.runToken===runToken&&!snapshot.result)requestAnimationFrame(observeContact);
      }
      requestAnimationFrame(observeContact);
    },token);
    const observed=[];
    for(let previous=-1;previous<200;){
      await page.waitForFunction(({token,previous})=>{
        const s=window.__MAZE_PUBLIC_STATE__;
        return s?.runToken===token&&s.tick>previous;
      },{token,previous},{timeout:15000});
      const sample=await page.evaluate(()=>({snapshot:window.__MAZE_PUBLIC_STATE__,
        renderer:window.__MAZE_3D__?.renderer,renderedTick:window.__MAZE_3D__?.tick,
        capturedAt:new Date().toISOString()}));
      observed.push(sample);previous=sample.snapshot.tick;
      if(sample.snapshot.result)break;
    }
    const response=await page.request.get('http://127.0.0.1:4174/maze/replay');
    const replay=(await response.json()).frames.filter(s=>s.runToken===token);
    const running=replay.filter(s=>s.tick<=24);
    expect([...new Set(running.map(s=>s.tick))]).toEqual(Array.from({length:25},(_,i)=>i));
    expect(observed.at(-1).snapshot.result?.reason).toBe('escape');
    expect(observed.some(s=>s.snapshot.threats.some(t=>t.lanternParried))).toBe(true);
    expect(observed.some(s=>s.snapshot.inventory.length===1)).toBe(true);
    const liveContact=await page.evaluate(()=>window.__TGC_LIVE_CONTACT__);
    expect(liveContact,'real normal-speed browser must visibly connect Pip and Thornback').toBeTruthy();
    expect(liveContact.runToken).toBe(token);
    expect(liveContact.links).toBeGreaterThanOrEqual(1);
    expect(liveContact.links).toBeLessThanOrEqual(3);
    expect(liveContact.lanternOrigin).toHaveLength(3);
    expect(liveContact.guardianContact).toHaveLength(3);
    expect(errors).toEqual([]);
    await page.waitForTimeout(1800);
    await page.screenshot({path:path.join(dir,'court-live-escape-390.png'),fullPage:true});
    await context.close();
    const videoPath=path.join(dir,'court-live-playthrough-390.webm');
    await video.saveAs(videoPath);
    fs.writeFileSync(path.join(dir,'court-live-playthrough-390.json'),JSON.stringify({
      capturedAt:new Date().toISOString(),
      ...sourceIdentity(),
      source:'Actual uninterrupted local host playback, including its ordinary reset; no injected frames, inputs, reset, clock or animation hold',
      viewport:{width:390,height:844},runToken:token,liveContact,videoSha256:sha(videoPath),
      imageSha256:sha(path.join(dir,'court-live-escape-390.png')),observed,replay:running,errors
    },null,2)+'\n');
  }finally{await context.close();}
});
