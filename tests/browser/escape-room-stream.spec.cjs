'use strict';
const fs=require('node:fs');const path=require('node:path');const{test,expect}=require('@playwright/test');const base='http://127.0.0.1:4177',artifacts=path.resolve(__dirname,'../../artifacts/escape-room-phase3');test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));
const lockKinds=new Set(['sequence-lock','symbol-cipher','shape-order','direction-pattern']);
const mechanicalKinds=new Set(['switch-network','balance-clue']);
const frameEvent=(frame,type)=>frame.events?.some(event=>event.type===type);
const objectFor=(frame,predicate)=>frame.objects?.find(predicate)||null;
async function present(page,frame,{inspectId=null,room=false}={}){await page.evaluate(({frame,inspectId,room})=>{window.__ESCAPE_PRESENT_FRAME__(frame);if(room)window.__ESCAPE_ROOM_VIEW__();else if(inspectId)window.__ESCAPE_INSPECT_OBJECT__(inspectId)}, {frame,inspectId,room});await page.waitForTimeout(360)}

test('escape room desktop broadcast is a physical WebGL room, readable and privacy safe',async({page})=>{
  const failures=[];page.on('console',message=>{if(message.type()==='error')failures.push(message.text())});page.on('pageerror',error=>failures.push(error.message));
  await page.setViewportSize({width:1920,height:1080});await page.goto(`${base}/escape-room`,{waitUntil:'domcontentloaded'});
  const canvas=page.locator('[data-testid="escape-canvas"]');await expect(canvas).toBeVisible();await expect(canvas).toHaveAttribute('data-renderer','webgl-physical-room-v1');
  await expect(page.locator('[data-testid="objective"]')).toContainText(/escape/i);await expect(page.locator('[data-testid="ai-intent"]')).not.toBeEmpty();
  const first=await page.locator('[data-testid="tick"]').textContent();await page.waitForTimeout(700);const second=await page.locator('[data-testid="tick"]').textContent();expect(second).not.toBe(first);
  const state=await page.evaluate(()=>window.__ESCAPE_PUBLIC_STATE__);expect(state).toBeTruthy();expect(state.seed).toBeUndefined();expect(state.runId).toBeUndefined();expect(state.roomSeed).toBeUndefined();expect(JSON.stringify(state)).not.toMatch(/hiddenFact|solution|oracle/i);
  const diagnostics=await page.evaluate(()=>window.__ESCAPE_RENDER_DIAGNOSTICS__);expect(diagnostics.renderer).toBe('webgl-physical-room-v1');expect(diagnostics.webgl).toBe(true);expect(diagnostics.roomSurfaces).toBeGreaterThanOrEqual(5);expect(diagnostics.physicalProps).toBeGreaterThan(10);expect(diagnostics.materialFamilies).toBeGreaterThanOrEqual(5);expect(diagnostics.shadowMode).toBe('contact-proxy');expect(diagnostics.particleCount).toBe(18);expect(diagnostics.fps).toBeGreaterThan(0);fs.writeFileSync(path.join(artifacts,'runtime-diagnostics.json'),JSON.stringify(diagnostics,null,2));
  const layout=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('[data-testid="escape-canvas"]').getBoundingClientRect().toJSON()}));expect(layout.scroll).toBe(layout.viewport);expect(layout.canvas.width).toBeGreaterThan(1300);expect(layout.canvas.height).toBeGreaterThan(650);
  await page.keyboard.press('i');await expect(page.locator('body')).toHaveAttribute('data-camera-mode','inspect');await page.keyboard.press('Escape');await expect(page.locator('body')).toHaveAttribute('data-camera-mode','room');
  await page.screenshot({path:path.join(artifacts,'desktop.png'),fullPage:true});expect(failures).toEqual([]);
});

