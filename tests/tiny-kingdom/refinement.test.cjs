'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {launch,open}=require('./browser-harness.cjs');
let browser;
before(async()=>{browser=await launch()});
after(async()=>{await browser?.close()});
async function run(fn){const {page,errors}=await open(browser);try{const result=await page.evaluate(fn);assert.deepEqual(errors,[]);return result}finally{await page.close()}}
test('arrival displays work and resets travel time before earning the work reward',async()=>{
 const result=await run(()=>{
  const g=window.__tinyKingdom,p=window.__tkInspection.citizens()[0];
  p.target=[p.x,p.z];p.path=[[p.x,p.z]];p.workTimer=20;p.energy=90;p.hunger=0;p.activity='Traveling to farmer work';
  g.step(1/30);const arrival={activity:p.activity,timer:p.workTimer,x:p.x,z:p.z,energy:p.energy};
  for(let i=0;i<60;i++)g.step(1/30);
  return {arrival,still:{activity:p.activity,x:p.x,z:p.z,energy:p.energy},rig:g.getRigPose(0)};
 });
 assert.match(result.arrival.activity,/Harvesting/);assert.ok(result.arrival.timer<.04);
 assert.equal(result.still.x,result.arrival.x);assert.equal(result.still.z,result.arrival.z);assert.equal(result.still.energy,result.arrival.energy);
 assert.equal(result.rig.working,true);assert.equal(result.rig.traveling,false);
});
test('resting and route-blocked citizens have planted feet at every phase',async()=>{
 const poses=await run(()=>{
  const p=window.__tkInspection.citizens()[0];p.path=[];p.target=[p.x,p.z];
  return ['Resting in the village','Waiting for a safe route'].flatMap(activity=>[0,.4,1.2,4.5].map(phase=>{p.activity=activity;p.phase=phase;return window.__tinyKingdom.getRigPose(0)}));
 });
 for(const pose of poses){assert.equal(pose.traveling,false);assert.equal(pose.working,false);for(const leg of pose.legs){assert.ok(Math.abs(leg.ankle[2])<1e-10);assert.equal(leg.lift,0)}}
});
test('all six professions have equipment anchored exactly to animated wrists',async()=>{
 const samples=await run(()=>{
  const i=window.__tkInspection,p=i.citizens()[0],actions=['Harvesting grain','Cutting timber','Constructing cottages','Bartering at market','Making household goods','Foraging the hillside'];
  return ['farmer','forester','builder','merchant','craftsperson','gatherer'].flatMap((job,j)=>[0,.3,.9,1.7,3.2].map(phase=>{p.job=job;p.activity=actions[j];p.phase=phase;p.path=[];p.target=[p.x,p.z];return {job,rig:i.pose(p),equipment:i.equipment(p)}}));
 });
 const types=new Set();for(const sample of samples){assert.ok(sample.equipment,`${sample.job} equipment missing`);types.add(sample.equipment.kind);assert.deepEqual(sample.equipment.grip,sample.rig.arms[sample.equipment.hand].wrist);assert.ok(sample.equipment.tip.every(Number.isFinite))}
 assert.equal(types.size,6);for(let i=0;i<samples.length;i+=5)assert.notDeepEqual(samples[i].equipment.grip,samples[i+1].equipment.grip);
});
test('cottage gables face outward and every ceramic roof tile faces upward',async()=>{
 const result=await run(()=>{
  const d=window.__tkInspection.captureHouse(),base=window.__tkInspection.ground(0,0),front=-1.05-.18,back=1.05+.18,gables=[],roof=[];
  for(let i=0;i<d.length;i+=30){const ys=[d[i+1],d[i+11],d[i+21]],zs=[d[i+2],d[i+12],d[i+22]];
   if(d[i+9]===7)roof.push(d[i+4]);
   if(Math.min(...ys)>base+1.89&&Math.max(...ys)>base+3.14&&Math.max(...ys)-Math.min(...ys)>1.2){for(const side of [-1,1])if(zs.every(z=>Math.abs(z-(side<0?front:back))<1e-6))gables.push({side,normal:d[i+5]})}
  }return {gables,roof};
 });
 assert.equal(result.gables.length,2);for(const face of result.gables)assert.ok(face.side*face.normal>.99);
 assert.ok(result.roof.length>100);for(const y of result.roof)assert.ok(y>0);
});
test('pose and equipment inspection cannot mutate saved state or the seeded random stream',async()=>{
 assert.equal(await run(()=>{const g=window.__tinyKingdom,i=window.__tkInspection,before=JSON.stringify(g.exportSnapshot());for(const p of i.citizens()){i.pose(p);i.equipment(p)}i.captureHouse();return before===JSON.stringify(g.exportSnapshot())}),true);
});
test('new work behavior is versioned and compatible legacy snapshots migrate deliberately',async()=>{
 const result=await run(()=>{
  const g=window.__tinyKingdom,s=g.exportSnapshot();s.algorithm='seeded-v1';const p=s.payload.people[0];p.target=[p.x,p.z];p.path=[];p.workTimer=20;p.activity='Traveling to farmer work';
  s.checksum=window.__tkInspection.checksum(s.payload);g.restoreSnapshot(s);const migrated=g.exportSnapshot();g.step(1/30);
  return {algorithm:migrated.algorithm,timer:migrated.payload.people[0].workTimer,activity:g.getCitizenProfiles()[0].activity};
 });assert.equal(result.algorithm,'seeded-work-v2');assert.equal(result.timer,0);assert.match(result.activity,/Harvesting/);
});
test('an in-progress work cycle restores and replays byte-identically',async()=>{
 assert.equal(await run(()=>{
  const g=window.__tinyKingdom,p=window.__tkInspection.citizens()[0];p.target=[p.x,p.z];p.path=[[p.x,p.z]];p.workTimer=12;p.energy=90;p.hunger=0;
  g.step(1/30);for(let i=0;i<30;i++)g.step(1/30);const save=g.exportSnapshot();for(let i=0;i<24*30;i++)g.step(1/30);const expected=JSON.stringify(g.exportSnapshot());
  g.restoreSnapshot(save);for(let i=0;i<24*30;i++)g.step(1/30);return JSON.stringify(g.exportSnapshot())===expected;
 }),true);
});
test('a work reward occurs once after a full stationary work interval, never while route-blocked',async()=>{
 const result=await run(()=>{
  const g=window.__tinyKingdom,i=window.__tkInspection,p=i.citizens()[0],s=i.world();for(const c of i.citizens()){c.activity='Waiting for a safe route';c.workTimer=0}
  p.target=[p.x,p.z];p.path=[[p.x,p.z]];p.job='forester';p.energy=90;p.hunger=0;p.workTimer=99;p.activity='Traveling to forester work';
  const before=s.wood;g.step(1/30);for(let n=0;n<74;n++)g.step(1/30);const waiting=s.wood;for(let n=0;n<2;n++)g.step(1/30);const completed=s.wood;
  p.activity='Waiting for a safe route';p.path=[];p.target=[p.x,p.z];p.workTimer=2.6;const blockedBefore=s.wood;g.step(1/30);
  return {before,waiting,completed,blockedBefore,blockedAfter:s.wood};
 });assert.equal(result.waiting,result.before);assert.ok(Math.abs(result.completed-result.before-2.1)<1e-8);assert.equal(result.blockedAfter,result.blockedBefore);
});
test('damaged and unknown-version snapshots are rejected without altering the live world',async()=>{
 assert.deepEqual(await run(()=>{
  const g=window.__tinyKingdom,before=JSON.stringify(g.exportSnapshot()),results=[];
  for(const algorithm of ['seeded-v3','seeded-v1']){const save=g.exportSnapshot();save.algorithm=algorithm;if(algorithm==='seeded-v1')save.payload.people[0].energy=10000;save.checksum=window.__tkInspection.checksum(save.payload);try{g.restoreSnapshot(save);results.push(false)}catch{results.push(before===JSON.stringify(g.exportSnapshot()))}}return results;
 }),[true,true]);
});
test('all profession meshes are finite and rendering them cannot mutate the civilization',async()=>{
 assert.deepEqual(await run(()=>{
  const g=window.__tinyKingdom,i=window.__tkInspection,before=JSON.stringify(g.exportSnapshot());const valid=i.citizens().every((p,n)=>{const mesh=i.captureCitizen(n);return mesh.length>0&&mesh.length%30===0&&mesh.every(Number.isFinite)});return {valid,unchanged:before===JSON.stringify(g.exportSnapshot())};
 }),{valid:true,unchanged:true});
});
test('90 simulated days retain food, housing, route safety and social growth',async()=>{
 const result=await run(()=>{const g=window.__tinyKingdom;for(let n=0;n<90*24*30;n++)g.step(1/30);return {metrics:g.metrics(),safe:g.getNavigation().every(p=>g.walkable(p.position)),snapshot:g.exportSnapshot().algorithm}});
 assert.equal(result.metrics.day,91);assert.ok(result.metrics.citizens>12);assert.ok(result.metrics.buildings>14);assert.ok(result.metrics.food>result.metrics.citizens*2);
 assert.ok(result.metrics.wood>=0);assert.ok(result.metrics.gold>0);assert.ok(result.metrics.relationships>0);assert.equal(result.safe,true);assert.equal(result.snapshot,'seeded-work-v2');console.log('90-day evidence:',JSON.stringify(result));
});
