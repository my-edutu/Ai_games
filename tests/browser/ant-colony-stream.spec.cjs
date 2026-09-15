'use strict';
const fs=require('node:fs');
const path=require('node:path');
const{test,expect}=require('@playwright/test');
const base='http://127.0.0.1:4175';
const artifacts=path.resolve(__dirname,'../../artifacts/ant-phase3');
test.beforeAll(()=>fs.mkdirSync(artifacts,{recursive:true}));

async function advanceTo(page,target,ticks=1500){
  const response=await page.request.post(`${base}/ant/evidence/advance`,{data:{ticks,until:target}});
  expect(response.ok()).toBeTruthy();
  const body=await response.json();
  expect(body.ok).toBe(true);
  expect(body.target).toBe(target);
  expect(body.matched).toBe(true);
  const wanted=body.snapshot;
  await page.waitForFunction(({runIndex,tick})=>{
    const current=window.__ANT_PUBLIC_STATE__;
    return current&&(current.runIndex>runIndex||(current.runIndex===runIndex&&current.tick>=tick));
  },{runIndex:wanted.runIndex,tick:wanted.tick},{timeout:5000});
  await page.waitForTimeout(100);
  return wanted;
}

test('ant colony desktop broadcast is animated, readable and privacy safe',async({page})=>{
  const failures=[];
  page.on('console',message=>{if(message.type()==='error')failures.push(message.text())});
  page.on('pageerror',error=>failures.push(error.message));
  await page.setViewportSize({width:1920,height:1080});
  await page.goto(`${base}/ant`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-testid="ant-canvas"]')).toBeVisible();
  await expect(page.locator('[data-testid="objective"]')).toContainText(/ascension/i);
  await expect(page.locator('[data-testid="ai-intent"]')).not.toBeEmpty();
  const first=await page.locator('[data-testid="tick"]').textContent();
  await page.waitForTimeout(700);
  const second=await page.locator('[data-testid="tick"]').textContent();
  expect(second).not.toBe(first);
  const state=await page.evaluate(()=>window.__ANT_PUBLIC_STATE__);
  expect(state).toBeTruthy();
  expect(state.seed).toBeUndefined();
  expect(state.config).toBeUndefined();
  expect(state.influence).toBeUndefined();
  expect(JSON.stringify(state)).not.toContain('appliedIds');
  expect(JSON.stringify(state)).not.toContain('lastCell');
  const layout=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,canvas:document.querySelector('[data-testid="ant-canvas"]').getBoundingClientRect().toJSON()}));
  expect(layout.scroll).toBe(layout.viewport);
  expect(layout.canvas.width).toBeGreaterThan(900);
  expect(layout.canvas.height).toBeGreaterThan(700);
  await page.screenshot({path:path.join(artifacts,'desktop.png'),fullPage:true});
  expect(failures).toEqual([]);
});

test('phone landscape retains the colony, primary progress and captions',async({page})=>{
  await page.setViewportSize({width:640,height:360});
  await page.goto(`${base}/ant?muted=1`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-testid="ant-canvas"]')).toBeVisible();
  await expect(page.locator('[data-testid="objective"]')).toBeVisible();
  await expect(page.locator('[data-testid="captions"]')).toBeVisible();
  const box=await page.locator('[data-testid="ant-canvas"]').boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(400);
  expect(box.height).toBeGreaterThan(250);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBe(0);
  await page.screenshot({path:path.join(artifacts,'phone-landscape.png'),fullPage:true});
});

test('clean feed, high contrast and reduced motion preserve the game view while controls stay private',async({page})=>{
  await page.setViewportSize({width:1280,height:720});
  await page.goto(`${base}/ant?reducedMotion=1&highContrast=1&muted=1&cleanFeed=1`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('body')).toHaveAttribute('data-reduced-motion','true');
  await expect(page.locator('body')).toHaveAttribute('data-high-contrast','true');
  await expect(page.locator('[data-testid="ant-canvas"]')).toBeVisible();
  await expect(page.locator('[data-testid="hud"]')).toBeHidden();
  await expect(page.locator('#operator-panel')).toBeHidden();
  const box=await page.locator('[data-testid="ant-canvas"]').boundingBox();
  expect(Math.round(box.width)).toBe(1280);
  expect(Math.round(box.height)).toBe(720);
  await page.screenshot({path:path.join(artifacts,'clean-feed.png'),fullPage:true});
  await page.goto(`${base}/ant?controls=1&muted=1`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('#operator-panel')).toBeVisible();
});

