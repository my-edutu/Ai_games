'use strict';
/* W368: actual original real-time interface and WebGL documentary probe.
 * Accelerates only the genuine fixed-step world to discover an ACTUAL job.
 * Never assigns citizens, delivers inventory, forces successes or stages actors.
 * The video is a real browser recording, not a continuous 30fps workday film.
 */
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {test,expect}=require('@playwright/test');
const html=fs.readFileSync(path.resolve('public/tiny-kingdom/index.html'),'utf8');
const output=path.resolve('artifacts/tiny-kingdom-w368-authentic-watch');
fs.mkdirSync(output,{recursive:true});
test.use({video:'on'});
const source=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
for(const profile of [
 {name:'desktop',viewport:{width:1024,height:640}},
 {name:'mobile-390',viewport:{width:390,height:844}}
]){
 test('W368 '+profile.name+' original one-click grain documentary stays truthful and visible',async({page})=>{
  test.setTimeout(180000);
  await page.setViewportSize(profile.viewport);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(html,{waitUntil:'load'});
  await page.waitForFunction(()=>window.__tinyKingdom?.metrics().citizens>=12&&
   window.__tinyKingdom?.renderStats().lastFrameTriangles>0,{timeout:120000});
  expect(await page.evaluate(()=>window.__tinyKingdom.renderer())).toBe('webgl');
  await page.evaluate(()=>window.__tinyKingdom.setSpeed(0));
  const before=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   let found=false,advanced=0;
   for(let batch=0;batch<960;batch++){ // maximum 40 genuine simulated days
    const farmer=g.getCitizenProfiles().some(p=>p.job==='farmer'&&
     p.activity==='Harvesting grain');
    const loaded=g.getActiveDeliveries().some(p=>p.job==='farmer'&&
     p.resource==='food');
    if(farmer||loaded){found=true;break}
    for(let i=0;i<30;i++)g.step(1/30);
    advanced+=30;
   }
   const physical=g.getActiveDeliveries().filter(p=>p.job==='farmer'&&
    p.resource==='food');
   return {found,advanced,physical,
    beforeChecksum:g.exportSnapshot().checksum,
    day:g.metrics().day};
  });
  expect(before.found,'No authentic farmer was active within 40 days').toBe(true);
  await page.waitForTimeout(500);
  const btn=page.locator('#world-watch-life');
  const rect=await btn.boundingBox();
  expect(rect,'primary real documentary action is invisible').not.toBeNull();
  if(profile.viewport.width===390)expect(rect.height).toBeGreaterThanOrEqual(44);
  await btn.click();
  const after=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   return {audit:g.getRealGrainJourneyAudit(),
    selected:g.getSelectedCitizen(),
    composition:g.getWorkdayCompositionAudit(),
    physicalLens:g.getCitizenCameraPlan(),
    checksum:g.exportSnapshot().checksum,
    watchText:document.getElementById('world-watch-life').textContent,
    supplyOpen:!document.getElementById('world-supply-trail').hidden,
    proof:g.getGrainProofStripAudit(),
    compactProofVisible:!document.getElementById('grain-live-strip').hidden&&
     getComputedStyle(document.getElementById('grain-live-strip')).display!=='none',
    overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)};
  });
  expect(after.audit.active,'The camera did not enter the real grain documentary').toBe(true);
  expect(after.audit.source).toBe('real-grain-provenance-only');
  // Before W370, a REAL watched harvesting farmer fell through to generic
  // Follow: pitch .76, zoom 12.8, no physical crop/IK witness. Only assert
  // the grounded workday lens when the genuine chosen producer is harvesting.
  if(after.audit.stage==='harvesting'&&after.composition?.active){
   expect(after.physicalLens?.zoom,
    'The authentic harvested-grain witness reverted to remote generic Follow')
    .toBeLessThan(10);
   expect(after.physicalLens?.projectedWorkerHeightFraction,
    'The camera no longer frames the genuine working citizen')
    .toBeGreaterThan(.15);
  }
  expect(after.checksum,'A spectator click changed authoritative simulation').toBe(before.beforeChecksum);
  expect(after.overflow).toBe(0);
  // W423: the original film exposes the genuine parcel in a COMPACT
  // five-stage stage strip on BOTH viewports; the full source ledger is
  // always opt-in to keep real 3D citizens unobstructed. The older desktop
  // auto-expansion assertion contradicted W403 voluntary evidence design.
  expect(after.supplyOpen,
   'Unrequested full ledger must never cover the actual farmer at either viewport')
   .toBe(false);
  expect(after.compactProofVisible,
   'The original visible real-parcel proof should replace the old caption')
   .toBe(true);
  expect(after.proof.visible).toBe(true);
  expect(after.proof.producer).toBe(after.audit.producer);
  expect(after.proof.steps.length).toBe(5);
  expect(after.proof.changesAuthority).toBe(false);
  await page.waitForTimeout(1200);
  await page.screenshot({path:path.join(output,profile.name+'-real-grain-follow.png')});
  const second=await page.evaluate(()=>window.__tinyKingdom.getRealGrainJourneyAudit());
  // During the live farmer documentary the original ribbon is intentionally
  // hidden to keep the field/citizen visible. A second physical Playwright
  // click cannot target that invisible control. Exercise the original event
  // handler for repeat-dispatch idempotence without claiming a user tap.
  await page.evaluate(()=>document.getElementById('world-watch-life').click());
  const still=await page.evaluate(()=>({
   grain:window.__tinyKingdom.getRealGrainJourneyAudit(),
   checksum:window.__tinyKingdom.exportSnapshot().checksum
  }));
  expect(second.active).toBe(true);
  expect(still.grain.active,'Second one-click must not discard a real parcel').toBe(true);
  expect(still.checksum).toBe(before.beforeChecksum);
  expect(errors).toEqual([]);
  fs.writeFileSync(path.join(output,profile.name+'-metadata.json'),
   JSON.stringify({source,pinnedBaseline:'2f6deb43feb1a1557848d44def53a6109deb1ab1',
    renderer:'Chromium WebGL SwiftShader — not hardware FPS',
    evidenceKind:'genuine accelerated simulation plus original input/camera',
    before,after,second,still,errors},null,2)+'\n');
 });
}
