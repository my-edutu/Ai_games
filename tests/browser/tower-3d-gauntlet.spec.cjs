'use strict';
const fs=require('node:fs'),path=require('node:path');
const {test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4176';
const artifacts=path.resolve(__dirname,'../../artifacts/tower-phase3');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));
// On any browser failure, preserve the actual renderer boot/fallback reason,
// console diagnostics, module loading failures and a screenshot for the next loop.
// This is evidence collection, not a claim that WebGL rendered successfully.
test.beforeEach(async({page})=>{
  const diagnostics=[];
  page.on('pageerror',error=>diagnostics.push({kind:'pageerror',message:error.message,stack:error.stack?.slice(0,2500)}));
  page.on('console',message=>{if(message.type()==='error'||message.type()==='warning')diagnostics.push({kind:'console',level:message.type(),message:message.text().slice(0,1200)})});
  page.on('requestfailed',request=>diagnostics.push({kind:'requestfailed',url:request.url(),failure:request.failure()}));
  page.on('response',response=>{if(response.status()>=400&&response.url().includes('/tower/'))diagnostics.push({kind:'http',url:response.url(),status:response.status()})});
  page.__towerDiagnostics=diagnostics;
});
test.afterEach(async({page},testInfo)=>{
  if(testInfo.status===testInfo.expectedStatus)return;
  let runtime=null;
  try{runtime=await page.evaluate(()=>({
    href:location.href,
    renderer:document.body.dataset.towerRenderer,
    active:window.__TOWER_3D_ACTIVE__,
    bootError:window.__TOWER_3D_BOOT_ERROR__,
    diagnostics:window.__TOWER_3D_DIAGNOSTICS__,
    snapshotTick:window.__TOWER_PUBLIC_STATE__?.tick
  }))}catch(error){runtime={evaluationError:String(error)}}
  const record={test:testInfo.title,status:testInfo.status,expectedStatus:testInfo.expectedStatus,runtime,events:page.__towerDiagnostics||[]};
  const report=JSON.stringify(record,null,2);
  fs.writeFileSync(path.join(artifacts,'failure-'+testInfo.testId.replace(/[^a-z0-9_-]/gi,'_').slice(0,100)+'.json'),report);
  await testInfo.attach('tower-renderer-failure.json',{body:Buffer.from(report),contentType:'application/json'});
  try{await page.screenshot({path:testInfo.outputPath('tower-renderer-failure.png'),fullPage:true,timeout:7000})}catch{}
});

test('3D tower uses real snapshot geometry and keeps autonomous simulation authoritative',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/tower',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.publicChecksum)).toBeTruthy();
  const canWebGL=await page.evaluate(()=>{
    try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'))}catch{return false}
  });
  if(canWebGL){
    await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_ACTIVE__),{timeout:20000}).toBe(true);
    await expect(page.locator('#tower-3d-canvas')).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.drawCalls||0),{timeout:20000}).toBeGreaterThan(10);
    await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.triangles||0),{timeout:20000}).toBeGreaterThan(100);
    await expect(page.locator('body')).toHaveAttribute('data-tower-renderer','three-dimensional');
  }else{
    await expect.poll(()=>page.evaluate(()=>document.body.dataset.towerRenderer),{timeout:15000}).toBe('2d-fallback');
  }
  const one=await page.locator('[data-testid="tick"]').textContent();
  await page.waitForTimeout(450);
  const two=await page.locator('[data-testid="tick"]').textContent();
  expect(two).not.toEqual(one);
  const state=await page.evaluate(()=>window.__TOWER_PUBLIC_STATE__);
  expect(state.seed).toBeUndefined();
  expect(state.runId).toBeUndefined();
  await page.screenshot({path:path.join(artifacts,'gauntlet-3d-desktop.png'),fullPage:true});
  expect(errors).toEqual([]);
});

test('original renderer is available as a side-by-side visual regression baseline',async({page})=>{
  await page.goto(base+'/tower?renderer=2d&cleanFeed=1');
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.tick)).toBeGreaterThan(0);
  await expect(page.locator('body')).toHaveAttribute('data-tower-renderer','2d-reference');
  await expect(page.locator('#tower-3d-canvas')).toHaveCount(0);
  await page.screenshot({path:path.join(artifacts,'gauntlet-2d-reference.png'),fullPage:true});
});

