'use strict';
// W126 real farm-to-market workday. No scripted NPCs, artificial stock,
// forced task state, scene-only labor, or patched simulation clocks.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W126 authentic harvest, forge, construction and escrowed courier '+viewport.width+'px',
  async({page},info)=>{
   test.setTimeout(300000);
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.setViewportSize(viewport);
   await page.setContent(html);
   await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
    null,{timeout:110000});
   const result=await page.evaluate(()=>{
    const g=window.__tinyKingdom;g.reset();g.setSpeed(0);
    const seen={preparing:false,cutting:false,gathering:false,tying:false,
     stoking:false,hammering:false,quenching:false,
     joining:false,raising:false,joineryOnly:false,hauling:false,unloading:false};
    let firstLoaded=null,firstReceipt=null,firstHarvest=null,firstBuilder=null,
     maxGrip=0,maxWorkContact=0,readOnly=true,wrongPhase=0;
    const phaseEvents=[];
    let inTransitId=null,lastStep=0;
    for(let i=0;i<46000;i++){
     g.step(1/30);
     if(i%7!==0)continue;
     const before=JSON.stringify(g.exportSnapshot());
     const audit=g.getAuthenticWorkdayAudit();
     const grips=g.getCourierCartGripAudit();
     const contacts=g.getWorkContactAudit();
     const harvest=g.getHarvestVisibilityAudit();
     const forge=g.getForgeCraftCycleAudit();
     const builders=g.getBuilderStageAudit();
     readOnly=readOnly&&before===JSON.stringify(g.exportSnapshot());
     for(const labor of audit.labor){
      if(labor.stage in seen)seen[labor.stage]=true;
      if(labor.stage==='cutting'&&!firstHarvest&&harvest.active)
       firstHarvest={citizen:labor.citizen,workTimer:labor.timerHours,
        progress:labor.progress,foodAtInspection:audit.resources.food};
     }
     for(const row of contacts){
      maxWorkContact=Math.max(maxWorkContact,row.targetError||0);
     }
     for(const row of grips){
      seen.hauling=true;
      maxGrip=Math.max(maxGrip,...row.gaps);
      if(!firstLoaded){
       const load=g.getActiveDeliveries().find(d=>d.id===row.id);
       firstLoaded={id:row.id,citizen:row.citizen,resource:row.resource,
        amount:row.amount,escrowed:load?.escrowed,stage:load?.stage,
        fingerGaps:row.gaps,actualNavigation:row.feetFollowRoute};
       inTransitId=row.id;
       phaseEvents.push({clock:audit.time,stage:'hauling',id:row.id});
      }
     }
     for(const row of forge.workers){
      if(row.phase in seen)seen[row.phase]=true;
      const actor=audit.labor.find(w=>w.citizen===row.citizen);
      if(actor&&actor.stage!==row.phase)wrongPhase++;
     }
     for(const b of builders){
      if(b.construction?.canBuild&&!firstBuilder)
       firstBuilder={citizen:b.citizen,site:b.construction.site,
        cost:b.construction.costWood,eligible:true,progress:b.progress};
     }
     if(inTransitId){
      const active=g.getActiveDeliveries().find(d=>d.id===inTransitId);
      if(active?.stage==='unloading'){
       seen.unloading=true;
       if(!phaseEvents.some(e=>e.stage==='unloading'))
        phaseEvents.push({clock:audit.time,stage:'unloading',id:inTransitId});
      }
      const receipt=g.getDeliveryReceipts().find(r=>r.id===inTransitId);
      if(receipt&&!firstReceipt){
       firstReceipt={...receipt};
       phaseEvents.push({clock:audit.time,stage:'received',id:inTransitId});
      }
     }
     lastStep=i;
     if(firstHarvest&&firstLoaded&&firstReceipt&&
       seen.cutting&&seen.gathering&&seen.stoking&&seen.hammering&&
       seen.quenching&&seen.joining)break;
    }
    const validWorld=g.exportSnapshot(),saved=g.exportSnapshot();
    for(let i=0;i<330;i++)g.step(1/30);
    const replayA=JSON.stringify(g.exportSnapshot());
    g.restoreSnapshot(saved);
    for(let i=0;i<330;i++)g.step(1/30);
    const replayB=JSON.stringify(g.exportSnapshot());
    return {seen,readOnly,firstLoaded,firstReceipt,firstHarvest,
     firstBuilder,phaseEvents,maxGrip,maxWorkContact,wrongPhase,
     replayIdentical:replayA===replayB,initialPeople:validWorld.payload.people.length,
     finalPeople:g.metrics().citizens,day:g.metrics().day,
     triangles:g.renderStats().lastFrameTriangles,lastStep,
     overflow:document.documentElement.scrollWidth-innerWidth,
     glError:document.getElementById('world').getContext('webgl')?.getError()};
   });
   expect(result.readOnly).toBe(true);
   expect(result.replayIdentical).toBe(true);
   expect(result.seen.cutting).toBe(true);
   expect(result.seen.gathering).toBe(true);
   expect(result.seen.stoking).toBe(true);
   expect(result.seen.hammering).toBe(true);
   expect(result.seen.quenching).toBe(true);
   expect(result.wrongPhase).toBe(0);
   expect(result.firstHarvest).toBeTruthy();
   expect(result.firstLoaded).toBeTruthy();
   expect(result.firstLoaded.escrowed).toBe(true);
   expect(result.firstLoaded.actualNavigation).toBe(true);
   expect(result.maxGrip).toBeLessThan(.06);
   expect(result.firstReceipt?.creditedAtUnloading).toBe(true);
   expect(result.firstReceipt?.amount).toBe(result.firstLoaded.amount);
   expect(result.firstReceipt?.id).toBe(result.firstLoaded.id);
   expect(result.firstBuilder?.eligible||result.seen.joineryOnly).toBe(true);
   expect(result.finalPeople).toBe(result.initialPeople);
   expect(result.triangles).toBeLessThan(160000);
   expect(result.glError).toBe(0);
   expect(result.overflow).toBeLessThanOrEqual(0);
   expect(errors).toEqual([]);
   console.log('W126 original-worker actual shift',JSON.stringify(result));
   await info.attach('W126-original-workday-evidence-'+viewport.width,
    {body:await page.screenshot(),contentType:'image/png'});
 });
}
