'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

// W30 Living Valley: the real courier/worker walk should show boots contacting
// the earth rather than two continually sliding limbs. Phase is advanced by
// actual physically travelled world distance; no spectator animation advances
// any resource, citizen, work timer or navigation route.
for(const viewport of [{width:1024,height:640},{width:390,height:844}])
test('W30 authentic moving citizens plant boots in world space at '+viewport.width+'px',
 async({page})=>{
  test.setTimeout(180000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize(viewport);
  await page.setContent(html);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats().lastFrameTriangles>0,
   null,{timeout:90000});
  const sample=await page.evaluate(()=>{
   const g=window.__tinyKingdom;
   g.reset();g.setSpeed(0);
   const records=[],prior=new Map(),travellers=new Set();
   let stanceFrames=0,swingFrames=0;
   let maxStanceSlip=0,maxSwingLift=0,minStanceSole=Infinity,maxStanceSole=-Infinity;
   for(let frame=0;frame<150;frame++){
    const snapshot=g.exportSnapshot(),citizens=snapshot.payload.people;
    for(let i=0;i<citizens.length;i++){
     const person=citizens[i];
     if(!/travel|explor|returning home at dusk/i.test(person.activity)||
        !person.path?.length)continue;
     travellers.add(person.name);
     const rig=g.getRigPose(i),next=person.path[0]||person.target;
     const facing=Math.atan2(next[0]-person.x,next[1]-person.z);
     const co=Math.cos(facing),si=Math.sin(facing);
     const size=.92+(i%5)*.045;
     for(let side=0;side<2;side++){
      const leg=rig.legs[side];
      const foot=[person.x+size*(co*leg.ankle[0]+si*leg.ankle[2]),
       person.z+size*(-si*leg.ankle[0]+co*leg.ankle[2])];
      const key=person.name+':'+side,old=prior.get(key);
      if(leg.contact==='stance'){
       stanceFrames++;
       // Heel-box starts 0.045 local units below the ankle. The sole must
       // meet the actual sampled terrain at the active forward-facing foot.
       const sole=leg.ankle[1]-leg.groundOffset-.045;
       minStanceSole=Math.min(minStanceSole,sole);
       maxStanceSole=Math.max(maxStanceSole,sole);
      }else if(leg.contact==='swing'){
       swingFrames++;
       maxSwingLift=Math.max(maxSwingLift,leg.lift);
      }
      if(old&&old.contact==='stance'&&leg.contact==='stance'&&
         Math.abs(Math.atan2(Math.sin(facing-old.facing),
          Math.cos(facing-old.facing)))<.02){
       const moved=Math.hypot(person.x-old.actorX,person.z-old.actorZ);
       if(moved>.035&&moved<.18){
        const slip=Math.hypot(foot[0]-old.foot[0],foot[1]-old.foot[1]);
        maxStanceSlip=Math.max(maxStanceSlip,slip);
        records.push({citizen:person.name,moved,slip});
       }
      }
      prior.set(key,{contact:leg.contact,foot,actorX:person.x,
       actorZ:person.z,facing});
     }
    }
    g.step(1/30);
   }
   return {source:'real-travel-distance-to-world-boot-contact',viewport:innerWidth,
    travellers:[...travellers].sort(),stanceFrames,swingFrames,maxStanceSlip,
    maxSwingLift,minStanceSole,maxStanceSole,validPairs:records.length,
    worst:records.sort((a,b)=>b.slip-a.slip).slice(0,5),
    population:g.metrics().citizens,authority:g.exportSnapshot(),
    gl:document.querySelector('#world').getContext('webgl')?.getError()??-1,
    scrollWidth:document.documentElement.scrollWidth};
  });
  expect(sample.travellers.length).toBeGreaterThan(1);
  expect(sample.validPairs,JSON.stringify(sample.worst)).toBeGreaterThan(12);
  expect(sample.stanceFrames).toBeGreaterThan(30);
  expect(sample.swingFrames).toBeGreaterThan(20);
  expect(sample.maxStanceSlip).toBeLessThan(.045);
  expect(sample.maxSwingLift).toBeGreaterThan(.085);
  expect(sample.minStanceSole).toBeGreaterThanOrEqual(-.001);
  expect(sample.maxStanceSole).toBeLessThan(.009);
  expect(sample.gl).toBe(0);
  expect(sample.scrollWidth).toBeLessThanOrEqual(viewport.width);
  expect(errors).toEqual([]);
 });
