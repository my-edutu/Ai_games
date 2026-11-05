'use strict';
const {test,expect}=require('@playwright/test');

test('read-only endpoints expose live copied state and refuse mutations or traversal',async({request})=>{
  const state=await request.get('/royale/state');expect(state.ok()).toBeTruthy();
  const before=await state.json();expect(before.agents).toHaveLength(12);expect(before.checksum).toMatch(/^[0-9a-f]+$/);
  expect(before.seed).toBeUndefined();expect(before.agents[0].medkits).toBeUndefined();
  const later=await request.get('/royale/health');expect((await later.json()).status).toBe('healthy');
  expect((await request.post('/royale/state',{data:{winner:'sol'}})).status()).toBe(405);
  expect((await request.get('/royale/%2e%2e/package.json')).status()).toBe(404);
  expect((await request.get('/royale/dev/progress.json')).ok()).toBeTruthy();
});

test('real 3D view loads, spectator controls work, and authority keeps advancing',async({page,request})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/royale/?inspect=1&capture=1&quality=low',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.royaleInspection?.metrics.frozen&&window.royaleInspection.metrics.triangles>10000&&window.royaleInspection.metrics.renderedMatch===window.royaleInspection.snapshot?.matchId);
  const before=await request.get('/royale/state').then(r=>r.json());
  expect(await page.evaluate(()=>window.royaleInspection.metrics.triangles)).toBeGreaterThan(10000);
  await page.getByRole('button',{name:'TACTICAL',exact:false}).click();
  await expect(page.locator('[data-camera="tactical"]')).toHaveAttribute('aria-pressed','true');
  const selected=await page.evaluate(()=>window.royaleInspection.snapshot.agents.filter(a=>a.alive).sort((a,b)=>b.hp-a.hp)[0].name);
  await page.getByRole('button',{name:`Observe ${selected}`,exact:true}).click();
  await expect(page.locator('#focus-name')).toHaveText(selected.toUpperCase());
  await expect(page.locator('[data-camera="follow"]')).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Hide interface',exact:true}).click();
  await expect(page.locator('#app')).toHaveClass(/clean/);
  await page.getByRole('button',{name:'SHOW INTERFACE',exact:false}).click();
  await expect(page.locator('#app')).not.toHaveClass(/clean/);
  await page.getByRole('button',{name:'View settings',exact:true}).click();
  await page.getByLabel('Reduced camera motion').check();
  await expect(page.getByLabel('Reduced camera motion')).toBeChecked();
  await page.getByRole('button',{name:'DONE',exact:true}).click();
  const after=await request.get('/royale/state').then(r=>r.json());
  expect(after.matchId>before.matchId||after.tick>before.tick).toBeTruthy();
  expect(errors).toEqual([]);
});

test('phone view preserves match status, focused contender and touch camera controls',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/royale/?inspect=1&capture=1&quality=low',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.royaleInspection?.metrics.frozen&&window.royaleInspection.metrics.triangles>10000&&window.royaleInspection.metrics.renderedMatch===window.royaleInspection.snapshot?.matchId);
  await expect(page.locator('#remaining')).toBeVisible();await expect(page.locator('#focus-name')).toBeVisible();
  await expect(page.locator('#minimap')).toBeVisible();
  for(const selector of ['.match-status','.map-panel','.focus-card','.camera-controls']){
    const b=await page.locator(selector).boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(391);expect(b.y+b.height).toBeLessThanOrEqual(845);
  }
  const storm=await page.locator('.storm-status').boundingBox(),map=await page.locator('.map-panel').boundingBox();
  expect(storm.x+storm.width).toBeLessThanOrEqual(map.x);
  const framing=await page.evaluate(()=>{
    const view=window.royaleInspection;
    const name=document.getElementById('focus-name').textContent;
    const agent=view.snapshot.agents.find(a=>a.name.toUpperCase()===name);
    const actor=view.scene.getObjectByName(`combatant-${agent.id}`);
    const foot=actor.getWorldPosition(view.camera.position.clone()).project(view.camera);
    return {footX:(foot.x+1)*innerWidth/2,footY:(1-foot.y)*innerHeight/2,cardY:document.querySelector('.focus-card').getBoundingClientRect().y};
  });
  expect(framing.footY).toBeLessThan(framing.cardY-6);
  expect(framing.footX).toBeGreaterThan(32);expect(framing.footX).toBeLessThan(358);
  await page.getByRole('button',{name:'Observe next contender',exact:true}).click();
  await expect(page.locator('[data-camera="follow"]')).toHaveAttribute('aria-pressed','true');
});

test('development page displays actual progress separately from game UI',async({page})=>{
  await page.goto('/royale/dev/');
  await expect(page.locator('#status')).not.toHaveText('Loading progress…');
  await expect(page.locator('#gaps li')).not.toHaveCount(0);
  await expect(page.getByRole('link',{name:'OPEN LIVE GAME',exact:false})).toHaveAttribute('href','/royale/');
  await expect(page.locator('canvas')).toHaveCount(0);
});
