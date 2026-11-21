'use strict';
// W518: capture the ACTUAL rooted fields at human scale, then the same
// uninterrupted seeded world after 120 days. No staged citizens, food or plots.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,
 '../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W518 genuine farm standing-grain and grown-town evidence '+viewport.width,
 async({page},info)=>{
  test.setTimeout(420000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:125000});
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
   g.setCamera({focus:[23.0,1.0],yaw:.82,pitch:.59,zoom:12.8});
  });
  async function picture(label){
   const n=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
    n,{timeout:125000});
   const state=await page.evaluate(()=>{
    const g=window.__tinyKingdom,canvas=document.getElementById('world');
    return {source:'original-live-game',sourceSha:null,
     day:g.metrics().day,people:g.metrics().citizens,
     buildings:g.metrics().buildings,checksum:g.exportSnapshot().checksum,
     canopy:g.getFarmFieldResidencyAudit().grainCanopy,
     field:g.getFarmFieldResidencyAudit(),scene:g.renderStats(),
     integrity:g.getGeometryAudit(),camera:g.getCamera(),
     viewport:[document.documentElement.clientWidth,document.documentElement.clientHeight],
     scrollWidth:document.documentElement.scrollWidth,
     webglError:canvas.getContext('webgl')?.getError()??null};
   });
   await info.attach(label+'-'+viewport.width,{body:await page.screenshot(),
    contentType:'image/png'});
   await info.attach(label+'-audit-'+viewport.width,{body:Buffer.from(
    JSON.stringify({commit:process.env.GITHUB_SHA||'local',
     physicalGpuFps:'NOT MEASURED',independentCritics:'NOT PROVEN',
     ...state},null,2)),contentType:'application/json'});
   expect(state.canopy.rootLocationsUnchanged).toBe(true);
   expect(state.canopy.noAdditionalTriangles).toBe(true);
   expect(state.canopy.seededStems).toBe(668);
   expect(state.canopy.matureLeafReachMetres).toBeGreaterThan(.25);
   expect(state.canopy.matureEarHalfWidthMetres).toBeGreaterThan(.045);
   expect(state.field.seasonMatchesAuthority).toBe(true);
   expect(state.field.plantedStems).toBe(668);
   expect(state.webglError).toBe(0);
   expect(state.scene.lastFrameTriangles).toBeGreaterThan(0);
   // This is the real VIEW submission gate; complete-source triangles remain
   // reported separately and must never be silently represented as FPS.
   expect(state.scene.lastFrameTriangles).toBeLessThan(160000);
   if(viewport.width===390)expect(state.scrollWidth).toBeLessThanOrEqual(390);
   return state;
  }
  const initial=await picture('genuine-Day1-field');
  for(let remaining=120*24*30;remaining>0;remaining-=7200)
   await page.evaluate(n=>{
    const g=window.__tinyKingdom;
    for(let i=0;i<n;i++)g.step(1/30)
   },Math.min(7200,remaining));
  const grown=await picture('genuine-Day121-field');
  expect(grown.day).toBeGreaterThanOrEqual(120);
  expect(grown.people).toBeGreaterThanOrEqual(initial.people);
  expect(grown.buildings).toBeGreaterThan(initial.buildings);
  expect(errors).toEqual([]);
  await info.attach('w518-actual-world-summary-'+viewport.width,{
   body:Buffer.from(JSON.stringify({sourceSha:process.env.GITHUB_SHA||'local',
    initial:{checksum:initial.checksum,day:initial.day,
     submitted:initial.scene.lastFrameTriangles,
     sourceTriangles:initial.integrity.totalTriangles},
    grown:{checksum:grown.checksum,day:grown.day,
     submitted:grown.scene.lastFrameTriangles,
     sourceTriangles:grown.integrity.totalTriangles},
    errorCount:errors.length,hardwareDevice:'NOT TESTED',
    transformationVsG088:'NOT PROVEN'},null,2)),
   contentType:'application/json'});
 });
}