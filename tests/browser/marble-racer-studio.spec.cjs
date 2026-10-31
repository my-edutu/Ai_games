'use strict';
const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process');
const fs=require('node:fs');const path=require('node:path');
const base='http://127.0.0.1:4318';let server;
const output=path.resolve('artifacts/marble-racer-studio');
test.beforeAll(async()=>{
  fs.mkdirSync(output,{recursive:true});
  server=spawn(process.execPath,['games/marble-survival/scripts/serve-visual-evidence.cjs'],{env:{...process.env,PORT:'4318'},stdio:'ignore'});
  for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  for(const command of ['pause','restart']){
    const r=await fetch(base+'/api/operator',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer visual-evidence-only'},body:JSON.stringify({command,actor:'studio-ci',at:1})});
    if(!r.ok)throw Error('could not freeze actual authority');
  }
});
test.afterAll(()=>server?.kill('SIGTERM'));
test('real studio renders all roles, selects full roster, closes cleanly and preserves authority',async({page})=>{
  test.setTimeout(90000);const failures=[];page.on('pageerror',e=>failures.push(e.message));
  const mutations=[];page.on('request',r=>{if(r.method()!=='GET')mutations.push(r.url());});
  await page.setViewportSize({width:1440,height:900});await page.goto(base);
  await expect(page.locator('.broadcast-shell')).toHaveAttribute('data-renderer','webgl2');
  const before=await (await page.request.get(base+'/api/snapshot')).json();
  await page.getByRole('button',{name:'Explore all racers'}).click();
  const dialog=page.getByRole('dialog',{name:'Racer studio'});
  await expect(dialog).toBeVisible();await expect(page.locator('#studio-roster button')).toHaveCount(32);
  await expect(page.locator('#studio-canvas')).toHaveAttribute('data-renderer','webgl2');
  for(const role of ['navigator','sprinter','bruiser','survivor']){
    const racer=before.marbles.find(m=>m.archetype===role);expect(racer).toBeTruthy();
    await page.locator(`#studio-roster button[data-id="${racer.id}"]`).click();
    await expect(page.locator('#studio-name')).toHaveText(racer.name);
    await expect(page.locator('#studio-canvas')).toHaveAttribute('data-character-id',String(racer.id));
    await expect(page.locator('#studio-canvas')).toHaveAttribute('data-role',role);
    expect(await page.evaluate(()=>document.querySelector('#studio-canvas').getContext('webgl2').getError())).toBe(0);
    await page.screenshot({path:path.join(output,`studio-${role}.png`)});
  }
  const last=before.marbles.at(-1);
  await page.locator(`#studio-roster button[data-id="${last.id}"]`).click();
  await expect(page.locator('#studio-name')).toHaveText(last.name);
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Explore all racers'})).toBeFocused();
  const frames=await page.locator('#studio-canvas').getAttribute('data-frames');
  await page.waitForTimeout(300);expect(await page.locator('#studio-canvas').getAttribute('data-frames')).toBe(frames);
  expect(mutations).toEqual([]);const after=await (await page.request.get(base+'/api/snapshot')).json();expect(after).toEqual(before);
  await page.screenshot({path:path.join(output,'desktop-gameplay.png')});
  expect(failures).toEqual([]);
});
test('mobile HUD leaves the course clear and the studio respects reduced motion',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base);
  await expect(page.locator('.broadcast-shell')).toHaveAttribute('data-renderer','webgl2');
  const bounds=await page.locator('#arena-webgl').boundingBox();
  const panel=await page.locator('.leaderboard-panel').boundingBox();
  expect(bounds.height).toBeGreaterThan(600);expect(panel.height).toBeLessThan(90);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:path.join(output,'mobile-gameplay.png')});
  await page.getByRole('button',{name:'Explore all racers'}).click();
  await expect(page.locator('#studio-canvas')).toHaveAttribute('data-renderer','webgl2');
  const angle=await page.locator('#studio-canvas').getAttribute('data-angle');
  await page.waitForTimeout(300);expect(await page.locator('#studio-canvas').getAttribute('data-angle')).toBe(angle);
  const box=await page.locator('#racer-studio').boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(390);
  await page.screenshot({path:path.join(output,'mobile-studio.png')});
  await page.getByRole('button',{name:'Close racer studio'}).click();
  await page.locator('#mobile-standings-toggle').click();
  await expect(page.locator('#leaderboard li').nth(3)).toBeVisible();
});