test('gauntlet progress and blinded comparison page expose honest status',async({page})=>{
  await page.goto(base+'/tower/gauntlet');
  await expect(page.getByRole('heading',{name:/3D GAUNTLET/})).toBeVisible();
  await expect.poll(async()=>Number(await page.locator('#round').textContent())).toBeGreaterThanOrEqual(1);
  await expect(page.locator('#views iframe')).toHaveCount(2);
  await expect(page.locator('#label-a')).toContainText('HIDDEN');
  await page.getByRole('button',{name:'REVEAL VERSIONS'}).click();
  const labels=(await page.locator('.tag').allTextContents()).join(' ');
  expect(labels).toContain('ORIGINAL 2D');
  expect(labels).toContain('NEW 3D');
  await expect(page.locator('#status')).toContainText(/pending|awaiting|not yet|not done/i);
});

test('articulated hero close-up proves mesh detail and independently capturable pose',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+'/tower?camera=hero&cleanFeed=1',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_ACTIVE__),{timeout:20000}).toBe(true);
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.heroParts||0),{timeout:20000}).toBeGreaterThan(70);
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.drawCalls||0),{timeout:20000}).toBeGreaterThan(80);
  const status=await page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__);
  expect(status.heroCamera).toBe(true);
  expect(status.drawCalls).toBeLessThan(1400);
  await page.screenshot({path:path.join(artifacts,'gauntlet-3d-hero.png'),fullPage:true});
});

test('2D fallback projects floor-relative game entities after ascending',async({page})=>{
  await page.setViewportSize({width:1280,height:720});
  await page.goto(base+'/tower?renderer=2d&cleanFeed=1');
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.floor||0),{timeout:25000}).toBeGreaterThanOrEqual(1);
  await page.waitForTimeout(200);
  const visible=await page.evaluate(()=>{
    const canvas=document.getElementById('tower-canvas'),ctx=canvas.getContext('2d'),{data,width,height}=ctx.getImageData(0,0,canvas.width,canvas.height);
    let details=0;
    for(let y=0;y<height;y+=5)for(let x=0;x<width;x+=5){
      const p=(y*width+x)*4;
      if(data[p]>65&&data[p+1]>75&&data[p+2]>100)details++;
    }
    return details;
  });
  expect(visible).toBeGreaterThan(60);
  await page.screenshot({path:path.join(artifacts,'gauntlet-2d-higher-floor.png'),fullPage:true});
});

test('low-power accessible 3D maintains scene and exposes measured frame pacing',async({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.goto(base+'/tower?quality=low&highContrast=1&reducedMotion=1&cleanFeed=1');
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.sampledFrames||0),{timeout:25000}).toBeGreaterThan(55);
  const d=await page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__);
  expect(d.highContrast).toBe(true);
  expect(d.pixelRatio).toBeLessThanOrEqual(1);
  expect(d.averageFps).toBeGreaterThan(0);
  expect(d.drawCalls).toBeGreaterThan(50);
  await page.screenshot({path:path.join(artifacts,'gauntlet-3d-mobile-accessible.png'),fullPage:true});
});

test('visual edition v4 removes the sidebar dashboard and makes the game a full-viewport stage',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/tower',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>document.body.dataset.towerTheme),{timeout:20000}).toMatch(/^(foundry|ruins|storm|clockwork|void)$/);
  await expect(page.locator('#world-title')).not.toBeEmpty();
  await expect(page.locator('.world-label')).toBeVisible();
  const layout=await page.evaluate(()=>{
    const area=document.querySelector('.arena-wrap').getBoundingClientRect();
    const side=document.querySelector('.side').getBoundingClientRect();
    const style=getComputedStyle(document.querySelector('.top'));
    return{arenaWidth:area.width,arenaHeight:area.height,sidebarWidth:side.width,headerPosition:style.position,accent:getComputedStyle(document.body).getPropertyValue('--honey').trim()};
  });
  expect(layout.arenaWidth).toBeGreaterThan(1590);
  expect(layout.arenaHeight).toBeGreaterThan(890);
  expect(layout.sidebarWidth).toBeLessThan(260);
  expect(layout.headerPosition).toBe('absolute');
  expect(layout.accent).toMatch(/^#/);
  await expect(page.locator('body')).toHaveAttribute('data-tower-theme',/foundry|ruins|storm|clockwork|void/);
  await page.screenshot({path:path.join(artifacts,'gauntlet-visual-v4-desktop.png'),fullPage:true});
});