test('render budgets remain bounded and browser frame evidence is recorded',async({page})=>{
  await page.setViewportSize({width:1280,height:720});
  await page.goto(`${base}/ant?muted=1`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-testid="ant-canvas"]')).toBeVisible();
  await page.waitForTimeout(2400);
  const evidence=await page.evaluate(()=>{
    const metrics=window.__ANT_RENDER_METRICS__||{};
    const samples=Array.isArray(metrics.frameSamples)?metrics.frameSamples.filter(value=>Number.isFinite(value)&&value>=0):[];
    const sorted=[...samples].sort((a,b)=>a-b);
    const mean=samples.length?samples.reduce((sum,value)=>sum+value,0)/samples.length:null;
    const percentile=q=>sorted.length?sorted[Math.min(sorted.length-1,Math.floor((sorted.length-1)*q))]:null;
    return{
      capturedAt:new Date().toISOString(),samples:samples.length,meanFrameMs:mean,p50FrameMs:percentile(.5),p95FrameMs:percentile(.95),
      webgl:Boolean(metrics.webgl),dpr:metrics.dpr,drawCalls:metrics.drawCalls,entityCount:metrics.entityCount,motionHistory:metrics.motionHistory,
      activeParticles:metrics.activeParticles,organicPresentation:Boolean(metrics.organicPresentation),organicConnections:metrics.organicConnections,
      organicChambers:metrics.organicChambers,surfaceStems:metrics.surfaceStems,foregroundRoots:metrics.foregroundRoots,lastShot:metrics.lastShot||metrics.cinematicShot||null
    };
  });
  expect(evidence.samples).toBeGreaterThan(30);
  expect(evidence.meanFrameMs).not.toBeNull();
  expect(evidence.meanFrameMs).toBeLessThan(80);
  expect(evidence.dpr).toBeLessThanOrEqual(2);
  expect(evidence.motionHistory).toBeLessThanOrEqual(720);
  expect(evidence.activeParticles).toBeLessThanOrEqual(240);
  expect(evidence.organicPresentation).toBe(true);
  expect(evidence.organicConnections).toBeLessThanOrEqual(520);
  expect(evidence.organicChambers).toBeLessThanOrEqual(72);
  expect(evidence.surfaceStems).toBe(64);
  expect(evidence.foregroundRoots).toBe(16);
  fs.writeFileSync(path.join(artifacts,'performance.json'),`${JSON.stringify(evidence,null,2)}\n`);
});

test('authoritative ecosystem states generate scenario-specific visual evidence',async({page})=>{
  await page.setViewportSize({width:1600,height:900});
  await page.goto(`${base}/ant?muted=1`,{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-testid="ant-canvas"]')).toBeVisible();
  const manifest=[];
  const capture=async(target,file,ticks)=>{
    const snapshot=await advanceTo(page,target,ticks);
    manifest.push({target,file,runIndex:snapshot.runIndex,tick:snapshot.tick,scene:snapshot.scene,weather:snapshot.environment.weather,season:snapshot.environment.season,brood:snapshot.colony.brood,predators:snapshot.predators.length,fighters:snapshot.ants.filter(ant=>ant.task==='fight').length,carriers:snapshot.ants.filter(ant=>ant.carryingFood>0).length,diggers:snapshot.ants.filter(ant=>ant.task==='dig').length});
    await page.screenshot({path:path.join(artifacts,file),fullPage:true});
  };
  await capture('milestone','milestone.png',1400);
  await capture('brood','queen-brood.png',900);
  await capture('foraging','foraging.png',900);
  await capture('excavation','excavation.png',900);
  await capture('predator','predator.png',1600);
  await capture('combat','combat.png',1400);
  await capture('night','day-night.png',700);
  await capture('weather','weather-season.png',1800);
  fs.writeFileSync(path.join(artifacts,'scenario-manifest.json'),`${JSON.stringify(manifest,null,2)}\n`);
});
