'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
test.use({video:'on'});
// Same committed REAL world, same seed, same camera and eight genuine
// fixed-step updates. Capture original combined GPU stream and new independent
// authentic worker stream without fabricating actors, jobs or deliveries.
// These are software CPU/driver wall samples, NOT physical hardware FPS.
for(const width of [1024,390]){
 test('W505 actual-world moving CPU/driver stream and saved replay parity '+width,
 async({page})=>{
  test.setTimeout(540000);
  const dir=path.resolve(__dirname,'../../artifacts/tiny-kingdom-w505');
  fs.mkdirSync(dir,{recursive:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
   null,{timeout:180000});
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const seed=await page.evaluate(()=>window.__tinyKingdom.exportSnapshot());
  const rows=[];
  for(const split of [false,true]){
   const prev=await page.evaluate(({seed,split})=>{
    const g=window.__tinyKingdom;
    g.restoreSnapshot(seed);g.setSpeed(0);g.setActorStreamSplitForTesting(split);
    return g.getFrameProfile().totalFrames;
   },{seed,split});
   await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
    prev,{timeout:180000});
   const stages=[];
   for(let frame=0;frame<8;frame++){
    const prior=await page.evaluate(()=>window.__tinyKingdom.getFrameProfile().totalFrames);
    await page.evaluate(()=>window.__tinyKingdom.step(1/30));
    await page.waitForFunction(n=>window.__tinyKingdom.getFrameProfile().totalFrames>n,
      prior,{timeout:180000});
    const row=await page.evaluate(()=>{
      const g=window.__tinyKingdom,profile=g.getFrameProfile(),
       stream=g.getActorResidencyAudit(),coverage=g.getActorPresentationCoverageAudit();
      return {
       frame:g.renderStats().lastFrameTriangles,scene:profile.scene,
       actualStage:profile.latest,actors:stream.actorFloats,
       world:stream.worldFloats,split:stream.enabled,
       allocationFallbacks:stream.softwareActorSplitAllocationFailures,
       sameBodyCoverage:coverage.exactlyOneBodyPathPerCitizen,
       unrendered:coverage.missingNames,
       snap:g.exportSnapshot().checksum,people:g.metrics().citizens,
       overflow:document.documentElement.scrollWidth-innerWidth,
       gl:document.getElementById('world').getContext('webgl').getError()
      };
    });
    expect(row.people).toBeGreaterThan(0);
    expect(row.sameBodyCoverage).toBe(true);
    expect(row.unrendered).toEqual([]);
    expect(row.gl).toBe(0);
    expect(row.overflow).toBeLessThanOrEqual(0);
    expect(row.frame).toBeGreaterThan(0);
    expect(row.frame).toBeLessThan(160000);
    if(split)expect(row.split).toBe(true);
    stages.push(row);
    if(frame===3)await page.screenshot({path:path.join(dir,width+'-'+(split?'split':'combined')+'-real-worker.png')});
   }
   rows.push({split,stages,final:await page.evaluate(()=>window.__tinyKingdom.exportSnapshot())});
  }
  expect(rows[1].final.checksum).toBe(rows[0].final.checksum);
  expect(rows[1].final.payload.people).toEqual(rows[0].final.payload.people);
  for(let i=0;i<8;i++){
   expect(rows[1].stages[i].snap).toEqual(rows[0].stages[i].snap);
   expect(rows[1].stages[i].frame).toEqual(rows[0].stages[i].frame);
  }
  expect(errors).toEqual([]);
  fs.writeFileSync(path.join(dir,width+'-actual-software-stream-pair.json'),
   JSON.stringify({exactSource:process.env.GITHUB_SHA||'local',width,
    baseline:'original-combined-software-actor-world-vbo',
    candidate:'original-independent-software-actor-world-vbo',
    comparedEightIdenticalSavedWorldFixedTicks:true,
    rows,errors,actualPhysicalGpuFps:'NOT MEASURED',
    independentBlindedReviewer:'NOT PROVEN',experiencePass:'NOT PROVEN'},null,2));
  const vid=page.video();await page.close();
  if(vid)await vid.saveAs(path.join(dir,width+'-authentic-world-stream-comparison.webm'));
 });
}