test('visual edition v4 retains readable mobile layout and uncluttered clean feed',async({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.goto(base+'/tower',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.tick||0)).toBeGreaterThan(5);
  await expect(page.locator('.world-label')).toBeVisible();
  await expect(page.locator('[data-testid="captions"]')).toBeVisible();
  await expect(page.locator('[data-testid="floor"]')).toBeVisible();
  const geometry=await page.locator('.arena-wrap').boundingBox();
  expect(geometry.width).toBeGreaterThanOrEqual(840);
  expect(geometry.height).toBeGreaterThanOrEqual(385);
  await page.screenshot({path:path.join(artifacts,'gauntlet-visual-v4-mobile.png'),fullPage:true});
  await page.goto(base+'/tower?cleanFeed=1');
  await expect(page.locator('.world-label')).toBeHidden();
  await expect(page.locator('[data-testid="hud"]')).toBeHidden();
});

test('a critic can record the largest remaining visual gap without making a false AAA claim',async({page})=>{
  await page.goto(base+'/tower/gauntlet');
  await expect(page.getByRole('heading',{name:'Jusant quality gate'})).toBeVisible();
  const reference=page.getByRole('link',{name:/INSPECT OFFICIAL JUSANT/});
  await expect(reference).toHaveAttribute('href','https://dont-nod.com/en/games/jusant/');
  await page.locator('[name="environment"]').fill('4');
  await page.locator('#critic-gap').fill('Architectural silhouettes still repeat too obviously; diversify the near, mid, and far layers in comparable reference-camera captures.');
  await page.getByRole('button',{name:'SAVE LOCAL REVIEW'}).click();
  await expect(page.locator('#review-state')).toContainText('saved');
  await page.reload();
  await expect(page.locator('#critic-gap')).toHaveValue(/Architectural silhouettes/);
  await expect(page.locator('[name="environment"]')).toHaveValue('4');
});

test('cinematic 3D uses perspective and renders bespoke landmark geometry from live floor snapshots',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/tower?cleanFeed=1',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.lens),{timeout:30000}).toBe('perspective');
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.biomeLandmarks||0),{timeout:30000}).toBeGreaterThan(10);
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.triangles||0),{timeout:30000}).toBeGreaterThan(500);
  const lens=await page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__);
  expect(lens.drawCalls).toBeLessThan(1400);
  await page.screenshot({path:path.join(artifacts,'gauntlet-perspective-kinetic-biome.png'),fullPage:true});
});
test('visual critics can inspect all four actual 3D character models in the same live scene',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/tower?inspect=characters&cleanFeed=1',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.inspectionModels),{timeout:30000}).toBe(4);
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.drawCalls||0),{timeout:30000}).toBeGreaterThan(80);
  expect(await page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__.lens)).toBe('perspective');
  await expect(page.locator('[data-testid="hud"]')).toBeHidden();
  await page.screenshot({path:path.join(artifacts,'gauntlet-character-lineup.png'),fullPage:true});
});
test('v5 HUD displays real character and danger states while cleanFeed remains unencumbered',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/tower',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.tick||0),{timeout:20000}).toBeGreaterThan(5);
  await expect(page.locator('.hero-identity')).toBeVisible();
  await expect(page.locator('#hero-state')).not.toBeEmpty();
  const scene=await page.locator('body').getAttribute('data-tower-scene');
  expect(['normal','guardian','danger','result','upgrade','intermission','recovery']).toContain(scene);
  await page.screenshot({path:path.join(artifacts,'gauntlet-hero-v5-hud.png'),fullPage:true});
  await page.goto(base+'/tower?cleanFeed=1');
  await expect(page.locator('.hero-identity')).toBeHidden();
  await expect(page.locator('.stage-signal')).toBeHidden();
});
test('Visual VIII loads a single polished biome-responsive stylesheet without competing old layers',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  const failures=[];page.on('pageerror',e=>failures.push(e.message));
  await page.goto(base+'/tower',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>document.body.dataset.towerTheme),{timeout:20000}).toMatch(/^(foundry|ruins|storm|clockwork|void)$/);
  const sheets=await page.locator('link[rel="stylesheet"]').evaluateAll(nodes=>nodes.map(node=>new URL(node.href).pathname));
  expect(sheets.filter(x=>/visual-v\d+\.css/.test(x))).toEqual(['/tower/visual-v8.css']);
  const colors=await page.evaluate(()=>({
    accent:getComputedStyle(document.body).getPropertyValue('--tower-accent').trim(),
    glass:getComputedStyle(document.querySelector('.vital-panel')).backgroundImage,
    hero:getComputedStyle(document.querySelector('.hero-identity')).display
  }));
  expect(colors.accent).toMatch(/^#[0-9a-f]{6}$/i);
  expect(colors.glass).toContain('gradient');
  expect(colors.hero).not.toBe('none');
  expect(failures).toEqual([]);
  await page.screenshot({path:path.join(artifacts,'gauntlet-visual-v8-immersive.png'),fullPage:true});
});

