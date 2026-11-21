'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W63: real members of the autonomous village visibly wear a physical
// draped garment. No duplicate citizens, work events or resources may exist.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W63 all actual citizens have animated cloth silhouettes '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>{
   const g=window.__tinyKingdom;
   if(!g?.getVillageClothAudit)return false;
   const a=g.getVillageClothAudit();
   return g.renderStats().lastFrameTriangles>0 &&
    a.totalResidents===g.metrics().citizens;
  },null,{timeout:110000});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const witness=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const before=JSON.stringify(g.exportSnapshot());
   const audit=g.getVillageClothAudit(),people=g.getCitizenProfiles();
   const after=JSON.stringify(g.exportSnapshot());
   return {audit,people:people.length,before,after,triangles:g.renderStats().lastFrameTriangles,
    glError:document.getElementById('world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(witness.audit.source).toBe('real-citizens-draped-wool-and-work-linen');
  expect(witness.audit.totalResidents).toBe(witness.people);
  expect(witness.audit.compactResidents+witness.audit.detailedResidents).toBe(witness.people);
  expect(witness.audit.compactHemPanels).toBe(witness.audit.compactResidents*8);
  expect(witness.audit.workAprons).toBeGreaterThan(0);
  expect(witness.audit.geometryTriangles).toBeGreaterThan(0);
  expect(witness.audit.roles.every(job=>witness.audit.authoritativeJobs.includes(job))).toBe(true);
  expect(witness.audit.usesSimulationRandomness).toBe(false);
  expect(witness.before).toBe(witness.after);
  expect(witness.triangles).toBeLessThan(160000);
  expect(witness.glError).toBe(0);
  expect(witness.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w63',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w63/'+viewport.width+'-real-villager-wool.png'});
 });
}
