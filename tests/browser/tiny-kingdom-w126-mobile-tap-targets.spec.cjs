'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
const OUT=path.join(__dirname,'../../artifacts/tiny-kingdom-w126');
fs.mkdirSync(OUT,{recursive:true});
test.use({video:'on'});

test('W126 390px real populated village, workday and pedestrian controls keep 44px hit areas',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.metrics().citizens>=12,{timeout:45000});
 await page.locator('#pause').click();
 const initial=await page.evaluate(()=>JSON.stringify(window.__tinyKingdom.exportSnapshot()));
 async function inspect(mode){
  const result=await page.evaluate(()=>{
   const controls=document.querySelectorAll(
    '.world-tour .tour-btn,.bottom .btn,#world-watch-life,'+
    '#world-trace-toggle,#street-walk-controls .street-keys button');
   const targets=Array.from(controls).map(button=>{
    const rect=button.getBoundingClientRect(),style=getComputedStyle(button);
    return {id:button.id||button.textContent.trim().slice(0,18),
     height:rect.height,width:rect.width,
     active:rect.width>0&&rect.height>0&&style.visibility!=='hidden'&&style.display!=='none'};
   }).filter(target=>target.active);
   return {targets,overflow:document.documentElement.scrollWidth-innerWidth,
    authority:JSON.stringify(window.__tinyKingdom.exportSnapshot())};
  });
  expect(result.targets.length,mode+' must have real accessible controls').toBeGreaterThan(2);
  expect(result.overflow,mode+' horizontal document overflow').toBe(0);
  for(const target of result.targets){
   expect(target.height,mode+' '+target.id+' too short').toBeGreaterThanOrEqual(44);
   if(mode==='street'&&target.id.startsWith('street-'))
    expect(target.width,mode+' '+target.id+' too narrow').toBeGreaterThanOrEqual(44);
  }
  expect(result.authority,mode+' must not mutate the genuine world').toBe(initial);
  await page.screenshot({path:path.join(OUT,'mobile-'+mode+'-touch.png')});
 }
 await inspect('village');
 // Workday CSS is a presentation mode; this test does not stage actors, fake
 // jobs, tick gameplay or treat the mode switch as evidence of worker activity.
 await page.evaluate(()=>document.body.dataset.workday='live');
 await inspect('workday');
 await page.evaluate(()=>{document.body.dataset.workday='off';
  window.__tinyKingdom.setStreetWalk(true)});
 await inspect('street');
 expect(errors).toEqual([]);
});