test('environmental atmosphere renderer provides bounded real geometry and measured bright lighting',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(base+'/tower?cleanFeed=1',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.atmosphere?.dustPoints||0),{timeout:30000}).toBeGreaterThan(70);
  const d=await page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__);
  expect(d.atmosphere.volumeLights).toBeGreaterThan(0);
  expect(d.atmosphere.curtains).toBe(4);
  expect(d.atmosphere.dustPoints).toBeLessThanOrEqual(180);
  expect(d.lens).toBe('perspective');
  expect(d.drawCalls).toBeGreaterThan(10);
  await page.screenshot({path:path.join(artifacts,'gauntlet-v8-atmosphere-cleanfeed.png'),fullPage:true});
});

test('WebGL context loss returns uninterrupted authority feed to legacy 2D renderer',async({page})=>{
  await page.goto(base+'/tower',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_ACTIVE__),{timeout:25000}).toBe(true);
  const before=Number(await page.locator('[data-testid="tick"]').textContent());
  await page.locator('#tower-3d-canvas').evaluate(canvas=>
    canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}))
  );
  await expect.poll(()=>page.evaluate(()=>document.body.dataset.towerRenderer),{timeout:15000}).toBe('2d-fallback');
  await expect(page.locator('#tower-3d-canvas')).toHaveCount(0);
  await expect.poll(async()=>Number(await page.locator('[data-testid="tick"]').textContent()),{timeout:15000}).toBeGreaterThan(before);
  await expect(page.locator('[data-testid="tower-canvas"]')).toBeVisible();
});
test('Wayfinder production sculpt exposes layered geometry on moving skeletal joints',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/tower?camera=hero&cleanFeed=1',{waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__?.renderedFrames||0),{timeout:30000}).toBeGreaterThan(4);
  const data=await page.evaluate(()=>window.__TOWER_3D_DIAGNOSTICS__);
  expect(data.heroSculpt?.role).toBe('wayfinder');
  expect(data.heroSculpt?.riggedAttachments).toBe(true);
  expect(data.heroSculpt?.cosmeticMeshes).toBeGreaterThan(90);
  expect(data.heroSculpt?.realContactAuthority).toBe(false);
  expect(data.heroParts).toBeGreaterThan(160);
  expect(errors).toEqual([]);
  await page.screenshot({path:path.join(artifacts,'gauntlet-sculpted-wayfinder-v13.png'),fullPage:true});
});

test('3D module unavailable degrades safely to the existing 2D scene',async({page})=>{
  await page.route('**/tower/scene3d.js',route=>route.fulfill({status:503,body:'Module unavailable'}));
  await page.goto(base+'/tower');
  await expect.poll(()=>page.evaluate(()=>document.body.dataset.towerRenderer),{timeout:12000}).toBe('2d-fallback');
  await expect.poll(()=>page.evaluate(()=>window.__TOWER_PUBLIC_STATE__?.tick),{timeout:15000}).toBeGreaterThan(4);
  await expect(page.locator('[data-testid="tower-canvas"]')).toBeVisible();
});
