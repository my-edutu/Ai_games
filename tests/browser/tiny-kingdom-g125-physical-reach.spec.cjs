'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
/* G125: actor bone contacts for six real occupations, not scripted workers. */
test('G125 real occupations use bounded two-bone wrist contact without replay changes',async({page})=>{
 test.setTimeout(180000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1024,height:640});
 await page.setContent(html);
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:70000});
 await page.locator('#pause').click();
 const observed=await page.evaluate(()=>{
  const g=window.__tinyKingdom;
  for(let i=0;i<18000;i++){
   const active=g.getActiveWorksites();
   if(new Set(active.map(a=>a.job)).size>=3)break;
   g.step(1/30);
  }
  const before=JSON.stringify(g.exportSnapshot());
  const sites=g.getActiveWorksites();
  const contacts=g.getWorkContactAudit?.();
  const second=g.getWorkContactAudit?.();
  return {sites,contacts,second,readOnly:before===JSON.stringify(g.exportSnapshot())};
 });
 expect(observed.contacts).toBeTruthy();
 expect(observed.contacts).toEqual(observed.second);
 expect(observed.readOnly).toBe(true);
 expect(observed.contacts.length).toBeGreaterThan(0);
 expect(observed.contacts.length).toBe(observed.sites.length);
 for(const contact of observed.contacts){
  expect(contact.source).toBe('actual-autonomous-shift');
  expect(contact.job).toMatch(/farmer|forester|builder|merchant|craftsperson|gatherer/);
  expect(contact.twoBone).toBe(true);
  expect(contact.targetError).toBeLessThan(.04);
  expect(contact.upperArm).toBeGreaterThan(.39);
  expect(contact.upperArm).toBeLessThan(.47);
  expect(contact.forearm).toBeGreaterThan(.38);
  expect(contact.forearm).toBeLessThan(.46);
  expect(contact.working).toBe(true);
  expect(Object.values(contact).filter(x=>typeof x==='number').every(Number.isFinite)).toBe(true);
 }
 await page.setViewportSize({width:390,height:844});
 await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:70000});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.evaluate(()=>document.querySelector('#world').getContext('webgl')?.getError()??0)).toBe(0);
 expect(errors).toEqual([]);
});