test('runtime replay produces the required physical-room evidence sequence',async({page})=>{
  test.setTimeout(35000);await page.setViewportSize({width:1920,height:1080});await page.goto(`${base}/escape-room?muted=1&evidence=1`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>Boolean(window.__ESCAPE_PUBLIC_STATE__&&window.__ESCAPE_PRESENT_FRAME__&&window.__ESCAPE_INSPECT_OBJECT__));
  await page.waitForFunction(async()=>{const response=await fetch('/escape-room/replay',{cache:'no-store'});const data=await response.json();return data.frames?.some(frame=>frame.events?.some(event=>event.type==='escape'))},null,{timeout:22000,polling:250});
  const frames=await page.evaluate(async()=>{const response=await fetch('/escape-room/replay',{cache:'no-store'});return (await response.json()).frames});expect(frames.length).toBeGreaterThan(8);
  const escape=frames.find(frame=>frameEvent(frame,'escape'))||frames.find(frame=>frame.scene==='result'&&frame.progress?.permille===1000);expect(escape).toBeTruthy();
  const sameRun=frames.filter(frame=>frame.runToken===escape.runToken);expect(sameRun.length).toBeGreaterThan(5);
  const first=sameRun[0],inspection=sameRun.find(frame=>frame.focusObjectId)||first;
  const clue=sameRun.find(frame=>frameEvent(frame,'clue-discovered'))||sameRun.find(frame=>frame.objects?.some(object=>object.kind==='clue'&&object.inspected))||inspection;
  const lock=sameRun.find(frame=>frame.objects?.some(object=>lockKinds.has(object.mechanismKind)&&(object.inspected||object.solved)))||sameRun.find(frame=>frame.objects?.some(object=>lockKinds.has(object.mechanismKind)))||inspection;
  const item=sameRun.find(frame=>frameEvent(frame,'item-taken')||frameEvent(frame,'items-combined')||frame.inventory?.length>0)||sameRun.find(frame=>frame.objects?.some(object=>object.mechanismKind==='tool-dependency'))||inspection;
  const mechanical=sameRun.find(frame=>frame.objects?.some(object=>mechanicalKinds.has(object.mechanismKind)&&(object.inspected||object.solved)))||sameRun.find(frame=>frame.objects?.some(object=>mechanicalKinds.has(object.mechanismKind)))||inspection;
  const compartment=sameRun.find(frame=>frame.objects?.some(object=>object.solved&&object.mechanismKind))||lock;
  const major=sameRun.find(frame=>frame.progress?.solvedPuzzles>=Math.ceil(frame.progress.totalPuzzles/2))||compartment;
  const finalDoor=sameRun.find(frame=>frame.objects?.some(object=>object.mechanismKind==='final-vault'&&object.solved))||sameRun.find(frame=>frame.objects?.some(object=>object.mechanismKind==='final-vault'))||major;
  const inspectId=frame=>frame.focusObjectId||frame.objects?.find(object=>!object.carried)?.id;
  const clueId=objectFor(clue,object=>object.kind==='clue'&&object.inspected)?.id||objectFor(clue,object=>object.kind==='clue')?.id||inspectId(clue);
  const lockId=objectFor(lock,object=>lockKinds.has(object.mechanismKind))?.id||inspectId(lock);
  const itemId=objectFor(item,object=>object.mechanismKind==='tool-dependency')?.id||objectFor(item,object=>object.kind==='tool')?.id||inspectId(item);
  const mechanicalId=objectFor(mechanical,object=>mechanicalKinds.has(object.mechanismKind))?.id||inspectId(mechanical);
  const compartmentId=objectFor(compartment,object=>object.solved&&object.mechanismKind)?.id||inspectId(compartment);
  const finalId=objectFor(finalDoor,object=>object.mechanismKind==='final-vault')?.id||inspectId(finalDoor);
  const evidence=[['01-room-overview.png',first,null],['02-object-inspection.png',inspection,inspectId(inspection)],['03-clue-discovery.png',clue,clueId],['04-lock-interaction.png',lock,lockId],['05-key-item-use.png',item,itemId],['06-mechanical-puzzle.png',mechanical,mechanicalId],['07-hidden-compartment.png',compartment,compartmentId],['08-major-progression.png',major,null],['09-final-door.png',finalDoor,finalId],['10-successful-escape.png',escape,null]].map(([file,frame,focusObjectId])=>({file,tick:frame.tick,scene:frame.scene,solvedPuzzles:frame.progress.solvedPuzzles,totalPuzzles:frame.progress.totalPuzzles,focusObjectId,eventTypes:frame.events.map(event=>event.type)}));fs.writeFileSync(path.join(artifacts,'evidence-index.json'),JSON.stringify(evidence,null,2));
  await present(page,first,{room:true});await page.screenshot({path:path.join(artifacts,'01-room-overview.png'),fullPage:true});
  await present(page,inspection,{inspectId:inspectId(inspection)});await page.screenshot({path:path.join(artifacts,'02-object-inspection.png'),fullPage:true});
  await present(page,clue,{inspectId:clueId});await page.screenshot({path:path.join(artifacts,'03-clue-discovery.png'),fullPage:true});
  await present(page,lock,{inspectId:lockId});await page.screenshot({path:path.join(artifacts,'04-lock-interaction.png'),fullPage:true});
  await present(page,item,{inspectId:itemId});await page.screenshot({path:path.join(artifacts,'05-key-item-use.png'),fullPage:true});
  await present(page,mechanical,{inspectId:mechanicalId});await page.screenshot({path:path.join(artifacts,'06-mechanical-puzzle.png'),fullPage:true});
  await present(page,compartment,{inspectId:compartmentId});await page.screenshot({path:path.join(artifacts,'07-hidden-compartment.png'),fullPage:true});
  await present(page,major,{room:true});await page.screenshot({path:path.join(artifacts,'08-major-progression.png'),fullPage:true});
  await present(page,finalDoor,{inspectId:finalId});await page.screenshot({path:path.join(artifacts,'09-final-door.png'),fullPage:true});
  await present(page,escape,{room:true});await page.screenshot({path:path.join(artifacts,'10-successful-escape.png'),fullPage:true});
  expect(escape.progress.permille).toBe(1000);expect(frameEvent(escape,'escape')||escape.scene==='result').toBe(true);
});

