'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W78 RED contract: a real 13th+ house must only dirty its inhabited GPU
// cluster, not regenerate the independent, unchanged civic/seasonal settlement.
// The real authoritative 120-day world is never replaced by hand-built
// screenshot houses. Test both desktop and 390px software-WebGL-forced partition.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W78 growing homes leave original civic street resident at '+viewport.width+'px',
  async({page})=>{
   test.setTimeout(300000);
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setViewportSize(viewport);await page.setContent(html);
   await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
    null,{timeout:110000});
   const initial=await page.evaluate(()=>{
    const g=window.__tinyKingdom;g.setSpeed(0);
    g.setHomePartitionOverride(true);
    return JSON.stringify(g.exportSnapshot());
   });
   await page.waitForFunction(()=>window.__tinyKingdom.getHomePartitionAudit().enabled&&
    window.__tinyKingdom.getHomePartitionAudit().activeHomes>0,null,{timeout:100000});

   // Render after every physical 12-day chunk so a real construction's
   // independent cache invalidation is observed, not hidden in a big sim jump.
   const stages=[];
   for(let block=0;block<10;block++){
    await page.evaluate(()=>{
     const g=window.__tinyKingdom;
     for(let i=0;i<12*24*30;i++)g.step(1/30);
    });
    await page.waitForFunction(last=>window.__tinyKingdom.metrics().day>=last,
     (block+1)*12,{timeout:110000});
    await page.waitForFunction(()=>window.__tinyKingdom.getStationarySettlementAudit()
     .activeSceneKey===window.__tinyKingdom.renderStats().scenicMeshKey,
     null,{timeout:100000});
    stages.push(await page.evaluate(()=>{
     const g=window.__tinyKingdom;
     return {day:g.metrics().day,homes:g.getVillageVisualLod().homes,
      civic:g.getCivicSceneryCacheStats().activeKey,
      stationary:g.getStationarySettlementAudit(),
      partition:g.getHomePartitionAudit(),
      scene:g.renderStats(),triangles:g.getGeometryAudit().totalTriangles};
    }));
   }
   const check=await page.evaluate(()=>{
    const g=window.__tinyKingdom;
    return {snapshot:JSON.stringify(g.exportSnapshot()),people:g.metrics().citizens,
     homes:g.getVillageVisualLod().homes,partition:g.getHomePartitionAudit(),
     audit:g.getStationarySettlementAudit(),geometry:g.getGeometryAudit(),
     gl:document.getElementById('world').getContext('webgl')?.getError(),
     overflow:document.documentElement.scrollWidth-innerWidth};
   });
   expect(check.snapshot).not.toBe(initial);
   expect(check.homes).toBeGreaterThan(12);
   expect(check.partition.activeHomes).toBe(check.homes);
   expect(check.partition.staleDrawn).toBe(0);
   expect(check.audit.growthClusterRefreshes).toBeGreaterThan(0);
   expect(check.audit.avoidedTownRebuilds).toBeGreaterThan(0);
   expect(check.audit.civicInvariantKey).toBeTruthy();
   expect(check.people).toBeGreaterThan(0);
   expect(check.geometry.totalTriangles).toBeLessThan(160000);
   expect(check.geometry.static.invalidComponents).toBe(0);
   expect(check.geometry.dynamic.invalidComponents).toBe(0);
   expect(check.gl).toBe(0);expect(check.overflow).toBeLessThanOrEqual(0);
   expect(errors).toEqual([]);
   const saved=stages.some((later,i)=>i>0&&later.homes>stages[i-1].homes&&
     later.homes>12&&later.civic===stages[i-1].civic&&
     later.stationary.activeSceneKey===stages[i-1].stationary.activeSceneKey);
   // Sparse 12-day samples may straddle a genuine season switch. Stronger:
   // verify the real, same-scene growing-home VBO invalidation witness.
   const witnessed=(check.audit.growthWitnesses||[]).some(w=>
    w.newHomes>w.oldHomes&&w.newHomes>12&&w.activeHomes===w.newHomes&&
    w.civicUnchanged&&w.stationaryUnchanged&&w.staleDrawn===0);
   expect(saved||witnessed).toBe(true);
   fs.mkdirSync('artifacts/tiny-kingdom-w78',{recursive:true});
   fs.writeFileSync('artifacts/tiny-kingdom-w78/'+viewport.width+'-real-growth.json',
    JSON.stringify({viewport,stages,final:check.audit},null,2));
   await page.screenshot({path:'artifacts/tiny-kingdom-w78/'+viewport.width+'-grown-scene.png'});
  });
}
