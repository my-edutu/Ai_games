'use strict';
const {test,expect}=require('@playwright/test');
const {
  DEFAULT_ESCAPE_ROOM_CONFIG,parseEscapeRoomConfig,EscapeRuntime,buildEscapeRenderSnapshot,
}=require('../../dist/games/ai-escape-room/src/index.js');
const base=process.env.ESCAPE_GAUNTLET_BASE_URL||'http://127.0.0.1:4177';

function productionFrames(theme='cipher-vault',seed='gauntlet-vault-reference-v1',depth=8,tail=0){
  const config=parseEscapeRoomConfig({...DEFAULT_ESCAPE_ROOM_CONFIG,theme,difficulty:8,puzzleDepth:depth,objectCount:48,decoyCount:5,hazardCount:2,maxTicks:2400,noProgressTicks:360,intermissionTicks:24});
  const runtime=EscapeRuntime.create({config,seed,runId:'gauntlet-private-browser-fixture',policy:'autonomous'});
  const frames=[buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),runtime.drainEvents())];
  while(runtime.state.lifecycle==='running'&&runtime.state.tick<config.maxTicks){
    const step=runtime.step();frames.push(buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),step.events));
  }
  if(runtime.state.result?.reason!=='escape')throw new Error(`Fixture ${theme}/${seed} did not escape: ${JSON.stringify(runtime.state.result)}`);
  for(let index=0;index<tail;index++){const step=runtime.step();frames.push(buildEscapeRenderSnapshot(runtime.state,runtime.presentationSignals(),step.events));}
  return frames;
}
const frames=productionFrames();
const preExit=frames.find(frame=>frame.progress.permille===1000&&frame.scene!=='result');
const escaped=frames.find(frame=>frame.scene==='result'&&frame.avatar.mode==='celebrating');
const transitionIndex=frames.findIndex((frame,index)=>index>0&&frame.focusObjectId!==frames[index-1].focusObjectId&&frame.events.some(event=>event.type==='puzzle-solved')&&frame.events.at(-1)?.type==='object-revealed');

async function openRoom(page,frame=frames[0],{webgl=true}={}){
  // Keep fixture delivery inside the page. Per-poll protocol interception adds
  // avoidable traffic on a shared SwiftShader runner.
  await page.addInitScript(frame=>{
    const original=window.fetch;
    window.fetch=function(input,...args){
      const url=new URL(typeof input==='string'?input:input.url,location.href);
      if(url.pathname==='/escape-room/state')return Promise.resolve(new Response(JSON.stringify(frame),{status:200,headers:{'content-type':'application/json'}}));
      return original.call(this,input,...args);
    };
  },frame);
  await page.goto(`${base}/escape-room?muted=1&evidence=1&reducedMotion=1`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>Boolean(window.__ESCAPE_PUBLIC_STATE__&&window.__ESCAPE_PRESENT_FRAME__),null,{polling:100});
  if(webgl){
    await page.waitForFunction(()=>window.__ESCAPE_RENDER_DIAGNOSTICS__?.webgl===true,null,{polling:100});
    await page.evaluate(frame=>{
      const setState=window.EscapeRoom3D.prototype.setState;
      window.EscapeRoom3D.prototype.setState=function(state){window.__GAUNTLET_ROOM__=this;return setState.call(this,state);};
      window.__ESCAPE_PRESENT_FRAME__(frame);
      window.__GAUNTLET_ROOM__.setQuality('low');
    },frame);
  }
  return frame;
}
async function present(page,frame){
  await page.evaluate(frame=>window.__ESCAPE_PRESENT_FRAME__(frame),frame);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function actualPose(page){
  return page.evaluate(()=>{
    const room=window.__GAUNTLET_ROOM__;
    return {mode:room.mode,inspectId:room.inspectId,follow:room.followFocus,position:room.camera.position.toArray(),look:room.currentLook.toArray(),target:room.targetCamera.toArray(),authority:window.__ESCAPE_PUBLIC_STATE__.authorityChecksum};
  });
}

test('Follow follows the next real focus even when a reveal follows puzzle-solved in the same tick',async({page})=>{
  expect(transitionIndex).toBeGreaterThan(0);
  const before=frames[transitionIndex-1],after=frames[transitionIndex];
  await openRoom(page,before);
  await page.locator('#follow-button').click();
  await expect(page.locator('#follow-button')).toHaveAttribute('aria-pressed','true');
  expect((await actualPose(page)).inspectId).toBe(before.focusObjectId);
  await present(page,after);
  const pose=await actualPose(page);
  expect(pose.follow).toBe(true);
  expect(pose.inspectId,`focus changed at tick ${after.tick}; events ${after.events.map(event=>event.type).join(', ')}`).toBe(after.focusObjectId);
  expect(pose.authority).toBe(after.authorityChecksum);
});

test('manual inspection, character view and room controls affect only the presentation',async({page})=>{
  await openRoom(page,preExit);
  const checksum=preExit.authorityChecksum;
  await page.locator('#follow-button').click();
  await page.locator('#mechanisms button').first().click();
  await expect(page.locator('#follow-button')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('body')).toHaveAttribute('data-camera-mode','inspect');
  const manual=await actualPose(page);
  expect(manual.inspectId).toBe(await page.locator('#mechanisms button').first().getAttribute('data-object-id'));
  await page.locator('#view-settings summary').click();
  await page.locator('#character-button').click();
  await expect(page.locator('body')).toHaveAttribute('data-camera-mode','character');
  await expect(page.locator('#character-button')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#follow-button')).toHaveAttribute('aria-pressed','false');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const character=await page.evaluate(()=>{
    const room=window.__GAUNTLET_ROOM__,center=room.aiRoot.position.clone().add(new window.THREE.Vector3(0,.2,0));
    const ndc=center.clone().project(room.camera);
    return {distance:room.camera.position.distanceTo(center),ndc:ndc.toArray(),mode:room.mode,checksum:room.state.authorityChecksum};
  });
  expect(character.distance).toBeGreaterThan(1);
  expect(character.distance).toBeLessThan(4);
  expect(Math.abs(character.ndc[0])).toBeLessThan(.75);
  expect(Math.abs(character.ndc[1])).toBeLessThan(.75);
  expect(character.ndc[2]).toBeGreaterThan(-1);
  expect(character.ndc[2]).toBeLessThan(1);
  expect(character.checksum).toBe(checksum);
  await page.keyboard.press('Escape');
  await expect(page.locator('#overview-button')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('body')).toHaveAttribute('data-camera-mode','room');
  expect((await actualPose(page)).authority).toBe(checksum);
});

