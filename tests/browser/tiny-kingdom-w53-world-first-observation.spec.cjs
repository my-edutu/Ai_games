'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
// W53 RED-first visual contract. Do not reward a new CSS rule unless the
// live, seeded village stays visible instead of being covered by app bars.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W53 real world-first spectator HUD frees the running village '+viewport.width+'px',async({page})=>{
  test.setTimeout(190000);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:90000});
  const baseline=await page.evaluate(()=>{window.__tinyKingdom.setSpeed(0);return JSON.stringify(window.__tinyKingdom.exportSnapshot())});
  const audit=await page.evaluate(()=>{
   const visible=id=>{const e=document.querySelector(id);if(!e)return null;
    const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
    return {display:cs.display,rect:{x:r.x,y:r.y,width:r.width,height:r.height},
     exposed:cs.display!=='none'&&cs.visibility!=='hidden'&&r.width>0&&r.height>0}};
   const viewport={width:innerWidth,height:innerHeight};
   const layers=['.top','.world-tour','#world-ribbon','.bottom'].map(visible);
   const coverage=layers.filter(x=>x&&x.exposed).reduce((n,x)=>{
    const r=x.rect;
    const w=Math.max(0,Math.min(innerWidth,r.x+r.width)-Math.max(0,r.x));
    const h=Math.max(0,Math.min(innerHeight,r.y+r.height)-Math.max(0,r.y));
    return n+w*h;
   },0)/(innerWidth*innerHeight);
   return {viewport,layers,coverage,
    controls:['#pause','#speed1','#focus','#command-toggle','#world-watch-life']
     .map(visible),
    speed4:visible('#speed4'),worldStory:visible('#world-story'),
    scrollWidth:document.documentElement.scrollWidth};
  });
  expect(audit.coverage).toBeLessThan(viewport.width===390?.30:.25);
  expect(audit.worldStory.exposed).toBe(false);
  expect(audit.speed4.exposed).toBe(false);
  for(const c of audit.controls){expect(c.exposed).toBe(true);expect(c.rect.height).toBeGreaterThanOrEqual(33)}
  expect(audit.scrollWidth).toBeLessThanOrEqual(viewport.width);
  fs.mkdirSync('artifacts/tiny-kingdom-w53',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w53/'+viewport.width+'-world-first-actual.png'});
  await page.getByRole('button',{name:/full command|command desk/i}).first().click();
  await expect(page.locator('body')).toHaveAttribute('data-command','command');
  await expect(page.locator('#save')).toBeVisible();
  await page.locator('#command-toggle').click();
  await expect(page.locator('body')).toHaveAttribute('data-command','world');
  expect(await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()))).toBe(baseline);
  expect(errors).toEqual([]);
  console.log('W53 actual HUD coverage',JSON.stringify({viewport,coverage:audit.coverage}));
 });
}
