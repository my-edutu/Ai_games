'use strict';
// W397 actual WebGL at two screen sizes; no fake workers or hardware claims.
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W397 real unchanged-world farm market home orbit '+viewport.width,async({page})=>{
  test.setTimeout(270000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:125000});
  const initial=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   return {snap:JSON.stringify(g.exportSnapshot()),people:g.getState().people};
  });
  const first=initial.people[0],far=initial.people.slice().sort((a,b)=>
   Math.hypot(b.x-first.x,b.z-first.z)-Math.hypot(a.x-first.x,a.z-first.z))[0];
  const views=[{focus:[first.x,first.z],yaw:.44,pitch:.42,zoom:9},
   {focus:[-4,-4],yaw:1.1,pitch:.38,zoom:11},
   {focus:[far.x,far.z],yaw:2.1,pitch:.45,zoom:9},
   {focus:[first.x,first.z],yaw:.44,pitch:.42,zoom:9}];
  const target=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w397');
  fs.mkdirSync(target,{recursive:true});const rows=[];
  for(let i=0;i<views.length;i++){
   const n=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
   await page.evaluate(view=>window.__tinyKingdom.setCamera(view),views[i]);
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,n,{timeout:125000});
   const row=await page.evaluate(()=>{
    const g=window.__tinyKingdom,gl=document.getElementById('world').getContext('webgl');
    return {snap:JSON.stringify(g.exportSnapshot()),people:g.metrics().citizens,
     triangle:g.renderStats().lastFrameTriangles,audit:g.getResidentGpuDistrictAudit(),
     glError:gl?.getError()??-1,overflow:document.documentElement.scrollWidth-innerWidth,
     frameProfile:g.getFrameProfile()};
   });
   expect(row.snap).toBe(initial.snap);expect(row.people).toBe(initial.people.length);
   expect(row.triangle).toBeLessThan(160000);expect(row.glError).toBe(0);
   expect(row.overflow).toBeLessThanOrEqual(0);
   expect(row.audit.maxGpuSlotsPerClass).toBe(2);
   for(const kind of ['commuter','working','foreground'])
    expect(row.audit.groups[kind].spareSlots).toBeLessThanOrEqual(1);
   rows.push({...row,snap:'same-authoritative-world'});
   await page.screenshot({path:path.join(target,'w397-'+viewport.width+'-'+i+'.png')});
  }
  fs.writeFileSync(path.join(target,'w397-'+viewport.width+'.json'),
   JSON.stringify({renderer:'SwiftShader software WebGL',viewport,views,rows,
    hardwareFps:'NOT MEASURED',experienceGate:'NOT PROVEN'},null,2));
  expect(errors).toEqual([]);
 });
}
