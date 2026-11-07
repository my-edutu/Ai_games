'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W21 living-workday coherence: the REAL candidate judged by the workday
// director must be the camera actually shown, not a second rear-facing solve.
// The photograph cannot change the authoritative settlement, remove a
// citizen/structure or fictionalize work. Desktop and 390px are independent.
for(const portrait of [false,true]){
 test('W21 chosen physical work front is the displayed camera '+(portrait?'390px':'desktop'),async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(portrait?{width:390,height:844}:{width:1024,height:640});
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,null,{timeout:90000});
  const seedProof=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.reset();
   const first=g.exportSnapshot();g.reset();
   const second=g.exportSnapshot();g.setSpeed(0);
   return {same:JSON.stringify(first)===JSON.stringify(second),
    seed:first.payload.seed,firstChecksum:first.checksum,secondChecksum:second.checksum};
  });
  expect(seedProof.same,'A camera-only presentation must start from one exact reproducible G088 seed').toBe(true);
  expect(seedProof.firstChecksum).toBe(seedProof.secondChecksum);
  // The previous RED execution sampled 07:00 when the real citizens were
  // commuting: zero active worksite agents. Photograph an actual Day-121
  // midday working shift, preserving every authentic navigation step.
  for(let remaining=120*24*30+5*30;remaining>0;remaining-=7200)
   await page.evaluate(n=>{for(let i=0;i<n;i++)window.__tinyKingdom.step(1/30)},Math.min(remaining,7200));
  const story=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   const original=JSON.stringify(g.exportSnapshot());
   const workers=g.getActiveWorksites().map(w=>w.citizen);
   const selected=g.watchLiveWorkday();
   const director=g.getLiveWorkDirectorStats();
   const camera=g.getCamera(),shot=g.getWorkdayCompositionAudit(),
    plan=g.getCitizenCameraPlan();
   return {workers,selected,director,camera,shot,plan,
    unchanged:JSON.stringify(g.exportSnapshot())===original,
    rendered:g.renderStats().lastFrameTriangles,
    viewport:document.documentElement.scrollWidth,
    gl:document.getElementById('world').getContext('webgl')?.getError()??-1};
  });
  expect(story.unchanged).toBe(true);
  expect(story.workers).toContain(story.selected?.citizen);
  expect(story.director.selection?.honestWork).toBe(true);
  expect(story.camera.follow).toBe(true);
  expect(story.shot.actor).toBe(story.selected.citizen);
  expect(story.plan?.yaw).toBeCloseTo(story.camera.yaw,5);
  // The director has already spent a bounded raycast budget confirming the
  // actual work-facing view; never throw it away for a newly rear-facing
  // camera when the same worker is selected in the same frame.
  if(story.director.selection?.visibleFront){
   expect(story.shot.faceAlignment).toBeGreaterThan(.12);
   expect(story.shot.faceAlignment).toBeCloseTo(story.director.selection.faceAlignment,3);
   expect(story.plan?.workFacingMode).not.toBe('obstructed');
  }
  expect(story.viewport).toBeLessThanOrEqual(portrait?390:1024);
  expect(story.gl).toBe(0);expect(errors).toEqual([]);
 });
}
