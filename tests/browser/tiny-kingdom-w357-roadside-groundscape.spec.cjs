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
   const streets=g.getRealHomeLaneNetworkAudit(),mesh=g.getGeometryAudit();
   return {streets,triangles:mesh.totalTriangles,
    unchanged:JSON.stringify(g.exportSnapshot())===original,
    gl:document.querySelector('#world').getContext('webgl')?.getError(),
    overflow:document.documentElement.scrollWidth-innerWidth};
  });
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