test('100 percent unlocked is distinct from escape and all twelve mechanisms remain inspectable',async({page})=>{
  const deepest=productionFrames('cipher-vault','gauntlet-complete-mechanism-list',12);
  const ready=deepest.find(frame=>frame.progress.permille===1000&&frame.scene!=='result');
  const result=deepest.at(-1);
  expect(ready).toBeTruthy();expect(result.avatar.mode).toBe('celebrating');
  await openRoom(page,ready);
  await expect(page.locator('#progress-label')).toHaveText('100%');
  await expect(page.locator('#milestone-label')).toHaveText('ALL LOCKS OPEN');
  await expect(page.locator('#ai-intent')).not.toContainText('Escape confirmed');
  await expect(page.locator('#mechanism-count')).toHaveText('12 / 12');
  await expect(page.locator('#mechanisms button')).toHaveCount(12);
  await expect(page.locator('#lock-steps > i')).toHaveCount(12);
  const before=await page.evaluate(()=>{
    const room=window.__GAUNTLET_ROOM__,exit=room.dynamicRoot.children.find(group=>group.userData.exitHinge);
    return {exitAngle:exit.userData.exitHinge.rotation.y,mechanisms:room.dynamicRoot.children.filter(group=>group.userData.mechanismKind).length};
  });
  expect(before.exitAngle).toBeCloseTo(0,3);
  expect(before.mechanisms).toBe(12);
  await present(page,result);
  await expect(page.locator('#milestone-label')).toHaveText('ESCAPE CONFIRMED');
  await expect(page.locator('#ai-intent')).toHaveText('Escape confirmed');
  const after=await page.evaluate(()=>window.__GAUNTLET_ROOM__.dynamicRoot.children.find(group=>group.userData.exitHinge).userData.exitHinge.rotation.y);
  expect(Math.abs(after)).toBeGreaterThan(1);
  await present(page,ready);
  const rewound=await page.evaluate(()=>window.__GAUNTLET_ROOM__.dynamicRoot.children.find(group=>group.userData.exitHinge).userData.exitHinge.rotation.y);
  expect(rewound).toBeCloseTo(0,3);
});

