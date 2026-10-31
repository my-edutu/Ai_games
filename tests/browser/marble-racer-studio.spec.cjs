'use strict';
const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process');
const fs=require('node:fs');const path=require('node:path');
const base='http://127.0.0.1:4318';let server;
const output=path.resolve('artifacts/marble-racer-studio');
test.use({video:{mode:'on',size:{width:960,height:600}}});
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
  const initialAngle=await page.locator('#studio-canvas').getAttribute('data-angle');
  await expect.poll(()=>page.locator('#studio-canvas').getAttribute('data-angle')).not.toBe(initialAngle);
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
  await page.locator('#leaderboard .inspect-marble').first().click();
  const dossierNumber=Number(await page.locator('#spotlight-number').textContent());
  await page.locator('#spotlight-studio').click();
  await expect(page.locator('#studio-roster button[aria-pressed="true"] b')).toHaveText(String(dossierNumber).padStart(2,'0'));
  const active=page.locator('#studio-roster button[aria-pressed="true"]');await active.focus();
  await page.keyboard.press('End');await expect(page.locator('#studio-roster button').last()).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Home');await expect(page.locator('#studio-roster button').first()).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('Escape');await expect(page.locator('#spotlight-studio')).toBeFocused();
  await page.locator('#spotlight-close').click();
  expect(mutations).toEqual([]);const after=await (await page.request.get(base+'/api/snapshot')).json();expect(after).toEqual(before);
  await page.screenshot({path:path.join(output,'desktop-gameplay.png')});
  expect(failures).toEqual([]);
});
test('mobile HUD leaves the course clear and the studio respects reduced motion',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base);
  await expect(page.locator('.broadcast-shell')).toHaveAttribute('data-renderer','webgl2');
  const bounds=await page.locator('#arena-webgl').boundingBox();
  const panel=await page.locator('.leaderboard-panel').boundingBox();
  expect((await page.locator('.tournament-strip').boundingBox()).height).toBeLessThanOrEqual(64);
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

test('studio handles native graphics loss and an unavailable portrait without inventing data',async({page})=>{
  test.setTimeout(90000);
  await page.setViewportSize({width:1280,height:800});await page.goto(base);
  await expect(page.locator('.broadcast-shell')).toHaveAttribute('data-renderer','webgl2');
  await page.getByRole('button',{name:'Explore all racers'}).click();
  await expect(page.locator('#studio-canvas')).toHaveAttribute('data-renderer','webgl2');
  await page.evaluate(()=>{
    const canvas=document.getElementById('studio-canvas');
    const extension=canvas.getContext('webgl2').getExtension('WEBGL_lose_context');
    if(!extension)throw Error('Native context-loss extension unavailable');
    window.studioContextLossTest=extension;extension.loseContext();
  });
  await expect(page.locator('#studio-fallback')).toContainText('interrupted');
  await expect(page.locator('#studio-roster button')).toHaveCount(32);
  await page.evaluate(()=>window.studioContextLossTest.restoreContext());
  await expect(page.locator('#studio-canvas')).toBeVisible();
  await expect(page.locator('#studio-canvas')).toHaveAttribute('data-renderer','webgl2');
  expect(await page.evaluate(()=>document.getElementById('studio-canvas').getContext('webgl2').getError())).toBe(0);
  await page.keyboard.press('Escape');
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){
      return this.id==='studio-canvas'&&type==='webgl2'?null:original.call(this,type,...args);
    };
  });
  await page.reload();await expect(page.locator('.broadcast-shell')).toHaveAttribute('data-renderer','webgl2');
  await page.getByRole('button',{name:'Explore all racers'}).click();
  await expect(page.locator('#studio-fallback')).toContainText('unavailable');
  await expect(page.locator('#studio-canvas')).not.toBeVisible();
  await expect(page.locator('#studio-roster button')).toHaveCount(32);
});