test('physical puzzle state remains visible with the HUD hidden',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});await page.goto(`${base}/escape-room?cleanFeed=1`,{waitUntil:'domcontentloaded'});await expect(page.locator('[data-testid="hud"]')).toBeHidden();await expect(page.locator('[data-testid="escape-canvas"]')).toBeVisible();
  await page.waitForFunction(()=>window.__ESCAPE_RENDER_DIAGNOSTICS__?.physicalProps>10);const diagnostics=await page.evaluate(()=>window.__ESCAPE_RENDER_DIAGNOSTICS__);expect(diagnostics.visibleClues).toBeGreaterThan(0);expect(diagnostics.visibleMechanisms).toBeGreaterThan(0);expect(diagnostics.exitPresent).toBe(true);await page.screenshot({path:path.join(artifacts,'hud-hidden-room.png'),fullPage:true});
});

test('phone landscape retains room, progress, captions and intent',async({page})=>{await page.setViewportSize({width:844,height:390});await page.goto(`${base}/escape-room`,{waitUntil:'domcontentloaded'});await expect(page.locator('[data-testid="escape-canvas"]')).toBeVisible();await expect(page.locator('[data-testid="progress"]')).toBeVisible();await expect(page.locator('[data-testid="captions"]')).toBeVisible();await expect(page.locator('[data-testid="ai-intent"]')).toBeVisible();const box=await page.locator('[data-testid="escape-canvas"]').boundingBox();expect(box.width).toBeGreaterThan(570);expect(box.height).toBeGreaterThan(280);await page.screenshot({path:path.join(artifacts,'phone-landscape.png'),fullPage:true})});

test('reduced motion, high contrast, mute and clean feed preserve game truth',async({page})=>{await page.setViewportSize({width:1280,height:720});await page.goto(`${base}/escape-room?reducedMotion=1&highContrast=1&muted=1&cleanFeed=1`,{waitUntil:'domcontentloaded'});await expect(page.locator('body')).toHaveAttribute('data-reduced-motion','true');await expect(page.locator('body')).toHaveAttribute('data-high-contrast','true');await expect(page.locator('[data-testid="escape-canvas"]')).toBeVisible();await expect(page.locator('[data-testid="captions"]')).toBeVisible();await expect(page.locator('[data-testid="hud"]')).toBeHidden();await page.screenshot({path:path.join(artifacts,'clean-feed.png'),fullPage:true})});