test('a real escape batch returns the Follow camera to the room even when result is the final event',async({page})=>{
  await openRoom(page,preExit);
  await page.locator('#follow-button').click();
  await expect(page.locator('body')).toHaveAttribute('data-camera-mode','inspect');
  expect(escaped.events.some(event=>event.type==='escape')).toBe(true);
  expect(escaped.events.at(-1).type).toBe('result');
  await present(page,escaped);
  await expect(page.locator('body')).toHaveAttribute('data-camera-mode','room');
  expect((await actualPose(page)).authority).toBe(escaped.authorityChecksum);
});

test('WebGL unavailable keeps authoritative snapshots and textual completion alive in the safe scene',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    const native=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,...args){if(String(kind).includes('webgl'))return null;return native.call(this,kind,...args);};
  });
  await openRoom(page,preExit,{webgl:false});
  await expect(page.locator('#safe-scene')).toBeVisible();
  expect(await page.evaluate(()=>window.__ESCAPE_RENDER_DIAGNOSTICS__.webgl)).toBe(false);
  await present(page,escaped);
  expect(await page.evaluate(()=>window.__ESCAPE_PUBLIC_STATE__.authorityChecksum)).toBe(escaped.authorityChecksum);
  await expect(page.locator('#milestone-label')).toHaveText('ESCAPE CONFIRMED');
  await expect(page.locator('#safe-scene')).toBeVisible();
  expect(errors).toEqual([]);
});

test('WebGL geometry, textures and programs stay bounded through replay and theme rebuilds',async({page},testInfo)=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:800,height:600});
  await openRoom(page);
  const rounds=['cipher-vault','clockwork-study','chromatic-lab','archive-zero'].map((theme,index)=>{
    const run=productionFrames(theme,`gauntlet-resource-${index}`);
    return [run[0],run[Math.floor(run.length/2)],run.at(-1)];
  });
  const samples=await page.evaluate(async rounds=>{
    const room=window.__GAUNTLET_ROOM__,samples=[];
    // Render every scripted state through the real frame method exactly once.
    // Pausing its successor RAF prevents redundant continuous software-GPU draws
    // from consuming the stress test's time budget between state transitions.
    cancelAnimationFrame(room.frameRequest);
    const renderStep=async()=>{
      room.frame(performance.now());cancelAnimationFrame(room.frameRequest);
      await new Promise(resolve=>requestAnimationFrame(resolve));
    };
    try{
      for(let cycle=0;cycle<5;cycle++){
        for(const run of rounds)for(const frame of run){
          window.__ESCAPE_PRESENT_FRAME__(frame);await renderStep();
        }
        // Return to one identical public frame so all measurements represent the same visible scene.
        window.__ESCAPE_PRESENT_FRAME__(rounds[0][0]);
        room.highContrast=cycle%2===0;room.rebuildTheme(room.lastTheme);room.setQuality('low');
        await renderStep();
        samples.push({cycle,...room.renderer.info.memory,programs:room.renderer.info.programs.length,cachedGeometry:room.geo.size,sceneryTextures:window.EscapeScenery.textureCount(),groups:room.dynamicRoot.children.length});
      }
    }finally{room.frameRequest=requestAnimationFrame(time=>room.frame(time));}
    return samples;
  },rounds);
  await testInfo.attach('webgl-resource-samples',{body:JSON.stringify(samples,null,2),contentType:'application/json'});
  const warmed=samples[1],last=samples.at(-1);
  expect(last.geometries,JSON.stringify(samples)).toBeLessThanOrEqual(warmed.geometries+2);
  expect(last.textures,JSON.stringify(samples)).toBeLessThanOrEqual(warmed.textures);
  expect(last.programs,JSON.stringify(samples)).toBeLessThanOrEqual(warmed.programs+2);
  expect(last.cachedGeometry).toBe(warmed.cachedGeometry);
  expect(last.sceneryTextures).toBe(warmed.sceneryTextures);
  expect(last.groups).toBe(warmed.groups);
});

