'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const HTML=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');

test('W357 the original connected street mesh grades ONLY authentic walkable corridor shoulders within its 160k safety-floor sub-budget',()=>{
 const start=HTML.indexOf('const REAL_HOME_ROADSIDE_MAX_TRIANGLES=840;');
 const end=HTML.indexOf('function renderRealInhabitedLaneNetwork(){',start);
 expect(start).toBeGreaterThan(-1);
 expect(end).toBeGreaterThan(start);
 const data=[],blocked=[];
 const ctx={
  data,REAL_HOME_LANE_BUDGET:3600,MATERIAL:{ROAD:3},
  rgb:x=>[(x>>16&255)/255,(x>>8&255)/255,(x&255)/255],
  terrain:(x,z)=>.007*x+.003*z,
  walkable:(x,z)=>Math.abs(x)<90&&Math.abs(z)<90&&!(z>4.35&&z<4.72),
  materialScope:(_id,fn)=>fn(),
  upwardRoadQuad:(a,b,c,d,color)=>{
   expect([...a,...b,...c,...d,...color].every(Number.isFinite)).toBe(true);
   data.push(...new Array(60).fill(0));
  }
 };
 vm.runInNewContext(HTML.slice(start,end),ctx);
 const road=Array.from({length:530},(_,i)=>({
  a:[0,i*.10],b:[1,i*.10],halfWidth:i%2?.42:.99,homeIndex:i%17
 }));
 const audit={triangles:2150};
 const before=audit.triangles;
 ctx.renderAuthenticInhabitedRoadShoulders(road,audit);
 expect(audit.shoulderTriangles).toBe(data.length/30);
 expect(audit.shoulderTriangles).toBe(audit.shoulderSections*2);
 expect(audit.shoulderTriangles).toBeGreaterThan(0);
 expect(audit.shoulderTriangles).toBeLessThanOrEqual(840);
 expect(audit.triangles).toBe(before+audit.shoulderTriangles);
 expect(audit.triangles).toBeLessThanOrEqual(3600);
 expect(audit.shoulderRejected).toBeGreaterThan(0);
 expect(audit.shoulderSections).toBeLessThan(road.length*2);
 // An almost-full genuine existing road keeps its entire authoritative
 // centreline and receives no gratuitous terrain-cost overrun.
 const full={triangles:3599};
 const used=data.length;
 ctx.renderAuthenticInhabitedRoadShoulders(road,full);
 expect(full.shoulderTriangles).toBe(0);
 expect(data.length).toBe(used);
 expect(full.triangles).toBe(3599);
});

for(const viewport of [{width:1024,height:640},{width:390,height:844}]){
 test('W357 actual grown-ready 3D occupied-home streets remain under budget and retain truthful world '+viewport.width+'px',async({page})=>{
  test.setTimeout(240000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.setContent(HTML);
  await page.waitForFunction(()=>window.__tinyKingdom?.renderStats()?.lastFrameTriangles>90000,null,{timeout:110000});
  const observed=await page.evaluate(()=>{
   const g=window.__tinyKingdom,original=JSON.stringify(g.exportSnapshot());
   const streets=g.getRealHomeLaneNetworkAudit(),mesh=g.getGeometryAudit(),marketCamera=g.getMarketTransitionCameraAudit();
   return {streets,marketCamera,triangles:mesh.totalTriangles,
    unchanged:JSON.stringify(g.exportSnapshot())===original,
    gl:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
  expect(observed.marketCamera.maxSurveysPerFrame).toBe(2);
  expect(observed.marketCamera.authorityModified).toBe(false);
  expect(observed.marketCamera.actorsHidden).toBe(0);
  expect(observed.streets.shoulderTriangles).toBeGreaterThanOrEqual(0);
  expect(observed.streets.shoulderTriangles).toBe(observed.streets.shoulderSections*2);
  expect(observed.streets.shoulderTriangles).toBeLessThanOrEqual(840);
  expect(observed.streets.triangles).toBeLessThanOrEqual(3600);
  expect(observed.triangles).toBeLessThan(160000);
  expect(observed.unchanged).toBe(true);
  expect(observed.gl).toBe(0);
  expect(observed.overflow).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
  fs.mkdirSync('artifacts/tiny-kingdom-w357',{recursive:true});
  await page.screenshot({path:'artifacts/tiny-kingdom-w357/real-lived-roadside-'+viewport.width+'.png'});
 });
}

test('W359 REAL credited-market camera repairs only a blocked transitional eye to a separately certified physical lens',()=>{
 const from=HTML.indexOf('const MARKET_WITNESS_MAX_SURVEYS_PER_FRAME=2;');
 const to=HTML.indexOf('function marketReceiptLensKey(id){',from);
 expect(from).toBeGreaterThan(-1);
 expect(to).toBeGreaterThan(from);
 const ctx={
  physicalFollowEyeClearance:eye=>({clear:eye[0]!==-9}),
  followRayBlockers:eye=>eye[0]===-8?1:0,
  marketCourierPostSightline:eye=>({centerCover:eye[0]===-5?.45:.01}),
  foregroundVegetationProjection:eye=>({
   faceBlockers:eye[0]===-4?1:0,cover:eye[0]===-3?.49:.01}),
  foregroundSceneProjection:eye=>({
   cover:eye[0]===-7?.72:.01,cargoCover:eye[0]===-6?.51:.01})
 };
 vm.runInNewContext(HTML.slice(from,to),ctx);
 const realLens={aim:[0,1,11],eye:[0,3,5]};
 const kept=ctx.planPhysicalMarketWitnessRepair([0,3,5],realLens,[]);
 expect(kept.repair).toBe(false);expect(kept.probes).toBe(1);
 for(const x of [-9,-8,-7,-6,-5,-4,-3]){
  const recovery=ctx.planPhysicalMarketWitnessRepair([x,3,5],realLens,[]);
  expect(recovery.repair).toBe(true);
  expect(recovery.current.clear).toBe(false);
  expect(recovery.goal.clear).toBe(true);
  expect(recovery.probes).toBe(2);
 }
 // A goal now physically blocked by genuine changing scenery MUST NOT
 // be certified or cause a snap through an inhabited solid roof.
 const invalidGoal={...realLens,eye:[-9,3,5]};
 const fallback=ctx.planPhysicalMarketWitnessRepair([-7,3,5],invalidGoal,[]);
 expect(fallback.repair).toBe(false);
 expect(fallback.goal.clear).toBe(false);
 const audit=ctx.getMarketTransitionCameraAudit();
 expect(audit.maxSurveysPerFrame).toBe(2);
 expect(audit.worldGeometryRemoved).toBe(false);
 expect(audit.authorityModified).toBe(false);
 expect(audit.actorsHidden).toBe(0);
});
