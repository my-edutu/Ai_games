'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W173: a low-FPS spectator can miss every frame of a real swinging door.
// True authoritative rest must still give the observer a PHYSICAL exterior
// view of that resident's actually CLOSED door. Never script an actor/arrival.
for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W173 authentic closed cottage and current physical cart lens '+viewport.width,async({page})=>{
  test.setTimeout(220000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>0,
   null,{timeout:110000});
  const proof=await page.evaluate(()=>{
   const g=window.__tinyKingdom;g.setSpeed(0);
   let closed=null;
   // Observe the genuine deterministic world; do NOT use fake citizens,
   // scripted doors, altered saved data or rendering test hooks.
   for(let i=0;i<24*30*3;i++){
    g.step(1/30);
    if(i%3)continue;
    closed=g.getCottageHomecomingAudit().closedDoors.find(door=>
     door.activity==='Resting at home'&&door.swing===0);
    if(closed)break;
   }
   if(!closed)return {closed:null};
   const snapshot=JSON.stringify(g.exportSnapshot());
   let view=null;
   for(let i=0;i<g.metrics().citizens+1;i++){
    view=g.watchHomecoming();
    if(view?.citizen===closed.citizen)break;
   }
   return {closed,view,readOnly:snapshot===JSON.stringify(g.exportSnapshot()),
    camera:g.getHomecomingThresholdCameraAudit(),
    street:g.getStreetPhysicalOcclusionAudit(),
    ray:g.getCameraRayBroadphaseAudit()};
  });
  expect(proof.closed,'Actual seeded resident must rest in a closed home').not.toBeNull();
  expect(proof.view?.citizen).toBe(proof.closed.citizen);
  expect(proof.readOnly).toBe(true);
  expect(proof.camera.active,'A real closed door merits a physical camera even when its earlier swing was not filmed').toBe(true);
  expect(proof.camera.phase).toBe('resting-at-real-home');
  expect(proof.camera.camera.viewedSubject).toBe('authentic-closed-oak-door');
  expect(proof.camera.camera.physicalReadability).toBe(true);
  expect(proof.camera.camera.outsideDoor).toBe(true);
  expect(proof.camera.camera.doorRayBlockers).toBe(0);
  expect(proof.camera.door.homeIndex).toBe(proof.closed.homeIndex);
  expect(proof.street.cartPositionsExact).toBe(true);
  // The actual 3D view used bounded ray candidates while retaining every
  // original physical roof, cart, citizen sightline and authoritative state.
  expect(proof.ray.source).toBe('exact-physical-camera-ray-cell-broadphase');
  expect(proof.ray.authorityChanged).toBe(false);
  expect(proof.ray.droppedVolumes).toBe(0);
  expect(proof.ray.maxCellReferences).toBeLessThanOrEqual(4096);
  expect(proof.ray.indexedQueries).toBeGreaterThan(0);
  expect(proof.street.realHomes).toBeGreaterThanOrEqual(12);
  await page.waitForFunction(()=>window.__tinyKingdom.getHomecomingThresholdCameraAudit().active,
   null,{timeout:45000});
  const after=await page.evaluate(()=>({
   audit:window.__tinyKingdom.getHomecomingThresholdCameraAudit(),
   triangles:window.__tinyKingdom.renderStats().lastFrameTriangles,
   gl:document.getElementById('world').getContext('webgl')?.getError(),
   overflow:document.documentElement.scrollWidth-innerWidth
  }));
  expect(after.audit.phase).toBe('resting-at-real-home');
  expect(after.triangles).toBeLessThan(160000);
  expect(after.gl).toBe(0);
  expect(after.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w173',{recursive:true});
  fs.writeFileSync('artifacts/tiny-kingdom-w173/'+viewport.width+'-true-rest.json',
   JSON.stringify({viewport,proof,after},null,2));
  await page.screenshot({path:'artifacts/tiny-kingdom-w173/'+viewport.width+'-real-closed-door.png'});
 });
}