test('character view keeps the entire Archivist visible beside real wall mechanisms',async({page},testInfo)=>{
  await openRoom(page);
  for(const surface of ['left-wall','right-wall']){
    const frame=frames.find(frame=>frame.objects.find(object=>object.id===frame.focusObjectId)?.placement.surface===surface);
    expect(frame,`the production run must include ${surface}`).toBeTruthy();
    await present(page,frame);
    await page.locator('#view-settings summary').click();
    await page.locator('#character-button').click();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const framing=await page.evaluate(()=>{
      const room=window.__GAUNTLET_ROOM__,box=new window.THREE.Box3().setFromObject(room.aiRoot),points=[];
      for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new window.THREE.Vector3(x,y,z).project(room.camera).toArray());
      return {points,position:room.camera.position.toArray(),character:room.aiRoot.position.toArray(),focus:room.state.focusObjectId};
    });
    // Freeze the already rendered pose only for the explicit still. Continuous
    // software-GPU draws can starve the compositor screenshot on shared hosts.
    await page.evaluate(()=>cancelAnimationFrame(window.__GAUNTLET_ROOM__.frameRequest));
    try{await page.screenshot({path:testInfo.outputPath(`character-${surface}.png`),fullPage:true});}
    finally{await page.evaluate(()=>{const room=window.__GAUNTLET_ROOM__;room.frameRequest=requestAnimationFrame(time=>room.frame(time));});}
    for(const point of framing.points){
      expect(Math.abs(point[0]),`${surface}: ${JSON.stringify(framing)}`).toBeLessThan(.98);
      expect(Math.abs(point[1]),`${surface}: ${JSON.stringify(framing)}`).toBeLessThan(.98);
      expect(point[2]).toBeGreaterThan(-1);expect(point[2]).toBeLessThan(1);
    }
  }
});

test('replacing animated mechanisms releases GPU instance buffers as well as geometries',async({page},testInfo)=>{
  await page.addInitScript(()=>{
    const counts={created:0,deleted:0},created=new WeakSet(),deleted=new WeakSet();
    window.__GAUNTLET_GL_BUFFERS__=counts;
    for(const proto of [window.WebGLRenderingContext?.prototype,window.WebGL2RenderingContext?.prototype].filter(Boolean)){
      const create=proto.createBuffer,dispose=proto.deleteBuffer;
      proto.createBuffer=function(...args){const value=create.apply(this,args);if(value&&!created.has(value)){created.add(value);counts.created++;}return value;};
      proto.deleteBuffer=function(value){if(value&&created.has(value)&&!deleted.has(value)){deleted.add(value);counts.deleted++;}return dispose.call(this,value);};
    }
  });
  await page.setViewportSize({width:800,height:600});
  await openRoom(page);
  const samples=[];
  for(let cycle=0;cycle<6;cycle++){
    await present(page,escaped);await present(page,frames[0]);
    samples.push(await page.evaluate(()=>{
      const counts=window.__GAUNTLET_GL_BUFFERS__;
      return {...counts,outstanding:counts.created-counts.deleted,geometries:window.__GAUNTLET_ROOM__.renderer.info.memory.geometries};
    }));
  }
  await testInfo.attach('gpu-buffer-samples',{body:JSON.stringify(samples,null,2),contentType:'application/json'});
  expect(samples.at(-1).outstanding,JSON.stringify(samples)).toBeLessThanOrEqual(samples[1].outstanding+1);
});

