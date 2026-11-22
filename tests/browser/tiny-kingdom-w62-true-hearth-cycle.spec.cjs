'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// The inhabitants, not a coordinate hash, authorize smoke. Record both
// actual night occupation and the morning return to work on the rendered game.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W62 authentic inhabited-hearth cycle '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,null,{timeout:110000});
  const night=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let households=[];
   for(let n=0;n<24*30*3;n++){
    g.step(1/30);
    households=g.getOccupiedHouseholds();
    if(households.length>0 && g.skyStats) {
     // The renderer's own source of truth is genuine household occupation.
     if(households.length>=3)break;
    }
   }
   return {households,source:JSON.stringify(g.exportSnapshot())};
  });
  expect(night.households.length).toBeGreaterThan(0);
  await page.waitForFunction(()=>{
   const g=window.__tinyKingdom,a=g.getHearthSmokeAudit();
   return a?.source==='real-nighttime-households'&&
    a.visibleHomes>0&&g.getCottageEffects().activeChimneys===a.visibleHomes;
  },null,{timeout:90000});
  const witness=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const before=JSON.stringify(g.exportSnapshot());
   const audit=g.getHearthSmokeAudit(),occupied=g.getOccupiedHouseholds();
   return {audit,occupied,before,after:JSON.stringify(g.exportSnapshot()),
    effect:g.getCottageEffects(),triangles:g.renderStats().lastFrameTriangles,
    overflow:document.documentElement.scrollWidth-innerWidth,
    glError:document.getElementById('world').getContext('webgl')?.getError()};
  });
  const actual=new Set(witness.occupied.map(h=>h.homeIndex));
  expect(witness.audit.homeIndices.length).toBe(witness.audit.visibleHomes);
  expect(witness.audit.visibleHomes).toBeLessThanOrEqual(14);
  expect(witness.audit.homeIndices.every(i=>actual.has(i))).toBe(true);
  expect(new Set(witness.audit.homeIndices).size).toBe(witness.audit.homeIndices.length);
  expect(witness.audit.visibleHomes).toBe(witness.effect.activeChimneys);
  expect(witness.audit.smokePuffs).toBe(witness.effect.smokePuffs);
  expect(witness.before).toBe(witness.after);
  expect(witness.triangles).toBeLessThan(160000);
  expect(witness.overflow).toBeLessThanOrEqual(0);
  expect(witness.glError).toBe(0);
  fs.mkdirSync('artifacts/tiny-kingdom-w62',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w62/'+viewport.width+'-authentic-night-hearths.png'});
  await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   for(let n=0;n<24*30*2;n++){
    g.step(1/30);
    if(g.getOccupiedHouseholds().length===0)break;
   }
  });
  await page.waitForFunction(()=>{
   const g=window.__tinyKingdom;
   return g.getOccupiedHouseholds().length===0&&
    g.getHearthSmokeAudit().visibleHomes===0&&
    g.getCottageEffects().activeChimneys===0;
  },null,{timeout:90000});
  expect(errors).toEqual([]);
 });
}