test('renderer disposal stops callbacks and retires its context while shared assets keep another renderer alive',async({page},testInfo)=>{
  await page.setViewportSize({width:800,height:600});
  await openRoom(page);
  expect(await page.evaluate(()=>typeof window.EscapeRoom3D.prototype.dispose),'renderer lifecycle contract').toBe('function');
  const result=await page.evaluate(async frame=>{
    const main=window.__GAUNTLET_ROOM__,canvas=document.createElement('canvas');
    canvas.width=96;canvas.height=96;canvas.style.cssText='position:fixed;right:0;bottom:0;width:96px;height:96px';document.body.appendChild(canvas);
    const counts={frame:0,pick:0,resize:0,roomView:0,observer:0},registrations=[];
    const eventProto=EventTarget.prototype,nativeAdd=eventProto.addEventListener,nativeRemove=eventProto.removeEventListener,NativeObserver=window.ResizeObserver;
    const capture=options=>typeof options==='boolean'?options:Boolean(options?.capture);
    let constructing=true;
    eventProto.addEventListener=function(type,listener,options){if(constructing&&(this===window||this===canvas))registrations.push({target:this,type,listener,capture:capture(options),active:true});return nativeAdd.call(this,type,listener,options);};
    eventProto.removeEventListener=function(type,listener,options){for(const entry of registrations)if(entry.target===this&&entry.type===type&&entry.listener===listener&&entry.capture===capture(options))entry.active=false;return nativeRemove.call(this,type,listener,options);};
    window.ResizeObserver=class extends NativeObserver{constructor(callback){super((...args)=>{counts.observer++;callback(...args);});}};
    const owned=new window.EscapeRoom3D(canvas,{reducedMotion:true});constructing=false;window.ResizeObserver=NativeObserver;owned.setQuality('low');owned.setState(frame);
    for(const method of ['frame','pick','resize','roomView']){const original=owned[method];owned[method]=function(...args){counts[method]++;return original.apply(this,args);};}
    const resources=room=>{
      const found=new Set();
      room.scene.traverse(node=>{
        if(node.geometry)found.add(node.geometry);
        for(const material of (Array.isArray(node.material)?node.material:[node.material]).filter(Boolean)){
          for(const key of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','alphaMap'])if(material[key])found.add(material[key]);
          if(material.userData.normalMap)found.add(material.userData.normalMap);
        }
      });
      return found;
    };
    const mainResources=resources(main),shared=[...resources(owned)].filter(resource=>mainResources.has(resource));
    let disposedShared=0;const onDispose=()=>disposedShared++;
    for(const resource of shared)resource.addEventListener('dispose',onDispose);
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const before={...counts},drawn=owned.renderer.info.render.calls,gl=owned.renderer.getContext();
    owned.dispose();owned.dispose();const stopped={...counts};
    document.body.appendChild(canvas);canvas.style.width='108px';canvas.style.height='92px';
    canvas.dispatchEvent(new PointerEvent('pointerdown',{clientX:1,clientY:1,bubbles:true}));
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    window.dispatchEvent(new Event('resize'));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    await new Promise(resolve=>setTimeout(resolve,80));
    const after={...counts},retiredContext=gl.isContextLost();
    main.renderer.render(main.scene,main.camera);
    const survivor={contextLost:main.renderer.getContext().isContextLost(),drawCalls:main.renderer.info.render.calls};
    for(const resource of shared)resource.removeEventListener('dispose',onDispose);
    canvas.remove();eventProto.addEventListener=nativeAdd;eventProto.removeEventListener=nativeRemove;
    return {before,stopped,after,drawn,retiredContext,sharedAssets:shared.length,disposedShared,survivor,registeredListeners:registrations.length,remainingListeners:registrations.filter(entry=>entry.active).map(entry=>entry.type)};
  },frames[0]);
  await testInfo.attach('renderer-lifecycle',{body:JSON.stringify(result,null,2),contentType:'application/json'});
  expect(result.before.frame).toBeGreaterThan(0);expect(result.drawn).toBeGreaterThan(0);
  expect(result.after).toEqual(result.stopped);
  expect(result.registeredListeners).toBeGreaterThan(0);expect(result.remainingListeners).toEqual([]);
  expect(result.retiredContext).toBe(true);
  expect(result.sharedAssets).toBeGreaterThan(0);expect(result.disposedShared).toBe(0);
  expect(result.survivor.contextLost).toBe(false);expect(result.survivor.drawCalls).toBeGreaterThan(0);
});


test('a poll that skips the single result frame still shows the confirmed escape during intermission',async({page})=>{
  const lifecycle=productionFrames('cipher-vault','gauntlet-vault-reference-v1',8,3);
  const ready=lifecycle.find(frame=>frame.progress.permille===1000&&frame.scene!=='result'&&frame.scene!=='intermission');
  const intermission=lifecycle.find(frame=>frame.scene==='intermission');
  expect(intermission).toBeTruthy();expect(intermission.events.some(event=>event.type==='escape')).toBe(false);
  await openRoom(page,ready);
  await page.locator('#follow-button').click();
  await expect(page.locator('body')).toHaveAttribute('data-camera-mode','inspect');
  // This is the real server state a slower polling viewer can receive next.
  await present(page,intermission);
  await expect(page.locator('#milestone-label')).toHaveText(/ESCAPE CONFIRMED|CHAMBER CLEARED/);
  await expect(page.locator('body')).toHaveAttribute('data-camera-mode','room');
  const angle=await page.evaluate(()=>window.__GAUNTLET_ROOM__.dynamicRoot.children.find(group=>group.userData.exitHinge).userData.exitHinge.rotation.y);
  expect(Math.abs(angle)).toBeGreaterThan(1);
});
